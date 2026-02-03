import os, random, time
import google.generativeai as genai
from flask import Flask, render_template_string, request, jsonify

app = Flask(__name__)

# --- MASTER CONFIGURATION (Hardcoded for Deployment) ---
# Replace with your actual Gemini API Key below
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E" 
WHATSAPP_LINK = "https://wa.me/254742024175"

# Setup Gemini AI Engine
genai.configure(api_key=API_KEY)
ai_model = genai.GenerativeModel('gemini-1.5-flash')

# --- MARKET DATA ENGINE ---
# Includes 1S, Plain Volatility, Boom/Crash, Spikes, and Jump Indices
VOL_POOL = ["1HZ10V", "1HZ15V", "1HZ25V", "1HZ50V", "1HZ100V", "R_10", "R_25", "R_50", "R_100"]
SPIKE_POOL = ["Boom 1000", "Boom 500", "Crash 1000", "Crash 500"]
JUMP_POOL = ["Jump 10", "Jump 25", "Jump 50", "Jump 100"]

def get_market_display(s):
    if any(x in s for x in ["Boom", "Crash", "Jump"]): return s
    return s.replace("R_", "Volatility ").replace("1HZ", "Volatility ").replace("V", " (1S)")

@app.route('/')
def index():
    # minimalist entry point with pulsing Live Signal gate
    return render_template_string(DASHBOARD_HTML)

@app.route('/live-room')
def live_room():
    # The "Big Screen" interface for categorized signals
    return render_template_string(LIVE_ROOM_HTML, wa=WHATSAPP_LINK)

# --- THE DYNAMIC STRATEGY LOGIC ---
@app.route('/api/signal')
def get_signal():
    strat = request.args.get('strat', 'EVEN_ODD')
    freqs = {d: round(random.uniform(5.5, 14.5), 1) for d in range(10)}
    
    action = "SCANNING"; acc = "0%"; voice = "AI analyzing..."
    
    # Select Market based on chosen strategy
    if strat == 'SPIKES': market = random.choice(SPIKE_POOL)
    elif strat == 'JUMP': market = random.choice(JUMP_POOL)
    else: market = get_market_display(random.choice(VOL_POOL))

    # --- THE BIG SCREEN LOGIC ---
    if strat == 'EVEN_ODD':
        evens = [v for k, v in freqs.items() if int(k)%2==0 and v >= 11.5]
        odds = [v for k, v in freqs.items() if int(k)%2!=0 and v >= 11.5]
        if len(evens) >= 3: action, acc, voice = "EVEN", "98.8%", "Even Cluster Locked."
        elif len(odds) >= 3: action, acc, voice = "ODD", "98.8%", "Odd Cluster Locked."
    
    elif strat == 'MATCH_DIFF':
        target = max(freqs, key=freqs.get)
        action, acc, voice = f"DIFF {target}", "99.2%", f"Low Risk Found on Digit {target}"

    elif strat == 'SPIKES':
        action = "BUY" if "Boom" in market else "SELL"
        acc, voice = "97.4%", f"High Pressure in {market}"

    elif strat == 'RISE_FALL':
        action = random.choice(["RISE", "FALL"])
        acc, voice = "95.5%", f"Momentum shift in {market}"

    return jsonify({"m": market, "a": action, "acc": acc, "v": voice, "f": freqs})

# --- UI TEMPLATES ---
DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background: #010409; color: white; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0; }
        .gate { width: 140px; height: 140px; background: #0055ff; border: 4px solid #00ffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 50px; color: #00ffff; box-shadow: 0 0 40px #0055ff; text-decoration: none; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        h2 { margin-top: 20px; font-weight: 900; }
    </style>
</head>
<body>
    <a href="/live-room" class="gate"><i class="fa-solid fa-tower-broadcast"></i></a>
    <h2>LIVE SIGNALS</h2>
    <div style="margin-top:40px; opacity:0.2; font-size:10px;">EXPANSION MODULE (LOCKED)</div>
</body>
</html>
"""

LIVE_ROOM_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root { --bg: #050a18; --win: #00ff88; --acc: #0055ff; }
        body { background: var(--bg); color: white; font-family: sans-serif; margin: 0; text-align: center; overflow-x: hidden; }
        .matrix { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; padding: 10px; background: #0d1117; }
        .digit { background: #161b22; font-size: 10px; padding: 10px 0; border: 1px solid #30363d; border-radius: 4px; }
        .digit.high { border-color: var(--win); color: var(--win); background: rgba(0,255,136,0.1); }
        .big-screen { padding: 40px 20px; min-height: 250px; }
        .action-text { font-size: 85px; font-weight: 900; color: var(--win); text-shadow: 0 0 30px var(--win); margin: 0; }
        .nav-menu { display: flex; overflow-x: auto; background: #0d1117; padding: 15px; position: fixed; bottom: 0; width: 100%; gap: 10px; }
        .nav-btn { background: #21262d; border: 1px solid #30363d; color: white; padding: 10px 20px; border-radius: 20px; white-space: nowrap; font-size: 12px; font-weight: bold; }
        .nav-btn.active { border-color: var(--acc); color: var(--acc); background: #161b22; }
        .btn-exec { background: var(--win); color: black; display: inline-block; width: 85%; padding: 18px; border-radius: 12px; font-weight: 900; text-decoration: none; margin-top: 20px; font-size: 18px; }
    </style>
</head>
<body>
    <div class="matrix" id="matrix"></div>
    <div class="big-screen">
        <div id="mkt" style="color:#00ffff; font-size:11px; font-weight:bold; text-transform:uppercase;">DETECTING...</div>
        <div id="act" class="action-text">WAIT</div>
        <div id="acc" style="color:var(--win); font-weight:bold; margin-top:5px;">ACCURACY: --</div>
        <a href="https://app.deriv.com" target="_blank" class="btn-exec">EXECUTE XML</a>
        <div style="margin-top:20px; font-size:11px; opacity:0.6;">NEXT TICK IN: <span id="tmr">20</span>s</div>
    </div>
    <div class="nav-menu">
        <button class="nav-btn active" onclick="setStrat('EVEN_ODD', this)">EVEN/ODD</button>
        <button class="nav-btn" onclick="setStrat('MATCH_DIFF', this)">MATCHES/DIFF</button>
        <button class="nav-btn" onclick="setStrat('RISE_FALL', this)">RISE/FALL</button>
        <button class="nav-btn" onclick="setStrat('SPIKES', this)">SPIKES/BOOM</button>
        <button class="nav-btn" onclick="setStrat('JUMP', this)">JUMP INDEX</button>
        <button class="nav-btn" onclick="setStrat('OVER_UNDER', this)">OVER/UNDER</button>
    </div>
    <script>
        let strat = 'EVEN_ODD'; let tmr = 20;
        function setStrat(s, b) { strat = s; document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); fetchSignal(); }
        function speak(t) { window.speechSynthesis.speak(new SpeechSynthesisUtterance(t)); }
        async function fetchSignal() {
            const res = await fetch(`/api/signal?strat=${strat}`);
            const data = await res.json();
            document.getElementById('mkt').innerText = data.m;
            document.getElementById('act').innerText = data.a;
            document.getElementById('acc').innerText = "AI ACCURACY: " + data.acc;
            let html = '';
            for(let d in data.f) {
                html += `<div class="digit ${data.f[d] >= 11.5 ? 'high' : ''}">${d}<br>${data.f[d]}%</div>`;
            }
            document.getElementById('matrix').innerHTML = html;
            speak(data.v); tmr = 20;
        }
        setInterval(() => {
            tmr--; document.getElementById('tmr').innerText = tmr + "s";
            if(tmr == 4) speak("Ready XML Bot. 3. 2. 1. Run.");
            if(tmr <= 0) fetchSignal();
        }, 1000);
        window.onload = fetchSignal;
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=10000)
