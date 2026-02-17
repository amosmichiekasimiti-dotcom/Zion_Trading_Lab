const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let tickHistory = []; // Last 100 ticks for digit stats
let currentMode = 'rise_fall';

ws.onopen = () => {
    document.getElementById('status').innerText = '● Connected';
    document.getElementById('status').style.color = '#4caf50';
    // Load all active symbols from Deriv
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    // Keep connection alive
    setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 })); }, 30000);
};

ws.onmessage = (msg) => {
    const res = JSON.parse(msg.data);
    if (res.active_symbols) { 
        allSymbols = res.active_symbols; 
        loadCategory('volatility'); // Default view
    }
    // Route live ticks to the analysis engine
    if (res.tick) updateAnalysisEngine(res.tick);
};

// Categorize markets based on Deriv submarkets
function loadCategory(cat, el) {
    const list = document.getElementById('market-list');
    list.innerHTML = '<tr><td colspan="3">Loading Data...</td></tr>';
    
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        const mkt = s.market.toLowerCase();
        const disp = s.display_name.toLowerCase();

        if (cat === 'volatility') return mkt.includes('synthetic') && (sym.includes('v') || sym.includes('1s'));
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'basket') return mkt.includes('basket') || disp.includes('basket');
        if (cat === 'forex') return mkt === 'forex';
        if (cat === 'crypto') return mkt === 'cryptocurrency';
        return false;
    });

    list.innerHTML = '';
    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td>
            <td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    tickHistory = []; // Clear old data for new analysis
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    // Switch between Chart and Digit Grid based on symbol type
    const isDigitMarket = name.toLowerCase().includes('volatility') || name.toLowerCase().includes('1s');
    setupUI(isDigitMarket, symbol);

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function setupUI(showDigits, symbol) {
    const digitDisplay = document.getElementById('digit-display');
    const chartArea = document.getElementById('chart-area');

    if (showDigits) {
        digitDisplay.style.display = 'block';
        chartArea.style.height = '300px';
        renderInitialGrid();
    } else {
        digitDisplay.style.display = 'none';
        chartArea.style.height = '100%';
    }
    // Load TradingView Candles
    chartArea.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
}

// REAL-TIME DIGIT EXTRACTION COMMAND
function updateAnalysisEngine(tick) {
    activeSub = tick.id;
    // Extract exact last digit based on the symbol's pip_size
    const priceStr = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(priceStr.slice(-1));
    
    // Update live price display
    const priceEl = document.getElementById('mPrice');
    priceEl.innerHTML = `${priceStr.slice(0, -1)}<span style="color:#ff444f; font-weight:bold;">${lastDigit}</span>`;

    // Process Statistics for last 100 ticks
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
            // Condition coloring: Green for Even, Red for Odd (Matching Zion Logic)
            box.style.borderBottomColor = (i % 2 === 0) ? '#4caf50' : '#ff444f';
        }
    });
}

function renderInitialGrid() {
    const container = document.getElementById('digit-grid-container');
    let html = '';
    for (let i = 0; i <= 9; i++) {
        html += `<div id="d-${i}" class="digit-box" style="border-bottom: 4px solid #ddd; padding: 10px; text-align: center;">
                    <div style="font-weight:bold;">${i}</div><div id="p-${i}">0%</div>
                 </div>`;
    }
    container.innerHTML = html;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
