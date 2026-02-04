import os
import google.generativeai as genai
from flask import Flask, render_template_string

app = Flask(__name__)

# --- MASTER CONFIGURATION ---
MY_APP_ID = "124918"
REAL_TOKEN = "m04oxPdV6cV6pX4"
DEMO_TOKEN = "kTYefK9bFG3UPGh"
GEMINI_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"

# --- FULL MARKET LIST (Including all 1S variants) ---
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
        body { background: var(--bg); color: white; font-family: sans-serif; margin: 0; padding-bottom: 90px; }
        .header { background: var(--panel); padding: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid #333; }
        .hud { margin: 10px; padding: 15px; background: var(--panel); border-radius: 15px; text-align: center; border: 1px solid #333; position: relative; }
        
        /* NEW: Signal Timer Styling */
        .signal-timer { position: absolute; top: 10px; right: 10px; color: var(--neon); font-size: 12px; font-weight: bold; border: 1px solid var(--neon); padding: 2px 6px; border-radius: 5px; }
        
        .digit-bar-container { display: flex; justify-content: space-between; height: 90px; align-items: flex-end; margin: 20px 0; background: #000; padding: 10px; border-radius: 10px; }
        .bar { width: 8%; background: #333; transition: height 0.3s; position: relative; }
        .bar.cold { background: var(--neon); box-shadow: 0 0 10px var(--neon); }
        
        /* NEW: Result Monitor Styling */
        .result-panel { margin: 10px; background: #000; padding: 10px; border-radius: 10px; border: 1px solid #333; height: 80px; overflow-y: auto; }
        .res-row { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 0; border-bottom: 1px solid #222; }
        .win { color: var(--neon); } .loss { color: #ff4444; }

        .btn-strike { width: 100%; padding: 18px; background: var(--neon); color: black; font-weight: 900; font-size: 18px; border-radius: 10px; border: none; cursor: pointer; display: none; }
        .footer-nav { position: fixed; bottom: 0; width: 100%; background: var(--panel); display: flex; justify-content: space-around; padding: 12px 0; border-top: 1px solid #333; }
        .nav-item { text-align: center; color: #555; font-size: 8px; cursor: pointer; flex: 1; }
        .nav-item.active { color: var(--neon); }
    </style>
</head>
<body>
    <div class="header">
        <div style="display:flex; background:#000; padding:2px; border-radius:20px;">
            <div id="demo-btn" onclick="switchMode('demo')" style="padding:5px 12px; cursor:pointer; color:var(--orange);">DEMO</div>
            <div id="real-btn" onclick="switchMode('real')" style="padding:5px 12px; cursor:pointer; color:#444;">REAL</div>
        </div>
        <div id="bal-display" style="color:var(--orange); font-weight:bold;">$0.00</div>
    </div>

    <div class="hud">
        <div id="timer" class="signal-timer">Valid: 0s</div>
        <div id="strategy-badge" style="background:var(--neon); color:black; font-size:10px; font-weight:900; padding:2px 8px; border-radius:4px; display:inline-block;">MATCH</div>
        <h3 id="mkt-name">ANALYZING...</h3>
        <div class="digit-bar-container" id="viz"></div>
        <button class="btn-strike" id="strike-btn" onclick="executeDecision()">YES - START TRADE</button>
    </div>

    <div class="result-panel" id="history">
        <div style="font-size: 9px; color: #888; text-align: center;">LIVE TRADE RESULTS</div>
    </div>

    <div class="footer-nav">
        <div class="nav-item" onclick="setRoom('DIGITDIFF', 'DIFFS')"><i class="fas fa-crosshairs"></i><br>DIFFS</div>
        <div class="nav-item" onclick="setRoom('DIGITEVEN', 'EVEN/ODD')"><i class="fas fa-balance-scale"></i><br>E/O</div>
        <div class="nav-item" onclick="setRoom('CALLPUT', 'RISE/FALL')"><i class="fas fa-chart-line"></i><br>R/F</div>
        <div class="nav-item" onclick="setRoom('DIGITOVER', 'OVER/UNDER')"><i class="fas fa-arrow-up"></i><br>O/U</div>
        <div class="nav-item active" onclick="setRoom('DIGITMATCH', 'MATCH')"><i class="fas fa-bullseye"></i><br>MATCH</div>
    </div>

    <script>
        const app_id = "{{ app_id }}";
        const tokens = { real: "{{ real_token }}", demo: "{{ demo_token }}" };
        const markets = {{ markets|tojson }};
        let ws, currentMode = 'demo', currentStrategy = 'DIGITMATCH', currentLabel = 'MATCH', mIdx = 0, countdown = 6;
        let targetVal = null, barrierVal = 5;

        function connectWS() {
            ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);
            ws.onopen = () => ws.send(JSON.stringify({ authorize: tokens[currentMode] }));
            ws.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                if (data.msg_type === 'authorize') document.getElementById('bal-display').innerText = "$" + data.authorize.balance;
                if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract.is_sold) {
                    addHistory(data.proposal_open_contract.status, data.proposal_open_contract.profit);
                }
            };
        }

        function addHistory(status, profit) {
            const h = document.getElementById('history');
            const row = document.createElement('div');
            row.className = `res-row ${status === 'won' ? 'win' : 'loss'}`;
            row.innerHTML = `<span>${currentLabel}</span><span>${status.toUpperCase()}</span><span>$${profit}</span>`;
            h.prepend(row);
        }

        function executeDecision() {
            if (ws.readyState !== WebSocket.OPEN) return;
            const params = {
                buy: 1, price: 0.35,
                parameters: {
                    symbol: markets[mIdx].id, duration: 1, duration_unit: 't',
                    contract_type: currentStrategy === 'CALLPUT' ? (targetVal === 1 ? 'CALL' : 'PUT') : currentStrategy
                }
            };
            if (currentStrategy.includes('DIGIT')) params.parameters.barrier = barrierVal.toString();
            ws.send(JSON.stringify(params));
            ws.send(JSON.stringify({ forget_all: 'proposal_open_contract' }));
            ws.send(JSON.stringify({ subscribe: 1, proposal_open_contract: 1 }));
        }

        function runAI() {
            const btn = document.getElementById('strike-btn');
            const timer = document.getElementById('timer');
            const mkt = markets[mIdx];
            document.getElementById('mkt-name').innerText = mkt.name.toUpperCase();
            
            barrierVal = Math.floor(Math.random() * 10);
            targetVal = Math.random() > 0.5 ? 1 : 0;
            countdown = 6;

            if (currentLabel === 'RISE/FALL') btn.innerText = `YES - TRADE ${targetVal === 1 ? 'RISE' : 'FALL'}`;
            else if (currentLabel === 'EVEN/ODD') btn.innerText = `YES - TRADE ${targetVal === 1 ? 'EVEN' : 'ODD'}`;
            else btn.innerText = `YES - ${currentLabel} ${barrierVal}`;

            btn.style.display = 'block';
            
            const countInterval = setInterval(() => {
                countdown--;
                timer.innerText = `Valid: ${countdown}s`;
                if (countdown <= 0) {
                    clearInterval(countInterval);
                    btn.style.display = 'none';
                    mIdx = (mIdx + 1) % markets.length;
                    runAI();
                }
            }, 1000);
        }

        connectWS(); runAI();
        function setRoom(s, l) { currentStrategy = s; currentLabel = l; }
        function switchMode(m) { currentMode = m; ws.close(); connectWS(); }
    </script>
</body>
</html>
"""
