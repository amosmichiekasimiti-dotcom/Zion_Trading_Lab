let allSymbols = [];
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

ws.onopen = () => {
    document.getElementById('connection-status').innerHTML = '<span style="color: green;">● System Live</span>';
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) {
        allSymbols = data.active_symbols;
        filterMarket('synthetic_index'); // Show Derived by default
    }
};

function filterMarket(category, element) {
    // Update active tab UI
    if (element) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    }

    const tableBody = document.getElementById('market-list');
    tableBody.innerHTML = '';

    const filtered = allSymbols.filter(s => s.market === category);

    filtered.forEach(symbol => {
        const row = `
            <tr>
                <td><strong>${symbol.display_name}</strong></td>
                <td><code>${symbol.symbol}</code></td>
                <td>
                    <span class="status-pill ${symbol.exchange_is_open ? 'open' : 'closed'}">
                        ${symbol.exchange_is_open ? 'TRADE OPEN' : 'MARKET CLOSED'}
                    </span>
                </td>
                <td><button style="cursor:pointer; border:1px solid #ddd; padding:5px 10px; border-radius:4px;">View Chart</button></td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}
