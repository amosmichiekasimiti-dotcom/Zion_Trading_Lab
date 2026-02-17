// Zion Master Engine - Self-Healing Handshake
const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allAssets = [];
let digitHistory = Array(10).fill(0);
let tickCount = 0;

// FORCED KICKSTART
socket.onopen = () => {
    console.log("Master Handshake Initialized.");
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) {
        allAssets = data.active_symbols;
        renderCategories(); // Wipes out the "Establishing Handshake" message
    }

    if (data.tick) {
        updateLivePrice(data.tick);
        trackDigits(data.tick);
    }
};

function renderCategories() {
    const grid = document.getElementById('display-grid');
    grid.innerHTML = ''; // Clears the hang message
    document.getElementById('back-btn').style.display = 'none';

    // Grouping by Market Type
    const groups = [...new Set(allAssets.map(a => a.market_display_name))];
    groups.forEach(groupName => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h4>GROUP</h4><h2>${groupName.toUpperCase()}</h2>`;
        card.onclick = () => renderGroupAssets(groupName);
        grid.appendChild(card);
    });
}

function renderGroupAssets(groupName) {
    const grid = document.getElementById('display-grid');
    grid.innerHTML = '';
    document.getElementById('back-btn').style.display = 'block';

    allAssets.filter(a => a.market_display_name === groupName).forEach(asset => {
        const safeId = asset.symbol.replace(/\./g, '_');
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${asset.submarket_display_name}</h4>
            <h3>${asset.display_name}</h3>
            <div class="price" id="price-${safeId}">---</div>
            <div class="strategy-bar">
                <button class="strat-btn" onclick="openStrategy('CANDLE', '${asset.symbol}')">RISE / FALL CHART</button>
                <button class="strat-btn alt" onclick="openStrategy('DIGIT', '${asset.symbol}')">DIGIT ANALYSIS</button>
            </div>
        `;
        grid.appendChild(card);
        socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
    });
}

// Strategy Switcher Logic
function openStrategy(mode, symbol) {
    const overlay = document.getElementById('strategy-overlay');
    const chartView = document.getElementById('chart-view');
    const digitHub = document.getElementById('digit-hub');
    overlay.style.display = 'block';
    
    if (mode === 'CANDLE') {
        digitHub.style.display = 'none';
        chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2.1.0/main.html?symbol=${symbol}&theme=dark" style="width:100%; height:100%; border:none;"></iframe>`;
    } else {
        digitHub.style.display = 'block';
        chartView.innerHTML = `<iframe src="https://app.deriv.com/trader?chart_type=candle&symbol=${symbol}&theme=dark" style="width:100%; height:80%; border:none;"></iframe>`;
        renderDigitStats();
    }
}

// Digit Competition Calculation (0-9)
function trackDigits(tick) {
    const lastDigit = parseInt(tick.quote.toString().slice(-1));
    digitHistory[lastDigit]++;
    tickCount++;
    if (document.getElementById('digit-hub').style.display === 'block') renderDigitStats();
}

function renderDigitStats() {
    const bars = document.getElementById('digit-bars');
    bars.innerHTML = '';
    digitHistory.forEach((count, i) => {
        const pct = tickCount > 0 ? ((count / tickCount) * 100).toFixed(1) : 0;
        bars.innerHTML += `<div class="digit-box ${pct > 12 ? 'hot' : ''}"><b>${i}</b><br>${pct}%</div>`;
    });
}

function updateLivePrice(tick) {
    const id = tick.symbol.replace(/\./g, '_');
    const priceEl = document.getElementById(`price-${id}`);
    if (priceEl) priceEl.innerText = tick.quote;
}

function closeStrategy() {
    document.getElementById('strategy-overlay').style.display = 'none';
    document.getElementById('chart-view').innerHTML = '';
}

// AUTO-RECOVERY: Retry if handshake is stuck for more than 3 seconds
setTimeout(() => {
    if (allAssets.length === 0) {
        socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    }
}, 3000);
