let ws, activeSub = null, allSymbols = [], currentSymbol = '', currentMode = 'rise_fall';
let digitHistory = []; 

function initWS() {
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
    
    ws.onopen = () => {
        document.getElementById('status').innerText = '● LIVE CONNECTED';
        ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
        // Keep connection alive
        setInterval(() => { if(ws.readyState === 1) ws.send(JSON.stringify({ping: 1})); }, 30000);
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.active_symbols) { allSymbols = data.active_symbols; loadCategory('volatility'); }
        
        // Immediate digit population from history
        if (data.history) {
            digitHistory = data.history.prices.map(p => parseInt(p.toFixed(data.pip_size).slice(-1)));
            updateAnalysis();
        }

        if (data.tick) {
            const priceStr = data.tick.quote.toFixed(data.tick.pip_size);
            const digit = parseInt(priceStr.slice(-1));
            digitHistory.push(digit);
            if(digitHistory.length > 100) digitHistory.shift();
            updateAnalysis(priceStr, digit);
        }
    };
    ws.onclose = () => setTimeout(initWS, 3000);
}

window.loadCategory = function(cat, el) {
    if(el) { document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active')); el.classList.add('active'); }
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    allSymbols.filter(s => {
        const m = s.market.toLowerCase(); const n = s.display_name.toLowerCase();
        if (cat === 'volatility') return m === 'synthetic_index' && !n.includes('jump') && !n.includes('crash');
        if (cat === 'crashboom') return n.includes('crash') || n.includes('boom');
        if (cat === 'jump') return n.includes('jump');
        if (cat === 'range') return n.includes('range') || n.includes('step');
        if (cat === 'forex') return m === 'forex';
    }).forEach(s => {
        list.innerHTML += `<tr><td>${s.display_name}</td><td>${s.symbol}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td></tr>`;
    });
};

window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    // Fetch history for stable percentages
    ws.send(JSON.stringify({ "ticks_history": symbol, "count": 100, "end": "latest", "style": "ticks" }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    loadChart(symbol);
};

function loadChart(symbol) {
    // Full screen optimized chart
    document.getElementById('chart-container').innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
}

window.switchMode = function(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('digit-panel').style.display = (mode === 'rise_fall') ? 'none' : 'grid';
    updateAnalysis();
};

function updateAnalysis(priceStr, lastDigit) {
    if(priceStr) document.getElementById('live-price').innerHTML = `${priceStr.slice(0,-1)}<span>${lastDigit}</span>`;
    
    const counts = Array(10).fill(0);
    digitHistory.forEach(d => counts[d]++);
    
    // Restore Digit Grid
    const panel = document.getElementById('digit-panel');
    panel.innerHTML = counts.map((c, i) => `<div class="d-box"><div class="d-num">${i}</div><div class="d-pct">${((c/digitHistory.length)*100).toFixed(1)}%</div></div>`).join('');

    // Flickering-free Signal Logic
    let signal = "NEUTRAL", color = "#8e8e9e";
    if (currentMode === 'even_odd') {
        let evens = counts[0]+counts[2]+counts[4]+counts[6]+counts[8];
        signal = evens > 52 ? "EVEN ↑" : (evens < 48 ? "ODD ↓" : "NEUTRAL");
        color = evens > 52 ? "#4caf50" : (evens < 48 ? "#ff444f" : "#8e8e9e");
    } else {
        signal = "TRENDING ↑"; color = "#4caf50";
    }
    const box = document.getElementById('signal-box');
    box.innerText = signal; box.style.color = color;
}

window.closeModal = function() { document.getElementById('modal').style.display = 'none'; };
initWS();
