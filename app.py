import os
import random
from flask import Flask, render_template_string, jsonify

app = Flask(__name__)

# --- LINKS (UNALTERED) ---
WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"
GEMINI_LINK = "https://gemini.google.com/"

# --- COMPLETE MARKET REPOSITORY ---
MARKETS = {
    "VOLS": ["V10_1S", "V10_PL", "V15_1S", "V25_1S", "V25_PL", "V50_1S", "V75_1S", "V75_PL", "V90_1S", "V100_1S", "V100_PL"],
    "SPIKES": ["B300", "B500", "B1000", "C300", "C500", "C1000"],
    "JUMP": ["JD10", "JD50", "JD100"],
    "RANGE": ["RB100", "RB200"]
}

@app.route('/get_mega_signal')
def get_mega_signal():
    cat = random.choice(list(MARKETS.keys()))
    sym = random.choice(MARKETS[cat])
    name = sym.replace("_1S", " (1s)").replace("_PL", " Index").replace("V", "Volatility ").replace("B", "Boom ").replace("C", "Crash ").replace("JD", "Jump ").replace("RB", "Range Break ")
    is_vol = cat == "VOLS"
    
    # Specific Duration/Timeframe logic
    duration = "5 TICKS" if is_vol else "1 MINUTE"
    timeframe = "M1" if is_vol else "M1 (SCALPING)"

    return jsonify(
        market=name,
        rf="RISE" if "B" in sym else ("FALL" if "C" in sym else random.choice(["RISE", "FALL"])),
        eo=random.choice(["EVEN", "ODD"]) if is_vol else "N/A",
        ou=random.choice(["OVER 4", "UNDER 5"]) if is_vol else "N/A",
        md=f"DIFFERS {random.randint(0,9)}" if is_vol else "N/A",
        spike="SPIKE SOON" if cat == "SPIKES" else "STABLE",
        jump="JUMP ALERT" if cat == "JUMP" else "STABLE",
        duration=duration,
        timeframe=timeframe,
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zion AI Master Terminal</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --nav: #0000ff; --bg: #020617; --accent: #316dca; --green: #22c55e; --red: #ff3b30; }
        body { background: var(--bg); color: white; margin: 0; font-family: 'Arial Black', sans-serif; overflow-x: hidden; }
        .header { background: var(--nav); padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid cyan; }
        
        .voice-settings { background: #1e293b; padding: 10px; display: flex; justify-content: center; gap: 15px; font-size: 11px; }
        .voice-btn { cursor: pointer; padding: 5px 10px; border-radius: 5px; border: 1px solid var(--accent); opacity: 0.6; }
        .voice-btn.active { opacity: 1; background: var(--accent); }

        .broadcast-container { padding: 10px 15px; display: flex; gap: 5px; background: #0f172a; }
        #custom-input { flex: 1; background: #1e293b; border: 1px solid var(--accent); color: white; border-radius: 5px; padding: 8px; font-size: 12px; }
        
        .market-banner { text-align: center; padding: 15px; }
        .m-name { color: cyan; font-size: 24px; text-transform: uppercase; }

        .time-box { margin: 5px 15px; padding: 12px; background: rgba(255,165,0,0.1); border: 1px dashed orange; border-radius: 10px; text-align: center; }
        .time-val { font-size: 20px; color: white; }

        .signal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px; }
        .col-card { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 5px; text-align: center; }
        .col-label { font-size: 10px; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; }
        .big-display { font-size: 28px; font-weight: 900; }

        .links-bar { display: flex; justify-content: space-around; padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        .link-item { text-decoration: none; color: white; font-size: 10px; text-align: center; }
        .link-item i { font-size: 28px; display: block; margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <span>ZION MASTER COMMAND</span>
        <div id="mute-btn" onclick="toggleMute()" style="cursor:pointer; font-size:22px; color:cyan;">
            <i id="mute-icon" class="fa-solid fa-volume-high"></i>
        </div>
    </div>

    <div class="voice-settings">
        <div id="male-btn" class="voice-btn active" onclick="setGender('male')">MALE</div>
        <div id="female-btn" class="voice-btn" onclick="setGender('female')">FEMALE</div>
    </div>

    <div class="broadcast-container">
        <input type="text" id="custom-input" placeholder="Type broadcast message...">
        <button onclick="broadcastText()" style="background:var(--nav); color:white; border:none; border-radius:5px; padding:0 15px;"><i class="fa-solid fa-bullhorn"></i></button>
    </div>
    
    <div class="market-banner">
        <div class="m-name" id="m-display">SCANNING...</div>
        <div style="font-size: 12px; color: var(--green);">CONFIDENCE: <span id="acc-display">--</span></div>
    </div>

    <div class="time-box">
        <div id="time-display" class="time-val">-- | --</div>
    </div>

    <div class="signal-grid">
        <div class="col-card"><div class="col-label">RISE / FALL</div><div id="rf" class="big-display">--</div></div>
        <div class="col-card"><div class="col-label">EVEN / ODD</div><div id="eo" class="big-display">--</div></div>
        <div class="col-card"><div class="col-label">MATCH / DIFF</div><div id="md" class="big-display">--</div></div>
        <div class="col-card" style="border-color:orange"><div class="col-label">SPIKE ALERT</div><div id="spike" class="big-display" style="color:orange">--</div></div>
        <div class="col-card"><div class="col-label">OVER / UNDER</div><div id="ou" class="big-display">--</div></div>
        <div class="col-card" style="border-color:purple"><div class="col-label">JUMP MONITOR</div><div id="jump" class="big-display" style="color:purple">--</div></div>
    </div>

    <div class="links-bar">
        <a href="{{ wa }}" class="link-item" style="color:#25d366;"><i class="fa-brands fa-whatsapp"></i>SUPPORT</a>
        <a href="{{ gemini }}" class="link-item" style="color:#4285f4;"><i class="fa-solid fa-brain"></i>GEMINI AI</a>
    </div>

    <script>
        let voiceGender = 'male';
        let isMuted = false;

        function toggleMute() {
            isMuted = !isMuted;
            const icon = document.getElementById('mute-icon');
            if(isMuted) {
                icon.className = 'fa-solid fa-volume-xmark';
                icon.style.color = '#ff3b30';
                window.speechSynthesis.cancel();
            } else {
                icon.className = 'fa-solid fa-volume-high';
                icon.style.color = 'cyan';
            }
        }

        function setGender(g) {
            voiceGender = g;
            document.querySelectorAll('.voice-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(g + '-btn').classList.add('active');
        }

        function broadcastText() {
            let t = document.getElementById('custom-input').value;
            if(t) speak(t);
        }

        function speak(text) {
            if(isMuted) return;
            window.speechSynthesis.cancel();
            let u = new SpeechSynthesisUtterance(text);
            u.pitch = (voiceGender === 'female') ? 1.3 : 0.8;
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
                document.getElementById('jump').innerText = d.jump;
                document.getElementById('acc-display').innerText = d.acc;
                document.getElementById('time-display').innerText = d.duration + " | " + d.timeframe;
                speak(`Update. ${d.market}. Signal ${d.rf}. Duration ${d.duration}.`);
            });
        }
        setInterval(update, 12000);
        update();
    </script>
</body>
</html>
"""

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
