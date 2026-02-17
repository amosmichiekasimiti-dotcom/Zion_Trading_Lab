/**
 * Zion Trading Lab - Final Direct Sync Feed
 * Authoritative Digit Statistics & Real-Time Tick Feed
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let digitHistory = []; // Buffer for the last 100 digits from the Reef

ws.onopen = () => {
    console.log("Zion Lab: Connected to Direct Reef Feed");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Initial Market Data Loading
    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }

    // AUTHENTIC DATA PULL: Initial 100-Tick History for Real Percentages
    if (data.history) {
        digitHistory = []; // Clear old local data
        data.history.prices.forEach(price => {
            const digit = parseInt(price.toFixed(data.pip_size).slice(-1));
            digitHistory.push(digit);
        });
        renderAuthoritativeStats();
    }

    // LIVE STREAM: Real-time Price & Digit Synchronization
    if (data.tick) {
        activeSub = data.tick.id;
        const priceStr = data.tick.quote.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        const head = priceStr.slice(0, -1);
        
        // Update Live Price Number (Always visible)
        const priceDisplay = document.getElementById('live-price');
        if (priceDisplay) {
            priceDisplay.innerHTML = `${head}<span>${lastDigit}</span>`;
        }

        // Maintain the Authoritative 100-occurrence window
        digitHistory.push(lastDigit);
        if (digitHistory.length > 100) digitHistory.shift();
        
        // Only update the probability grid for Digit Markets
        if (currentMode !== 'rise_fall') {
            renderAuthoritativeStats(lastDigit);
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
        if (cat === 'baskets') return s.market === 'indices' && disp.includes('basket');
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
    digitHistory = []; 
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    // Set default view to Rise/Fall (Candles)
    switchContract('rise_fall', document.querySelector('.tab'));

    // REEF COMMAND: Fetch the real 100-tick history state immediately
    ws.send(JSON.stringify({
        "ticks_history": symbol,
        "adjust_start_time": 1,
        "count": 100,
        "end": "latest",
        "style": "ticks"
    }));

    // Subscribe to live authoritative updates
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const digitPanel = document.getElementById('digit-analysis-panel');
    const chartView = document.getElementById('chart-container');

    if (mode === 'rise_fall') {
        digitPanel.style.display = 'none';
        chartView.style.height = '100%';
    } else {
        digitPanel.style.display = 'block';
        chartView.style.height = '400px';
        buildDigitGrid();
    }
    
    // Load TradingView chart synchronized with authoritative feed
    chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
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

function renderAuthoritativeStats(activeDigit) {
    const counts = Array(10).fill(0);
    digitHistory.forEach(d => counts[d]++);

    for (let i = 0; i <= 9; i++) {
        // Calculate the REAL probability based on the server-provided 100-tick window
        const realPercentage = digitHistory.length > 0 ? ((counts[i] / digitHistory.length) * 100).toFixed(1) : 0;
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);
        
        if (label) label.innerText = realPercentage + "%";
        if (bar) bar.style.height = realPercentage + "%";

        // Real-time Visual Highlight to match the official Reef platform
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
