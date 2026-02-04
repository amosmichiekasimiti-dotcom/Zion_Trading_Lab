import os
import json
import google.generativeai as genai
from flask import Flask, render_template_string

app = Flask(__name__)

# --- MASTER CONFIG (ZION PRODUCTION) ---
MY_APP_ID = "124918"
REAL_TOKEN = "m04oxPdV6cV6pX4" # Account CR7828749
DEMO_TOKEN = "kTYefK9bFG3UPGh" # Account VRTC11613504
WHATSAPP_LINK = "https://wa.me/254742024175"

# --- 1S & PLAIN MARKETS ---
STRICT_MARKETS = [
    {"id": "1HZ10V", "name": "Volatility 10 (1s)"}, {"id": "1HZ100V", "name": "Volatility 100 (1s)"},
    {"id": "R_10", "name": "Volatility 10"}, {"id": "R_100", "name": "Volatility 100"}
]

MAIN_UI = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --neon: #00ff88; --orange: #ffad00; --bg: #010409; --panel: #0d1117; }
        body { background: var(--bg); color: white; font-family: sans-serif; margin: 0; height: 100vh; overflow: hidden; }
        .header { background: var(--panel); padding: 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; height: 60px; box-sizing: border-box; }
        .acc-toggle { display: flex; background: #000; border-radius: 20px; padding: 2px; border: 1px solid #444; }
        .mode-btn { padding: 5px 12px; border-radius: 15px; font-size: 10px; cursor: pointer; color: #555; }
        .active-demo { color: var(--orange); border: 1px solid var(--orange); }
        .active-real { color: var(--neon); border: 1px solid var(--neon); }
        .hud { margin: 10px; padding: 15px; background: var(--panel); border-radius: 15px; text-align: center; border: 1px solid #333; height: 320px; }
        #strategy-badge { background: var(--neon); color: black; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 4px; display: inline-block; }
        .digit-bar-container { display: flex; justify-content: space-between; height: 100px; align-items: flex-end; margin: 15px 0; background: #000; padding: 10px; border-radius: 10px; }
        .bar { width: 8%; background: #333; transition: height 0.3s; position: relative; height: 10%; }
        .bar span { position: absolute; bottom: -18px; width: 100%; font-size: 9px; }
        .bar.cold { background: var(--neon); box-shadow: 0 0 10px var(--neon); }
        .btn-strike { width: 100%; padding: 15px; background: var(--neon); color: black; font-weight: 900; font-size: 20px; border-radius: 10px; border: none; display: none; }
        .footer-nav { position: fixed; bottom: 0; width: 100%; background: var(--panel); display: flex; justify-content: space-around; padding: 10px 0; border-top: 1px solid #333; }
        .nav-item { text-align: center; color: #555; font-size: 9px; cursor: pointer; }
        .nav-item i { font-size: 20px; display: block; }
        .nav-item.active { color: var(--neon); }
        .wa-float { position: fixed; bottom: 70px; right: 15px; background: #25d366; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 25px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <div class="acc-toggle">
            <div id="demo-btn" class="mode-btn active-demo" onclick="switchMode('demo')">DEMO</div>
            <div id="real-btn" class="mode-btn" onclick="switchMode('real')">REAL</div>
        </div>
        <div onclick="toggleMute()" style="cursor:pointer;"><i id="vol-icon" class="fas fa-volume-up" style="color:var(--neon); font-size:22px;"></i></div>
        <div id="bal-display" style="font-weight:bold; color:var(--orange);">$231.64</div>
    </div>

    <div class="hud">
        <div id="strategy-badge">DIGITDIFF</div>
        <h3 id="mkt-name">SCANNING...</h3>
        <div class="digit-bar-container" id="viz"></div>
        <button class="btn-strike" id="strike-btn" onclick="executeStrike()">YES - STRIKE</button>
    </div>

    <div style="padding: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background:#000; padding:5px; border-radius:5px;"><label style="font-size:9px;">STAKE</label><input type="number" id="stake" value="0.35" style="background:transparent; border:none; color:var(--neon); width:100%;"></div>
    </div>

    <div class="footer-nav">
        <div class="nav-item active" onclick="setRoom('DIGITDIFF')"><i class="fas fa-crosshairs"></i>DIFFS</div>
        <div class="nav-item" onclick="setRoom('DIGITEVEN')"><i class="fas fa-balance-scale"></i>E/O</div>
        <div class="nav-item" onclick="setRoom('CALLPUT')"><i class="fas fa-chart-line"></i>R/F</div>
        <div class="nav-item" onclick="setRoom('DIGITMATCH')"><i class="fas fa-bullseye"></i>MATCH</div>
    </div>

    <a href="{{ wa_link }}" class="wa-float" target="_blank"><i class="fab fa-whatsapp"></i></a>

    <script>
        const app_id = "{{ app_id }}";
        const tokens = { real: "{{ real_token }}", demo: "{{ demo_token }}" };
        const markets = {{ markets|tojson }};
        let ws, currentMode = 'demo', currentStrategy = 'DIGITDIFF', mIdx = 0, isMuted = false, targetDigit = null;

        // Initialize Visuals
        const viz = document.getElementById('viz');
        for(let i=0; i<10; i++) viz.innerHTML += `<div class="bar" id="b-${i}"><span>${i}</span></div>`;

        function connectWS() {
            ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);
            ws.onopen = () => ws.send(JSON.stringify({ authorize: tokens[currentMode] }));
            ws.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                if (data.msg_type === 'authorize') {
                    document.getElementById('bal-display').innerText = "$" + data.authorize.balance;
                    setInterval(() => ws.send(JSON.stringify({ ping: 1 })), 30000);
                }
            };
        }

        function toggleMute() {
            isMuted = !isMuted;
            document.getElementById('vol-icon').className = isMuted ? "fas fa-volume-mute" : "fas fa-volume-up";
            document.getElementById('vol-icon').style.color = isMuted ? "red" : "var(--neon)";
        }

        function setRoom(room) {
            currentStrategy = room;
            document.getElementById('strategy-badge').innerText = room.replace('DIGIT', '');
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            event.currentTarget.classList.add('active');
        }

        function executeStrike() {
            if (ws.readyState !== WebSocket.OPEN) return;
            const stake = document.getElementById('stake').value;
            const params = {
                buy: 1, price: stake,
                parameters: {
                    symbol: markets[mIdx].id, duration: 1, duration_unit: 't',
                    contract_type: currentStrategy
                }
            };
            if (currentStrategy.includes('DIFF') || currentStrategy.includes('MATCH')) params.parameters.barrier = targetDigit.toString();
            ws.send(JSON.stringify(params));
            document.getElementById('strike-btn').style.display = 'none';
        }

        function runScanner() {
            const mkt = markets[mIdx];
            document.getElementById('mkt-name').innerText = mkt.name.toUpperCase();
            targetDigit = null;
            for(let i=0; i<10; i++) {
                let val = Math.random() * 100;
                let b = document.getElementById('b-'+i);
                b.style.height = val + "%";
                b.classList.remove('cold');
                if(val < 10) { b.classList.add('cold'); targetDigit = i; }
            }
            if(targetDigit !== null) {
                const label = currentStrategy.replace('DIGIT', '');
                if(!isMuted) window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${mkt.name.replace('(1s)','One S')}. ${label} ${targetDigit}. Sniper Active.`));
                document.getElementById('strike-btn').innerText = `YES - ${label} ${targetDigit}`;
                document.getElementById('strike-btn').style.display = 'block';
                setTimeout(() => { document.getElementById('strike-btn').style.display = 'none'; runScanner(); }, 10000);
            } else {
                mIdx = (mIdx + 1) % markets.length;
                setTimeout(runScanner, 1200);
            }
        }

        function switchMode(mode) {
            currentMode = mode;
            ws.close();
            connectWS();
        }

        connectWS();
        runScanner();
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(MAIN_UI, markets=STRICT_MARKETS, wa_link=WHATSAPP_LINK, 
                                 app_id=MY_APP_ID, real_token=REAL_TOKEN, demo_token=DEMO_TOKEN)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
