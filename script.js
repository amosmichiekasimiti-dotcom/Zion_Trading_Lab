// Zion Trading Lab - Advanced Stability Engine
const APP_ID = '126973';
const TOKEN = 'rbQgwOkbsfDoKw2';

let socket, currentMarket = "Waiting...";
let digitHistory = []; 
let lastSignalTime = 0;
const SIGNAL_DELAY = 5000; // 5 seconds minimum between announcements

// 1. Slow & Clear Voice Engine
const announce = (msg) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 0.75; // Slower for clear comprehension
    utterance.pitch = 1.0;
    synth.speak(utterance);
};

// 2. Physics & Engineering Logic: Long-Lasting Detection
const processLongSignal = (digit) => {
    digitHistory.push(digit);
    if (digitHistory.length > 60) digitHistory.shift(); // 60-tick window for stability

    // Calculate Density (How many times a trend appears in 60 ticks)
    const evens = digitHistory.filter(d => d % 2 === 0).length;
    const highDensity = (evens / digitHistory.length) * 100;

    const now = Date.now();
    // Only announce if the trend is strong ( > 65%) and 5 seconds have passed
    if (now - lastSignalTime > SIGNAL_DELAY) {
        if (highDensity > 65) {
            triggerSignal("EVEN / RISE", "OVER 5", digit);
            lastSignalTime = now;
        } else if (highDensity < 35) {
            triggerSignal("ODD / FALL", "UNDER 4", digit);
            lastSignalTime = now;
        }
    }
};

const triggerSignal = (type, strat, digit) => {
    const panel = document.getElementById('sig-panel');
    panel.innerHTML = `<h1>${currentMarket}<br>${type}<br>${strat}</h1>`;
    announce(`Confirmed long-term trend on ${currentMarket}. Strategy is ${strat} with ${type}. Last digit ${digit}.`);
};

// ... WebSocket connection logic stays same
