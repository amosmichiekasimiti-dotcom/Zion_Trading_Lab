/**
 * Zion Trading Lab - Direct Deriv Sync
 * Using wss://ws.derivws.com/websockets/v3?app_id=1089
 */

const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
let allSymbols = [];
let digitData = []; 
let currentSymbol = ''; // Dynamically updated
let currentPipSize = 0; // Dynamically updated
let currentMode = 'rise_fall';
let activeSub = null;

// DOM Elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const livePrice = document.getElementById('live-price');
const digitPanel = document.getElementById('digit-panel');
const chartContainer = document.getElementById('chart-container');
const marketList = document.getElementById('marketList');

// Initialize on open
ws.onopen = () => {
    console.log('Connected to Deriv WS');
    // Request active symbols on connection
    ws.send(JSON.stringify({ 
        "active_symbols": "brief", 
        "product_type": "basic" 
    }));
};

// Main message handler
ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // COMMAND: Dynamic Asset Info (Sets precision for EVERYTHING)
    if (data.msg_type === 'active_symbols') {
        allSymbols = data.active_symbols;
        renderMarketList('volatility');
    }

    // COMMAND: Global History Sync (Aligns percentages exactly)
    if (data.history) {
        currentPipSize = data.pip_size || 0;
        digitData = data.history.prices.map(p => 
            parseInt(p.toFixed(currentPipSize).split('').pop())
        );
        console.log(`History synced for ${currentSymbol}:`, digitData.length, 'digits');
        updateDigitDisplay();
    }

    // COMMAND: Live Tick Extraction (The Red Digit Sync)
    if (data.tick) {
        activeSub = data.tick.id;
        const priceStr = data.tick.quote.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.split('').pop());

        digitData.push(lastDigit);
        if (digitData.length > 100) digitData.shift();

        // Update Live Price display to match Deriv's visual
        if (livePrice) {
            livePrice.innerHTML = 
                `${priceStr.slice(0, -1)}<span style="color:red; border-bottom:2px solid red;">${lastDigit}</span>`;
        }

        if (currentMode !== 'rise_fall') {
            updateDigitDisplay(lastDigit);
        }
    }
};

// Function to switch to ANY market
function selectMarket(symbol) {
    currentSymbol = symbol;
    digitData = []; // Flush old data to avoid false percentages
    
    // Unsubscribe from previous market if any
    if (activeSub) {
        ws.send(JSON.stringify({ "forget": activeSub }));
        activeSub = null;
    }
    
    // Command Deriv to send history and live ticks for the NEW asset
    ws.send(JSON.stringify({
        ticks_history: symbol,
        count: 100,
        end: 'latest',
        style: 'ticks',
        subscribe: 1
    }));
    
    // Update modal title
    if (modalTitle) {
        modalTitle.innerText = symbol;
    }
    
    // Load chart
    if (chartContainer) {
        chartContainer.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
    }
}

// Update digit display with exact percentages
function updateDigitDisplay(activeDigit = null) {
    if (digitData.length === 0) return;
    
    const counts = Array(10).fill(0);
    digitData.forEach(d => counts[d]++);
    const total = digitData.length;

    // Find max and min for coloring
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);

    for (let i = 0; i <= 9; i++) {
        // EXACT SYNC: 1 decimal place percentages
        const rawPct = (counts[i] / total) * 100;
        const displayPct = rawPct.toFixed(1); 

        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);

        if (bar) {
            bar.style.height = `${rawPct}%`;
        }
        
        if (label) {
            label.innerText = displayPct + '%';
            
            // Color coding based on frequency
            if (counts[i] === maxVal && maxVal !== minVal) {
                label.style.color = "#4caf50"; // Green for highest
            } else if (counts[i] === minVal && maxVal !== minVal) {
                label.style.color = "#ff444f"; // Red for lowest
            } else {
                label.style.color = "#00f2fe"; // Cyan for others
            }
        }
        
        if (box) {
            if (activeDigit !== null && i === activeDigit) {
                box.style.background = "rgba(0, 242, 254, 0.4)";
                box.style.borderColor = "#00f2fe";
                box.style.boxShadow = "0 0 10px rgba(0, 242, 254, 0.5)";
            } else {
                box.style.background = "#1a1a1a";
                box.style.borderColor = "#333";
                box.style.boxShadow = "none";
            }
        }
    }
}

// Render market list based on category
function renderMarketList(category) {
    if (!allSymbols.length) {
        marketList.innerHTML = '<div class="loading">Loading markets...</div>';
        return;
    }

    // Filter symbols based on category
    const filtered = allSymbols.filter(s => {
        const disp = s.display_name.toLowerCase();
        const market = s.market?.toLowerCase() || '';
        
        if (category === 'volatility') {
            return market === 'synthetic_index' && !disp.includes('jump') && !disp.includes('step');
        }
        if (category === 'crashboom') {
            return disp.includes('crash') || disp.includes('boom');
        }
        if (category === 'jump') {
            return disp.includes('jump');
        }
        if (category === 'range') {
            return disp.includes('range') || disp.includes('step');
        }
        if (category === 'forex') {
            return market === 'forex';
        }
        return false;
    });

    // Render market list
    if (filtered.length === 0) {
        marketList.innerHTML = '<div class="loading">No markets found</div>';
        return;
    }

    marketList.innerHTML = filtered.map(s => `
        <div class="market-item">
            <div class="market-info">
                <h4>${s.display_name}</h4>
                <span>${s.symbol}</span>
            </div>
            <button class="analyze-btn" onclick="openAnalysis('${s.display_name.replace(/'/g, "\\'")}', '${s.symbol}')">
                ANALYZE
            </button>
        </div>
    `).join('');
}

// Load category (called from navigation buttons)
window.loadCategory = function(category, activeBtn = null) {
    // Update active button
    if (activeBtn) {
        document.querySelectorAll('.nav-scroll button').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }
    
    renderMarketList(category);
};

// Open analysis modal
window.openAnalysis = function(name, symbol) {
    modal.style.display = 'flex';
    selectMarket(symbol);
};

// Build digit grid
function buildDigitGrid() {
    const grid = document.getElementById('digit-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        const box = document.createElement('div');
        box.id = `d-${i}`;
        box.className = 'd-box';
        
        box.innerHTML = `
            <div class="d-num">${i}</div>
            <div id="bar-${i}" class="d-bar"></div>
            <div id="p-${i}" class="d-pct">0%</div>
        `;
        
        grid.appendChild(box);
    }
}

// Switch between contract modes
window.switchMode = function(mode, tabElement) {
    currentMode = mode;
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabElement.classList.add('active');

    // Show/hide digit panel
    if (mode === 'rise_fall') {
        digitPanel.style.display = 'none';
    } else {
        digitPanel.style.display = 'block';
        const lastDigit = digitData.length ? digitData[digitData.length - 1] : null;
        updateDigitDisplay(lastDigit);
    }
};

// Close modal
window.closeModal = function() {
    modal.style.display = 'none';
    if (activeSub) {
        ws.send(JSON.stringify({ "forget": activeSub }));
        activeSub = null;
    }
};

// Initialize digit grid on load
setTimeout(buildDigitGrid, 100);
