/**
 * Zion Trading Lab - Exact Deriv Percentage Matching
 * Properly extracts digits and calculates percentages
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let allSymbols = [];
let digitData = []; // The absolute source of truth from server
let currentMode = 'rise_fall';
let currentSymbol = '';
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
    console.log('Connected to Deriv API');
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

// Main message handler
ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Load active symbols
    if (data.active_symbols) {
        allSymbols = data.active_symbols;
        loadCategory('volatility');
    }

    // COMMAND: Sync history once to align percentages with Deriv's widget
    if (data.history) {
        console.log('Received history:', data.history.prices.length, 'ticks');
        
        // Clear existing data
        digitData = [];
        
        // Extract digits from each price
        data.history.prices.forEach(price => {
            // Convert to string and get last digit before decimal
            const priceStr = price.toString();
            let lastDigit;
            
            if (priceStr.includes('.')) {
                // If it has decimal, get the last digit before decimal
                const beforeDecimal = priceStr.split('.')[0];
                lastDigit = parseInt(beforeDecimal.slice(-1));
            } else {
                // If no decimal, get last digit of the whole number
                lastDigit = parseInt(priceStr.slice(-1));
            }
            
            // Ensure it's a valid digit 0-9
            if (!isNaN(lastDigit) && lastDigit >= 0 && lastDigit <= 9) {
                digitData.push(lastDigit);
            }
        });
        
        console.log('Extracted digits:', digitData);
        renderExactStats();
    }

    // COMMAND: Real-time subscription for live digits
    if (data.tick) {
        activeSub = data.tick.id;
        
        // Extract last digit from tick
        const price = data.tick.quote;
        const priceStr = price.toString();
        let lastDigit;
        
        if (priceStr.includes('.')) {
            const beforeDecimal = priceStr.split('.')[0];
            lastDigit = parseInt(beforeDecimal.slice(-1));
        } else {
            lastDigit = parseInt(priceStr.slice(-1));
        }
        
        // Validate digit
        if (!isNaN(lastDigit) && lastDigit >= 0 && lastDigit <= 9) {
            // Keep the window at exactly 100 to match official stats
            digitData.push(lastDigit);
            if (digitData.length > 100) digitData.shift();

            // Update live price display - show full price
            if (livePrice) {
                livePrice.innerHTML = priceStr;
            }

            if (currentMode !== 'rise_fall') {
                renderExactStats(lastDigit);
            }
        }
    }
};

// Render exact statistics matching Deriv screenshot
function renderExactStats(activeDigit = null) {
    if (digitData.length === 0) {
        console.log('No digit data to render');
        return;
    }
    
    console.log('Rendering stats for', digitData.length, 'digits:', digitData);
    
    const counts = Array(10).fill(0);
    digitData.forEach(d => {
        if (d >= 0 && d <= 9) {
            counts[d]++;
        }
    });
    
    const total = digitData.length;
    console.log('Digit counts:', counts);

    // Find max and min for coloring
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);

    for (let i = 0; i <= 9; i++) {
        // Calculate percentage with EXACT decimal places like Deriv
        const rawPct = (counts[i] / total) * 100;
        
        // Format to match Deriv's style
        let displayPct;
        if (rawPct === Math.floor(rawPct)) {
            displayPct = rawPct.toFixed(0) + '%'; // Whole numbers: "12%"
        } else {
            displayPct = rawPct.toFixed(1) + '%'; // Decimals: "10.3%"
        }

        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);

        if (bar) {
            bar.style.height = `${rawPct}%`;
        }
        
        if (label) {
            label.innerText = displayPct;
            
            // Color coding exactly like Deriv screenshot
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
                box.style.background = "rgba(0, 242, 254, 0.15)";
                box.style.borderColor = "#00f2fe";
                box.style.boxShadow = "0 0 10px rgba(0, 242, 254, 0.3)";
            } else {
                box.style.background = "#1a1a1a";
                box.style.borderColor = "#333";
                box.style.boxShadow = "none";
            }
        }
    }
}

// Build digit grid with Deriv's exact layout
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

// Load market category
window.loadCategory = function(category, activeBtn = null) {
    // Update active button
    if (activeBtn) {
        document.querySelectorAll('.nav-scroll button').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
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
};

// Open analysis modal
window.openAnalysis = function(name, symbol) {
    currentSymbol = symbol;
    digitData = []; // Reset authoritative data
    modalTitle.innerText = name;
    modal.style.display = 'flex';

    // Reset to Rise/Fall mode
    currentMode = 'rise_fall';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab').classList.add('active');
    digitPanel.style.display = 'none';

    // Build digit grid
    buildDigitGrid();

    // Request 100-tick history
    ws.send(JSON.stringify({
        "ticks_history": symbol,
        "adjust_start_time": 1,
        "count": 100,
        "end": "latest",
        "style": "ticks"
    }));

    // Subscribe to live ticks
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));

    // Load chart
    chartContainer.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${symbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
};

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
        renderExactStats(lastDigit);
    }
};

// Close modal
window.closeModal = function() {
    modal.style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
};

// Initialize digit grid on load
setTimeout(buildDigitGrid, 100);
