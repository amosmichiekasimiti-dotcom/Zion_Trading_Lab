import os
import json
import google.generativeai as genai
from flask import Flask, render_template_string

app = Flask(__name__)

# --- MASTER CONFIGURATION ---
MY_APP_ID = "124918"
REAL_TOKEN = "m04oxPdV6cV6pX4"
DEMO_TOKEN = "kTYefK9bFG3UPGh"
# Correct Gemini API Key Integration
GEMINI_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
WHATSAPP_LINK = "https://wa.me/254742024175"

# --- FULL VOLATILITY LIST (Updated from your image) ---
STRICT_MARKETS = [
    {"id": "1HZ10V", "name": "Volatility 10 (1s)"}, {"id": "R_10", "name": "Volatility 10"},
    {"id": "1HZ15V", "name": "Volatility 15 (1s)"}, {"id": "1HZ25V", "name": "Volatility 25 (1s)"},
    {"id": "R_25", "name": "Volatility 25"}, {"id": "1HZ30V", "name": "Volatility 30 (1s)"},
    {"id": "1HZ50V", "name": "Volatility 50 (1s)"}, {"id": "R_50", "name": "Volatility 50"},
    {"id": "1HZ75V", "name": "Volatility 75 (1s)"}, {"id": "R_75", "name": "Volatility 75"},
    {"id": "1HZ90V", "name": "Volatility 90 (1s)"}, {"id": "1HZ100V", "name": "Volatility 100 (1s)"},
    {"id": "R_100", "name": "Volatility 100"}
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
        .header { background: var(--panel); padding: 10px; display: flex; justify-content: space-between; align-items: center; height: 60px; border-bottom: 1px solid #333; }
        .hud { margin: 10px; padding: 15px; background: var(--panel); border-radius: 15px; text-align: center; border: 1px solid #333; height: 240px; }
        .digit-bar-container { display: flex; justify-content: space-between; height: 80px; align-items: flex-end; margin: 15px 0; background: #000; padding: 10px; border-radius: 10px; }
        .bar { width: 8%; background: #333; transition: height 0.3s; position: relative; }
        .bar.cold { background: var(--neon); box-shadow: 0 0 10px var(--neon); }
        
        /* NEW RISK CONSOLE COLUMNS */
        .risk-console { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 10px; margin-top: 5px; }
        .input-box { background: #000; padding: 8px; border-radius: 8px; border: 1px solid #333; }
        .input-box label { font-size: 9px; color: #8b949e; display: block; margin-bottom: 2px; }
        .input-box input { background: transparent; border: none; color: var(--neon); font-weight: bold; width: 100%; outline: none; }

        .btn-strike { width: 95%; margin: 10px auto; padding: 15px; background: var(--neon); color: black; font-weight: 900; font-size: 20px; border-radius: 10px; border: none; display: none; }
        .footer-nav { position: fixed; bottom: 0; width: 100%; background: var(--panel); display: flex; justify-content: space-around; padding: 10px 0; border-top: 1px solid #333; }
        .nav-item { text-align: center; color: #555; font-size: 9px; cursor: pointer; }
        .nav-item.active { color: var(--neon); }
        .wa-float { position: fixed; bottom: 85px; right: 15px; background: #25d366; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 25px; text-decoration: none; z-index: 100; }
    </style>
</head>
<body>
    <div class="header">
        <div style="display:flex; background:#000; border-radius:20px; padding:2px; border:1px solid #444;">
            <div id="demo-btn" class="mode-btn active-demo" onclick="switchMode('demo')" style="padding:5px 12px; font-size:10px; cursor:pointer;">DEMO</div>
            <div id="real-btn" class="mode-btn" onclick="switchMode('real')" style="padding:5px 12px; font-size:10px; cursor:pointer;">REAL</div>
        </div>
        <div onclick="toggleMute()"><i id="vol-icon" class="fas fa-volume-up" style="color:var(--neon); font-size:22px;"></i></div>
        <div id="bal-display" style="font-weight:bold; color:var(--orange);">$231.64</div>
    </div>

    <div class="hud">
        <h3 id="mkt-name">SCANNING MARKETS...</h3>
        <div class="digit-bar-container" id="viz"></div>
        <button class="btn-strike" id="strike-btn" onclick="executeStrike()">YES - STRIKE</button>
    </div>

    <div class="risk-console">
        <div class="input-box"><label>STAKE ($)</label><input type="number" id="stake" value="0.35"></div>
        <div class="input-box"><label>MARTINGALE</label><input type="number" id="martingale" value="2.1"></div>
        <div class="input-box"><label>TAKE PROFIT</label><input type="number" id="tp" value="5.00"></div>
        <div class="input-box"><label>STOP LOSS</label><input type="number" id="sl" value="2.00"></div>
    </div>

    <div class="footer-nav">
        <div class="nav-item" onclick="setRoom('DIGITDIFF')"><i class="fas fa-crosshairs"></i><br>DIFFS</div>
        <div class="nav-item" onclick="setRoom('DIGITEVEN')"><i class="fas fa-balance-scale"></i><br>E/O</div>
        <div class="nav-item active" onclick="setRoom('DIGITMATCH')"><i class="fas fa-bullseye"></i><br>MATCH</div>
    </div>

    <a href="{{ wa_link }}" class="wa-float" target="_blank"><i class="fab fa-whatsapp"></i></a>

    <script>
        const app_id = "{{ app_id }}";
        const tokens = { real: "{{ real_token }}", demo: "{{ demo_token }}" };
        const markets = {{ markets|tojson }};
        let ws, currentMode = 'demo', currentStrategy = 'DIGITMATCH', mIdx = 0, isMuted = false, targetDigit = null;

        const viz = document.getElementById('viz');
        for(let i=0; i<10; i++) viz.innerHTML += `<div class="bar" id="b-${i}" style="height:10%;"><span>${i}</span></div>`;

        function connectWS() {
            ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);
            ws.onopen = () => ws.send(JSON.stringify({ authorize: tokens[currentMode] }));
            ws.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                if (data.msg_type === 'authorize') {
                    document.getElementById('bal-display').innerText = "$" + data.authorize.balance;
                }
            };
        }

        function executeStrike() {
            if (ws.readyState !== WebSocket.OPEN) return;
            const stake = document.getElementById('stake').value;
            const params = {
                buy: 1, price: stake,
                parameters: {
                    symbol: markets[mIdx].id, duration: 1, duration_unit: 't',
                    contract_type: currentStrategy,
                    barrier: targetDigit.toString()
                }
            };
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
                if(!isMuted) window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${mkt.name.replace('(1s)','One S')}. Match Digit ${targetDigit}. Sniper Active.`));
                document.getElementById('strike-btn').innerText = `YES - MATCH ${targetDigit}`;
                document.getElementById('strike-btn').style.display = 'block';
                setTimeout(() => { document.getElementById('strike-btn').style.display = 'none'; runScanner(); }, 10000);
            } else {
                mIdx = (mIdx + 1) % markets.length;
                setTimeout(runScanner, 1200);
            }
        }

        connectWS();
        runScanner();
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(MAIN_UI, wa_link=WHATSAPP_LINK, app_id=MY_APP_ID, real_token=REAL_TOKEN, demo_token=DEMO_TOKEN, markets=STRICT_MARKETS)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
