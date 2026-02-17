/**
 * Zion Trading Lab - Professional Signal Engine
 * Differentiates signals for digit markets and ensures long-term persistence.
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null, allSymbols = [], currentSymbol = '', currentMode = 'rise_fall';
let lastPrice = 0, reefDigitWindow = [], priceBuffer = [];

ws.onopen = () => {
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    
    // Maintain connection and prevent "disappearing digits"
    setInterval(() => {
        if(ws.readyState === 1) ws.send(JSON.stringify({ping: 1}));
    }, 30000); 
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }

    // Historical buffer so percentages are accurate immediately
    if (data.history) {
        reefDigitWindow = data.history.prices.map(p => parseInt(p.toFixed(data.pip_size).slice(-1)));
        priceBuffer = data.history.prices;
        renderReefStatistics();
    }

    if (data.tick) {
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        
        const priceDisplay = document.getElementById('live-price');
        if (priceDisplay) {
            priceDisplay.innerHTML = `${priceStr.slice(0, -1)}<span>${lastDigit}</span>`;
        }

        reefDigitWindow.push(lastDigit);
        priceBuffer.push(currentPrice);
        if (reefDigitWindow.length > 100) reefDigitWindow.shift();
        if (priceBuffer.length > 50) priceBuffer.shift();

        processSignals(currentPrice, lastDigit);
        if (currentMode !== 'rise_fall') renderReefStatistics(lastDigit);
        lastPrice = currentPrice;
    }
};

function processSignals(currentPrice, lastDigit) {
    const signalBox = document.getElementById('signal-box');
    if (!signalBox) return;

    let signalText = "ANALYZING...";
    let signalColor = "var(--neon)";

    // Digit-specific logic
    if (currentMode === 'even_odd' || currentMode === 'matches_differs') {
        const counts = Array(10).fill(0);
        reefDigitWindow.forEach(d => counts[d]++);
        const evenCount = counts[0] + counts[2] + counts[4] + counts[6] + counts[8];
        
        if (evenCount > 56) { signalText = `STRONG EVEN (${evenCount}%) ↑`; signalColor = "var(--green)"; }
        else if (evenCount < 44) { signalText = `STRONG ODD (${100 - evenCount}%) ↓`; signalColor = "var(--red)"; }
        else { signalText = "DIGIT NEUTRAL"; }
    } 
    // Price-specific momentum logic
    else {
        const momentum = currentPrice - priceBuffer[priceBuffer.length - 6];
        if (momentum > 0 && currentPrice > lastPrice) { signalText = "BULLISH MOMENTUM ↑"; signalColor = "var(--green)"; }
        else if (momentum < 0 && currentPrice < lastPrice) { signalText = "BEARISH MOMENTUM ↓"; signalColor = "var(--red)"; }
    }

    signalBox.innerText = signalText;
    signalBox.style.color = signalColor;
}

window.loadCategory = function(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    list.innerHTML = '';

    allSymbols.filter(s => {
        const disp = s.display_name.toLowerCase();
        const market = s.market.toLowerCase();
        if (cat === 'volatility') return market === 'synthetic_index' && !disp.includes('jump');
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'jump') return disp.includes('jump');
        if (cat === 'range') return disp.includes('range') || disp.includes('step');
        if (cat === 'forex') return market === 'forex';
    }).forEach(s => {
        list.innerHTML += `<tr><td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td></tr>`;
    });
}

window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    reefDigitWindow = []; priceBuffer = [];
    ws.send(JSON.stringify({ "ticks_history": symbol, "count": 100, "end": "latest", "style": "ticks" }));
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));

    // Persistent chart view
    document.getElementById('chart-container').innerHTML = 
        `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
}

window.switchContract = function(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('digit-analysis-panel').style.display = (mode === 'rise_fall' ? 'none' : 'block');
    if (mode !== 'rise_fall') buildDigitGrid();
}

function buildDigitGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `<div id="d-${i}" class="d-box"><div class="d-num">${i}</div><div id="bar-${i}" class="d-bar"></div></div>`;
    }
}

function renderReefStatistics(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    for (let i = 0; i <= 9; i++) {
        const pct = ((counts[i] / reefDigitWindow.length) * 100).toFixed(1);
        const bar = document.getElementById(`bar-${i}`);
        if (bar) bar.style.height = pct + "%";
        const box = document.getElementById(`d-${i}`);
        if (box) box.style.borderColor = (i === activeDigit ? "#ffffff" : "#333");
    }
}

window.closeModal = function() { document.getElementById('modal').style.display = 'none'; }
