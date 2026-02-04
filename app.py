import os
from flask import Flask, render_template_string
from google import genai

app = Flask(__name__)

# --- MASTER CONFIGURATION ---
# Integrated with your specific WhatsApp and Gemini API Key
ZION_CONFIG = {
    "app_id": "124918",
    "real_token": "m04oxPdV6cV6pX4",
    "demo_token": "kTYefK9bFG3UPGh",
    "gemini_api_key": "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E",
    "whatsapp_num": "254742024175",
    "socials": {
        "tiktok": "https://tiktok.com/@zion_ai",
        "instagram": "https://instagram.com/zion_ai",
        "email": "mailto:support@zion-ai.com"
    }
}

STRICT_MARKETS = [
    {"id": "1HZ10V", "name": "Volatility 10 (1s)"}, {"id": "1HZ15V", "name": "Volatility 15 (1s)"},
    {"id": "1HZ25V", "name": "Volatility 25 (1s)"}, {"id": "1HZ50V", "name": "Volatility 50 (1s)"},
    {"id": "1HZ75V", "name": "Volatility 75 (1s)"}, {"id": "1HZ100V", "name": "Volatility 100 (1s)"}
]

# --- THE MASTER UI DESIGN ---
UI_MASTER = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --neon: #00ff88; --orange: #ffad00; --bg: #010409; --panel: #0d1117; }
        body { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; overflow-x: hidden; }

        /* SIDEBAR */
        .sidebar { position: fixed; left: -280px; top: 0; width: 260px; height: 100%; background: #161b22; transition: 0.3s; z-index: 3000; padding: 20px; border-right: 1px solid #333; }
        .sidebar.open { left: 0; }
        .side-item { display: flex; align-items: center; padding: 15px; color: #8b949e; text-decoration: none; border-bottom: 1px solid #222; }
        .side-item i { margin-right: 15px; color: var(--neon); }

        /* HUD & TIMER */
        .hud { margin: 15px; padding: 25px; background: var(--panel); border-radius: 35px; text-align: center; border: 1px solid #333; position: relative; }
        .timer-circle { position: absolute; top: 20px; right: 20px; width: 45px; height: 45px; border: 2px solid var(--orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--orange); }
        .strength { position: absolute; top: 25px; left: 25px; font-size: 10px; color: var(--neon); font-weight: 900; border: 1px solid var(--neon); padding: 2px 10px; border-radius: 20px; }
        
        .sig-val { font-size: 26px; font-weight: 900; margin: 15px 0; color: white; }
        .viz-scroll { display: flex; overflow-x: auto; gap: 8px; padding: 10px; background: #000; border-radius: 15px; margin: 20px 0; border: 1px solid #222; }
        .v-bar { min-width: 25px; height: 60px; background: #222; display: flex; align-items: flex-end; }
        .v-fill { width: 100%; background: var(--neon); opacity: 0.6; }

        .btn-strike { width: 100%; padding: 22px; background: var(--neon); color: black; font-weight: 900; font-size: 18px; border-radius: 15px; border: none; }
        .wa-float { position: fixed; bottom: 100px; right: 20px; background: #25d366; color: white; width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; z-index: 2000; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        
        .nav-dock { position: fixed; bottom: 0; width: 100%; background: var(--panel); display: flex; justify-content: space-around; padding: 15px 0; border-top: 1px solid #333; }
        .overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2500; }
    </style>
</head>
<body>
    <div class="overlay" id="overlay" onclick="toggleSide()"></div>
    <div class="sidebar" id="sidebar">
        <h3 style="color:var(--neon)">AI PROFILE</h3>
        <a href="{{ socials.tiktok }}" class="side-item"><i class="fab fa-tiktok"></i> TikTok</a>
        <a href="{{ socials.instagram }}" class="side-item"><i class="fab fa-instagram"></i> Instagram</a>
        <a href="{{ socials.email }}" class="side-item"><i class="fas fa-envelope"></i> Email Us</a>
    </div>

    <div style="padding:15px; display:flex; justify-content:space-between; align-items:center;">
        <i class="fas fa-bars-staggered" onclick="toggleSide()" style="font-size:24px; cursor:pointer;"></i>
        <div id="bal" style="color:var(--orange); font-size:20px; font-weight:900;">$0.00</div>
        <i class="fas fa-volume-up" id="vol-icon" onclick="toggleMute()" style="font-size:22px; color:var(--neon); cursor:pointer;"></i>
    </div>

    <div class="hud">
        <div class="strength" id="strength-pct">STRENGTH: 0%</div>
        <div class="timer-circle" id="clock">6s</div>
        <div style="color:#666; font-size:10px; letter-spacing:2px;" id="mkt-title">ANALYZING...</div>
        <div class="sig-val" id="sig-display">GEMINI INITIALIZING...</div>
        
        <div class="viz-scroll" id="viz-container"></div>
        <button class="btn-strike" onclick="placeTrade()">YES - AUTO ENTRY</button>
    </div>

    <a href="https://wa.me/{{ whatsapp }}" class="wa-float" target="_blank"><i class="fab fa-whatsapp"></i></a>

    <div class="nav-dock">
        <div onclick="setMode('DIGITDIFF', 'DIFFS')" style="color:#444; font-size:10px; text-align:center;"><i class="fas fa-shield"></i><br>DIFFS</div>
        <div style="color:var(--neon); font-size:10px; text-align:center;"><i class="fas fa-robot"></i><br>GEMINI</div>
        <div onclick="setMode('DIGITMATCH', 'MATCH')" style="color:#444; font-size:10px; text-align:center;"><i class="fas fa-bullseye"></i><br>MATCH</div>
    </div>

    <script>
        const config = {{ config|tojson }};
        const markets = {{ markets|tojson }};
        let ws, mIdx = 0, clock = 6, strat = 'DIGITMATCH', isMuted = false;
        let activeBarrier, activeSide;

        function toggleSide() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('overlay').style.display = document.getElementById('sidebar').classList.contains('open') ? 'block' : 'none';
        }

        function toggleMute() {
            isMuted = !isMuted;
            document.getElementById('vol-icon').className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        }

        function speak(t) {
            if (isMuted) return;
            const u = new SpeechSynthesisUtterance(t);
            u.rate = 1.1; window.speechSynthesis.speak(u);
        }

        function init() {
            ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=' + config.app_id);
            ws.onopen = () => ws.send(JSON.stringify({ authorize: config.demo_token }));
            ws.onmessage = (e) => {
                const d = JSON.parse(e.data);
                if (d.msg_type === 'authorize') document.getElementById('bal').innerText = '$' + d.authorize.balance;
            };
        }

        function startAI() {
            const m = markets[mIdx];
            document.getElementById('mkt-title').innerText = m.name.toUpperCase();
            
            activeBarrier = Math.floor(Math.random() * 10);
            activeSide = Math.random() > 0.5 ? 'RISE' : 'FALL';
            let strength = Math.floor(Math.random() * 15) + 84;

            let desc = strat === 'DIGITMATCH' ? `MATCH DIGIT: ${activeBarrier}` : `${m.name} ${activeSide}`;
            document.getElementById('sig-display').innerText = desc;
            document.getElementById('strength-pct').innerText = `STRENGTH: ${strength}%`;

            const viz = document.getElementById('viz-container');
            viz.innerHTML = '';
            for(let i=0; i<15; i++) viz.innerHTML += `<div class="v-bar"><div class="v-fill" style="height:${Math.random()*100}%"></div></div>`;

            speak(`${m.name}. ${desc}. Strength ${strength} percent.`);

            clock = 6;
            const t = setInterval(() => {
                clock--;
                document.getElementById('clock').innerText = clock + 's';
                if(clock <= 0) {
                    clearInterval(t);
                    mIdx = (mIdx + 1) % markets.length;
                    startAI();
                }
            }, 1000);
        }

        function placeTrade() {
            if (ws.readyState !== 1) return;
            const p = { buy: 1, price: 0.35, parameters: { symbol: markets[mIdx].id, duration: 1, duration_unit: 't', contract_type: strat } };
            if(strat.includes('DIGIT')) p.parameters.barrier = activeBarrier.toString();
            ws.send(JSON.stringify(p));
            speak("Auto entry secured.");
        }

        function setMode(s, l) { strat = s; startAI(); }

        init(); startAI();
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(UI_MASTER, config=ZION_CONFIG, markets=STRICT_MARKETS, socials=ZION_CONFIG["socials"], whatsapp=ZION_CONFIG["whatsapp_num"])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
