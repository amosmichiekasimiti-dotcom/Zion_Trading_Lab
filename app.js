/* Zion Trading Lab - Automated Connection Logic */

// REPLACE 1089 with your own unique App ID from api.deriv.com for faster priority
const APP_ID = 1089; 
const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
const api = new DerivAPIBasic({ connection });

// 1. "Single Command" Initialization - Waiting for the 'Open' state
api.onOpen().subscribe(() => {
    updateUIConnection(true);
    // Read everything on Deriv as soon as the line is open
    syncEverything();
});

// 2. Automate detection of NEW updates or maintenance
api.websiteStatus().subscribe(update => {
    if (update.msg_type === 'website_status') {
        const msg = `Platform Update: ${update.website_status.site_status}`;
        showNotification(msg);
        // Refresh symbols if a platform change is detected
        syncEverything();
    }
});

const syncEverything = async () => {
    try {
        // Fetch every active synthetic symbol
        const response = await api.active_symbols({ active_symbols: 'brief', product_type: 'basic' });
        renderAssets(response.active_symbols);
    } catch (error) {
        console.error("Discovery Error:", error);
    }
};

const renderAssets = (symbols) => {
    const container = document.getElementById('indices-grid');
    const synthetics = symbols.filter(s => s.market === 'synthetic_index');
    
    container.innerHTML = synthetics.map(s => `
        <div class="asset-card" id="card-${s.symbol}">
            <div class="asset-name">${s.display_name}</div>
            <div class="price" id="price-${s.symbol}">0.00</div>
            <div class="trend-indicator" id="trend-${s.symbol}">-</div>
        </div>
    `).join('');

    // Subscribe to live price ticks for every asset discovered
    synthetics.forEach(s => subscribeToPrice(s.symbol));
};

const subscribeToPrice = (symbol) => {
    api.ticks(symbol).subscribe(tickData => {
        const priceEl = document.getElementById(`price-${symbol}`);
        if (priceEl) {
            const oldPrice = parseFloat(priceEl.innerText);
            const newPrice = tickData.tick.quote;
            priceEl.innerText = newPrice;
            
            // Visual trend detection
            const card = document.getElementById(`card-${symbol}`);
            card.style.borderColor = newPrice > oldPrice? '#4caf50' : '#f44336';
        }
    });
};

// UI Helpers
function updateUIConnection(status) {
    const el = document.getElementById('connection-status');
    el.innerText = status? "● Connected to Deriv" : "Connecting...";
    el.className = status? "status-badge online" : "status-badge";
}

function showNotification(text) {
    const bar = document.getElementById('notification-bar');
    document.getElementById('update-msg').innerText = text;
    bar.classList.remove('hidden');
    setTimeout(() => bar.classList.add('hidden'), 5000);
}
