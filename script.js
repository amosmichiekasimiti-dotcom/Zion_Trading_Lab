const APP_ID = '126973';
const TOKEN = 'rbQgwOkbsfDoKw2';
let isMuted = false;
let socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

function announce(text) {
    if (!isMuted) {
        const speech = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(speech);
    }
}

function toggleVoice() {
    isMuted = !isMuted;
    document.getElementById('voice-toggle').innerText = isMuted ? "VOICE: OFF" : "VOICE: ON";
}

socket.onopen = () => {
    socket.send(JSON.stringify({ "authorize": TOKEN }));
    socket.send(JSON.stringify({ "ticks": "1HZ100V", "subscribe": 1 }));
    // Keep connection live with ping every 30s
    setInterval(() => socket.send(JSON.stringify({ "ping": 1 })), 30000);
};

socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.tick) {
        const lastDigit = parseInt(data.tick.quote.toString().slice(-1));
        
        // Signal Logic: Mean Reversion Physics
        if (lastDigit >= 8) {
            document.getElementById('live-signal').innerText = "SIGNAL: UNDER 4";
            announce("High momentum detected. Trading Under 4.");
        } else {
            document.getElementById('live-signal').innerText = "MARKET STABLE";
        }
    }
};

function changeMarket(symbol) {
    socket.send(JSON.stringify({ "forget_all": "ticks" }));
    socket.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}
