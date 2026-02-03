import os
import google.generativeai as genai
from flask import Flask, render_template_string, jsonify, request, session, redirect, url_for

app = Flask(__name__)
app.secret_key = "ZYMOSTAR_ULTIMATE_2026"

# --- THE VAULT: ALL KEYS INTEGRATED ---
MASTER_PASSWORD = "#Zymostar130*"
MY_APP_ID = "124918"
MY_TOKEN = "ZcE6HJIVGZnapwd"
GEMINI_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
WHATSAPP_NUM = "254123456789" # <--- REPLACE WITH YOUR REAL NUMBER

# --- ENGINE SETUP ---
genai.configure(api_key=GEMINI_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

MARKETS = {
    "1HZ10V": "Vol 10 (1s)", "R_10": "Vol 10",
    "1HZ15V": "Vol 15 (1s)", "R_15": "Vol 15",
    "1HZ25V": "Vol 25 (1s)", "R_25": "Vol 25",
    "1HZ50V": "Vol 50 (1s)", "R_50": "Vol 50",
    "1HZ75V": "Vol 75 (1s)", "R_75": "Vol 75",
    "1HZ90V": "Vol 90 (1s)", "R_90": "Vol 90",
    "1HZ100V": "Vol 100 (1s)", "R_100": "Vol 100"
}

# --- THE MASTER UI ---
TERMINAL_UI = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --neon: #00ff88; --bg: #010409; --panel: #0d1117; }
        body { background: var(--bg); color: white; font-family: 'Segoe UI', sans-serif; margin: 0; }
        
        /* Floating WhatsApp Button */
        .wa-float { position: fixed; bottom: 20px; right: 20px; background: #25d366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 0 15px rgba(37, 211, 102, 0.5); z-index: 1000; text-decoration: none; }
        
        /* Control Panels */
        .risk-panel { background: var(--panel); display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px; border-bottom: 1px solid #30363d; }
        input { background: #010409; border: 1px solid #30363d; color: var(--neon); padding: 8px; border-radius: 5px; width: 80%; }
        
        .main-display { height: 50vh; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        #strike-btn { width: 90%; background: var(--neon); color: black; font-weight: 900; padding: 25px; border: none; border-radius: 15px; font-size: 24px; display: none; }
    </style>
</head>
<body>
    <div class="risk-panel">
        <div>STAKE <input type="number" id="stake" value="1"></div>
        <div>MULT (x) <input type="number" id="martingale" value="2.1"></div>
        <div>TP ($) <input type="number" id="tp" value="10"></div>
        <div>SL ($) <input type="number" id="sl" value="5"></div>
    </div>

    <div class="main-display">
        <h4 id="mkt-name" style="color:#58a6ff">HUNTING...</h4>
        <h1 id="signal-text" style="font-size: 60px;">WAIT</h1>
        <button id="strike-btn" onclick="trade()">YES - EXECUTE</button>
    </div>

    <a href="https://wa.me/{{ wa_num }}" class="wa-float" target="_blank">
        <i class="fab fa-whatsapp"></i>
    </a>

    <script>
        // Full Automation Script
        const mkts = {{ markets|tojson }};
        const token = "{{ token }}";
        let currentIndex = 0;

        function autoCycle() {
            const syms = Object.keys(mkts);
            setInterval(() => {
                let sym = syms[currentIndex];
                document.getElementById('mkt-name').innerText = "SCANNING: " + mkts[sym];
                
                // AI Core Simulation (95% Confidence)
                if(Math.random() > 0.9) {
                    document.getElementById('signal-text').innerText = "STRIKE";
                    document.getElementById('strike-btn').style.display = "block";
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Zymostar signal ready on " + mkts[sym]));
                }
                currentIndex = (currentIndex + 1) % syms.length;
            }, 4000);
        }
        autoCycle();
    </script>
</body>
</html>
"""

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST' and request.form.get('pw') == MASTER_PASSWORD:
        session['auth'] = True
        return redirect('/terminal')
    return render_template_string("...LOGIN_HTML...") # (Previous Login logic)

@app.route('/terminal')
def terminal():
    if not session.get('auth'): return redirect('/')
    return render_template_string(TERMINAL_UI, token=MY_TOKEN, markets=MARKETS, wa_num=WHATSAPP_NUM)

if __name__ == '__main__':
    app.run(debug=True)
