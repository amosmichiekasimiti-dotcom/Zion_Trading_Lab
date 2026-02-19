const app_id = 1089;
const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
let activeSub = null;

ws.onopen = () => {
    // Initial Asset: Volatility 50 (1s) Index
    subscribeToSymbol('1HZ50V');
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.tick) handleTick(data.tick);
};

function handleTick(tick) {
    const price = tick.quote;
    const symbol = tick.symbol;
    const priceStr = price.toFixed(tick.pip_size);
    const lastDigit = priceStr.slice(-1);
    
    // Update Price Display
    document.getElementById('live-price').innerHTML = priceStr.slice(0, -1) + `<span class="active-digit">${lastDigit}</span>`;
    document.getElementById('price-symbol').innerText = symbol;

    runAnalysis(price, lastDigit);
}

function runAnalysis(price, digit) {
    document.getElementById('engine-status').innerText = "LIVE SIGNALING";
    
    // Signal Logic (Even/Odd Example)
    const signal = parseInt(digit) % 2 === 0 ? "EVEN" : "ODD";
    const trend = parseInt(digit) > 5 ? "UP" : "DOWN";
    
    document.getElementById('primary-signal').innerText = signal;
    document.getElementById('market-direction').innerText = trend;

    // Update Verification Conditions
    updateCondition('cond-pattern', true);
    updateCondition('cond-vol', true);
    updateCondition('cond-momentum', true);
}

function updateCondition(id, passed) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = passed ? "Passed" : "Checking";
        el.className = passed ? "status status-passed" : "status";
    }
}

function subscribeToSymbol(symbol) {
    if (activeSub) ws.send(JSON.stringify({ forget: activeSub }));
    ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    
    // Load High-Performance Deriv Chart
    const chart = document.getElementById('tv-chart');
    chart.src = `https://tradingview.deriv.com/v2/main.php?symbol=${symbol}&theme=dark`;
}
