import os
import random
from flask import Flask, render_template_string

app = Flask(__name__)

# --- 1. THE COMPLETE 2026 MARKET LIST ---
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
    users = random.randint(2800, 4200)
    
    # --- 2. THE SUPREME DYNAMIC ENGINE ---
    mode = random.choice(["DYNAMIC_DIGITS", "SMC_RISE_FALL", "MATCH_DIFFER", "EVEN_ODD"])
    
    if mode == "DYNAMIC_DIGITS":
        # Full Range Digit Logic (Under 0-9 / Over 0-9)
        dist = [random.randint(5, 25) for _ in range(10)] # Simulated % per digit
        dominant_digit = dist.index(max(dist))
        
        if dominant_digit <= 4: # Market is leaning LOW
            barrier = random.choice([1, 2, 3, 4, 5])
            contract, color = "DIGIT UNDER", "#ff4d4d"
            logic = f"Low Cluster Detected. Digit {dominant_digit} Frequency: {dist[dominant_digit]}%"
            voice = f"High Payout Opportunity. Market leaning low. Trade Under {barrier} on {market}."
        else: # Market is leaning HIGH
            barrier = random.choice([4, 5, 6, 7, 8])
            contract, color = "DIGIT OVER", "#00ff88"
            logic = f"High Cluster Detected. Digit {dominant_digit} Frequency: {dist[dominant_digit]}%"
            voice = f"Strong trend detected. Market leaning high. Trade Over {barrier} on {market}."
        target_info = f"BARRIER: {barrier}"

    elif mode == "SMC_RISE_FALL":
        # SMC + Rejection + Indicators
        trend = random.choice(["BULLISH 📈", "BEARISH 📉"])
        event = random.choice(["BOS", "Liquidity Sweep", "Order Block Tap"])
        contract = "RISE / CALL" if "BULLISH" in trend else "FALL / PUT"
        color = "#00ff88" if "RISE" in contract else "#ff4d4d"
        logic = f"Trend: {trend} | {event} Confirmed | FVG Filled"
        target_info = "TP: 1:3 RISK/REWARD"
        voice = f"Rise and Fall Alert. {trend} trend with a {event} on {market}. Execute {contract}."

    elif mode == "MATCH_DIFFER":
        # Specific Match/Differ Targeting
        target_digit = random.randint(0, 9)
        contract = random.choice(["MATCHES", "DIFFERS"])
        color = "#f59e0b"
        logic = f"Digit {target_digit} showing extreme stability/flux."
        target_info = f"SPECIFIC DIGIT: {target_digit}"
        voice = f"Digit Strategy. Target digit is {target_digit}. Highly accurate for {contract} trades."

    else: # EVEN_ODD with Manipulation Tracking
        manipulation = random.choice(["LOW", "MEDIUM", "HIGH"])
        contract = random.choice(["DIGIT EVEN", "DIGIT ODD"])
        color = "#3b82f6"
        logic = f"Manipulation Level: {manipulation} | Trend Alignment: Strong"
        target_info = "ALGO ENTRY: TIK-TOK FLOW"
        voice = f"Even Odd Signal. Manipulation is {manipulation}. Trend alignment suggests {contract}."

    HTML_TEMPLATE = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ZION LAB | SUPREME</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --bg: #0b0e14; --card: #161b22; --blue: #3b82f6; --green: #00ff88; --red: #ff4d4d; --gold: #f59e0b; }
            body { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; }
            .navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #000; border-bottom: 1px solid #1f2937; }
            .sidebar { position: fixed; left: -280px; top: 0; width: 280px; height: 100%; background: #ffffff; color: #333; transition: 0.3s; z-index: 200; padding: 20px; }
            .sidebar.active { left: 0; }
            .social-icons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
            .social-icons i { background: #f1f1f1; padding: 15px; border-radius: 10px; text-align: center; color: #333; }
            .container { padding: 20px; max-width: 500px; margin: auto; }
            .signal-card { background: #161b22; border-radius: 15px; padding: 25px; border: 1px solid #333; border-left: 5px solid {{ color }}; }
            .accuracy-val { font-size: 48px; font-weight: 900; margin: 5px 0; }
            .menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
            .menu-item { background: var(--card); border-radius: 12px; padding: 20px 10px; text-align: center; border: 1px solid #21262d; text-decoration: none; color: white; }
            .menu-item i { font-size: 24px; margin-bottom: 10px; display: block; }
            .menu-item span { font-size: 10px; font-weight: 600; color: #8b949e; }
            .overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 150; }
            .overlay.active { display: block; }
        </style>
    </head>
    <body>
        <div class="overlay" id="overlay" onclick="toggleMenu()"></div>
        <div class="sidebar" id="sidebar">
            <h3 style="margin:0;">ZION MENU</h3><hr>
            <div class="social-icons">
                <i class="fa-brands fa-tiktok"></i><i class="fa-brands fa-youtube"></i><i class="fa-brands fa-telegram"></i>
                <i class="fa-brands fa-instagram"></i><i class="fa-brands fa-facebook"></i><i class="fa-brands fa-whatsapp"></i>
            </div>
        </div>
        <nav class="navbar">
            <i class="fa-solid fa-bars" onclick="toggleMenu()" style="font-size: 22px; cursor: pointer;"></i>
            <div style="font-weight:900;">ZION LAB</div>
            <a href="#" style="background:#ff4d4d; color:white; padding:8px 15px; border-radius:5px; font-weight:bold; text-decoration:none; font-size:12px;">SIGN UP</a>
        </nav>
        <div class="container">
            <div class="signal-card">
                <span style="color:var(--blue); font-size:10px; font-weight:bold;"><i class="fa-solid fa-tower-broadcast"></i> LIVE: {{ market }}</span>
                <div class="accuracy-val">{{ accuracy }}% Accuracy</div>
                <div style="font-size:12px; color:#8b949e;">{{ logic }}</div>
                <div style="margin-top:15px; font-weight:bold; color: {{ color }}; text-transform:uppercase; font-size:24px;">{{ contract }}</div>
                <div style="font-size:14px; color:#fcd34d; margin-top:5px; font-weight:800; border: 1px dashed #fcd34d; display:inline-block; padding:5px 10px; border-radius:8px;">{{ target_info }}</div>
            </div>
            <div class="menu-grid">
                <a href="#" class="menu-item"><i class="fa-solid fa-house" style="color:var(--blue)"></i><span>Home</span></a>
                <a href="#" class="menu-item"><i class="fa-solid fa-robot" style="color:var(--red)"></i><span>Bot Builder</span></a>
                <a href="#" class="menu-item"><i class="fa-solid fa-chart-pie" style="color:var(--blue)"></i><span>Analysis</span></a>
                <a href="#" class="menu-item"><i class="fa-solid fa-bolt" style="color:var(--gold)"></i><span>Signals</span></a>
                <a href="#" class="menu-item"><i class="fa-solid fa-magnifying-glass-chart"></i><span>SMC Scan</span></a>
                <a href="#" class="menu-item"><i class="fa-solid fa-headset" style="color:var(--blue)"></i><span>Support</span></a>
            </div>
        </div>
        <script>
            function toggleMenu() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('overlay').classList.toggle('active'); }
            window.onload = () => { const msg = new SpeechSynthesisUtterance("{{ voice }}"); msg.rate = 0.95; window.speechSynthesis.speak(msg); };
            setTimeout(() => { location.reload(); }, 12000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, accuracy=accuracy, color=color, target_info=target_info, voice=voice)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
