/**
 * Zion Trading Lab - Authoritative Direct Feed
 * Direct Sync with Deriv "Reef" Servers & Live Directional Arrows
 * Enhanced with Signal Engine + Market Dynamics + Volatility Scanner
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0;
let reefDigitWindow = [];
let priceHistory = [];
let lastSignal = null;
let signalCooldown = 0;
let activeSignalData = null;

// Market Dynamics Tracking
let tickTimes = [];
let lastMetrics = {};
let dynamicsHistory = [];

// Scanner Data
let scannerData = {};
let scannerInterval = null;

// Signal Engine Configuration
const SIGNAL_CONFIG = {
    rise_fall: {
        minTicks: 50,
        trendThreshold: 0.70,
        momentumThreshold: 5,
        minConsecutive: 4,
        volatilityMax: 0.05,
        confirmationDelay: 10
    },
    even_odd: {
        minTicks: 100,
        dominanceThreshold: 0.60,
        streakThreshold: 5,
        chiSquareThreshold: 3.84,
        minGap: 10,
        stabilityPeriods: 3
    },
    matches_differs: {
        minTicks: 150,
        probabilityThreshold: 0.15,
        minOccurrence: 15,
        entropyThreshold: 0.85,
        confidenceInterval: 0.95,
        predictionStability: 5
    },
    over_under: {
        minTicks: 100,
        dominanceThreshold: 0.65,
        thresholdDigit: 5,
        distributionBalance: 0.40,
        trendConsistency: 4,
        rejectionThreshold: 0.10
    }
};

let signalConfirmCount = 0;
let lastPrediction = null;
let predictionStabilityCount = 0;

ws.onopen = () => {
    console.log("Zion Lab: Connected to Direct Reef Feed");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

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
    }

    if (data.tick) {
        activeSub = data.tick.id;
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        const head = priceStr.slice(0, -1);
        
        // Track tick velocity
        tickTimes.push(Date.now());
        if (tickTimes.length > 50) tickTimes.shift();
        
        priceHistory.push(currentPrice);
        if (priceHistory.length > 200) priceHistory.shift();
        
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
    document.getElementById('modal').style.display = 'block';
    
    // Reset to signal panel
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
    
    // Start scanner updates
    startScanner();
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
        chartView.style.height = '300px';
        signalPanel.classList.add('active');
    } else {
        digitPanel.style.display = 'block';
        chartView.style.height = '250px';
        signalPanel.classList.add('active');
        buildDigitGrid();
    }
    
    chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=light" width="100%" height="100%" frameborder="0"></iframe>`;
    
    signalConfirmCount = 0;
    lastPrediction = null;
    predictionStabilityCount = 0;
    
    updateSignalEngine();
}

// NEW: Panel Switching
function switchPanel(panelName, el) {
    document.querySelectorAll('.panel-nav-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    
    document.querySelectorAll('.signal-panel, .dynamics-panel, .scanner-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    if (panelName === 'signal') {
        document.getElementById('signal-panel').style.display = 'block';
    } else if (panelName === 'dynamics') {
        document.getElementById('dynamics-panel').style.display = 'block';
        document.getElementById('dynamics-panel').classList.add('active');
        updateDynamics();
    } else if (panelName === 'scanner') {
        document.getElementById('scanner-panel').style.display = 'block';
        document.getElementById('scanner-panel').classList.add('active');
        updateScannerDisplay();
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

// ==================== SIGNAL ENGINE ====================

function updateSignalEngine() {
    const panel = document.getElementById('signal-panel');
    if (panel.style.display === 'none') return;
    
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
    
    if (!hasMinTicks) {
        return { conditions, overallPass: false };
    }
    
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
    
    const meetsTrendThreshold = trendStrength >= config.trendThreshold;
    conditions.push({
        name: `Trend Strength ≥ ${(config.trendThreshold * 100).toFixed(0)}%`,
        status: meetsTrendThreshold ? 'PASS' : 'FAIL',
        detail: `${(trendStrength * 100).toFixed(1)}%`
    });
    
    const meetsConsecutive = maxConsecutive >= config.minConsecutive;
    conditions.push({
        name: `Consecutive Moves ≥ ${config.minConsecutive}`,
        status: meetsConsecutive ? 'PASS' : 'FAIL',
        detail: `${maxConsecutive} ticks`
    });
    
    const absMomentum = Math.abs(momentum);
    const meetsMomentum = absMomentum >= config.momentumThreshold;
    conditions.push({
        name: `Momentum Score ≥ ${config.momentumThreshold}`,
        status: meetsMomentum ? 'PASS' : 'FAIL',
        detail: `Score: ${momentum}`
    });
    
    const volatility = calculateVolatility(recent);
    const meetsVolatility = volatility <= config.volatilityMax;
    conditions.push({
        name: `Volatility ≤ ${(config.volatilityMax * 100).toFixed(0)}%`,
        status: meetsVolatility ? 'PASS' : 'FAIL',
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
    
    const overallPass = meetsTrendThreshold && meetsConsecutive && meetsMomentum && meetsVolatility;
    
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
    const conditions = [];
    
    const hasMinTicks = reefDigitWindow.length >= config.minTicks;
    conditions.push({
        name: `Minimum ${config.minTicks} Digits Collected`,
        status: hasMinTicks ? 'PASS' : 'FAIL',
        detail: `${reefDigitWindow.length}/${config.minTicks}`
    });
    
    if (!hasMinTicks) {
        return { conditions, overallPass: false };
    }
    
    const recent = reefDigitWindow.slice(-config.minTicks);
    
    let evenCount = 0, oddCount = 0;
    let currentStreak = 1, lastParity = null, maxStreak = 1;
    
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
    const dominance = Math.max(evenRatio, oddRatio);
    const gap = Math.abs(evenCount - oddCount);
    
    const meetsDominance = dominance >= config.dominanceThreshold;
    conditions.push({
        name: `Dominance ≥ ${(config.dominanceThreshold * 100).toFixed(0)}%`,
        status: meetsDominance ? 'PASS' : 'FAIL',
        detail: `${(dominance * 100).toFixed(1)}%`
    });
    
    const meetsGap = gap >= config.minGap;
    conditions.push({
        name: `Count Gap ≥ ${config.minGap}`,
        status: meetsGap ? 'PASS' : 'FAIL',
        detail: `Gap: ${gap}`
    });
    
    const chiSquare = calculateChiSquare([evenCount, oddCount], [total/2, total/2]);
    const meetsChiSquare = chiSquare >= config.chiSquareThreshold;
    conditions.push({
        name: `Chi-Square ≥ ${config.chiSquareThreshold}`,
        status: meetsChiSquare ? 'PASS' : 'FAIL',
        detail: `χ² = ${chiSquare.toFixed(2)}`
    });
    
    const lastDigit = recent[recent.length - 1];
    const lastIsEven = lastDigit % 2 === 0;
    let prediction = null;
    let confidence = 0;
    
    if (maxStreak >= config.streakThreshold) {
        prediction = lastIsEven ? 'ODD' : 'EVEN';
        confidence = 75;
        conditions.push({
            name: `Streak Reversal (Max: ${maxStreak})`,
            status: 'PASS',
            detail: 'Reversal signal'
        });
    } else {
        prediction = evenRatio > oddRatio ? 'EVEN' : 'ODD';
        confidence = Math.round(dominance * 100);
        conditions.push({
            name: `Streak Check (Max: ${maxStreak})`,
            status: maxStreak < config.streakThreshold ? 'PASS' : 'FAIL',
            detail: 'Within limits'
        });
    }
    
    const overallPass = meetsDominance && meetsGap && meetsChiSquare;
    
    return {
        type: 'even_odd',
        prediction,
        confidence,
        strength: Math.min(5, Math.floor(confidence / 20)),
        conditions,
        overallPass,
        metrics: { evenRatio, oddRatio, maxStreak, chiSquare }
    };
}

function generateMatchesDiffersSignal() {
    const config = SIGNAL_CONFIG.matches_differs;
    const conditions = [];
    
    const hasMinTicks = reefDigitWindow.length >= config.minTicks;
    conditions.push({
        name: `Minimum ${config.minTicks} Digits Collected`,
        status: hasMinTicks ? 'PASS' : 'FAIL',
        detail: `${reefDigitWindow.length}/${config.minTicks}`
    });
    
    if (!hasMinTicks) {
        return { conditions, overallPass: false };
    }
    
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    
    const total = reefDigitWindow.length;
    
    let maxCount = 0;
    let predictedDigit = -1;
    let secondBest = 0;
    
    for (let i = 0; i <= 9; i++) {
        if (counts[i] > maxCount) {
            secondBest = maxCount;
            maxCount = counts[i];
            predictedDigit = i;
        } else if (counts[i] > secondBest) {
            secondBest = counts[i];
        }
    }
    
    const probability = maxCount / total;
    const margin = maxCount - secondBest;
    
    const meetsProbability = probability >= config.probabilityThreshold;
    conditions.push({
        name: `Probability ≥ ${(config.probabilityThreshold * 100).toFixed(0)}%`,
        status: meetsProbability ? 'PASS' : 'FAIL',
        detail: `${(probability * 100).toFixed(1)}%`
    });
    
    const meetsOccurrence = maxCount >= config.minOccurrence;
    conditions.push({
        name: `Occurrences ≥ ${config.minOccurrence}`,
        status: meetsOccurrence ? 'PASS' : 'FAIL',
        detail: `${maxCount} times`
    });
    
    const meetsMargin = margin >= 3;
    conditions.push({
        name: `Lead Margin ≥ 3`,
        status: meetsMargin ? 'PASS' : 'FAIL',
        detail: `Lead: ${margin}`
    });
    
    const entropy = calculateEntropy(counts, total);
    const meetsEntropy = entropy <= config.entropyThreshold;
    conditions.push({
        name: `Entropy ≤ ${config.entropyThreshold}`,
        status: meetsEntropy ? 'PASS' : 'FAIL',
        detail: `H = ${entropy.toFixed(3)}`
    });
    
    const ci = calculateConfidenceInterval(maxCount, total);
    const meetsCI = ci.lower > 0.10;
    conditions.push({
        name: `95% CI Lower > 10%`,
        status: meetsCI ? 'PASS' : 'FAIL',
        detail: `[${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%]`
    });
    
    const confidence = Math.round(probability * 100);
    const overallPass = meetsProbability && meetsOccurrence && meetsMargin && meetsEntropy && meetsCI;
    
    return {
        type: 'matches_differs',
        prediction: 'MATCHES',
        targetDigit: predictedDigit,
        confidence,
        strength: Math.min(5, Math.floor(confidence / 20)),
        conditions,
        overallPass,
        metrics: { probability, entropy, margin }
    };
}

function generateOverUnderSignal() {
    const config = SIGNAL_CONFIG.over_under;
    const conditions = [];
    
    const hasMinTicks = reefDigitWindow.length >= config.minTicks;
    conditions.push({
        name: `Minimum ${config.minTicks} Digits Collected`,
        status: hasMinTicks ? 'PASS' : 'FAIL',
        detail: `${reefDigitWindow.length}/${config.minTicks}`
    });
    
    if (!hasMinTicks) {
        return { conditions, overallPass: false };
    }
    
    const recent = reefDigitWindow.slice(-config.minTicks);
    
    let overCount = 0;
    let underCount = 0;
    let overTrend = 0, underTrend = 0;
    let lastZone = null;
    
    for (let digit of recent) {
        if (digit > 4) {
            overCount++;
            if (lastZone === 'over') overTrend++;
        } else {
            underCount++;
            if (lastZone === 'under') underTrend++;
        }
        lastZone = digit > 4 ? 'over' : 'under';
    }
    
    const total = overCount + underCount;
    const overRatio = overCount / total;
    const underRatio = underCount / total;
    const dominance = Math.max(overRatio, underRatio);
    
    const meetsDominance = dominance >= config.dominanceThreshold;
    conditions.push({
        name: `Dominance ≥ ${(config.dominanceThreshold * 100).toFixed(0)}%`,
        status: meetsDominance ? 'PASS' : 'FAIL',
        detail: `${(dominance * 100).toFixed(1)}%`
    });
    
    const balance = Math.min(overRatio, underRatio) / Math.max(overRatio, underRatio);
    const meetsBalance = balance <= config.distributionBalance;
    conditions.push({
        name: `Distribution Imbalance`,
        status: !meetsBalance ? 'PASS' : 'FAIL',
        detail: `Ratio: ${(balance * 100).toFixed(1)}%`
    });
    
    const dominantTrend = Math.max(overTrend, underTrend);
    const meetsTrend = dominantTrend >= config.trendConsistency;
    conditions.push({
        name: `Trend Periods ≥ ${config.trendConsistency}`,
        status: meetsTrend ? 'PASS' : 'FAIL',
        detail: `${dominantTrend} periods`
    });
    
    let prediction = null;
    let targetDigit = null;
    let confidence = 0;
    
    if (overRatio > underRatio) {
        prediction = 'OVER';
        targetDigit = 4;
        confidence = Math.round(overRatio * 100);
    } else {
        prediction = 'UNDER';
        targetDigit = 5;
        confidence = Math.round(underRatio * 100);
    }
    
    const overallPass = meetsDominance && !meetsBalance && meetsTrend;
    
    return {
        type: 'over_under',
        prediction,
        targetDigit,
        confidence,
        strength: Math.min(5, Math.floor(confidence / 20)),
        conditions,
        overallPass,
        metrics: { overRatio, underRatio, dominantTrend }
    };
}

// ==================== MARKET DYNAMICS ====================

function updateDynamics() {
    const panel = document.getElementById('dynamics-panel');
    if (!panel.classList.contains('active')) return;
    
    // Tick Velocity
    let velocity = 0;
    if (tickTimes.length >= 2) {
        const timeSpan = (tickTimes[tickTimes.length - 1] - tickTimes[0]) / 1000;
        velocity = timeSpan > 0 ? (tickTimes.length / timeSpan).toFixed(1) : 0;
    }
    
    // Price Momentum
    let momentum = 0;
    let momentumTrend = 'neutral';
    if (priceHistory.length >= 10) {
        const recent = priceHistory.slice(-10);
        const change = ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100;
        momentum = change.toFixed(3);
        momentumTrend = change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'neutral';
    }
    
    // Volatility
    let vol = 0;
    let volTrend = 'neutral';
    if (priceHistory.length >= 20) {
        const returns = [];
        for (let i = 1; i < priceHistory.length; i++) {
            returns.push((priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1]);
        }
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        vol = (Math.sqrt(variance) * 100).toFixed(2);
        
        if (lastMetrics.volatility) {
            volTrend = vol > lastMetrics.volatility * 1.1 ? 'up' : 
                       vol < lastMetrics.volatility * 0.9 ? 'down' : 'neutral';
        }
    }
    
    // Trend Strength
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
    
    // Market Phase
    let phase = 'ACCUMULATION';
    let phaseColor = 'neutral';
    if (priceHistory.length > 50) {
        const shortMA = average(priceHistory.slice(-10));
        const longMA = average(priceHistory.slice(-50));
        const recentVol = parseFloat(vol);
        
        if (shortMA > longMA * 1.001 && recentVol > 0.02) {
            phase = 'MARK UP';
            phaseColor = 'up';
        } else if (shortMA < longMA * 0.999 && recentVol > 0.02) {
            phase = 'MARK DOWN';
            phaseColor = 'down';
        } else if (recentVol < 0.01) {
            phase = 'CONSOLIDATION';
            phaseColor = 'neutral';
        } else {
            phase = 'DISTRIBUTION';
            phaseColor = 'down';
        }
    }
    
    // Signal Quality
    let quality = 0;
    let qualityTrend = 'neutral';
    if (activeSignalData && activeSignalData.overallPass) {
        quality = activeSignalData.confidence;
        qualityTrend = 'up';
    } else if (reefDigitWindow.length > 50) {
        // Calculate potential quality based on data consistency
        const counts = Array(10).fill(0);
        reefDigitWindow.forEach(d => counts[d]++);
        const maxFreq = Math.max(...counts);
        quality = Math.round((maxFreq / reefDigitWindow.length) * 100);
        qualityTrend = quality > 15 ? 'up' : 'neutral';
    }
    
    // Store metrics
    lastMetrics = { volatility: parseFloat(vol), strength };
    dynamicsHistory.push({ velocity, momentum, vol, strength, quality, timestamp: Date.now() });
    if (dynamicsHistory.length > 50) dynamicsHistory.shift();
    
    // Update Display
    document.getElementById('tick-velocity').textContent = velocity + '/s';
    document.getElementById('velocity-trend').textContent = getTrendArrow(velocity, lastMetrics.prevVelocity || velocity);
    document.getElementById('velocity-trend').className = 'metric-trend trend-' + (velocity > (lastMetrics.prevVelocity || 0) ? 'up' : 'neutral');
    
    document.getElementById('price-momentum').textContent = momentum + '%';
    document.getElementById('momentum-trend').textContent = getTrendLabel(momentumTrend);
    document.getElementById('momentum-trend').className = 'metric-trend trend-' + momentumTrend;
    
    document.getElementById('vol-index').textContent = vol + '%';
    document.getElementById('vol-trend').textContent = getTrendLabel(volTrend);
    document.getElementById('vol-trend').className = 'metric-trend trend-' + volTrend;
    
    document.getElementById('trend-strength').textContent = strength + '%';
    document.getElementById('strength-trend').textContent = getTrendLabel(strengthTrend);
    document.getElementById('strength-trend').className = 'metric-trend trend-' + strengthTrend;
    
    document.getElementById('market-phase').textContent = phase;
    document.getElementById('phase-indicator').textContent = getPhaseEmoji(phase);
    document.getElementById('phase-indicator').className = 'metric-trend trend-' + phaseColor;
    
    document.getElementById('signal-quality').textContent = quality + '%';
    document.getElementById('quality-trend').textContent = quality > 70 ? '✓ Strong' : quality > 40 ? '→ Moderate' : '✗ Weak';
    document.getElementById('quality-trend').className = 'metric-trend trend-' + (quality > 60 ? 'up' : quality > 30 ? 'neutral' : 'down');
    
    lastMetrics.prevVelocity = parseFloat(velocity);
    
    // Update timer
    const now = new Date();
    document.getElementById('dynamics-timer').textContent = now.toLocaleTimeString('en-US', { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getTrendArrow(current, previous) {
    if (current > previous * 1.1) return '↑ Rising';
    if (current < previous * 0.9) return '↓ Falling';
    return '→ Stable';
}

function getTrendLabel(trend) {
    const labels = { up: '↑ Rising', down: '↓ Falling', neutral: '→ Stable' };
    return labels[trend] || '→ Stable';
}

function getPhaseEmoji(phase) {
    const emojis = {
        'ACCUMULATION': '⬇ Sideways',
        'MARK UP': '🚀 Bullish',
        'MARK DOWN': '🔻 Bearish',
        'CONSOLIDATION': '➡ Range',
        'DISTRIBUTION': '⚠ Choppy'
    };
    return emojis[phase] || '→ Analyzing';
}

// ==================== VOLATILITY SCANNER ====================

function initScanner() {
    // Initialize scanner data for all volatility indices
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
    
    // Subscribe to all volatility indices for scanning
    const volIndices = allSymbols.filter(s => 
        s.market === 'synthetic_index' && 
        !s.display_name.toLowerCase().includes('jump') && 
        !s.display_name.toLowerCase().includes('step')
    );
    
    // Subscribe to ticks for scanner (throttled)
    volIndices.forEach((s, index) => {
        setTimeout(() => {
            ws.send(JSON.stringify({ "ticks": s.symbol, "subscribe": 1 }));
        }, index * 100);
    });
    
    // Update display every 2 seconds
    scannerInterval = setInterval(updateScannerDisplay, 2000);
}

function updateScannerDisplay() {
    const panel = document.getElementById('scanner-panel');
    if (!panel.classList.contains('active')) return;
    
    const grid = document.getElementById('scanner-grid');
    grid.innerHTML = '';
    
    // Calculate scores for all markets
    const scoredMarkets = Object.values(scannerData).map(market => {
        let score = 0;
        
        if (market.ticks.length > 20) {
            // Volatility score (0-40)
            const vol = calculateVolatility(market.ticks.slice(-20));
            const volScore = Math.min(40, (vol * 1000));
            score += volScore;
            
            // Trend consistency (0-30)
            const recent = market.ticks.slice(-20);
            let consistentMoves = 0;
            for (let i = 1; i < recent.length; i++) {
                if (recent[i] !== recent[i-1]) consistentMoves++;
            }
            const trendScore = (consistentMoves / 19) * 30;
            score += trendScore;
            
            // Activity level (0-30)
            const activityScore = Math.min(30, market.ticks.length / 5);
            score += activityScore;
            
            market.volatility = (vol * 100).toFixed(2);
            market.score = Math.round(score);
            market.signalReady = score > 60 && vol > 0.001 && vol < 0.05;
        }
        
        return market;
    });
    
    // Sort by score
    scoredMarkets.sort((a, b) => b.score - a.score);
    
    // Display top markets
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
    
    // Update status
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
    
    verdict.className = `overall-verdict ${result.overallPass ? 'pass' : 'fail'}`;
    verdict.textContent = result.overallPass ? '✓ ALL CONDITIONS PASSED - SIGNAL VALID' : '✗ CONDITIONS NOT MET - NO SIGNAL';
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
        progress = `${reefDigitWindow.length}/${SIGNAL_CONFIG[currentMode].minTicks}`;
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
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
    timer.textContent = timeStr;
}

// ==================== MATHEMATICAL HELPERS ====================

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

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    if (scannerInterval) clearInterval(scannerInterval);
}
