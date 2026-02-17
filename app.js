const APP_ID = 1089;
let socket;
let universe = {};
let digitStore = {};
let tickHistory = {};
let voiceEnabled = true;

function speak(text){
    if(!voiceEnabled) return;
    const msg = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(msg);
}

document.getElementById("voice-toggle").onclick = ()=>{
    voiceEnabled = !voiceEnabled;
    document.getElementById("voice-toggle").innerText =
        voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF";
};

function connect(){
    socket = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${APP_ID}`);

    socket.onopen = ()=>{
        socket.send(JSON.stringify({
            active_symbols:"brief",
            product_type:"basic"
        }));
    };

    socket.onmessage = (msg)=>{
        const data = JSON.parse(msg.data);

        if(data.active_symbols){
            const synthetics = data.active_symbols
                .filter(s=>s.market==="synthetic_index");
            buildUniverse(synthetics);
            renderUI();
        }

        if(data.tick){
            processTick(data.tick);
        }
    };

    socket.onclose = ()=> setTimeout(connect,2000);
}

function buildUniverse(symbols){
    universe = {};

    symbols.forEach(asset=>{
        if(!universe[asset.market_display_name])
            universe[asset.market_display_name] = {};

        if(!universe[asset.market_display_name][asset.submarket_display_name])
            universe[asset.market_display_name][asset.submarket_display_name] = [];

        universe[asset.market_display_name][asset.submarket_display_name]
            .push(asset);

        digitStore[asset.symbol] = [];
        tickHistory[asset.symbol] = [];

        socket.send(JSON.stringify({ticks:asset.symbol, subscribe:1}));
    });
}

function renderUI(){
    const grid = document.getElementById("display-grid");
    grid.innerHTML = "";

    Object.keys(universe).forEach(market=>{
        const title = document.createElement("div");
        title.className = "market-title";
        title.innerText = market;
        grid.appendChild(title);

        Object.values(universe[market]).flat().forEach(asset=>{
            const id = asset.symbol.replace(/\./g,"_");

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <div><strong>${asset.display_name}</strong></div>
                <div class="price" id="p-${id}">---</div>
                <div class="stats" id="s-${id}">Analyzing...</div>
                <button onclick="openChart('${asset.symbol}')">Analyze</button>
            `;
            grid.appendChild(card);
        });
    });
}

function processTick(tick){
    const symbol = tick.symbol;
    const id = symbol.replace(/\./g,"_");
    const price = parseFloat(tick.quote);
    const lastDigit = price.toString().slice(-1);

    document.getElementById(`p-${id}`).innerText = price.toFixed(3);

    // Digit store
    digitStore[symbol].push(lastDigit);
    if(digitStore[symbol].length>30) digitStore[symbol].shift();

    // Tick history
    tickHistory[symbol].push(price);
    if(tickHistory[symbol].length>10) tickHistory[symbol].shift();

    analyze(symbol);
}

function analyze(symbol){
    const digits = digitStore[symbol];
    const prices = tickHistory[symbol];
    if(digits.length<10) return;

    let even=0,odd=0;
    digits.forEach(d=>parseInt(d)%2===0?even++:odd++);

    const evenP = (even/digits.length)*100;
    const oddP = (odd/digits.length)*100;

    const volatility = Math.max(...prices)-Math.min(...prices);

    const confidence = Math.max(evenP,oddP) + (volatility*10);
    const id = symbol.replace(/\./g,"_");

    document.getElementById(`s-${id}`).innerText =
        `Even ${evenP.toFixed(0)}% | Odd ${oddP.toFixed(0)}% | AI ${confidence.toFixed(0)}%`;

    if(confidence>90){
        speak(`High probability signal on ${symbol}`);
    }
}

function openChart(symbol){
    document.getElementById("overlay").style.display="block";
    document.getElementById("analysis-title").innerText = symbol;
    document.getElementById("chart-view").innerHTML =
        `<iframe src="https://tradingview.binary.com/v2.1.0/main.html?symbol=${symbol}&theme=dark"
        style="width:100%;height:100%;border:none;"></iframe>`;
}

function closeOverlay(){
    document.getElementById("overlay").style.display="none";
    document.getElementById("chart-view").innerHTML="";
}

connect();
