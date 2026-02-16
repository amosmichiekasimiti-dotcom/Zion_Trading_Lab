const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allMarkets = [];

// 1. Establish Handshake
socket.onopen = () => {
    document.getElementById('connection-status').innerText = "Handshake Active";
    document.getElementById('connection-status').className = "status-online";
    
    // Request EVERYTHING from Deriv
    socket.send(JSON.stringify({
        "active_symbols": "full",
        "product_type": "basic"
    }));
};

// 2. Process Everything Received
socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.msg_type === 'active_symbols') {
        allMarkets = data.active_symbols;
        renderMarkets(allMarkets);
    }
};

// 3. Render Symbols Systematically
function renderMarkets(list) {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = '';

    list.forEach(m => {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.innerHTML = `
            <span class="category">${m.market_display_name}</span>
            <h3>${m.display_name}</h3>
            <span class="symbol">${m.symbol}</span>
        `;
        grid.appendChild(card);
    });
}

// 4. Filter Logic
function filterType(type) {
    document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (type === 'all') {
        renderMarkets(allMarkets);
    } else {
        const filtered = allMarkets.filter(m => m.market === type);
        renderMarkets(filtered);
    }
}

// 5. Keep-Alive Handshake
setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ "ping": 1 }));
    }
}, 30000);
