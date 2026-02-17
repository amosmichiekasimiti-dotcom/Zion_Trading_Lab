const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allMarkets = [];
let isSearchActive = false;

socket.onopen = () => {
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) {
        allMarkets = data.active_symbols;
        showLevel1(); // Immediately show categories
    }

    if (data.tick) {
        const id = data.tick.symbol.replace(/\./g, '_');
        const priceElement = document.getElementById(`price-${id}`);
        if (priceElement) {
            priceElement.innerText = data.tick.quote.toString().slice(-1);
        }
    }
};

function showLevel1() {
    if (isSearchActive) return;
    const grid = document.getElementById('market-grid');
    grid.innerHTML = '';
    document.getElementById('path-tracker').innerText = "HOME";

    const markets = [...new Set(allMarkets.map(a => a.market))];
    markets.forEach(m => {
        const div = createCard("Market Type", m.replace(/_/g, ' ').toUpperCase(), () => showLevel2(m));
        grid.appendChild(div);
    });
}

function showLevel2(marketKey) {
    isSearchActive = false;
    const grid = document.getElementById('market-grid');
    grid.innerHTML = '';
    document.getElementById('path-tracker').innerText = `HOME > ${marketKey.toUpperCase()}`;

    const pairs = allMarkets.filter(a => a.market === marketKey);
    renderPairs(pairs, grid);
}

// SEARCH LOGIC: This filters the entire "Everything Pull" instantly
function handleSearch() {
    const query = document.getElementById('assetSearch').value.toLowerCase();
    const grid = document.getElementById('market-grid');
    
    if (query.length > 0) {
        isSearchActive = true;
        grid.innerHTML = '';
        document.getElementById('path-tracker').innerText = "SEARCH RESULTS";
        
        const filtered = allMarkets.filter(a => 
            a.display_name.toLowerCase().includes(query) || 
            a.symbol.toLowerCase().includes(query)
        );
        renderPairs(filtered, grid);
    } else {
        isSearchActive = false;
        showLevel1();
    }
}

function renderPairs(pairs, container) {
    pairs.forEach(p => {
        const safeId = p.symbol.replace(/\./g, '_');
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h4>${p.submarket.replace(/_/g, ' ')}</h4>
            <h2>${p.display_name}</h2>
            <div class="price" id="price-${safeId}">...</div>
        `;
        socket.send(JSON.stringify({ "ticks": p.symbol, "subscribe": 1 }));
        container.appendChild(div);
    });
}

function createCard(h4, h2, action) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h4>${h4}</h4><h2>${h2}</h2><p>Click to Explore</p>`;
    div.onclick = action;
    return div;
}

function resetJourney() {
    document.getElementById('assetSearch').value = '';
    isSearchActive = false;
    showLevel1();
}
