/* Zion Trading Lab - Automated Mirror Engine */

const APP_ID = 126973; // Your specific App ID
const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
const api = new DerivAPIBasic({ connection: socket });

// 1. Handshake Listener: Fires the moment connection is ready
api.onOpen().subscribe(() => {
    const statusBadge = document.getElementById('connection-status');
    statusBadge.innerText = "● Connected to Deriv (Zion Active)";
    statusBadge.classList.add('online');
    
    // Immediately ask the server for every asset
    fetchAssets();
});

async function fetchAssets() {
    try {
        // Request "active_symbols" - the master list of all markets
        const response = await api.active_symbols({ 
            active_symbols: 'brief', 
            product_type: 'basic' 
        });

        // Error Handling: If Deriv sends an error, display it in the Lab
        if (response.error) {
            showError(`Server Error: ${response.error.message}`);
            return;
        }

        renderDisplay(response.active_symbols);

    } catch (err) {
        showError(`Network Error: Check your internet or Redirect URL settings.`);
    }
}

function renderDisplay(allSymbols) {
    const grid = document.getElementById('indices-grid');
    const loader = document.getElementById('loader-area');
    
    // Filter strictly for Synthetic (Derived) Indices
    const targets = allSymbols.filter(s => s.market === 'synthetic_index');
    
    if (targets.length === 0) {
        showError("No synthetic assets found. Ensure App ID 126973 has 'Read' scope enabled.");
        return;
    }

    loader.classList.add('hidden');
    grid.innerHTML = targets.map(s => `
        <div class="asset-card" id="card-${s.symbol}">
            <div class="asset-name">${s.display_name}</div>
            <div class="price" id="price-${s.symbol}">0.0000</div>
        </div>
    `).join('');

    // 2. Automated Streaming: Subscribe to live price for every detected asset
    targets.forEach(s => {
        api.ticks(s.symbol).subscribe(tickData => {
            const el = document.getElementById(`price-${s.symbol}`);
            if (el) el.innerText = tickData.tick.quote;
        });
    });
}

function showError(text) {
    document.getElementById('loader-area').classList.add('hidden');
    const log = document.getElementById('debug-log');
    const msg = document.getElementById('error-msg');
    log.classList.remove('hidden');
    msg.innerText = text;
}
