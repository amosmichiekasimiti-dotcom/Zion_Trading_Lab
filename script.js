const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let tickHistory = [];

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
    if (res.tick) updateTradingUI(res.tick);
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
    tickHistory = [];
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    const isSynthetic = name.toLowerCase().includes('volatility') || name.toLowerCase().includes('1s') || symbol.includes('R_');
    const digitPanel = document.getElementById('digit-panel');
    const chartArea = document.getElementById('chart-area');

    // Routing Logic: Digits vs Candles
    if (isSynthetic) {
        digitPanel.style.display = 'block';
        chartArea.style.height = '300px';
        renderDigitGrid();
    } else {
        digitPanel.style.display = 'none';
        chartArea.style.height = '450px';
    }

    chartArea.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
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

function updateTradingUI(tick) {
    activeSub = tick.id;
    const priceDisplay = document.getElementById('mPrice');
    const oldPrice = parseFloat(priceDisplay.innerText.replace(/,/g, '')) || 0;
    const newPrice = tick.quote;
    const pipSize = tick.pip_size || 2;

    // High Precision Price Display
    priceDisplay.innerText = newPrice.toLocaleString(undefined, {minimumFractionDigits: pipSize});
    const isRise = newPrice >= oldPrice;
    priceDisplay.style.color = isRise ? "#4caf50" : "#ff444f";

    // Extract exact Last Digit
    const priceStr = newPrice.toFixed(pipSize);
    const lastDigit = parseInt(priceStr.slice(-1));
    
    // Process Digit Stats
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
            // Condition Colors
            box.style.borderBottomColor = (pct > 12) ? '#4caf50' : (pct < 8 ? '#ff444f' : '#ddd');
        }
    });

    const dirLabel = document.getElementById('mDir');
    dirLabel.innerText = isRise ? "▲ RISE" : "▼ FALL";
    dirLabel.style.color = isRise ? "#4caf50" : "#ff444f";
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
