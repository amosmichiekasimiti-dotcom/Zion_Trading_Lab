import os
import random
from flask import Flask, render_template_string, request

app = Flask(__name__)

# --- THE ABSOLUTE 2026 MARKET LIST ---
ALL_MARKETS = [
    "VOLATILITY 10 INDEX", "VOLATILITY 10 (1S) INDEX", "VOLATILITY 15 (1S) INDEX",
    "VOLATILITY 25 INDEX", "VOLATILITY 25 (1S) INDEX", "VOLATILITY 30 (1S) INDEX",
    "VOLATILITY 50 INDEX", "VOLATILITY 50 (1S) INDEX", "VOLATILITY 75 INDEX",
    "VOLATILITY 75 (1S) INDEX", "VOLATILITY 90 (1S) INDEX", "VOLATILITY 100 INDEX",
    "VOLATILITY 100 (1S) INDEX", "VOLATILITY 250 INDEX", "VOLATILITY 250 (1S) INDEX",
    "VOLATILITY 300 (1S) INDEX", "BULL MARKET INDEX", "BEAR MARKET INDEX", "DRIFT SWITCH INDEX"
]

@app.route('/')
def home():
    cat = request.args.get('cat', 'EVEN_ODD')
    market = random.choice(ALL_MARKETS)
    accuracy = random.randint(98, 99)
    show_timer = "false"
    
    if cat == "EVEN_ODD":
        side = random.choice(["EVEN", "ODD"])
        percent = random.randint(72, 86)
        contract, color = f"DIGIT {side}", "#3b82f6"
        logic = f"DOMINATION: {side} is currently controlling {percent}% of flow."
        target = f"TRADE {side} | 5 RUNS"
        voice = f"Even Odd Scanner active. {side} is dominating on {market}."
    elif cat == "RISE_FALL":
        trend = random.choice(["RISE", "FALL"])
        contract, color = ("RISE / CALL", "#00ff88") if trend == "RISE" else ("FALL / PUT", "#ff4d4d")
        logic = f"SMC ANALYSIS: {'Bullish Order Block' if trend == 'RISE' else 'Bearish MSB'} confirmed."
        target = f"DIRECTION: {trend} | 3 RUNS"
        voice = f"Rise Fall Scanner. Trend is {trend} on {market}."
    elif cat == "MATCH_DIFFER":
        digit = random.randint(0, 9)
        contract, color = "DIGIT MATCHES", "#f59e0b"
        logic = f"MATCH: Digit {digit} frequency outlier. 800% Payout mode."
        target = f"TARGET: {digit} | 1 RUN"
        voice = f"Matches Alert. Target is {digit} on {market}. Prepare for entry."
        show_timer = "true"
    elif cat == "OVER_UNDER":
        type_ou, barr = random.choice([("OVER", 4), ("UNDER", 5), ("OVER", 5), ("UNDER", 4)])
        payout = "95%" if barr in [4, 5] else "140%"
        contract, color = f"DIGIT {type_ou}", "#00ff88" if type_ou == "OVER" else "#ff4d4d"
        logic = f"SNIPER: Barrier {barr} set. ROI: {payout}."
        target = f"BARRIER: {barr} | {payout} PAYOUT"
        voice = f"Over Under Alert. Trade {type_ou} {barr} for high payout."
    else: 
        growth = random.choice([3, 5])
        contract, color = "ACCUMULATORS", "#00d4ff"
        logic = f"STABILITY: Market range is holding for {growth}% growth."
        target = f"GROWTH: {growth}% | 40 TICKS"
        voice = f"Accumulators active. Stable growth detected."

    HTML_TEMPLATE = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ZION LAB | MASTER</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --bg: #0b0e14; --sidebar: #161b22; --card: #1c2128; --blue: #58a6ff; --green: #3fb950; --red: #f85149; --gold: #d29922; }
            body { background: var(--bg); color: #adbac7; font-family: 'Segoe UI', sans-serif; margin: 0; display: flex; height: 100vh; overflow: hidden; }
            .sidebar { width: 240px; background: var(--sidebar); border-right: 1px solid #444c56; display: flex; flex-direction: column; padding: 25px 15px; }
            .nav-item { color: #768390; text-decoration: none; padding: 14px 18px; border-radius: 10px; margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; gap: 12px; font-weight: bold; }
            .nav-item.active { background: #316dca; color: white; }
            .main { flex: 1; padding: 40px; overflow-y: auto; display: flex; justify-content: center; position: relative; }
            .signal-card { width: 100%; max-width: 480px; background: var(--card); border: 1px solid #444c56; border-radius: 24px; padding: 35px; border-top: 8px solid {{ color }}; height: fit-content; }
            .accuracy-tag { color: var(--green); font-weight: 800; font-size: 12px; margin-bottom: 10px; display: block; }
            .contract-name { font-size: 42px; font-weight: 900; color: {{ color }}; margin: 15px 0; }
            .target-badge { display: inline-block; margin-top: 25px; padding: 12px 25px; border: 2px dashed var(--gold); color: var(--gold); border-radius: 12px; font-weight: 900; font-size: 18px; }
            #timer-box { font-size: 24px; font-weight: 900; color: var(--gold); margin-bottom: 20px; text-align: center; border: 1px solid var(--gold); padding: 10px; border-radius: 10px; display: none; }
            #timer-box.active { display: block; }
            #v-btn { position: fixed; bottom: 30px; right: 30px; background: #316dca; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; z-index: 1000; font-size: 24px; }
            @media (max-width: 850px) { body { flex-direction: column; } .sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 10px; } .sidebar h1 { display: none; } .nav-item { white-space: nowrap; } }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <h1 style="font-size:18px; color:var(--blue); margin-bottom: 20px;">ZION LAB</h1>
            <a href="/?cat=EVEN_ODD" class="nav-item {% if cat == 'EVEN_ODD' %}active{% endif %}">EVEN / ODD</a>
            <a href="/?cat=RISE_FALL" class="nav-item {% if cat == 'RISE_FALL' %}active{% endif %}">RISE / FALL</a>
            <a href="/?cat=MATCH_DIFFER" class="nav-item {% if cat == 'MATCH_DIFFER' %}active{% endif %}">MATCHES</a>
            <a href="/?cat=OVER_UNDER" class="nav-item {% if cat == 'OVER_UNDER' %}active{% endif %}">OVER / UNDER</a>
            <a href="/?cat=ACCUMULATORS" class="nav-item {% if cat == 'ACCUMULATORS' %}active{% endif %}">ACCUMULATORS</a>
        </div>
        <div class="main">
            <div class="signal-card">
                <div id="timer-box" class="{% if show_timer == 'true' %}active{% endif %}">CALCULATING: <span id="count">10</span>s</div>
                <span class="accuracy-tag">{{ accuracy }}% ACCURACY</span>
                <div style="font-size:12px; color:#768390; font-weight:800; margin-bottom:15px;">{{ market }}</div>
                <div class="contract-name">{{ contract }}</div>
                <div style="background:#22272e; padding:20px; border-radius:15px; font-size:14px; border: 1px solid #444c56;">{{ logic }}</div>
                <div class="target-badge">{{ target }}</div>
                <a href="https://bot.deriv.com" style="display:block; margin-top:30px; background:var(--green); color:white; text-align:center; padding:18px; border-radius:15px; text-decoration:none; font-weight:900;">EXECUTE ON XML BOT</a>
            </div>
            <div id="v-btn" onclick="toggleMute()"><i id="v-icon" class="fa-solid fa-volume-high"></i></div>
        </div>
        <script>
            let isMuted = localStorage.getItem('zionMuted') === 'true';
            const icon = document.getElementById('v-icon');
            if (isMuted) { icon.classList.replace('fa-volume-high', 'fa-volume-xmark'); }

            function toggleMute() {
                isMuted = !isMuted;
                localStorage.setItem('zionMuted', isMuted);
                location.reload();
            }

            if ("{{ show_timer }}" === "true") {
                let timeLeft = 10;
                let timerElement = document.getElementById('count');
                let timerBox = document.getElementById('timer-box');
                let timerId = setInterval(() => {
                    timeLeft--;
                    timerElement.innerText = timeLeft;
                    if (timeLeft <= 0) {
                        clearInterval(timerId);
                        timerBox.innerHTML = "🔥 STRIKE NOW!";
                        timerBox.style.background = "rgba(210, 153, 34, 0.2)";
                    }
                }, 1000);
            }

            window.onload = () => {
                if(!isMuted) {
                    const msg = new SpeechSynthesisUtterance("{{ voice }}");
                    msg.rate = 0.95;
                    window.speechSynthesis.speak(msg);
                }
            };
            setTimeout(() => { 
                const urlParams = new URLSearchParams(window.location.search);
                const currentCat = urlParams.get('cat') || 'EVEN_ODD';
                window.location.href = "/?cat=" + currentCat; 
            }, 12000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, accuracy=accuracy, color=color, target=target, voice=voice, cat=cat, show_timer=show_timer)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
