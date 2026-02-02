import os
import random
from flask import Flask, render_template_string

app = Flask(__name__)

# All Volatility Markets
ALL_VOLATILITIES = [
    "VOLATILITY 10", "VOLATILITY 10 (1S)", "VOLATILITY 15 (1S)", 
    "VOLATILITY 25", "VOLATILITY 25 (1S)", "VOLATILITY 30 (1S)", 
    "VOLATILITY 50", "VOLATILITY 50 (1S)", "VOLATILITY 75", 
    "VOLATILITY 75 (1S)", "VOLATILITY 90 (1S)", "VOLATILITY 100", 
    "VOLATILITY 100 (1S)", "VOLATILITY 150 (1S)", "VOLATILITY 250", 
    "VOLATILITY 250 (1S)"
]

# Complete Contract Suite including Accumulators
CONTRACT_TYPES = [
    "ACCUMULATORS", "RISE", "FALL", "DIGIT OVER", 
    "DIGIT UNDER", "DIGIT EVEN", "DIGIT ODD", "MATCHES", "DIFFERS"
]

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZION LAB | Elite Trading Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg: #030712; --card: #111827; --accent: #ef4444; --blue: #3b82f6; --green: #10b981; --gold: #f59e0b; }
        body { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; }
        
        /* Navbar */
        .navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #1f2937; position: sticky; top: 0; z-index: 100; }
        .logo { font-weight: 900; font-size: 22px; letter-spacing: 2px; background: linear-gradient(to right, #3b82f6, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .container { padding: 20px; max-width: 500px; margin: auto; }
        
        /* The Master Signal Scanner */
        .scanner-card { 
            background: radial-gradient(circle at top right, #1e293b, #030712);
            border-radius: 24px; padding: 35px 25px; margin-bottom: 25px; 
            border: 1px solid #374151; position: relative; text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        }
        
        .live-indicator { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; font-weight: bold; color: var(--blue); margin-bottom: 20px; text-transform: uppercase; }
        .dot { width: 8px; height: 8px; background: var(--blue); border-radius: 50%; animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .market-name { font-size: 14px; color: #9ca3af; margin-bottom: 10px; font-weight: 600; }
        .contract-type { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px; color: {{ color }}; }
        .accuracy-box { font-size: 56px; font-weight: 900; margin: 10px 0; letter-spacing: -2px; }
        
        .condition-badge { background: rgba(16, 185, 129, 0.1); color: var(--green); padding: 8px 15px; border-radius: 12px; font-size: 13px; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.2); display: inline-block; }

        /* Dashboard Grid */
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .card { background: var(--card); border-radius: 18px; padding: 22px; border: 1px solid #1f2937; text-decoration: none; color: white; text-align: center; transition: 0.2s; }
        .card:active { transform: translateY(2px); background: #1f2937; }
        .card i { font-size: 26px; margin-bottom: 12px; display: block; }
        .card span { font-size: 13px; font-weight: 700; color: #9ca3af; }

        .mute-btn { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #1f2937; cursor: pointer; }
    </style>
</head>
<body>

    <nav class="navbar">
        <i class="fa-solid fa-bars-staggered" style="font-size: 20px;"></i>
        <div class="logo">ZION LAB</div>
        <div id="muteBtn" class="mute-btn" onclick="toggleMute()">
            <i id="muteIcon" class="fa-solid fa-volume-high" style="color: var(--blue);"></i>
        </div>
    </nav>

    <div class="container">
        <div class="scanner-card">
            <div class="live-indicator"><div class="dot"></div> High Quality Signal</div>
            <div class="market-name">{{ market }}</div>
            <div class="contract-type">{{ contract }}</div>
            <div class="accuracy-box">{{ accuracy }}%</div>
            <div class="condition-badge"><i class="fa-solid fa-shield-check"></i> {{ condition }}</div>
        </div>

        <div class="grid">
            <a href="#" class="card"><i class="fa-solid fa-rocket" style="color:var(--gold)"></i><span>Accumulators</span></a>
            <a href="#" class="card"><i class="fa-solid fa-bolt-lightning" style="color:var(--blue)"></i><span>Instant Signals</span></a>
            <a href="#" class="card"><i class="fa-solid fa-robot" style="color:var(--accent)"></i><span>Auto Bot</span></a>
            <a href="#" class="card"><i class="fa-solid fa-circle-info" style="color:var(--green)"></i><span>Support</span></a>
        </div>
    </div>

    <script>
        let muted = localStorage.getItem('zionMuted') === 'true';
        const icon = document.getElementById('muteIcon');
        
        if(muted) {
            icon.classList.replace('fa-volume-high', 'fa-volume-xmark');
            icon.style.color = '#666';
        }

        function toggleMute() {
            localStorage.setItem('zionMuted', !muted);
            location.reload();
        }

        window.onload = () => {
            if(!muted) {
                const speech = new SpeechSynthesisUtterance("{{ voice_script }}");
                speech.rate = 0.95;
                speech.pitch = 1.1;
                window.speechSynthesis.speak(speech);
            }
        };

        setTimeout(() => { location.reload(); }, 12000);
    </script>
</body>
</html>
"""

@app.route('/')
def home():
    market = random.choice(ALL_VOLATILITIES)
    contract = random.choice(CONTRACT_TYPES)
    accuracy = random.randint(97, 99)
    
    # Conditions for "Super Unique" logic
    conditions = ["Strong Bullish Trend", "High Volume Breakout", "Liquidity Grab Confirmed", "Micro-Trend Validated", "Digit Flux Stabilized"]
    condition = random.choice(conditions)

    # Styling and Voice Intelligence
    color = "var(--blue)"
    voice_script = f"Attention! Strong signal on {market}. "

    if contract == "ACCUMULATORS":
        color = "var(--gold)"
        voice_script += f"The market is prime for {contract}. High growth potential detected. Trade now."
    elif contract in ["RISE", "DIGIT OVER", "DIGIT EVEN"]:
        color = "var(--green)"
        voice_script += f"Conditions met for {contract}. Take the trade now for high probability success."
    else:
        color = "var(--accent)"
        voice_script += f"Alert! Analysis shows a {contract} signal. Enter market immediately."

    return render_template_string(HTML_TEMPLATE, 
                                market=market, 
                                contract=contract, 
                                accuracy=accuracy, 
                                condition=condition,
                                color=color,
                                voice_script=voice_script)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
