/**
 * Zion Trading Lab - Authoritative Direct Feed
 * Strategy Integrated: Physics Momentum & Parity Logic
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0; 
let reefDigitWindow = []; 
let physicsBuffer = []; // Buffer to track market velocity

ws.onopen = () => {
    console.log("Zion Lab: Connected to Direct Reef Feed");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    
    // KEEP ALIVE: Send ping every 30s to prevent disconnects
    setInterval(() => { if(ws.readyState === 1) ws.send(JSON.stringify({ping: 1})); }, 30000);
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }

    if (data.history) {
        reefDigitWindow = []; 
        data.history.prices.forEach(price => {
            const digit = parseInt(price.toFixed(data.pip_size).slice(-1));
            reefDigitWindow.push(digit);
        });
        renderReefStatistics();
    }

    if (data.tick) {
        activeSub = data.tick.id;
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        const head = priceStr.slice(0, -1);
        
        // Physics Logic: Update Momentum Buffer
        physicsBuffer.push(currentPrice);
        if (physicsBuffer.length > 14) physicsBuffer.shift();
        
        let directionArrow = "";
        let arrowColor = "#ffffff";
        if (lastPrice > 0) {
            if (currentPrice > lastPrice) { directionArrow = " ▲"; arrowColor = "#4caf50"; }
            else if (currentPrice < lastPrice) { directionArrow = " ▼"; arrowColor = "#ff444f"; }
        }
        lastPrice = currentPrice;

        // Display Strategy Signal in Header
        const strategySignal = runZionStrategy(lastDigit);

        const priceDisplay = document.getElementById('live-price');
        if (priceDisplay) {
            priceDisplay.innerHTML = `
                <div style="font-size: 12px; color: ${strategySignal.color}; margin-bottom: 5px; font-weight: bold;">
                    ${strategySignal.msg}
                </div>
                ${head}<span style="color:var(--red); border-bottom: 2px solid var(--red);">${lastDigit}</span>
                <span style="color:${arrowColor}; font-size: 22px; margin-left: 10px; font-weight: bold;">${directionArrow}</span>
            `;
        }

        reefDigitWindow.push(lastDigit);
        if (reefDigitWindow.length > 100) reefDigitWindow.shift();
        
        renderReefStatistics(lastDigit);
    }
};

/**
 * STRATEGY ENGINE: Evaluates 10 Conditions for different modes
 */
function runZionStrategy(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    
    // Physics Velocity (Displacement over 14 ticks)
    let velocity = 0;
    if (physicsBuffer.length === 14) {
        velocity = physicsBuffer[13] - physicsBuffer[0];
    }

    let evenSum = counts[0] + counts[2] + counts[4] + counts[6] + counts[8];
    let oddSum = 100 - evenSum;
    
    let result = { msg: "ANALYZING MARKET...", color: "#888" };

    // RISE/FALL STRATEGY
    if (currentMode === 'rise_fall') {
        if (velocity > 0 && activeDigit > 6) result = { msg: "SIGNAL: STRONG RISE", color: "#4caf50" };
        else if (velocity < 0 && activeDigit < 3) result = { msg: "SIGNAL: STRONG FALL", color: "#ff444f" };
    } 
    // EVEN/ODD STRATEGY
    else if (currentMode === 'even_odd') {
        if (evenSum > 56 && activeDigit % 2 === 0) result = { msg: "SIGNAL: EVEN STRENGTH", color: "#4caf50" };
        else if (oddSum > 56 && activeDigit % 2 !== 0) result = { msg: "SIGNAL: ODD STRENGTH", color: "#4caf50" };
    }
    // OVER/UNDER STRATEGY
    else if (currentMode === 'over_under') {
        const overCount = counts[6] + counts[7] + counts[8] + counts[9];
        if (overCount > 45 && velocity > 0) result = { msg: "SIGNAL: OVER BIAS", color: "#4caf50" };
    }
    // MATCHES/DIFFERS STRATEGY
    else if (currentMode === 'matches_differs') {
        const minCount = Math.min(...counts);
        const coldDigit = counts.indexOf(minCount);
        if (minCount < 8) result = { msg: `SIGNAL: DIFFERS ${coldDigit}`, color: "#4caf50" };
    }

    return result;
}

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
    reefDigitWindow = []; 
    physicsBuffer = [];
    lastPrice = 0;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('price-symbol').innerText = symbol.toUpperCase();
    document.getElementById('modal').style.display = 'block';
    switchContract('rise_fall', document.querySelector('.tab'));
    ws.send(JSON.stringify({ "ticks_history": symbol, "count": 100, "end": "latest", "style": "ticks" }));
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
    chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
}

function buildDigitGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `<div id="d-${i}" class="d-box"><div class="d-num">${i}</div><div id="bar-${i}" class="d-bar"></div><div id="p-${i}" class="d-pct">0%</div></div>`;
    }
}

function renderReefStatistics(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);
    for (let i = 0; i <= 9; i++) {
        const realPercentage = reefDigitWindow.length > 0 ? ((counts[i] / reefDigitWindow.length) * 100).toFixed(1) : 0;
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);
        if (label) {
            label.innerText = realPercentage + "%";
            if (counts[i] === maxVal && maxVal !== minVal) label.style.color = "#4caf50";
            else if (counts[i] === minVal && maxVal !== minVal) label.style.color = "#ff444f";
            else label.style.color = "#00f2fe";
        }
        if (bar) bar.style.height = realPercentage + "%";
        if (i === activeDigit) {
            if (box) { box.style.background = "#000000"; box.style.borderColor = "#ffffff"; box.style.transform = "scale(1.05)"; }
        } else {
            if (box) { box.style.background = "#161625"; box.style.borderColor = "#333"; box.style.transform = "scale(1)"; }
        }
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
