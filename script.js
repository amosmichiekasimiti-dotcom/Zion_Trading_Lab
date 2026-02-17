const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allAssets = [];

socket.onopen = () => {
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) {
        allAssets = data.active_symbols;
        renderCategories();
    }
    if (data.tick) {
        updateLivePrice(data.tick);
    }
};

function renderCategories() {
    const grid = document.getElementById('display-grid');
    const backBtn = document.getElementById('back-btn');
    grid.innerHTML = '';
    backBtn.style.display = 'none';

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
    const backBtn = document.getElementById('back-btn');
    grid.innerHTML = '';
    backBtn.style.display = 'block';

    const filtered = allAssets.filter(a => a.market_display_name === groupName);
    filtered.forEach(asset => {
        const safeId = asset.symbol.replace(/\./g, '_');
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${asset.submarket_display_name}</h4>
            <h3>${asset.display_name}</h3>
            <div class="price" id="price-${safeId}">---</div>
            <div class="volatility-intel" id="vol-${safeId}">VOLATILITY: ANALYZING</div>
            <button class="chart-btn" onclick="openLiveChart('${asset.symbol}')">ANALYZE CHART</button>
        `;
        grid.appendChild(card);
        socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
    });
}

function updateLivePrice(tick) {
    const id = tick.symbol.replace(/\./g, '_');
    const priceEl = document.getElementById(`price-${id}`);
    const volEl = document.getElementById(`vol-${id}`);
    if (priceEl) {
        priceEl.innerText = tick.quote;
        volEl.innerText = `VOLATILITY: ${tick.id.slice(0, 8)} (LIVE)`;
    }
}

function openLiveChart(symbol) {
    // This URL opens the Professional Trader with Candlesticks and Indicator support
    const traderUrl = `https://app.deriv.com/trader?chart_type=candle&interval=1m&symbol=${symbol}`;
    window.open(traderUrl, '_blank');
}
