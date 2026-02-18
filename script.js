const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null, allSymbols = [], currentSymbol = '', currentMode = 'rise_fall';
let lastPrice = 0, reefDigitWindow = [], priceBuffer = [];
let signalCounter = 0; // Ensures 10-condition filter

ws.onopen = () => {
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    setInterval(() => { if(ws.readyState === 1) ws.send(JSON.stringify({ping: 1})); }, 30000);
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) { allSymbols = data.active_symbols; loadCategory('volatility'); }
    
    if (data.history) {
        reefDigitWindow = data.history.prices.map(p => parseInt(p.toFixed(data.pip_size).slice(-1)));
        priceBuffer = data.history.prices;
        renderReefStatistics();
    }

    if (data.tick) {
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        
        // Directional Arrow Update
        const arrowEl = document.getElementById('direction-arrow');
        if (lastPrice > 0 && arrowEl) {
            arrowEl.innerText = currentPrice > lastPrice ? "↑" : "↓";
            arrowEl.style.color = currentPrice > lastPrice ? "var(--green)" : "var(--red)";
        }

        const priceDisplay = document.getElementById('live-price');
        if (priceDisplay) { priceDisplay.innerHTML = `${priceStr.slice(0, -1)}<span>${lastDigit}</span>`; }

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
    const sigText = document.getElementById('signal-text');
    if (!sigText) return;

    let signal = "ANALYZING";
    let color = "var(--neon)";

    // 1. DIGIT SPECIFIC SIGNALS
    if (currentMode === 'even_odd') {
        const evens = reefDigitWindow.filter(d => d % 2 === 0).length;
        if (evens > 58) { signal = `STRONG EVEN (${evens}%)`; color = "var(--green)"; }
        else if (evens < 42) { signal = `STRONG ODD (${100-evens}%)`; color = "var(--red)"; }
        else { signal = "DIGIT NEUTRAL"; }
    } 
    else if (currentMode === 'over_under') {
        const over4 = reefDigitWindow.filter(d => d > 4).length;
        if (over4 > 58) { signal = `BUY OVER 4 (${over4}%)`; color = "var(--green)"; }
        else if (over4 < 42) { signal = `BUY UNDER 4 (${100-over4}%)`; color = "var(--red)"; }
        else { signal = "BARRIER NEUTRAL"; }
    }
    // 2. RISE/FALL PRICE MOMENTUM (With 10-tick Condition Filter)
    else {
        const momentum = currentPrice - priceBuffer[priceBuffer.length - 11]; // Compare last 10 ticks
        if (momentum > 0 && currentPrice > lastPrice) {
            signalCounter++;
            if (signalCounter >= 10) { signal = "BULLISH TREND ↑"; color = "var(--green)"; }
        } else if (momentum < 0 && currentPrice < lastPrice) {
            signalCounter++;
            if (signalCounter >= 10) { signal = "BEARISH TREND ↓"; color = "var(--red)"; }
        } else {
            signalCounter = 0; // Reset if conditions aren't perfectly met
            signal = "STABILIZING...";
        }
    }

    sigText.innerText = signal; sigText.style.color = color;
}

window.loadCategory = function(cat, el) {
    if(el) { document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active')); el.classList.add('active'); }
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    allSymbols.filter(s => {
        const disp = s.display_name.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && !disp.includes('jump');
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'jump') return disp.includes('jump');
        if (cat === 'range') return disp.includes('range') || disp.includes('step');
        if (cat === 'basket') return disp.includes('basket');
        if (cat === 'forex') return s.market === 'forex';
    }).forEach(s => {
        list.innerHTML += `<tr><td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td></tr>`;
    });
}

window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    reefDigitWindow = []; priceBuffer = []; signalCounter = 0;
    
    switchContract('rise_fall', document.querySelector('.tab'));
    
    ws.send(JSON.stringify({ "ticks_history": symbol, "count": 100, "end": "latest", "style": "ticks" }));
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));

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
    const grid = document.getElementById('digit-grid'); grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `<div id="d-${i}" class="d-box"><div id="p-${i}" class="d-pct">0%</div><div id="bar-${i}" class="d-bar"></div><div class="d-num">${i}</div></div>`;
    }
}

function renderReefStatistics(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    for (let i = 0; i <= 9; i++) {
        const pct = ((counts[i] / reefDigitWindow.length) * 100).toFixed(1);
        const bar = document.getElementById(`bar-${i}`);
        const pctLabel = document.getElementById(`p-${i}`);
        if (bar) bar.style.height = pct + "%";
        if (pctLabel) pctLabel.innerText = Math.round(pct) + "%";
        const box = document.getElementById(`d-${i}`);
        if (box) box.style.borderColor = (i === activeDigit ? "#ffffff" : "#333");
    }
}

window.closeModal = function() { document.getElementById('modal').style.display = 'none'; }
