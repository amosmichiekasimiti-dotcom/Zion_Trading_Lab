let allSymbols = [];
const app_id = 1089; 
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=' + app_id);

// 1. Connection logic
ws.onopen = () => {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.innerHTML = '<span style="color: green;">● System Live</span>';
    }
    // Request all symbols from Deriv
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

// 2. Data handling logic
ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) {
        allSymbols = data.active_symbols;
        filterMarket('synthetic_index'); // Show Derived by default on load
    }
};

// 3. Filtering logic for Tabs
function filterMarket(category, element) {
    // Update active tab UI colors
    if (element) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    }

    const tableBody = document.getElementById('market-list');
    if (!tableBody) return;
    
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
                <td>
                    <button onclick="viewMarket('${symbol.display_name}', '${symbol.symbol}', '${symbol.market}')" 
                            style="cursor:pointer; border:1px solid #ddd; padding:5px 10px; border-radius:4px;">
                        View
                    </button>
                </td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}

// 4. Modal View logic
function viewMarket(name, symbol, marketType) {
    const modal = document.getElementById('marketModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');

    if (modal && title && content) {
        title.innerText = name;
        
        // This embeds the chart in an iframe so you stay on your page
        content.innerHTML = `
            <div style="background:#f9f9f9; padding:10px; border-radius:8px; text-align:center;">
                <p style="color:#666; margin:0;">Current Price</p>
                <h1 id="live-price" style="font-size:2.5rem; margin:5px 0; font-family:monospace;">---</h1>
                <div id="price-direction" style="font-weight:bold; margin-bottom:10px;">Connecting...</div>
                
                <div id="chart-container" style="width:100%; height:350px; border-top:1px solid #eee; padding-top:10px;">
                    <iframe 
                        src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        scrolling="no">
                    </iframe>
                </div>
            </div>
        `;
        
        modal.style.display = "block";

        // Start live ticker feed from Deriv API
        if (typeof activeTickSubscription !== 'undefined' && activeTickSubscription) {
            ws.send(JSON.stringify({ "forget": activeTickSubscription }));
        }
        ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    }
}

        // Logic to start the live feed from Deriv API
        if (typeof activeTickSubscription !== 'undefined' && activeTickSubscription) {
            ws.send(JSON.stringify({ "forget": activeTickSubscription }));
        }
        ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    }
}


// 5. Modal Close logic
function closeModal() {
    const modal = document.getElementById('marketModal');
    if (modal) {
        modal.style.display = "none";
    }
}
