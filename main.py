import asyncio
import json
import time
from collections import deque
import google.generativeai as genai
from deriv_api import DerivAPI
import pyttsx3          
import threading        
import sys
import select           

# ──── ZION TRADING LAB: CREDENTIALS ────
APP_ID = "125403"
DEMO_TOKEN = "WBWszYYjBF72RMn"
REAL_TOKEN = "oWtetBf2Koc1NNA"
GEMINI_KEY = "AIzaSyDM7cXkbQwbuBX0ubb01IeI2WrFi80Eh2E"
WHATSAPP_LINK = "https://wa.me/254742024175"

USE_REAL = False
TOKEN = REAL_TOKEN if USE_REAL else DEMO_TOKEN
ENDPOINT = f"wss://ws.derivws.com/websockets/v3?app_id={APP_ID}"

# ──── ZION TRADING LAB: CONFIG ────
ENABLE_DIGIT_SIGNALS = True     
DEFAULT_BARRIER = 5             

# ──── ZION TRADING LAB: AI SETUP ────
genai.configure(api_key=GEMINI_KEY)
zion_ai_model = genai.GenerativeModel('gemini-1.5-flash')

tick_history = {}               
digit_history = {}              
MAX_HISTORY = 30

# ──── ZION TRADING LAB: VOICE ENGINE ────
zion_voice = pyttsx3.init()
zion_voice.setProperty('rate', 150)    
zion_voice.setProperty('volume', 0.9)  

is_muted = False

def announce_signal(symbol, signal_type, signal, last_digit=None, price=None):
    if is_muted:
        return
    
    if symbol.startswith('1HZ'):
        sym_name = f"{symbol.replace('1HZ', 'Vol ').replace('V', ' one second')}"
    elif symbol.startswith('R_'):
        sym_name = f"Vol {symbol.replace('R_', '')}"
    else:
        sym_name = symbol
    
    base_text = f"Zion Lab Signal: {sym_name}. {signal_type} signal: {signal}."
    
    if last_digit is not None:
        base_text += f" Last digit: {last_digit}."
    if price is not None:
        base_text += f" Price: {price:.2f}."
    
    print(f"[ZION LAB] Announcing: {base_text}")
    zion_voice.say(base_text)
    zion_voice.runAndWait()

# ──── KEYBOARD LISTENER ────
def keyboard_listener():
    global is_muted
    print("\nZion Trading Lab Controls:")
    print("  m → Mute Lab Voice")
    print("  u → Unmute Lab Voice")
    print("  q → Quit Zion Lab\n")
    
    while True:
        if sys.platform.startswith('win'):
            import msvcrt
            if msvcrt.kbhit():
                key = msvcrt.getch().decode('utf-8').lower()
                handle_key(key)
        else:
            i, _, _ = select.select([sys.stdin], [], [], 0.1)
            if i:
                key = sys.stdin.read(1).lower()
                handle_key(key)
        time.sleep(0.2)

def handle_key(key):
    global is_muted
    if key == 'm':
        is_muted = True
        print("[ZION LAB] Voice: MUTED")
    elif key == 'u':
        is_muted = False
        print("[ZION LAB] Voice: UNMUTED")
    elif key == 'q':
        print("[ZION LAB] Shutting down...")
        sys.exit(0)

async def generate_rise_fall_signal(symbol, recent_ticks):
    if len(recent_ticks) < 8:
        return "HOLD"
    prices_str = ", ".join(f"{p:.5f}" for p in recent_ticks[-10:])
    prompt = f"Zion Trading Lab Analysis\nSymbol: {symbol}\nLast 10 ticks: {prices_str}\nAction: BUY, SELL or HOLD"
    try:
        response = await asyncio.to_thread(zion_ai_model.generate_content, prompt)
        signal = response.text.strip().upper()
        return signal if signal in ["BUY", "SELL", "HOLD"] else "HOLD"
    except:
        return "HOLD"

async def generate_even_odd_signal(symbol, recent_digits):
    if len(recent_digits) < 8:
        return "HOLD"
    digits_str = ", ".join(map(str, recent_digits[-12:]))
    prompt = f"Zion Trading Lab Parity Check\nSymbol: {symbol}\nLast 12 digits: {digits_str}\nAction: EVEN, ODD or HOLD"
    try:
        response = await asyncio.to_thread(zion_ai_model.generate_content, prompt)
        signal = response.text.strip().upper()
        return signal if signal in ["EVEN", "ODD", "HOLD"] else "HOLD"
    except:
        return "HOLD"

