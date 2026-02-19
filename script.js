/**
 * Zion Trading Lab - Authoritative Direct Feed
 * Direct Sync with Deriv "Reef" Servers & Live Directional Arrows
 * Enhanced with Signal Engine for Rise/Fall, Even/Odd, Matches/Differs, Over/Under
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0; // Track previous price for directional arrows
let reefDigitWindow = []; // Stores authoritative 100-digit history
let priceHistory = []; // For rise/fall analysis
let lastSignal = null;
let signalCooldown = 0;

// Signal Engine Configuration
const SIGNAL_CONFIG = {
    rise_fall: {
        minTicks: 20,
        trendThreshold: 0.65,
        momentumThreshold: 3
    },
    even_odd: {
        minTicks: 50,
        dominanceThreshold: 0.55,
        streakThreshold: 4
    },
    matches_differs: {
        minTicks: 100,
        probabilityThreshold: 0.12,
        minOccurrence: 8
    },
    over_under: {
        minTicks: 50,
        thresholdDigit: 5,
        dominanceThreshold: 0.60
    }
};

ws.onopen = () => {
    console.log("Zion Lab: Connected to Direct Reef Feed");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // Initial Symbol Loading
    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }

    // AUTHENTIC PERCENTAGE PULL: Initial 100-Tick History for Real Percentages
    if (data.history) {
        reefDigitWindow = []; 
        data.history.prices.forEach(price => {
            const digit = parseInt(price.toFixed(data.pip_size).slice(-1));
            reefDigitWindow.push(digit);
        });
        renderReefStatistics();
        updateSignalEngine();
    }

    // LIVE AUTHORITATIVE STREAM: Update Price, Directional Arrows & Digit Probabilities
    if (data.tick) {
        activeSub = data.tick.id;
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        const head = priceStr.slice(0, -1);
        
        // Update price history for rise/fall
        priceHistory.push(currentPrice);
        if (priceHistory.length > 100) priceHistory.shift();
        
        // Determine Direction for Amazing Arrows
        let directionArrow = "";
        let arrowColor = "#ffffff";
        if (lastPrice > 0) {
            if (currentPrice > lastPrice) {
                directionArrow = " ▲"; // Upwards movement
                arrowColor = "#4caf50"; // Green
            } else if (currentPrice < lastPrice) {
                directionArrow = " ▼"; // Downwards movement
                arrowColor = "#ff444f"; // Red
            }
        }
        lastPrice = currentPrice;

        // Update Running Price Header with Live Arrow
        const priceDisplay = document.getElementById('live-price');
        if (priceDisplay) {
            priceDisplay.innerHTML = `
                ${head}<span class="active-digit-underline">${lastDigit}</span>
                <span style="color:${arrowColor}; font-size: 22px; margin-left: 10px; font-weight: bold;">${directionArrow}</span>
            `;
        }

        // Maintain the real 100-tick window exactly like the Reef platform
        reefDigitWindow.push(lastDigit);
        if (reefDigitWindow.length > 100) reefDigitWindow.shift();
        
        if (currentMode !== 'rise_fall') {
            renderReefStatistics(lastDigit);
        }
        
        // Update Signal Engine
        updateSignalEngine();
    }
};

function loadCategory(cat, el) {
    if(el) {
        document.querySelectorAll('.nav-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }
    const list = document.getElementById('market-list');
    if (!list) return;
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
        tr.innerHTML = `<td>${s.display_name}</td><td>${s.symbol.toUpperCase()}</td><td><button class="btn-view" onclick="openAnalysis('${s.display_name}', '${s.symbol}')">Analyze</button></td>`;
        list.appendChild(tr);
    });
}

function openAnalysis(name, symbol) {
    currentSymbol = symbol;
    reefDigitWindow = []; 
    priceHistory = [];
    lastPrice = 0; // Reset price comparison
    lastSignal = null;
    signalCooldown = 0;
    document.getElementById('mTitle').innerText = name;
    document.getElementById('modal').style.display = 'block';
    
    switchContract('rise_fall', document.querySelector('.tab'));

    // DIRECT REEF COMMAND: Request authoritative 100-tick history state
    ws.send(JSON.stringify({
        "ticks_history": symbol,
        "adjust_start_time": 1,
        "count": 100,
        "end": "latest",
        "style": "ticks"
    }));

    // Subscribe to live authoritative updates
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const digitPanel = document.getElementById('digit-analysis-panel');
    const chartView = document.getElementById('chart-container');
    const signalPanel = document.getElementById('signal-panel');

    if (mode === 'rise_fall') {
        digitPanel.style.display = 'none';
        chartView.style.height = '100%';
        signalPanel.classList.add('active');
    } else {
        digitPanel.style.display = 'block';
        chartView.style.height = '400px';
        signalPanel.classList.add('active');
        buildDigitGrid();
    }
    
    // TradingView Candle Chart synchronized with price
    chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    updateSignalEngine();
}

function buildDigitGrid() {
    const grid = document.getElementById('digit-grid');
    grid.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        grid.innerHTML += `
            <div id="d-${i}" class="d-box">
                <div class="d-num">${i}</div>
                <div id="bar-${i}" class="d-bar"></div>
                <div id="p-${i}" class="d-pct">0%</div>
            </div>`;
    }
}

function renderReefStatistics(activeDigit) {
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);

    // Find Max and Min to match Red/Green coloring in screenshots
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);

    for (let i = 0; i <= 9; i++) {
        const realPercentage = reefDigitWindow.length > 0 ? ((counts[i] / reefDigitWindow.length) * 100).toFixed(1) : 0;
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);
        
        if (label) {
            label.innerText = realPercentage + "%";
            
            // Percentage Coloring Logic from Deriv platform
            if (counts[i] === maxVal && maxVal !== minVal) {
                label.style.color = "#4caf50"; // Green for highest occurrence
            } else if (counts[i] === minVal && maxVal !== minVal) {
                label.style.color = "#ff444f"; // Red for lowest occurrence
            } else {
                label.style.color = "#00f2fe"; // Standard Neon
            }
        }
        
        if (bar) bar.style.height = realPercentage + "%";

        // Black Box Active Glow State
        if (i === activeDigit) {
            if (box) {
                box.style.background = "#000000";
                box.style.borderColor = "#ffffff";
                box.style.boxShadow = "0 0 10px rgba(255,255,255,0.5)";
                box.style.transform = "scale(1.05)";
            }
        } else {
            if (box) {
                box.style.background = "#161625";
                box.style.borderColor = "#2e2e48";
                box.style.boxShadow = "none";
                box.style.transform = "scale(1)";
            }
        }
    }
}

// ==================== SIGNAL ENGINE ====================

function updateSignalEngine() {
    const panel = document.getElementById('signal-panel');
    if (!panel.classList.contains('active')) return;
    
    if (signalCooldown > 0) signalCooldown--;
    
    let signal = null;
    
    switch(currentMode) {
        case 'rise_fall':
            signal = generateRiseFallSignal();
            break;
        case 'even_odd':
            signal = generateEvenOddSignal();
            break;
        case 'matches_differs':
            signal = generateMatchesDiffersSignal();
            break;
        case 'over_under':
            signal = generateOverUnderSignal();
            break;
    }
    
    if (signal) {
        displaySignal(signal);
        lastSignal = signal;
    } else {
        displayNoSignal();
    }
}

function generateRiseFallSignal() {
    const config = SIGNAL_CONFIG.rise_fall;
    if (priceHistory.length < config.minTicks) return null;
    
    // Calculate momentum and trend
    const recent = priceHistory.slice(-20);
    let upMoves = 0;
    let downMoves = 0;
    let momentum = 0;
    
    for (let i = 1; i < recent.length; i++) {
        if (recent[i] > recent[i-1]) {
            upMoves++;
            momentum++;
        } else if (recent[i] < recent[i-1]) {
            downMoves++;
            momentum--;
        }
    }
    
    const totalMoves = upMoves + downMoves;
    if (totalMoves === 0) return null;
    
    const upRatio = upMoves / totalMoves;
    const downRatio = downMoves / totalMoves;
    
    // Check for strong trend
    let prediction = null;
    let confidence = 0;
    
    if (upRatio > config.trendThreshold && momentum >= config.momentumThreshold) {
        prediction = 'RISE';
        confidence = Math.round(upRatio * 100);
    } else if (downRatio > config.trendThreshold && momentum <= -config.momentumThreshold) {
        prediction = 'FALL';
        confidence = Math.round(downRatio * 100);
    }
    
    if (!prediction || confidence < 65) return null;
    
    return {
        type: 'rise_fall',
        prediction: prediction,
        confidence: confidence,
        strength: Math.min(5, Math.floor(confidence / 20))
    };
}

function generateEvenOddSignal() {
    const config = SIGNAL_CONFIG.even_odd;
    if (reefDigitWindow.length < config.minTicks) return null;
    
    const recent = reefDigitWindow.slice(-50);
    let evenCount = 0;
    let oddCount = 0;
    let currentStreak = 1;
    let lastParity = null;
    let maxStreak = 1;
    
    for (let digit of recent) {
        const isEven = digit % 2 === 0;
        if (isEven) evenCount++;
        else oddCount++;
        
        if (lastParity !== null) {
            if (isEven === lastParity) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }
        lastParity = isEven;
    }
    
    const total = evenCount + oddCount;
    const evenRatio = evenCount / total;
    const oddRatio = oddCount / total;
    
    let prediction = null;
    let confidence = 0;
    
    // Check for dominance
    if (evenRatio > config.dominanceThreshold && maxStreak < config.streakThreshold) {
        prediction = 'EVEN';
        confidence = Math.round(evenRatio * 100);
    } else if (oddRatio > config.dominanceThreshold && maxStreak < config.streakThreshold) {
        prediction = 'ODD';
        confidence = Math.round(oddRatio * 100);
    }
    
    // Check for streak reversal opportunity
    if (maxStreak >= config.streakThreshold) {
        const lastDigit = recent[recent.length - 1];
        const lastIsEven = lastDigit % 2 === 0;
        prediction = lastIsEven ? 'ODD' : 'EVEN';
        confidence = 70;
    }
    
    if (!prediction || confidence < 55) return null;
    
    return {
        type: 'even_odd',
        prediction: prediction,
        confidence: confidence,
        strength: Math.min(5, Math.floor(confidence / 20))
    };
}

function generateMatchesDiffersSignal() {
    const config = SIGNAL_CONFIG.matches_differs;
    if (reefDigitWindow.length < config.minTicks) return null;
    
    // Calculate digit frequencies
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    
    // Find most likely digit to match
    let maxCount = 0;
    let predictedDigit = -1;
    
    for (let i = 0; i <= 9; i++) {
        const probability = counts[i] / reefDigitWindow.length;
        if (probability > config.probabilityThreshold && counts[i] > config.minOccurrence) {
            if (counts[i] > maxCount) {
                maxCount = counts[i];
                predictedDigit = i;
            }
        }
    }
    
    if (predictedDigit === -1) return null;
    
    const confidence = Math.round((maxCount / reefDigitWindow.length) * 100);
    
    return {
        type: 'matches_differs',
        prediction: 'MATCHES',
        targetDigit: predictedDigit,
        confidence: confidence,
        strength: Math.min(5, Math.floor(confidence / 20))
    };
}

function generateOverUnderSignal() {
    const config = SIGNAL_CONFIG.over_under;
    if (reefDigitWindow.length < config.minTicks) return null;
    
    const recent = reefDigitWindow.slice(-50);
    let overCount = 0;  // digits > 4 (5,6,7,8,9)
    let underCount = 0; // digits < 5 (0,1,2,3,4)
    
    for (let digit of recent) {
        if (digit > 4) overCount++;
        else underCount++;
    }
    
    const total = overCount + underCount;
    const overRatio = overCount / total;
    const underRatio = underCount / total;
    
    let prediction = null;
    let confidence = 0;
    let targetDigit = null;
    
    // For OVER: use digit 4 as threshold (predict digit will be > 4)
    if (overRatio > config.dominanceThreshold) {
        prediction = 'OVER';
        targetDigit = 4;
        confidence = Math.round(overRatio * 100);
    }
    // For UNDER: use digit 5 as threshold (predict digit will be < 5)
    else if (underRatio > config.dominanceThreshold) {
        prediction = 'UNDER';
        targetDigit = 5;
        confidence = Math.round(underRatio * 100);
    }
    
    if (!prediction || confidence < 60) return null;
    
    return {
        type: 'over_under',
        prediction: prediction,
        targetDigit: targetDigit,
        confidence: confidence,
        strength: Math.min(5, Math.floor(confidence / 20))
    };
}

function displaySignal(signal) {
    const display = document.getElementById('signal-display');
    const status = document.getElementById('signal-status');
    const strengthDiv = document.getElementById('signal-strength');
    
    let html = '';
    let statusClass = 'ready';
    let statusText = 'SIGNAL ACTIVE - EXECUTE TRADE';
    
    if (signal.type === 'rise_fall') {
        const isRise = signal.prediction === 'RISE';
        html = `
            <div class="signal-box ${isRise ? 'rise' : 'fall'}">
                <div class="signal-label">PREDICTION</div>
                <div class="signal-value">${signal.prediction}</div>
                <div class="signal-confidence">${signal.confidence}% Confidence</div>
            </div>
        `;
    } else if (signal.type === 'even_odd') {
        const isEven = signal.prediction === 'EVEN';
        html = `
            <div class="signal-box ${isEven ? 'even' : 'odd'}">
                <div class="signal-label">PREDICTION</div>
                <div class="signal-value">${signal.prediction}</div>
                <div class="signal-confidence">${signal.confidence}% Confidence</div>
            </div>
        `;
    } else if (signal.type === 'matches_differs') {
        html = `
            <div class="signal-box matches">
                <div class="signal-label">MATCH DIGIT</div>
                <div class="prediction-digit">${signal.targetDigit}</div>
                <div class="signal-confidence">${signal.confidence}% Confidence</div>
            </div>
        `;
    } else if (signal.type === 'over_under') {
        const isOver = signal.prediction === 'OVER';
        html = `
            <div class="signal-box ${isOver ? 'over' : 'under'}">
                <div class="signal-label">${signal.prediction} ${signal.targetDigit}</div>
                <div class="signal-value">${signal.prediction}</div>
                <div class="signal-confidence">${signal.confidence}% Confidence</div>
            </div>
        `;
    }
    
    display.innerHTML = html;
    
    // Build strength bars
    let strengthHtml = '';
    for (let i = 0; i < 5; i++) {
        strengthHtml += `<div class="strength-bar ${i < signal.strength ? 'active' : ''}"></div>`;
    }
    strengthDiv.innerHTML = strengthHtml;
    
    status.className = `signal-status ${statusClass}`;
    status.textContent = statusText;
    
    // Update timer
    updateSignalTimer();
}

function displayNoSignal() {
    const display = document.getElementById('signal-display');
    const status = document.getElementById('signal-status');
    const strengthDiv = document.getElementById('signal-strength');
    
    let analyzingText = 'Analyzing Market...';
    let progress = '';
    
    if (currentMode === 'rise_fall') {
        progress = `${priceHistory.length}/${SIGNAL_CONFIG.rise_fall.minTicks} ticks`;
    } else {
        progress = `${reefDigitWindow.length}/${SIGNAL_CONFIG[currentMode].minTicks} ticks`;
    }
    
    display.innerHTML = `
        <div class="signal-box" style="border: 2px solid #444;">
            <div class="signal-label">${analyzingText}</div>
            <div class="signal-value" style="font-size: 18px;">${progress}</div>
        </div>
    `;
    
    strengthDiv.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        strengthDiv.innerHTML += `<div class="strength-bar"></div>`;
    }
    
    status.className = 'signal-status waiting';
    status.textContent = 'Gathering data for signal generation...';
}

function updateSignalTimer() {
    const timer = document.getElementById('signal-timer');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    timer.textContent = timeStr;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
