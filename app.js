const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allAssets = [];
let currentCategory = 'all';

socket.onopen = () => {
    // Single command to pull every available asset
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    
    // Keep connection alive
    setInterval(() => socket.send(JSON.stringify({ "ping": 1 })), 30000);
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Initial pull: Save all assets and start subscriptions
    if (data.active_symbols) {
        allAssets = data.active_symbols;
        displayMarkets(); // Show 'all' by default
        
        // Subscribe to live price updates for every asset pulled
        allAssets.forEach(asset => {
            socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
        });
    }

    // Live update: Update price on the correct card
    if (data.tick) {
        const priceTag = document.querySelector(`#card-${data.tick.symbol.replace(/\./g, '_')} .price`);
        if (priceTag) {
            priceTag.innerText = data.tick.quote.toString().slice(-1);
        }
    }
};

function displayMarkets() {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = ''; // Clear the grid for the new category

    const filtered = currentCategory === 'all' 
        ? allAssets 
        : allAssets.filter(a => a.market === currentCategory);

    filtered.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'market-card';
        // Use a safe ID for CSS/JS selection
        card.id = `card-${asset.symbol.replace(/\./g, '_')}`;
        card.innerHTML = `
            <h4>${asset.market.replace(/_/g, ' ')}</h4>
            <h2>${asset.display_name}</h2>
            <div class="symbol-code">${asset.symbol}</div>
            <div class="price">--</div>
        `;
        grid.appendChild(card);
    });
}

function filterAssets(category, element) {
    currentCategory = category;
    
    // UI: Update active button state
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    // Logic: Redraw grid with only the chosen assets
    displayMarkets();
}
