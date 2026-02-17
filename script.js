// Full corrected script for Zion Trading Lab
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeTickSubscription = null;
let allSymbols = [];

// 1. Connection Logic
ws.onopen = () => {
    console.log("Connected to Deriv");
    // Request symbols immediately
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    
    // Heartbeat to prevent "Connecting..." freeze
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ping: 1 }));
        }
    }, 30000);
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) {
        allSymbols = data.active_symbols;
        // Default view: Derived
        filterMarkets('derived');
    }

    if (data.tick) {
        updateLivePrice(data.tick);
    }
};

ws.onclose = () => {
    console.log("Connection lost. Reloading...");
    setTimeout(() => location.reload(), 2000);
};

// 2. Tab & Filtering Logic
function filterMarkets(category) {
    const tableBody = document.querySelector('#market-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="4">Loading ' + category + '...</td></tr>';

    // Map categories to Deriv market types
    const filtered = allSymbols.filter(s => {
        if (category === 'derived') return s.market === 'synthetic_index' || s.market === 'basket_index';
        if (category === 'forex') return s.market === 'forex';
        if (category === 'crypto') return s.market === 'cryptocurrency';
        return false;
    });

    tableBody.innerHTML = ''; 
    filtered.forEach(symbol => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${symbol.display_name}</td>
            <td>${symbol.symbol.toUpperCase()}</td>
            <td><span style="color:green;">● Live</span></td>
            <td><button onclick="viewMarket('${symbol.display_name}', '${symbol.symbol}', '${symbol.market}')" 
                style="padding:5px 10px; cursor:pointer;">View Analysis</button></td>
        `;
        tableBody.appendChild(row);
    });

    // Update Tab UI
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    // Ensure your HTML tabs have onclick="filterMarkets('crypto')" etc.
}

// 3. Modal & Chart Logic
function viewMarket(name, symbol, marketType) {
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
                    <iframe 
                        src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" 
                        width="100%" height="100%" frameborder="0">
                    </iframe>
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
            direction.style.color = newPrice > oldPrice ? "green" : "red";
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
