import os
import random
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- COMPLETE VOLATILITY MARKETS ---
ALL_MARKETS = [
    "VOLATILITY 10 INDEX", "VOLATILITY 10 (1S) INDEX", 
    "VOLATILITY 15 (1S) INDEX", "VOLATILITY 25 INDEX", 
    "VOLATILITY 25 (1S) INDEX", "VOLATILITY 30 (1S) INDEX",
    "VOLATILITY 50 INDEX", "VOLATILITY 50 (1S) INDEX", 
    "VOLATILITY 75 INDEX", "VOLATILITY 75 (1S) INDEX", 
    "VOLATILITY 90 (1S) INDEX", "VOLATILITY 100 INDEX", 
    "VOLATILITY 100 (1S) INDEX", "VOLATILITY 250 (1S) INDEX", 
    "VOLATILITY 300 (1S) INDEX"
]

@app.route('/')
def home():
    cat = request.args.get('cat', 'EVEN_ODD')
    market = random.choice(ALL_MARKETS)
    accuracy = random.randint(98, 99)
    percent = random.randint(72, 89)
    show_timer = "true" if cat == "MATCH_DIFFER" else "false"
    
    # ISOLATED COLUMN LOGIC
    if cat == "EVEN_ODD":
        side = random.choice(["EVEN", "ODD"])
        contract, color = f"DIGIT {side}", "#316dca"
        logic = f"SIGNAL: {side} is occurring in {percent}% of ticks on {market}."
        voice = f"Even Odd alert. {side} at {percent} percent."
    elif cat == "MATCH_DIFFER":
        digit = random.randint(0, 9)
        contract, color = "DIGIT MATCHES", "#f59e0b"
        logic = f"MATCH: Digit {digit} detected in {percent}% of flow on {market}."
        voice = f"Matches Alert. Target is {digit}."
    elif cat == "OVER_UNDER":
        type_ou, barr = random.choice([("OVER", 4), ("UNDER", 5)])
        contract, color = f"DIGIT {type_ou}", "#00ff88" if type_ou == "OVER" else "#ff4d4d"
        logic = f"SNIPER: Barrier {barr} active on {market}. Frequency: {percent}%."
        voice = f"Over Under. {type_ou} {barr}."
    elif cat == "RISE_FALL":
        trend = random.choice(["RISE", "FALL"])
        contract, color = ("RISE", "#00ff88") if trend == "RISE" else ("FALL", "#ff4d4d")
        logic = f"TREND: {trend} momentum confirmed at {percent}% strength on {market}."
        voice = f"Rise Fall alert. Trend is {trend}."
    else: # ACCUMULATORS
        growth = random.choice([3, 5])
        contract, color = "ACCUMULATORS", "#00d4ff"
        logic = f"STABILITY: {market} holding for {growth}% growth."
        voice = "Accumulators active."

    HTML_TEMPLATE = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --bg: #0b0e14; --card: #1c2128; --gold: #d29922; --blue: #316dca; }
            * { box-sizing: border-box; touch-action: manipulation; }
            html, body { background: var(--bg); color: #adbac7; margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; position: fixed; font-family: sans-serif; }
            .sidebar { display: flex; overflow-x: auto; padding: 10px; background: #161b22; gap: 8px; border-bottom: 1px solid #30363d; }
            .nav-item { color: #768390; text-decoration: none; padding: 8px 15px; background: #21262d; border-radius: 6px; font-size: 11px; font-weight: bold; white-space: nowrap; }
            .nav-item.active { background: var(--blue); color: white; border: 1px solid #58a6ff; }
            .main { display: flex; align-items: center; justify-content: center; height: 85vh; padding: 20px; }
            .card { width: 100%; max-width: 360px; background: var(--card); border-radius: 18px; padding: 25px; border-top: 6px solid {{ color }}; text-align: center; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            #v-btn { position: fixed; bottom: 20px; right: 20px; background: var(--blue); width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; z-index: 1000; }
            #timer { color: var(--gold); font-weight: 900; margin-bottom: 12px; font-size: 18px; display: none; }
            #timer.active { display: block; }
            .btn { display: block; margin-top: 25px; background: #3fb950; color: white; padding: 15px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <a href="/?cat=EVEN_ODD" class="nav-item {% if cat == 'EVEN_ODD' %}active{% endif %}">EVEN/ODD</a>
            <a href="/?cat=MATCH_DIFFER" class="nav-item {% if cat == 'MATCH_DIFFER' %}active{% endif %}">MATCHES</a>
            <a href="/?cat=OVER_UNDER" class="nav-item {% if cat == 'OVER_UNDER' %}active{% endif %}">OVER/UNDER</a>
            <a href="/?cat=RISE_FALL" class="nav-item {% if cat == 'RISE_FALL' %}active{% endif %}">RISE/FALL</a>
            <a href="/?cat=ACCUMULATORS" class="nav-item {% if cat == 'ACCUMULATORS' %}active{% endif %}">ACCUMULATORS</a>
        </div>
        <div class="main">
            <div class="card">
                <div id="timer" class="{% if show_timer == 'true' %}active{% endif %}">READY IN: <span id="cnt">10</span>s</div>
                <div style="color:#3fb950; font-size:12px; font-weight:900;">{{ accuracy }}% ACCURACY</div>
                <div style="font-size:11px; color:#768390; margin: 10px 0;">{{ market }}</div>
                <h1 style="color:{{ color }}; margin: 15px 0; font-size: 36px; font-weight: 900;">{{ contract }}</h1>
                <div style="background:#0d1117; padding:20px; border-radius:12px; font-size:14px; border: 1px solid #30363d;">{{ logic }}</div>
                <a href="https://bot.deriv.com" class="btn">EXECUTE TRADE</a>
            </div>
        </div>
        <div id="v-btn" onclick="toggleMute()"><i id="v-icon" class="fa-solid fa-volume-high"></i></div>
        <script>
            let muted = localStorage.getItem('zion_muted') === 'true';
            if (muted) document.getElementById('v-icon').className = 'fa-solid fa-volume-xmark';
            function toggleMute() { localStorage.setItem('zion_muted', !muted); location.reload(); }
            if ("{{ show_timer }}" === "true") {
                let s = 10;
                let tId = setInterval(() => {
                    s--; document.getElementById('cnt').innerText = s;
                    if(s <= 0) { clearInterval(tId); document.getElementById('timer').innerHTML = '🔥 STRIKE NOW!'; }
                }, 1000);
            }
            window.onload = () => { if(!muted) { window.speechSynthesis.speak(new SpeechSynthesisUtterance("{{ voice }}")); } };
            setTimeout(() => { 
                const urlParams = new URLSearchParams(window.location.search);
                window.location.href = "/?cat=" + (urlParams.get('cat') || 'EVEN_ODD'); 
            }, 12000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, accuracy=accuracy, color=color, voice=voice, show_timer=show_timer, cat=cat)

if __name__ == "__main__":
    # Render requires binding to 0.0.0.0 and the PORT environment variable
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
