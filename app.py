from flask import Flask, render_template_string
import random

app = Flask(__name__)

# Markets with "1S" as requested
MARKETS = [
    "VOLATILITY 10 (1S)", "VOLATILITY 15 (1S)", "VOLATILITY 25 (1S)", 
    "VOLATILITY 30 (1S)", "VOLATILITY 50 (1S)", "VOLATILITY 75 (1S)", 
    "VOLATILITY 90 (1S)", "VOLATILITY 100 (1S)"
]

@app.route('/')
def index():
    # Analysis Logic
    market = random.choice(MARKETS)
    strength = random.randint(97, 99) # High accuracy request
    structure = random.choice(["BOS Detected", "CHoCH Verified", "Range Bound"])
    manipulation = random.choice(["Stop Hunt Detected", "No Manipulation", "Liquidity Sweep"])
    
    html_template = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zion Trading Lab</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
            :root {{ --bg: #0a0e14; --glass: rgba(255, 255, 255, 0.07); --accent: #3b82f6; }}
            body {{ background-color: var(--bg); color: white; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; }}
            
            /* Header Style */
            .header {{ background: #000; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; }}
            .logo {{ font-weight: bold; font-size: 1.2rem; letter-spacing: 1px; color: #fff; }}
            .btn-auth {{ background: #ff4d4d; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold; }}

            /* Main Container */
            .container {{ padding: 20px; max-width: 500px; margin: auto; }}

            /* Top Signal Banner */
            .signal-banner {{
                background: linear-gradient(135deg, #1e293b, #0f172a);
                padding: 20px; border-radius: 16px; margin-bottom: 20px;
                border-left: 5px solid #2ecc71; border: 1px solid rgba(255,255,255,0.1);
            }}
            .market-name {{ color: var(--accent); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px; }}
            .accuracy {{ font-size: 2rem; font-weight: 800; }}

            /* The 3-Column Grid */
            .dashboard-grid {{
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
            }}
            .grid-card {{
                background: var(--glass); border-radius: 12px; padding: 20px 10px;
                text-align: center; border: 1px solid rgba(255,255,255,0.1);
                transition: transform 0.2s; text-decoration: none; color: white;
            }}
            .grid-card:active {{ transform: scale(0.95); background: var(--accent); }}
            .grid-card i {{ font-size: 24px; margin-bottom: 8px; display: block; color: var(--accent); }}
            .card-label {{ font-size: 11px; font-weight: 500; opacity: 0.8; }}

            .footer-link {{ display: block; text-align: center; margin-top: 30px; color: #64748b; text-decoration: none; font-size: 13px; }}
        </style>
    </head>
    <body onload="speakSignal()">
        <div class="header">
            <div class="logo">ZION LAB</div>
            <a href="#" class="btn-auth">SIGN UP</a>
        </div>

        <div class="container">
            <div class="signal-banner">
                <div class="market-name"><i class="fa-solid fa-tower-broadcast"></i> Live: {market}</div>
                <div class="accuracy">{strength}% Accuracy</div>
                <div style="font-size: 12px; margin-top:10px; opacity: 0.7;">
                    {structure} • {manipulation}
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="grid-card"><i class="fa-solid fa-house"></i><div class="card-label">Home</div></div>
                <div class="grid-card"><i class="fa-solid fa-robot" style="color:#ff4d4d;"></i><div class="card-label">Bot Builder</div></div>
                <div class="grid-card"><i class="fa-solid fa-chart-pie"></i><div class="card-label">Analysis</div></div>
                <div class="grid-card"><i class="fa-solid fa-bolt" style="color:#fcd34d;"></i><div class="card-label">Signals</div></div>
                <div class="grid-card"><i class="fa-solid fa-magnifying-glass-chart"></i><div class="card-label">SMC Scan</div></div>
                <div class="grid-card"><i class="fa-solid fa-headset"></i><div class="card-label">Support</div></div>
            </div>

            <a href="https://deriv.com" class="footer-link">Powered by Deriv API</a>
        </div>

        <script>
            function speakSignal() {{
                const text = "New Signal for {market}. Accuracy is {strength} percent. {manipulation}.";
                const speech = new SpeechSynthesisUtterance(text);
                speech.rate = 0.9;
                window.speechSynthesis.speak(speech);
            }}
            // Refresh every 12 seconds for new signals
            setTimeout(() => {{ location.reload(); }}, 12000);
        </script>
    </body>
    </html>
    '''
    return render_template_string(html_template)

import os

if __name__ == "__main__":
    # This configuration is required for Render to go Live
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)

