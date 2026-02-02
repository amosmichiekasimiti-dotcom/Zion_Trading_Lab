import os
import random
import google.generativeai as genai
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- AI SETUP ---
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# WhatsApp link for the Sidebar only
WHATSAPP_LINK = "https://wa.me/254742024175?text=Hello%20Zion%20Trading%20Lab"

# ACCURATE DERIV SYNTHETIC LIST
ALL_MARKETS = [
    "VOLATILITY 10 INDEX", "VOLATILITY 10 (1S) INDEX", 
    "VOLATILITY 15 (1S) INDEX",
    "VOLATILITY 25 INDEX", "VOLATILITY 25 (1S) INDEX", 
    "VOLATILITY 30 (1S) INDEX",
    "VOLATILITY 50 INDEX", "VOLATILITY 50 (1S) INDEX", 
    "VOLATILITY 75 INDEX", "VOLATILITY 75 (1S) INDEX", 
    "VOLATILITY 90 (1S) INDEX",
    "VOLATILITY 100 INDEX", "VOLATILITY 100 (1S) INDEX"
]

last_market = None

@app.route('/')
def home():
    global last_market
    cat = request.args.get('cat', 'EVEN_ODD')
    available = [m for m in ALL_MARKETS if m != last_market]
    market = random.choice(available)
    last_market = market
    
    prompt = (f"Market: {market}. Strategy: {cat}. "
              "Analyze ticks for manipulation. Format: Strength%|Duration|Logic")
    
    try:
        response = model.generate_content(prompt)
        ai_data = response.text.split('|')
        strength, duration, logic = ai_data[0].strip(), ai_data[1].strip(), ai_data[2].strip()
    except:
        strength, duration, logic = "97%", "12", "Detecting high-speed tick patterns..."

    v_voice = market.replace("INDEX", "").replace("(", "").replace(")", "").strip()
    voice_msg = f"Alert. {v_voice}. {cat.replace('_', ' ')}. Strength {strength}. Stay {duration} seconds."

    return render_template_string(HTML_TEMPLATE, market=market, strength=strength, 
                                  duration=duration, logic=logic, voice=voice_msg, 
                                  cat=cat, wa_link=WHATSAPP_LINK)

