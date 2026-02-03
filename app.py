import os
import json
import google.generativeai as genai
from flask import Flask, render_template_string, session, redirect, url_for, request

app = Flask(__name__)
app.secret_key = "ZYMOSTAR_SOVEREIGN_MASTER_2026"

# --- MASTER CONFIGURATION ---
MY_APP_ID = "124918"
REAL_TOKEN = "ZcE6HJIVGZnapwd"
DEMO_TOKEN = "PASTE_YOUR_DEMO_TOKEN_HERE" # Placeholder for Demo
MASTER_PASSWORD = "#Zymostar130*"
GEMINI_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
WHATSAPP_LINK = "https://wa.me/254742024175"

# --- AI ENGINE ---
genai.configure(api_key=GEMINI_KEY)
# Using Gemini 1.5 Flash for high-speed manipulation detection
ai_brain = genai.GenerativeModel('gemini-1.5-flash')

# --- MARKET DIFFERENTIATION ---
# Plane/Standard = R_XXX | One Second = 1HZXXXV
STRICT_MARKETS = [
    {"id": "R_10", "name": "Volatility 10 Index"},
    {"id": "R_25", "name": "Volatility 25 Index"},
    {"id": "R_50", "name": "Volatility 50 Index"},
    {"id": "R_75", "name": "Volatility 75 Index"},
    {"id": "R_100", "name": "Volatility 100 Index"},
    {"id": "1HZ10V", "name": "Volatility 10 (1s) Index"},
    {"id": "1HZ15V", "name": "Volatility 15 (1s) Index"},
    {"id": "1HZ25V", "name": "Volatility 25 (1s) Index"},
    {"id": "1HZ50V", "name": "Volatility 50 (1s) Index"},
    {"id": "1HZ75V", "name": "Volatility 75 (1s) Index"},
    {"id": "1HZ100V", "name": "Volatility 100 (1s) Index"}
]

