// Zion Master Engine - GUARANTEED CONNECTION VERSION
const APP_ID = 1089;
let socket;
let allAssets = [];
let digitHistory = Array(10).fill(0);
let totalTicks = 0;

function connect() {
    socket = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${APP_ID}`);

    socket.onopen = () => {
        console.log("FORCE HANDSHAKE: SENDING COMMAND...");
        socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    };

    socket.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        
        // If we get symbols, the handshake is officially SUCCESSFUL
        if (data.active_symbols) {
            allAssets = data.active_symbols;
            renderCategories(); 
        }

        if (data.tick) {
            updateLiveUI(data.tick);
            trackDigits(data.tick);
        }
    };

    // If the connection drops or fails, RESTART IMMEDIATELY
    socket.onclose = () => {
        console.log("Handshake Lost. Re-establishing...");
        setTimeout(connect, 1000);
    };
}

// THE "ANTI-TIRING" FAILSAFE
// If 3 seconds pass and we are still on the "Establishing" screen, FORCE RESTART
setInterval(() => {
    const isStillLoading = document.querySelector('.init-msg');
    if (isStillLoading && allAssets.length === 0) {
        console.log("Handshake hung. Forcing Reset...");
        if(socket) socket.close();
        connect();
    }
}, 3000);

function renderCategories() {
    const grid = document.getElementById('display-grid');
    grid.innerHTML = ''; // This kills the "Establishing..." message
    document.getElementById('back-btn').style.display = 'none';

    const groups = [...new Set(allAssets.map(a => a.market_display_name))];
    groups.forEach(groupName => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h4>MARKET HUB</h4><h2>${groupName.toUpperCase()}</h2>`;
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
            <div class="strategy-switcher">
                <button class="mode-btn" onclick="openStrategy('CHART', '${asset.symbol}')">RISE/FALL</button>
                <button class="mode-btn alt" onclick="openStrategy('DIGIT', '${asset.symbol}')">DIGIT %</button>
            </div>
        `;
        grid.appendChild(card);
        socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
    });
}

function openStrategy(mode, symbol) {
    const overlay = document.getElementById('strategy-overlay');
    const chartView = document.getElementById('chart-view');
    const digitHub = document.getElementById('digit-hub');
    overlay.style.display = 'block';
    
    if (mode === 'CHART') {
        digitHub.style.display = 'none';
        chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2.1.0/main.html?symbol=${symbol}&theme=dark" style="width:100%; height:100%; border:none;"></iframe>`;
    } else {
        digitHub.style.display = 'block';
        chartView.innerHTML = `<iframe src="https://app.deriv.com/trader?chart_type=candle&symbol=${symbol}&theme=dark" style="width:100%; height:80%; border:none;"></iframe>`;
        renderDigits();
    }
}

function trackDigits(tick) {
    const lastDigit = parseInt(tick.quote.toString().slice(-1));
    digitHistory[lastDigit]++;
    totalTicks++;
    if (document.getElementById('digit-hub').style.display === 'block') renderDigits();
}

function renderDigits() {
    const bars = document.getElementById('digit-bars');
    bars.innerHTML = '';
    digitHistory.forEach((count, i) => {
        const pct = totalTicks > 0 ? ((count / totalTicks) * 100).toFixed(1) : 0;
        bars.innerHTML += `<div class="digit-box ${pct > 12 ? 'hot' : ''}"><b>${i}</b><br>${pct}%</div>`;
    });
}

function updateLiveUI(tick) {
    const priceEl = document.getElementById(`price-${tick.symbol.replace(/\./g, '_')}`);
    if (priceEl) priceEl.innerText = tick.quote;
}

function closeStrategy() {
    document.getElementById('strategy-overlay').style.display = 'none';
}

// START ENGINE
connect();
