import os, random, time
import google.generativeai as genai
from flask import Flask, render_template_string, request, jsonify

app = Flask(__name__)

# --- MASTER CONFIG ---
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
genai.configure(api_key=API_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"
VOLS = ["R_10", "1HZ10V", "1HZ15V", "R_25", "1HZ25V", "1HZ30V", "R_50", "1HZ50V", "R_75", "1HZ75V", "1HZ90V", "R_100", "1HZ100V"]

# Route to fetch new signal data without refreshing the page
@app.route('/get_signal')
def get_signal():
    symbol = random.choice(VOLS)
    market = symbol.replace("R_", "Volatility ").replace("1HZ", "Volatility ").replace("V", " (1S)") + " Index"
    
    action = random.choice(["CALL", "PUT", "MATCH", "DIFFERS"])
    strength = random.randint(90, 99)
    digit = random.randint(0, 9)
    
    insights = [
        "Strong bullish rejection at psychological support level.",
        "Bearish trend confirmed by RSI divergence on 1S chart.",
        "Digit pattern high frequency detected for target digit.",
        "Volatility breakout expected following tight consolidation.",
        "Price action shows clear momentum shift for a quick scalp."
    ]
    
    return jsonify(
        market=market, action=action, strength=f"{strength}%", 
        digit=digit, duration="5 Ticks", explain=random.choice(insights)
    )

@app.route('/')
def home():
    cat = request.args.get('cat', 'DASHBOARD')
    return render_template_string(UI_HTML, cat=cat, wa=WHATSAPP)

UI_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --nav: #0000ff; --red: #ff3b30; --green: #22c55e; --accent: #316dca; --glass: rgba(255,255,255,0.08); }
        body { background: #020617; color: white; margin: 0; font-family: sans-serif; overflow-x: hidden; }
        .navbar { background: var(--nav); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .nav-controls { display: flex; gap: 40px; align-items: center; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 15px; }
        .card { background: var(--glass); border-radius: 12px; padding: 18px 5px; text-align: center; text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.05); }
        .card i { font-size: 22px; color: var(--accent); margin-bottom: 8px; }
        .card span { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; }
        
        .signal-display { text-align: center; padding: 30px 15px; background: #0f172a; border-radius: 20px; margin: 15px; border: 1px solid var(--accent); }
        #action-text { font-size: 55px; font-weight: 900; margin: 5px 0; }
        .strength-bar { background: #334155; height: 8px; border-radius: 10px; margin: 15px 0; overflow: hidden; }
        #strength-fill { background: var(--green); height: 100%; width: 0%; transition: width 0.8s; }
        
        .explain-box { background: var(--glass); padding: 15px; border-radius: 10px; margin: 15px; font-size: 12px; border-left: 4px solid var(--accent); text-align: left; }
        .wa-float { position: fixed; bottom: 25px; right: 20px; background: #25d366; width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; text-decoration: none; color: white; z-index: 1000; }
    </style>
</head>
<body>
    <div class="navbar">
        <div class="nav-controls"><i class="fa-solid fa-bars" style="font-size: 22px;"></i><i id="muteBtn" class="fa-solid fa-volume-high" style="color:cyan; font-size: 22px; cursor:pointer;"></i></div>
        <div style="font-weight:900; font-size: 18px; letter-spacing:1px;">ZION <span style="color:var(--accent)">AI</span></div>
        <a href="#" style="background:var(--red); color:white; padding:7px 12px; border-radius:5px; text-decoration:none; font-size:11px; font-weight:bold;">Sign up</a>
    </div>

    {% if cat == 'DASHBOARD' %}
    <div class="grid">
        <a href="/?cat=SIGNAL" class="card"><i class="fa-solid fa-bolt"></i><span>Live Signal</span></a>
        <a href="#" class="card"><i class="fa-solid fa-robot"></i><span>Bot Builder</span></a>
        <a href="#" class="card"><i class="fa-solid fa-chart-simple"></i><span>Signal History</span></a>
        <a href="#" class="card"><i class="fa-solid fa-magnifying-glass-chart"></i><span>Analysis</span></a>
        <a href="#" class="card"><i class="fa-solid fa-eye"></i><span>TradeView</span></a>
        <a href="#" class="card"><i class="fa-solid fa-brain"></i><span>AI Logic</span></a>
        <a href="#" class="card"><i class="fa-solid fa-users"></i><span>CopyTrade</span></a>
        <a href="#" class="card"><i class="fa-solid fa-globe"></i><span>MultiMarket</span></a>
        <a href="#" class="card"><i class="fa-solid fa-circle-nodes"></i><span>D-circles</span></a>
    </div>
    {% else %}
    <div class="signal-display">
        <div id="m-name" style="color:var(--accent); font-weight:800; font-size:12px;">SCANNING...</div>
        <div id="action-text">--</div>
        <div id="digit-info" style="font-weight:bold; color:#94a3b8; margin-bottom:10px;"></div>
        <div class="strength-bar"><div id="strength-fill"></div></div>
        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:bold;">
            <span>STRENGTH: <span id="s-text">--</span></span>
            <span>EXPIRY: <span id="d-text">--</span></span>
        </div>
        <div style="font-size: 11px; margin-top: 15px; color: #94a3b8;">NEXT SIGNAL: <span id="timer" style="color:var(--red)">10s</span></div>
    </div>
    <div class="explain-box">
        <b style="color:white;">AI ANALYSIS:</b><br>
        <span id="explain-text">Analyzing market movement...</span>
    </div>
    <a href="/?cat=DASHBOARD" style="display:block; text-align:center; color:var(--accent); font-weight:bold; text-decoration:none; margin-top:10px;">← Back</a>
    {% endif %}

    <a href="{{ wa }}" class="wa-float"><i class="fa-brands fa-whatsapp"></i></a>

    <script>
        let muted = false;
        let count = 10;
        
        function fetchSignal() {
            fetch('/get_signal').then(r => r.json()).then(d => {
                document.getElementById('m-name').innerText = d.market;
                document.getElementById('action-text').innerText = d.action;
                document.getElementById('action-text').style.color = (d.action==="CALL"||d.action==="MATCH")?"var(--green)":"var(--red)";
                document.getElementById('digit-info').innerText = (d.action==="MATCH"||d.action==="DIFFERS")?"TARGET DIGIT: "+d.digit:"";
                document.getElementById('s-text').innerText = d.strength;
                document.getElementById('strength-fill').style.width = d.strength;
                document.getElementById('d-text').innerText = d.duration;
                document.getElementById('explain-text').innerText = d.explain;
                if(!muted) window.speechSynthesis.speak(new SpeechSynthesisUtterance(d.action + " " + d.market));
                count = 10;
            });
        }

        if("{{ cat }}" !== "DASHBOARD") {
            setInterval(() => {
                count--;
                document.getElementById('timer').innerText = count + "s";
                if(count <= 0) fetchSignal();
            }, 1000);
            fetchSignal();
        }

        document.getElementById('muteBtn').onclick = function() {
            muted = !muted;
            this.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            this.style.color = muted ? 'var(--red)' : 'cyan';
        };
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