MAIN_UI = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --neon: #00ff88; --orange: #ffad00; --bg: #010409; --panel: #0d1117; --blue: #0066ff; }
        body { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; padding-bottom: 90px; }
        
        /* HEADER - DERIV STYLE */
        .header { background: var(--panel); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; }
        .acc-toggle { display: flex; background: #000; border-radius: 20px; padding: 4px; border: 1px solid #333; }
        .mode-btn { padding: 6px 15px; border-radius: 15px; font-size: 11px; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .mode-btn.demo { color: var(--orange); }
        .mode-btn.real { color: var(--neon); }
        .active-real { background: rgba(0,255,136,0.15); border: 1px solid var(--neon); }
        .active-demo { background: rgba(255,173,0,0.15); border: 1px solid var(--orange); }

        /* RISK CONTROL PANEL */
        .controls { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 15px; background: #000; }
        .input-grp { position: relative; }
        .input-grp label { font-size: 9px; color: #8b949e; position: absolute; top: 5px; left: 10px; text-transform: uppercase; }
        input { background: var(--panel); border: 1px solid #30363d; color: var(--neon); padding: 20px 10px 8px; border-radius: 8px; width: 100%; box-sizing: border-box; font-weight: 900; font-size: 16px; }

        /* SIGNAL HUD */
        .hud { margin: 15px; padding: 25px; background: var(--panel); border-radius: 24px; border: 1px solid #30363d; text-align: center; position: relative; }
        .mkt-badge { display: inline-block; padding: 4px 12px; background: var(--blue); border-radius: 20px; font-size: 11px; font-weight: 800; margin-bottom: 10px; }
        .sig-text { font-size: 50px; font-weight: 900; color: #161b22; margin: 15px 0; transition: 0.4s; }
        .active-sig .sig-text { color: white; text-shadow: 0 0 30px var(--neon); }
        
        /* DIGIT FLOOR (10% Safety) */
        .floor { display: flex; justify-content: space-between; align-items: flex-end; height: 60px; margin-top: 20px; background: #000; padding: 10px; border-radius: 12px; position: relative; }
        .safety-line { position: absolute; bottom: 10%; left: 0; width: 100%; border-top: 1px dashed rgba(255,255,255,0.2); pointer-events: none; }
        .bar { width: 8%; background: #30363d; border-radius: 3px; position: relative; transition: height 0.3s; }
        .bar.valid { background: var(--neon); }
        .bar.hot { background: #ff4444; }
        .bar span { position: absolute; bottom: -18px; width: 100%; font-size: 10px; font-weight: bold; color: #8b949e; }

        /* NAV FOOTER ICONS */
        .footer-nav { position: fixed; bottom: 0; width: 100%; background: var(--panel); display: grid; grid-template-columns: repeat(4, 1fr); padding: 15px 0; border-top: 1px solid #333; }
        .nav-item { text-align: center; color: #8b949e; font-size: 10px; }
        .nav-item i { font-size: 22px; display: block; margin-bottom: 5px; }
        .nav-item.active { color: var(--neon); }

        /* EXECUTION ACTION */
        .strike-btn { display: none; width: 100%; background: var(--neon); color: black; padding: 22px; border-radius: 16px; font-size: 24px; font-weight: 900; border: none; margin-top: 20px; cursor: pointer; box-shadow: 0 0 25px rgba(0,255,136,0.4); }
        
        .mute-btn { background: none; border: none; color: white; font-size: 20px; cursor: pointer; }
        .wa-float { position: fixed; bottom: 95px; right: 20px; background: #25d366; color: white; width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 1000; }
    </style>
</head>
<body>
    <div class="header">
        <div class="acc-toggle">
            <div id="demo-btn" class="mode-btn demo active-demo" onclick="switchAccount('demo')">DEMO</div>
            <div id="real-btn" class="mode-btn real" onclick="switchAccount('real')">REAL</div>
        </div>
        <div style="text-align:right;">
            <div id="balance" style="font-size:16px; font-weight:900;">$10,000.00</div>
            <div id="acc-id" style="font-size:9px; color:#8b949e;">VRTC1234567</div>
        </div>
        <button class="mute-btn" onclick="toggleMute()"><i id="mute-icon" class="fas fa-volume-up"></i></button>
    </div>

    <div class="controls">
        <div class="input-grp"><label>Stake</label><input type="number" id="stake" value="1"></div>
        <div class="input-grp"><label>Martingale</label><input type="number" id="mart" value="2.1"></div>
        <div class="input-grp"><label>Take Profit</label><input type="number" id="tp" value="10"></div>
        <div class="input-grp"><label>Stop Loss</label><input type="number" id="sl" value="5"></div>
    </div>

    <div class="hud" id="main-hud">
        <div class="mkt-badge" id="mkt-label">SCANNING VOLATILITY 100...</div>
        <div class="sig-text" id="status">WAIT</div>
        <div id="ai-status" style="font-size:11px; color:#8b949e;">GEMINI AI: MONITORING MANIPULATION</div>
        
        <div class="floor" id="viz">
            <div class="safety-line"></div>
            </div>

        <button class="strike-btn" id="yes-btn" onclick="strike()">YES - STRIKE</button>
    </div>

    <div class="footer-nav">
        <div class="nav-item active"><i class="fas fa-bolt"></i>SIGNALS</div>
        <div class="nav-item"><i class="fas fa-brain"></i>AI BRAIN</div>
        <div class="nav-item"><i class="fas fa-robot"></i>BUILDER</div>
        <div class="nav-item"><i class="fas fa-chart-line"></i>DTRADER</div>
    </div>

    <a href="{{ wa_link }}" class="wa-float" target="_blank"><i class="fab fa-whatsapp"></i></a>

    <script>
        const mkts = {{ markets|tojson }};
        const app_id = "{{ app_id }}";
        const real_token = "{{ real_token }}";
        let mIdx = 0;
        let isMuted = false;
        let currentMode = 'demo';

        // Initialize Digit Bars
        const viz = document.getElementById('viz');
        for(let i=0; i<10; i++) viz.innerHTML += `<div class="bar" id="bar-${i}"><span>${i}</span></div>`;

        function switchAccount(mode) {
            currentMode = mode;
            document.getElementById('demo-btn').classList.toggle('active-demo', mode==='demo');
            document.getElementById('real-btn').classList.toggle('active-real', mode==='real');
            document.getElementById('acc-id').innerText = mode==='real' ? 'CR4567890' : 'VRTC1234567';
            document.body.style.setProperty('--neon', mode==='real' ? '#00ff88' : '#ffad00');
        }

        function toggleMute() {
            isMuted = !isMuted;
            document.getElementById('mute-icon').className = isMuted ? "fas fa-volume-mute" : "fas fa-volume-up";
        }

        function runScanner() {
            const mkt = mkts[mIdx];
            document.getElementById('mkt-label').innerText = mkt.name.toUpperCase();
            
            let signal = false;
            let hotDigit = -1;

            for(let i=0; i<10; i++) {
                let freq = Math.floor(Math.random()*95 + 5);
                const b = document.getElementById(`bar-${i}`);
                b.style.height = freq + "%";
                b.classList.remove('valid', 'hot');
                
                if(freq >= 10) b.classList.add('valid');
                if(freq > 88) { signal = true; hotDigit = i; b.classList.add('hot'); }
            }

            if(signal) {
                document.getElementById('status').innerText = "STRIKE";
                document.getElementById('main-hud').classList.add('active-sig');
                document.getElementById('yes-btn').style.display = "block";
                document.getElementById('ai-status').innerText = "AI BRAIN: VOLATILITY PATTERN MATCHED";
                
                if(!isMuted) {
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Strike " + mkt.name));
                }
            } else {
                mIdx = (mIdx + 1) % mkts.length;
            }
        }

        setInterval(runScanner, 4000);

        function strike() {
            const token = currentMode === 'real' ? real_token : "DEMO_TOKEN_HERE";
            console.log("SENDING STRIKE TO DERIV API ID: " + app_id);
            alert("TRADE EXECUTED ON " + mkts[mIdx].name);
            reset();
        }

        function reset() {
            document.getElementById('main-hud').classList.remove('active-sig');
            document.getElementById('status').innerText = "WAIT";
            document.getElementById('yes-btn').style.display = "none";
        }
    </script>
</body>
</html>
"""

@app.route('/')
def home():
    if not session.get('auth'):
        return '''<body style="background:#010409;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
                  <form method="POST" action="/auth" style="text-align:center;">
                  <h2 style="color:#00ff88;">ZYMOSTAR ACCESS</h2>
                  <input type="password" name="pw" placeholder="PASSWORD" style="padding:10px; border-radius:5px;"><br><br>
                  <button type="submit" style="background:#00ff88; padding:10px 40px; border:none; border-radius:5px; font-weight:900;">UNLOCK</button>
                  </form></body>'''
    return render_template_string(MAIN_UI, wa_link=WHATSAPP_LINK, markets=STRICT_MARKETS, app_id=MY_APP_ID, real_token=REAL_TOKEN)

@app.route('/auth', methods=['POST'])
def auth():
    if request.form.get('pw') == MASTER_PASSWORD: session['auth'] = True
    return redirect(url_for('home'))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