async def generate_over_under_signal(symbol, recent_digits, barrier=DEFAULT_BARRIER):
    if len(recent_digits) < 8:
        return "HOLD"
    digits_str = ", ".join(map(str, recent_digits[-12:]))
    prompt = f"Zion Trading Lab Pressure Check\nSymbol: {symbol}\nLast 12 digits: {digits_str}\nBarrier: {barrier}\nAction: OVER, UNDER or HOLD"
    try:
        response = await asyncio.to_thread(zion_ai_model.generate_content, prompt)
        signal = response.text.strip().upper()
        return signal if signal in ["OVER", "UNDER", "HOLD"] else "HOLD"
    except:
        return "HOLD"

# ──── REMOVED DEFAULT DIGIT 5: DYNAMIC SELECTION BASED ON SIGNAL STRENGTH ────
async def generate_matches_differs_signal(symbol, recent_digits):
    if len(recent_digits) < 8:
        return "HOLD", None
    digits_str = ", ".join(map(str, recent_digits[-12:]))
    prompt = f"""
    Zion Trading Lab Dynamic Digit Analysis
    Symbol: {symbol}
    Last 12 digits: {digits_str}
    Task: Identify the digit (0-9) with the strongest 'Matches' or 'Differs' pattern based on the current 'mouth'.
    Return ONLY in this format: SIGNAL,DIGIT (e.g., MATCHES,3 or DIFFERS,7)
    """
    try:
        response = await asyncio.to_thread(zion_ai_model.generate_content, prompt)
        res = response.text.strip().upper()
        if "," in res:
            signal, digit = res.split(",")
            return signal, digit
        return "HOLD", None
    except:
        return "HOLD", None

async def main():
    global tick_history, digit_history

    print("--- WELCOME TO ZION TRADING LAB ---")
    api = DerivAPI(endpoint=ENDPOINT)

    auth = await api.authorize({"authorize": TOKEN})
    if "error" in auth:
        print("[ZION LAB] Auth failed:", auth["error"]["message"])
        return
    print("[ZION LAB] Authorized! Login:", auth["authorize"].get("loginid"))

    # Monitoring Volatility (1s) Markets
    volatility_symbols = ["1HZ10V", "1HZ15V", "1HZ25V", "1HZ30V", "1HZ50V", "1HZ75V", "1HZ90V", "1HZ100V"]

    for sym in volatility_symbols:
        tick_history[sym] = deque(maxlen=MAX_HISTORY)
        digit_history[sym] = deque(maxlen=MAX_HISTORY)
        await api.send({"ticks": sym, "subscribe": 1})

    threading.Thread(target=keyboard_listener, daemon=True).start()

    while True:
        try:
            raw = await api.ws.recv()
            data = json.loads(raw)

            if "tick" in data:
                tick = data["tick"]
                symbol = tick.get("symbol")
                quote = tick.get("quote")
                if symbol in tick_history:
                    tick_history[symbol].append(quote)
                    last_digit = int(str(quote).split('.')[-1][-1]) if '.' in str(quote) else int(str(quote)[-1])
                    digit_history[symbol].append(last_digit)

                    if len(tick_history[symbol]) >= 10 and len(tick_history[symbol]) % 8 == 0:
                        ts = time.strftime("%H:%M:%S")
                        
                        rf_signal = await generate_rise_fall_signal(symbol, list(tick_history[symbol]))
                        print(f"[{ts}] {symbol:>12} | {quote:.5f} | Rise/Fall: {rf_signal}")
                        if rf_signal in ["BUY", "SELL"]:
                            threading.Thread(target=announce_signal, args=(symbol, "Rise Fall", rf_signal, None, quote), daemon=True).start()
                        
                        if ENABLE_DIGIT_SIGNALS:
                            digits = list(digit_history[symbol])
                            
                            eo_signal = await generate_even_odd_signal(symbol, digits)
                            if eo_signal in ["EVEN", "ODD"]:
                                threading.Thread(target=announce_signal, args=(symbol, "Even Odd", eo_signal, last_digit), daemon=True).start()
                            
                            ou_signal = await generate_over_under_signal(symbol, digits)
                            if ou_signal in ["OVER", "UNDER"]:
                                threading.Thread(target=announce_signal, args=(symbol, f"Over Under {DEFAULT_BARRIER}", ou_signal, last_digit), daemon=True).start()
                            
                            # Matches/Differs with Dynamic Digit Logic
                            md_signal, target_digit = await generate_matches_differs_signal(symbol, digits)
                            if md_signal in ["MATCHES", "DIFFERS"]:
                                print(f"          | Dynamic Digit Match: {md_signal} on Digit {target_digit}")
                                threading.Thread(target=announce_signal, args=(symbol, f"{md_signal} {target_digit}", md_signal, last_digit), daemon=True).start()

            elif "error" in data:
                print("[ZION LAB] API Error:", data["error"].get("message"))

        except Exception as e:
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
