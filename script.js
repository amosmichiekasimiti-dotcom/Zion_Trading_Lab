const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentContract = 'rise_fall';
let digitStats = Array(10).fill(0);
let tickCount = 0;

ws.onopen = () => {
    document.getElementById('status').innerHTML = '● Connected';
    document.getElementById('status').style.color = '#4caf50';
    // Load all market symbols
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }
    if (data.tick) handleLiveTick(data.tick);
};

// Fixed Category Filtering
function loadCategory(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    list.innerHTML = '<tr><td colspan="3">Syncing...</td></tr>';

    const filtered = allSymbols.filter(s => {
        const sym = s.symbol.toLowerCase();
        const disp = s.display_name.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && !disp.includes('jump') && !disp.includes('step');
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'jump') return disp.includes('jump');
        if (cat === 'range') return disp.includes('range') || disp.includes('step');
        if (cat === 'forex') return s.market === 'forex';
        return false;
    });

    list.innerHTML = '';
    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    currentSymbol = symbol;
    digitStats = Array(10).fill(0);
    tickCount = 0;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    // Clear and build grid
    buildGrid();
    
    // Load TradingView chart immediately
    document.getElementById('chart-container').innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" style="border:none;"></iframe>`;

    // Subscribe to direct live feed
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function setContract(type, el) {
    currentContract = type;
    document.querySelectorAll('.c-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    updateStats(-1); // Refresh visual state
}

function handleLiveTick(tick) {
    activeSub = tick.id;
    // DIRECT TRANSFER: Uses pip_size to pull the EXACT real last digit from Deriv
    const priceStr = tick.quote.toFixed(tick.pip_size);
    const lastDigit = parseInt(priceStr.slice(-1));
    
    document.getElementById('mPrice').innerHTML = priceStr.replace(/.$/, `<span style="color:var(--red); font-weight:bold;">${lastDigit}</span>`);

    digitStats[lastDigit]++;
    tickCount++;
    updateStats(lastDigit);
}

function buildGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `<div id="d-${i}" class="d-box"><div class="d-num">${i}</div><div id="bar-${i}" class="d-bar" style="height:0%;"></div><div id="p-${i}" class="d-pct">0%</div></div>`;
    }
}

function updateStats(lastDigit) {
    for (let i = 0; i <= 9; i++) {
        const pct = tickCount > 0 ? ((digitStats[i] / tickCount) * 100).toFixed(1) : "0.0";
        const bar = document.getElementById(`bar-${i}`);
        const pctLabel = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);
        
        pctLabel.innerText = pct + '%';
        bar.style.height = pct + '%';

        // Highlight the current active digit (Direct Platform Look)
        if (i === lastDigit) {
            box.style.borderColor = "var(--red)";
            bar.style.background = "var(--red)";
        } else {
            box.style.borderColor = "#333";
            bar.style.background = "#323738";
        }
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
