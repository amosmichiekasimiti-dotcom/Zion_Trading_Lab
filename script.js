/**
 * Zion Trading Lab - Professional Direct Feed
 * Synchronized with Deriv "Reef" Servers
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let digitWindow = []; // Stores the last 100 real digits from the Reef

ws.onopen = () => {
    console.log("Connected to Zion Lab Direct Feed");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Initial Symbol Loading
    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }

    // STEP 1: Process Initial Reef History (Real Percentages)
    if (data.history) {
        digitWindow = []; // Clear for fresh data
        data.history.prices.forEach(price => {
            const digit = parseInt(price.toFixed(data.pip_size).slice(-1));
            digitWindow.push(digit);
        });
        renderReefStats();
    }

    // STEP 2: Handle Live Ticks for Price & Running Digit
    if (data.tick) {
        activeSub = data.tick.id;
        const priceStr = data.tick.quote.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        const head = priceStr.slice(0, -1);
        
        // Update Running Price Number (Visible for all assets)
        const priceEl = document.getElementById('live-price');
        if (priceEl) {
            priceEl.innerHTML = `${head}<span>${lastDigit}</span>`;
        }

        // Maintain the 100-occurrence window for Real Probabilities
        digitWindow.push(lastDigit);
        if (digitWindow.length > 100) digitWindow.shift();
        
        if (currentMode !== 'rise_fall') {
            renderReefStats(lastDigit);
        }
    }
};

function loadCategory(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    if (!list) return;
    list.innerHTML = '';

    const filtered = allSymbols.filter(s => {
        const disp = s.display_name.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && !disp.includes('jump') && !disp.includes('step');
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'jump') return disp.includes('jump');
        if (cat === 'range') return disp.includes('range') || disp.includes('step');
        if (cat === 'forex') return s.market === 'forex';
        if (cat === 'crypto') return s.market === 'cryptocurrency';
        return false;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    currentSymbol = symbol;
    digitWindow = []; 
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    // Switch to default view
    switchContract('rise_fall', document.querySelector('.tab'));

    // DIRECT COMMAND: Fetch 100-tick history from the Reef immediately
    ws.send(JSON.stringify({
        "ticks_history": symbol,
        "adjust_start_time": 1,
        "count": 100,
        "end": "latest",
        "style": "ticks"
    }));

    // Subscribe for live candlestick and digit updates
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const panel = document.getElementById('digit-analysis-panel');
    const chart = document.getElementById('chart-container');

    if (mode === 'rise_fall') {
        panel.style.display = 'none';
        chart.style.height = '100%';
    } else {
        panel.style.display = 'block';
        chart.style.height = '400px';
        buildDigitGrid();
    }
    
    // Load TradingView Candle Chart synchronized with price
    chart.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
}

function buildDigitGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `
            <div id="d-${i}" class="d-box">
                <div class="d-num">${i}</div>
                <div id="bar-${i}" class="d-bar" style="height:0%;"></div>
                <div id="p-${i}" class="d-pct" style="position:absolute; bottom:-15px; font-size:10px; color:#333; font-weight:bold;">0%</div>
            </div>`;
    }
}

function renderReefStats(activeDigit) {
    const counts = Array(10).fill(0);
    digitWindow.forEach(d => counts[d]++);

    for (let i = 0; i <= 9; i++) {
        const realPct = digitWindow.length > 0 ? ((counts[i] / digitWindow.length) * 100).toFixed(1) : 0;
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);
        
        if (label) label.innerText = realPct + "%";
        if (bar) bar.style.height = realPct + "%";

        // Highlight visual to match Reef platform
        if (i === activeDigit) {
            if (box) box.style.borderColor = "#ff444f";
            if (bar) bar.style.background = "#ff444f";
        } else {
            if (box) box.style.borderColor = "#ddd";
            if (bar) bar.style.background = "#323738";
        }
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
