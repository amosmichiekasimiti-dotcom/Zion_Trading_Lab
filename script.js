const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let tickHistory = []; // Stores the last 100 digits for real % accuracy

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
    if (res.tick) updateAnalysisUI(res.tick);
};

function loadCategory(cat, el) {
    const list = document.getElementById('market-list');
    list.innerHTML = '<tr><td colspan="3" style="text-align:center;">Analyzing API Data...</td></tr>';
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        const mkt = s.market.toLowerCase();
        const display = s.display_name.toLowerCase();

        if (cat === 'volatility') {
            return mkt.includes('synthetic') && (display.includes('volatility') || sym.includes('v') || sym.includes('1s'));
        }
        if (cat === 'basket') return mkt.includes('basket') || display.includes('basket');
        if (cat === 'crashboom') return display.includes('crash') || display.includes('boom');
        if (cat === 'jump') return sym.startsWith('jd') || display.includes('jump');
        if (cat === 'range') return sym.includes('range') || sym.includes('stp') || display.includes('step');
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
    tickHistory = []; // Reset percentages for the new market
    document.getElementById('mTitle').innerText = name + " - Digit Stats";
    document.getElementById('modal').style.display = 'block';
    document.getElementById('chart-area').innerHTML = `
        <iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    // Create the 0-9 UI cards
    let gridHTML = '';
    for(let i=0; i<=9; i++) {
        gridHTML += `<div id="d-card-${i}" style="background:#f9f9f9; border:1px solid #eee; border-radius:8px; padding:10px; text-align:center;">
            <span style="font-size:1.4rem; font-weight:bold; display:block;">${i}</span>
            <span id="d-pct-${i}" style="font-size:0.8rem; font-weight:bold; color:#999;">0%</span>
        </div>`;
    }
    document.getElementById('digit-grid').innerHTML = gridHTML;

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function updateAnalysisUI(tick) {
    activeSub = tick.id;
    const priceDisplay = document.getElementById('mPrice');
    const oldPrice = parseFloat(priceDisplay.innerText.replace(/[^\d.-]/g, '')) || 0;
    const priceStr = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(priceStr.slice(-1));

    // Update Price with bold last digit (Rise/Fall logic)
    priceDisplay.innerHTML = `${priceStr.slice(0, -1)}<span style="border-bottom:3px solid var(--red);">${lastDigit}</span>`;
    priceDisplay.style.color = (tick.quote >= oldPrice) ? "#4CAF50" : "#ff444f";
    document.getElementById('mDir').innerText = (tick.quote >= oldPrice) ? "▲ RISE" : "▼ FALL";
    document.getElementById('mDir').style.color = priceDisplay.style.color;

    // Digit Math (100 Tick History)
    tickHistory.push(lastDigit);
    if (tickHistory.length > 100) tickHistory.shift();
    const counts = Array(10).fill(0);
    tickHistory.forEach(d => counts[d]++);

    // Update Grid Percentages (Matches/Differs, Even/Odd, Over/Under logic)
    counts.forEach((count, i) => {
        const pct = ((count / tickHistory.length) * 100).toFixed(1);
        const card = document.getElementById(`d-card-${i}`);
        const pctLabel = document.getElementById(`d-pct-${i}`);

        if (pctLabel) {
            pctLabel.innerText = `${pct}%`;
            // Official color logic: Green (>12%) and Red (<8.5%)
            pctLabel.style.color = pct > 12 ? "#4caf50" : (pct < 8.5 ? "#ff444f" : "#999");
        }
        if (card) {
            card.style.background = (i === lastDigit) ? "#1e1e1e" : "#f9f9f9";
            card.style.color = (i === lastDigit) ? "white" : "black";
        }
    });
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
