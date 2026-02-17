/* Zion Trading Lab - Automated Platform Mirror */

const APP_ID = 126973; 
const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
const api = new DerivAPIBasic({ connection: socket });

// 1. Handshake: Trigger 'Read Everything' only when the line is open
api.onOpen().subscribe(() => {
    const badge = document.getElementById('connection-status');
    badge.innerText = "● Zion Hub Connected";
    badge.classList.add('online');
    
    // Command to automatically detect all assets
    autoSynchronize();
});

// 2. Real-time Platform Guard: Watch for new index releases
api.websiteStatus().subscribe(status => {
    if (status.msg_type === 'website_status') {
        console.log("Deriv Platform Update:", status.website_status.site_status);
        autoSynchronize(); // Refresh grid if platform data changes
    }
});

async function autoSynchronize() {
    try {
        const response = await api.active_symbols({ 
            active_symbols: 'brief', 
            product_type: 'basic' 
        });

        // 3. LEGITIMATE ERROR CHECKING
        // If your App ID permissions are wrong, the server will tell us here
        if (response.error) {
            displaySystemError(`Deriv Server Error: ${response.error.message} (${response.error.code})`);
            return;
        }

        buildDashboard(response.active_symbols);

    } catch (err) {
        displaySystemError("Connectivity Block: Verify Redirect URL settings at api.deriv.com");
    }
}

function buildDashboard(allSymbols) {
    const grid = document.getElementById('indices-grid');
    const loader = document.getElementById('loader-area');
    
    // Auto-detect all markets under the 'Synthetic Index' family
    const synthetics = allSymbols.filter(s => s.market === 'synthetic_index');
    
    if (synthetics.length === 0) {
        displaySystemError("No Synthetic Assets Found. Ensure 'Read' scope is checked for App 126973.");
        return;
    }

    // Clear loader and reveal grid
    loader.classList.add('hidden');
    document.getElementById('debug-log').classList.add('hidden');

    grid.innerHTML = synthetics.map(s => `
        <div class="asset-card" id="card-${s.symbol}">
            <div class="asset-name">${s.display_name}</div>
            <div class="price" id="p-${s.symbol}">0.00</div>
        </div>
    `).join('');

    // 4. Live Data Mirroring: Map every asset to a live price feed
    synthetics.forEach(s => {
        api.ticks(s.symbol).subscribe(tick => {
            const priceDiv = document.getElementById(`p-${s.symbol}`);
            if (priceDiv) priceDiv.innerText = tick.tick.quote;
        });
    });
}

function displaySystemError(text) {
    document.getElementById('loader-area').classList.add('hidden');
    const log = document.getElementById('debug-log');
    log.classList.remove('hidden');
    document.getElementById('error-msg').innerText = text;
}
