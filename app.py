from flask import Flask
import random
from datetime import datetime

app = Flask(__name__)

# List to keep track of previous signals
history = []

@app.route('/')
def home():
    # Per instructions: 1S Market and High Accuracy %
    acc = f"{random.randint(97, 99)}.{random.randint(1, 9)}%"
    sig = random.choice(["🎯 TRADE RISE", "🎯 TRADE FALL"])
    color = "#3fb950" if "RISE" in sig else "#f85149"
    now = datetime.now().strftime("%H:%M:%S")
    
    # Save current signal to history
    history.insert(0, {"time": now, "signal": sig, "acc": acc})
    if len(history) > 5: history.pop() 

    history_html = "".join([f"<div style='margin-bottom:8px; border-bottom:1px solid #30363d; padding-bottom:5px;'>{h['time']} - {h['signal']} ({h['acc']})</div>" for h in history])
    
    return f"""
    <html>
    <head>
        <meta http-equiv="refresh" content="5">
        <title>Zion Pro - Live</title>
        <style>
            body {{ background: #0d1117; color: white; text-align: center; font-family: sans-serif; padding-top: 30px; }}
            .card {{ background: #161b22; border: 1px solid #30363d; padding: 25px; border-radius: 20px; display: inline-block; width: 85%; max-width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
            .signal {{ font-size: 36px; font-weight: bold; color: {color}; margin: 15px 0; }}
            .history {{ text-align: left; background: #0d1117; padding: 15px; border-radius: 12px; font-size: 13px; color: #8b949e; margin-top: 25px; border: 1px solid #30363d; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2 style="margin:0; color:#58a6ff;">🚀 Zion Trading Lab</h2>
            <p style="font-size:12px; letter-spacing:1px; color:#8b949e;">VOLATILITY 10 (1S)</p>
            <div class="signal">{sig}</div>
            <div style="font-size:22px;">Accuracy: {acc}</div>
            <div class="history">
                <strong style="color:#c9d1d9; display:block; margin-bottom:10px;">Recent Signal History:</strong>
                {history_html}
            </div>
            <p style="font-size:10px; color:#30363d; margin-top:15px;">AI Scanning... Next signal in 5s</p>
        </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    # Render requires host 0.0.0.0
    app.run(host='0.0.0.0', port=5000)
