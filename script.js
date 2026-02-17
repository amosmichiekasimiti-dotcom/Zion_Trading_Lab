let ws;
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0;
let reefDigitWindow = [];
let physicsBuffer = [];

function initWS() {
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
    ws.onopen = () => {
        ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
        setInterval(() => { if(ws.readyState === 1) ws.send(JSON.stringify({ping:1})); }, 30000);
    };
    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.active_symbols) { 
            allSymbols = data.active_symbols; 
            loadCategory('volatility'); 
        }
        if (data.history) {
            reefDigitWindow = data.history.prices.map(p => parseInt(p.toFixed(data.pip_size).slice(-1)));
            render();
        }
        if (data.tick) {
            activeSub = data.tick.id;
            const price = data.tick.quote;
            const priceStr = price.toFixed(data.tick.pip_size);
            const digit = parseInt(priceStr.slice(-1));
            
            // Physics Momentum
            physicsBuffer.push(price); if(physicsBuffer.length > 14) physicsBuffer.shift();
            reefDigitWindow.push(digit); if(reefDigitWindow.length > 100) reefDigitWindow.shift();
            
            updateUI(priceStr, price, digit);
            render(digit);
        }
    };
    ws.onclose = () => setTimeout(initWS, 3000);
}

// MAKE THESE GLOBAL SO HTML BUTTONS CAN SEE THEM
window.loadCategory = function(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    const filtered = allSymbols.filter(s => {
        const d = s.display_name.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && !d.includes('jump');
        if (cat === 'crashboom') return d.includes('crash') || d.includes('boom');
        if (cat === 'forex') return s.market === 'forex';
        return d.includes(cat);
    });
    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
};

window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    switchContract('rise_fall', document.querySelector('.tab'));
    
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks_history": symbol, "count": 100, "end": "latest", "style": "ticks" }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
};

window.switchContract = function(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('digit-analysis-panel').style.display = (mode === 'rise_fall') ? 'none' : 'block';
    if(mode !== 'rise_fall') {
        const grid = document.getElementById('digit-grid');
        grid.innerHTML = '';
        for(let i=0; i<=9; i++) grid.innerHTML += `<div id="d-${i}" class="d-box"><div class="d-num">${i}</div><div id="bar-${i}" class="d-bar"></div></div>`;
    }
    document.getElementById('chart-container').innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
};

window.closeModal = function() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
};

function updateUI(str, val, digit) {
    const head = str.slice(0, -1);
    const color = val > lastPrice ? "#4caf50" : "#ff444f";
    lastPrice = val;
    document.getElementById('live-price').innerHTML = `${head}<span>${digit}</span>`;
    
    // Strategy Logic
    let vel = physicsBuffer.length === 14 ? physicsBuffer[13] - physicsBuffer[0] : 0;
    document.getElementById('signal-box').innerText = vel > 0 ? "MOMENTUM: BULLISH" : "MOMENTUM: BEARISH";
    document.getElementById('signal-box').style.color = vel > 0 ? "#4caf50" : "#ff444f";
}

function render(active) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    for (let i = 0; i <= 9; i++) {
        const bar = document.getElementById(`bar-${i}`);
        const box = document.getElementById(`d-${i}`);
        if (bar) bar.style.height = ((counts[i]/reefDigitWindow.length)*100) + "%";
        if (box) box.style.background = (i === active) ? "#000" : "#1a1a1a";
    }
}

initWS();
