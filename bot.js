// CREDENTIALS INTEGRATED FROM SCREENSHOT
const APP_ID = 125403;
const REAL_TOKEN = 'oWtetBf2Koc1NNA';
const DEMO_TOKEN = 'WBwszYYjBF72RMn';

let isMuted = false;
let activeToken = REAL_TOKEN; 

// THE 13 MARKETS FROM YOUR IMAGE (FIXED LIST)
const symbols =;

// 1. WebSocket Linkage to Deriv High-Frequency Servers
const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

function toggleMute() {
    isMuted =!isMuted;
    const btn = document.getElementById('mute-btn');
    btn.innerText = isMuted? "AUDIO: MUTED" : "AUDIO: UNMUTED";
    btn.className = isMuted? "muted" : "unmuted";
}

// 2. Systematic AI Voice Signal Logic
function announce(market, tradeType, direction) {
    if (isMuted) return;
    const msg = new SpeechSynthesisUtterance();
    msg.text = `${market} Index. ${tradeType} signal detected. Trade on ${direction} side.`;
    window.speechSynthesis.speak(msg);
    updateLog(msg.text);
}

function updateLog(text) {
    const log = document.getElementById('signal-log');
    if (log.innerText.includes("System warming up")) log.innerText = "";
    const entry = document.createElement('div');
    entry.style.borderBottom = "1px solid #222";
    entry.style.padding = "10px";
    entry.innerText = ` ${text}`;
    log.prepend(entry);
}

ws.onopen = () => {
    document.getElementById('status').innerText = "Authenticating Live Pipe...";
    ws.send(JSON.stringify({ authorize: activeToken }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.msg_type === 'authorize') {
        document.getElementById('status').innerText = "Connection Live: Streaming 13 Indices";
        // Subscribing to all 13 volatility indices from your list
        symbols.forEach(s => ws.send(JSON.stringify({ ticks: s, subscribe: 1 })));
    }

    if (data.msg_type === 'tick') {
        processMathSignals(data.tick.symbol, data.tick.quote);
    }
};

// 3. Mathematical Signal Generator (Rise/Fall, Even/Odd, Matches, Over/Under, Accumulators)
function processMathSignals(symbol, price) {
    const lastDigit = parseInt(price.toString().slice(-1));
    const marketName = symbol.replace("R_", "Volatility ").replace("1HZ", "Volatility ").replace("V", " (1s)");

    // A. EVEN AND ODD LOGIC [1]
    if (lastDigit === 0 |

| lastDigit === 2 |
| lastDigit === 4 |
| lastDigit === 6 |
| lastDigit === 8) {
        announce(marketName, "Even and Odd", "Even");
    } else {
        announce(marketName, "Even and Odd", "Odd");
    }

    // B. RISE AND FALL LOGIC
    if (lastDigit > 7) announce(marketName, "Rise and Fall", "Rise");
    else if (lastDigit < 2) announce(marketName, "Rise and Fall", "Fall");

    // C. OVER AND UNDER LOGIC [2]
    if (lastDigit > 8) announce(marketName, "Over and Under", "Over");
    else if (lastDigit < 1) announce(marketName, "Over and Under", "Under");

    // D. DIGIT MATCHES AND DIFFERS [3]
    if (lastDigit === 0) announce(marketName, "Digit Matches", "Matches");
    else announce(marketName, "Digit Differs", "Differs");

    // E. ACCUMULATOR LOGIC (Volatility 10 Stability) [4, 5]
    if (symbol === "R_10" && (lastDigit >= 4 && lastDigit <= 6)) {
        announce(marketName, "Accumulator", "Stay in Range");
    }
}

// Keep connection alive every 30 seconds [6]
setInterval(() => ws.send(JSON.stringify({ ping: 1 })), 30000);
