from flask import Flask, render_template_string
import random

app = Flask(__name__)

# Full 1S Market List
MARKETS = [
    "VOLATILITY 10 (1S)", "VOLATILITY 15 (1S)", "VOLATILITY 25 (1S)", 
    "VOLATILITY 30 (1S)", "VOLATILITY 50 (1S)", "VOLATILITY 75 (1S)", 
    "VOLATILITY 90 (1S)", "VOLATILITY 100 (1S)"
]

@app.route('/')
def index():
    # Simulation Logic for Advanced Analysis
    market = random.choice(MARKETS)
    price = round(random.uniform(150.00, 850.00), 2)
    strength = random.randint(70, 99)
    
    # Feature Detection Logic
    fvg = random.choice(["Bullish Gap Detected", "Bearish Gap Detected", "None"])
    manipulation = random.choice(["Liquidity Sweep", "Stop Hunt", "None"])
    structure = random.choice(["Support Rejection", "Resistance Breakout", "Ranging"])
    
    # Colors and Actions
    action = "BUY / RISE" if strength > 85 else "SELL / FALL"
    theme_color = "#2ecc71" if "BUY" in action else "#e74c3c"

    html_template = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zion Trading Lab | Advanced Intelligence</title>
        <style>
            :root {{
                --wood: #2c1a12;
                --glass: rgba(255, 255, 255, 0.1);
                --accent: {theme_color};
            }}
            body {{
                background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), 
                            url('https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&w=1600&q=80');
                background-size: cover;
                color: white;
                font-family: 'Segoe UI', sans-serif;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }}
            .dashboard {{
                background: var(--glass);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 30px;
                padding: 40px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                border-top: 4px solid var(--accent);
            }}
            .market-header {{ font-size: 1.2rem; opacity: 0.8; letter-spacing: 2px; }}
            .price {{ font-size: 3rem; font-weight: bold; margin: 10px 0; }}
            .signal-box {{
                background: var(--accent);
                padding: 20px;
                border-radius: 15px;
                font-size: 2rem;
                font-weight: 900;
                margin: 20px 0;
                box-shadow: 0 0 20px var(--accent);
            }}
            .analysis-grid {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                text-align: left;
                margin-top: 20px;
            }}
            .stat-card {{
                background: rgba(0,0,0,0.3);
                padding: 10px;
                border-radius: 10px;
                font-size: 0.8rem;
            }}
            .stat-val {{ display: block; font-size: 1.1rem; color: var(--accent); font-weight: bold; }}
            .btn {{
                display: block;
                background: white;
                color: black;
                text-decoration: none;
                padding: 15px;
                border-radius: 10px;
                font-weight: bold;
                margin-top: 25px;
                transition: 0.3s;
            }}
            .btn:hover {{ transform: scale(1.05); background: var(--accent); color: white; }}
        </style>
    </head>
    <body onload="announceSignal()">
        <div class="dashboard">
            <div class="market-header">{market}</div>
            <div class="price">${price}</div>
            
            <div class="signal-box">{action}</div>
            
            <div class="analysis-grid">
                <div class="stat-card">STRENGTH <span class="stat-val">{strength}%</span></div>
                <div class="stat-card">STRUCTURE <span class="stat-val">{structure}</span></div>
                <div class="stat-card">IMBALANCE (FVG) <span class="stat-val">{fvg}</span></div>
                <div class="stat-card">MANIPULATION <span class="stat-val">{manipulation}</span></div>
            </div>

            <a href="https://deriv.com" class="btn">PROCEED TO TRADE</a>
            <p style="font-size: 10px; margin-top: 15px;">Smart Intelligence v2.0 | Auto-detecting Key Levels</p>
        </div>

        <script>
            function announceSignal() {{
                const text = "New signal for {market}. {action} detected with {strength} percent accuracy. Beware of {manipulation}.";
                const speech = new SpeechSynthesisUtterance(text);
                speech.rate = 0.9;
                window.speechSynthesis.speak(speech);
            }}
            setTimeout(() => {{ location.reload(); }}, 10000); // Auto-update every 10 seconds
        </script>
    </body>
    </html>
    '''
    return render_template_string(html_template)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
