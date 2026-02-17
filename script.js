/**
 * Zion Trading Lab - Complete Authoritative Engine
 */

let ws;
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0;
let reefDigitWindow = []; 
let physicsBuffer = []; 

function connect() {
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    ws.onopen = () => {
        console.log("Connected to Reef Feed");
        ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
        // Keep-alive ping
        setInterval(() => { if(ws.readyState === 1) ws.send(JSON.stringify({ping:1})); }, 30000);
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        if (data.active_symbols) { 
            allSymbols = data.active_symbols; 
            loadCategory('volatility', document.querySelector('.nav-card')); 
        }

        if (data.history) {
            reefDigitWindow = []; 
            data.history.prices.forEach(p => {
                const digit = parseInt(p.toFixed(data.pip_size).slice(-1));
                reefDigitWindow.push(digit);
            });
            renderStats();
        }

        if (data.tick) {
            activeSub = data.tick.id;
            const price = data.tick.quote;
            const priceStr = price.toFixed(data.tick.pip_size);
            const lastDigit = parseInt(priceStr.slice(-1));
            
            // Physics & Arrows
            updatePriceUI(priceStr, price, lastDigit);
            
            // Buffers
            reefDigitWindow.push(lastDigit);
            if (reefDigitWindow.length > 100) reefDigitWindow.shift();
            
            physicsBuffer.push(price);
            if (physicsBuffer.length > 14) physicsBuffer.shift();

            renderStats(lastDigit);
        }
    };

    ws.onclose = () => setTimeout(connect, 3000);
}

function loadCategory(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
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

window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    reefDigitWindow = []; physicsBuffer = [];
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    switchContract('rise_fall', document.querySelector('.tab'));
    
    ws.send(JSON.stringify({ "ticks_history": symbol, "count": 100, "end": "latest", "style": "ticks" }));
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
};

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    
    const panel = document.getElementById('digit-analysis-panel');
    panel.style.display = (mode === 'rise_fall') ? 'none' : 'block';
    
    if (mode !== 'rise_fall') buildGrid();
    document.getElementById('chart-container').innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
}

function buildGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `<div id="d-${i}" class="d-box"><div class="d-num">${i}</div><div id="bar-${i}" class="d-bar"></div><div id="p-${i}" class="d-pct">0%</div></div>`;
    }
}

function updatePriceUI(str, val, digit) {
    const head = str.slice(0, -1);
    let arrow = val > lastPrice ? " ▲" : " ▼";
    let color = val > lastPrice ? "#4caf50" : "#ff444f";
    lastPrice = val;

    document.getElementById('live-price').innerHTML = `${head}<span>${digit}</span><span style="color:${color}; font-size:18px; margin-left:10px;">${arrow}</span>`;
}

function renderStats(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    const max = Math.max(...counts);
    const min = Math.min(...counts);

    // Strategy Variables
    let velocity = 0;
    if (physicsBuffer.length === 14) velocity = physicsBuffer[13] - physicsBuffer[0];
    
    for (let i = 0; i <= 9; i++) {
        const pct = ((counts[i] / reefDigitWindow.length) * 100).toFixed(1);
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);

        if (label) {
            label.innerText = pct + "%";
            label.style.color = (counts[i] === max) ? "#4caf50" : (counts[i] === min) ? "#ff444f" : "#333";
        }
        if (bar) bar.style.height = pct + "%";
        if (box) {
            box.style.background = (i === activeDigit) ? "#000" : "#1a1a1a";
            box.style.borderColor = (i === activeDigit) ? "#fff" : "#333";
        }
    }
    
    runStrategy(velocity, counts, activeDigit);
}

function runStrategy(vel, counts, active) {
    let alert = document.getElementById('signal-alert');
    let mom = document.getElementById('momentum-text');
    let signal = "ANALYZING...";
    let color = "#00f2fe";

    mom.innerText = `MOMENTUM: ${vel > 0 ? 'BULLISH' : 'BEARISH'}`;

    if (currentMode === 'even_odd') {
        const even = counts[0]+counts[2]+counts[4]+counts[6]+counts[8];
        if (even > 55 && active % 2 === 0) { signal = "SIGNAL: EVEN"; color = "#4caf50"; }
        else if ((100-even) > 55 && active % 2 !== 0) { signal = "SIGNAL: ODD"; color = "#ff444f"; }
    } else if (currentMode === 'over_under') {
        const over = counts[6]+counts[7]+counts[8]+counts[9];
        if (over > 45 && vel > 0) { signal = "SIGNAL: OVER"; color = "#4caf50"; }
    }
    
    alert.innerText = signal;
    alert.style.color = color;
}

window.closeModal = function() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
};

connect();
