const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allSymbols = [];
let activeSub = null;
let tickHistory = [];

ws.onopen = () => {
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const res = JSON.parse(msg.data);
    if (res.active_symbols) {
        allSymbols = res.active_symbols;
        loadCategory('volatility');
        populateSwitcher();
    }
    if (res.tick) updateDigitStats(res.tick);
};

function loadCategory(cat, el) {
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && (sym.includes('vol') || sym.includes('1s'));
        if (cat === 'crashboom') return sym.includes('crash') || sym.includes('boom');
        if (cat === 'jump') return sym.startsWith('jd');
        if (cat === 'basket') return s.market === 'basket_index';
        return false;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="padding:12px; border-bottom:1px solid #eee; font-weight:600;">${s.display_name}</td>
            <td style="text-align:right; padding-right:10px;"><button onclick="openAnalysis('${s.symbol}')" style="background:#222; color:white; border:none; padding:6px 12px; border-radius:4px;">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function populateSwitcher() {
    const sw = document.getElementById('m-switch');
    sw.innerHTML = allSymbols.filter(s => s.market === 'synthetic_index').map(s => `<option value="${s.symbol}">${s.display_name}</option>`).join('');
}

function openAnalysis(symbol) {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('m-switch').value = symbol;
    changeMarket(symbol);
}

function changeMarket(symbol) {
    tickHistory = []; // Reset percentages for new market
    document.getElementById('live-chart').src = `https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light`;
    
    // Build the 0-9 Grid
    let gridHTML = '';
    for(let i=0; i<=9; i++) {
        gridHTML += `<div id="d-card-${i}" class="digit-card"><span class="digit-val">${i}</span><span id="d-pct-${i}" class="digit-pct">0%</span></div>`;
    }
    document.getElementById('digit-grid').innerHTML = gridHTML;

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function updateDigitStats(tick) {
    activeSub = tick.id;
    const price = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(price.slice(-1));

    // Update Price Header (matches bolded last digit style)
    const basePrice = price.slice(0, -1);
    document.getElementById('mPrice').innerHTML = `${basePrice}<span>${lastDigit}</span>`;

    // Calculate Percentages (Last 100 Ticks)
    tickHistory.push(lastDigit);
    if (tickHistory.length > 100) tickHistory.shift();

    const counts = Array(10).fill(0);
    tickHistory.forEach(d => counts[d]++);

    counts.forEach((count, i) => {
        const pct = ((count / tickHistory.length) * 100).toFixed(1);
        const card = document.getElementById(`d-card-${i}`);
        const pctLabel = document.getElementById(`d-pct-${i}`);

        pctLabel.innerText = `${pct}%`;
        
        // Highlight current tick digit
        card.classList.toggle('highlight', i === lastDigit);

        // Color coding (Green for high frequency, Red for low)
        if (pct > 11.5) pctLabel.style.color = 'var(--green)';
        else if (pct < 8.5) pctLabel.style.color = 'var(--red)';
        else pctLabel.style.color = '#999';
    });
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
