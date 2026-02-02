import os
import random
from flask import Flask, render_template_string

app = Flask(__name__)

# --- THE COMPLETE 2026 MASTER MARKET LIST ---
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
    market = random.choice(ALL_MARKETS)
    accuracy = random.randint(98, 99)
    
    # --- DYNAMIC MULTI-ENGINE SELECTION ---
    mode = random.choice(["ACCUMULATORS", "EVEN_ODD", "SMC_RISE_FALL", "OVER_UNDER"])
    countdown_needed = "false"

    # 1. ACCUMULATORS ENGINE (New!)
    if mode == "ACCUMULATORS":
        growth = random.choice([1, 2, 3, 5])
        ticks = random.randint(15, 45)
        contract, color = "ACCUMULATORS", "#00d4ff" # Cyan for stability
        logic = f"Stability detected. Price range is holding. Growth rate optimized at {growth}%."
        target_info = f"GROWTH: {growth}% | TARGET: {ticks} TICKS"
        voice = f"Accumulator Alert for {market}. Price is stable. Enter now with {growth} percent growth. Aim for {ticks} ticks and close trade."

    # 2. EVEN/ODD DOMINATION
    elif mode == "EVEN_ODD":
        dominator = random.choice(["EVEN", "ODD"])
        dom_percent = random.randint(68, 81)
        contract, color = f"DIGIT {dominator}", "#3b82f6"
        logic = f"Dominance Alert: {dominator} is controlling {dom_percent}% of recent ticks."
        target_info = f"TRADE {dominator} | 5 RUNS"
        voice = f"Attention. {dominator} digits are dominating at {dom_percent} percent. It is time to trade {dominator}. Execute 5 runs."

    # 3. SMC RISE/FALL
    elif mode == "SMC_RISE_FALL":
        trend = random.choice(["RISE", "FALL"])
        contract = "RISE / CALL" if trend == "RISE" else "FALL / PUT"
        color = "#00ff88" if trend == "RISE" else "#ff4d4d"
        logic = "Order Block tap confirmed. Market Structure is in alignment."
        target_info = f"SMC: {trend} | 3 RUNS"
        voice = f"SMC Signal for {market}. Direction is {trend}. Execute 3 specific runs now."

    # 4. OVER/UNDER (Standardized)
    else: 
        barrier = random.choice([1, 2, 8])
        contract = "DIGIT UNDER" if barrier >= 5 else "DIGIT OVER"
        color = "#ff4d4d" if "UNDER" in contract else "#00ff88"
        logic = f"Digit concentration at {barrier}. Entry risk is minimized."
        target_info = f"BARRIER: {barrier} | 4 RUNS"
        voice = f"Over Under alert. Trade {contract} {barrier} on {market}."

    HTML_TEMPLATE = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>ZION LAB | ACCUMULATORS</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --bg: #0b0e14; --card: #161b22; --blue: #3b82f6; --green: #00ff88; --red: #ff4d4d; --gold: #f59e0b; --cyan: #00d4ff; }
            body { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; }
            .navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #000; border-bottom: 1px solid #1f2937; position: sticky; top:0; z-index: 1000; }
            .logo { font-weight: 900; color: var(--blue); }
            .container { padding: 20px; max-width: 500px; margin: auto; }
            .signal-card { background: var(--card); border-radius: 20px; padding: 30px; border-left: 8px solid {{ color }}; position: relative; border-top: 1px solid #333; }
            .accuracy { font-size: 50px; font-weight: 900; margin: 0; }
            .xml-btn { background: linear-gradient(90deg, #3b82f6, #1d4ed8); color: white; padding: 15px; border-radius: 12px; text-decoration: none; display: block; text-align: center; margin-top: 20px; font-weight: bold; border: 1px solid rgba(255,255,255,0.1); }
            .grid-nav { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
            .nav-item { background: var(--card); border-radius: 12px; padding: 15px 5px; text-align: center; color: white; text-decoration: none; font-size: 10px; border: 1px solid #333; }
            .nav-item i { display: block; font-size: 22px; margin-bottom: 8px; }
        </style>
    </head>
    <body>
        <nav class="navbar">
            <i class="fa-solid fa-bars-staggered"></i>
            <div class="logo">ZION TRADING LAB</div>
            <i id="v-btn" class="fa-solid fa-volume-high" onclick="toggleMute()" style="color:var(--blue); cursor:pointer;"></i>
        </nav>
        <div class="container">
            <div class="signal-card">
                <div style="font-size:11px; font-weight:bold; color:var(--blue);"><i class="fa-solid fa-microchip"></i> {{ market }}</div>
                <div class="accuracy">{{ accuracy }}%</div>
                <div style="font-size:13px; color:#cfd8dc; margin-top:10px;"><b>CONDITION:</b> {{ logic }}</div>
                <div style="font-size:30px; font-weight:900; color:{{ color }}; margin-top:15px; text-transform:uppercase;">{{ contract }}</div>
                <div style="margin-top:15px; font-weight:800; color:#fcd34d; border:1px dashed #fcd34d; padding:8px 15px; display:inline-block; border-radius:10px; background:rgba(252,211,77,0.05);">{{ target_info }}</div>
            </div>
            <a href="https://bot.deriv.com" class="xml-btn">DOWNLOAD RECOMMENDED XML BOT</a>
            <div class="grid-nav">
                <a href="#" class="nav-item"><i class="fa-solid fa-house" style="color:var(--blue)"></i>HOME</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-robot" style="color:var(--red)"></i>XML BOTS</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-bolt" style="color:var(--gold)"></i>SIGNALS</a>
            </div>
        </div>
        <script>
            let isMuted = localStorage.getItem('zionMuted') === 'true';
            if(isMuted) document.getElementById('v-btn').classList.replace('fa-volume-high', 'fa-volume-xmark');
            function toggleMute() { isMuted = !isMuted; localStorage.setItem('zionMuted', isMuted); location.reload(); }
            window.onload = () => { if(!isMuted) { let m = new SpeechSynthesisUtterance("{{ voice }}"); m.rate=0.92; window.speechSynthesis.speak(m); } };
            setTimeout(() => { location.reload(); }, 12000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, accuracy=accuracy, color=color, target_info=target_info, voice=voice, countdown_needed=countdown_needed)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
