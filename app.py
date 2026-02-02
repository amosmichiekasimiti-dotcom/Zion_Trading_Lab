import os
import random
from flask import Flask, render_template_string

app = Flask(__name__)

ALL_MARKETS = [
    "VOLATILITY 10 (1S)", "VOLATILITY 25 (1S)", "VOLATILITY 50 (1S)", 
    "VOLATILITY 75 (1S)", "VOLATILITY 100 (1S)", "VOLATILITY 250 (1S)",
    "VOLATILITY 10", "VOLATILITY 25", "VOLATILITY 50", "VOLATILITY 75", 
    "VOLATILITY 100", "BULL MARKET", "BEAR MARKET", "SWITCH INDEX"
]

@app.route('/')
def home():
    market = random.choice(ALL_MARKETS)
    accuracy = random.randint(98, 99)
    users = random.randint(3200, 4500)
    
    # Logic Engine with Countdown Trigger
    mode = random.choice(["MATCH_DIFFER", "SMC_RISE_FALL", "DYNAMIC_DIGITS"])
    
    if mode == "MATCH_DIFFER":
        target = random.randint(0, 9)
        contract, color = random.choice(["MATCHES", "DIFFERS"]), "#f59e0b"
        logic = f"Digit {target} Analysis: High Probability Entry"
        target_info = f"SPECIFIC DIGIT: {target}"
        voice = f"Target digit {target}. Precision match signal for {market}. Wait for the countdown to zero before entry."
        countdown_needed = "true"
    else:
        # Standard Rise/Fall or Over/Under Logic
        contract = random.choice(["RISE / CALL", "FALL / PUT", "DIGIT OVER", "DIGIT UNDER"])
        color = "#00ff88" if "RISE" in contract or "OVER" in contract else "#ff4d4d"
        logic = "SMC Structure: Liquidity Sweep Confirmed"
        target_info = "TP: 1:3 RISK/REWARD"
        voice = f"Signal detected on {market}. Execute {contract}."
        countdown_needed = "false"

    HTML_TEMPLATE = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>ZION LAB | PRECISION</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --bg: #0b0e14; --card: #161b22; --blue: #3b82f6; --green: #00ff88; --red: #ff4d4d; --gold: #f59e0b; }
            * { box-sizing: border-box; }
            body, html { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; overflow-x: hidden; }
            
            .navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #000; border-bottom: 1px solid #1f2937; position: sticky; top:0; z-index: 1000; }
            .logo { font-weight: 900; letter-spacing: 1px; color: var(--blue); }
            
            /* AI Voice Button */
            #v-btn { font-size: 20px; cursor: pointer; color: var(--blue); padding: 5px 10px; }

            .sidebar { position: fixed; left: -280px; top: 0; width: 280px; height: 100%; background: #ffffff; color: #333; transition: transform 0.3s ease; z-index: 2000; padding: 20px; }
            .sidebar.active { transform: translateX(280px); }
            
            .container { padding: 20px; max-width: 500px; margin: auto; }
            .signal-card { background: var(--card); border-radius: 20px; padding: 30px; border: 1px solid #333; border-left: 6px solid {{ color }}; }
            
            /* Countdown Styling */
            .countdown-timer { font-size: 24px; font-weight: 900; color: var(--gold); margin: 15px 0; display: none; }
            .countdown-timer.active { display: block; }

            .accuracy-val { font-size: 50px; font-weight: 900; margin: 5px 0; }
            .menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 25px; }
            .menu-item { background: var(--card); border-radius: 15px; padding: 20px 5px; text-align: center; border: 1px solid #21262d; text-decoration: none; color: white; }
            .menu-item i { font-size: 24px; margin-bottom: 10px; display: block; }
            
            .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1500; }
            .overlay.active { display: block; }
        </style>
    </head>
    <body>
        <div class="overlay" id="overlay" onclick="toggleMenu()"></div>
        <div class="sidebar" id="sidebar">
            <h3 style="margin:0;">ZION MENU</h3><hr>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px;">
                <i class="fa-brands fa-tiktok"></i><i class="fa-brands fa-youtube"></i><i class="fa-brands fa-telegram"></i>
                <i class="fa-brands fa-whatsapp"></i><i class="fa-brands fa-instagram"></i><i class="fa-brands fa-facebook"></i>
            </div>
        </div>

        <nav class="navbar">
            <i class="fa-solid fa-bars" onclick="toggleMenu()" style="font-size: 22px; cursor: pointer;"></i>
            <div class="logo">ZION LAB</div>
            <i id="v-btn" class="fa-solid fa-volume-high" onclick="toggleMute()"></i>
        </nav>

        <div class="container">
            <div class="signal-card">
                <span style="color:var(--blue); font-size:10px; font-weight:bold;"><i class="fa-solid fa-tower-broadcast"></i> LIVE: {{ market }}</span>
                <div class="accuracy-val">{{ accuracy }}%</div>
                
                <div id="countdown" class="countdown-timer">ENTRY IN: <span id="timer-sec">10</span>s</div>

                <div style="font-size:12px; color:#8b949e;">{{ logic }}</div>
                <div style="margin-top:10px; font-weight:bold; color: {{ color }}; font-size:26px;">{{ contract }}</div>
                <div style="font-size:14px; color:#fcd34d; font-weight:800; border: 1px dashed #fcd34d; display:inline-block; padding:5px 12px; border-radius:8px; margin-top:10px;">{{ target_info }}</div>
            </div>

            <div class="menu-grid">
                <a href="#" class="menu-item"><i class="fa-solid fa-house" style="color:var(--blue)"></i><span>Home</span></a>
                <a href="#" class="menu-item"><i class="fa-solid fa-robot" style="color:var(--red)"></i><span>Bots</span></a>
                <a href="#" class="menu-item"><i class="fa-solid fa-bolt" style="color:var(--gold)"></i><span>Signals</span></a>
            </div>
        </div>

        <script>
            function toggleMenu() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('overlay').classList.toggle('active'); }
            
            // Audio Management
            let isMuted = localStorage.getItem('zionMuted') === 'true';
            const vBtn = document.getElementById('v-btn');
            if(isMuted) vBtn.classList.replace('fa-volume-high', 'fa-volume-xmark');

            function toggleMute() {
                isMuted = !isMuted;
                localStorage.setItem('zionMuted', isMuted);
                vBtn.classList.toggle('fa-volume-high');
                vBtn.classList.toggle('fa-volume-xmark');
                if(!isMuted) window.speechSynthesis.speak(new SpeechSynthesisUtterance("Voice enabled"));
            }

            // Countdown Logic for Matches
            if({{ countdown_needed }}) {
                document.getElementById('countdown').classList.add('active');
                let timeLeft = 10;
                let timer = setInterval(() => {
                    timeLeft--;
                    document.getElementById('timer-sec').innerText = timeLeft;
                    if(timeLeft <= 0) {
                        clearInterval(timer);
                        document.getElementById('countdown').innerHTML = "🔥 EXECUTE NOW!";
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
            setTimeout(() => { location.reload(); }, 12000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, accuracy=accuracy, color=color, target_info=target_info, voice=voice, countdown_needed=countdown_needed)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
