const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let digitStats = Array(10).fill(0);
let totalTicks = 0;

ws.onopen = () => {
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }
    if (data.tick) updateLiveData(data.tick);
};

function loadCategory(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
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
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    currentSymbol = symbol;
    digitStats = Array(10).fill(0);
    totalTicks = 0;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('price-symbol').innerText = symbol.toUpperCase();
    document.getElementById('modal').style.display = 'block';
    
    // Default to Rise/Fall View
    switchContract('rise_fall', document.querySelector('.tab'));

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const panel = document.getElementById('digit-analysis-panel');
    const chart = document.getElementById('chart-container');

    if (mode === 'rise_fall') {
        panel.style.display = 'none';
        chart.style.height = '100%';
    } else {
        panel.style.display = 'block';
        chart.style.height = '350px';
        renderGrid();
    }
    
    // Load TradingView Candle Chart
    chart.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
}

function updateLiveData(tick) {
    activeSub = tick.id;
    // DIRECT TICK FEED: Works for Forex, Jump, and Volatility
    const priceStr = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(priceStr.slice(-1));
    const head = priceStr.slice(0, -1);
    
    // Update the numbers alongside the trading view/candle
    document.getElementById('live-price').innerHTML = `${head}<span>${lastDigit}</span>`;

    // DIGIT ANALYSIS: Only runs if Even/Odd, Matches, or Over/Under is selected
    if (currentMode !== 'rise_fall') {
        digitStats[lastDigit]++;
        totalTicks++;
        updateGrid(lastDigit);
    }
}

function renderGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `<div id="d-${i}" class="d-box"><div class="d-num">${i}</div><div id="bar-${i}" class="d-bar" style="height:0%;"></div></div>`;
    }
}

function updateGrid(activeDigit) {
    for (let i = 0; i <= 9; i++) {
        const pct = totalTicks > 0 ? ((digitStats[i] / totalTicks) * 100).toFixed(1) : 0;
        const bar = document.getElementById(`bar-${i}`);
        const box = document.getElementById(`d-${i}`);
        
        bar.style.height = pct + '%';
        if (i === activeDigit) {
            box.style.borderColor = "var(--red)";
            bar.style.background = "var(--red)";
        } else {
            box.style.borderColor = "#333";
            bar.style.background = "#323738";
        }
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
