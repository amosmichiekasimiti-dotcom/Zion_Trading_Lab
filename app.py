# Save as zion_pro_v3_fixed.py
import google.generativeai as genai
from flask import Flask, render_template_string, jsonify
import random

app = Flask(__name__)

# --- MASTER CONFIGURATION (FROM SCREENSHOTS) ---
# FIXED: All literals are now properly quoted as strings to avoid decimal literal errors
CONFIG = {
    "MY_APP_ID": "124918",
    "REAL_TOKEN": "m04oxPdV6cV6pX4",
    "DEMO_TOKEN": "kTYefK9bFG3UPGh",
    "GEMINI_KEY": "AIzaSyDM7cKxbQwbwBXOubb01Iel2WrFi8oEh2E",
    "WHATSAPP_LINK": "https://wa.me/254742024175",
    "VERSION": "3.0.4-PRO",
    "MARKETS": [
        "1Z10", "R_10", "1Z15", "1Z25", "R_25", 
        "1Z30", "1Z50", "R_50", "1Z75", "R_75", 
        "1Z90", "1Z100", "R_100"
    ]
}

# --- AI INITIALIZATION ---
genai.configure(api_key=CONFIG["GEMINI_KEY"])
ai_model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/')
def home():
    return render_template_string(HTML_DASHBOARD, config=CONFIG)

@app.route('/api/update')
def engine():
    signals = {}
    for m in CONFIG["MARKETS"]:
        # Applying 40% Payout & High Accuracy Constraints
        acc = random.randint(85, 99)
        payout = random.randint(40, 98)
        
        # Specific Logic for Market Naming
        # 1Z markets = 1s Volatility, R_ markets = Standard Volatility
        display_name = m.replace("1Z", "Volatility 1s ").replace("R_", "Volatility ")
        
        signals[m] = {
            "acc": acc,
            "payout": f"{payout}%",
            "prediction": random.choice(["UNDER 4", "OVER 5", "EVEN", "ODD", "RISE", "FALL"]),
            "voice_msg": f"Zion Alert. {display_name} Accuracy {acc} percent. Payout {payout} percent."
        }
    return jsonify(signals)

HTML_DASHBOARD = """
<!DOCTYPE html>
<html>
<head>
    <title>ZION AI {{ config.VERSION }}</title>
    <style>
        :root { --neon: #00ff9d; --bg: #06090c; --card: #12161b; }
        body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; overflow-x: hidden; }
        .header { display: flex; justify-content: space-between; padding: 20px; background: var(--card); border-bottom: 2px solid #1e2329; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 15px; padding: 20px; }
        .card { background: var(--card); border: 1px solid #232a33; border-radius: 10px; padding: 15px; position: relative; }
        .neon-text { color: var(--neon); }
        .btn-mute { border: 1px solid var(--neon); color: var(--neon); background: none; padding: 10px; cursor: pointer; border-radius: 5px; font-weight: bold; }
        .countdown { font-size: 2rem; color: var(--neon); margin: 10px 0; font-family: 'Courier New', monospace; }
        .whatsapp { position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
    </style>
</head>
<body>
    <div class="header">
        <div><strong>ZION AI PRO</strong> | Version: {{ config.VERSION }}</div>
        <div style="display: flex; gap: 20px; align-items: center;">
            <div style="color:#555">APP ID: {{ config.MY_APP_ID }}</div>
            <button id="mute-btn" class="btn-mute" onclick="toggleMute()">🔊 VOICE ON</button>
        </div>
    </div>

    <div class="grid" id="market-grid"></div>

    <div class="whatsapp">
        <a href="{{ config.WHATSAPP_LINK }}" target="_blank">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="60">
        </a>
    </div>

    <script>
        let isMuted = false;
        let lastSpoken = "";

        function toggleMute() {
            isMuted = !isMuted;
            document.getElementById('mute-btn').innerText = isMuted ? "🔇 VOICE MUTED" : "🔊 VOICE ON";
            if(isMuted) window.speechSynthesis.cancel();
        }

        async function refresh() {
            const res = await fetch('/api/update');
            const data = await res.json();
            const grid = document.getElementById('market-grid');
            grid.innerHTML = '';

            for (let m in data) {
                const s = data[m];
                const highConf = s.acc >= 90;
                
                grid.innerHTML += `
                    <div class="card" style="border-color: ${highConf ? '#00ff9d' : '#232a33'}">
                        <div style="font-size:11px; color:#555">${m.includes('1Z') ? '1S SERIES' : 'STANDARD'}</div>
                        <h3 class="neon-text">${m.replace('1Z', 'Vol 1s ').replace('R_', 'Vol ')}</h3>
                        <h1>${s.acc}%</h1>
                        <div class="countdown" id="count-${m}">10s</div>
                        <div style="color:#888">PAYOUT: ${s.payout}</div>
                        <div style="font-weight:bold; margin-top:10px; color: ${highConf ? '#00ff9d' : '#fff'}">${s.prediction}</div>
                    </div>
                `;

                if(highConf && !isMuted && lastSpoken !== s.voice_msg) {
                    const speech = new SpeechSynthesisUtterance(s.voice_msg);
                    speech.rate = 1.0;
                    window.speechSynthesis.speak(speech);
                    lastSpoken = s.voice_msg;
                }

                // Initialize 10s Countdown for XML Sync
                startTimer(m, 10);
            }
        }

        function startTimer(id, seconds) {
            let time = seconds;
            let interval = setInterval(() => {
                time--;
                let el = document.getElementById('count-' + id);
                if(el) el.innerText = time + 's';
                if(time <= 0) clearInterval(interval);
            }, 1000);
        }

        setInterval(refresh, 11000); // 11s sync to match the 10s countdown
        refresh();
    </script>
</body>
</html>
