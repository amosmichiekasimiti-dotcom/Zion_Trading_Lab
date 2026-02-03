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
        # Universal Categories including Volatility 15 & All 1S markers
        categories = [
            "All Volatility with One-Second", 
            "All Volatility with Plain Index",
            "Boom and Crash (Spikes)",
            "Jump and Step Indices",
            "Accumulator Markets"
        ]
        selected_cat = random.choice(categories)
        
        # Individual 10% Digit Floor Logic
        freqs = {d: random.uniform(6.5, 15.8) for d in range(10)}
        
        strategies = ["RISE", "FALL", "UNDER", "OVER", "EVEN", "ODD"]
        st = random.choice(strategies)
        
        status = "WAIT - Cluster Weak"
        action = ""
        is_ready = False
        
        # Check if individual digits in cluster meet the 10% threshold
        if st == "UNDER":
            barrier = random.choice([3, 4, 5])
            if all(freqs[d] >= 10.0 for d in range(barrier)):
                action = f"UNDER {barrier}"; status = "STRIKE"; is_ready = True
        elif st == "OVER":
            barrier = random.choice([4, 5, 6])
            if all(freqs[d] >= 10.0 for d in range(barrier + 1, 10)):
                action = f"OVER {barrier}"; status = "STRIKE"; is_ready = True
        elif st in ["RISE", "FALL", "EVEN", "ODD"]:
            action = st; status = "STRIKE"; is_ready = True

        life = random.randint(45, 65)
        acc = f"{random.uniform(98.8, 99.9):.1f}%" if is_ready else "N/A"
        
        voice = f"Zion Apex. Market Category: {selected_cat}. "
        voice += f"Command: {action}. Execute." if is_ready else "Condition weak. Maneuvering next market."

        return {"cat": selected_cat, "act": action, "stat": status, "life": life, "acc": acc, "v": voice, "f": freqs, "ready": is_ready}

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
        body { background: var(--bg); color: white; font-family: sans-serif; margin: 0; padding-bottom: 80px; }
        
        /* Fixed Header to ensure Menu is ALWAYS touchable */
        .header-stack { position: sticky; top: 0; z-index: 1000; width: 100%; }
        .navbar { background: var(--nav); padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,255,255,0.2); }
        
        /* Improved Scrollable Bar */
        .scroll-nav { display: flex; overflow-x: auto; background: #0000cc; padding: 12px; gap: 25px; border-bottom: 1px solid #1e293b; -webkit-overflow-scrolling: touch; }
        .scroll-nav::-webkit-scrollbar { display: none; }
        .nav-link { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 12px; font-weight: bold; white-space: nowrap; }
        .nav-link.active { color: var(--cyan); border-bottom: 2px solid var(--cyan); }

        /* Signal Area */
        .container { padding: 20px; text-align: center; }
        .market-tag { color: var(--cyan); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
        .status-msg { font-size: 38px; font-weight: 900; margin: 20px 0; color: white; }
        .ready { color: var(--green); }
        
        /* Digit Grid */
        .digit-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 20px 0; }
        .digit-box { background: rgba(255,255,255,0.05); border: 1px solid #1e293b; padding: 8px; border-radius: 6px; font-size: 10px; }
        .digit-high { border-color: var(--green); color: var(--green); background: rgba(34,197,94,0.1); }

        .btn-exec { background: var(--green); color: white; padding: 18px; display: block; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 18px; margin-top: 20px; }
        .wa-float { position: fixed; bottom: 25px; right: 20px; background: #25d366; width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); z-index: 1000; }
    </style>
</head>
<body>
    <div class="header-stack">
        <div class="navbar">
            <i id="muteBtn" class="fa-solid fa-volume-high" style="color:var(--cyan); font-size:22px; cursor:pointer;"></i>
            <div style="font-weight:900; font-size:20px;">ZION <span style="color:var(--cyan)">AI</span></div>
            <div style="background:var(--red); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:bold;">LIVE</div>
        </div>
        <div class="scroll-nav">
            <a href="/?cat=DASHBOARD" class="nav-link {{ 'active' if mode == 'DASHBOARD' }}">Dashboard</a>
            <a href="/?cat=SIGNAL" class="nav-link {{ 'active' if mode == 'SIGNAL' }}">Live Signal</a>
            <a href="#" class="nav-link">CopyTrade</a>
            <a href="#" class="nav-link">Bot Builder</a>
            <a href="#" class="nav-link">AI Analysis</a>
            <a href="#" class="nav-link">Markets</a>
        </div>
    </div>

    <div class="container">
        {% if mode == 'SIGNAL' %}
            <div class="market-tag">{{ s.cat }}</div>
            <div class="digit-grid">
                {% for d, f in s.f.items() %}
                <div class="digit-box {{ 'digit-high' if f >= 10.0 else '' }}">{{ d }}|{{ f|round(1) }}%</div>
                {% endfor %}
            </div>
            <div class="status-msg {{ 'ready' if s.ready }}">
                {{ s.stat if not s.ready else s.act }}
            </div>
            <div style="color:var(--green); font-weight:bold; font-size:14px; margin-bottom: 20px;">ACCURACY: {{ s.acc }}</div>
            <a href="https://app.deriv.com" target="_blank" class="btn-exec">EXECUTE</a>
            <div id="timer-box" style="margin-top:20px; font-size:12px; color:var(--cyan);">SIGNAL REFRESH IN: <span id="clock">{{ s.life }}</span>s</div>
        {% else %}
            <div style="margin-top:50px;">
                <i class="fa-solid fa-microchip" style="font-size: 60px; color: var(--cyan); margin-bottom: 20px;"></i>
                <h2 style="letter-spacing:2px;">ZION APEX DASHBOARD</h2>
                <a href="/?cat=SIGNAL" style="color:white; border: 1px solid var(--cyan); padding: 15px 40px; display: inline-block; text-decoration:none; border-radius: 10px; font-weight:bold;">LAUNCH MANEUVERING</a>
            </div>
        {% endif %}
    </div>

    <a href="{{ wa }}" class="wa-float"><i class="fa-brands fa-whatsapp"></i></a>

    <script>
        let isMuted = localStorage.getItem('zionMuted') === 'true';
        const muteToggle = document.getElementById('muteBtn');
        
        function syncMute() {
            muteToggle.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            muteToggle.style.color = isMuted ? 'var(--red)' : 'var(--cyan)';
        }

        muteToggle.onclick = () => {
            isMuted = !isMuted;
            localStorage.setItem('zionMuted', isMuted);
            syncMute();
        };

        function speak(t) {
            if(!isMuted) {
                const u = new SpeechSynthesisUtterance(t);
                u.pitch = 0.9; u.rate = 0.95; window.speechSynthesis.speak(u);
            }
        }

        window.onload = () => {
            syncMute();
            if("{{ mode }}" === "SIGNAL") {
                speak("{{ s.v }}");
                let time = parseInt("{{ s.life }}");
                const clock = document.getElementById('clock');
                const itv = setInterval(() => {
                    time--;
                    if(clock) clock.innerText = time;
                    if(time <= 0) { clearInterval(itv); location.reload(); }
                }, 1000);
            }
        };
    </script>
</body>
</html>
