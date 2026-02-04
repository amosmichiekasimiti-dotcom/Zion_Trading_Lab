from flask import Flask, render_template_string, request, jsonify
import time, random

app = Flask(__name__)

# =========================
# MASTER SETTINGS & TOKENS
# =========================
ZION_AI_SETTINGS = {
    "app_id": "124918",                  # Your App ID
    "real_token": "m04oxPdV6cV6pX4",     # Real Account Token
    "demo_token": "kTYefK9bFG3UPGh",     # Demo Account Token
    "gemini_api_key": "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E",  # Google Gemini API
    "google_assistant_api": "YOUR_GOOGLE_ASSISTANT_API_TOKEN",
    "whatsapp": "254742024175",          # WhatsApp link
    "stake": 0.35,
    "martingale": 2.1,
    "max_steps": 3,
    "confidence_threshold": 95,
    "cooldown_seconds": 10,
    "daily_stop_loss": -50,
    "daily_take_profit": 100,
    "mode": "demo"  # demo or real
}

# Approved markets (plain and 1-second indices)
MARKETS = [
    {"symbol": "R_10", "name": "Volatility 10 Index"},
    {"symbol": "R_25", "name": "Volatility 25 Index"},
    {"symbol": "R_50", "name": "Volatility 50 Index"},
    {"symbol": "R_75", "name": "Volatility 75 Index"},
    {"symbol": "R_100", "name": "Volatility 100 Index"},
    {"symbol": "R_10_1S", "name": "Volatility 10 (1s)"},
    {"symbol": "R_25_1S", "name": "Volatility 25 (1s)"},
    {"symbol": "R_50_1S", "name": "Volatility 50 (1s)"},
    {"symbol": "R_75_1S", "name": "Volatility 75 (1s)"},
    {"symbol": "R_100_1S", "name": "Volatility 100 (1s)"}
]

last_trade_time = 0

# =========================
# SIGNAL ENGINE
# =========================
def generate_signal():
    strategy_scores = {
        "even_odd": random.randint(0, 100),
        "over_under": random.randint(0, 100),
        "momentum": random.randint(0, 100),
        "digit_bias": random.randint(0, 100)
    }
    confidence = int(sum(strategy_scores.values()) / len(strategy_scores))
    signal = {
        "market": random.choice(MARKETS),
        "direction": random.choice(["RISE", "FALL"]),
        "confidence": confidence,
        "strategies": strategy_scores,
        "timestamp": int(time.time())
    }
    return signal

# =========================
# DISCIPLINE CHECK
# =========================
def can_trade(signal):
    global last_trade_time
    if signal["confidence"] < ZION_AI_SETTINGS["confidence_threshold"]:
        return False, "Confidence too low"
    if time.time() - last_trade_time < ZION_AI_SETTINGS["cooldown_seconds"]:
        return False, "Cooldown active"
    return True, "Approved"

# =========================
# ROUTES
# =========================
@app.route("/")
def index():
    return render_template_string(TEMPLATE,
                                  config=ZION_AI_SETTINGS,
                                  markets=MARKETS)

@app.route("/signal")
def signal():
    sig = generate_signal()
    allowed, reason = can_trade(sig)
    sig["allowed"] = allowed
    sig["reason"] = reason
    return jsonify(sig)

@app.route("/confirm", methods=["POST"])
def confirm():
    global last_trade_time
    last_trade_time = time.time()
    return jsonify({"status": "Trade acknowledged (manual execution required)"})

@app.route("/toggle_mode", methods=["POST"])
def toggle_mode():
    ZION_AI_SETTINGS["mode"] = "real" if ZION_AI_SETTINGS["mode"] == "demo" else "demo"
    return jsonify({"mode": ZION_AI_SETTINGS["mode"]})

# =========================
# FRONT-END TEMPLATE
# =========================
TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
body { background:#0b0f14; color:white; font-family:sans-serif; margin:0; }
.sidebar { position:fixed; left:0; top:0; width:220px; height:100%; background:#111; padding:15px; overflow:auto; }
.main { margin-left:220px; padding:15px; }
.card { background:#161b22; padding:15px; border-radius:12px; margin-bottom:10px; }
button { padding:15px; font-size:18px; width:100%; border-radius:10px; border:none; cursor:pointer; }
.yes { background:#00ff88; }
.no { background:#ff4444; color:white; margin-top:8px; }
.conf { font-size:22px; font-weight:bold; }
.acc-toggle { padding:8px; border-radius:6px; border:none; cursor:pointer; margin-top:10px; }
.acc-toggle.demo { background:#222; color:#00ff88; }
.acc-toggle.real { background:#ff2222; color:white; }
.wa-float { position:fixed; bottom:20px; right:20px; background:#25d366; color:white; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:25px; text-decoration:none; z-index:1000; }
</style>
</head>
<body>

<div class="sidebar">
<h3>ZION AI</h3>
<p>Mode: <span id="mode">{{ config.mode }}</span></p>
<p>Stake: <span id="stake">{{ config.stake }}</span></p>
<p>Martingale: <span id="martingale">{{ config.martingale }}</span></p>
<button id="toggleBtn" class="acc-toggle {{ config.mode }}">{{ config.mode.upper() }}</button>
<hr>
<h4>Markets</h4>
<ul>
{% for m in markets %}
<li>{{ m.name }}</li>
{% endfor %}
</ul>
</div>

<div class="main">
<div class="card">
<h2>Live Signal</h2>
<p id="market">Scanning...</p>
<p id="direction"></p>
<p class="conf" id="confidence"></p>
<p id="reason"></p>
<button class="yes" onclick="confirmTrade()">YES – FOLLOW RULES</button>
<button class="no">NO – SKIP</button>
</div>
</div>

<a href="https://wa.me/{{ config.whatsapp }}" class="wa-float" target="_blank"><i class="fab fa-whatsapp"></i></a>

<script>
let currentSignal = null;

function fetchSignal(){
    fetch('/signal')
    .then(r=>r.json())
    .then(d=>{
        currentSignal = d;
        document.getElementById('market').innerText = d.market.name;
        document.getElementById('direction').innerText = "Direction: " + d.direction;
        document.getElementById('confidence').innerText = "Confidence: " + d.confidence + "%";
        document.getElementById('reason').innerText = d.allowed ? "APPROVED" : "BLOCKED: " + d.reason;
        if(d.allowed){
            speak("Signal approved. Awaiting confirmation.");
        } else {
            speak("Signal blocked.");
        }
    });
}

function confirmTrade(){
    if(!currentSignal || !currentSignal.allowed){
        alert("Trade blocked by rules.");
        return;
    }
    fetch('/confirm',{method:'POST'})
    speak("Trade confirmed. Discipline maintained.");
}

function speak(text){
    const msg = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(msg);
}

// Toggle Real/Demo Mode
document.getElementById('toggleBtn').addEventListener('click', ()=>{
    fetch('/toggle_mode',{method:'POST'}).then(r=>r.json()).then(d=>{
        document.getElementById('mode').innerText = d.mode;
        let btn = document.getElementById('toggleBtn');
        btn.innerText = d.mode.toUpperCase();
        btn.className = 'acc-toggle ' + d.mode;
    });
});

setInterval(fetchSignal, 5000);
fetchSignal();
</script>

</body>
</html>
"""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
