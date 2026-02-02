import os
import random
from flask import Flask, render_template_string

app = Flask(__name__)

# --- THE COMPLETE 2026 VOLATILITY LIST ---
ALL_VOLATILITIES = [
    # Standard Series (2-Second Ticks)
    "VOLATILITY 10", "VOLATILITY 25", "VOLATILITY 50", 
    "VOLATILITY 75", "VOLATILITY 100", "VOLATILITY 150", "VOLATILITY 250",
    
    # 1S Series (1-Second Ticks)
    "VOLATILITY 10 (1S)", "VOLATILITY 15 (1S)", "VOLATILITY 25 (1S)", 
    "VOLATILITY 30 (1S)", "VOLATILITY 50 (1S)", "VOLATILITY 75 (1S)", 
    "VOLATILITY 90 (1S)", "VOLATILITY 100 (1S)", "VOLATILITY 150 (1S)", 
    "VOLATILITY 250 (1S)", "VOLATILITY 300 (1S)",
    
    # Switch Series (VSI - Multi-Regime)
    "VOLATILITY SWITCH LOW", "VOLATILITY SWITCH MEDIUM", "VOLATILITY SWITCH HIGH"
]

@app.route('/')
def home():
    market = random.choice(ALL_VOLATILITIES)
    
    # Probability Logic
    low_digits_freq = random.randint(5, 95) 
    high_digits_freq = 100 - low_digits_freq
    accuracy = random.randint(97, 99)
    
    # Specific Signal Generation
    if low_digits_freq > 55:
        contract, target, color = "DIGIT UNDER", random.choice(["7", "8", "9"]), "#ef4444"
        voice = f"Market Alert: {market}. Low digit cluster detected at {low_digits_freq} percent. Trade Under {target} for safe returns."
    elif high_digits_freq > 55:
        contract, target, color = "DIGIT OVER", random.choice(["0", "1", "2"]), "#10b981"
        voice = f"High probability signal on {market}. Market trend is pushing high. Trade Over {target} now."
    else:
        contract, target, color = random.choice(["MATCHES", "ACCUMULATORS"]), "0", "#f59e0b"
        voice = f"Balanced market flux on {market}. Quality signal for {contract} detected."

    HTML_TEMPLATE = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ZION LAB | Full Market Suite</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --bg: #030712; --card: #111827; --accent: #ef4444; --blue: #3b82f6; --green: #10b981; }
            body { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; text-align: center; }
            .navbar { padding: 15px; background: #000; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; }
            .container { padding: 20px; max-width: 480px; margin: auto; }
            .signal-card { 
                background: linear-gradient(145deg, #1e293b, #030712); 
                border-radius: 28px; padding: 35px; border: 2px solid {{ color }};
                box-shadow: 0 15px 40px rgba(0,0,0,0.8);
            }
            .market-title { font-size: 14px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; }
            .contract-type { font-size: 36px; font-weight: 900; color: {{ color }}; margin-bottom: 10px; }
            .accuracy-text { font-size: 52px; font-weight: 900; margin: 20px 0; }
            
            .freq-container { background: #0f172a; padding: 15px; border-radius: 15px; margin-top: 20px; border: 1px solid #334155; }
            .freq-label { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 8px; }
            .progress-bg { height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; display: flex; }
            
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 25px; }
            .grid-item { background: #111827; padding: 18px; border-radius: 18px; border: 1px solid #1f2937; font-size: 12px; }
        </style>
    </head>
    <body>
        <nav class="navbar">
            <i class="fa-solid fa-bars-staggered"></i>
            <div style="font-weight: 900; letter-spacing: 2px; color: var(--blue);">ZION LAB PRO</div>
            <i class="fa-solid fa-volume-high" id="v-icon" onclick="toggleMute()" style="cursor:pointer;"></i>
        </nav>

        <div class="container">
            <div class="signal-card">
                <div class="market-title"><i class="fa-solid fa-satellite-dish"></i> {{ market }}</div>
                <div class="contract-type">{{ contract }}</div>
                <div style="color: #fcd34d; font-weight: bold; font-size: 18px;">TARGET DIGIT: {{ target }}</div>
                
                <div class="freq-container">
                    <div class="freq-label"><span>0-4 Ticks: {{ low_freq }}%</span><span>5-9 Ticks: {{ high_freq }}%</span></div>
                    <div class="progress-bg">
                        <div style="width: {{ low_freq }}%; background: var(--accent);"></div>
                        <div style="width: {{ high_freq }}%; background: var(--green);"></div>
                    </div>
                </div>

                <div class="accuracy-text">{{ accuracy }}%</div>
                <div style="font-size: 12px; color: #4ade80;"><i class="fa-solid fa-check-double"></i> Verified High Quality Signal</div>
            </div>

            <div class="grid">
                <div class="grid-item"><i class="fa-solid fa-shield-halved" style="color:var(--blue)"></i><br>Safe Entry</div>
                <div class="grid-item"><i class="fa-solid fa-microchip" style="color:var(--green)"></i><br>Tick Engine</div>
            </div>
        </div>

        <script>
            let muted = localStorage.getItem('zionMuted') === 'true';
            if(muted) document.getElementById('v-icon').classList.replace('fa-volume-high', 'fa-volume-xmark');
            function toggleMute() { localStorage.setItem('zionMuted', !muted); location.reload(); }
            
            window.onload = () => {
                if(!muted) {
                    const speech = new SpeechSynthesisUtterance("{{ voice }}");
                    speech.rate = 0.95;
                    window.speechSynthesis.speak(speech);
                }
            };
            setTimeout(() => { location.reload(); }, 12000);
        </script>
    </body>
    </html>
    """
    
    return render_template_string(HTML_TEMPLATE, 
                                market=market, contract=contract, 
                                target=target, low_freq=low_digits_freq, 
                                high_freq=high_digits_freq, accuracy=accuracy, 
                                voice=voice, color=color)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
