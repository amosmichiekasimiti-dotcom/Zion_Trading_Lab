/**
 * Zion Trading Lab - Authoritative Direct Feed
 * Direct Sync with Deriv "Reef" Servers & Live Directional Arrows
 */

// WebSocket connection
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0; // Track previous price for directional arrows
let reefDigitWindow = []; // Stores authoritative 100-digit history

// DOM elements
const modal = document.getElementById('modal');
const mTitle = document.getElementById('mTitle');
const livePriceDiv = document.getElementById('live-price');
const priceSymbolLabel = document.getElementById('price-symbol-label');
const digitPanel = document.getElementById('digit-analysis-panel');
const chartContainer = document.getElementById('chart-container');

// Helper to update symbol label
function setPriceSymbolText(txt) {
    if (priceSymbolLabel) priceSymbolLabel.innerText = txt;
    const badge = document.querySelector('.asset-badge');
    if (badge) badge.innerText = txt;
}

// WebSocket event handlers
ws.onopen = () => {
    console.log("Zion Lab: Connected to Direct Reef Feed");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Initial Symbol Loading
    if (data.active_symbols) {
        allSymbols = data.active_symbols;
        loadCategory('volatility', document.querySelector('.nav-card.active'));
    }

    // AUTHENTIC PERCENTAGE PULL: Initial 100-Tick History for Real Percentages
    if (data.history) {
        reefDigitWindow = [];
        const pipSize = data.pip_size || 3;
        data.history.prices.forEach(price => {
            const priceStr = price.toFixed(pipSize);
            const digit = parseInt(priceStr.slice(-1));
            reefDigitWindow.push(digit);
        });
        renderReefStatistics();
    }

    // LIVE AUTHORITATIVE STREAM: Update Price, Directional Arrows & Digit Probabilities
    if (data.tick) {
        activeSub = data.tick.id;
        const currentPrice = data.tick.quote;
        const pip_size = data.tick.pip_size || 3;
        const priceStr = currentPrice.toFixed(pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        const head = priceStr.slice(0, -1);

        // Determine Direction for Amazing Arrows
        let directionArrow = "";
        let arrowColor = "#ffffff";
        if (lastPrice > 0) {
            if (currentPrice > lastPrice) {
                directionArrow = " ▲"; // Upwards movement
                arrowColor = "#4caf50"; // Green
            } else if (currentPrice < lastPrice) {
                directionArrow = " ▼"; // Downwards movement
                arrowColor = "#ff444f"; // Red
            }
        }
        lastPrice = currentPrice;

        // Update Running Price Header with Live Arrow
        if (livePriceDiv) {
            livePriceDiv.innerHTML = `
                ${head}<span class="active-digit-underline">${lastDigit}</span>
                <span style="color:${arrowColor}; font-size: 28px; margin-left: 12px; font-weight: 600;">${directionArrow}</span>
            `;
        }

        // Maintain the real 100-tick window exactly like the Reef platform
        reefDigitWindow.push(lastDigit);
        if (reefDigitWindow.length > 100) reefDigitWindow.shift();

        // Update digit statistics if not in rise_fall mode
        if (currentMode !== 'rise_fall') {
            renderReefStatistics(lastDigit);
        }
    }
};

// Load market category
window.loadCategory = function(cat, el) {
    if (el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    if (!list) return;
    list.innerHTML = '';

    const filtered = allSymbols.filter(s => {
        const disp = s.display_name.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && !disp.includes('jump') && !disp.includes('step');
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'jump') return disp.includes('jump');
        if (cat === 'range') return disp.includes('range') || disp.includes('step');
        if (cat === 'forex') return s.market === 'forex';
        return false;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name.replace(/'/g, "\\'")}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
};

// Open analysis modal
window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    reefDigitWindow = [];
    lastPrice = 0; // Reset price comparison
    mTitle.innerText = name;
    setPriceSymbolText(symbol);
    modal.style.display = 'block';

    // Reset tabs to Rise/Fall
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab').classList.add('active');
    currentMode = 'rise_fall';
    digitPanel.style.display = 'none';
    chartContainer.style.height = '100%';

    // Build digit grid if needed
    buildDigitGrid();

    // DIRECT REEF COMMAND: Request authoritative 100-tick history state
    ws.send(JSON.stringify({
        "ticks_history": symbol,
        "adjust_start_time": 1,
        "count": 100,
        "end": "latest",
        "style": "ticks"
    }));

    // Subscribe to live authoritative updates
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));

    // TradingView Candle Chart synchronized with price
    chartContainer.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
};

// Switch contract mode
window.switchContract = function(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const digitPanel = document.getElementById('digit-analysis-panel');
    const chartView = document.getElementById('chart-container');

    if (mode === 'rise_fall') {
        digitPanel.style.display = 'none';
        chartView.style.height = '100%';
    } else {
        digitPanel.style.display = 'block';
        chartView.style.height = '400px';
        if (!document.getElementById('digit-grid').innerHTML) buildDigitGrid();
        const last = reefDigitWindow.length ? reefDigitWindow[reefDigitWindow.length - 1] : null;
        renderReefStatistics(last);
    }

    // Update chart
    if (currentSymbol) {
        chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
    }
};

// Build digit grid
function buildDigitGrid() {
    const grid = document.getElementById('digit-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `
            <div id="d-${i}" class="d-box">
                <div class="d-num">${i}</div>
                <div id="bar-${i}" class="d-bar"></div>
                <div id="p-${i}" class="d-pct">0%</div>
            </div>`;
    }
}

// Render reef statistics with digit probabilities
function renderReefStatistics(activeDigit = null) {
    if (!reefDigitWindow.length) return;
    
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);
    const total = reefDigitWindow.length;

    for (let i = 0; i <= 9; i++) {
        const realPercentage = total ? ((counts[i] / total) * 100).toFixed(1) : 0;
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);

        if (label) {
            label.innerText = realPercentage + "%";
            
            // Percentage Coloring Logic from Deriv platform
            if (counts[i] === maxVal && maxVal !== minVal) {
                label.style.color = "#4caf50"; // Green for highest occurrence
            } else if (counts[i] === minVal && maxVal !== minVal) {
                label.style.color = "#ff444f"; // Red for lowest occurrence
            } else {
                label.style.color = "#00f2fe"; // Standard Neon
            }
        }

        if (bar) bar.style.height = realPercentage + "%";

        // Black Box Active Glow State
        if (box) {
            if (activeDigit !== null && i === activeDigit) {
                box.style.background = "#000000";
                box.style.borderColor = "#ffffff";
                box.style.boxShadow = "0 0 15px rgba(255,255,255,0.7)";
                box.style.transform = "scale(1.05)";
            } else {
                box.style.background = "#161625";
                box.style.borderColor = "#2e2e48";
                box.style.boxShadow = "none";
                box.style.transform = "scale(1)";
            }
        }
    }
}

// Close modal
window.closeModal = function() {
    modal.style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
};

// Initialize digit grid on page load
(function init() {
    setTimeout(() => {
        if (document.getElementById('digit-grid')) {
            buildDigitGrid();
        }
    }, 50);
})();

// Expose ws for debugging if needed
window.zionWs = ws;
