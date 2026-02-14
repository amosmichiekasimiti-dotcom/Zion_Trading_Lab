// Zion Trading Lab - Advanced Logic Engine
const APP_ID = '126973'; 
const TOKEN = 'rbQgwOkbsfDoKw2'; 
const GEMINI_KEY = 'AIzaSyDM7cKxbQwbwBX0ubb01Iel2WrFi8oEh2E';

let socket, digitHistory = [], currentMarket = "Vol 100 (1s)", isMuted = false;

// SYSTEMATIC VOICE: Calibrated for professional signal delivery
const announce = (msg) => {
    if (isMuted) return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 0.85; // Serious, systematic tone
    synth.speak(utterance);
};

// PHYSICS ENGINE: Mathematical Digit Probability Density
const processQuantumPhysics = (digit) => {
    digitHistory.push(digit);
    if (digitHistory.length > 40) digitHistory.shift();

    // Math: Calculate Digit Frequency and Recency
    const freq = digitHistory.reduce((acc, d) => (acc[d] = (acc[d] || 0) + 1, acc), {});
    const saturation = (freq[digit] / digitHistory.length) * 100;

    // Advanced Strategy: Even/Odd + Under/Over 4 (Payout > 40%)
    const type = (digit % 2 === 0) ? "EVEN" : "ODD";
    const engineeringSignal = (digit > 5) ? "UNDER 4 (REVERSION)" : "OVER 5 (MOMENTUM)";
    
    if (saturation > 15) { // Physics threshold for inertia shift
        const fullSignal = `${currentMarket} | ${type} | ${engineeringSignal} | TARGET: MATCHES ${digit}`;
        document.getElementById('sig-panel').innerHTML = `<h1>${fullSignal}</h1>`;
        announce(`System Alert for ${currentMarket}. Execute ${type} and ${engineeringSignal}. Target Matches ${digit}.`);
    }
};

const connect = () => {
    socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    socket.onopen = () => socket.send(JSON.stringify({ authorize: TOKEN }));
    socket.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.tick) processQuantumPhysics(parseInt(data.tick.quote.toString().slice(-1)));
    };
};

function switchMarket(symbol, name) {
    currentMarket = name;
    document.getElementById('active-market').innerText = name;
    socket.send(JSON.stringify({ forget_all: "ticks" }));
    socket.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
}
connect();
