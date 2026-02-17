/**
 * ZION TRADING LAB - AUTHORITATIVE ENGINE
 * Logic: Physics Momentum + 100-Tick Reef Sync
 */

let ws;
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let reefDigitWindow = []; 
let physicsBuffer = []; 
let lastPrice = 0;

// --- CONNECTION GUARD: Prevents "Stopped Functioning" ---
function connect() {
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    ws.onopen = () => {
        console.log("Zion Lab: Connected to Reef Feed");
        ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
        
        // Ping every 30s to keep connection alive
        setInterval(() => { if(ws.readyState === 1) ws.send(JSON.stringify({ping:1})); }, 30000);
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        // Load Asset List
        if (data.active_symbols) { 
            allSymbols = data.active_symbols; 
            loadCategory('volatility', document.querySelector('.nav-card')); 
        }

        // Pull Real History (Physics Baseline)
        if (data.history) {
            reefDigitWindow = [];
            data.history.prices.forEach(p => {
                const digit = parseInt(p.toFixed(data.pip_size).slice(-1));
                reefDigitWindow.push(digit);
            });
            renderAnalysis();
        }

        // Live Authoritative Stream
        if (data.tick) {
            activeSub = data.tick.id;
            const price = data.tick.quote;
            const priceStr = price.toFixed(data.tick.pip_size);
            const digit = parseInt(priceStr.slice(-1));

            updatePriceUI(priceStr, price, digit);
            
            // Maintain 100-tick Reef Window
            reefDigitWindow.push(digit);
            if (reefDigitWindow.length > 100) reefDigitWindow.shift();
            
            // Update Physics Buffer
            physicsBuffer.push(price);
            if (physicsBuffer.length > 14) physicsBuffer.shift();

            renderAnalysis(digit);
        }
    };

    ws.onclose = () => setTimeout(connect, 3000); // Auto-reconnect
}

// --- UI & CATEGORY LOGIC ---
function loadCategory(cat, el) {
    document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    const list = document.getElementById('market-list');
    list.innerHTML = '';

    const filtered = allSymbols.filter(s => {
        const disp = s.display_name.toLowerCase();
        if (cat === 'volatility') return s.market === 'synthetic_index' && !disp.includes('jump') && !disp.includes('step');
        if (cat === 'crashboom') return disp.includes('crash') || disp.includes('boom');
        if (cat === 'jump') return disp.includes('jump');
        if (cat === 'range') return disp.includes('range') || disp.includes('step');
        if (cat === 'forex') return s.market === 'forex';
        return false;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.display_name}</td>
            <td>${s.symbol.toUpperCase()}</td>
            <td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">ANALYZE</button></td>
        `;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    currentSymbol = symbol;
    reefDigitWindow = []; physicsBuffer = [];
    document.getElementById('mTitle').innerText = name;
    document.getElementById('price-symbol').innerText = symbol.toUpperCase();
    document.getElementById('modal').style.display = 'block';
    
    switchContract('rise_fall', document.querySelector('.tab'));
    
    // Request Authoritative State
    ws.send(JSON.stringify({ "ticks_history": symbol, "count": 100, "end": "latest", "style": "ticks" }));
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('digit-analysis-panel').style.display = (mode === 'rise_fall') ? 'none' : 'block';
    
    if (mode !== 'rise_fall') buildGrid();
    
    document.getElementById('chart-container').innerHTML = `
        <iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
}

function buildGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `
            <div id="d-${i}" class="d-box">
                <div class="d-num">${i}</div>
                <div id="bar-${i}" class="d-bar" style="height:0%;"></div>
                <div id="p-${i}" class="d-pct">0%</div>
            </div>`;
    }
}

// --- PHYSICS & STRATEGY ENGINE ---
function updatePriceUI(str, val, digit) {
    const head = str.slice(0, -1);
    let arrow = val > lastPrice ? " ▲" : " ▼";
    let color = val > lastPrice ? "#4caf50" : "#ff444f";
    lastPrice = val;

    document.getElementById('live-price').innerHTML = `
        ${head}<span>${digit}</span>
        <span style="color:${color}; font-size:18px;">${arrow}</span>
    `;
}

function renderAnalysis(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    
    const max = Math.max(...counts);
    const min = Math.min(...counts);

    // Physics Velocity Calculation
    let velocity = 0;
    if (physicsBuffer.length === 14) {
        velocity = (physicsBuffer[13] - physicsBuffer[0]) / 14;
        const trend = velocity > 0 ? "BULLISH FORCE" : "BEARISH FORCE";
        const color = velocity > 0 ? "#4caf50" : "#ff444f";
        document.getElementById('market-strength').innerHTML = `<span style="color:${color}">${trend}</span>`;
    }

    for (let i = 0; i <= 9; i++) {
        const pct = ((counts[i] / reefDigitWindow.length) * 100).toFixed(1);
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);

        if (label) {
            label.innerText = pct + "%";
            label.style.color = (counts[i] === max) ? "#4caf50" : (counts[i] === min) ? "#ff444f" : "#00f2fe";
        }
        if (bar) bar.style.height = pct + "%";

        // Black Highlight Active State (Like screenshots)
        if (i === activeDigit) {
            box.style.background = "#000";
            box.style.borderColor = "#fff";
        } else {
            box.style.background = "#161625";
            box.style.borderColor = "#2e2e48";
        }
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}

connect();
