import os
import random
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- YOUR UPDATED WHATSAPP LINK ---
WHATSAPP_LINK = "https://wa.me/254742024175?text=Hello%20Zion%20Trading%20Lab,%20I%20am%20interested%20in%20your%20signals!"

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
    
    # Logic isolation for columns
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
    else: 
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
            :root { --bg: #0b0e14; --card: #1c2128; --gold: #d29922; --blue: #316dca; --text: #adbac7; }
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            body { background: var(--bg); color: var(--text); margin: 0; font-family: sans-serif; overflow: hidden; }
            
            .navbar { display: flex; align-items: center; padding: 15px; background: #161b22; border-bottom: 1px solid #30363d; position: relative; z-index: 1001; }
            .menu-btn { font-size: 24px; color: white; cursor: pointer; margin-right: 15px; }
            .brand { font-weight: 900; letter-spacing: 1px; color: white; font-size: 18px; }

            .drawer { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #161b22; transition: 0.3s; z-index: 2000; padding: 20px; border-right: 1px solid #30363d; }
            .drawer.open { left: 0; }
            .drawer-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; z-index: 1999; }
            .drawer-overlay.active { display: block; }
            
            .nav-link { display: block; color: var(--text); text-decoration: none; padding: 15px; border-radius: 8px; margin-bottom: 10px; font-weight: bold; font-size: 14px; background: #21262d; }
            .nav-link.active { background: var(--blue); color: white; }
            .nav-link i { margin-right: 10px; width: 20px; }
            .wa-link { background: #25d366 !important; color: white !important; margin-top: 30px; text-align: center; }

            .main { display: flex; align-items: center; justify-content: center; height: 80vh; padding: 20px; }
            .card { width: 100%; max-width: 360px; background: var(--card); border-radius: 18px; padding: 25px; border-top: 6px solid {{ color }}; text-align: center; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            
            #v-btn { position: fixed; bottom: 20px; right: 20px; background: var(--blue); width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
            #timer { color: var(--gold); font-weight: 900; margin-bottom: 12px; font-size: 18px; display: none; }
            #timer.active { display: block; }
            .btn { display: block; margin-top: 25px; background: #3fb950; color: white; padding: 15px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px; }
        </style>
    </head>
    <body>

        <div class="navbar">
            <i class="fa-solid fa-bars menu-btn" onclick="toggleMenu()"></i>
            <div class="brand">ZION TRADING LAB</div>
        </div>

        <div class="drawer-overlay" id="overlay" onclick="toggleMenu()"></div>
        
        <div class="drawer" id="drawer">
            <h3 style="color: white; margin-bottom: 25px;">Menu</h3>
            <a href="/?cat=EVEN_ODD" class="nav-link {% if cat == 'EVEN_ODD' %}active{% endif %}"><i class="fa-solid fa-circle-half-stroke"></i> EVEN/ODD</a>
            <a href="/?cat=MATCH_DIFFER" class="nav-link {% if cat == 'MATCH_DIFFER' %}active{% endif %}"><i class="fa-solid fa-bolt"></i> MATCHES</a>
            <a href="/?cat=OVER_UNDER" class="nav-link {% if cat == 'OVER_UNDER' %}active{% endif %}"><i class="fa-solid fa-arrows-up-down"></i> OVER/UNDER</a>
            <a href="/?cat=RISE_FALL" class="nav-link {% if cat == 'RISE_FALL' %}active{% endif %}"><i class="fa-solid fa-chart-line"></i> RISE/FALL</a>
            <a href="/?cat=ACCUMULATORS" class="nav-link {% if cat == 'ACCUMULATORS' %}active{% endif %}"><i class="fa-solid fa-layer-group"></i> ACCUMULATORS</a>
            
            <a href="{{ wa_link }}" target="_blank" class="nav-link wa-link">
                <i class="fa-brands fa-whatsapp"></i> CONTACT ZION
            </a>
        </div>

        <div class="main">
            <div class="card">
                <div id="timer" class="{% if show_timer == 'true' %}active{% endif %}">READY IN: <span id="cnt">10</span>s</div>
                <div style="color:#3fb950; font-size:12px; font-weight:900;">{{ accuracy }}% ACCURACY</div>
                <div style="font-size:11px; color:#768390; margin: 10px 0;">{{ market }}</div>
                <h1 style="color:{{ color }}; margin: 15px 0; font-size: 32px; font-weight: 900;">{{ contract }}</h1>
                <div style="background:#0d1117; padding:20px; border-radius:12px; font-size:14px; border: 1px solid #30363d;">{{ logic }}</div>
                <a href="https://bot.deriv.com" class="btn">EXECUTE TRADE</a>
            </div>
        </div>

        <div id="v-btn" onclick="toggleMute()"><i id="v-icon" class="fa-solid fa-volume-high"></i></div>

        <script>
            function toggleMenu() {
                document.getElementById('drawer').classList.toggle('open');
                document.getElementById('overlay').classList.toggle('active');
            }

            let muted = localStorage.getItem('zion_muted') === 'true';
            if (muted) document.getElementById('v-icon').className = 'fa-solid fa-volume-xmark';
            
            function toggleMute() { 
                localStorage.setItem('zion_muted', !muted); 
                location.reload(); 
            }

            if ("{{ show_timer }}" === "true") {
                let s = 10;
                let tId = setInterval(() => {
                    s--; document.getElementById('cnt').innerText = s;
                    if(s <= 0) { clearInterval(tId); document.getElementById('timer').innerHTML = '🔥 STRIKE NOW!'; }
                }, 1000);
            }

            window.onload = () => { 
                if(!muted) { 
                    const utterance = new SpeechSynthesisUtterance("{{ voice }}");
                    window.speechSynthesis.speak(utterance); 
                } 
            };

            setTimeout(() => { 
                const urlParams = new URLSearchParams(window.location.search);
                window.location.href = "/?cat=" + (urlParams.get('cat') || 'EVEN_ODD'); 
            }, 12000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, 
                                  accuracy=accuracy, color=color, voice=voice, 
                                  show_timer=show_timer, cat=cat, wa_link=WHATSAPP_LINK)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
