const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];

ws.onopen = () => {
    document.getElementById('status').innerText = '● Connected';
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 })); }, 30000);
};

ws.onmessage = (msg) => {
    const res = JSON.parse(msg.data);
    if (res.active_symbols) { 
        allSymbols = res.active_symbols; 
        loadCategory('volatility'); 
    }
    if (res.tick) updatePriceUI(res.tick);
};

function loadCategory(cat, el) {
    const list = document.getElementById('market-list');
    list.innerHTML = '<tr><td colspan="3" style="text-align:center;">Syncing Markets...</td></tr>';
    
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        const mkt = s.market.toLowerCase();
        const sub = s.submarket ? s.submarket.toLowerCase() : "";

        // BROAD VOLATILITY: Catching 'v', 'volatility', and '1s' variants
        if (cat === 'volatility') {
            return (mkt.includes('synthetic') || mkt.includes('indices')) && 
                   (sym.includes('v') || sym.includes('volatility') || sym.includes('1s'));
        }

        // BASKETS: Checking market and submarket names
        if (cat === 'basket') {
            return mkt.includes('basket') || sub.includes('basket') || sym.includes('basket');
        }

        // OTHER CATEGORIES
        if (cat === 'crashboom') return sym.includes('crash') || sym.includes('boom');
        if (cat === 'jump') return sym.startsWith('jd') || sub.includes('jump');
        if (cat === 'range') return sym.includes('range') || sym.includes('step') || sym.includes('stp');
        if (cat === 'forex') return mkt === 'forex';
        if (cat === 'crypto') return mkt === 'cryptocurrency';
        
        return false;
    });

    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = '<tr><td colspan="3" style="text-align:center;">No markets found.</td></tr>';
        return;
    }

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td>
            <td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">View</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    document.getElementById('chart-area').innerHTML = `
        <iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function updatePriceUI(tick) {
    activeSub = tick.id;
    const priceDisplay = document.getElementById('mPrice');
    const oldPrice = parseFloat(priceDisplay.innerText) || 0;
    const newPrice = tick.quote;
    priceDisplay.innerText = newPrice;
    priceDisplay.style.color = (newPrice >= oldPrice) ? "#4CAF50" : "#ff444f";
    document.getElementById('mDir').innerText = (newPrice >= oldPrice) ? "▲ RISE" : "▼ FALL";
    document.getElementById('mDir').style.color = priceDisplay.style.color;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
