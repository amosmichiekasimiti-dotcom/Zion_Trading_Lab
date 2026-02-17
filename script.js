/**
 * Zion Trading Lab - Professional Trading Script
 * Features: 100-tick stable percentages, Momentum Arrows, and TradingView Integration
 */

let ws;
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let reefDigitWindow = []; // Stores exactly 100 ticks for realistic %
let physicsBuffer = [];   // For momentum analysis

function initWS() {
    // Connect to Deriv WebSocket API
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    ws.onopen = () => {
        document.getElementById('status').innerText = '● LIVE CONNECTED';
        document.getElementById('status').style.color = '#4caf50';
        // Initial request for asset list
        ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
        
        // Keep-alive ping
        setInterval(() => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ ping: 1 }));
        }, 30000);
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        // Handle Asset List
        if (data.active_symbols) {
            allSymbols = data.active_symbols;
            loadCategory('volatility'); // Default view
        }

        // Handle Initial History (Stabilizes percentages immediately)
        if (data.history) {
            reefDigitWindow = data.history.prices.map(p => 
                parseInt(p.toFixed(data.pip_size).slice(-1))
            );
            render();
        }

        // Handle Live Tick Stream
        if (data.tick) {
            activeSub = data.tick.id;
            const price = data.tick.quote;
            const priceStr = price.toFixed(data.tick.pip_size);
            const digit = parseInt(priceStr.slice(-1));

            // Update Physics (Momentum)
            physicsBuffer.push(price);
            if (physicsBuffer.length > 15) physicsBuffer.shift();

            // Maintain stable 100-tick sample size for realistic 10-13% stats
            reefDigitWindow.push(digit);
            if (reefDigitWindow.length > 100) reefDigitWindow.shift();

            updateUI(priceStr, price, digit);
        }
    };

    ws.onclose = () => {
        document.getElementById('status').innerText = '● RECONNECTING...';
        setTimeout(initWS, 3000);
    };
}

// Category Management
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

// Open Analysis Modal & Load Chart
window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    switchContract('rise_fall', document.querySelector('.tab'));

    // Unsubscribe from previous tick if active
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));

    // Get 100 historical ticks for stable stats + subscribe
    ws.send(JSON.stringify({ 
        "ticks_history": symbol, 
        "count": 100, 
        "end": "latest", 
        "style": "ticks" 
    }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
};

// UI and Chart Switching
window.switchContract = function(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const panel = document.getElementById('digit-analysis-panel');
    panel.style.display = (mode === 'rise_fall') ? 'none' : 'block';

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

    // Embed Deriv TradingView Chart
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

    // SIGNAL LOGIC (Momentum Arrows Included)
    if (currentMode === 'even_odd') {
        let evens = counts[0] + counts[2] + counts[4] + counts[6] + counts[8];
        signal = evens > 53 ? `EVEN (${evens}%) ↑` : (evens < 47 ? `ODD (${100 - evens}%) ↓` : "NEUTRAL");
        color = evens > 53 ? "#4caf50" : (evens < 47 ? "#ff444f" : "#8e8e9e");
    } else if (currentMode === 'over_under') {
        let over = counts[6] + counts[7] + counts[8] + counts[9];
        signal = over > 43 ? "OVER BIAS ↑" : "UNDER BIAS ↓";
        color = over > 43 ? "#4caf50" : "#ff444f";
    } else {
        // Trend Momentum via Physics Buffer
        let momentum = physicsBuffer[physicsBuffer.length - 1] - physicsBuffer[0];
        signal = momentum > 0 ? "BULLISH MOMENTUM ↑" : "BEARISH MOMENTUM ↓";
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
