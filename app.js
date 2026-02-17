const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let masterData = [];
let currentPath = ["Home"];

socket.onopen = () => {
    // THE MASTER COMMAND: Pulls every single asset available on Deriv
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

socket.onmessage = (msg) => {
    const response = JSON.parse(msg.data);

    if (response.active_symbols) {
        masterData = response.active_symbols;
        renderLayer1(); // Group everything into top-level asset types
    }

    if (response.tick) {
        const id = response.tick.symbol.replace(/\./g, '_');
        const el = document.getElementById(`ticker-${id}`);
        if (el) el.innerText = response.tick.quote.toString().slice(-1);
    }
};

// LAYER 1: Group by Market (Forex, Synthetic, etc.)
function renderLayer1() {
    updateUI("Home", () => {
        const groups = [...new Set(masterData.map(a => a.market))];
        return groups.map(g => ({
            title: g.replace(/_/g, ' '),
            subtitle: "MARKET TYPE",
            action: () => renderLayer2(g)
        }));
    });
}

// LAYER 2: Group by Sub-Category (Major Pairs, Volatility Indices, etc.)
function renderLayer2(market) {
    currentPath.push(market.replace(/_/g, ' '));
    updateUI(currentPath.join(" > "), () => {
        const items = masterData.filter(a => a.market === market);
        const subGroups = [...new Set(items.map(a => a.submarket))];
        
        return subGroups.map(sg => ({
            title: sg.replace(/_/g, ' '),
            subtitle: "GROUP TYPE",
            action: () => renderLayer3(items.filter(a => a.submarket === sg))
        }));
    });
}

// LAYER 3: Show the individual pairs and start live digits
function renderLayer3(assets) {
    currentPath.push("Pairs");
    updateUI(currentPath.join(" > "), () => {
        return assets.map(asset => {
            // Subscribe to live feed for these specific assets
            socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
            
            const safeId = asset.symbol.replace(/\./g, '_');
            return {
                title: asset.display_name,
                subtitle: asset.symbol,
                content: `<div class="live-price" id="ticker-${safeId}">...</div>`,
                action: null
            };
        });
    });
}

function updateUI(pathText, getItems) {
    document.getElementById('path-tracker').innerText = pathText;
    const grid = document.getElementById('journey-grid');
    grid.innerHTML = '';
    
    getItems().forEach(item => {
        const card = document.createElement('div');
        card.className = 'discovery-card';
        card.innerHTML = `<h4>${item.subtitle}</h4><h2>${item.title}</h2>${item.content || ''}`;
        if (item.action) card.onclick = item.action;
        grid.appendChild(card);
    });
}

function resetToHome() {
    currentPath = ["Home"];
    renderLayer1();
}
