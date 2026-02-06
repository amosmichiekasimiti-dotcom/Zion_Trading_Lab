const CONFIG = {
    app_id: "125403",
    real_token: "m040xPdV6cV6pX4",
    demo_token: "kTYefK9bFG3UPGh",
    gemini_key: "AIzaSyDM7cXkbQwbwBX0ubb01Iel2WrFi8oEh2E",
    eleven_key: "Sk_d1862d511d4409c00139aa92852804f57b609d2abde7a6ef",
    ws_url: "wss://ws.binaryws.com/websockets/v3?app_id=125403"
};


// EXHAUSTIVE VOLATILITY LIST FROM USER IMAGE
const MARKETS = {
    "1HZ10V": "V10(1s)",
    "R_10": "V10",
    "1HZ15V": "V15(1s)",
    "1HZ25V": "V25(1s)",
    "R_25": "V25",
    "1HZ30V": "V30(1s)",
    "1HZ50V": "V50(1s)",
    "R_50": "V50",
    "1HZ75V": "V75(1s)",
    "R_75": "V75",
    "1HZ90V": "V90(1s)",
    "1HZ100V": "V100(1s)",
    "R_100": "V100"
};

let socket, currentPending = null, isMuted = false;
const vault = {};

function initSocket(token) {
    if (socket) socket.close();
    socket = new WebSocket(CONFIG.ws_url);
    socket.onopen = () => {
        socket.send(JSON.stringify({ "authorize": token }));
        Object.keys(MARKETS).forEach(s => { 
            vault[s] = { digits:, quotes: }; 
            socket.send(JSON.stringify({ "ticks": s })); 
        });
    };
    socket.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.msg_type === 'authorize' && d.authorize) {
            document.getElementById('acc-info').innerText = d.authorize.loginid + " SYNCED";
        }
        if (d.tick) runDeepAnalysis(d.tick);
    };
}

function runDeepAnalysis(tick) {
    const s = tick.symbol, quote = parseFloat(tick.quote), digit = parseInt(quote.toString().slice(-1));
    if (!vault[s]) vault[s] = { digits:, quotes: };
    vault[s].digits.push(digit); vault[s].quotes.push(quote);
    if(vault[s].digits.length > 50) { vault[s].digits.shift(); vault[s].quotes.shift(); }
    
    if (vault[s].quotes.length < 20 |

| currentPending) return;

    // 1. OVER/UNDER LOGIC (Discretization Physics)
    const highPrecision = quote % 1;
    const distanceToCliff = 0.5 - Math.abs(highPrecision - 0.5); 
    if (distanceToCliff < 0.005) {
        return triggerPrompt(s, "OVER/UNDER", (highPrecision > 0.5? "UNDER" : "OVER"));
    }

    // 2. EVEN/ODD LOGIC
    const evens = vault[s].digits.slice(-20).filter(x => x % 2 === 0).length;
    if (evens >= 14 |

| evens <= 6) {
        return triggerPrompt(s, "EVEN/ODD", (evens >= 14? "EVEN" : "ODD"));
    }
}

function triggerPrompt(sym, type, side) {
    currentPending = { symbol: sym, type: type, side: side };
    document.getElementById('exec-prompt').style.display = 'block';
    document.getElementById('prompt-market').innerText = MARKETS[sym] + " " + type;
    document.getElementById('prompt-details').innerText = "PREDICTION: " + side;
    speakAdam("Alert. " + type + " signal for " + MARKETS[sym]);
}

async function speakAdam(text) {
    if (isMuted) return;
    try {
        await fetch("https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB", {
            method: 'POST',
            headers: { 'xi-api-key': CONFIG.eleven_key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, model_id: "eleven_turbo_v2_5" })
        }).then(r => r.blob()).then(b => new Audio(URL.createObjectURL(b)).play());
    } catch (e) { console.log("Voice failed"); }
}

function confirmTrade(isYes) {
    if (isYes && currentPending) {
        const stake = document.getElementById('p-stake').value;
        let cType = "DIGITEVEN";
        if (currentPending.type === "EVEN/ODD") cType = (currentPending.side === "EVEN"? "DIGITEVEN" : "DIGITODD");
        else if (currentPending.type === "OVER/UNDER") cType = (currentPending.side === "OVER"? "DIGITOVER" : "DIGITUNDER");

        socket.send(JSON.stringify({
            "buy": 1, "price": stake,
            "parameters": { 
                "amount": stake, "basis": "stake", "contract_type": cType, "currency": "USD", 
                "duration": 1, "duration_unit": "t", "symbol": currentPending.symbol 
            }
        }));
    }
    document.getElementById('exec-prompt').style.display = 'none'; 
    currentPending = null;
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function toggleMute() { isMuted =!isMuted; document.getElementById('voice-toggle').innerText = "ADAM: " + (isMuted? "OFF" : "ON"); }
function switchTab(id) {
    document.getElementById('signal-engine').style.display = (id === 'signal-engine'? 'block' : 'none');
    document.getElementById('live-monitor').style.display = (id === 'live-monitor'? 'block' : 'none');
    document.getElementById('tab-engine').classList.toggle('active', id === 'signal-engine');
    document.getElementById('tab-monitor').classList.toggle('active', id === 'live-monitor');
}
function switchAccount(mode) { 
    initSocket(mode === 'real'? CONFIG.real_token : CONFIG.demo_token);
}

Object.keys(MARKETS).forEach(code => {
    const tile = document.createElement('div'); tile.className = 'market-tile'; tile.innerText = MARKETS[code];
    document.getElementById('market-grid').appendChild(tile);
});
initSocket(CONFIG.demo_token);
