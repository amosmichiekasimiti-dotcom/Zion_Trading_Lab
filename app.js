const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let currentFilter = 'all';

socket.onopen = () => {
    // SINGLE COMMAND: Pulls all active symbols from the server
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // 1. DISCOVERY: Find every market and subscribe automatically
    if (data.active_symbols) {
        data.active_symbols.forEach(asset => {
            socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
        });
    }

    // 2. LIVE DATA: Update cards when digits change
    if (data.tick) {
        updateCard(data.tick);
    }
};

function updateCard(tick) {
    const grid = document.getElementById('market-grid');
    let card = document.getElementById(tick.symbol);
    const digit = tick.quote.toString().slice(-1);

    if (!card) {
        card = document.createElement('div');
        card.className = 'market-card';
        card.id = tick.symbol;
        // In a real app, you'd match the 'market' property from active_symbols
        // Here we'll guess based on common symbol prefixes
        const category = tick.symbol.includes('frx') ? 'forex' : 'synthetic_index';
        card.setAttribute('data-category', category);
        grid.appendChild(card);
    }

    // Only show if it matches the current filter
    card.style.display = (currentFilter === 'all' || card.getAttribute('data-category') === currentFilter) ? 'block' : 'none';

    card.innerHTML = `
        <h4>ASSET</h4>
        <h2>${tick.symbol.replace(/_/g, ' ')}</h2>
        <div class="symbol-code">${tick.symbol}</div>
        <div class="price">${digit}</div>
    `;
}

function filterAssets(category) {
    currentFilter = category;
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const cards = document.querySelectorAll('.market-card');
    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
