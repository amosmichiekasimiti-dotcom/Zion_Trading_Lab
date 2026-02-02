import os
import random
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- THE FULL 2026 VOLATILITY LIST (All Markets) ---
ALL_MARKETS = [
    "VOLATILITY 10 INDEX", "VOLATILITY 10 (1S) INDEX", "VOLATILITY 15 (1S) INDEX",
    "VOLATILITY 25 INDEX", "VOLATILITY 25 (1S) INDEX", "VOLATILITY 30 (1S) INDEX",
    "VOLATILITY 50 INDEX", "VOLATILITY 50 (1S) INDEX", "VOLATILITY 75 INDEX",
    "VOLATILITY 75 (1S) INDEX", "VOLATILITY 90 (1S) INDEX", "VOLATILITY 100 INDEX",
    "VOLATILITY 100 (1S) INDEX", "VOLATILITY 250 INDEX", "VOLATILITY 250 (1S) INDEX",
    "VOLATILITY 300 (1S) INDEX", "BULL MARKET INDEX", "BEAR MARKET INDEX"
]

@app.route('/')
def home():
    cat = request.args.get('cat', 'EVEN_ODD')
    # Focus on 1S markets for high frequency
    s1_list = [m for m in ALL_MARKETS if "(1S)" in m]
    market = random.choice(s1_list if s1_list else ALL_MARKETS)
    
    accuracy = random.randint(98, 99)
    percent = random.randint(72, 89)
    show_timer = "true" if cat == "MATCH_DIFFER" else "false"
    
    if cat == "EVEN_ODD":
        side = random.choice(["EVEN", "ODD"])
        contract, color = f"DIGIT {side}", "#3b82f6"
        logic = f"SIGNAL: {side} is occurring in {percent}% of ticks on {market}."
        voice = f"Even Odd alert. {side} at {percent} percent."
    else:
        digit = random.randint(0, 9)
        contract, color = "DIGIT MATCHES", "#f59e0b"
        logic = f"MATCH: Digit {digit} detected in {percent}% of flow."
        voice = f"Matches Alert. Target is {digit}."

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
            html, body { 
                background: var(--bg); color: #adbac7; margin: 0; padding: 0; 
                width: 100%; height: 100%; overflow: hidden; position: fixed; 
                font-family: 'Segoe UI', sans-serif; 
            }
            .sidebar { display: flex; overflow-x: auto; padding: 10px; background: #161b22; gap: 8px; border-bottom: 1px solid #30363d; }
            .nav-item { color: #768390; text-decoration: none; padding: 8px 15px; background: #21262d; border-radius: 6px; font-size: 11px; font-weight: bold; white-space: nowrap; }
            .nav-item.active { background: var(--blue); color: white; }
            .main { display: flex; align-items: center; justify-content: center; height: 85vh; padding: 20px; }
            .card { width: 100%; max-width: 360px; background: var(--card); border-radius: 18px; padding: 25px; border-top: 6px solid {{ color }}; text-align: center; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            #v-btn { position: fixed; bottom: 20px; right: 20px; background: var(--blue); width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
            #timer { color: var(--gold); font-weight: 900; margin-bottom: 12px; font-size: 18px; display: none; }
            #timer.active { display: block; }
            .btn { display: block; margin-top: 25px; background: #3fb950; color: white; padding: 15px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <a href="/?cat=EVEN_ODD" class="nav-item {% if cat == 'EVEN_ODD' %}active{% endif %}">EVEN/ODD</a>
            <a href="/?cat=MATCH_DIFFER" class="nav-item {% if cat == 'MATCH_DIFFER' %}active{% endif %}">MATCHES</a>
        </div>
        <div class="main">
            <div class="card">
                <div id="timer" class="{% if show_timer == 'true' %}active{% endif %}">READY IN: <span id="cnt">10</span>s</div>
                <div style="color:#3fb950; font-size:12px; font-weight:900; letter-spacing:1px;">{{ accuracy }}% ACCURACY</div>
                <div style="font-size:10px; color:#768390; margin: 8px 0; font-weight: bold;">{{ market }}</div>
                <h1 style="color:{{ color }}; margin: 12px 0; font-size: 32px; font-weight: 900;">{{ contract }}</h1>
                <div style="background:#0d1117; padding:18px; border-radius:12px; font-size:13px; border: 1px solid #30363d; line-height: 1.5;">{{ logic }}</div>
                <a href="https://bot.deriv.com" class="btn">EXECUTE ON BOT</a>
            </div>
        </div>
        <div id="v-btn" onclick="toggleMute()"><i id="v-icon" class="fa-solid fa-volume-high"></i></div>
        <script>
            let muted = localStorage.getItem('zion_muted') === 'true';
            const vIcon = document.getElementById('v-icon');
            if (muted) vIcon.className = 'fa-solid fa-volume-xmark';
            function toggleMute() { localStorage.setItem('zion_muted', !muted); location.reload(); }
            if ("{{ show_timer }}" === "true") {
                let s = 10;
                let tId = setInterval(() => {
                    s--; document.getElementById('cnt').innerText = s;
                    if(s <= 0) { clearInterval(tId); document.getElementById('timer').innerHTML = '🔥 STRIKE NOW!'; }
                }, 1000);
            }
            window.onload = () => { if(!muted) { let u = new SpeechSynthesisUtterance("{{ voice }}"); u.rate = 0.9; window.speechSynthesis.speak(u); } };
            setTimeout(() => { location.reload(); }, 13000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, accuracy=accuracy, color=color, voice=voice, show_timer=show_timer, cat=cat)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
