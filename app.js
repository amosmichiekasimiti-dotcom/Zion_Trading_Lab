/**
 * ZION TRADING LAB - UNIVERSAL INTELLIGENCE ENGINE
 * Automatically identifies market types and pulls relevant data (Digits vs Trend)
 * Discovers all contract types (Accumulators, Matches/Differs, etc.)
 */

const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let marketData = {}; 

socket.onopen = () => {
    document.getElementById('connection-status').innerText = "INTELLIGENCE ACTIVE - DISCOVERING ALL MARKETS";
    document.getElementById('connection-status').className = "status-online";

    // Step 1: Broad Discovery
    socket.send(JSON.stringify({
        "active_symbols": "full",
        "product_type": "basic"
    }));
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Initial Symbol Load
    if (data.msg_type === 'active_symbols') {
        window.allSymbols = data.active_symbols;
        window.renderMarkets(window.allSymbols);
        
        window.allSymbols.forEach(s => {
            // Subscribe to live feed
            socket.send(JSON.stringify({ "ticks": s.symbol, "subscribe": 1 }));
            // Deep Scan for Contract Types (Accumulators, Over/Under, etc.)
            socket.send(JSON.stringify({ "contracts_for": s.symbol }));
        });
    }

    // Live Price Movement
    if (data.msg_type === 'tick') {
        handleUniversalTick(data.tick);
    }

    // Deep Contract Discovery
    if (data.msg_type === 'contracts_for') {
        processDeepDiscovery(data.contracts_for, data.echo_req.contracts_for);
    }
};

function processDeepDiscovery(contractData, symbol) {
    const card = document.querySelector(`[data-symbol="${symbol}"]`);
    if (!card) return;

    const typesArea = card.querySelector('.market-types');
    const categories = [...new Set(contractData.available.map(c => c.category_display_name))];
    
    // Auto-Logic: Determine if this market is "Digit-Based" or "Trend-Based"
    const isDigitMarket = categories.some(cat => cat.toLowerCase().includes('digit'));
    const statsArea = card.querySelector('.stats-area');
    const trendArea = card.querySelector('.trend-area');

    if (isDigitMarket) {
        if(statsArea) statsArea.style.display = 'block';
        if(trendArea) trendArea.style.display = 'none';
    } else {
        if(statsArea) statsArea.style.display = 'none';
        if(trendArea) trendArea.style.display = 'block';
    }

    // Show all discovered markets as labels
    typesArea.innerHTML = categories.map(cat => `
        <span style="background:#1a1a1a; color:#3b82f6; padding:3px 6px; border-radius:4px; font-size:8px; margin:2px; display:inline-block; border: 1px solid #333; font-weight:900; letter-spacing:0.5px;">
            ${cat.toUpperCase()}
        </span>
    `).join('');
}

function handleUniversalTick(tick) {
    const symbol = tick.symbol;
    const price = parseFloat(tick.quote);
    const priceStr = tick.quote.toString();
    const lastDigit = parseInt(priceStr.slice(-1));

    if (!marketData[symbol]) marketData[symbol] = { history: [], lastPrice: null };
    
    // Store history for analysis
    marketData[symbol].history.push({ price, digit: lastDigit });
    if (marketData[symbol].history.length > 30) marketData[symbol].history.shift();

    const card = document.querySelector(`[data-symbol="${symbol}"]`);
    if (!card) return;

    // Update Price
    const pEl = card.querySelector('.live-price');
    if(pEl) {
        const color = price > marketData[symbol].lastPrice ? '#10b981' : '#ef4444';
        pEl.style.color = color;
        pEl.innerText = priceStr;
    }
    marketData[symbol].lastPrice = price;

    // 1. UPDATE DIGIT STATS (For Synthetics)
    const statsArea = card.querySelector('.stats-area');
    if (statsArea && statsArea.style.display !== 'none') {
        const digits = marketData[symbol].history.map(h => h.digit);
        const evens = digits.filter(d => d % 2 === 0).length;
        const evenRatio = ((evens / digits.length) * 100).toFixed(0);
        
        statsArea.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; margin-bottom:4px;">
                <span style="color:#3b82f6">EVEN: ${evenRatio}%</span>
                <span style="color:#ef4444">ODD: ${100-evenRatio}%</span>
            </div>
            <div style="width:100%; height:4px; background:#111; border-radius:10px; overflow:hidden;">
                <div style="width:${evenRatio}%; height:100%; background:#3b82f6;"></div>
            </div>
        `;
    }

    // 2. UPDATE TREND STATS (For Forex/Stocks)
    const trendArea = card.querySelector('.trend-area');
    if (trendArea && trendArea.style.display !== 'none') {
        const prices = marketData[symbol].history.map(h => h.price);
        const startPrice = prices[0];
        const endPrice = prices[prices.length - 1];
        const change = (((endPrice - startPrice) / startPrice) * 100).toFixed(4);
        const trendColor = change >= 0 ? '#10b981' : '#ef4444';

        trendArea.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold;">
                <span style="color:#555">SESS. TREND</span>
                <span style="color:${trendColor}">${change > 0 ? '↑' : '↓'} ${Math.abs(change)}%</span>
            </div>
        `;
    }
}

setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ping:1})); }, 30000);
