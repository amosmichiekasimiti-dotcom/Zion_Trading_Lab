import os
import google.generativeai as genai
from flask import Flask, render_template_string, jsonify, request

app = Flask(__name__)

# --- MASTER GLOBAL CREDENTIALS ---
# Your key is the engine. Do not change.
GEMINI_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E" 
MY_APP_ID = "124918" 
MY_TOKEN = "ZcE6HJIVGZnapwd"
WHATSAPP = "https://wa.me/254742024175"

# --- THE AI BRAIN SETUP ---
genai.configure(api_key=GEMINI_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/')
def home():
    return render_template_string(SUPREME_UI, app_id=MY_APP_ID, token=MY_TOKEN, wa=WHATSAPP)

@app.route('/ai-analyze', methods=['POST'])
def ai_analyze():
    data = request.json
    ticks = data.get('ticks', [])
    market = data.get('market', 'Unknown')
    # The Global Intelligence Prompt
    prompt = (f"Market: {market}. Data: {ticks}. "
              "Act as a Quantum Trading Statistician. Analyze digit frequency, "
              "mean reversion, and micro-volatility clusters. "
              "Return exactly one word: ODD or EVEN. If unsure, return WAIT.")
    try:
        response = ai_engine.generate_content(prompt)
        return jsonify({"prediction": response.text.strip().upper()})
    except:
        return jsonify({"prediction": "WAIT"})

# --- THE PIXEL-PERFECT KENYAN MASTER UI ---
SUPREME_UI = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --blue: #0025f8; --bg: #010409; --card: #161b22; --neon: #00ff88; --text: #e6edf3; }
        body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; margin: 0; overflow-x: hidden; }
        
        /* Navbar */
        .header { background: var(--blue); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        .logo { font-weight: 900; font-size: 20px; letter-spacing: 2px; }

        /* Market Bar - The Exact List */
        .m-bar { display: flex; overflow-x: auto; background: #0d1117; padding: 12px; gap: 10px; border-bottom: 2px solid var(--blue); scrollbar-width: none; }
        .m-item { background: var(--card); padding: 10px 18px; border-radius: 6px; font-size: 11px; white-space: nowrap; border: 1px solid #30363d; cursor: pointer; color: #8b949e; font-weight: bold; }
        .m-item.active { border-color: var(--neon); color: var(--neon); background: rgba(0, 255, 136, 0.05); }

        /* Stats & Controls */
        .top-info { display: grid; grid-template-columns: 1fr 1fr; padding: 15px; gap: 10px; background: #010409; }
        .stat-card { background: var(--card); padding: 10px; border-radius: 8px; border: 1px solid #30363d; text-align: left; }
        .val { color: var(--neon); font-weight: 900; font-size: 18px; }

        /* Digit Matrix */
        .matrix { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; padding: 15px; }
        .digit { background: var(--card); border: 1px solid #30363d; padding: 15px 0; border-radius: 8px; font-size: 13px; text-align: center; }
        .digit.hot { border-color: var(--neon); color: var(--neon); background: rgba(0,255,136,0.1); font-weight: 900; }

        /* Signal Area */
        .sig-box { padding: 40px 20px; text-align: center; min-height: 300px; }
        .sig-val { font-size: 110px; font-weight: 900; color: var(--neon); text-shadow: 0 0 40px var(--neon); margin: 10px 0; }
        .market-name { color: #00ffff; font-weight: 800; text-transform: uppercase; font-size: 14px; }

        /* Inputs */
        .input-row { display: flex; gap: 10px; padding: 0 15px; margin-bottom: 10px; }
        input { background: var(--card); border: 1px solid #30363d; color: white; padding: 12px; border-radius: 8px; width: 100%; }

        .btn-purchase { background: var(--neon); color: black; display: block; width: 90%; margin: 20px auto; padding: 22px; border-radius: 15px; font-weight: 900; text-decoration: none; font-size: 22px; text-align: center; }
        .wa-float { position: fixed; bottom: 25px; left: 25px; background: #25d366; width: 62px; height: 62px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; text-decoration: none; z-index: 1000; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">ZION AI BLACK</div>
        <div id="status" style="font-size: 10px; color: var(--neon);">● LIVE</div>
    </div>

    <div class="top-info">
        <div class="stat-card">BALANCE<br><span id="balance" class="val">$0.00</span></div>
        <div class="stat-card">PROFIT<br><span id="profit" class="val">+$0.00</span></div>
    </div>

    <div class="input-row">
        <input type="number" id="stake" placeholder="STAKE ($)" value="1.00">
        <input type="checkbox" id="martingale" style="width: 30px;"> <span style="font-size: 10px; padding-top: 15px;">MARTINGALE</span>
    </div>

    <div class="m-bar" id="mBar">
        <div class="m-item active" id="btn-1HZ10V" onclick="setMkt('1HZ10V')">Volatility 10 (1s) Index</div>
        <div class="m-item" id="btn-1HZ15V" onclick="setMkt('1HZ15V')">Volatility 15 (1s) Index</div>
        <div class="m-item" id="btn-1HZ25V" onclick="setMkt('1HZ25V')">Volatility 25 (1s) Index</div>
        <div class="m-item" id="btn-1HZ30V" onclick="setMkt('1HZ30V')">Volatility 30 (1s) Index</div>
        <div class="m-item" id="btn-1HZ50V" onclick="setMkt('1HZ50V')">Volatility 50 (1s) Index</div>
        <div class="m-item" id="btn-1HZ75V" onclick="setMkt('1HZ75V')">Volatility 75 (1s) Index</div>
        <div class="m-item" id="btn-1HZ90V" onclick="setMkt('1HZ90V')">Volatility 90 (1s) Index</div>
        <div class="m-item" id="btn-1HZ100V" onclick="setMkt('1HZ100V')">Volatility 100 (1s) Index</div>
        <div class="m-item" id="btn-BOOM300" onclick="setMkt('BOOM300')">Boom 300 Index</div>
        <div class="m-item" id="btn-BOOM600" onclick="setMkt('BOOM600')">Boom 600 Index</div>
        <div class="m-item" id="btn-BOOM900" onclick="setMkt('BOOM900')">Boom 900 Index</div>
        <div class="m-item" id="btn-CRASH300" onclick="setMkt('CRASH300')">Crash 300 Index</div>
        <div class="m-item" id="btn-CRASH600" onclick="setMkt('CRASH600')">Crash 600 Index</div>
        <div class="m-item" id="btn-CRASH900" onclick="setMkt('CRASH900')">Crash 900 Index</div>
        <div class="m-item" id="btn-STP" onclick="setMkt('STP')">Step Index</div>
    </div>

    <div class="matrix" id="matrix"></div>

    <div class="sig-box">
        <div style="font-size: 11px; letter-spacing: 3px; color: #58a6ff;">GEMINI QUANTUM ANALYSIS</div>
        <div id="sig" class="sig-val">WAIT</div>
        <div id="mName" class="market-name">Volatility 10 (1s) Index</div>
        <a href="https://app.deriv.com/bot" target="_blank" class="btn-purchase">PURCHASE CONTRACT</a>
    </div>

    <a href="{{ wa }}" class="wa-float" target="_blank"><i class="fa-brands fa-whatsapp"></i></a>

    <script>
        const app_id="{{app_id}}", token="{{token}}";
        let ws, ticks=[], currentMkt="1HZ10V", lastS="", startBal=0;

        function init() {
            ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
            ws.onopen = () => { ws.send(JSON.stringify({ authorize: token })); setMkt(currentMkt); };
            ws.onmessage = (e) => {
                const r = JSON.parse(e.data);
                if (r.authorize) { 
                    startBal = r.authorize.balance; 
                    document.getElementById('balance').innerText = "$" + startBal;
                }
                if (r.tick) {
                    ticks.push(parseInt(r.tick.quote.toString().slice(-1)));
                    if(ticks.length > 50) ticks.shift();
                    process();
                }
            };
        }

        function setMkt(id) {
            currentMkt=id; ticks=[];
            document.querySelectorAll('.m-item').forEach(i => i.classList.remove('active'));
            const el = document.getElementById('btn-'+id);
            el.classList.add('active');
            document.getElementById('mName').innerText = el.innerText;
            ws.send(JSON.stringify({ forget_all: "ticks" }));
            ws.send(JSON.stringify({ ticks: id }));
        }

        async function process() {
            const counts = Array(10).fill(0); ticks.forEach(t => counts[t]++);
            let html = '', e=0, o=0;
            counts.forEach((c, d) => {
                const p = ((c/ticks.length)*100).toFixed(1);
                const isHot = p >= 11.5; if(isHot) { d%2===0 ? e++ : o++; }
                html += `<div class="digit ${isHot?'hot':''}">${d}<br>${p}%</div>`;
            });
            document.getElementById('matrix').innerHTML = html;

            if((e >= 3 || o >= 3) && ticks.length >= 25) {
                const res = await fetch('/ai-analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ ticks: ticks, market: currentMkt })
                });
                const data = await res.json();
                if(lastS !== data.prediction) {
                    document.getElementById('sig').innerText = data.prediction;
                    lastS = data.prediction;
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.prediction));
                }
            }
        }
        init();
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=10000)
