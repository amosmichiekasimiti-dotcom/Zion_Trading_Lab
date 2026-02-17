// Final Corrected script.js for Zion Trading Lab
const APP_ID = '1089'; 
const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${APP_ID}`);
let activeTickSubscription = null;
let allSymbols = [];

ws.onopen = () => {
    console.log("Connected to Deriv");
    // Request all symbols
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    
    // Heartbeat to keep connection alive
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 }));
    }, 30000);
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) {
        allSymbols = data.active_symbols;
        // Start with Derived tab
        filterMarkets('derived');
    }
    if (data.tick) updateLivePrice(data.tick);
};

// FIX: Updated filtering logic for Forex and Crypto
function filterMarkets(category) {
    const tableBody = document.querySelector('#market-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="4">Loading ' + category + '...</td></tr>';

    const filtered = allSymbols.filter(s => {
        // 'derived' covers Synthetic and Basket indices
        if (category === 'derived') return s.market === 'synthetic_index' || s.market === 'basket_index';
        // 'forex' covers major/minor pairs
        if (category === 'forex') return s.market === 'forex';
        // 'crypto' covers coins like BTC, ETH, etc.
        if (category === 'crypto') return s.market === 'cryptocurrency';
        return false;
    });

    tableBody.innerHTML = ''; 
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No markets found for this category.</td></tr>';
        return;
    }

    filtered.forEach(symbol => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${symbol.display_name}</td>
            <td>${symbol.symbol.toUpperCase()}</td>
            <td><span style="color:green;">● Live</span></td>
            <td><button onclick="viewMarket('${symbol.display_name}', '${symbol.symbol}')">View Analysis</button></td>
        `;
        tableBody.appendChild(row);
    });

    // Update Tab UI visually
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const clickedTab = Array.from(document.querySelectorAll('.tab')).find(t => t.innerText.toLowerCase().includes(category));
    if (clickedTab) clickedTab.classList.add('active');
}

function viewMarket(name, symbol) {
    const modal = document.getElementById('marketModal');
    const content = document.getElementById('modalContent');
    const title = document.getElementById('modalTitle');

    if (modal && content) {
        title.innerText = name;
        content.innerHTML = `
            <div style="text-align:center;">
                <p style="margin:0; color:#666;">Current Price</p>
                <h1 id="live-price" style="font-size:2.5rem; margin:10px 0;">---</h1>
                <div id="price-direction" style="font-weight:bold; margin-bottom:15px;">Connecting Stream...</div>
                <div style="width:100%; height:400px; border-top:1px solid #ddd; padding-top:10px;">
                    <iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>
                </div>
            </div>
        `;
        modal.style.display = "block";

        if (activeTickSubscription) ws.send(JSON.stringify({ "forget": activeTickSubscription }));
        ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    }
}

function updateLivePrice(tick) {
    const priceElement = document.getElementById('live-price');
    const direction = document.getElementById('price-direction');
    if (priceElement) {
        const oldPrice = parseFloat(priceElement.innerText);
        const newPrice = tick.quote;
        activeTickSubscription = tick.id;

        if (!isNaN(oldPrice)) {
            priceElement.style.color = newPrice > oldPrice ? "green" : "red";
            direction.innerText = newPrice > oldPrice ? "▲ UP" : "▼ DOWN";
            direction.style.color = priceElement.style.color;
        }
        priceElement.innerText = newPrice;
    }
}

function closeModal() {
    document.getElementById('marketModal').style.display = "none";
    if (activeTickSubscription) {
        ws.send(JSON.stringify({ "forget": activeTickSubscription }));
        activeTickSubscription = null;
    }
}
