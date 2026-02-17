let ws;
let allSymbols = [];
let activeSub = null;
let currentCategory = 'volatility';
let reefDigitWindow = []; 
let physicsBuffer = [];

function connect() {
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    ws.onopen = () => {
        document.getElementById('status').innerText = '● LIVE CONNECTED';
        document.getElementById('status').style.color = '#4caf50';
        // Request symbols immediately on connect
        ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        
        if (data.active_symbols) {
            allSymbols = data.active_symbols;
            loadCategory(currentCategory); 
        }

        if (data.tick) {
            const priceStr = data.tick.quote.toFixed(data.tick.pip_size);
            const digit = parseInt(priceStr.slice(-1));
            
            // Maintain stable 100-tick window for realistic stats
            reefDigitWindow.push(digit);
            if(reefDigitWindow.length > 100) reefDigitWindow.shift();
            
            physicsBuffer.push(data.tick.quote);
            if(physicsBuffer.length > 15) physicsBuffer.shift();

            updateUI(priceStr, digit);
        }
    };

    ws.onclose = () => {
        document.getElementById('status').innerText = '● RECONNECTING...';
        document.getElementById('status').style.color = '#ff444f';
        setTimeout(connect, 3000); // Reconnect loop
    };
}

// Keep connection alive every 30 seconds
setInterval(() => {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ping: 1}));
}, 30000);

window.loadCategory = function(cat, el) {
    currentCategory = cat;
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    
    const filtered = allSymbols.filter(s => {
        const name = s.display_name.toLowerCase();
        const market = s.market.toLowerCase();
        if (cat === 'volatility') return market === 'synthetic_index' && !name.includes('jump') && !name.includes('crash') && !name.includes('step');
        if (cat === 'crashboom') return name.includes('crash') || name.includes('boom');
        if (cat === 'jump') return name.includes('jump');
        if (cat === 'range') return name.includes('range') || name.includes('step');
        if (cat === 'forex') return market === 'forex';
        return false;
    });

    filtered.forEach(s => {
        list.innerHTML += `<tr><td>${s.display_name}</td><td>${s.symbol}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td></tr>`;
    });
};

window.openAnalysis = function(name, symbol) {
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    
    document.getElementById('chart-container').innerHTML = 
        `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
};

function updateUI(str, digit) {
    document.getElementById('live-price').innerHTML = `${str.slice(0, -1)}<span>${digit}</span>`;
    
    let vel = physicsBuffer[physicsBuffer.length-1] - physicsBuffer[0];
    const box = document.getElementById('signal-box');
    box.innerText = vel > 0 ? "BULLISH ↑" : "BEARISH ↓";
    box.style.color = vel > 0 ? "#4caf50" : "#ff444f";
}

window.closeModal = function() {
    document.getElementById('modal').style.display = 'none';
};

connect();
