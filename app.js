/**
 * MASTER COMMAND: initializePublicScavenger()
 * Uses Public App ID 1089 to scavenge live market data.
 * No API Token or Authorization required.
 */
let ws;
let allSymbols = [];
const PUBLIC_APP_ID = 1089;

function initializePublicScavenger() {
    // Connect using the standard public endpoint
    ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${PUBLIC_APP_ID}`);

    ws.onopen = () => {
        console.log("Connected to Public Deriv Stream...");
        // Command 1: Scavenge all available symbols (Publicly available)
        ws.send(JSON.stringify({ 
            "active_symbols": "brief", 
            "product_type": "basic" 
        }));
        
        // Command 2: Keep connection alive
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ ping: 1 }));
        }, 30000);
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        // Step 1: Filter and display all discovered Synthetic Assets
        if (data.active_symbols) {
            allSymbols = data.active_symbols.filter(s => s.market === 'synthetic_index');
            renderScavengerGrid();
        }

        // Step 2: Handle live price updates for all scavenged assets
        if (data.tick) {
            const priceEl = document.getElementById(`price-${data.tick.symbol.replace(/\./g, '_')}`);
            if (priceEl) {
                priceEl.innerText = data.tick.quote;
                // Add "Heartbeat" pulse effect
                priceEl.style.color = "#00ff88";
                setTimeout(() => priceEl.style.color = "", 100);
            }
        }
    };
}

function renderScavengerGrid() {
    const grid = document.getElementById('discovery-wall');
    grid.innerHTML = ''; // Clear previous

    allSymbols.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.innerHTML = `
            <div style="font-size:10px; color:#94a3b8;">${asset.submarket_display_name}</div>
            <div style="font-weight:900; letter-spacing:1px;">${asset.display_name}</div>
            <div class="price-box" id="price-${asset.symbol.replace(/\./g, '_')}">---</div>
            <button onclick="viewAnalysis('${asset.symbol}')" class="scavenged-btn">LIVE ANALYSIS</button>
        `;
        grid.appendChild(card);
        
        // Immediately start scavenging live ticks for this asset
        ws.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
    });
}

function viewAnalysis(symbol) {
    // Open the analysis panel and load the public TradingView chart
    document.getElementById('analysis-overlay').style.display = 'block';
    document.getElementById('universal-chart').innerHTML = `
        <iframe src="https://tradingview.binary.com/v2.1.0/main.html?symbol=${symbol}&theme=dark" 
                style="width:100%; height:100%; border:none;"></iframe>
    `;
}
