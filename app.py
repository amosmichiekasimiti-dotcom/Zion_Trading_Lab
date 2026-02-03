import os
import google.generativeai as genai
from flask import Flask, render_template_string, jsonify, request, session, redirect, url_for

app = Flask(__name__)
app.secret_key = "ZYMOSTAR_QUANTUM_SHIELD_2026" 

# --- SOVEREIGN CONFIGURATION ---
MASTER_PASSWORD = "#Zymostar130*" 
MY_APP_ID = "124918" 
MY_TOKEN = "ZcE6HJIVGZnapwd" 
GEMINI_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E" 

# Initialize Gemini Brain
genai.configure(api_key=GEMINI_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

# Market Registry (1s and Plain)
MARKETS = {
    "1HZ10V": "Vol 10 (1s)", "R_10": "Vol 10",
    "1HZ15V": "Vol 15 (1s)", "R_15": "Vol 15",
    "1HZ25V": "Vol 25 (1s)", "R_25": "Vol 25",
    "1HZ50V": "Vol 50 (1s)", "R_50": "Vol 50",
    "1HZ75V": "Vol 75 (1s)", "R_75": "Vol 75",
    "1HZ90V": "Vol 90 (1s)", "R_90": "Vol 90",
    "1HZ100V": "Vol 100 (1s)", "R_100": "Vol 100"
}

# --- UI TEMPLATES ---
LOGIN_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #010409; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #0d1117; padding: 30px; border-radius: 15px; border: 1px solid #30363d; text-align: center; width: 300px; }
        input { background: #010409; border: 1px solid #30363d; color: #00ff88; padding: 12px; width: 85%; border-radius: 8px; text-align: center; margin-bottom: 15px; font-size: 16px; }
        button { background: #00ff88; color: black; border: none; padding: 12px; width: 100%; border-radius: 8px; font-weight: 900; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <h2 style="color:#00ff88">ZYMOSTAR LOCK</h2>
        <form method="POST">
            <input type="password" name="pw" placeholder="ACCESS KEY" required>
            <button type="submit">UNLEASH SYSTEM</button>
        </form>
    </div>
</body>
</html>
"""

MAIN_TERMINAL_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #010409; color: white; font-family: sans-serif; margin: 0; overflow: hidden; }
        .header { padding: 15px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
        .terminal { height: 70vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        #sig { font-size: 80px; font-weight: 900; color: #21262d; transition: 0.3s; }
        .strike-zone { display: none; width: 90%; gap: 10px; position: absolute; bottom: 30px; left: 5%; }
        .active #sig { color: white; text-shadow: 0 0 30px #00ff88; }
        .btn-yes { flex: 2; background: #00ff88; color: black; padding: 25px; border-radius: 15px; font-size: 30px; font-weight: 900; border: none; }
        .btn-no { flex: 1; background: #161b22; color: white; padding: 25px; border-radius: 15px; border: 1px solid #30363d; }
    </style>
</head>
<body>
    <div class="header">
        <div style="color:#00ff88; font-weight:900;">ZYMOSTAR 1S</div>
        <div id="balance">$0.00</div>
    </div>

    <div class="terminal" id="main">
        <div id="mkt-label" style="color:#58a6ff; font-size:12px; letter-spacing:2px;">SCANNING REEF...</div>
        <div id="sig">WAIT</div>
        <div class="strike-zone" id="strike-ui">
            <button class="btn-yes" onclick="executeStrike()">YES</button>
            <button class="btn-no" onclick="reset()">NO</button>
        </div>
    </div>

    <script>
        const APP_ID = "{{ app_id }}";
        const TOKEN = "{{ token }}";
        const markets = {{ markets|tojson }};
        let ws, currentMkt = "";

        function connect() {
            ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${APP_ID}`);
            ws.onopen = () => ws.send(JSON.stringify({ authorize: TOKEN }));
            ws.onmessage = (e) => {
                const r = JSON.parse(e.data);
                if (r.authorize) document.getElementById('balance').innerText = "$" + r.authorize.balance;
            };
        }

        // Automatic Market Switching & Signal Logic
        function startAutomation() {
            const syms = Object.keys(markets);
            let i = 0;
            setInterval(() => {
                currentMkt = syms[i];
                document.getElementById('mkt-label').innerText = "LOCK: " + markets[currentMkt];
                
                // Zion Logic: Randomly simulates the AI finding a 95% Signal
                if(Math.random() > 0.9) {
                    document.getElementById('sig').innerText = "STRIKE";
                    document.getElementById('main').classList.add('active');
                    document.getElementById('strike-ui').style.display = "flex";
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Press Yes for " + markets[currentMkt]));
                }
                i = (i + 1) % syms.length;
            }, 5000);
        }

        function executeStrike() {
            ws.send(JSON.stringify({
                buy: 1, price: 100,
                parameters: { amount: 1, basis: "stake", contract_type: "DIGITDIFF", 
                currency: "USD", duration: 1, duration_unit: "t", symbol: currentMkt }
            }));
            reset();
        }

        function reset() {
            document.getElementById('main').classList.remove('active');
            document.getElementById('sig').innerText = "WAIT";
            document.getElementById('strike-ui').style.display = "none";
        }

        connect();
        startAutomation();
    </script>
</body>
</html>
"""

# --- ROUTES ---
@app.route('/', methods=['GET', 'POST'])
def gatekeeper():
    if request.method == 'POST':
        if request.form.get('pw') == MASTER_PASSWORD:
            session['authorized'] = True
            return redirect(url_for('terminal'))
    return render_template_string(LOGIN_HTML)

@app.route('/terminal')
def terminal():
    if not session.get('authorized'):
        return redirect(url_for('gatekeeper'))
    return render_template_string(MAIN_TERMINAL_HTML, app_id=MY_APP_ID, token=MY_TOKEN, markets=MARKETS)

if __name__ == '__main__':
    app.run(debug=True)
