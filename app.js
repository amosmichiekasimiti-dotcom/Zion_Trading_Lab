// Replace 1089 with your App ID from api.deriv.com
const app_id = 1089; 
const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);
const api = new DerivAPIBasic({ connection });

// 1. "Read Everything" - Fetch every asset automatically
const loadAllAssets = async () => {
    const response = await api.active_symbols({ active_symbols: 'brief', product_type: 'basic' });
    const container = document.getElementById('indices-grid');
    document.getElementById('loader').style.display = 'none';
    
    // Filter for synthetic indices and build the UI dynamically
    container.innerHTML = response.active_symbols
       .filter(symbol => symbol.market === 'synthetic_index')
       .map(s => `
            <div class="asset-card" id="${s.symbol}">
                <h4>${s.display_name}</h4>
                <p class="price" id="price-${s.symbol}">Loading price...</p>
            </div>
        `).join('');
        
    // 2. Start live price feeds for all detected assets
    response.active_symbols.forEach(s => subscribeToPrice(s.symbol));
};

// 3. "Auto-Update" - Listen for platform updates (New indices, maintenance, etc.)
api.websiteStatus().subscribe(update => {
    const statusText = document.getElementById('status-text');
    statusText.innerText = update.website_status.site_status |

| "Online";
    console.log("Deriv Update Detected:", update);
    // If a new update is detected, we can refresh the asset list
    if (update.msg_type === 'website_status') loadAllAssets();
});

const subscribeToPrice = (symbol) => {
    api.ticks(symbol).subscribe(tick => {
        const priceElement = document.getElementById(`price-${symbol}`);
        if (priceElement) priceElement.innerText = tick.tick.quote;
    });
};

// Open connection and launch discovery
api.onOpen().subscribe(() => {
    document.getElementById('connection-status').innerText = "Connected to Deriv";
    loadAllAssets();
});
