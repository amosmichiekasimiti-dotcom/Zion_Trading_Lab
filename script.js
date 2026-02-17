/**
 * ZION TRADING LAB - Official Script
 * Fixes: WebSocket Persistence, Realistic Percentages, and Asset Filtering
 */

let ws;
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let reefDigitWindow = []; // Stores exactly 100 ticks for stable percentages
let physicsBuffer = [];   // For momentum analysis

function initWS() {
    // Establishing connection to Deriv API
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    ws.onopen = () => {
        document.getElementById('status').innerText = '● LIVE CONNECTED';
        document.getElementById('status').style.color = '#4caf50';
        
        // Immediate request for the asset list to prevent the empty table issue
        ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
        
        // Keep-Alive Ping to prevent connection timeouts
        setInterval(() => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ ping: 1 }));
        }, 30000);
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        // Populate the asset list once data is received
        if (data.active_symbols) {
            allSymbols = data.active_symbols;
            loadCategory('volatility'); 
        }

        // Use history data to immediately stabilize digit stats
        if (data.history) {
            reefDigitWindow = data.history.prices.map(p => 
                parseInt(p.toFixed(data.pip_size).slice(-1))
            );
            render();
        }

        // Process live tick updates
        if (data.tick) {
            activeSub = data.tick.id;
            const price = data.tick.quote;
            const priceStr = price.toFixed(data.tick.pip_size);
            const digit = parseInt(priceStr.slice(-1));

            physicsBuffer.push(price);
            if (physicsBuffer.length > 15) physicsBuffer.shift();

            // Maintain exactly 100 samples for realistic stats (approx 10-13% per digit)
            reefDigitWindow.push(digit);
            if (reefDigitWindow.length > 100) reefDigitWindow.shift();

            updateUI(priceStr, price, digit);
        }
    };

    ws.onclose = () => {
        document.getElementById('status').innerText = '● RECONNECTING...';
        document.getElementById('status').style.color = '#ff444f';
        setTimeout(initWS, 3000); // Attempt to reconnect every 3 seconds
    };
}

// Category Filtering logic for the Navigation Grid
window.loadCategory = function(cat, el) {
    if (el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    
    const filtered = allSymbols.filter(s => {
        const name = s.display_name.toLowerCase();
        const market = s.market.toLowerCase();
        if (cat === 'volatility') return market === 'synthetic_index' && !name.includes('jump');
        if (cat === 'crashboom') return name.includes('crash') || name.includes('boom');
        if (cat === 'jump') return name.includes('jump');
        if (cat === 'range') return name.includes('range') || name.includes('step');
        if (cat === 'forex') return market === 'forex';
        return false;
    });

    filtered.forEach(s => {
        list.innerHTML += `
            <tr>
                <td>${s.display_name}</td>
                <td>${s.symbol}</td>
                <td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>
            </tr>`;
    });
};

window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    switchContract('rise_fall', document.querySelector('.tab'));

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));

    // Request history to fill the 100-tick window immediately
    ws.send(JSON.stringify({ 
        "ticks_history": symbol, 
        "count": 100, 
        "end": "latest", 
        "style": "ticks" 
    }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
};

window.switchContract = function(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    document.getElementById('digit-analysis-panel').style.display = (mode === 'rise_fall') ? 'none' : 'block';

    if (mode !== 'rise_fall') {
        const grid = document.getElementById('digit-grid');
        grid.innerHTML = '';
        for (let i = 0; i <= 9; i++) {
            grid.innerHTML += `
                <div id="d-${i}" class="d-box">
                    <div class="d-num">${i}</div>
                    <div id="bar-${i}" class="d-bar"></div>
                    <div id="pct-${i}" class="d-pct">0%</div>
                </div>`;
        }
    }

    // Dynamic Chart Loading
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
};

function updateUI(str, val, digit) {
    const priceDisplay = document.getElementById('live-price');
    priceDisplay.innerHTML = `${str.slice(0, -1)}<span>${digit}</span>`;

    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);

    let signal = "ANALYZING...";
    let color = "#00f2fe";

    // DIRECTIONAL SIGNAL ENGINE (Includes Arrows)
    if (currentMode === 'even_odd') {
        let evens = counts[0] + counts[2] + counts[4] + counts[6] + counts[8];
        signal = evens > 54 ? `EVEN (${evens}%) ↑` : (evens < 46 ? `ODD (${100 - evens}%) ↓` : "NEUTRAL");
        color = evens > 54 ? "#4caf50" : (evens < 46 ? "#ff444f" : "#8e8e9e");
    } else if (currentMode === 'over_under') {
        let over = counts[6] + counts[7] + counts[8] + counts[9];
        signal = over > 44 ? "OVER BIAS ↑" : "UNDER BIAS ↓";
        color = over > 44 ? "#4caf50" : "#ff444f";
    } else {
        let momentum = physicsBuffer[physicsBuffer.length - 1] - physicsBuffer[0];
        signal = momentum > 0 ? "BULLISH ↑" : "BEARISH ↓";
        color = momentum > 0 ? "#4caf50" : "#ff444f";
    }

    const box = document.getElementById('signal-box');
    box.innerText = signal;
    box.style.color = color;

    render(digit, counts);
}

function render(active, counts) {
    if (!counts) return;
    for (let i = 0; i <= 9; i++) {
        const pct = ((counts[i] / reefDigitWindow.length) * 100).toFixed(1);
        const bar = document.getElementById(`bar-${i}`);
        const pctLabel = document.getElementById(`pct-${i}`);
        const box = document.getElementById(`d-${i}`);
        
        if (bar) bar.style.height = pct + "%";
        if (pctLabel) pctLabel.innerText = pct + "%";
        if (box) box.style.background = (i === active) ? "#333" : "#1a1a1a";
    }
}

window.closeModal = function() {
    document.getElementById('modal').style.display = 'none';
};

initWS();
