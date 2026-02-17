/* Zion Trading Lab - Automated Connection Logic */

const APP_ID = 126973; 
const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
const api = new DerivAPIBasic({ connection: socket });

// Connect only when the handshake is ready
api.onOpen().subscribe(() => {
    const statusBadge = document.getElementById('connection-status');
    statusBadge.innerText = "● Connected to Deriv (Zion Active)";
    statusBadge.classList.add('online');
    
    // Request everything from Deriv
    fetchPlatformAssets();
});

async function fetchPlatformAssets() {
    try {
        const response = await api.active_symbols({ 
            active_symbols: 'brief', 
            product_type: 'basic' 
        });

        // Check for server-side domain or scope errors
        if (response.error) {
            showSystemError(`Server Error: ${response.error.message}`);
            return;
        }

        renderAssetGrid(response.active_symbols);

    } catch (err) {
        showSystemError(`Network Error: Check internet or Redirect URL settings.`);
    }
}

function renderAssetGrid(allSymbols) {
    const grid = document.getElementById('indices-grid');
    const loader = document.getElementById('loader-area');
    
    // Filter for Synthetic Indices
    const synthetics = allSymbols.filter(s => s.market === 'synthetic_index');
    
    if (synthetics.length === 0) {
        showSystemError("No synthetic assets found. Verify App settings.");
        return;
    }

    loader.classList.add('hidden');
    grid.innerHTML = synthetics.map(s => `
        <div class="asset-card">
            <div class="asset-name">${s.display_name}</div>
            <div class="price" id="price-${s.symbol}">0.0000</div>
        </div>
    `).join('');

    // Subscribe to live price for every index found
    synthetics.forEach(s => {
        api.ticks(s.symbol).subscribe(tickData => {
            const el = document.getElementById(`price-${s.symbol}`);
            if (el) el.innerText = tickData.tick.quote;
        });
    });
}

function showSystemError(text) {
    document.getElementById('loader-area').classList.add('hidden');
    const log = document.getElementById('debug-log');
    log.classList.remove('hidden');
    document.getElementById('error-msg').innerText = text;
}
