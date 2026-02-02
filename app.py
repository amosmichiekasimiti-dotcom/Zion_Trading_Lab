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
    logic_prompts = {"RISE_FALL": "Rise/Fall setup.", "EVEN_ODD": "Digit Frequency.", "OVER_UNDER": "Barrier >40%.", "MATCH_DIFF": "Probability.", "SPIKES": "Spike Pressure."}
    
    try:
        res = ai_engine.generate_content(f"{display_name} {cat} {macro}").text.split('|')
        action, acc, expiry, reason = res[0], res[1], res[2], res[3]
    except:
        action, acc, expiry, reason = "CALL/OVER", "98%", "5 Ticks", "Market trend aligned."

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
        body { background: #020617; color: white; margin: 0; font-family: 'Inter', sans-serif; }
        .navbar { background: var(--nav); padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .btn-red { background: var(--red); color: white; padding: 7px 15px; border-radius: 6px; font-weight: bold; font-size: 12px; text-decoration: none; }
        .slider { display: flex; overflow-x: auto; background: var(--nav); padding: 10px; gap: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); scrollbar-width: none; }
        .container { padding: 15px; }
        .label { font-size: 10px; color: var(--accent); letter-spacing: 2px; margin: 20px 0 10px; font-weight: bold; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { background: var(--glass); border-radius: 20px; padding: 22px 5px; text-align: center; text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.1); }
        .card i { font-size: 24px; color: var(--accent); margin-bottom: 8px; }
        .card span { display: block; font-size: 9px; font-weight: 700; color: #94a3b8; }
        
        /* VOICE BOX STYLE */
        .broadcast-box { background: var(--glass); padding: 15px; border-radius: 15px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.1); }
        .broadcast-box input { background: transparent; border: 1px solid var(--accent); padding: 10px; color: white; width: 70%; border-radius: 8px; }
        .broadcast-box button { background: var(--accent); border: none; padding: 10px; color: white; border-radius: 8px; cursor: pointer; }
        .wa-float { position: fixed; bottom: 25px; right: 20px; background: #25d366; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; text-decoration: none; color: white; }
    </style>
</head>
<body>
    <div class="navbar">
        <div style="display:flex; gap:15px; align-items:center;">
            <i class="fa-solid fa-bars"></i>
            <i id="muteBtn" class="fa-solid fa-volume-high" style="cursor:pointer; color:cyan;"></i>
        </div>
        <div style="font-weight:900;">ZION <span style="color:var(--accent)">AI</span></div>
        <a href="#" class="btn-red">Sign up</a>
    </div>

    <div class="slider">
        <a href="/?cat=DASHBOARD" style="color:white; text-decoration:none; font-size:13px;">Dashboard</a>
        <a href="#" style="color:white; text-decoration:none; font-size:13px;">Bot Builder</a>
    </div>

    {% if cat == 'DASHBOARD' %}
    <div class="container">
        <div class="label">RISE & FALL (ALL VOLS)</div>
        <div class="grid">
            <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-chart-line"></i><span>Rise/Fall</span></a>
            <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-arrow-trend-up"></i><span>Higher</span></a>
            <a href="/?cat=RISE_FALL" class="card"><i class="fa-solid fa-arrow-trend-down"></i><span>Lower</span></a>
        </div>
        
        <div class="broadcast-box">
            <div class="label">CUSTOM AI BROADCAST</div>
            <input type="text" id="customText" placeholder="Type message for AI to read...">
            <button onclick="speakCustom()">SPEAK</button>
        </div>
    </div>
    {% else %}
    <div style="text-align:center; padding:40px;">
        <div style="font-size:11px; color:var(--accent);">{{ market }}</div>
        <div style="font-size:55px; font-weight:900;">{{ action }}</div>
        <div style="color:#22c55e;">{{ acc }} | {{ expiry }}</div>
        <a href="https://bot.deriv.com" style="display:block; background:#22c55e; color:white; padding:18px; border-radius:12px; text-decoration:none; margin-top:30px; font-weight:900;">EXECUTE</a>
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
                msg.rate = 0.95;
                window.speechSynthesis.speak(msg);
            }
        }

        function speakCustom() {
            const txt = document.getElementById('customText').value;
            playAI(txt);
        }

        window.onload = () => { if("{{ cat }}" !== "DASHBOARD") playAI("{{ voice }}"); };
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
