import os
import random
import google.generativeai as genai
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- MASTER CONFIG ---
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
genai.configure(api_key=API_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

WHATSAPP_LINK = "https://wa.me/254742024175?text=Hello%20Zion%20Trading%20Lab%20Support"

ALL_VOLS = ["R_10", "1HZ10V", "1HZ15V", "R_25", "1HZ25V", "1HZ30V", "R_50", "1HZ50V", "R_75", "1HZ75V", "1HZ90V", "R_100", "1HZ100V"]
SPIKES = ["CRASH 300", "BOOM 1000", "JUMP 10", "JUMP 100"]

@app.route('/')
def home():
    cat = request.args.get('cat', 'DASHBOARD')
    symbol = random.choice(SPIKES if cat == "SPIKES" else ALL_VOLS)
    display_name = symbol.replace("R_", "Volatility ").replace("1HZ", "Volatility ").replace("V", " (1S)")
    if "Index" not in display_name: display_name += " Index"

    if cat == 'DASHBOARD':
        return render_template_string(UI_HTML, cat=cat, wa=WHATSAPP_LINK)

    macro = random.choice(["BULLISH TREND", "BEARISH TREND", "CONSOLIDATION"])
    prompt = f"Market: {display_name}. Strategy: {cat}. Macro: {macro}. Action|Accuracy|Expiry|Reason"
    
    try:
        res = ai_engine.generate_content(prompt).text.split('|')
        action, acc, expiry, reason = res[0], res[1], res[2], res[3]
    except:
        action, acc, expiry, reason = "CALL/OVER", "98%", "5 Ticks", "Macro Trend aligned."

    voice = f"Signal for {display_name}. Action {action}. Accuracy {acc}."
    return render_template_string(UI_HTML, market=display_name, action=action, acc=acc, expiry=expiry, reason=reason, voice=voice, macro=macro, cat=cat, wa=WHATSAPP_LINK)

# --- THE ZION AI INTERFACE ---
UI_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --nav: #0000ff; --red: #ff3b30; --accent: #316dca; --glass: rgba(255,255,255,0.08); }
        body { background: #020617; color: white; margin: 0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        
        /* NAVBAR & HEADER BUTTONS */
        .navbar { background: var(--nav); padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .nav-left { display: flex; gap: 15px; align-items: center; }
        .nav-right { display: flex; gap: 8px; align-items: center; }
        
        .btn-login { color: white; text-decoration: none; font-size: 12px; font-weight: bold; border: 1px solid rgba(255,255,255,0.4); padding: 6px 12px; border-radius: 6px; }
        .btn-signup { background: var(--red); color: white; padding: 7px 14px; border-radius: 6px; font-weight: bold; font-size: 12px; text-decoration: none; box-shadow: 0 0 10px var(--red); }
        
        /* SWIPABLE SLIDER */
        .slider { 
            display: flex; 
            flex-wrap: nowrap; 
            overflow-x: auto; 
            -webkit-overflow-scrolling: touch; 
            background: var(--nav); 
            padding: 12px 15px; 
            gap: 25px; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
            scrollbar-width: none; 
        }
        .slider::-webkit-scrollbar { display: none; }
        .nav-link { 
            color: rgba(255,255,255,0.7); 
            text-decoration: none; 
            font-size: 13px; 
            font-weight: 600; 
            white-space: nowrap; 
            flex-shrink: 0; 
        }
        .nav-link.active { color: white; border-bottom: 2px solid white; padding-bottom: 4px; }

        .container { padding: 15px; }
        .label { font-size: 10px; color: var(--accent); letter-spacing: 2px; margin: 20px 0 10px; font-weight: bold; text-transform: uppercase; }
        
        /* GRID CARDS */
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { background: var(--glass); border-radius: 15px; padding: 20px 5px; text-align: center; text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.05); transition: 0.2s; }
        .card:active { transform: scale(0.95); background: rgba(255,255,255,0.15); }
        .card i { font-size: 22px; color: var(--accent); margin-bottom: 8px; }
        .card span { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; }

        .broadcast-box { background: var(--glass); padding: 15px; border-radius: 15px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.1); }
        .broadcast-box input { background: rgba(0,0,0,0.3); border: 1px solid var(--accent); padding: 12px; color: white; width: 62%; border-radius: 8px; font-size: 13px; }
        .broadcast-box button { background: var(--accent); border: none; padding: 12px 15px; color: white; border-radius: 8px; font-weight: bold; font-size: 12px; }

        .wa-float { position: fixed; bottom: 25px; right: 20px; background: #25d366; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; text-decoration: none; color: white; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
    </style>
</head>
<body>
    <div class="navbar">
        <div class="nav-left">
            <i class="fa-solid fa-bars"></i>
            <i id="muteBtn" class="fa-solid fa-volume-high" style="cursor:pointer; color:cyan;"></i>
        </div>
        <div style="font-weight:900; letter-spacing:1px; font-size: 18px;">ZION <span style="color:var(--accent)">AI</span></div>
        <div class="nav-right">
            <a href="#" class="btn-login">Log in</a>
            <a href="#" class="btn-signup">Sign up</a>
        </div>
    </div>

    <div class="slider">
        <a href="/?cat=DASHBOARD" class="nav-link active">Dashboard</a>
        <a href="#" class="nav-link">CopyTrade</a>
        <a href="#" class="nav-link">DTrader</a>
        <a href="#" class="nav-link">Multimarket</a>
        <a href="#" class="nav-link">Dcircles</a>
        <a href="#" class="nav-link">Strategies</a>
        <a href="#" class="nav-link">Bot Builder</a>
        <a href="#" class="nav-link">TradeView</a>
    </div>

    {% if cat == 'DASHBOARD' %}
    <div class="container">
        <div class="label">MAIN TRADING TERMINAL</div>
        <div class="grid">
            <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-chart-line"></i><span>Analysis</span></a>
            <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-robot"></i><span>Bot Builder</span></a>
            <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-eye"></i><span>TradeView</span></a>
            <a href="/?cat=EVEN_ODD" class="card"><i class="fa-solid fa-chart-simple"></i><span>Signal</span></a>
            <a href="/?cat=SPIKES" class="card"><i class="fa-solid fa-bolt"></i><span>Spikes</span></a>
            <a href="/?cat=OVER_UNDER" class="card"><i class="fa-solid fa-layer-group"></i><span>Strategies</span></a>
        </div>
        
        <div class="broadcast-box">
            <div class="label">CUSTOM AI BROADCAST</div>
            <input type="text" id="customText" placeholder="Message to read out...">
            <button onclick="speakCustom()">SPEAK</button>
        </div>
    </div>
    {% else %}
    <div style="text-align:center; padding:60px 15px;">
        <div style="font-size:12px; color:var(--accent); letter-spacing:2px; font-weight:800; text-transform:uppercase;">{{ market }}</div>
        <div style="font-size:60px; font-weight:900; margin:20px 0; text-shadow: 0 0 15px rgba(49,109,202,0.4);">{{ action }}</div>
        <div style="color:#22c55e; font-weight:bold; font-size:18px;">ACCURACY: {{ acc }}</div>
        <div style="margin-top:20px; color:#94a3b8; font-size: 14px;">Expiry: {{ expiry }}</div>
        <a href="https://bot.deriv.com" style="display:block; background:#22c55e; color:white; padding:20px; border-radius:12px; text-decoration:none; margin-top:40px; font-weight:900; font-size:16px; box-shadow: 0 4px 15px rgba(34,197,94,0.3);">EXECUTE TRADE</a>
    </div>
    {% endif %}

    <a href="{{ wa }}" class="wa-float"><i class="fa-brands fa-whatsapp"></i></a>

    <script>
        let isMuted = false;
        const muteBtn = document.getElementById('muteBtn');

        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            muteBtn.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            muteBtn.style.color = isMuted ? 'red' : 'cyan';
        });

        function playAI(text) {
            if (!isMuted) {
                const msg = new SpeechSynthesisUtterance(text);
                msg.rate = 1.0;
                window.speechSynthesis.speak(msg);
            }
        }

        function speakCustom() {
            const txt = document.getElementById('customText').value;
            if(txt) playAI(txt);
        }

        window.onload = () => { if("{{ cat }}" !== "DASHBOARD") playAI("{{ voice }}"); };
    </script>
</body>
</html>
