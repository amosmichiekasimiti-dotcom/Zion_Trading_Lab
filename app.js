/**
 * ZION TRADING LAB - LIVE ENGINE
 * Connects to Deriv and streams live data to the UI cards.
 */

const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let tickHistory = {}; 

socket.onopen = () => {
    document.getElementById('connection-status').innerText = "HANDSHAKE ACTIVE - PULLING ALL DATA";
    document.getElementById('connection-status').className = "status-online";

    // This command pulls EVERY market from Deriv
    socket.send(JSON.stringify({
        "active_symbols": "full",
        "product_type": "basic"
    }));
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Initial load of symbols
    if (data.msg_type === 'active_symbols') {
        window.allSymbols = data.active_symbols;
        window.renderMarkets(window.allSymbols);
        
        // SUBSCRIBE to live prices for every market found
        window.allSymbols.forEach(s => {
            socket.send(JSON.stringify({ "ticks": s.symbol, "subscribe": 1 }));
        });
    }

    // Process live price movements
    if (data.msg_type === 'tick') {
        updateCardWithLiveTick(data.tick);
    }
};

function updateCardWithLiveTick(tick) {
    const symbol = tick.symbol;
    const price = tick.quote.toString();
    const lastDigit = parseInt(price.slice(-1));

    // Store history for percentage calculation
    if (!tickHistory[symbol]) tickHistory[symbol] = [];
    tickHistory[symbol].push(lastDigit);
    if (tickHistory[symbol].length > 25) tickHistory[symbol].shift();

    const evens = tickHistory[symbol].filter(d => d % 2 === 0).length;
    const evenRatio = ((evens / tickHistory[symbol].length) * 100).toFixed(0);
    const oddRatio = (100 - evenRatio);

    // Find the specific card on the page
    const card = document.querySelector(`[data-symbol="${symbol}"]`);
    if (card) {
        const priceEl = card.querySelector('.live-price');
        const statsEl = card.querySelector('.stats-area');
        
        if(priceEl) priceEl.innerText = price;
        if(statsEl) {
            statsEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; margin-bottom:4px;">
                    <span style="color:#3b82f6">EVEN: ${evenRatio}%</span>
                    <span style="color:#ef4444">ODD: ${oddRatio}%</span>
                </div>
                <div style="width:100%; height:4px; background:#222; border-radius:10px; overflow:hidden;">
                    <div style="width:${evenRatio}%; height:100%; background:#3b82f6; transition: width 0.3s ease;"></div>
                </div>
            `;
        }
    }
}

// Keep connection alive
setInterval(() => { 
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ping:1})); 
}, 30000);
