/**
 * Zion Trading Lab - Professional Dashboard Logic
 * Powered by Deriv API
 */

// Configuration
const APP_ID = '1089'; // Default test ID. Replace with your own from api.deriv.com
const SOCKET_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

let ws;
let activeTickSubscription = null;
let allSymbols = [];

/**
 * 1. INITIALIZE CONNECTION
 */
function initConnection() {
    ws = new WebSocket(SOCKET_URL);

    ws.onopen = () => {
        console.log("Connected to Deriv API");
        updateStatus(true);
        
        // Request all active symbols immediately
        ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
        
        // Start Heartbeat: Send a ping every 30 seconds to prevent timeout
        // Sessions time out after 2 minutes of inactivity.
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ ping: 1 }));
            }
        }, 30000); 
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        // Handle Symbol List
        if (data.active_symbols) {
            allSymbols = data.active_symbols;
            filterMarkets('derived'); // Default view
        }

        // Handle Live Tick Updates
        if (data.tick) {
            updateLivePriceDisplay(data.tick);
        }
        
        // Log errors if any
        if (data.error) {
            console.error("API Error:", data.error.message);
        }
    };

    ws.onclose = () => {
        console.log("Connection lost. Retrying in 5 seconds...");
        updateStatus(false);
        setTimeout(initConnection, 5000); // Auto-reconnect
    };

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };
}

/**
 * 2. DASHBOARD UI LOGIC
 */
function updateStatus(isOnline) {
    const statusDot = document.querySelector('.status-dot') || document.createElement('span');
    const statusText = document.getElementById('connection-status') || { innerText: "" };
    
    if (isOnline) {
        statusText.innerText = "● Connected";
        statusText.style.color = "#4CAF50";
    } else {
        statusText.innerText = "○ Connecting...";
        statusText.style.color = "#f44336";
    }
}

function filterMarkets(category) {
    const tableBody = document.querySelector('#market-table tbody');
    if (!tableBody) return;

    // Map your tabs to Deriv market types
    const filtered = allSymbols.filter(s => {
        if (category === 'derived') return s.market === 'synthetic_index' || s.market === 'basket_index';
        if (category === 'forex') return s.market === 'forex';
        if (category === 'crypto') return s.market === 'cryptocurrency';
        return false;
    });

    tableBody.innerHTML = ''; // Clear table
    filtered.forEach(symbol => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${symbol.display_name}</td>
            <td>${symbol.symbol.toUpperCase()}</td>
            <td><span class="status-online">Live</span></td>
            <td><button class="view-btn" onclick="viewMarket('${symbol.display_name}', '${symbol.symbol}')">View Analysis</button></td>
        `;
        tableBody.appendChild(row);
    });

    // Update active tab UI
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event?.target?.classList?.add('active');
}

/**
 * 3. MODAL & CHARTING LOGIC
 */
function viewMarket(name, symbol) {
    const modal = document.getElementById('marketModal');
    const content = document.getElementById('modalContent');
    const title = document.getElementById('modalTitle');

    if (modal && content) {
        title.innerText = name;
        
        // Show embedded chart from TradingView/Deriv
        content.innerHTML = `
            <div class="analysis-container">
                <div class="price-header">
                    <p>Current Price</p>
                    <h1 id="live-price">---</h1>
                    <div id="price-direction">Checking stream...</div>
                </div>
                <div class="chart-wrapper" style="height: 400px; margin-top: 15px;">
                    <iframe 
                        src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=light" 
                        width="100%" height="100%" frameborder="0">
                    </iframe>
                </div>
            </div>
        `;
        modal.style.display = "block";

        // Subscribe to live ticks for this specific symbol
        if (activeTickSubscription) {
            ws.send(JSON.stringify({ "forget": activeTickSubscription }));
        }
        ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    }
}

function updateLivePriceDisplay(tick) {
    const priceEl = document.getElementById('live-price');
    const dirEl = document.getElementById('price-direction');
    
    if (priceEl) {
        const oldPrice = parseFloat(priceEl.innerText);
        const newPrice = tick.quote;
        activeTickSubscription = tick.id; // Store for "forget" call later

        if (!isNaN(oldPrice)) {
            priceEl.style.color = newPrice > oldPrice ? "#4CAF50" : "#f44336";
            dirEl.innerText = newPrice > oldPrice ? "▲ UP" : "▼ DOWN";
            dirEl.style.color = priceEl.style.color;
        }
        priceEl.innerText = newPrice;
    }
}

function closeModal() {
    document.getElementById('marketModal').style.display = "none";
    // Important: Stop the data stream to save resources
    if (activeTickSubscription) {
        ws.send(JSON.stringify({ "forget": activeTickSubscription }));
        activeTickSubscription = null;
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('marketModal');
    if (event.target == modal) closeModal();
};

// Launch
initConnection();
