// Universal Master Engine - Automated Handshake
const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allAssets = [];

// 1. AUTOMATIC KICKSTART
socket.onopen = () => {
    console.log("Master Handshake Established.");
    requestData();
};

function requestData() {
    // THE SINGLE MASTER COMMAND
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
}

// 2. DATA PROCESSING
socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) {
        allAssets = data.active_symbols;
        renderCategories(); // This clears the "Establishing" message automatically
    }

    if (data.tick) {
        updateLivePrice(data.tick);
    }
};

// 3. AUTOMATIC UI RENDERING
function renderCategories() {
    const grid = document.getElementById('display-grid');
    if (!grid) return;
    
    grid.innerHTML = ''; // Removes "Establishing Master Handshake"
    
    // Intelligent Grouping
    const groups = [...new Set(allAssets.map(a => a.market_display_name))];

    groups.forEach(groupName => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>DATABASE GROUP</h4>
            <h2>${groupName.toUpperCase()}</h2>
            <p style="font-size:11px; color:#555; margin-top:10px;">Click to Extract</p>
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
    if (backBtn) backBtn.style.display = 'block';
    if (title) title.innerText = groupName.toUpperCase();

    const filtered = allAssets.filter(a => a.market_display_name === groupName);

    filtered.forEach(asset => {
        const safeId = asset.symbol.replace(/\./g, '_');
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>${asset.submarket_display_name}</h4>
            <h3>${asset.display_name}</h3>
            <div class="price" id="price-${safeId}">---</div>
            <div class="volatility-intel" id="vol-${safeId}">VOLATILITY: SCANNING...</div>
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
        volEl.innerText = `VOLATILITY: ${tick.id} (LIVE)`;
    }
}

// 4. AUTO-RECOVERY (If it stays stuck)
setTimeout(() => {
    if (allAssets.length === 0) {
        console.log("Retrying Handshake...");
        requestData();
    }
}, 3000);
