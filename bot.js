// CREDENTIALS INTEGRATED FROM YOUR IMAGES
const APP_ID = 125403;
const REAL_TOKEN = 'oWtetBf2Koc1NNA';
const DEMO_TOKEN = 'WBwszYYjBF72RMn';
const GEMINI_KEY = 'AIzaSyDM7cXkbQwbuBX0ubb01IeI2WrFi80Eh2E';

let isMuted = false;
let activeToken = REAL_TOKEN;

// ALL 13 MARKETS FROM YOUR SCREENSHOT
const symbols =;

// 1. Linking to Deriv High-Frequency Servers
const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

function toggleMute() {
    isMuted =!isMuted;
    const btn = document.getElementById('mute-btn');
    btn.innerText = isMuted? "AUDIO: MUTED" : "AUDIO: UNMUTED";
    btn.className = isMuted? "muted" : "unmuted";
}

// 2. Systematic AI Voice Announcement
function announce(market, tradeType, direction) {
    if (isMuted) return;
    const msg = new SpeechSynthesisUtterance();
    // Systematic format: [Market] -> ->
    msg.text = `${market} Index detected. ${tradeType} signal. Trade on ${direction} side.`;
    window.speechSynthesis.speak(msg);
    updateUI(msg.text);
}

function updateUI(text) {
    const log = document.getElementById('signal-log');
    if (log.innerText.includes("Waiting")) log.innerText = "";
    const div = document.createElement('div');
    div.style.borderBottom = "1px solid #222";
    div.style.padding = "10px";
    div.innerText = `: ${text}`;
    log.prepend(div);
}

ws.onopen = () => {
    document.getElementById('status').innerText = "Authenticating Live Connection...";
    ws.send(JSON.stringify({ authorize: activeToken }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.msg_type === 'authorize') {
        document.getElementById('status').innerText = "Live Link Active: Streaming 13 Indices";
        symbols.forEach(s => ws.send(JSON.stringify({ ticks: s, subscribe: 1 })));
    }
    if (data.msg_type === 'tick') {
        processFlowSignals(data.tick.symbol, data.tick.quote);
    }
};

// 3. Mathematical Signal Generator (Rise/Fall, Even/Odd, Matches, Over/Under, Accumulators)
function processFlowSignals(symbol, price) {
    const lastDigit = parseInt(price.toString().slice(-1));
    const marketName = symbol.replace("R_", "Volatility ").replace("1HZ", "Volatility ").replace("V", " (1s)");

    // EVEN AND ODD 
    if (lastDigit % 2 === 0) announce(marketName, "Even and Odd", "Even");
    else announce(marketName, "Even and Odd", "Odd");

    // RISE AND FALL 
    if (lastDigit > 7) announce(marketName, "Rise and Fall", "Rise");
    else if (lastDigit < 2) announce(marketName, "Rise and Fall", "Fall");

    // OVER AND UNDER 
    if (lastDigit > 8) announce(marketName, "Over and Under", "Over");
    else if (lastDigit < 1) announce(marketName, "Over and Under", "Under");

    // MATCHES AND DIFFERS 
    if (lastDigit === 0) announce(marketName, "Digit Match", "Zero");
    else announce(marketName, "Digit Differ", "Non-Zero");

    // ACCUMULATORS (Favoring stable market Volatility 10) 
    if (symbol === "R_10" && (lastDigit >= 4 && lastDigit <= 6)) {
        announce(marketName, "Accumulator", "Stay in Range");
    }
}

// Keep connection alive [1]
setInterval(() => ws.send(JSON.stringify({ ping: 1 })), 30000);
