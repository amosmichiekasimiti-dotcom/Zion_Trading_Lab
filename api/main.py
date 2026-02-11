import asyncio
import json
import time
import threading
import numpy as np
import google.generativeai as genai
from deriv_api import DerivAPI
from flask import Flask, render_template_string
from collections import deque
import pyttsx3
from scipy.stats import entropy

# ──── ZION TRADING LAB: CREDENTIALS (IMAGE 1 & 2) ────
APP_ID = "125403"
DEMO_TOKEN = "WBWszYYjBF72RMn"
REAL_TOKEN = "oWtetBf2Koc1NNA"
GEMINI_KEY = "AIzaSyDM7cXkbQwbuBX0ubb01IeI2WrFi80Eh2E"
WHATSAPP_LINK = "https://wa.me/254742024175"

# ──── AI & PHYSICS CONFIGURATION ────
genai.configure(api_key=GEMINI_KEY)
zion_ai = genai.GenerativeModel('gemini-1.5-flash')

# Targeting all Volatilities (Standard & 1s) from Image 3
TARGET_MARKETS =

market_data = {m: deque(maxlen=50) for m in TARGET_MARKETS}
digit_data = {m: deque(maxlen=100) for m in TARGET_MARKETS}
is_muted = False

# ──── AI VOICE ENGINE (HIGH VOICE SETUP) ────
voice_engine = pyttsx3.init()
voice_engine.setProperty('rate', 180)    # Faster rate for "high" feel
voice_engine.setProperty('volume', 1.0)
# Note: Pitch is OS-dependent; 'rate' is the primary control for the "high" energy voice

def lab_announce(text):
    if not is_muted:
        print(f" {text}")
        # Run speech in a separate thread to avoid WebSocket blocking
        threading.Thread(target=lambda: (voice_engine.say(text), voice_engine.runAndWait()), daemon=True).start()

# ──── THE HAMBURGER DASHBOARD (FLASK) ────
app = Flask(__name__)

@app.route('/')
def index():
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Zion Trading Lab</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: sans-serif; background: #0e0e0e; color: #00ff00; }
           .hamburger { font-size: 30px; cursor: pointer; padding: 15px; color: gold; }
           .status-box { border: 1px solid #333; padding: 20px; margin: 10px; border-radius: 8px; }
           .signal { color: #ff00ff; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="hamburger">☰ Zion Trading Lab</div>
        <div class="status-box">
            <h2>Live Signal Hub</h2>
            <p>Connection: <span id="conn">Establishing...</span></p>
            <p>Active Markets: Monitoring 1S & Standard Volatility</p>
            <div id="signals"></div>
        </div>
    </body>
    </html>
    """)

# ──── CORE PHYSICS & ENGINEERING LOGIC ────
def analyze_physics(prices, digits):
    """Calculates Momentum, Acceleration, and Entropy for accuracy"""
    prices_arr = np.array(prices)
    returns = np.diff(prices_arr)
    
    # 1. Newtonian Mechanics: Velocity and Acceleration [1, 2]
    velocity = returns[-1] if len(returns) > 0 else 0
    acceleration = np.diff(returns)[-1] if len(returns) > 1 else 0
    
    # 2. Shannon Entropy: Market Predictability [3]
    prob_dist = np.histogram(digits, bins=10, range=(0,10), density=True)
    m_entropy = entropy(prob_dist) if np.any(prob_dist) else 1.0
    
    # 3. Ising Magnetization: Alignment of Trend "Spins" [4, 5]
    spins = np.where(returns[-10:] > 0, 1, -1)
    magnetization = np.mean(spins)
    
    return velocity, acceleration, m_entropy, magnetization

async def get_high_accuracy_signal(symbol, prices, digits):
    v, a, h, m = analyze_physics(prices, digits)
    
    # Filter: Low Entropy = High Predictability [6]
    if h > 0.85: return None
    
    # The "Mouth" Dynamic Digit Strategy: Cluster Analysis
    # Identify the 'Hot Digit' based on signal strength, not fixed at 5
    counts = np.bincount(digits, minlength=10)
    hot_digit = np.argmax(counts)
    strength = (counts[hot_digit] / len(digits)) * 100

    prompt = f"""
    Zion Trading Lab | Symbol: {symbol}
    Physics: Vel={v:.6f}, Accel={a:.6f}, Entropy={h:.2f}, Mag={m:.2f}
    Mouth Pattern: Hot Digit {hot_digit} at {strength}% strength.
    
    Task: Generate signal for Rise/Fall, Even/Odd, Over/Under, Matches/Differs, or Accumulators.
    Logic: Ensure Payout >= 40%. Use Newtonian Force for direction.
    Return ONLY: TYPE|ACTION|ACCURACY% (e.g. RISE/FALL|BUY|92%)
    """
    try:
        response = await asyncio.to_thread(zion_ai.generate_content, prompt)
        res = response.text.strip().split('|')
        return res if len(res) == 3 else None
    except:
        return None

# ──── LIVE DATA WEBSOCKET (THE REEFLINK) ────
async def reef_engine():
    api = DerivAPI(endpoint=f"wss://ws.derivws.com/websockets/v3?app_id={APP_ID}")
    await api.authorize({"authorize": DEMO_TOKEN}) # Switch to REAL_TOKEN for live
    
    lab_announce("Zion Trading Lab Live Data Link Connected.")
    
    # Subscribe to all target volatilities
    for sym in TARGET_MARKETS:
        await api.subscribe({"ticks": sym})
        
    async for msg in api.ws:
        data = json.loads(msg)
        if "tick" in data:
            sym = data["tick"]["symbol"]
            price = data["tick"]["quote"]
            
            market_data[sym].append(price)
            # Extract last digit
            last_digit = int(str(price).split('.')[-1][-1]) if '.' in str(price) else int(str(price)[-1])
            digit_data[sym].append(last_digit)
            
            if len(market_data[sym]) >= 20:
                # Analyze every 5 ticks for physics-based stability
                if len(market_data[sym]) % 5 == 0:
                    signal = await get_high_accuracy_signal(sym, list(market_data[sym]), list(digit_data[sym]))
                    if signal:
                        sig_type, action, accuracy = signal
                        # Announce strictly Volatility, never volume
                        lab_announce(f"{sym} {sig_type} is {action}. Accuracy {accuracy}.")

# ──── EXECUTION ────
def run_flask():
    app.run(host='0.0.0.0', port=10000)

if __name__ == "__main__":
    # Start Hamburger Dashboard in background
    threading.Thread(target=run_flask, daemon=True).start()
    # Start Physics Engine
    asyncio.run(reef_engine())
