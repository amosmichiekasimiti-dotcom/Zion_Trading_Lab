const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let tickHistory = []; // Tracks exactly 100 ticks for official percentage accuracy

ws.onopen = () => {
    document.getElementById('status').innerText = '● Connected';
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const res = JSON.parse(msg.data);
    if (res.active_symbols) { 
        allSymbols = res.active_symbols; 
        loadCategory('volatility'); 
    }
    if (res.tick) updateRealTimeAnalysis(res.tick);
};

function loadCategory(cat, el) {
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        const mkt = s.market.toLowerCase();
        if (cat === 'volatility') return mkt.includes('synthetic') && (sym.includes('vol') || sym.includes('1s'));
        if (cat === 'crashboom') return sym.includes('crash') || sym.includes('boom');
        if (cat === 'jump') return sym.startsWith('jd');
        if (cat === 'range') return sym.includes('range') || sym.includes('stp');
        if (cat === 'basket') return mkt.includes('basket');
        if (cat === 'forex') return mkt === 'forex';
        if (cat === 'crypto') return mkt === 'cryptocurrency';
        return false;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td>
            <td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">View</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    tickHistory = []; // Reset for new analysis
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    // Embed Digit/Candlestick chart directly
    document.getElementById('chart-area').innerHTML = `
        <iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    // Build the 0-9 Grid UI
    let gridHTML = '';
    for(let i=0; i<=9; i++) {
        gridHTML += `<div id="d-card-${i}" class="digit-card"><span class="digit-val">${i}</span><span id="d-pct-${i}" class="digit-pct">0.0%</span></div>`;
    }
    document.getElementById('digit-display-grid').innerHTML = gridHTML;

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function updateRealTimeAnalysis(tick) {
    activeSub = tick.id;
    const priceStr = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(priceStr.slice(-1));

    // 1. Update Bold Price Hero
    document.getElementById('mPrice').innerHTML = `${priceStr.slice(0, -1)}<span style="color:var(--red); border-bottom:3px solid var(--red);">${lastDigit}</span>`;
    
    // 2. Math for Digit Stats (100 Tick History)
    tickHistory.push(lastDigit);
    if (tickHistory.length > 100) tickHistory.shift();

    const counts = Array(10).fill(0);
    tickHistory.forEach(d => counts[d]++);

    // 3. Update the Grid Percentages and Highlighting
    counts.forEach((count, i) => {
        const pct = ((count / tickHistory.length) * 100).toFixed(1);
        const card = document.getElementById(`d-card-${i}`);
        const pctLabel = document.getElementById(`d-pct-${i}`);

        if (pctLabel) {
            pctLabel.innerText = `${pct}%`;
            // Official color logic: Green (>12%) and Red (<8%)
            pctLabel.style.color = pct > 12 ? "var(--green)" : (pct < 8 ? "var(--red)" : "#888");
        }
        if (card) {
            card.classList.toggle('active', i === lastDigit);
        }
    });
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
