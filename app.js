/* Zion Trading Lab - Pro Sync Logic */

const APP_ID = 126973; 
const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
const api = new DerivAPIBasic({ connection: socket });

// 1. Automatic Handshake: Starts only when line is fully open
api.onOpen().subscribe(() => {
    document.getElementById('connection-status').innerText = "● Zion Trading Lab Active";
    document.getElementById('connection-status').classList.add('online');
    
    // Trigger the "Single Command" to read everything
    readEverything();
});

// 2. Platform Update Listener: Detects new assets or maintenance automatically
api.websiteStatus().subscribe(status => {
    if (status.msg_type === 'website_status') {
        console.log("Platform Sync Refresh:", status.website_status.site_status);
        readEverything(); 
    }
});

async function readEverything() {
    try {
        const response = await api.active_symbols({ 
            active_symbols: 'brief', 
            product_type: 'basic' 
        });

        if (response.error) {
            handleSystemError(`Deriv Rejected: ${response.error.message}`);
            return;
        }

        buildAssetDisplay(response.active_symbols);

    } catch (err) {
        handleSystemError("Redirect URL Mismatch or Read Scope missing.");
    }
}

function buildAssetDisplay(allSymbols) {
    const grid = document.getElementById('indices-grid');
    const loader = document.getElementById('loader-area');
    
    // Automatically filter all synthetic markets
    const synthetics = allSymbols.filter(s => s.market === 'synthetic_index');
    
    if (synthetics.length === 0) {
        handleSystemError("No synthetic assets returned. Verify 'Read' scope at api.deriv.com.");
        return;
    }

    loader.classList.add('hidden');
    document.getElementById('debug-log').classList.add('hidden');

    grid.innerHTML = synthetics.map(s => `
        <div class="asset-card">
            <div class="asset-name">${s.display_name}</div>
            <div class="price" id="p-${s.symbol}">0.00</div>
        </div>
    `).join('');

    // 3. Live Mirroring: Link every detected asset to real-time price feeds
    synthetics.forEach(s => {
        api.ticks(s.symbol).subscribe(tick => {
            const priceDiv = document.getElementById(`p-${s.symbol}`);
            if (priceDiv) priceDiv.innerText = tick.tick.quote;
        });
    });
}

function handleSystemError(text) {
    document.getElementById('loader-area').classList.add('hidden');
    const log = document.getElementById('debug-log');
    log.classList.remove('hidden');
    document.getElementById('error-msg').innerText = text;
}
