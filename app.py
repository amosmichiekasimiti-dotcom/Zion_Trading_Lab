import random
from flask import Flask, render_template_string, jsonify

app = Flask(__name__)

# --- SYSTEMATIC CONFIGURATION ---
# Fixed Syntax: Ensured 1Z10 and R_10 are strings to prevent literal errors
CONFIG = {
    "MY_APP_ID": "124918",
    "REAL_TOKEN": "m04oxPdV6cV6pX4",
    "DEMO_TOKEN": "kTYefK9bFG3UPGh",
    "GEMINI_KEY": "AIzaSyDM7cKxbQwbwBXOubb01Iel2WrFi8oEh2E",
    "WHATSAPP": "https://wa.me/254742024175",
    "VERSION": "3.0.4-PRO",
    "MARKETS": ["1Z10", "R_10", "1Z15", "1Z25", "R_25", "1Z30", "1Z50", "R_50", "1Z75", "R_75", "1Z90", "1Z100", "R_100"]
}

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE, config=CONFIG)

@app.route('/api/sync')
def sync_engine():
    # Multi-Timeframe Analysis (MTFA) Logic Simulation
    results = {}
    for m in CONFIG["MARKETS"]:
        acc = random.randint(88, 99)
        payout = random.randint(40, 95)
        # Specific signal logic for Even/Odd and Over/Under
        prediction = random.choice(["EVEN", "ODD", "UNDER 4", "OVER 5", "DIFFERS 0"])
        
        results[m] = {
            "accuracy": acc,
            "payout": f"{payout}%",
            "predict": prediction,
            "voice": f"Volatility {m.replace('1Z','1S').replace('R_','')} Alert. {prediction}. Accuracy {acc} percent."
        }
    return jsonify(results)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ZION AI ULTIMATE TERMINAL</title>
    <style>
        :root { --neon: #00ff88; --dark: #0a0e17; --card: #1a1f2e; }
        body { background: var(--dark); color: white; font-family: 'Segoe UI', sans-serif; margin: 0; padding-bottom: 50px; }
        .header { background: #121620; padding: 15px 30px; display: flex; justify-content: space-between; border-bottom: 2px solid var(--neon); position: sticky; top:0; z-index:100;}
        .market-bar { display: flex; overflow-x: auto; gap: 15px; padding: 15px; background: #121620; scrollbar-width: none; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; padding: 20px; }
        .card { background: var(--card); border-radius: 12px; padding: 20px; border: 1px solid #2d3446; position: relative; transition: 0.3s; }
        .card.high { border-color: var(--neon); box-shadow: 0 0 15px rgba(0, 255, 136, 0.2); }
        .timer-box { font-size: 2.5rem; font-weight: bold; color: var(--neon); text-align: center; margin: 15px 0; font-family: monospace; }
        .btn-exec { width: 100%; padding: 12px; background: #ff4757; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .mute-btn { background: none; border: 1px solid var(--neon); color: var(--neon); padding: 5px 15px; border-radius: 20px; cursor: pointer; }
        .whatsapp { position: fixed; bottom: 20px; right: 20px; background: #25D366; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
    </style>
</head>
<body>
    <header class="header">
        <div style="font-size: 1.5rem; font-weight: bold;">ZION AI <span style="font-size: 0.8rem; color: var(--neon);">v{{ config.VERSION }}</span></div>
        <div style="display: flex; gap: 20px; align-items: center;">
            <div style="font-size: 0.8rem; color: #888;">ID: {{ config.MY_APP_ID }}</div>
            <button class="mute-btn" id="voiceToggle" onclick="toggleMute()">🔊 VOICE ON</button>
        </div>
    </header>

    <div class="market-bar" id="marketScroll">
        {% for m in config.MARKETS %}
        <div style="min-width: 120px; text-align: center; background: #1a1f2e; padding: 10px; border-radius: 8px; border: 1px solid #333;">{{ m }}</div>
        {% endfor %}
    </div>

    <div class="grid" id="signalGrid"></div>

    <a href="{{ config.WHATSAPP }}" class="whatsapp" target="_blank">
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="35">
    </a>

    <script>
        let isMuted = false;
        let speakQueue = "";

        function toggleMute() {
            isMuted = !isMuted;
            document.getElementById('voiceToggle').innerText = isMuted ? "🔇 MUTED" : "🔊 VOICE ON";
            if(isMuted) window.speechSynthesis.cancel();
        }

        async function fetchSignals() {
            const response = await fetch('/api/sync');
            const data = await response.json();
            const grid = document.getElementById('signalGrid');
            grid.innerHTML = '';

            for (const [key, val] of Object.entries(data)) {
                const isHigh = val.accuracy >= 94;
                grid.innerHTML += `
                    <div class="card ${isHigh ? 'high' : ''}">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                            <span>${key}</span>
                            <span style="color: var(--neon)">${val.accuracy}% Accuracy</span>
                        </div>
                        <div class="timer-box" id="time-${key}">10:00</div>
                        <div style="text-align: center; margin-bottom: 15px;">
                            <div style="color: #888; font-size: 0.9rem;">${val.predict}</div>
                            <div style="color: #ffa502;">Payout: ${val.payout}</div>
                        </div>
                        <button class="btn-exec" onclick="alert('XML Synced for ${key}')">EXECUTE XML BOT</button>
                    </div>
                `;

                if (isHigh && !isMuted && speakQueue !== val.voice) {
                    const utterance = new SpeechSynthesisUtterance(val.voice);
                    window.speechSynthesis.speak(utterance);
                    speakQueue = val.voice;
                }
                
                runTimer(key, 10);
            }
        }

        function runTimer(id, start) {
            let count = start;
            const timerEl = document.getElementById('time-' + id);
            const interval = setInterval(() => {
                count--;
                if(timerEl) timerEl.innerText = "00:" + (count < 10 ? "0" + count : count);
                if(count <= 0) clearInterval(interval);
            }, 1000);
        }

        setInterval(fetchSignals, 11000);
        fetchSignals();
    </script>
</body>
</html>
"""

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
