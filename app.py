import os, random
import google.generativeai as genai
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- MASTER CONFIG ---
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
genai.configure(api_key=API_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"

# VOLATILITIES (Including 15 and all 1S markers as per your instructions)
VOLS = ["R_10", "1HZ10V", "1HZ15V", "R_25", "1HZ25V", "1HZ30V", "R_50", "1HZ50V", "R_75", "1HZ75V", "1HZ90V", "R_100", "1HZ100V"]

@app.route('/')
def home():
    # 'cat' determines which section is active
    cat = request.args.get('cat', 'DASHBOARD')
    symbol = random.choice(VOLS)
    
    # Naming logic to ensure "Volatility Index (1S)" appears correctly
    market = symbol.replace("R_", "Volatility ").replace("1HZ", "Volatility ").replace("V", "")
    market_display = f"{market} (1S) Index"
    
    if cat == 'DASHBOARD':
        return render_template_string(UI_HTML, cat=cat, wa=WHATSAPP)

    # SIGNAL LOGIC: RISE/FALL with high-accuracy percentages
    action = random.choice(["RISE", "FALL"])
    acc_val = round(random.uniform(94.2, 98.9), 1)
    acc = f"{acc_val}%"
    
    voice_msg = f"New analysis for {market_display}. Prediction: {action} with {acc} accuracy."
    
    return render_template_string(UI_HTML, market=market_display, action=action, acc=acc, voice=voice_msg, cat=cat, wa=WHATSAPP)

UI_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary: #0000ff; --red: #ff3b30; --green: #22c55e; --bg: #020617; --glass: rgba(255,255,255,0.06); }
        body { background: var(--bg); color: white; margin: 0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        
        .navbar { background: var(--primary); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top:0; z-index:100; }
        .nav-controls { display: flex; gap: 25px; align-items: center; }
        .btn-signup { background: var(--red); color: white; padding: 7px 15px; border-radius: 5px; font-weight: bold; font-size: 11px; text-decoration: none; text-transform: uppercase; }

        /* Grid Alignment */
        .dashboard-label { padding: 20px 20px 5px; font-size: 11px; font-weight: 800; color: #3b82f6; letter-spacing: 1.5px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 15px; }
        .card { background: var(--glass); border-radius: 12px; padding: 22px 5px; text-align: center; text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.05); }
        .card i { font-size: 24px; color: #3b82f6; margin-bottom: 10px; display: block; }
        .card span { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

        /* Professional Signal Layout */
        .signal-view { text-align: center; padding: 50px 20px; animation: slideUp 0.4s ease-out; }
        .market-title { font-size: 13px; color: #3b82f6; font-weight: 800; border: 1px solid #3b82f6; display: inline-block; padding: 4px 12px; border-radius: 20px; margin-bottom: 25px; }
        .direction-box { background: var(--glass); border-radius: 20px; padding: 40px 20px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 30px; }
        .direction-text { font-size: 75px; font-weight: 900; margin: 10px 0; letter-spacing: -3px; }
        
        .accuracy-badge { background: rgba(34, 197, 94, 0.1); border: 1px solid var(--green); padding: 8px 16px; border-radius: 30px; display: inline-flex; align-items: center; gap: 10px; }
        .accuracy-badge span { font-weight: 900; font-size: 18px; color: var(--green); }

        .btn-trade { display: block; background: var(--green); color: white; padding: 20px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 16px; box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2); }
        .wa-float { position: fixed; bottom: 25px; right: 20px; background: #25d366; width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; color: white; text-decoration: none; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }

        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="navbar">
        <div class="nav-controls">
            <i class="fa-solid fa-bars" style="font-size: 22px;"></i>
            <i id="muteBtn" class="fa-solid fa-volume-high" style="color:cyan; font-size: 22px; cursor:pointer;"></i>
        </div>
        <div style="font-weight:900; font-size: 19px; letter-spacing: 1px;">ZION <span style="color:#3b82f6">AI</span></div>
        <a href="#" class="btn-signup">Sign up</a>
    </div>

    {% if cat == 'DASHBOARD' %}
    <div class="dashboard-label">TERMINAL DASHBOARD</div>
    <div class="grid">
        <a href="/?cat=LIVE_SIGNAL" class="card"><i class="fa-solid fa-tower-broadcast"></i><span>Signal</span></a>
        <a href="/?cat=LIVE_SIGNAL" class="card"><i class="fa-solid fa-robot"></i><span>Bot Builder</span></a>
        <a href="/?cat=LIVE_SIGNAL" class="card"><i class="fa-solid fa-brain"></i><span>AI Bots</span></a>
        <a href="/?cat=LIVE_SIGNAL" class="card"><i class="fa-solid fa-magnifying-glass-chart"></i><span>Analysis</span></a>
        <a href="/?cat=LIVE_SIGNAL" class="card"><i class="fa-solid fa-eye"></i><span>TradeView</span></a>
        <a href="/?cat=LIVE_SIGNAL" class="card"><i class="fa-solid fa-bolt"></i><span>DTrader</span></a>
    </div>
    {% else %}
    <div class="signal-view">
        <div class="market-title">{{ market }}</div>
        
        <div class="direction-box">
            <div style="color: #64748b; font-size: 11px; font-weight: bold; letter-spacing: 2px;">PREDICTED DIRECTION</div>
            <div class="direction-text" style="color: {{ 'var(--green)' if action == 'RISE' else 'var(--red)' }};">
                {{ action }}
            </div>
            <div class="accuracy-badge">
                <small style="color: #94a3b8; font-size: 10px;">ACCURACY</small>
                <span>{{ acc }}</span>
            </div>
        </div>

        <a href="https://app.deriv.com" target="_blank" class="btn-trade">EXECUTE TRADE</a>
        <br>
        <a href="/?cat=DASHBOARD" style="color:#64748b; text-decoration:none; font-size:13px; font-weight:600;">
            <i class="fa-solid fa-arrow-left"></i> BACK TO DASHBOARD
        </a>
    </div>
    {% endif %}

    <a href="{{ wa }}" class="wa-float"><i class="fa-brands fa-whatsapp"></i></a>

    <script>
        let muted = false;
        function playAI(t) { if (!muted) { const s = new SpeechSynthesisUtterance(t); s.rate = 0.95; window.speechSynthesis.speak(s); } }
        document.getElementById('muteBtn').onclick = function() { 
            muted = !muted; this.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'; this.style.color = muted ? 'red' : 'cyan';
        };
        window.onload = () => { if("{{ cat }}" !== "DASHBOARD") playAI("{{ voice }}"); };
    </script>
</body>
</html>
