const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let tickHistory = []; // Tracks exactly 100 ticks for official percentage spreading
let currentMarketType = 'matches_differs'; // Default type for analysis

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
    if (res.tick) updateDigitLogic(res.tick);
};

function loadCategory(cat, el) {
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');

    const filtered = allSymbols.filter(s => {
        const mkt = s.market.toLowerCase();
        const sym = s.symbol.toLowerCase();
        if (cat === 'volatility') return mkt.includes('synthetic') && (sym.includes('vol') || sym.includes('1s'));
        if (cat === 'basket') return mkt.includes('basket');
        if (cat === 'crashboom') return sym.includes('crash') || sym.includes('boom');
        if (cat === 'jump') return sym.startsWith('jd');
        if (cat === 'range') return sym.includes('range') || sym.includes('step');
        if (cat === 'forex') return mkt === 'forex';
        if (cat === 'crypto') return mkt === 'cryptocurrency';
        return false;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        // Check if market is Volatility to handle digit market types
        const isDigit = cat === 'volatility' ? 'matches_differs' : 'rise_fall';
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td>
            <td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}', '${cat}', '${isDigit}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol, category, marketType) {
    tickHistory = [];
    currentMarketType = marketType;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    const digitArea = document.getElementById('digit-analysis-area');
    const label = document.getElementById('digit-market-label');
    const chartArea = document.getElementById('chart-area');

    if (category === 'volatility') {
        digitArea.style.display = 'block';
        chartArea.style.height = '350px';
        label.innerText = marketType.replace('_', ' ');
        
        let gridHTML = '';
        for(let i=0; i<=9; i++) {
            gridHTML += `<div id="d-card-${i}" class="digit-box"><span class="d-val">${i}</span><span id="d-pct-${i}" class="d-pct">0%</span></div>`;
        }
        document.getElementById('digit-grid').innerHTML = gridHTML;
    } else {
        digitArea.style.display = 'none';
        chartArea.style.height = '500px';
    }

    // Embed direct TradingView command for candlesticks
    chartArea.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function updateDigitLogic(tick) {
    activeSub = tick.id;
    // Direct API command: retrieve true last digit using pip_size precision
    const priceStr = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(priceStr.slice(-1));

    document.getElementById('mPrice').innerHTML = `${priceStr.slice(0, -1)}<span style="color:var(--red); border-bottom:3px solid var(--red);">${lastDigit}</span>`;
    
    tickHistory.push(lastDigit);
    if (tickHistory.length > 100) tickHistory.shift();

    const counts = Array(10).fill(0);
    tickHistory.forEach(d => counts[d]++);

    counts.forEach((count, i) => {
        const pct = ((count / tickHistory.length) * 100).toFixed(1);
        const card = document.getElementById(`d-card-${i}`);
        const label = document.getElementById(`d-pct-${i}`);
        
        if (label) {
            label.innerText = `${pct}%`;
            label.style.color = pct > 12 ? "var(--green)" : (pct < 8 ? "var(--red)" : "#999");
            
            // Highlight specific segments for Even/Odd or Over/Under
            if (currentMarketType === 'even_odd') {
                card.style.borderBottomColor = (i % 2 === 0) ? 'var(--green)' : 'var(--red)';
            } else if (currentMarketType === 'over_under') {
                card.style.borderBottomColor = (i > 4) ? 'var(--green)' : 'var(--red)';
            } else {
                card.style.borderBottomColor = 'transparent';
            }
        }
        if (card) card.classList.toggle('active', i === lastDigit);
    });
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
