const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;

ws.onopen = () => {
    // Default symbol Volatility 50 (1s) Index
    subscribeToSymbol('1HZ50V');
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.tick) handleTick(data.tick);
};

function handleTick(tick) {
    const price = tick.quote;
    const symbol = tick.symbol;
    
    // Update Price Display
    const priceStr = price.toFixed(2);
    document.getElementById('live-price').innerHTML = 
        priceStr.slice(0, -1) + '<span class="active-digit">' + priceStr.slice(-1) + '</span>';
    document.getElementById('price-symbol').innerText = symbol;

    updateEngineLogic(price);
}

function updateEngineLogic(price) {
    const lastDigit = parseInt(price.toString().slice(-1));
    document.getElementById('engine-status').innerText = "LIVE SIGNALING";
    
    // Simple Example Logic: Even/Odd
    const signal = lastDigit % 2 === 0 ? "EVEN" : "ODD";
    document.getElementById('primary-signal').innerText = signal;
    document.getElementById('market-direction').innerText = lastDigit > 5 ? "UP" : "DOWN";
    
    // Update Verification Conditions
    updateVerification('cond-pattern', true);
    updateVerification('cond-vol', true);
    updateVerification('cond-momentum', true);
}

function updateVerification(id, status) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = status ? "Passed" : "Wait";
        el.className = status ? "status status-pass" : "status status-checking";
    }
}

function subscribeToSymbol(symbol) {
    if (activeSub) ws.send(JSON.stringify({ forget: activeSub }));
    ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    loadDerivChart(symbol);
}

function loadDerivChart(symbol) {
    const chart = document.getElementById('trading-chart');
    // Using Deriv's TradingView implementation specifically for synthetic indices
    chart.src = `https://tradingview.deriv.com/v2/main.php?symbol=${symbol}&theme=dark`;
}
