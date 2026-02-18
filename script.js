/**
 * Zion Trading Lab - Authoritative Direct Feed
 * Direct Sync with Deriv "Reef" Servers - Simplified & Accurate
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let digitData = []; // The absolute source of truth from the server (100 digits)

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

    // DIRECT SYNC: Replaces local "tick counts" with server history
    if (data.history) {
        const pipSize = data.pip_size || 0;
        digitData = data.history.prices.map(p => 
            parseInt(p.toFixed(pipSize).split('').pop())
        );
        renderExactStats();
    }

    // LIVE AUTHORITATIVE STREAM
    if (data.tick) {
        activeSub = data.tick.id;
        const pipSize = data.tick.pip_size || 3;
        const priceStr = data.tick.quote.toFixed(pipSize);
        const lastDigit = parseInt(priceStr.split('').pop());

        // Update the array exactly as the server does (maintain 100-tick window)
        digitData.push(lastDigit);
        if (digitData.length > 100) digitData.shift();

        // Exact Price matching TradingView with highlighted last digit
        if (livePriceDiv) {
            livePriceDiv.innerHTML = 
                `${priceStr.slice(0, -1)}<span style="color:#ff444f; border-bottom:3px solid #ff444f;">${lastDigit}</span>`;
        }

        // Update digit statistics if not in rise_fall mode
        if (currentMode !== 'rise_fall') {
            renderExactStats(lastDigit);
        }
    }
};

// Render exact statistics directly from digitData array
function renderExactStats(activeDigit = null) {
    if (digitData.length === 0) return;
    
    const counts = Array(10).fill(0);
    digitData.forEach(d => counts[d]++);
    const total = digitData.length;
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);

    for (let i = 0; i <= 9; i++) {
        // MATCHING CRITERIA: Precise decimal percentages
        const rawPct = (counts[i] / total) * 100;
        const displayPct = rawPct.toFixed(1);

        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);

        if (bar) bar.style.height = `${rawPct}%`;
        if (label) {
            label.innerText = `${displayPct}%`;
            
            // Color coding based on frequency
            if (counts[i] === maxVal && maxVal !== minVal) {
                label.style.color = "#4caf50"; // Green for highest
            } else if (counts[i] === minVal && maxVal !== minVal) {
                label.style.color = "#ff444f"; // Red for lowest
            } else {
                label.style.color = "#00f2fe"; // Neon blue for others
            }
        }
        
        // Active digit highlighting
        if (box) {
            if (activeDigit !== null && i === activeDigit) {
                box.style.background = "rgba(0, 242, 254, 0.25)";
                box.style.borderColor = "#00f2fe";
                box.style.boxShadow = "0 0 15px rgba(0, 242, 254, 0.5)";
                box.style.transform = "scale(1.05)";
            } else {
                box.style.background = "#1a1a1a";
                box.style.borderColor = "#2e2e48";
                box.style.boxShadow = "none";
                box.style.transform = "scale(1)";
            }
        }
    }
}

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
    digitData = []; // Reset the authoritative data array
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
        const last = digitData.length ? digitData[digitData.length - 1] : null;
        renderExactStats(last);
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
