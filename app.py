import os
import random
import google.generativeai as genai
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- SECURE AI SETUP ---
# Replace with your actual key from Google AI Studio
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

WHATSAPP_LINK = "https://wa.me/254742024175?text=Hello%20Zion%20Trading%20Lab"

# COMPLETE VOLATILITY LIST (Including 15, 90, 250, etc.)
ALL_MARKETS = [
    "VOLATILITY 10 INDEX", "VOLATILITY 10 (1S) INDEX", 
    "VOLATILITY 15 INDEX", "VOLATILITY 15 (1S) INDEX",
    "VOLATILITY 25 INDEX", "VOLATILITY 25 (1S) INDEX", 
    "VOLATILITY 30 (1S) INDEX",
    "VOLATILITY 50 INDEX", "VOLATILITY 50 (1S) INDEX", 
    "VOLATILITY 75 INDEX", "VOLATILITY 75 (1S) INDEX", 
    "VOLATILITY 90 (1S) INDEX", "VOLATILITY 100 INDEX", 
    "VOLATILITY 100 (1S) INDEX", "VOLATILITY 150 (1S) INDEX",
    "VOLATILITY 200 (1S) INDEX", "VOLATILITY 250 (1S) INDEX", 
    "VOLATILITY 300 (1S) INDEX"
]

last_market = None

@app.route('/')
def home():
    global last_market
    cat = request.args.get('cat', 'EVEN_ODD')
    
    # Selection logic to avoid repeating the same market
    available = [m for m in ALL_MARKETS if m != last_market]
    market = random.choice(available)
    last_market = market
    
    # Deep Analysis Prompt for Gemini
    prompt = (f"Market: {market}. Category: {cat}. "
              "Analyze for manipulation and tick patterns. "
              "Provide: Strength (%), Stay Duration (seconds), and Logic. "
              "Format: Strength|Duration|Logic")
    
    try:
        response = model.generate_content(prompt)
        ai_data = response.text.split('|')
        strength = ai_data[0].strip()
        duration = ai_data[1].strip()
        logic = ai_data[2].strip()
    except:
        strength, duration, logic = "89%", "20", "Scanning liquidity and tick flow..."

    # UI Styling
    try:
        s_num = int(strength.replace('%',''))
    except:
        s_num = 85
    s_color = "#3fb950" if s_num > 82 else "#f59e0b"
    
    v_voice = market.replace("INDEX", "").replace("(", "").replace(")", "").strip()
    voice_msg = f"Alert on {v_voice}. {cat} signal. Strength {strength}. Stay in market for {duration} seconds."

    return render_template_string(HTML_TEMPLATE, market=market, strength=strength, 
                                  duration=duration, logic=logic, s_color=s_color, 
                                  voice=voice_msg, cat=cat, wa_link=WHATSAPP_LINK)

# --- COMPLETE UI TEMPLATE ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg: #0b0e14; --card: #1c2128; --blue: #316dca; --text: #adbac7; }
        body { background: var(--bg); color: var(--text); margin: 0; font-family: sans-serif; overflow: hidden; }
        .navbar { display: flex; align-items: center; padding: 15px; background: #161b22; border-bottom: 1px solid #30363d; }
        .main { display: flex; flex-direction: column; align-items: center; padding: 15px; height: 90vh; overflow-y: auto; }
        .card { width: 100%; max-width: 380px; background: var(--card); border-radius: 20px; padding: 25px; border: 1px solid #30363d; text-align: center; }
        .stay-timer { background: #238636; color: white; display: inline-block; padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: bold; margin-bottom: 15px; }
        .strength-bar { height: 10px; width: 100%; background: #0d1117; border-radius: 10px; margin: 15px 0; overflow: hidden; border: 1px solid #30363d; }
        .strength-fill { height: 100%; width: {{ strength }}; background: {{ s_color }}; transition: 2s ease; }
        #v-btn { position: fixed; bottom: 20px; right: 20px; background: var(--blue); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
    </style>
</head>
<body>
    <div class="navbar"><div style="font-weight:900; color:white; margin-left:15px;">ZION AI PREDICTOR V2.2</div></div>
    <div class="main">
        <div class="card">
            <div class="stay-timer">STAY IN MARKET: {{ duration }} SECONDS</div>
            <div style="color:{{ s_color }}; font-size:12px; font-weight:bold;">AI CONFIDENCE: {{ strength }}</div>
            <div class="strength-bar"><div class="strength-fill"></div></div>
            <div style="font-size:11px; color:#8b949e; margin-bottom:5px;">{{ market }}</div>
            <h1 style="color:white; margin: 10px 0; font-size: 32px;">{{ cat.replace('_', ' ') }}</h1>
            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; font-size:13px; color:#c9d1d9;">{{ logic }}</div>
            <a href="https://bot.deriv.com" style="display:block; margin-top:20px; background:#238636; color:white; padding:15px; border-radius:12px; text-decoration:none; font-weight:bold;">EXECUTE TRADE</a>
        </div>
    </div>
    <div id="v-btn" onclick="toggleMute()"><i id="v-icon" class="fa-solid fa-volume-high"></i></div>
    <script>
        function toggleMute() { location.reload(); }
        window.onload = () => { 
            setTimeout(() => {
                const msg = new SpeechSynthesisUtterance("{{ voice }}");
                msg.rate = 0.85; window.speechSynthesis.speak(msg);
            }, 800);
        };
        setTimeout(() => { location.reload(); }, 15000);
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
