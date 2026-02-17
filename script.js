<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zion Trading Lab | Professional</title>
    <style>
        :root { --red: #ff444f; --dark: #0e0e15; --card-bg: #161625; --border: #2e2e48; --neon: #00f2fe; --green: #4caf50; }
        body { font-family: sans-serif; background: var(--dark); margin: 0; padding: 10px; color: white; overflow-x: hidden; display: flex; flex-direction: column; height: 100vh; }
        
        /* Navigation Grid Fix */
        .nav-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 15px; justify-content: center; }
        .nav-card { background: var(--card-bg); padding: 10px; border-radius: 8px; text-align: center; cursor: pointer; border: 1px solid var(--border); font-size: 10px; font-weight: 800; color: #8e8e9e; flex: 1 1 calc(30% - 10px); min-width: 90px; box-sizing: border-box; }
        .nav-card.active { background: var(--red); color: white; border-color: var(--red); }
        
        .card { background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border); flex-grow: 1; overflow-y: auto; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 12px; text-align: left; border-bottom: 1px solid var(--border); font-size: 12px; }
        .btn-view { background: #222; color: white; border: 1px solid #444; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; }

        /* Modal & Analysis Layout */
        #modal { display:none; position:fixed; z-index:100; left:0; top:0; width:100%; height:100%; background:var(--dark); overflow-y: auto; box-sizing: border-box; }
        .modal-body { display: flex; flex-direction: column; min-height: 100%; padding: 15px; }
        
        .price-header { background: #1c1c2d; padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); }
        #live-price { font-size: 28px; font-family: monospace; font-weight: bold; }
        #live-price span { color: var(--red); border-bottom: 3px solid var(--red); }

        .tabs { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
        .tab { padding: 8px 12px; border-radius: 20px; border: 1px solid var(--border); background: #1c1c2d; font-size: 10px; font-weight: bold; cursor: pointer; color: #8e8e9e; flex: 1 1 auto; text-align: center; }
        .tab.active { background: var(--red); color: white; }

        /* Digit Stats UI */
        .digit-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; background: #000; padding: 8px; border-radius: 8px; margin-bottom: 25px; }
        .d-box { background: #1a1a1a; height: 50px; display: flex; flex-direction: column-reverse; align-items: center; position: relative; border: 1px solid #333; }
        .d-bar { width: 100%; background: var(--neon); transition: height 0.3s; opacity: 0.7; }
        .d-num { position: absolute; top: 2px; font-size: 10px; font-weight: bold; color: white; }
        .d-pct { position: absolute; bottom: -20px; font-size: 9px; font-weight: bold; color: var(--neon); }
        
        #chart-container { flex-grow: 1; width: 100%; min-height: 400px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
    </style>
</head>
<body>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding: 0 5px;">
        <h2 style="margin:0; font-size: 16px;">ZION <span style="color:var(--red)">TRADING LAB</span></h2>
        <div id="status" style="color:var(--green); font-weight:bold; font-size:10px;">● LIVE CONNECTED</div>
    </div>

    <div class="nav-grid">
        <div class="nav-card active" onclick="loadCategory('volatility', this)">VOLATILITY</div>
        <div class="nav-card" onclick="loadCategory('crashboom', this)">CRASH/BOOM</div>
        <div class="nav-card" onclick="loadCategory('jump', this)">JUMP</div>
        <div class="nav-card" onclick="loadCategory('range', this)">RANGE/STEP</div>
        <div class="nav-card" onclick="loadCategory('forex', this)">FOREX</div>
    </div>

    <div class="card">
        <table>
            <thead><tr><th>Asset</th><th>Symbol</th><th>Action</th></tr></thead>
            <tbody id="market-list"></tbody>
        </table>
    </div>

    <div id="modal">
        <div class="modal-body">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 id="mTitle" style="margin:0;">Analysis</h3>
                <button onclick="closeModal()" style="background:var(--red); color:white; border:none; padding:8px 20px; border-radius:8px; font-weight:bold;">CLOSE</button>
            </div>
            <div class="tabs">
                <div class="tab active" onclick="switchContract('rise_fall', this)">Rise/Fall</div>
                <div class="tab" onclick="switchContract('even_odd', this)">Even/Odd</div>
                <div class="tab" onclick="switchContract('matches_differs', this)">Matches/Differs</div>
                <div class="tab" onclick="switchContract('over_under', this)">Over/Under</div>
            </div>
            <div class="price-header">
                <div id="live-price">0.0000<span>0</span></div>
                <div id="signal-box" style="text-align:right; font-size:12px; font-weight:bold;">ANALYZING...</div>
            </div>
            <div id="digit-analysis-panel" style="display:none;"><div class="digit-grid" id="digit-grid"></div></div>
            <div id="chart-container"></div>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
