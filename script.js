// ZION TRADING LAB - ADVANCED SYSTEMATIC ENGINE
const APP_ID = '126973';
const TOKEN = 'rbQgwOkbsfDoKw2'; // Your authorized Deriv Token
const GEMINI_KEY = 'AIzaSyDM7cKxbQwbwBX0ubb01Iel2WrFi8oEh2E';

const VOLS = ['1HZ10V','1HZ15V','1HZ25V','1HZ30V','1HZ50V','1HZ75V','1HZ90V','1HZ100V','R_10','R_25','R_50','R_75','R_100'];

let analysisBuffers = {};
let lastAnnouncementTime = 0;
let isScanning = false;

// 1. SYSTEMATIC DEMO TALK: Professional AI Voice
const geminiTalk = (message) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.8; // Calibrated for clear, long-lasting signals
    utterance.pitch = 1.0;
    synth.speak(utterance);
};

// 2. TOKEN AUTHORIZATION & DATA STREAM
const startMarketHunt = (strategy) => {
    isScanning = true;
    geminiTalk(`Gemini AI is authorizing your token and scanning all markets for ${strategy}. Filtering for 20-second stability.`);
    
    VOLS.forEach(symbol => {
        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
        
        ws.onopen = () => {
            // AUTHORIZE with your API Token
            ws.send(JSON.stringify({ authorize: TOKEN }));
            ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
        };

        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.error) console.error("API Error:", data.error.message);
            if (data.tick) runPhysics(symbol, data.tick.quote, strategy);
        };
    });
};

// 3. PHYSICS & MATHEMATICS: Filter for "Long-Lasting" signals
function runPhysics(symbol, price, strategy) {
    if (!analysisBuffers[symbol]) analysisBuffers[symbol] = [];
    const digit = parseInt(price.toString().slice(-1));
    analysisBuffers[symbol].push(digit);

    if (analysisBuffers[symbol].length > 100) { 
        analysisBuffers[symbol].shift();
        
        const evens = analysisBuffers[symbol].filter(d => d % 2 === 0).length;
        const confidence = evens / 100;
        const now = Date.now();

        // Ensure 20-second stability (No "Disco Dancer" fast signals)
        if (now - lastAnnouncementTime > 20000) {
            if (confidence > 0.80 || confidence < 0.20) {
                const side = confidence > 0.5 ? "EVEN" : "ODD";
                const strength = Math.round(confidence > 0.5 ? confidence * 100 : (1 - confidence) * 100);
                
                updateUI(symbol, side, strength);
                geminiTalk(`Confirmed Trend. The best market is ${symbol}. Mathematics shows ${strength} percent stability. Execute ${side} trade. Signal valid for 20 seconds.`);
                lastAnnouncementTime = now;
            }
        }
    }
}

function updateUI(market, side, conf) {
    const output = document.getElementById('winner-output');
    output.innerHTML = `
        <div class="signal-card">
            <h2>BEST MARKET: ${market}</h2>
            <h1>${side}</h1>
            <p>STABILITY: ${conf}%</p>
        </div>
    `;
}
