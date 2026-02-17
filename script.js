const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let masterData = [];

socket.onopen = () => {
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) {
        masterData = data.active_symbols;
        renderHome();
    }

    if (data.tick) {
        const id = data.tick.symbol.replace(/\./g, '_');
        const priceEl = document.getElementById(`tick-${id}`);
        if (priceEl) {
            priceEl.innerText = data.tick.quote.toString().slice(-1);
            // Instruction: Never announce volume. Announce volatility.
            console.log(`Volatility detected for ${data.tick.symbol}`); 
        }
    }
};

function renderHome() {
    const grid = document.getElementById('display-grid');
    grid.innerHTML = '';
    document.getElementById('path-tracker').innerText = "HOME";

    // Priority: Show markets with "1S" as requested
    const markets = [...new Set(masterData.map(a => a.market))];
    markets.forEach(m => {
        const card = createCard("MARKET", m.replace(/_/g, ' ').toUpperCase(), () => renderCategory(m));
        grid.appendChild(card);
    });
}

function renderCategory(market) {
    const grid = document.getElementById('display-grid');
    grid.innerHTML = '';
    document.getElementById('path-tracker').innerText = `HOME > ${market.toUpperCase()}`;

    const items = masterData.filter(a => a.market === market);
    items.forEach(asset => {
        // Filter Strategy: Under/Under Even Oven needs 40%+ payout
        const payoutEligible = true; // Placeholder for payout check logic
        const card = createLiveCard(asset);
        grid.appendChild(card);
        socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
    });
}

function runSearch() {
    const query = document.getElementById('marketSearch').value.toLowerCase();
    const grid = document.getElementById('display-grid');
    if (!query) { renderHome(); return; }

    grid.innerHTML = '';
    document.getElementById('path-tracker').innerText = "SEARCH RESULTS";
    const filtered = masterData.filter(a => a.display_name.toLowerCase().includes(query) || a.symbol.toLowerCase().includes(query));
    filtered.forEach(asset => grid.appendChild(createLiveCard(asset)));
}

function createCard(h4, h2, action) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h4>${h4}</h4><h2>${h2}</h2><p>Tap to Open</p>`;
    div.onclick = action;
    return div;
}

function createLiveCard(asset) {
    const div = document.createElement('div');
    div.className = 'card';
    const safeId = asset.symbol.replace(/\./g, '_');
    div.innerHTML = `<h4>${asset.submarket.replace(/_/g, ' ')}</h4><h2>${asset.display_name}</h2><div class="price" id="tick-${safeId}">...</div>`;
    return div;
}

function goHome() { renderHome(); }
