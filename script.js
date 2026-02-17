const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let tickHistory = [];

ws.onopen = () => {
    document.getElementById('status').innerText = '● Connected';
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    setInterval(() => ws.send(JSON.stringify({ ping: 1 })), 30000);
};

ws.onmessage = (msg) => {
    const res = JSON.parse(msg.data);
    if (res.active_symbols) { 
        allSymbols = res.active_symbols; 
        loadCategory('volatility'); 
    }
    if (res.tick) processTick(res.tick);
};

function loadCategory(cat, el) {
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && (sym.includes('volatility') || sym.includes('1s'));
        if (cat === 'crashboom') return sym.includes('crash') || sym.includes('boom');
        if (cat === 'jump') return sym.includes('jump');
        if (cat === 'range') return sym.includes('range') || sym.includes('step');
        if (cat === 'basket') return s.market === 'basket_index';
        if (cat === 'forex') return s.market === 'forex';
        if (cat === 'crypto') return s.market === 'cryptocurrency';
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
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    tickHistory = []; // Reset for new market
    
    // Embed Official Chart
    document.getElementById('chart-area').innerHTML = `
        <iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    // Setup Bars
    let barsHTML = '';
    for(let i=0; i<10; i++) {
        barsHTML += `<div class="bar-group"><span id="p-${i}" class="percent-label">0%</span><div id="b-${i}" class="bar" style="height:0px"></div><span class="bar-label">${i}</span></div>`;
    }
    document.getElementById('digit-bars').innerHTML = barsHTML;

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function processTick(tick) {
    activeSub = tick.id;
    const price = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(price.charAt(price.length - 1));

    // 1. Update Price UI
    const priceDisplay = document.getElementById('mPrice');
    const oldPrice = parseFloat(priceDisplay.innerText);
    priceDisplay.innerText = price;
    priceDisplay.style.color = (parseFloat(price) >= oldPrice) ? "#4CAF50" : "#ff444f";
    document.getElementById('mDir').innerText = (parseFloat(price) >= oldPrice) ? "▲ RISE" : "▼ FALL";
    document.getElementById('mDir').style.color = priceDisplay.style.color;

    // 2. Real-Time Digit Logic (Last 100 ticks)
    tickHistory.push(lastDigit);
    if (tickHistory.length > 100) tickHistory.shift();

    const counts = Array(10).fill(0);
    let even = 0;
    tickHistory.forEach(d => {
        counts[d]++;
        if(d % 2 === 0) even++;
    });

    // 3. Update Visual Bars and Stats
    counts.forEach((count, i) => {
        const percent = ((count / tickHistory.length) * 100).toFixed(0);
        document.getElementById(`b-${i}`).style.height = (percent * 1.5) + "px"; // Visual Scale
        document.getElementById(`p-${i}`).innerText = percent + "%";
    });

    document.getElementById('stat-even').innerText = ((even / tickHistory.length) * 100).toFixed(0) + "%";
    document.getElementById('stat-odd').innerText = (((tickHistory.length - even) / tickHistory.length) * 100).toFixed(0) + "%";

    // 4. Last 5 digits tracker
    const last5 = tickHistory.slice(-5).reverse();
    document.getElementById('last-5').innerHTML = last5.map(d => `<span style="color:${d % 2 === 0 ? 'green':'red'}">${d}</span>`).join(' ');
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
