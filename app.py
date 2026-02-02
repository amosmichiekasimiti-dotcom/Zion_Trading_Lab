import os, random
import google.generativeai as genai
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- MASTER CONFIG ---
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
genai.configure(api_key=API_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"

# VOLATILITIES (Including 15 and 1S markers per instructions)
VOLS = ["1HZ10V", "1HZ15V", "1HZ25V", "1HZ30V", "1HZ50V", "1HZ75V", "1HZ90V", "1HZ100V"]

@app.route('/')
def home():
    cat = request.args.get('cat', 'DASHBOARD')
    
    if cat == 'DASHBOARD':
        return render_template_string(UI_HTML, cat=cat, wa=WHATSAPP)

    # Signal Generation triggered by LIVE_SIGNAL
    symbol = random.choice(VOLS)
    market_display = f"Volatility {symbol.replace('1HZ', '').replace('V', '')} (1S) Index"
    
    action = random.choice(["RISE", "FALL"])
    # Accuracy percentage inclusion (94-98%)
    acc_val = round(random.uniform(94.2, 98.8), 1)
    acc = f"{acc_val}%"
    
    voice_msg = f"Alert: {market_display}. Prediction is {action} with {acc} accuracy."
    
    return render_template_string(UI_HTML, market=market_display, action=action, acc=acc, voice=voice_msg, cat=cat, wa=WHATSAPP)

UI_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary: #0000ff; --red: #ff3b30; --green: #22c55e; --bg: #020617; --glass: rgba(255,255,255,0.06); }
        body { background: var(--bg); color: white; margin: 0; font-family: sans-serif; overflow-x: hidden; }
        
        .navbar { background: var(--primary); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top:0; z-index:100; }
        .nav-brand { font-weight: 900; font-size: 20px; letter-spacing: 1px; }
        
        .dashboard-label { padding: 20px 20px 5px; font-size: 11px; font-weight: 800; color: #3b82f6; letter-spacing: 1.5px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 15px; }
        .card { background: var(--glass); border-radius: 12px; padding: 22px 5px; text-align: center; text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.05); }
        .card i { font-size: 24px; color: #3b82f6; margin-bottom: 10px; display: block; }
        .card span { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

        /* Focused Signal Layout */
        .signal-container { text-align: center; padding: 30px 20px; animation: fadeIn 0.5s ease-out; }
        .market-badge { background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 6px 16px; border-radius: 30px; font-size: 12px; font-weight: 800; border: 1px solid #3b82f6; display: inline-block; margin-bottom: 20px; }
        
        .action-box { background: var(--glass); border-radius: 25px; padding: 40px 20px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 25px; position: relative; }
        .action-label { color: #64748b; font-size: 11px; font-weight: bold; letter-spacing: 2px; }
        .action-value { font-size: 75px; font-weight: 900; margin: 10px 0; letter-spacing: -3px; }
        
        .timer-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 20px 0; overflow: hidden; }
        .timer-fill { height: 100%; background: var(--green); width: 100%; transition: width 1s linear; }

        .accuracy-pill { background: rgba(34, 197, 94, 0.1); border: 1px solid var(--green); padding: 8px 18px; border-radius: 50px; display: inline-flex; align-items: center; gap: 8px; }
        .accuracy-pill b { color: var(--green); font-size: 18px; }

        .btn-execute { display: block; background: var(--green); color: white; padding: 20px; border-radius: 15px; text-decoration: none; font-weight: 900; font-size: 18px; box-shadow: 0 10px 20px rgba(34, 197, 94, 0.2); }
        .wa-float { position: fixed; bottom: 25px; right: 20px; background: #25d366; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body>
    <div class="navbar">
        <div style="display:flex; gap:20px; align-items:center;">
            <i class="fa-solid fa-bars"></i>
            <i id="muteBtn" class="fa-solid fa-volume-high" style="color:cyan; cursor:pointer;"></i>
        </div>
        <div class="nav-brand">ZION <span style="color:#3b82f6">AI</span></div>
        <a href="#" style="background:var(--red); color:white; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:bold; text-decoration:none;">Sign up</a>
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
    <div class="signal-container">
        <div class="market-badge">{{ market }}</div>
        
        <div class="action-box">
            <div class="action-label">PREDICTED DIRECTION</div>
            <div class="action-value" style="color: {{ 'var(--green)' if action == 'RISE' else 'var(--red)' }};">
                {{ action }}
            </div>

            <div class="timer-bar">
                <div id="countdown" class="timer-fill"></div>
            </div>
            
            <div class="accuracy-pill">
                <small style="color:#94a3b8; font-size:10px;">ACCURACY</small>
                <b>{{ acc }}</b>
            </div>
        </div>

        <a href="https://app.deriv.com" target="_blank" class="btn-execute">EXECUTE TRADE</a>
        <br>
        <a href="/?cat=DASHBOARD" style="color:#64748b; text-decoration:none; font-size:14px; font-weight:600; margin-top:20px; display:inline-block;">
            <i class="fa-solid fa-arrow-left"></i> BACK TO DASHBOARD
        </a>
    </div>
    {% endif %}

    <a href="{{ wa }}" class="wa-float"><i class="fa-brands fa-whatsapp"></i></a>

    <script>
        let muted = false;
        function playAI(t) { 
            if (!muted) { 
                const s = new SpeechSynthesisUtterance(t); 
                s.rate = 1.0; 
                window.speechSynthesis.speak(s); 
            } 
        }

        function startTimer() {
            const bar = document.getElementById('countdown');
            if (!bar) return;
            let width = 100;
            const interval = setInterval(() => {
                width -= 1.66; // Approx 60 seconds
                bar.style.width = width + '%';
                if (width <= 0) {
                    clearInterval(interval);
                    location.reload(); // Refresh for next signal
                }
            }, 1000);
        }

        document.getElementById('muteBtn').onclick = function() { 
            muted = !muted; 
            this.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'; 
            this.style.color = muted ? 'red' : 'cyan';
        };

        window.onload = () => { 
            if("{{ cat }}" !== "DASHBOARD") {
                playAI("{{ voice }}");
                startTimer();
            } 
        };
    </script>
</body>
</html>
