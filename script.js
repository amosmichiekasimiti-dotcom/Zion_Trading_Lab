// Zion Trading Lab - Professional Dashboard Logic
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeTickSubscription = null;

// Initialize Dashboard on Load
ws.onopen = () => {
    console.log("Connected to Deriv Server");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

// Handle Incoming Data
ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) {
        displayMarkets(data.active_symbols);
    }

    if (data.tick) {
        updateLivePrice(data.tick);
    }
};

// Display the Market Table
function displayMarkets(symbols) {
    const tableBody = document.querySelector('#market-table tbody');
    tableBody.innerHTML = ''; // Clear loading state

    symbols.forEach(symbol => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${symbol.display_name}</td>
            <td>${symbol.symbol.toUpperCase()}</td>
            <td><span class="status-online">Live</span></td>
            <td><button class="view-btn" onclick="viewMarket('${symbol.display_name}', '${symbol.symbol}', '${symbol.market}')">View Analysis</button></td>
        `;
        tableBody.appendChild(row);
    });
}

// Open Modal with Live Chart and Price
function viewMarket(name, symbol, marketType) {
    const modal = document.getElementById('marketModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');

    if (modal && title && content) {
        title.innerText = name;
        
        // This embeds the chart in an iframe so you STAY on your page
        content.innerHTML = `
            <div style="background:#f9f9f9; padding:15px; border-radius:8px; text-align:center;">
                <p style="color:#666; margin:0;">Current Market Price</p>
                <h1 id="live-price" style="font-size:2.8rem; margin:10px 0; font-family:monospace; color:#333;">---</h1>
                <div id="price-direction" style="font-weight:bold; margin-bottom:15px; font-size:1.1rem;">Connecting to Stream...</div>
                
                <div id="chart-container" style="width:100%; height:400px; border-top:1px solid #ddd; padding-top:15px; margin-top:10px;">
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

        // Handle Subscriptions for Live Ticks
        if (activeTickSubscription) {
            ws.send(JSON.stringify({ "forget": activeTickSubscription }));
        }
        ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    }
}

// Update the Ticking Price in the UI
function updateLivePrice(tick) {
    const priceElement = document.getElementById('live-price');
    const directionElement = document.getElementById('price-direction');
    
    if (priceElement) {
        const currentPrice = tick.quote;
        activeTickSubscription = tick.id; // Save subscription ID to stop it later

        // Simple visual feedback for price movement
        const oldPrice = parseFloat(priceElement.innerText);
        if (!isNaN(oldPrice)) {
            if (currentPrice > oldPrice) {
                directionElement.innerText = "▲ UP";
                directionElement.style.color = "green";
            } else if (currentPrice < oldPrice) {
                directionElement.innerText = "▼ DOWN";
                directionElement.style.color = "red";
            }
        }
        
        priceElement.innerText = currentPrice;
    }
}

// Close Modal Function
function closeModal() {
    const modal = document.getElementById('marketModal');
    if (modal) {
        modal.style.display = "none";
        // Stop the price feed when closing to save data
        if (activeTickSubscription) {
            ws.send(JSON.stringify({ "forget": activeTickSubscription }));
            activeTickSubscription = null;
        }
    }
}

// Close modal if user clicks outside of it
window.onclick = function(event) {
    const modal = document.getElementById('marketModal');
    if (event.target == modal) {
        closeModal();
    }
}
