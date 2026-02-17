const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let stats = Array(10).fill(0);
let totalTicks = 0;

ws.onopen = () => {
    document.getElementById('status').innerText = '● Connected';
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }
    if (data.tick) handleTick(data.tick);
};

function loadCategory(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    list.innerHTML = '';

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        const mkt = s.market.toLowerCase();
        const disp = s.display_name.toLowerCase();

        if (cat === 'volatility') return mkt.includes('synthetic') && !disp.includes('jump') && !disp.includes('step') && !disp.includes('range');
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'jump') return disp.includes('jump');
        if (cat === 'range') return disp.includes('range') || disp.includes('step');
        if (cat === 'basket') return mkt.includes('basket');
        if (cat === 'forex') return mkt === 'forex';
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
    stats = Array(10).fill(0);
    totalTicks = 0;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    setMode('rise_fall', document.querySelector('.c-btn'));

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function setMode(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.c-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    const panel = document.getElementById('digit-panel');
    panel.style.display = (mode === 'rise_fall') ? 'none' : 'block';
    
    // Fix TradingView display
    document.getElementById('chart-container').innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" style="border:none;"></iframe>`;
    
    if (mode !== 'rise_fall') renderGrid();
}

function handleTick(tick) {
    activeSub = tick.id;
    // DIRECT DIGIT PULL: Uses pip_size to get the absolute real last digit
    const priceStr = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(priceStr.slice(-1));
    
    document.getElementById('mPrice').innerHTML = priceStr.replace(/.$/, `<span style="color:var(--red); font-weight:bold;">${lastDigit}</span>`);

    if (currentMode !== 'rise_fall') {
        stats[lastDigit]++;
        totalTicks++;
        updateStatsUI(lastDigit);
    }
}

function renderGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `<div id="d-${i}" class="d-box"><b>${i}</b><br><span id="p-${i}">0%</span></div>`;
    }
}

function updateStatsUI(currentDigit) {
    for (let i = 0; i <= 9; i++) {
        const pct = ((stats[i] / totalTicks) * 100).toFixed(1);
        const box = document.getElementById(`d-${i}`);
        document.getElementById(`p-${i}`).innerText = pct + '%';
        
        // Highlight logic
        box.style.background = (i === currentDigit) ? "#444" : "#222";
        if (currentMode === 'even_odd') {
            box.style.borderBottomColor = (i % 2 === 0) ? "var(--green)" : "var(--red)";
        } else if (currentMode === 'over_under') {
            box.style.borderBottomColor = (i > 4) ? "var(--green)" : "var(--red)";
        }
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
