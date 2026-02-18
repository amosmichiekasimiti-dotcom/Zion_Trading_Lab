const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allSymbols = [], currentSymbol = '', currentMode = 'rise_fall';
let tickCount = 25, reefDigitWindow = [], lastPrice = 0;
let signalBuffer = 0, lastSuggestedSignal = "";

// 1. WebSocket Initialization
ws.onopen = () => {
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    setInterval(() => ws.send(JSON.stringify({ping: 1})), 30000);
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Initial load of assets
    if (data.active_symbols) {
        allSymbols = data.active_symbols;
        loadCategory('volatility');
    }

    // Master History Sync: Ensures local numbers "rhyme" with Deriv 
    if (data.history) {
        const pipSize = data.pip_size || 2;
        reefDigitWindow = data.history.prices.map(p => 
            parseInt(p.toFixed(pipSize).split('').pop())
        );
        renderDigitUI();
    }

    // Live Tick Processing
    if (data.tick) {
        const pipSize = data.tick.pip_size;
        const priceStr = data.tick.quote.toFixed(pipSize);
        const lastDigit = parseInt(priceStr.split('').pop());

        // Update Digit Window
        reefDigitWindow.push(lastDigit);
        if (reefDigitWindow.length > tickCount) reefDigitWindow.shift();

        // UI Updates
        document.getElementById('live-price').innerHTML = `${priceStr.slice(0, -1)}<span>${lastDigit}</span>`;
        updateArrow(data.tick.quote);
        
        if (currentMode !== 'rise_fall') renderDigitUI(lastDigit);
        processStrictSignals(data.tick.quote, lastDigit);
        lastPrice = data.tick.quote;
    }
};

// 2. Navigation & Modal Logic
function loadCategory(cat, el) {
    if (el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
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
        list.innerHTML += `<tr><td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">ANALYZE</button></td></tr>`;
    });
}

function openAnalysis(name, symbol) {
    currentSymbol = symbol;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'flex';
    
    // Clear and request fresh history to sync
    reefDigitWindow = [];
    requestSync();
    
    // Chart Persistence
    document.getElementById('chart-container').innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
}

// 3. Digit & Contract Management
function setTickCount(val, el) {
    tickCount = val;
    document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    requestSync();
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    
    // Visibility: Only show Digit Panel for Digit Markets
    document.getElementById('digit-panel').style.display = (mode === 'rise_fall') ? 'none' : 'block';
    if (mode !== 'rise_fall') buildDigitGrid();
}

function requestSync() {
    ws.send(JSON.stringify({ "ticks_history": currentSymbol, "count": tickCount, "end": "latest", "style": "ticks" }));
    if (currentSymbol) {
        ws.send(JSON.stringify({ "forget_all": "ticks" }));
        ws.send(JSON.stringify({ "ticks": currentSymbol, "subscribe": 1 }));
    }
}

// 4. Signal Processing (10-Tick Stability Filter)
function processStrictSignals(price, digit) {
    const sigText = document.getElementById('signal-text');
    let currentSignal = "ANALYZING...";
    let color = "var(--neon)";

    if (currentMode === 'even_odd') {
        const evens = reefDigitWindow.filter(d => d % 2 === 0).length;
        const evenPct = (evens / reefDigitWindow.length) * 100;
        if (evenPct > 58) currentSignal = `EVEN STRONG (${evenPct}%)`;
        else if (evenPct < 42) currentSignal = `ODD STRONG (${100 - evenPct}%)`;
    } 
    else if (currentMode === 'over_under') {
        const over4 = reefDigitWindow.filter(d => d > 4).length;
        const overPct = (over4 / reefDigitWindow.length) * 100;
        if (overPct > 58) currentSignal = `OVER 4 STRONG (${overPct}%)`;
        else if (overPct < 42) currentSignal = `UNDER 5 STRONG (${100 - overPct}%)`;
    }
    else {
        // Rise/Fall Momentum
        if (price > lastPrice) currentSignal = "BULLISH MOMENTUM";
        else if (price < lastPrice) currentSignal = "BEARISH MOMENTUM";
    }

    // Stability Logic: Signal must stay the same for 10 ticks to show
    if (currentSignal === lastSuggestedSignal) {
        signalBuffer++;
        if (signalBuffer >= 10) {
            sigText.innerText = currentSignal;
            sigText.style.color = currentSignal.includes('STRONG') || currentSignal.includes('MOMENTUM') ? "var(--green)" : "var(--neon)";
        }
    } else {
        signalBuffer = 0;
        lastSuggestedSignal = currentSignal;
    }
}

// 5. Rendering Helpers
function buildDigitGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `<div id="d-${i}" class="d-box"><div id="p-${i}" class="d-pct">0%</div><div id="bar-${i}" class="d-bar"></div><div class="d-num">${i}</div></div>`;
    }
}

function renderDigitUI(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    for (let i = 0; i <= 9; i++) {
        const pct = Math.round((counts[i] / reefDigitWindow.length) * 100);
        const bar = document.getElementById(`bar-${i}`);
        const lab = document.getElementById(`p-${i}`);
        if (bar) bar.style.height = `${pct}%`;
        if (lab) lab.innerText = `${pct}%`;
        
        const box = document.getElementById(`d-${i}`);
        if (box) box.style.background = (i === activeDigit) ? "rgba(0, 242, 254, 0.3)" : "#1a1a1a";
    }
}

function updateArrow(price) {
    const ar = document.getElementById('direction-arrow');
    if (price > lastPrice) { ar.innerText = '↑'; ar.style.color = 'var(--green)'; }
    else if (price < lastPrice) { ar.innerText = '↓'; ar.style.color = 'var(--red)'; }
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }
