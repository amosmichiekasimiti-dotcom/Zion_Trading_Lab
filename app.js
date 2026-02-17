let ws;
let allSymbols = [];

// THE SINGLE MASTER COMMAND
function initializeUniversalScavenger() {
    const token = document.getElementById('apiToken').value;
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    ws.onopen = () => {
        ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        if (data.msg_type === 'authorize') {
            // SCAVENGE EVERYTHING: Ask for all symbols
            ws.send(JSON.stringify({ active_symbols: "brief", product_type: "basic" }));
        }

        if (data.active_symbols) {
            allSymbols = data.active_symbols;
            renderScavengerUI();
        }

        if (data.contracts_for) {
            renderTradePanel(data.contracts_for);
        }

        if (data.tick) {
            updateLiveTick(data.tick);
        }
    };
}

function renderScavengerUI() {
    const grid = document.getElementById('discovery-wall');
    grid.innerHTML = '';

    // Grouping by Market automatically
    const markets = [...new Set(allSymbols.map(s => s.market_display_name))];
    
    markets.forEach(mName => {
        const marketAssets = allSymbols.filter(s => s.market_display_name === mName);
        
        marketAssets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'asset-card';
            card.innerHTML = `
                <div style="font-size:10px; opacity:0.5">${asset.submarket_display_name}</div>
                <div style="font-weight:bold">${asset.display_name}</div>
                <div class="price-box" id="price-${asset.symbol.replace(/\./g, '_')}">---</div>
                <button onclick="scavengeAsset('${asset.symbol}', '${asset.display_name}')" class="scavenged-btn">SCAVENGE ASSET</button>
            `;
            grid.appendChild(card);
            ws.send(JSON.stringify({ ticks: asset.symbol, subscribe: 1 }));
        });
    });
}

function scavengeAsset(symbol, name) {
    document.getElementById('analysis-overlay').style.display = 'block';
    document.getElementById('active-asset-name').innerText = `SCAVENGER ANALYZING: ${name}`;
    
    // Command to discover what trades are available for THIS specific asset
    ws.send(JSON.stringify({ contracts_for: symbol }));
    
    // Initialize Professional Chart
    document.getElementById('universal-chart').innerHTML = `
        <iframe src="https://charts.deriv.com/deriv?symbol=${symbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>
    `;
}

function renderTradePanel(data) {
    const container = document.getElementById('dynamic-trade-container');
    container.innerHTML = '';
    const tradeRow = document.createElement('div');
    tradeRow.className = 'trade-row';

    // SCAVENGE CONTRACTS: Automatically create buttons for available trade types
    const types = [...new Set(data.available.map(c => c.contract_category_display))];
    
    types.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'scavenged-btn';
        btn.innerText = type.toUpperCase();
        btn.onclick = () => alert(`Opening ${type} interface for ${data.contracts_for.symbol}`);
        tradeRow.appendChild(btn);
    });

    container.appendChild(tradeRow);
}

function updateLiveTick(tick) {
    const el = document.getElementById(`price-${tick.symbol.replace(/\./g, '_')}`);
    if (el) el.innerText = tick.quote;
}

function closeAnalysis() {
    document.getElementById('analysis-overlay').style.display = 'none';
}