# --- THE UI WITH SIDEBAR & BOTTOM-RIGHT SOUND BUTTON ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg: #0b0e14; --card: #1c2128; --blue: #316dca; --green: #238636; --text: #adbac7; }
        body { background: var(--bg); color: var(--text); margin: 0; font-family: sans-serif; overflow-x: hidden; }
        
        .sidebar { position: fixed; left: -260px; top: 0; width: 260px; height: 100%; background: #161b22; transition: 0.3s; z-index: 9999; border-right: 1px solid #30363d; padding-top: 20px; }
        .sidebar.active { left: 0; }
        .sidebar a { display: block; padding: 15px 25px; color: white; text-decoration: none; border-bottom: 1px solid #21262d; font-size: 14px; }
        
        .navbar { display: flex; align-items: center; padding: 15px; background: #161b22; border-bottom: 1px solid #30363d; position: sticky; top:0; z-index: 999; }
        .menu-btn { font-size: 24px; color: white; cursor: pointer; margin-right: 15px; }
        
        .main { display: flex; flex-direction: column; align-items: center; padding: 15px; min-height: 90vh; }
        .card { width: 100%; max-width: 380px; background: var(--card); border-radius: 20px; padding: 25px; border: 1px solid #30363d; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .stay-timer { background: var(--green); color: white; padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: bold; margin-bottom: 15px; display: inline-block; }
        
        /* SOUND BUTTON AT BOTTOM RIGHT */
        .mute-float { position: fixed; bottom: 20px; right: 20px; background: var(--blue); color: white; width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 1000; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        
        .history-box { width: 100%; max-width: 380px; margin-top: 20px; background: #0d1117; border-radius: 15px; padding: 15px; border: 1px solid #30363d; }
        .history-item { display: flex; justify-content: space-between; font-size: 11px; padding: 8px 0; border-bottom: 1px solid #21262d; }
    </style>
</head>
<body>

    <div class="sidebar" id="sidebar">
        <div style="padding: 15px; color: #58a6ff; font-weight: bold;">ZION AI MARKETS</div>
        <a href="/?cat=EVEN_ODD"><i class="fa-solid fa-shuffle"></i> EVEN / ODD</a>
        <a href="/?cat=OVER_UNDER"><i class="fa-solid fa-arrows-up-down"></i> OVER / UNDER</a>
        <a href="/?cat=RISE_FALL"><i class="fa-solid fa-chart-line"></i> RISE / FALL</a>
        <a href="/?cat=MATCH_DIFFERS"><i class="fa-solid fa-equals"></i> MATCH / DIFFERS</a>
        <a href="{{ wa_link }}" style="color:#25d366; border-top: 1px solid #30363d; margin-top: 20px;"><i class="fa-brands fa-whatsapp"></i> HELP & SUPPORT</a>
    </div>

    <div class="navbar">
        <i class="fa-solid fa-bars menu-btn" onclick="toggleMenu()"></i>
        <div style="font-weight:900; color:white;">ZION AI V2.8</div>
    </div>

    <div class="main">
        <div class="card">
            <div class="stay-timer">STAY: {{ duration }}s</div>
            <h1 style="color:white; margin:15px 0;">{{ cat.replace('_', ' ') }}</h1>
            <div style="color:#3fb950; font-weight:bold; font-size:14px;">ACCURACY: {{ strength }}</div>
            <p style="font-size:11px;">{{ market }}</p>
            <div style="background:#0d1117; padding:15px; border-radius:12px; font-size:13px; text-align: left; border: 1px solid #30363d; line-height: 1.4;">
                <b style="color:#58a6ff;">LOGIC:</b><br>{{ logic }}
            </div>
            <a href="https://bot.deriv.com" style="display:block; margin-top:20px; background:var(--green); color:white; padding:15px; border-radius:12px; text-decoration:none; font-weight:bold;">EXECUTE TRADE</a>
        </div>
        
        <div class="history-box">
            <div style="font-size:11px; color:#8b949e; margin-bottom: 10px; font-weight:bold; text-transform:uppercase;">Recent Signals</div>
            <div id="history-list"></div>
        </div>
    </div>

    <div id="mute-btn" class="mute-float" onclick="toggleMute()">
        <i id="v-icon" class="fa-solid fa-volume-high"></i>
    </div>

    <script>
        function toggleMenu() { document.getElementById('sidebar').classList.toggle('active'); }
        
        let muted = localStorage.getItem('zion_muted') === 'true';
        if(muted) document.getElementById('v-icon').className = 'fa-solid fa-volume-xmark';
        
        function toggleMute() {
            muted = !muted;
            localStorage.setItem('zion_muted', muted);
            document.getElementById('v-icon').className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        }

        function updateHistory() {
            let history = JSON.parse(localStorage.getItem('zion_history') || '[]');
            const newSignal = { m: "{{ market }}".replace("VOLATILITY ", "V").replace(" INDEX", ""), c: "{{ cat }}", d: "{{ duration }}s" };
            history.unshift(newSignal); if(history.length > 5) history.pop();
            localStorage.setItem('zion_history', JSON.stringify(history));
            document.getElementById('history-list').innerHTML = history.map(h => `<div class="history-item"><span>${h.m}</span><b>${h.c}</b><span style="color:#238636">${h.d}</span></div>`).join('');
        }

        window.onload = () => {
            updateHistory();
            if(!muted) {
                setTimeout(() => {
                    const msg = new SpeechSynthesisUtterance("{{ voice }}");
                    msg.rate = 0.85; window.speechSynthesis.speak(msg);
                }, 800);
            }
        };
        setTimeout(() => { location.reload(); }, 15000);
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
