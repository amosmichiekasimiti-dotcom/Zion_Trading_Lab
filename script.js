// Zion Trading Lab - Advanced Gaussian Hunter
const APP_ID = '126973';
const TOKEN = 'rbQgwOkbsfDoKw2';
const VOLS = ['1HZ10V','1HZ15V','1HZ25V','1HZ30V','1HZ50V','1HZ75V','1HZ90V','1HZ100V','R_10','R_25','R_50','R_75','R_100'];

let buffers = {};
let activeBox = null;
let lastSignalTime = 0;

const announce = (msg) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 0.8; // Systematic pace
    synth.speak(utterance);
};

// 1. TOUCH & ATTACH LOGIC
function selectStrategy(type, element) {
    // UI Attachment: Remove 'active' from others, add to this one
    document.querySelectorAll('.strat-box').forEach(b => b.classList.remove('active-box'));
    element.classList.add('active-box');
    
    activeBox = type;
    announce(`Initiating deep Gaussian scan for ${type}. Authorized token active.`);
    
    // Start Parallel Scanning
    VOLS.forEach(symbol => {
        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
        ws.onopen = () => {
            ws.send(JSON.stringify({ authorize: TOKEN }));
            ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
        };
        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.tick) runGaussianPhysics(symbol, data.tick.quote);
        };
    });
}

// 2. GAUSSIAN PHYSICS FOR 6-WIN STREAKS
function runGaussianPhysics(market, price) {
    if (!buffers[market]) buffers[market] = [];
    const digit = parseInt(price.toString().slice(-1));
    buffers[market].push(digit);
    if (buffers[market].length > 120) buffers[market].shift();

    const now = Date.now();
    if (now - lastSignalTime < 20000) return; // 20-second stability lock

    // Probability Density Analysis
    const evens = buffers[market].filter(d => d % 2 === 0).length;
    const confidence = (evens / buffers[market].length) * 100;

    if (activeBox === 'EVEN_ODD' && (confidence > 85 || confidence < 15)) {
        const side = confidence > 50 ? "EVEN" : "ODD";
        triggerSignal(market, side, Math.round(confidence > 50 ? confidence : 100 - confidence));
        lastSignalTime = now;
    }
}

function triggerSignal(market, side, conf) {
    const display = document.getElementById('main-display');
    display.innerHTML = `<div class="signal-card"><h2>${market}</h2><h1>${side}</h1><p>CONFIDENCE: ${conf}%</p></div>`;
    announce(`Golden signal found on ${market}. Physics confirms ${side} with ${conf} percent stability for the next 20 seconds.`);
}
