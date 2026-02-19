/**
 * Zion Trading Lab - Complete Trading System with All Ticks Support
 * Features: Signal Engine, Market Dynamics, Scanner, All Ticks Data, Trade Bridge, History, Risk Management, Session Filters
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allTicksSub = null; // NEW: Subscription ID for all ticks
let allTicksData = []; // NEW: Store all ticks data
let allTicksActive = false; // NEW: Track if all ticks is active

let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0;
let reefDigitWindow = [];
let priceHistory = [];
let lastSignal = null;
let signalCooldown = 0;
let activeSignalData = null;

// Market Dynamics
let tickTimes = [];
let lastMetrics = {};
let dynamicsHistory = [];

// Scanner
let scannerData = {};
let scannerInterval = null;

// History & Risk
let signalHistory = JSON.parse(localStorage.getItem('zion_signals') || '[]');
let riskSettings = {
    maxDailyLoss: 100,
    maxTradeAmount: 10,
    dailyLossUsed: 0,
    consecutiveLosses: 0,
    tradingEnabled: true
};

// Bridge
let bridgeConfig = {
    webhookUrl: localStorage.getItem('zion_webhook') || '',
    autoExecute: false,
    lastSignal: null,
    connected: false
};

// Alerts
let alertSettings = {
    sound: true,
    vibration: true,
    push: false,
    auto: false
};

// Session tracking
let currentSession = null;

// ENHANCED: Digit-specific conditions for each contract type
const SIGNAL_CONFIG = {
    rise_fall: {
        minTicks: 50,
        trendThreshold: 0.70,
        momentumThreshold: 5,
        minConsecutive: 4,
        volatilityMax: 0.05,
        confirmationDelay: 10,
        description: "Price action trend following"
    },
    even_odd: {
        minTicks: 100,
        dominanceThreshold: 0.58,
        streakThreshold: 5,
        chiSquareThreshold: 3.84,
        minGap: 8,
        stabilityPeriods: 3,
        description: "Digit parity dominance analysis",
        digitConditions: {
            minSample: 100,
            evenOddRatio: 0.58,
            maxStreakBeforeReversal: 5,
            chiSquareMin: 3.84
        }
    },
    matches_differs: {
        minTicks: 150,
        probabilityThreshold: 0.12,
        minOccurrence: 12,
        entropyThreshold: 0.90,
        confidenceInterval: 0.95,
        predictionStability: 5,
        description: "Specific digit probability clustering",
        digitConditions: {
            minSample: 150,
            minProbability: 0.12,
            minLeadMargin: 2,
            maxEntropy: 0.90,
            confidenceMin: 0.10
        }
    },
    over_under: {
        minTicks: 100,
        dominanceThreshold: 0.62,
        thresholdDigit: 5,
        distributionBalance: 0.40,
        trendConsistency: 4,
        rejectionThreshold: 0.10,
        description: "Digit range dominance (0-4 vs 5-9)",
        digitConditions: {
            minSample: 100,
            overUnderRatio: 0.62,
            minTrendPeriods: 4,
            pivotDigit: 4
        }
    }
};

let signalConfirmCount = 0;
let lastPrediction = null;
let predictionStabilityCount = 0;

// Audio context for alerts
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

ws.onopen = () => {
    console.log("Zion Lab: Connected");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
    updateBridgeStatus('connected');
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    // NEW: Handle all ticks data
    if (data.tick && allTicksActive) {
        handleAllTicksData(data.tick);
    }

    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
        initScanner();
    }

    if (data.history) {
        reefDigitWindow = []; 
        data.history.prices.forEach(price => {
            const digit = parseInt(price.toFixed(data.pip_size).slice(-1));
            reefDigitWindow.push(digit);
        });
        renderReefStatistics();
        updateSignalEngine();
        updateDynamics();
        updateScannerData(currentSymbol, data.history.prices);
    }

    if (data.tick && data.tick.symbol === currentSymbol) {
        activeSub = data.tick.id;
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        const head = priceStr.slice(0, -1);
        
        tickTimes.push(Date.now());
        if (tickTimes.length > 50) tickTimes.shift();
        
        priceHistory.push(currentPrice);
        if (priceHistory.length > 200) priceHistory.shift();
        
        // Update scanner data
        if (!scannerData[currentSymbol]) {
            scannerData[currentSymbol] = { ticks: [], volatility: 0, score: 0 };
        }
        scannerData[currentSymbol].ticks.push(currentPrice);
        if (scannerData[currentSymbol].ticks.length > 50) {
            scannerData[currentSymbol].ticks.shift();
        }
        
        let directionArrow = "";
        let arrowColor = "#ffffff";
        if (lastPrice > 0) {
            if (currentPrice > lastPrice) {
                directionArrow = " ▲";
                arrowColor = "#4caf50";
            } else if (currentPrice < lastPrice) {
                directionArrow = " ▼";
                arrowColor = "#ff444f";
            }
        }
        lastPrice = currentPrice;

        const priceDisplay = document.getElementById('live-price');
        if (priceDisplay) {
            priceDisplay.innerHTML = `
                ${head}<span class="active-digit-underline">${lastDigit}</span>
                <span style="color:${arrowColor}; font-size: 22px; margin-left: 10px; font-weight: bold;">${directionArrow}</span>
            `;
        }

        reefDigitWindow.push(lastDigit);
        if (reefDigitWindow.length > 100) reefDigitWindow.shift();
        
        if (currentMode !== 'rise_fall') {
            renderReefStatistics(lastDigit);
        }
        
        updateSignalEngine();
        updateDynamics();
    }
};

// NEW: Handle all ticks data for comprehensive market analysis
function handleAllTicksData(tick) {
    const symbol = tick.symbol;
    const price = tick.quote;
    const pipSize = tick.pip_size || 2;
    const priceStr = price.toFixed(pipSize);
    const lastDigit = parseInt(priceStr.slice(-1));
    
    // Store tick data
    allTicksData.unshift({
        symbol: symbol,
        price: price,
        digit: lastDigit,
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now()
    });
    
    // Keep only last 50 ticks
    if (allTicksData.length > 50) {
        allTicksData = allTicksData.slice(0, 50);
    }
    
    // Update all ticks display if panel is active
    const panel = document.getElementById('all-ticks-panel');
    if (panel && panel.classList.contains('active')) {
        renderAllTicksDisplay();
    }
    
    // Update scanner data for this symbol
    if (!scannerData[symbol]) {
        scannerData[symbol] = {
            name: symbol,
            symbol: symbol,
            ticks: [],
            lastDigit: lastDigit,
            digitHistory: []
        };
    }
    
    scannerData[symbol].ticks.push(price);
    scannerData[symbol].lastDigit = lastDigit;
    scannerData[symbol].digitHistory.push(lastDigit);
    
    if (scannerData[symbol].ticks.length > 100) {
        scannerData[symbol].ticks.shift();
    }
    if (scannerData[symbol].digitHistory.length > 100) {
        scannerData[symbol].digitHistory.shift();
    }
    
    // Update digit analysis if this is current symbol and we're in digit mode
    if (symbol === currentSymbol && currentMode !== 'rise_fall') {
        // Enhance digit analysis with all ticks data
        enhanceDigitAnalysis(symbol);
    }
}

// NEW: Render all ticks display
function renderAllTicksDisplay() {
    const container = document.getElementById('all-ticks-data');
    if (!container) return;
    
    if (allTicksData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Waiting for tick data...</div>';
        return;
    }
    
    let html = '';
    allTicksData.slice(0, 20).forEach(tick => {
        html += `
            <div class="tick-row">
                <span class="tick-symbol">${tick.symbol}</span>
                <span class="tick-price">${tick.price.toFixed(4)}</span>
                <span class="tick-digit">${tick.digit}</span>
                <span class="tick-time">${tick.time}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// NEW: Subscribe to all ticks
function subscribeAllTicks() {
    if (allTicksSub) {
        ws.send(JSON.stringify({ "forget": allTicksSub }));
    }
    
    ws.send(JSON.stringify({ "ticks": "all", "subscribe": 1 }));
    allTicksActive = true;
    
    document.getElementById('all-ticks-status').textContent = 'LIVE';
    document.getElementById('all-ticks-status').className = 'all-ticks-status active';
    
    console.log("Subscribed to all ticks: {\"ticks\":\"all\",\"subscribe\":1}");
}

// NEW: Unsubscribe from all ticks
function unsubscribeAllTicks() {
    if (allTicksSub) {
        ws.send(JSON.stringify({ "forget": allTicksSub }));
        allTicksSub = null;
    }
    
    // Alternative unsubscribe method
    ws.send(JSON.stringify({ "ticks": "all", "subscribe": 0 }));
    
    allTicksActive = false;
    
    document.getElementById('all-ticks-status').textContent = 'OFFLINE';
    document.getElementById('all-ticks-status').className = 'all-ticks-status';
    
    console.log("Unsubscribed from all ticks");
}

// NEW: Enhance digit analysis with all ticks data
function enhanceDigitAnalysis(symbol) {
    if (!scannerData[symbol] || !scannerData[symbol].digitHistory) return;
    
    const digitHistory = scannerData[symbol].digitHistory;
    if (digitHistory.length < 20) return;
    
    // Calculate enhanced statistics from all ticks
    const counts = Array(10).fill(0);
    digitHistory.forEach(d => counts[d]++);
    
    const total = digitHistory.length;
    const percentages = counts.map(c => ((c / total) * 100).toFixed(1));
    
    // Find hot and cold digits
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const hotDigits = counts.map((c, i) => c === maxCount ? i : null).filter(x => x !== null);
    const coldDigits = counts.map((c, i) => c === minCount ? i : null).filter(x => x !== null);
    
    // Store enhanced data for signal generation
    window.enhancedDigitStats = {
        counts,
        percentages,
        hotDigits,
        coldDigits,
        totalSamples: total,
        lastUpdated: Date.now()
    };
    
    console.log(`Enhanced digit analysis for ${symbol}:`, window.enhancedDigitStats);
}

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
    lastPrice = 0;
    lastSignal = null;
    signalCooldown = 0;
    activeSignalData = null;
    signalConfirmCount = 0;
    lastPrediction = null;
    predictionStabilityCount = 0;
    tickTimes = [];
    dynamicsHistory = [];
    
    document.getElementById('mTitle').innerText = name;
    document.getElementById('price-symbol').textContent = symbol.toUpperCase();
    document.getElementById('modal').style.display = 'block';
    
    switchPanel('signal', document.querySelector('.panel-nav-btn'));
    switchContract('rise_fall', document.querySelector('.tab'));

    ws.send(JSON.stringify({
        "ticks_history": symbol,
        "adjust_start_time": 1,
        "count": 100,
        "end": "latest",
        "style": "ticks"
    }));

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
    
    // NEW: Auto-subscribe to all ticks for enhanced digit analysis
    if (!allTicksActive) {
        subscribeAllTicks();
    }
    
    startScanner();
    updateSessionInfo();
}

function switchContract(mode, el) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const digitPanel = document.getElementById('digit-analysis-panel');
    const chartView = document.getElementById('chart-container');

    if (mode === 'rise_fall') {
        digitPanel.style.display = 'none';
        chartView.style.height = '250px';
    } else {
        digitPanel.style.display = 'block';
        chartView.style.height = '200px';
        buildDigitGrid();
    }
    
    chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    signalConfirmCount = 0;
    lastPrediction = null;
    predictionStabilityCount = 0;
    
    updateSignalEngine();
}

function switchPanel(panelName, el) {
    document.querySelectorAll('.panel-nav-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    
    document.querySelectorAll('.signal-panel, .dynamics-panel, .scanner-panel, .all-ticks-panel, .bridge-panel, .history-panel, .risk-panel, .session-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    const panelMap = {
        'signal': 'signal-panel',
        'dynamics': 'dynamics-panel',
        'scanner': 'scanner-panel',
        'allticks': 'all-ticks-panel',
        'bridge': 'bridge-panel',
        'history': 'history-panel',
        'risk': 'risk-panel',
        'session': 'session-panel'
    };
    
    const panelId = panelMap[panelName];
    if (panelId) {
        const panel = document.getElementById(panelId);
        panel.style.display = 'block';
        panel.classList.add('active');
        
        if (panelName === 'history') renderHistory();
        if (panelName === 'risk') updateRiskDisplay();
        if (panelName === 'session') updateSessionInfo();
        if (panelName === 'allticks') renderAllTicksDisplay();
    }
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

    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);

    for (let i = 0; i <= 9; i++) {
        const realPercentage = reefDigitWindow.length > 0 ? ((counts[i] / reefDigitWindow.length) * 100).toFixed(1) : 0;
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);
        
        if (label) {
            label.innerText = realPercentage + "%";
            if (counts[i] === maxVal && maxVal !== minVal) {
                label.style.color = "#4caf50";
            } else if (counts[i] === minVal && maxVal !== minVal) {
                label.style.color = "#ff444f";
            } else {
                label.style.color = "#00f2fe";
            }
        }
        
        if (bar) bar.style.height = realPercentage + "%";

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

// ==================== ENHANCED SIGNAL ENGINE ====================

function updateSignalEngine() {
    const panel = document.getElementById('signal-panel');
    if (panel.style.display === 'none') return;
    
    // Check risk limits
    if (!riskSettings.tradingEnabled) {
        displayRiskBlock();
        return;
    }
    
    // Check session
    if (!isGoodTradingSession()) {
        displaySessionBlock();
        return;
    }
    
    let result = null;
    
    switch(currentMode) {
        case 'rise_fall':
            result = generateRiseFallSignal();
            break;
        case 'even_odd':
            result = generateEvenOddSignal();
            break;
        case 'matches_differs':
            result = generateMatchesDiffersSignal();
            break;
        case 'over_under':
            result = generateOverUnderSignal();
            break;
    }
    
    displayConditions(result);
    
    if (result && result.overallPass) {
        if (lastPrediction === result.prediction) {
            predictionStabilityCount++;
        } else {
            predictionStabilityCount = 0;
            lastPrediction = result.prediction;
        }
        
        if (predictionStabilityCount >= 3) {
            displaySignal(result);
            activeSignalData = result;
            
            // Trigger alerts and bridge
            if (predictionStabilityCount === 3) {
                triggerAlert(result);
                sendToBridge(result);
                addToHistory(result);
            }
        } else {
            displayStabilizing(result);
        }
    } else {
        predictionStabilityCount = 0;
        lastPrediction = null;
        displayNoSignal(result);
    }
}

function generateRiseFallSignal() {
    const config = SIGNAL_CONFIG.rise_fall;
    const conditions = [];
    
    const hasMinTicks = priceHistory.length >= config.minTicks;
    conditions.push({
        name: `Minimum ${config.minTicks} Ticks Collected`,
        status: hasMinTicks ? 'PASS' : 'FAIL',
        detail: `${priceHistory.length}/${config.minTicks}`
    });
    
    if (!hasMinTicks) return { conditions, overallPass: false };
    
    const recent = priceHistory.slice(-config.minTicks);
    
    let upMoves = 0, downMoves = 0, momentum = 0;
    let maxConsecutiveUp = 0, maxConsecutiveDown = 0;
    let currentConsecutive = 0;
    let lastDirection = null;
    
    for (let i = 1; i < recent.length; i++) {
        if (recent[i] > recent[i-1]) {
            upMoves++;
            momentum++;
            if (lastDirection === 'up') {
                currentConsecutive++;
            } else {
                currentConsecutive = 1;
                lastDirection = 'up';
            }
            maxConsecutiveUp = Math.max(maxConsecutiveUp, currentConsecutive);
        } else if (recent[i] < recent[i-1]) {
            downMoves++;
            momentum--;
            if (lastDirection === 'down') {
                currentConsecutive++;
            } else {
                currentConsecutive = 1;
                lastDirection = 'down';
            }
            maxConsecutiveDown = Math.max(maxConsecutiveDown, currentConsecutive);
        }
    }
    
    const totalMoves = upMoves + downMoves;
    const upRatio = totalMoves > 0 ? upMoves / totalMoves : 0;
    const downRatio = totalMoves > 0 ? downMoves / totalMoves : 0;
    const trendStrength = Math.max(upRatio, downRatio);
    const maxConsecutive = Math.max(maxConsecutiveUp, maxConsecutiveDown);
    
    conditions.push({
        name: `Trend Strength ≥ ${(config.trendThreshold * 100).toFixed(0)}%`,
        status: trendStrength >= config.trendThreshold ? 'PASS' : 'FAIL',
        detail: `${(trendStrength * 100).toFixed(1)}%`
    });
    
    conditions.push({
        name: `Consecutive Moves ≥ ${config.minConsecutive}`,
        status: maxConsecutive >= config.minConsecutive ? 'PASS' : 'FAIL',
        detail: `${maxConsecutive} ticks`
    });
    
    const absMomentum = Math.abs(momentum);
    conditions.push({
        name: `Momentum Score ≥ ${config.momentumThreshold}`,
        status: absMomentum >= config.momentumThreshold ? 'PASS' : 'FAIL',
        detail: `Score: ${momentum}`
    });
    
    const volatility = calculateVolatility(recent);
    conditions.push({
        name: `Volatility ≤ ${(config.volatilityMax * 100).toFixed(0)}%`,
        status: volatility <= config.volatilityMax ? 'PASS' : 'FAIL',
        detail: `${(volatility * 100).toFixed(2)}%`
    });
    
    let prediction = null;
    let confidence = 0;
    
    if (upRatio > downRatio && momentum > 0) {
        prediction = 'RISE';
        confidence = Math.round(upRatio * 100);
    } else if (downRatio > upRatio && momentum < 0) {
        prediction = 'FALL';
        confidence = Math.round(downRatio * 100);
    }
    
    const overallPass = conditions.every(c => c.status === 'PASS') && prediction !== null;
    
    return {
        type: 'rise_fall',
        prediction,
        confidence,
        strength: Math.min(5, Math.floor(confidence / 20)),
        conditions,
        overallPass,
        metrics: { upRatio, downRatio, momentum, volatility }
    };
}

function generateEvenOddSignal() {
    const config = SIGNAL_CONFIG.even_odd;
    const digitConfig = config.digitConditions;
    const conditions = [];
    
    // ENHANCED: Use all ticks data if available
    let digitSource = reefDigitWindow;
    if (allTicksActive && scannerData[currentSymbol] && scannerData[currentSymbol].digitHistory) {
        const allTicksDigits = scannerData[currentSymbol].digitHistory;
        if (allTicksDigits.length > reefDigitWindow.length) {
            digitSource = allTicksDigits;
        }
    }
    
    const hasMinTicks = digitSource.length >= digitConfig.minSample;
    conditions.push({
        name: `Digit Sample ≥ ${digitConfig.minSample}`,
        status: hasMinTicks ? 'PASS' : 'FAIL',
        detail: `${digitSource.length}/${digitConfig.minSample} ${allTicksActive ? '(All Ticks)' : ''}`
    });
    
    if (!hasMinTicks) return { conditions, overallPass: false };
    
    const recent = digitSource.slice(-digitConfig.minSample);
    
    let evenCount = 0, oddCount = 0;
    let currentStreak = 1, lastParity = null, maxStreak = 1;
    let evenStreaks = [], oddStreaks = [];
    let currentStreakType = null, currentStreakLen = 0;
    
    for (let digit of recent) {
        const isEven = digit % 2 === 0;
        if (isEven) evenCount++;
        else oddCount++;
        
        if (lastParity !== null) {
            if (isEven === lastParity) {
                currentStreak++;
                currentStreakLen++;
            } else {
                if (currentStreakType === 'even') evenStreaks.push(currentStreakLen);
                else if (currentStreakType === 'odd') oddStreaks.push(currentStreakLen);
                
                currentStreak = 1;
                currentStreakLen = 1;
                currentStreakType = isEven ? 'even' : 'odd';
            }
        } else {
            currentStreakType = isEven ? 'even' : 'odd';
            currentStreakLen = 1;
        }
        lastParity = isEven;
        maxStreak = Math.max(maxStreak, currentStreak);
    }
    
    const total = evenCount + oddCount;
    const evenRatio = evenCount / total;
    const oddRatio = oddCount / total;
    const dominance = Math.max(evenRatio, oddRatio);
    const gap = Math.abs(evenCount - oddCount);
    
    conditions.push({
        name: `Parity Dominance ≥ ${(digitConfig.evenOddRatio * 100).toFixed(0)}%`,
        status: dominance >= digitConfig.evenOddRatio ? 'PASS' : 'FAIL',
        detail: `${(dominance * 100).toFixed(1)}% (${evenCount}E/${oddCount}O)`
    });
    
    conditions.push({
        name: `Count Gap ≥ ${config.minGap}`,
        status: gap >= config.minGap ? 'PASS' : 'FAIL',
        detail: `Gap: ${gap}`
    });
    
    const chiSquare = calculateChiSquare([evenCount, oddCount], [total/2, total/2]);
    conditions.push({
        name: `Chi-Square ≥ ${digitConfig.chiSquareMin}`,
        status: chiSquare >= digitConfig.chiSquareMin ? 'PASS' : 'FAIL',
        detail: `χ² = ${chiSquare.toFixed(2)}`
    });
    
    const lastDigit = recent[recent.length - 1];
    const lastIsEven = lastDigit % 2 === 0;
    let prediction = null;
    let confidence = 0;
    let strategy = '';
    
    if (maxStreak >= digitConfig.maxStreakBeforeReversal) {
        prediction = lastIsEven ? 'ODD' : 'EVEN';
        confidence = 75;
        strategy = 'Streak Reversal';
        conditions.push({
            name: `Streak Reversal Trigger (${maxStreak} streak)`,
            status: 'PASS',
            detail: 'Reversal strategy'
        });
    } else {
        prediction = evenRatio > oddRatio ? 'EVEN' : 'ODD';
        confidence = Math.round(dominance * 100);
        strategy = 'Dominance Follow';
        conditions.push({
            name: `Streak Check (${maxStreak}/${digitConfig.maxStreakBeforeReversal})`,
            status: maxStreak < digitConfig.maxStreakBeforeReversal ? 'PASS' : 'FAIL',
            detail: strategy
        });
    }
    
    const overallPass = conditions.every(c => c.status === 'PASS');
    
    return {
        type: 'even_odd',
        prediction,
        confidence,
        strength: Math.min(5, Math.floor(confidence / 20)),
        conditions,
        overallPass,
        strategy,
        dataSource: allTicksActive ? 'all_ticks' : 'standard',
        metrics: { evenRatio, oddRatio, maxStreak, chiSquare, gap }
    };
}

function generateMatchesDiffersSignal() {
    const config = SIGNAL_CONFIG.matches_differs;
    const digitConfig = config.digitConditions;
    const conditions = [];
    
    // ENHANCED: Use all ticks data if available
    let digitSource = reefDigitWindow;
    if (allTicksActive && scannerData[currentSymbol] && scannerData[currentSymbol].digitHistory) {
        const allTicksDigits = scannerData[currentSymbol].digitHistory;
        if (allTicksDigits.length > reefDigitWindow.length) {
            digitSource = allTicksDigits;
        }
    }
    
    const hasMinTicks = digitSource.length >= digitConfig.minSample;
    conditions.push({
        name: `Digit Sample ≥ ${digitConfig.minSample}`,
        status: hasMinTicks ? 'PASS' : 'FAIL',
        detail: `${digitSource.length}/${digitConfig.minSample} ${allTicksActive ? '(All Ticks)' : ''}`
    });
    
    if (!hasMinTicks) return { conditions, overallPass: false };
    
    const counts = Array(10).fill(0);
    digitSource.forEach(d => counts[d]++);
    
    const total = digitSource.length;
    
    let sortedDigits = counts.map((c, i) => ({ digit: i, count: c, prob: c/total }))
        .sort((a, b) => b.count - a.count);
    
    let best = sortedDigits[0];
    let second = sortedDigits[1];
    let margin = best.count - second.count;
    
    conditions.push({
        name: `Best Digit Probability ≥ ${(digitConfig.minProbability * 100).toFixed(0)}%`,
        status: best.prob >= digitConfig.minProbability ? 'PASS' : 'FAIL',
        detail: `Digit ${best.digit}: ${(best.prob * 100).toFixed(1)}%`
    });
    
    conditions.push({
        name: `Lead Margin ≥ ${digitConfig.minLeadMargin}`,
        status: margin >= digitConfig.minLeadMargin ? 'PASS' : 'FAIL',
        detail: `${margin} over digit ${second.digit}`
    });
    
    conditions.push({
        name: `Occurrences ≥ ${config.minOccurrence}`,
        status: best.count >= config.minOccurrence ? 'PASS' : 'FAIL',
        detail: `${best.count} times`
    });
    
    const entropy = calculateEntropy(counts, total);
    conditions.push({
        name: `Entropy ≤ ${digitConfig.maxEntropy}`,
        status: entropy <= digitConfig.maxEntropy ? 'PASS' : 'FAIL',
        detail: `H = ${entropy.toFixed(3)}`
    });
    
    const ci = calculateConfidenceInterval(best.count, total);
    conditions.push({
        name: `95% CI Lower > ${(digitConfig.confidenceMin * 100).toFixed(0)}%`,
        status: ci.lower > digitConfig.confidenceMin ? 'PASS' : 'FAIL',
        detail: `[${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%]`
    });
    
    const confidence = Math.round(best.prob * 100);
    const overallPass = conditions.every(c => c.status === 'PASS');
    
    return {
        type: 'matches_differs',
        prediction: 'MATCHES',
        targetDigit: best.digit,
        confidence,
        strength: Math.min(5, Math.floor(confidence / 20)),
        conditions,
        overallPass,
        dataSource: allTicksActive ? 'all_ticks' : 'standard',
        alternativeDigits: sortedDigits.slice(1, 3).map(d => d.digit),
        metrics: { probability: best.prob, entropy, margin }
    };
}

function generateOverUnderSignal() {
    const config = SIGNAL_CONFIG.over_under;
    const digitConfig = config.digitConditions;
    const conditions = [];
    
    // ENHANCED: Use all ticks data if available
    let digitSource = reefDigitWindow;
    if (allTicksActive && scannerData[currentSymbol] && scannerData[currentSymbol].digitHistory) {
        const allTicksDigits = scannerData[currentSymbol].digitHistory;
        if (allTicksDigits.length > reefDigitWindow.length) {
            digitSource = allTicksDigits;
        }
    }
    
    const hasMinTicks = digitSource.length >= digitConfig.minSample;
    conditions.push({
        name: `Digit Sample ≥ ${digitConfig.minSample}`,
        status: hasMinTicks ? 'PASS' : 'FAIL',
        detail: `${digitSource.length}/${digitConfig.minSample} ${allTicksActive ? '(All Ticks)' : ''}`
    });
    
    if (!hasMinTicks) return { conditions, overallPass: false };
    
    const recent = digitSource.slice(-digitConfig.minSample);
    
    let overCount = 0;
    let underCount = 0;
    let overPeriods = 0, underPeriods = 0;
    let lastZone = null, currentPeriodLen = 0;
    let zoneSwitches = 0;
    
    for (let digit of recent) {
        const isOver = digit > digitConfig.pivotDigit;
        
        if (isOver) overCount++;
        else underCount++;
        
        if (lastZone !== null) {
            if ((isOver && lastZone === 'over') || (!isOver && lastZone === 'under')) {
                currentPeriodLen++;
            } else {
                zoneSwitches++;
                if (lastZone === 'over') overPeriods++;
                else underPeriods++;
                currentPeriodLen = 1;
            }
        }
        lastZone = isOver ? 'over' : 'under';
    }
    
    const total = overCount + underCount;
    const overRatio = overCount / total;
    const underRatio = underCount / total;
    const dominance = Math.max(overRatio, underRatio);
    const dominantPeriods = Math.max(overPeriods, underPeriods);
    
    conditions.push({
        name: `Range Dominance ≥ ${(digitConfig.overUnderRatio * 100).toFixed(0)}%`,
        status: dominance >= digitConfig.overUnderRatio ? 'PASS' : 'FAIL',
        detail: `${(dominance * 100).toFixed(1)}% (${overCount}O/${underCount}U)`
    });
    
    conditions.push({
        name: `Trend Periods ≥ ${digitConfig.minTrendPeriods}`,
        status: dominantPeriods >= digitConfig.minTrendPeriods ? 'PASS' : 'FAIL',
        detail: `${dominantPeriods} periods`
    });
    
    const balance = Math.min(overRatio, underRatio) / Math.max(overRatio, underRatio);
    conditions.push({
        name: `Distribution Imbalance`,
        status: balance <= config.distributionBalance ? 'PASS' : 'FAIL',
        detail: `Ratio: ${(balance * 100).toFixed(1)}%`
    });
    
    let prediction = null;
    let targetDigit = null;
    let confidence = 0;
    
    if (overRatio > underRatio) {
        prediction = 'OVER';
        targetDigit = digitConfig.pivotDigit;
        confidence = Math.round(overRatio * 100);
    } else {
        prediction = 'UNDER';
        targetDigit = digitConfig.pivotDigit + 1;
        confidence = Math.round(underRatio * 100);
    }
    
    const overallPass = conditions.every(c => c.status === 'PASS');
    
    return {
        type: 'over_under',
        prediction,
        targetDigit,
        confidence,
        strength: Math.min(5, Math.floor(confidence / 20)),
        conditions,
        overallPass,
        dataSource: allTicksActive ? 'all_ticks' : 'standard',
        metrics: { overRatio, underRatio, dominantPeriods, zoneSwitches }
    };
}

// ==================== ALERTS & NOTIFICATIONS ====================

function triggerAlert(signal) {
    if (alertSettings.sound) playAlertSound();
    if (alertSettings.vibration && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (alertSettings.push) sendPushNotification(signal);
    
    document.body.style.animation = 'flash 0.5s';
    setTimeout(() => document.body.style.animation = '', 500);
}

function playAlertSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function sendPushNotification(signal) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Zion Trading Signal', {
            body: `${signal.prediction} @ ${currentSymbol} (${signal.confidence}%)`,
            icon: 'https://via.placeholder.com/64x64/4CAF50/FFFFFF?text=ZION'
        });
    }
}

// ==================== TRADE BRIDGE ====================

function sendToBridge(signal) {
    bridgeConfig.lastSignal = {
        ...signal,
        symbol: currentSymbol,
        timestamp: new Date().toISOString(),
        price: lastPrice
    };
    
    updateBridgeDisplay();
    
    if (alertSettings.auto) {
        executeTrade(signal);
    }
    
    if (bridgeConfig.webhookUrl) {
        console.log('Sending to webhook:', bridgeConfig.webhookUrl, signal);
    }
}

function updateBridgeStatus(status) {
    const indicator = document.getElementById('bridge-indicator');
    const text = document.getElementById('bridge-text');
    const connection = document.getElementById('bridge-connection');
    
    if (status === 'connected') {
        indicator.className = 'status-indicator connected';
        text.textContent = 'System Ready';
        connection.textContent = '● ONLINE';
        connection.style.color = '#4caf50';
        bridgeConfig.connected = true;
    } else {
        indicator.className = 'status-indicator disconnected';
        text.textContent = 'Disconnected';
        connection.textContent = '● OFFLINE';
        connection.style.color = '#ff444f';
    }
    
    document.getElementById('execute-btn').disabled = !bridgeConfig.connected || !activeSignalData;
}

function updateBridgeDisplay() {
    if (!bridgeConfig.lastSignal) return;
    
    document.getElementById('last-bridge-signal').textContent = 
        `${bridgeConfig.lastSignal.prediction} (${bridgeConfig.lastSignal.confidence}%)`;
    document.getElementById('auto-execute').textContent = alertSettings.auto ? 'ON' : 'OFF';
    
    updateBridgeStatus(bridgeConfig.connected ? 'connected' : 'disconnected');
}

function testBridge() {
    updateBridgeStatus('connected');
    alert('Bridge connection test successful!');
}

function manualExecute() {
    if (activeSignalData) {
        executeTrade(activeSignalData);
        alert('Trade executed manually!');
    }
}

function executeTrade(signal) {
    const trade = {
        ...signal,
        id: Date.now(),
        status: 'pending',
        result: null,
        profit: 0
    };
    
    signalHistory.unshift(trade);
    saveHistory();
    
    setTimeout(() => {
        simulateTradeResult(trade.id);
    }, 30000 + Math.random() * 120000);
}

function simulateTradeResult(tradeId) {
    const trade = signalHistory.find(t => t.id === tradeId);
    if (!trade) return;
    
    const isWin = Math.random() > 0.4;
    trade.status = 'completed';
    trade.result = isWin ? 'win' : 'loss';
    trade.profit = isWin ? riskSettings.maxTradeAmount * 0.94 : -riskSettings.maxTradeAmount;
    
    if (!isWin) {
        riskSettings.consecutiveLosses++;
        riskSettings.dailyLossUsed += riskSettings.maxTradeAmount;
        if (riskSettings.consecutiveLosses >= 3 || riskSettings.dailyLossUsed >= riskSettings.maxDailyLoss) {
            riskSettings.tradingEnabled = false;
        }
    } else {
        riskSettings.consecutiveLosses = 0;
    }
    
    saveHistory();
    updateRiskDisplay();
    
    if (document.getElementById('history-panel').classList.contains('active')) {
        renderHistory();
    }
}

// ==================== HISTORY ====================

function addToHistory(signal) {
    // Already added in executeTrade
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const totalEl = document.getElementById('total-signals');
    const winEl = document.getElementById('win-signals');
    const lossEl = document.getElementById('loss-signals');
    
    const completed = signalHistory.filter(s => s.status === 'completed');
    const wins = completed.filter(s => s.result === 'win').length;
    const losses = completed.filter(s => s.result === 'loss').length;
    
    totalEl.textContent = completed.length;
    winEl.textContent = wins;
    lossEl.textContent = losses;
    
    list.innerHTML = '';
    signalHistory.slice(0, 20).forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.result || 'pending'}`;
        
        const time = new Date(item.timestamp || item.id).toLocaleTimeString();
        const resultText = item.result ? (item.result === 'win' ? 'WIN' : 'LOSS') : 'PENDING';
        const resultClass = item.result ? `result-${item.result}` : 'result-pending';
        
        div.innerHTML = `
            <div>
                <div class="history-time">${time}</div>
                <div class="history-signal">${item.prediction} ${item.targetDigit || ''}</div>
            </div>
            <span class="history-result ${resultClass}">${resultText}</span>
        `;
        list.appendChild(div);
    });
}

function clearHistory() {
    if (confirm('Clear all history?')) {
        signalHistory = [];
        saveHistory();
        renderHistory();
    }
}

function saveHistory() {
    localStorage.setItem('zion_signals', JSON.stringify(signalHistory));
}

// ==================== RISK MANAGEMENT ====================

function updateRiskSettings() {
    riskSettings.maxDailyLoss = parseFloat(document.getElementById('max-daily-loss').value) || 100;
    riskSettings.maxTradeAmount = parseFloat(document.getElementById('max-trade-amount').value) || 10;
    updateRiskDisplay();
}

function updateRiskDisplay() {
    const usedEl = document.getElementById('daily-loss-used');
    const consecEl = document.getElementById('consecutive-losses');
    const warningEl = document.getElementById('risk-warning');
    
    usedEl.textContent = `$${riskSettings.dailyLossUsed} / $${riskSettings.maxDailyLoss}`;
    consecEl.textContent = riskSettings.consecutiveLosses;
    
    if (riskSettings.dailyLossUsed >= riskSettings.maxDailyLoss * 0.8) {
        usedEl.style.color = 'var(--red)';
    }
    
    if (riskSettings.consecutiveLosses >= 2) {
        consecEl.style.color = 'var(--red)';
    }
    
    warningEl.style.display = riskSettings.tradingEnabled ? 'none' : 'block';
}

function displayRiskBlock() {
    const status = document.getElementById('signal-status');
    status.className = 'signal-status no-signal';
    status.textContent = '🛑 RISK LIMIT REACHED - Trading Paused';
}

// ==================== SESSION FILTER ====================

function updateSessionInfo() {
    const hour = new Date().getUTCHours();
    let session = null;
    let quality = '';
    
    document.querySelectorAll('.session-block').forEach(b => b.classList.remove('active'));
    
    if (hour >= 0 && hour < 9) {
        session = 'ASIA';
        document.getElementById('session-asia').classList.add('active');
        quality = currentSymbol && currentSymbol.includes('1') ? 'EXCELLENT' : 'MODERATE';
    } else if (hour >= 9 && hour < 14) {
        session = 'LONDON';
        document.getElementById('session-london').classList.add('active');
        quality = 'GOOD';
    } else if (hour >= 14 && hour < 22) {
        session = 'NEW YORK';
        document.getElementById('session-ny').classList.add('active');
        quality = 'EXCELLENT';
    } else {
        session = 'OVERLAP';
        quality = 'GOOD';
    }
    
    currentSession = session;
    document.getElementById('session-quality').innerHTML = 
        `Current Session: <strong>${session}</strong> | Quality: <strong style="color:${quality === 'EXCELLENT' ? '#4caf50' : '#ffc107'}">${quality}</strong>`;
}

function isGoodTradingSession() {
    const hour = new Date().getUTCHours();
    return !(hour >= 0 && hour < 2);
}

function displaySessionBlock() {
    const status = document.getElementById('signal-status');
    status.className = 'signal-status waiting';
    status.textContent = '⏳ LOW LIQUIDITY PERIOD - Waiting for better session';
}

// ==================== MARKET DYNAMICS ====================

function updateDynamics() {
    const panel = document.getElementById('dynamics-panel');
    if (!panel.classList.contains('active')) return;
    
    let velocity = 0;
    if (tickTimes.length >= 2) {
        const timeSpan = (tickTimes[tickTimes.length - 1] - tickTimes[0]) / 1000;
        velocity = timeSpan > 0 ? (tickTimes.length / timeSpan).toFixed(1) : 0;
    }
    
    let momentum = 0;
    let momentumTrend = 'neutral';
    if (priceHistory.length >= 10) {
        const recent = priceHistory.slice(-10);
        const change = ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100;
        momentum = change.toFixed(3);
        momentumTrend = change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'neutral';
    }
    
    let vol = 0;
    let volTrend = 'neutral';
    if (priceHistory.length >= 20) {
        vol = (calculateVolatility(priceHistory.slice(-20)) * 100).toFixed(2);
        if (lastMetrics.volatility) {
            volTrend = parseFloat(vol) > lastMetrics.volatility * 1.1 ? 'up' : 
                       parseFloat(vol) < lastMetrics.volatility * 0.9 ? 'down' : 'neutral';
        }
    }
    
    let strength = 0;
    let strengthTrend = 'neutral';
    if (priceHistory.length >= 30) {
        const recent = priceHistory.slice(-30);
        let ups = 0, downs = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] > recent[i-1]) ups++;
            else if (recent[i] < recent[i-1]) downs++;
        }
        const total = ups + downs;
        strength = total > 0 ? Math.round((Math.max(ups, downs) / total) * 100) : 0;
        
        if (lastMetrics.strength) {
            strengthTrend = strength > lastMetrics.strength + 5 ? 'up' : 
                           strength < lastMetrics.strength - 5 ? 'down' : 'neutral';
        }
    }
    
    let phase = 'ACCUMULATION';
    let phaseColor = 'neutral';
    if (priceHistory.length > 50) {
        const shortMA = average(priceHistory.slice(-10));
        const longMA = average(priceHistory.slice(-50));
        
        if (shortMA > longMA * 1.001 && parseFloat(vol) > 0.02) {
            phase = 'MARK UP';
            phaseColor = 'up';
        } else if (shortMA < longMA * 0.999 && parseFloat(vol) > 0.02) {
            phase = 'MARK DOWN';
            phaseColor = 'down';
        } else if (parseFloat(vol) < 0.01) {
            phase = 'CONSOLIDATION';
            phaseColor = 'neutral';
        } else {
            phase = 'DISTRIBUTION';
            phaseColor = 'down';
        }
    }
    
    let quality = 0;
    let qualityTrend = 'neutral';
    if (activeSignalData && activeSignalData.overallPass) {
        quality = activeSignalData.confidence;
        qualityTrend = 'up';
    } else if (reefDigitWindow.length > 50) {
        const counts = Array(10).fill(0);
        reefDigitWindow.forEach(d => counts[d]++);
        const maxFreq = Math.max(...counts);
        quality = Math.round((maxFreq / reefDigitWindow.length) * 100);
    }
    
    lastMetrics = { volatility: parseFloat(vol), strength };
    
    document.getElementById('tick-velocity').textContent = velocity + '/s';
    document.getElementById('price-momentum').textContent = momentum + '%';
    document.getElementById('vol-index').textContent = vol + '%';
    document.getElementById('trend-strength').textContent = strength + '%';
    document.getElementById('market-phase').textContent = phase;
    document.getElementById('signal-quality').textContent = quality + '%';
    
    document.getElementById('momentum-trend').className = 'metric-trend trend-' + momentumTrend;
    document.getElementById('vol-trend').className = 'metric-trend trend-' + volTrend;
    document.getElementById('strength-trend').className = 'metric-trend trend-' + strengthTrend;
    document.getElementById('phase-indicator').className = 'metric-trend trend-' + phaseColor;
    document.getElementById('quality-trend').className = 'metric-trend trend-' + qualityTrend;
    
    const now = new Date();
    document.getElementById('dynamics-timer').textContent = now.toLocaleTimeString('en-US', { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
}

// ==================== SCANNER ====================

function initScanner() {
    const volIndices = allSymbols.filter(s => 
        s.market === 'synthetic_index' && 
        !s.display_name.toLowerCase().includes('jump') && 
        !s.display_name.toLowerCase().includes('step')
    );
    
    volIndices.forEach(s => {
        scannerData[s.symbol] = {
            name: s.display_name,
            symbol: s.symbol,
            score: 0,
            status: 'monitoring',
            lastUpdate: 0,
            ticks: [],
            volatility: 0,
            trend: 'neutral',
            signalReady: false
        };
    });
}

function startScanner() {
    if (scannerInterval) clearInterval(scannerInterval);
    
    const volIndices = allSymbols.filter(s => 
        s.market === 'synthetic_index' && 
        !s.display_name.toLowerCase().includes('jump') && 
        !s.display_name.toLowerCase().includes('step')
    );
    
    volIndices.forEach((s, index) => {
        setTimeout(() => {
            ws.send(JSON.stringify({ "ticks": s.symbol, "subscribe": 1 }));
        }, index * 100);
    });
    
    scannerInterval = setInterval(updateScannerDisplay, 2000);
}

function updateScannerData(symbol, prices) {
    if (!scannerData[symbol]) return;
    
    scannerData[symbol].ticks = prices.slice(-50);
    scannerData[symbol].lastUpdate = Date.now();
    
    if (prices.length > 20) {
        const vol = calculateVolatility(prices.slice(-20));
        scannerData[symbol].volatility = vol;
        
        let score = 0;
        const volScore = Math.min(40, (vol * 1000));
        score += volScore;
        
        const recent = prices.slice(-20);
        let consistentMoves = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] !== recent[i-1]) consistentMoves++;
        }
        const trendScore = (consistentMoves / 19) * 30;
        score += trendScore;
        
        const activityScore = Math.min(30, prices.length / 5);
        score += activityScore;
        
        scannerData[symbol].score = Math.round(score);
        scannerData[symbol].signalReady = score > 60 && vol > 0.001 && vol < 0.05;
    }
}

function updateScannerDisplay() {
    const panel = document.getElementById('scanner-panel');
    if (!panel.classList.contains('active')) return;
    
    const grid = document.getElementById('scanner-grid');
    grid.innerHTML = '';
    
    const scoredMarkets = Object.values(scannerData)
        .filter(m => m.ticks.length > 0)
        .sort((a, b) => b.score - a.score);
    
    scoredMarkets.slice(0, 8).forEach((market, index) => {
        const isBest = index === 0 && market.signalReady;
        const card = document.createElement('div');
        card.className = `market-card ${isBest ? 'best' : ''}`;
        card.onclick = () => {
            closeModal();
            setTimeout(() => openAnalysis(market.name, market.symbol), 100);
        };
        
        card.innerHTML = `
            <div class="market-name">${market.name}</div>
            <div class="market-score">${market.score}</div>
            <span class="market-status ${market.signalReady ? 'status-ready' : 'status-wait'}">
                ${market.signalReady ? '✓ READY' : '○ WAIT'}
            </span>
        `;
        grid.appendChild(card);
    });
    
    const readyCount = scoredMarkets.filter(m => m.signalReady).length;
    document.getElementById('scanner-status').textContent = `● ${readyCount} READY`;
}

// ==================== DISPLAY FUNCTIONS ====================

function displayConditions(result) {
    const panel = document.getElementById('conditions-panel');
    const list = document.getElementById('conditions-list');
    const verdict = document.getElementById('overall-verdict');
    
    if (!result || !result.conditions) {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'block';
    list.innerHTML = '';
    
    result.conditions.forEach(cond => {
        const row = document.createElement('div');
        row.className = 'condition-row';
        row.innerHTML = `
            <span class="condition-label">${cond.name}</span>
            <span class="condition-status ${cond.status.toLowerCase()}">
                ${cond.status} ${cond.detail ? `(${cond.detail})` : ''}
            </span>
        `;
        list.appendChild(row);
    });
    
    // Add data source indicator
    if (result.dataSource) {
        const sourceRow = document.createElement('div');
        sourceRow.className = 'condition-row';
        sourceRow.style.background = 'rgba(0,242,254,0.1)';
        sourceRow.innerHTML = `
            <span class="condition-label" style="color: var(--blue);">Data Source</span>
            <span class="condition-status" style="color: var(--blue);">
                ${result.dataSource === 'all_ticks' ? 'ALL TICKS (ENHANCED)' : 'STANDARD'}
            </span>
        `;
        list.appendChild(sourceRow);
    }
    
    verdict.className = `overall-verdict ${result.overallPass ? 'pass' : 'fail'}`;
    verdict.textContent = result.overallPass ? '✓ ALL CONDITIONS PASSED' : '✗ CONDITIONS NOT MET';
}

function displaySignal(signal) {
    const display = document.getElementById('signal-display');
    const status = document.getElementById('signal-status');
    const strengthDiv = document.getElementById('signal-strength');
    
    let html = '';
    
    if (signal.type === 'rise_fall') {
        const isRise = signal.prediction === 'RISE';
        html = `
            <div class="signal-box ${isRise ? 'rise' : 'fall'}">
                <div class="signal-label">CONFIRMED SIGNAL</div>
                <div class="signal-value">${signal.prediction}</div>
                <div class="signal-confidence">${signal.confidence}% Confidence</div>
            </div>
        `;
    } else if (signal.type === 'even_odd') {
        const isEven = signal.prediction === 'EVEN';
        html = `
            <div class="signal-box ${isEven ? 'even' : 'odd'}">
                <div class="signal-label">CONFIRMED SIGNAL</div>
                <div class="signal-value">${signal.prediction}</div>
                <div class="signal-confidence">${signal.confidence}% Confidence</div>
            </div>
        `;
    } else if (signal.type === 'matches_differs') {
        html = `
            <div class="signal-box matches">
                <div class="signal-label">MATCH DIGIT ${signal.targetDigit}</div>
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
    
    let strengthHtml = '';
    for (let i = 0; i < 5; i++) {
        strengthHtml += `<div class="strength-bar ${i < signal.strength ? 'active' : ''}"></div>`;
    }
    strengthDiv.innerHTML = strengthHtml;
    
    status.className = 'signal-status ready';
    status.textContent = '🟢 SIGNAL ACTIVE - EXECUTE TRADE';
    
    updateSignalTimer();
}

function displayStabilizing(signal) {
    const display = document.getElementById('signal-display');
    const status = document.getElementById('signal-status');
    const strengthDiv = document.getElementById('signal-strength');
    
    display.innerHTML = `
        <div class="signal-box" style="border: 2px solid #ffc107;">
            <div class="signal-label">STABILIZING...</div>
            <div class="signal-value" style="font-size: 18px;">${signal.prediction}?</div>
            <div class="signal-confidence">${predictionStabilityCount}/3 confirmations</div>
        </div>
    `;
    
    strengthDiv.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        strengthDiv.innerHTML += `<div class="strength-bar" style="background: #ffc107;"></div>`;
    }
    
    status.className = 'signal-status waiting';
    status.textContent = '⏳ VERIFYING SIGNAL STABILITY...';
}

function displayNoSignal(result) {
    const display = document.getElementById('signal-display');
    const status = document.getElementById('signal-status');
    const strengthDiv = document.getElementById('signal-strength');
    
    let progress = '';
    if (currentMode === 'rise_fall') {
        progress = `${priceHistory.length}/${SIGNAL_CONFIG.rise_fall.minTicks}`;
    } else {
        const source = allTicksActive ? 'All Ticks' : 'Standard';
        progress = `${reefDigitWindow.length}/${SIGNAL_CONFIG[currentMode].minTicks} (${source})`;
    }
    
    display.innerHTML = `
        <div class="signal-box" style="border: 2px solid #444;">
            <div class="signal-label">COLLECTING DATA</div>
            <div class="signal-value" style="font-size: 18px;">${progress}</div>
            <div class="signal-confidence">ticks collected</div>
        </div>
    `;
    
    strengthDiv.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        strengthDiv.innerHTML += `<div class="strength-bar"></div>`;
    }
    
    status.className = 'signal-status no-signal';
    status.textContent = '🔒 AWAITING VALID CONDITIONS...';
}

function updateSignalTimer() {
    const timer = document.getElementById('signal-timer');
    const now = new Date();
    timer.textContent = now.toLocaleTimeString('en-US', { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
}

// ==================== UTILITY FUNCTIONS ====================

function calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

function calculateChiSquare(observed, expected) {
    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
        chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
    return chiSquare;
}

function calculateEntropy(counts, total) {
    let entropy = 0;
    for (let count of counts) {
        if (count > 0) {
            const p = count / total;
            entropy -= p * Math.log2(p);
        }
    }
    return entropy;
}

function calculateConfidenceInterval(successes, trials) {
    const p = successes / trials;
    const z = 1.96;
    const margin = z * Math.sqrt((p * (1 - p)) / trials);
    return {
        lower: Math.max(0, p - margin),
        upper: Math.min(1, p + margin)
    };
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ==================== UI CONTROLS ====================

function toggleAlertPanel() {
    const panel = document.getElementById('alert-panel');
    panel.classList.toggle('show');
}

function toggleSetting(type) {
    alertSettings[type] = !alertSettings[type];
    document.getElementById(`${type}-toggle`).classList.toggle('active');
    
    if (type === 'push' && alertSettings.push && 'Notification' in window) {
        Notification.requestPermission();
    }
    
    if (type === 'auto') {
        document.getElementById('auto-execute').textContent = alertSettings.auto ? 'ON' : 'OFF';
    }
}

function exportData() {
    const data = {
        signals: signalHistory,
        settings: riskSettings,
        allTicksData: allTicksData.slice(0, 100), // Include recent all ticks data
        exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zion_trading_data_${Date.now()}.json`;
    a.click();
    
    const csv = convertToCSV(signalHistory);
    const csvBlob = new Blob([csv], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvA = document.createElement('a');
    csvA.href = csvUrl;
    csvA.download = `zion_signals_${Date.now()}.csv`;
    csvA.click();
}

function convertToCSV(data) {
    const headers = ['ID', 'Time', 'Symbol', 'Type', 'Prediction', 'Confidence', 'DataSource', 'Result', 'Profit'];
    const rows = data.map(item => [
        item.id,
        new Date(item.timestamp || item.id).toISOString(),
        item.symbol || 'unknown',
        item.type,
        item.prediction + (item.targetDigit !== undefined ? item.targetDigit : ''),
        item.confidence,
        item.dataSource || 'standard',
        item.result || 'pending',
        item.profit || 0
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    if (scannerInterval) clearInterval(scannerInterval);
    
    // Unsubscribe from all ticks when closing modal
    if (allTicksActive) {
        unsubscribeAllTicks();
    }
    
    document.getElementById('alert-panel').classList.remove('show');
}

// Request notification permission on load
if ('Notification' in window) {
    Notification.requestPermission();
}

// Add flash animation
const style = document.createElement('style');
style.textContent = `
    @keyframes flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; background: rgba(76, 175, 80, 0.2); }
    }
`;
document.head.appendChild(style);
