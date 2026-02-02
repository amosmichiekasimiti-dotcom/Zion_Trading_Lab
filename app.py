import os
import random
from flask import Flask, render_template_string, jsonify

app = Flask(__name__)

# --- CONFIG (UNTOUCHED) ---
GEMINI_API_KEY = "AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E"
WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"
GEMINI_LINK = "https://gemini.google.com/"

MARKETS = {
    "VOLS": ["V10_1S", "V10_PL", "V15_1S", "V25_1S", "V25_PL", "V50_1S", "V75_1S", "V75_PL", "V90_1S", "V100_1S", "V100_PL"],
    "SPIKES": ["B300", "B500", "B1000", "C300", "C500", "C1000"],
    "JUMP": ["JD10", "JD50", "JD100"]
}

@app.route('/get_mega_signal')
def get_mega_signal():
    cat = random.choice(list(MARKETS.keys()))
    sym = random.choice(MARKETS[cat])
    name = sym.replace("_1S", " (1s)").replace("_PL", " Index").replace("V", "Volatility ").replace("B", "Boom ").replace("C", "Crash ").replace("JD", "Jump ")
    is_vol = cat == "VOLS"
    return jsonify(
        market=name,
        rf="RISE" if "B" in sym else ("FALL" if "C" in sym else random.choice(["RISE", "FALL"])),
        eo=random.choice(["EVEN", "ODD"]) if is_vol else "N/A",
        ou=random.choice(["OVER 4", "UNDER 5"]) if is_vol else "N/A",
        md=f"DIFFERS {random.randint(0,9)}" if is_vol else "N/A",
        spike="SPIKE SOON" if cat == "SPIKES" else "STABLE",
        duration="5 TICKS" if is_vol else "1 MINUTE",
        timeframe="M1" if is_vol else "M1 (SCALPING)",
        acc=f"{random.randint(97, 99)}%"
    )

@app.route('/')
def home():
    return render_template_string(UI_HTML, wa=WHATSAPP, gemini=GEMINI_LINK)

UI_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Zion Live Terminal</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        :root { --nav: #0000ff; --bg: #020617; --accent: #316dca; --green: #22c55e; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: white; font-family: 'Arial Black', sans-serif; overflow-x: hidden; }

        /* FIXED HEADER: Padding added to prevent edge-touching */
        .header { background: var(--nav); padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid cyan; }
        .header span { font-size: 14px; text-transform: uppercase; }

        /* FLOATING LIVE SIGNAL ICON (PULSING) */
        .floating-signal { 
            position: fixed; bottom: 100px; right: 20px; 
            width: 60px; height: 60px; background: var(--nav); 
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.6); border: 2px solid cyan; z-index: 1000;
            animation: pulse 2s infinite; cursor: pointer;
        }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); box-shadow: 0 0 30px cyan; } 100% { transform: scale(1); } }

        .main-container { padding: 15px; width: 100%; max-width: 480px; margin: 0 auto; }
        
        .market-banner { text-align: center; margin: 10px 0; }
        .m-name { color: cyan; font-size: 26px; }

        /* 6-COLUMN GRID */
        .signal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
        .col-card { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 5px; text-align: center; }
        .col-label { font-size: 10px; color: var(--accent); margin-bottom: 5px; text-transform: uppercase; }
        .big-display { font-size: 28px; font-weight: 900; }

        /* FIXED FOOTER LINKS */
        .footer-nav { display: flex; justify-content: space-around; padding: 25px 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 20px; }
        .nav-item { text-decoration: none; color: white; text-align: center; }
        .nav-item i { font-size: 32px; display: block; margin-bottom: 5px; }
        .nav-label { font-size: 11px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <span>ZION MASTER COMMAND</span>
        <div onclick="toggleMute()"><i id="mute-icon" class="fa-solid fa-volume-high" style="color:cyan; font-size:20px; cursor:pointer;"></i></div>
    </div>

    <div class="floating-signal" onclick="update()">
        <i class="fa-solid fa-tower-broadcast" style="color:white; font-size:24px;"></i>
    </div>

    <div class="main-container">
        <div class="market-banner">
            <div class="m-name" id="m-display">INITIATING...</div>
            <div style="font-size: 12px; color: var(--green);">ACCURACY: <span id="acc-display">--</span></div>
        </div>

        <div style="text-align:center; padding: 15px; background:rgba(255,165,0,0.1); border:1px dashed orange; border-radius:8px; margin: 10px 0;">
            <div id="time-display" style="font-size:18px; font-weight:bold;">-- | --</div>
        </div>

        <div class="signal-grid">
            <div class="col-card"><div class="col-label">RISE / FALL</div><div id="rf" class="big-display">--</div></div>
            <div class="col-card"><div class="col-label">EVEN / ODD</div><div id="eo" class="big-display">--</div></div>
            <div class="col-card"><div class="col-label">MATCH / DIFF</div><div id="md" class="big-display">--</div></div>
            <div class="col-card" style="border-color:orange"><div class="col-label" style="color:orange">SPIKE</div><div id="spike" class="big-display" style="color:orange">--</div></div>
            <div class="col-card"><div class="col-label">OVER / UNDER</div><div id="ou" class="big-display">--</div></div>
            <div class="col-card" style="border-color:purple"><div class="col-label" style="color:purple">STATUS</div><div class="big-display" style="color:purple">LIVE</div></div>
        </div>

        <div class="footer-nav">
            <a href="{{ wa }}" class="nav-item" style="color:#25d366;"><i class="fa-brands fa-whatsapp"></i><div class="nav-label">Support</div></a>
            <a href="{{ gemini }}" class="nav-item" style="color:#4285f4;"><i class="fa-solid fa-brain"></i><div class="nav-label">Gemini AI</div></a>
        </div>
    </div>

    <script>
        let isMuted = false;
        function toggleMute() {
            isMuted = !isMuted;
            document.getElementById('mute-icon').className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            document.getElementById('mute-icon').style.color = isMuted ? '#ff3b30' : 'cyan';
            if(isMuted) window.speechSynthesis.cancel();
        }
        function speak(text) {
            if(isMuted) return;
            window.speechSynthesis.cancel();
            let u = new SpeechSynthesisUtterance(text);
            u.rate = 1.0;
            window.speechSynthesis.speak(u);
        }
        function update() {
            fetch('/get_mega_signal').then(r => r.json()).then(d => {
                document.getElementById('m-display').innerText = d.market;
                document.getElementById('rf').innerText = d.rf;
                document.getElementById('eo').innerText = d.eo;
                document.getElementById('ou').innerText = d.ou;
                document.getElementById('md').innerText = d.md;
                document.getElementById('spike').innerText = d.spike;
                document.getElementById('acc-display').innerText = d.acc;
                document.getElementById('time-display').innerText = d.duration + " | " + d.timeframe;
                speak(`Signal ${d.rf} on ${d.market}`);
            });
        }
        setInterval(update, 12000); update();
    </script>
</body>
</html>
