const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

socket.onopen = () => {
    // Request EVERYTHING available without filters
    socket.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) {
        const grid = document.getElementById('display-grid');
        grid.innerHTML = ''; // Clear the sync message
        
        data.active_symbols.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'card';
            const safeId = asset.symbol.replace(/\./g, '_');
            card.innerHTML = `
                <strong>${asset.market_display_name}</strong><br>
                ${asset.display_name}<br>
                <div class="price" id="tick-${safeId}">---</div>
            `;
            grid.appendChild(card);
            
            // Subscribe to live ticks for every asset immediately
            socket.send(JSON.stringify({ "ticks": asset.symbol, "subscribe": 1 }));
        });
    }

    if (data.tick) {
        const id = data.tick.symbol.replace(/\./g, '_');
        const el = document.getElementById(`tick-${id}`);
        if (el) {
            el.innerText = data.tick.quote;
            // General Volatility Announcement
            console.log(`Live: ${data.tick.symbol} - ${data.tick.quote}`);
        }
    }
};

// Emergency Reset if connection hangs
socket.onerror = () => location.reload();
socket.onclose = () => setTimeout(() => location.reload(), 3000);
