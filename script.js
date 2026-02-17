const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allAssets = [];

socket.onopen = () => {
    // THE SINGLE MASTER COMMAND
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
    const title = document.getElementById('hub-title');
    
    grid.innerHTML = '';
    backBtn.style.display = 'none';
    title.innerText = "DERIV MASTER HUB";

    // Auto-Group by Market Name (Forex, Derived, Crypto, etc.)
    const groups = [...new Set(allAssets.map(a => a.market_display_name))];

    groups.forEach(groupName => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>DATABASE GROUP</h4>
            <h2>${groupName.toUpperCase()}</h2>
            <p style="font-size:11px; color:#555; margin-top:10px;">Tap to extract all assets</p>
        `;
        card.onclick = () => renderGroupAssets(groupName);
        grid.appendChild(card);
    });
}

function renderGroupAssets(groupName) {
    const grid = document.getElementById('display-grid');
    const backBtn = document.getElementById('back-btn');
    const title = document.getElementById('hub-title');

    grid.innerHTML = '';
    backBtn.style.display = 'block';
    title.innerText = groupName.toUpperCase();

    const filtered = allAssets.filter(a => a.market_display_name === groupName);

    filtered.forEach(asset => {
        const safeId = asset.symbol.replace(/\./g, '_');
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${asset.submarket_display_name}</h4>
            <h3>${asset.display_name}</h3>
            <div class="price" id="price-${safeId}">---</div>
            <div class="volatility-intel" id="vol-${safeId}">VOLATILITY: ANALYZING...</div>
        `;
        grid.appendChild(card);
        
        // Subscribe to live volatility feed for the asset
        socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
    });
}

function updateLivePrice(tick) {
    const id = tick.symbol.replace(/\./g, '_');
    const priceEl = document.getElementById(`price-${id}`);
    const volEl = document.getElementById(`vol-${id}`);

    if (priceEl) {
        priceEl.innerText = tick.quote;
        // Instruction: Announce volatility movement
        volEl.innerText = `VOLATILITY: ${tick.id} (LIVE FEED)`;
    }
}
