const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let tickHistory = [];
let currentSymbol = '';
let currentMode = 'rise_fall';

ws.onopen = () => {
    document.getElementById('status').innerText = '● Connected';
    document.getElementById('status').style.color = '#4caf50';
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 })); }, 30000);
};

ws.onmessage = (msg) => {
    const res = JSON.parse(msg.data);
    if (res.active_symbols) { 
        allSymbols = res.active_symbols; 
        loadCategory('volatility'); 
    }
    if (res.tick) updateUI(res.tick);
};

function loadCategory(cat, el) {
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        const mkt = s.market.toLowerCase();
        const disp = s.display_name.toLowerCase();

        if (cat === 'volatility') return mkt.includes('synthetic') && (sym.includes('v') || sym.includes('1s'));
        if (cat === 'basket') return mkt.includes('basket') || disp.includes('basket');
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'jump') return sym.startsWith('jd');
        if (cat === 'range') return sym.includes('range') || sym.includes('step');
        if (cat === 'forex') return mkt === 'forex';
        if (cat === 'crypto') return mkt === 'cryptocurrency';
        return false;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td>
            <td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    currentSymbol = symbol;
    tickHistory = [];
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    // Reset to Rise/Fall by default
    switchContract('rise_fall', document.querySelector('.tab-btn'));

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    const digitDisplay = document.getElementById('digit-display');
    const chartArea = document.getElementById('chart-area');

    if (mode === 'rise_fall') {
        digitDisplay.style.display = 'none';
        chartArea.style.height = '100%';
    } else {
        digitDisplay.style.display = 'block';
        chartArea.style.height = '300px';
        renderDigitGrid();
    }

    // Load TradingView Candles
    chartArea.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
}

function renderDigitGrid() {
    const container = document.getElementById('digit-grid-container');
    let html = '';
    for (let i = 0; i <= 9; i++) {
        html += `<div id="d-${i}" class="digit-box">
                    <div style="font-weight:bold; font-size:16px;">${i}</div>
                    <div id="p-${i}" style="font-size:10px; color:#999;">0%</div>
                 </div>`;
    }
    container.innerHTML = html;
}

function updateUI(tick) {
    activeSub = tick.id;
    const priceStr = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(priceStr.slice(-1));
    
    // Update Price Hero
    const priceEl = document.getElementById('mPrice');
    if (priceEl) {
        priceEl.innerHTML = `${priceStr.slice(0, -1)}<span style="color:var(--red); font-weight:bold; border-bottom:2px solid var(--red);">${lastDigit}</span>`;
    }

    // Digit Stats (Last 100 ticks)
    tickHistory.push(lastDigit);
    if (tickHistory.length > 100) tickHistory.shift();

    const counts = Array(10).fill(0);
    tickHistory.forEach(d => counts[d]++);

    counts.forEach((count, i) => {
        const pct = ((count / tickHistory.length) * 100).toFixed(0);
        const box = document.getElementById(`d-${i}`);
        const label = document.getElementById(`p-${i}`);
        
        if (label) {
            label.innerText = pct + '%';
            box.style.background = (i === lastDigit) ? '#1e1e1e' : '#fdfdfd';
            box.style.color = (i === lastDigit) ? '#fff' : '#000';
            // Even (Green) vs Odd (Red) logic for bottom border
            box.style.borderBottomColor = (i % 2 === 0) ? 'var(--green)' : 'var(--red)';
        }
    });
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
