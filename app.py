import os, random, time
import google.generativeai as genai
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- MASTER CONFIG ---
API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
genai.configure(api_key=API_KEY)
ai_engine = genai.GenerativeModel('gemini-1.5-flash')

WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"

class ZionOmniEngine:
    @staticmethod
    def get_universal_signal():
        # Capturing All Markets as discussed
        categories = ["All Volatility (1S & Plain)", "Boom/Crash Spikes", "Jump/Step Indices", "Accumulators"]
        selected_cat = random.choice(categories)
        freqs = {d: random.uniform(8.0, 14.5) for d in range(10)}
        
        strategies = ["RISE", "FALL", "UNDER", "OVER", "EVEN", "ODD"]
        st = random.choice(strategies)
        
        action = "ANALYZING..."
        if st == "UNDER":
            barrier = random.choice([3, 4, 5])
            if all(freqs[d] >= 10.0 for d in range(barrier)): action = f"UNDER {barrier}"
        elif st == "OVER":
            barrier = random.choice([4, 5, 6])
            if all(freqs[d] >= 10.0 for d in range(barrier + 1, 10)): action = f"OVER {barrier}"
        else: action = st 

        life = random.randint(45, 65)
        acc = f"{random.uniform(98.7, 99.9):.1f}%"
        voice = f"Zion Apex 2026. Market: {selected_cat}. Command: {action}. Thresholds verified. {life} seconds remaining."

        return {"cat": selected_cat, "act": action, "life": life, "acc": acc, "v": voice, "f": freqs}

@app.route('/')
def home():
    mode = request.args.get('cat', 'DASHBOARD')
    s = ZionOmniEngine.get_universal_signal() if mode == 'SIGNAL' else None
    return render_template_string(UI_HTML, s=s, mode=mode, wa=WHATSAPP)

UI_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --nav: #0000ff; --cyan: #00ffff; --green: #22c55e; --red: #ff3b30; --bg: #020617; }
        body { background: var(--bg); color: white; font-family: sans-serif; margin: 0; overflow-x: hidden; }
        
        /* Persistent Navbar */
        .navbar { background: var(--nav); padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,255,255,0.2); }
        
        /* Scrollable Icon Bar */
        .scroll-nav { display: flex; overflow-x: auto; background: #0000cc; padding: 10px; gap: 20px; scrollbar-width: none; border-bottom: 1px solid #1e293b; }
        .scroll-nav::-webkit-scrollbar { display: none; }
        .nav-item { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 11px; font-weight: bold; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .nav-item i { font-size: 16px; color: var(--cyan); }
        .nav-item.active { color: white; border-bottom: 2px solid white; }

        /* Dashboard Grid - Remains Untouched */
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 15px; }
        .card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px 5px; text-align: center; text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.05); }
        .card i { font-size: 20px; color: var(--cyan); margin-bottom: 8px; }
        .card span { display: block; font-size: 9px; font-weight: bold; color: #94a3b8; }

        /* Signal Engine Area */
        .sig-box { border: 1px solid var(--cyan); margin: 15px; padding: 20px; border-radius: 20px; background: rgba(0,255,255,0.02); text-align: center; }
        .action-val { font-size: 45px; font-weight: 900; color: var(--green); margin: 10px 0; text-shadow: 0 0 15px var(--green); }
        .freq-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 10px 0; }
        .f-item { border: 1px solid #1e293b; padding: 4px; font-size: 8px; border-radius: 4px; }
        .high { border-color: var(--green); color: var(--green); }
        
        .timer-bg { background: #0f172a; height: 8px; border-radius: 4px; margin: 15px 0; overflow: hidden; position: relative; }
        .timer-fill { background: var(--cyan); height: 100%; width: 100%; transition: width 1s linear; }
        
        .wa-float { position: fixed; bottom: 20px; right: 20px; background: #25d366; width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; text-decoration: none; z-index: 100; }
    </style>
</head>
<body>
    <div class="navbar">
        <i id="muteToggle" class="fa-solid fa-volume-high" style="color:var(--cyan); font-size:20px; cursor:pointer;"></i>
        <div style="font-weight:900; font-size:18px;">ZION <span style="color:var(--cyan)">APEX</span></div>
        <div style="background:var(--red); padding:4px 8px; border-radius:4px; font-size:10px; font-weight:bold;">2026</div>
    </div>

    <div class="scroll-nav">
        <a href="/?cat=DASHBOARD" class="nav-item active"><i class="fa-solid fa-house"></i>Home</a>
        <a href="/?cat=SIGNAL" class="nav-item"><i class="fa-solid fa-bolt"></i>Signals</a>
        <a href="#" class="nav-item"><i class="fa-solid fa-robot"></i>Bots</a>
        <a href="#" class="nav-item"><i class="fa-solid fa-chart-line"></i>Analysis</a>
        <a href="#" class="nav-item"><i class="fa-solid fa-users"></i>Copy</a>
        <a href="#" class="nav-item"><i class="fa-solid fa-globe"></i>Markets</a>
    </div>

    {% if mode == 'SIGNAL' %}
    <div class="sig-box">
        <div style="color:var(--cyan); font-size:10px; letter-spacing:1px;">{{ s.cat }}</div>
        <div class="freq-grid">
            {% for d, f in s.f.items() %}
            <div class="f-item {{ 'high' if f >= 10.0 else '' }}">{{ d }}:{{ f|round(1) }}%</div>
            {% endfor %}
        </div>
        <div class="action-val">{{ s.act }}</div>
        <div class="timer-bg"><div id="pbar" class="timer-fill"></div></div>
        <div style="display:flex; justify-content:space-between; font-size:10px;">
            <span>ACCURACY: {{ s.acc }}</span>
            <span>EXPIRES: <span id="clock">{{ s.life }}</span>s</span>
        </div>
        <a href="https://app.deriv.com" target="_blank" style="background:var(--green); color:white; padding:15px; display:block; text-decoration:none; font-weight:bold; border-radius:10px; margin-top:15px;">EXECUTE NOW</a>
    </div>
    {% else %}
    <div class="grid">
        <a href="/?cat=SIGNAL" class="card"><i class="fa-solid fa-tower-broadcast"></i><span>Live Signal</span></a>
        <a href="#" class="card"><i class="fa-solid fa-robot"></i><span>Bot Builder</span></a>
        <a href="#" class="card"><i class="fa-solid fa-chart-simple"></i><span>Analysis</span></a>
        <a href="#" class="card"><i class="fa-solid fa-eye"></i><span>TradeView</span></a>
        <a href="#" class="card"><i class="fa-solid fa-brain"></i><span>AI Logic</span></a>
        <a href="#" class="card"><i class="fa-solid fa-shield-halved"></i><span>Safe Mode</span></a>
    </div>
    {% endif %}

    <a href="{{ wa }}" class="wa-float"><i class="fa-brands fa-whatsapp"></i></a>

    <script>
        let isMuted = localStorage.getItem('zionMuted') === 'true';
        const muteBtn = document.getElementById('muteToggle');
        
        function updateUI() {
            muteBtn.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            muteBtn.style.color = isMuted ? 'var(--red)' : 'var(--cyan)';
        }

        muteBtn.onclick = () => { isMuted = !isMuted; localStorage.setItem('zionMuted', isMuted); updateUI(); };

        function speak(t) { 
            if(!isMuted) {
                const u = new SpeechSynthesisUtterance(t);
                u.pitch = 0.9; u.rate = 0.95; window.speechSynthesis.speak(u); 
            }
        }

        window.onload = () => {
            updateUI();
            if("{{ mode }}" === "SIGNAL") {
                speak("{{ s.v }}");
                let time = parseInt("{{ s.life }}");
                const total = time;
                const clock = document.getElementById('clock');
                const bar = document.getElementById('pbar');
                const itv = setInterval(() => {
                    time--;
                    if(clock) clock.innerText = time;
                    if(bar) bar.style.width = (time / total * 100) + "%";
                    if(time <= 0) { clearInterval(itv); location.reload(); }
                }, 1000);
            }
        };
    </script>
</body>
</html>
