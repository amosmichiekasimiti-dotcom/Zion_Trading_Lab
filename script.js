const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let priceHistory = [];
let candleHistory = [];
let reefDigitWindow = [];

ws.onopen = () => {
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) { allSymbols = data.active_symbols; loadCategory('volatility'); }
    if (data.tick) processTick(data.tick);
    if (data.history) processHistory(data.history);
    if (data.candles) candleHistory = data.candles;
};

function processTick(tick) {
    activeSub = tick.id;
    const price = tick.quote;
    const digit = parseInt(price.toFixed(tick.pip_size).slice(-1));
    
    // Update UI Price
    const priceEl = document.getElementById('live-price');
    priceEl.innerHTML = `${price.toFixed(tick.pip_size - 1)}<span class="active-digit">${digit}</span>`;
    
    priceHistory.push(price);
    reefDigitWindow.push(digit);
    if(priceHistory.length > 50) priceHistory.shift();
    if(reefDigitWindow.length > 100) reefDigitWindow.shift();

    if (currentMode === 'rise_fall') {
        updateRiseFallEngine();
    } else {
        renderDigits();
    }
}

function updateRiseFallEngine() {
    // Basic Direction Logic
    const last = priceHistory[priceHistory.length - 1];
    const prev = priceHistory[priceHistory.length - 5];
    const signal = last > prev ? 'RISE' : 'FALL';
    
    const sigEl = document.getElementById('rf-primary-signal');
    sigEl.textContent = signal;
    sigEl.className = 'signal-value ' + (signal === 'RISE' ? 'signal-buy' : 'signal-sell');
}

function openAnalysis(name, symbol) {
    currentSymbol = symbol;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('price-symbol').innerText = symbol;
    document.getElementById('modal').style.display = 'block';
    
    // Clear old subscription
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    
    // Subscribe to new
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    
    // Load TradingView Fixed
    initTradingView(symbol);
}

function initTradingView(symbol) {
    const container = document.getElementById('chart-container');
    // We map internal symbols to TradingView compatible ones if necessary
    // Binary.com uses symbols like 'R_100', TV usually needs them in a specific frame
    container.innerHTML = `<iframe 
        src="https://tradingview.deriv.com/v2/main.php?symbol=${symbol}&theme=dark&interval=1" 
        width="100%" 
        height="100%" 
        frameborder="0" 
        scrolling="no" 
        allowfullscreen></iframe>`;
}

function loadCategory(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    list.innerHTML = '';

    const filtered = allSymbols.filter(s => {
        const d = s.display_name.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && !d.includes('jump');
        if (cat === 'crashboom') return d.includes('crash') || d.includes('boom');
        return s.market === cat;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol}</td>
            <td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById('risefall-engine-panel').style.display = mode === 'rise_fall' ? 'block' : 'none';
    document.getElementById('signal-engine-panel').style.display = mode !== 'rise_fall' ? 'block' : 'none';
    document.getElementById('digit-analysis-panel').style.display = mode !== 'rise_fall' ? 'block' : 'none';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}
