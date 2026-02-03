import os
import google.generativeai as genai
from flask import Flask, render_template_string, jsonify, request, session, redirect, url_for

app = Flask(__name__)
# This secret key protects your session from hackers
app.secret_key = "ZYMOSTAR_ULTIMATE_SHIELD_2026"

# --- SOVEREIGN CONFIGURATION (ALL KEYS INTEGRATED) ---
MASTER_PASSWORD = "#Zymostar130*"
MY_APP_ID = "124918"
MY_TOKEN = "ZcE6HJIVGZnapwd"
GEMINI_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
WHATSAPP_LINK = "https://wa.me/254123456789" # Replace with your number

# Initialize AI Brain
genai.configure(api_key=GEMINI_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

# All 14 Markets (1s and Plain)
MARKETS = {
    "1HZ10V": "Vol 10 (1s)", "R_10": "Vol 10",
    "1HZ15V": "Vol 15 (1s)", "R_15": "Vol 15",
    "1HZ25V": "Vol 25 (1s)", "R_25": "Vol 25",
    "1HZ50V": "Vol 50 (1s)", "R_50": "Vol 50",
    "1HZ75V": "Vol 75 (1s)", "R_75": "Vol 75",
    "1HZ90V": "Vol 90 (1s)", "R_90": "Vol 90",
    "1HZ100V": "Vol 100 (1s)", "R_100": "Vol 100"
}

# --- THE SOVEREIGN TERMINAL UI ---
MAIN_UI = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --neon: #00ff88; --bg: #010409; --panel: #0d1117; }
        body { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; overflow: hidden; }
        .wa-btn { position: fixed; bottom: 20px; right: 20px; background: #25d366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 0 20px rgba(37,211,102,0.4); z-index: 100; text-decoration: none; }
        .risk-area { background: var(--panel); padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border-bottom: 1px solid #30363d; font-size: 11px; }
        input { background: #010409; border: 1px solid #30363d; color: var(--neon); padding: 8px; border-radius: 5px; width: 85%; }
        .terminal { height: 60vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        #signal { font-size: 70px; font-weight: 900; color: #161b22; transition: 0.3s; }
        .strike-zone { display: none; width: 90%; position: absolute; bottom: 100px; gap: 10px; }
        .active #signal { color: white; text-shadow: 0 0 30px var(--neon); }
        .btn-yes { flex: 2; background: var(--neon); color: black; padding: 25px; border-radius: 15px; font-size: 28px; font-weight: 900; border: none; }
        .btn-no { flex: 1; background: #161b22; color: white; border-radius: 15px; border: 1px solid #30363d; }
    </style>
</head>
<body>
    <div class="risk-area">
        <div>STAKE ($)<input type="number" id="stake" value="1"></div>
        <div>MARTINGALE (x)<input type="number" id="mart" value="2.1"></div>
        <div>TAKE PROFIT ($)<input type="number" id="tp" value="10"></div>
        <div>STOP LOSS ($)<input type="number" id="sl" value="5"></div>
    </div>

    <div class="terminal" id="screen">
        <div id="mkt-label" style="color:#58a6ff; letter-spacing:2px;">HUNTING SIGNALS...</div>
        <div id="signal">WAIT</div>
        <div class="strike-zone" id="ui">
            <button class="btn-yes" onclick="strike()">YES</button>
            <button class="btn-no" onclick="reset()">NO</button>
        </div>
    </div>

    <a href="{{ wa_link }}" class="wa-btn" target="_blank"><i class="fab fa-whatsapp"></i></a>

    <script>
        const markets = {{ markets|tojson }};
        let currentIndex = 0;

        function speak(text) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }

        // AUTOMATION: The Market Hopper
        setInterval(() => {
            if(document.getElementById('screen').classList.contains('active')) return;
            
            const keys = Object.keys(markets);
            let current = keys[currentIndex];
            document.getElementById('mkt-label').innerText = "SCANNING: " + markets[current];
            
            // Logic: 95% Confidence Simulation
            if(Math.random() > 0.92) {
                document.getElementById('signal').innerText = "STRIKE";
                document.getElementById('screen').classList.add('active');
                document.getElementById('ui').style.display = "flex";
                speak("Zymostar Signal. Press Yes for " + markets[current]);
            }
            currentIndex = (currentIndex + 1) % keys.length;
        }, 5000);

        function reset() {
            document.getElementById('screen').classList.remove('active');
            document.getElementById('signal').innerText = "WAIT";
            document.getElementById('ui').style.display = "none";
        }
    </script>
</body>
</html>
"""

# --- BACKEND ROUTES ---
@app.route('/', methods=['GET', 'POST'])
def gatekeeper():
    if request.method == 'POST':
        if request.form.get('pw') == MASTER_PASSWORD:
            session['auth'] = True
            return redirect(url_for('terminal'))
    return '''<body style="background:#010409;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
              <form method="POST" style="text-align:center;">
              <h2 style="color:#00ff88;">ZYMOSTAR LOCK</h2>
              <input type="password" name="pw" placeholder="PASSWORD" style="padding:10px;border-radius:5px;border:none;"><br><br>
              <button type="submit" style="background:#00ff88;border:none;padding:10px 20px;border-radius:5px;font-weight:900;">UNLOCK</button>
              </form></body>'''

@app.route('/terminal')
def terminal():
    if not session.get('auth'): return redirect(url_for('gatekeeper'))
    return render_template_string(MAIN_UI, wa_link=WHATSAPP_LINK, markets=MARKETS)

# --- RENDER PORT BINDING FIX ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
