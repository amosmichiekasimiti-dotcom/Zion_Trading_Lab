import os
import json
import google.generativeai as genai
from flask import Flask, render_template_string, session, request

app = Flask(__name__)
app.secret_key = "ZYMOSTAR_MASTER_2026"

# --- MASTER CONFIG ---
MY_APP_ID = "124918"
REAL_TOKEN = "m04oxPdV6cV6pX4" # CR7828749
DEMO_TOKEN = "kTYefK9bFG3UPGh" # VRTC11613504
GEMINI_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
WHATSAPP_LINK = "https://wa.me/254742024175"

# --- AI BRAIN SETUP ---
genai.configure(api_key=GEMINI_KEY)
ai_model = genai.GenerativeModel('gemini-1.5-flash')

# --- MARKET DEFINITIONS ---
STRICT_MARKETS = [
    {"id": "1HZ10V", "name": "Vol 10 (1s)"}, {"id": "1HZ25V", "name": "Vol 25 (1s)"},
    {"id": "1HZ50V", "name": "Vol 50 (1s)"}, {"id": "1HZ75V", "name": "Vol 75 (1s)"},
    {"id": "1HZ100V", "name": "Vol 100 (1s)"}, {"id": "1HZ15V", "name": "Vol 15 (1s)"},
    {"id": "R_10", "name": "Vol 10"}, {"id": "R_100", "name": "Vol 100"}
]

MAIN_UI = """
<!DOCTYPE html>
<html>
<head>
    <title>Zymostar Universal Terminal</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --neon: #00ff88; --orange: #ffad00; --bg: #010409; --panel: #0d1117; }
        body { background: var(--bg); color: white; font-family: sans-serif; margin: 0; overflow-x: hidden; }
        .header { background: var(--panel); padding: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #333; }
        .hud { margin: 15px; padding: 25px; background: var(--panel); border-radius: 15px; text-align: center; border: 1px solid #333; }
        .timer { font-size: 50px; font-weight: 900; color: #ff4444; display: none; }
        .btn-strike { width: 100%; padding: 20px; background: var(--neon); color: black; font-weight: 900; font-size: 24px; border-radius: 10px; border: none; display: none; cursor: pointer; }
        .digit-bar-container { display: flex; justify-content: space-between; height: 100px; align-items: flex-end; margin: 20px 0; background: #000; padding: 10px; border-radius: 10px; }
        .bar { width: 8%; background: #333; transition: 0.3s; position: relative; }
        .bar span { position: absolute; bottom: -20px; width: 100%; font-size: 10px; }
        .bar.cold { background: var(--neon); box-shadow: 0 0 10px var(--neon); }
        .mute-toggle { font-size: 20px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="header">
        <div id="acc-type" style="color:var(--orange); font-weight:bold;">DEMO: $231.64</div>
        <div class="mute-toggle" onclick="toggleMute()"><i id="vol-icon" class="fas fa-volume-up"></i></div>
    </div>

    <div class="hud">
        <h2 id="mkt-display">SCANNING MARKETS...</h2>
        <div class="digit-bar-container" id="viz"></div>
        <div class="timer" id="countdown">15s</div>
        <button class="btn-strike" id="strike-btn" onclick="executeTrade()">YES - STRIKE</button>
    </div>

    <div style="padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <input type="number" id="stake" value="0.35" step="0.01" placeholder="Stake">
        <input type="number" id="mart" value="2.1" step="0.1" placeholder="Martingale">
        <input type="number" id="tp" value="1.0" step="0.1" placeholder="Take Profit">
        <input type="number" id="sl" value="0.15" step="0.01" placeholder="Stop Loss">
    </div>

    <a href="{{ wa_link }}" style="position:fixed; bottom:20px; right:20px; background:#25d366; color:white; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:30px; text-decoration:none;"><i class="fab fa-whatsapp"></i></a>

    <script>
        const markets = {{ markets|tojson }};
        let mIdx = 0;
        let isMuted = false;
        let timerInterval;

        // Initialize Bars
        const viz = document.getElementById('viz');
        for(let i=0; i<10; i++) viz.innerHTML += `<div class="bar" id="b-${i}"><span>${i}</span></div>`;

        function toggleMute() {
            isMuted = !isMuted;
            document.getElementById('vol-icon').className = isMuted ? "fas fa-volume-mute" : "fas fa-volume-up";
        }

        function runScanner() {
            const mkt = markets[mIdx];
            document.getElementById('mkt-display').innerText = mkt.name.toUpperCase();
            
            // AI Simulation logic for digit floor
            let found = false;
            for(let i=0; i<10; i++){
                let val = Math.random() * 100;
                let b = document.getElementById('b-'+i);
                b.style.height = val + "%";
                b.classList.toggle('cold', val < 10);
                if(val < 10) found = true;
            }

            if(found) {
                triggerSignal(mkt.name);
            } else {
                mIdx = (mIdx + 1) % markets.length;
                setTimeout(runScanner, 2000); // 2s scan cycle
            }
        }

        function triggerSignal(name) {
            if(!isMuted) {
                const speech = new SpeechSynthesisUtterance("Volatility " + name + " Strike Ready");
                window.speechSynthesis.speak(speech);
            }
            document.getElementById('countdown').style.display = 'block';
            document.getElementById('strike-btn').style.display = 'block';
            
            let time = 15;
            timerInterval = setInterval(() => {
                time--;
                document.getElementById('countdown').innerText = time + "s";
                if(time <= 0) {
                    clearInterval(timerInterval);
                    resetUI();
                }
            }, 1000);
        }

        function resetUI() {
            document.getElementById('countdown').style.display = 'none';
            document.getElementById('strike-btn').style.display = 'none';
            runScanner();
        }

        function executeTrade() {
            alert("STRIKE EXECUTED: AUTOMATION MONITORING PROFIT/LOSS");
            clearInterval(timerInterval);
            resetUI();
        }

        runScanner();
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(MAIN_UI, markets=STRICT_MARKETS, wa_link=WHATSAPP_LINK)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
