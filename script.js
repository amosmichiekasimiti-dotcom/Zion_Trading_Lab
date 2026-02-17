/**
 * Zion Trading Lab - Authoritative Direct Feed
 * Direct Sync with Deriv "Reef" Servers & Live Strategy Engine
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0;
let reefDigitWindow = []; // Stores authoritative 100-digit history
let physicsBuffer = [];   // Buffer for Velocity analysis

ws.onopen = () => {
    console.log("Zion Lab: Connected to Direct Reef Feed");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility', document.querySelector('.nav-card')); 
    }

    // Pull real history to ensure accurate starting percentages
    if (data.history) {
        reefDigitWindow = [];
        data.history.prices.forEach(p => {
            const digit = parseInt(p.toFixed(data.pip_size).slice(-1));
            reefDigitWindow.push(digit);
        });
        renderStrategyAnalysis();
    }

    if (data.tick) {
        activeSub = data.tick.id;
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        
        // Update price display with Directional Arrows
        updatePriceDisplay(priceStr, currentPrice, lastDigit);
        
        // Update buffers
        reefDigitWindow.push(lastDigit);
        if (reefDigitWindow.length > 100) reefDigitWindow.shift();
        
        physicsBuffer.push(currentPrice);
        if (physicsBuffer.length > 14) physicsBuffer.shift();

        renderStrategyAnalysis(lastDigit);
    }
};

function updatePriceDisplay(str, val, digit) {
    const head = str.slice(0, -1);
    let arrow = "";
    let arrowCol = "#fff";

    if (lastPrice > 0) {
        if (val > lastPrice) { arrow = " ▲"; arrowCol = "#4caf50"; }
        else if (val < lastPrice) { arrow = " ▼"; arrowCol = "#ff444f"; }
    }
    lastPrice = val;

    const priceEl = document.getElementById('live-price');
    if (priceEl) {
        priceEl.innerHTML = `${head}<span>${digit}</span><span style="color:${arrowCol}; font-size:18px; margin-left:10px;">${arrow}</span>`;
    }
}

function renderStrategyAnalysis(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);

    // Calculate velocity for Physics logic
    let velocity = 0;
    if (physicsBuffer.length === 14) {
        velocity = (physicsBuffer[13] - physicsBuffer[0]) / 14;
    }

    // Update Digit UI
    for (let i = 0; i <= 9; i++) {
        const pct = ((counts[i] / reefDigitWindow.length) * 100).toFixed(1);
        const bar = document.getElementById(`bar-${i}`);
        const box = document.getElementById(`d-${i}`);
        const label = document.getElementById(`p-${i}`);

        if (label) {
            label.innerText = pct + "%";
            if (counts[i] === maxVal) label.style.color = "#4caf50"; // HOT
            else if (counts[i] === minVal) label.style.color = "#ff444f"; // COLD
            else label.style.color = "#333";
        }

        if (bar) bar.style.height = pct + "%";

        // Active Highlight
        if (i === activeDigit) {
            if (box) { box.style.background = "#000"; box.style.borderColor = "#fff"; }
            if (bar) bar.style.background = "#ff444f";
        } else {
            if (box) { box.style.background = "#1a1a1a"; box.style.borderColor = "#333"; }
            if (bar) bar.style.background = "#323738";
        }
    }
    
    analyzeMarketConditions(velocity, counts, activeDigit);
}

function analyzeMarketConditions(vel, counts, active) {
    // Strategy Logic based on 10 conditions per market
    let signal = "NEUTRAL";
    let color = "#888";

    // Example logic for Even/Odd Parity
    const evenSum = counts[0] + counts[2] + counts[4] + counts[6] + counts[8];
    const oddSum = 100 - evenSum;

    if (currentMode === 'even_odd') {
        if (evenSum > 55 && active % 2 === 0 && vel > 0) {
            signal = "STRONG EVEN TREND";
            color = "#4caf50";
        } else if (oddSum > 55 && active % 2 !== 0 && vel < 0) {
            signal = "STRONG ODD TREND";
            color = "#ff444f";
        }
    }
    
    // Log active signal for professional trading
    console.log(`[Zion Engine] Signal: ${signal} | Parity: E${evenSum}/O${oddSum} | Vel: ${vel.toFixed(5)}`);
}

// ... rest of your UI helper functions (closeModal, loadCategory, etc.)
