import os, random
import google.generativeai as genai
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- MASTER CONFIG ---
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
genai.configure(api_key=API_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"

# RESTORED VOLATILITIES (Including 15 and all 1S markers)
VOLS = ["R_10", "1HZ10V", "1HZ15V", "R_25", "1HZ25V", "1HZ30V", "R_50", "1HZ50V", "R_75", "1HZ75V", "1HZ90V", "R_100", "1HZ100V"]

@app.route('/')
def home():
    cat = request.args.get('cat', 'DASHBOARD')
    symbol = random.choice(VOLS)
    
    # Format name specifically for 1S markets
    market = symbol.replace("R_", "Volatility ").replace("1HZ", "Volatility ").replace("V", " (1S)")
    if "Index" not in market: market += " Index"
    
    if cat == 'DASHBOARD':
        return render_template_string(UI_HTML, cat=cat, wa=WHATSAPP)

    # Signal Logic with Percentages
    action = random.choice(["CALL", "PUT"])
    acc = f"{random.randint(94, 98)}%"
    voice_msg = f"Signal for {market}. Action {action}. Accuracy {acc}."
    
    return render_template_string(UI_HTML, market=market, action=action, acc=acc, voice=voice_msg, cat=cat, wa=WHATSAPP)

UI_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --nav: #0000ff; --red: #ff3b30; --accent: #316dca; --glass: rgba(255,255,255,0.08); }
        body { background: #020617; color: white; margin: 0; font-family: sans-serif; overflow-x: hidden; }
        .navbar { background: var(--nav); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .nav-controls { display: flex; gap: 35px; align-items: center; } /* 35px gap for safe touching */
        .btn-signup { background: var(--red); color: white; padding: 7px 14px; border-radius: 6px; font-weight: bold; font-size: 11px; text-decoration: none; }
        .slider { display: flex; overflow-x: auto; background: var(--nav); padding: 12px 15px; gap: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); scrollbar-width: none; }
        .slider::-webkit-scrollbar { display: none; }
        .nav-link { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 13px; font-weight: 600; white-space: nowrap; }
        .nav-link.active { color: white; border-bottom: 2px solid white; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 15px; }
        .card { background: var(--glass); border-radius: 12px; padding: 18px 5px; text-align: center; text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.05); }
        .card i { font-size: 20px; color: var(--accent); margin-bottom: 8px; }
        .card span { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; }
        .broadcast { background: var(--glass); padding: 15px; border-radius: 15px; margin: 15px; border: 1px solid rgba(255,255,255,0.1); }
        .broadcast input { background: rgba(0,0,0,0.3); border: 1px solid var(--accent); padding: 10px; color: white; width: 62%; border-radius: 8px; }
        .wa-float { position: fixed; bottom: 25px; right: 20px; background: #25d366; width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; text-decoration: none; color: white; }
    </style>
</head>
<body>
    <div class="navbar">
        <div class="nav-controls">
            <i class="fa-solid fa-bars" style="font-size: 22px; margin-left: 5px;"></i>
            <i id="muteBtn" class="fa-solid fa-volume-high" style="color:cyan; font-size: 22px; cursor:pointer;"></i>
        </div>
        <div style="font-weight:900; font-size: 18px;">ZION <span style="color:var(--accent)">AI</span></div>
        <a href="#" class="btn-signup">Sign up</a>
    </div>
    <div class="slider">
        <a href="/?cat=DASHBOARD" class="nav-link active">Dashboard</a>
        <a href="#" class="nav-link">CopyTrade</a>
        <a href="#" class="nav-link">DTrader</a>
        <a href="#" class="nav-link">Multimarket</a>
        <a href="#" class="nav-link">Dcircles</a>
        <a href="#" class="nav-link">Strategies</a>
    </div>
    {% if cat == 'DASHBOARD' %}
    <div class="grid">
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-house"></i><span>Dashboard</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-robot"></i><span>Bot Builder</span></a>
        <a href="/?cat=EVEN_ODD" class="card"><i class="fa-solid fa-chart-simple"></i><span>Signal</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-magnifying-glass-chart"></i><span>Analysis</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-eye"></i><span>TradeView</span></a>
        <a href="/?cat=EVEN_ODD" class="card"><i class="fa-solid fa-brain"></i><span>Bots</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-chart-area"></i><span>Charts</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-users"></i><span>CopyTrade</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-bolt"></i><span>DTrader</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-globe"></i><span>MultiMarket</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-layer-group"></i><span>Markets</span></a>
        <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-circle-nodes"></i><span>D-circles</span></a>
        <a href="/?cat=OVER_UNDER" class="card"><i class="fa-solid fa-wand-magic-sparkles"></i><span>Strategies</span></a>
    </div>
    <div class="broadcast">
        <div style="font-size:10px; color:var(--accent); margin-bottom:10px; font-weight:bold;">AI VOICE BROADCAST</div>
        <input type="text" id="customText" placeholder="Broadcast message...">
        <button onclick="speakCustom()" style="background:var(--accent); border:none; color:white; padding:10px; border-radius:8px; font-weight:bold;">SPEAK</button>
    </div>
    {% else %}
    <div style="text-align:center; padding:60px 15px;">
        <div style="font-size:11px; color:var(--accent); text-transform:uppercase; font-weight:800;">{{ market }}</div>
        <div style="font-size:55px; font-weight:900; margin:15px 0;">{{ action }}</div>
        <div style="color:#22c55e; font-weight:bold; font-size:16px;">ACCURACY: {{ acc }}</div>
        <a href="https://bot.deriv.com" style="display:block; background:#22c55e; color:white; padding:18px; border-radius:10px; text-decoration:none; margin-top:35px; font-weight:900;">EXECUTE</a>
    </div>
    {% endif %}
    <a href="{{ wa }}" class="wa-float"><i class="fa-brands fa-whatsapp"></i></a>
    <script>
        let muted = false;
        function playAI(t) { if (!muted) { window.speechSynthesis.speak(new SpeechSynthesisUtterance(t)); } }
        function speakCustom() { const t = document.getElementById('customText').value; if(t) playAI(t); }
        document.getElementById('muteBtn').onclick = function() { 
            muted = !muted; this.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'; this.style.color = muted ? 'red' : 'cyan';
        };
        window.onload = () => { if("{{ cat }}" !== "DASHBOARD") playAI("{{ voice }}"); };
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
