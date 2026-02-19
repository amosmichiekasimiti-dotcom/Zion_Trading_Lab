/**
 * Zion Trading Lab - Authoritative Direct Feed
 * Direct Sync with Deriv "Reef" Servers & Live Directional Arrows
 * Enhanced with Signal Engine for Rise/Fall, Even/Odd, Matches/Differs, Over/Under
 * WITH STRICT CONDITION VALIDATION FOR LONG-LASTING SIGNALS
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
let activeSignalData = null; // Store current signal for persistence

// Signal Engine Configuration - STRICT CONDITIONS FOR LONG-LASTING SIGNALS
const SIGNAL_CONFIG = {
    rise_fall: {
        minTicks: 50,              // Minimum price ticks required
        trendThreshold: 0.70,      // 70% directional bias required
        momentumThreshold: 5,      // Minimum momentum score
        minConsecutive: 4,         // Minimum consecutive moves in direction
        volatilityMax: 0.05,       // Maximum allowed volatility (5%)
        confirmationDelay: 10      // Ticks to confirm trend
    },
    even_odd: {
        minTicks: 100,             // Minimum digit history required
        dominanceThreshold: 0.60,  // 60% dominance required
        streakThreshold: 5,        // Maximum streak before reversal
        chiSquareThreshold: 3.84,  // Chi-square test for randomness
        minGap: 10,                // Minimum gap between even/odd counts
        stabilityPeriods: 3        // Periods of stability required
    },
    matches_differs: {
        minTicks: 150,             // Extensive history needed
        probabilityThreshold: 0.15,// 15% minimum for digit
        minOccurrence: 15,         // Minimum occurrences
        entropyThreshold: 0.85,    // Maximum entropy allowed
        confidenceInterval: 0.95,  // 95% confidence required
        predictionStability: 5     // Stable prediction for 5 ticks
    },
    over_under: {
        minTicks: 100,             // Minimum digit history
        dominanceThreshold: 0.65,  // 65% dominance required
        thresholdDigit: 5,         // Pivot digit
        distributionBalance: 0.40, // Balance check
        trendConsistency: 4,       // Consistent trend periods
        rejectionThreshold: 0.10   // Maximum rejection rate
    }
};

// Signal persistence variables
let signalConfirmCount = 0;
let lastPrediction = null;
let predictionStabilityCount = 0;

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
        if (priceHistory.length > 200) priceHistory.shift();
        
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
    lastPrice = 0;
    lastSignal = null;
    signalCooldown = 0;
    activeSignalData = null;
    signalConfirmCount = 0;
    lastPrediction = null;
    predictionStabilityCount = 0;
    
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
    
    // Reset signal tracking
    signalConfirmCount = 0;
    lastPrediction = null;
    predictionStabilityCount = 0;
    
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

// ==================== ENHANCED SIGNAL ENGINE WITH STRICT CONDITIONS ====================

function updateSignalEngine() {
    const panel = document.getElementById('signal-panel');
    if (!panel.classList.add('active')) return;
    
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
    
    // Display conditions regardless of pass/fail
    displayConditions(result);
    
    // Only show signal if ALL conditions pass
    if (result && result.overallPass) {
        // Check for signal stability
        if (lastPrediction === result.prediction) {
            predictionStabilityCount++;
        } else {
            predictionStabilityCount = 0;
            lastPrediction = result.prediction;
        }
        
        // Require stability before confirming
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
    
    // Condition 1: Minimum Data
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
    
    // Condition 2: Calculate momentum and consecutive moves
    let upMoves = 0, downMoves = 0, momentum = 0;
    let consecutiveUp = 0, consecutiveDown = 0;
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
    
    // Condition 2: Trend Threshold
    const trendStrength = Math.max(upRatio, downRatio);
    const meetsTrendThreshold = trendStrength >= config.trendThreshold;
    conditions.push({
        name: `Trend Strength ≥ ${(config.trendThreshold * 100).toFixed(0)}%`,
        status: meetsTrendThreshold ? 'PASS' : 'FAIL',
        detail: `${(trendStrength * 100).toFixed(1)}%`
    });
    
    // Condition 3: Consecutive Moves
    const maxConsecutive = Math.max(maxConsecutiveUp, maxConsecutiveDown);
    const meetsConsecutive = maxConsecutive >= config.minConsecutive;
    conditions.push({
        name: `Consecutive Moves ≥ ${config.minConsecutive}`,
        status: meetsConsecutive ? 'PASS' : 'FAIL',
        detail: `${maxConsecutive} ticks`
    });
    
    // Condition 4: Momentum Threshold
    const absMomentum = Math.abs(momentum);
    const meetsMomentum = absMomentum >= config.momentumThreshold;
    conditions.push({
        name: `Momentum Score ≥ ${config.momentumThreshold}`,
        status: meetsMomentum ? 'PASS' : 'FAIL',
        detail: `Score: ${momentum}`
    });
    
    // Condition 5: Volatility Check
    const volatility = calculateVolatility(recent);
    const meetsVolatility = volatility <= config.volatilityMax;
    conditions.push({
        name: `Volatility ≤ ${(config.volatilityMax * 100).toFixed(0)}%`,
        status: meetsVolatility ? 'PASS' : 'FAIL',
        detail: `${(volatility * 100).toFixed(2)}%`
    });
    
    // Determine prediction
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
    
    // Condition 1: Minimum Data
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
    
    // Calculate statistics
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
    
    // Condition 2: Dominance Threshold
    const meetsDominance = dominance >= config.dominanceThreshold;
    conditions.push({
        name: `Dominance ≥ ${(config.dominanceThreshold * 100).toFixed(0)}%`,
        status: meetsDominance ? 'PASS' : 'FAIL',
        detail: `${(dominance * 100).toFixed(1)}%`
    });
    
    // Condition 3: Gap Requirement
    const meetsGap = gap >= config.minGap;
    conditions.push({
        name: `Count Gap ≥ ${config.minGap}`,
        status: meetsGap ? 'PASS' : 'FAIL',
        detail: `Gap: ${gap}`
    });
    
    // Condition 4: Chi-Square Randomness Test
    const chiSquare = calculateChiSquare([evenCount, oddCount], [total/2, total/2]);
    const meetsChiSquare = chiSquare >= config.chiSquareThreshold;
    conditions.push({
        name: `Chi-Square ≥ ${config.chiSquareThreshold}`,
        status: meetsChiSquare ? 'PASS' : 'FAIL',
        detail: `χ² = ${chiSquare.toFixed(2)}`
    });
    
    // Condition 5: Streak Check (reversal opportunity or stable)
    const lastDigit = recent[recent.length - 1];
    const lastIsEven = lastDigit % 2 === 0;
    let prediction = null;
    let confidence = 0;
    
    if (maxStreak >= config.streakThreshold) {
        // Reversal opportunity
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
    
    // Condition 1: Minimum Data
    const hasMinTicks = reefDigitWindow.length >= config.minTicks;
    conditions.push({
        name: `Minimum ${config.minTicks} Digits Collected`,
        status: hasMinTicks ? 'PASS' : 'FAIL',
        detail: `${reefDigitWindow.length}/${config.minTicks}`
    });
    
    if (!hasMinTicks) {
        return { conditions, overallPass: false };
    }
    
    // Calculate digit frequencies
    const counts = Array(10).fill(0);
    reefDigitWindow.forEach(d => counts[d]++);
    
    const total = reefDigitWindow.length;
    
    // Find best candidate
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
    
    // Condition 2: Probability Threshold
    const meetsProbability = probability >= config.probabilityThreshold;
    conditions.push({
        name: `Probability ≥ ${(config.probabilityThreshold * 100).toFixed(0)}%`,
        status: meetsProbability ? 'PASS' : 'FAIL',
        detail: `${(probability * 100).toFixed(1)}%`
    });
    
    // Condition 3: Minimum Occurrence
    const meetsOccurrence = maxCount >= config.minOccurrence;
    conditions.push({
        name: `Occurrences ≥ ${config.minOccurrence}`,
        status: meetsOccurrence ? 'PASS' : 'FAIL',
        detail: `${maxCount} times`
    });
    
    // Condition 4: Margin from Second Best
    const meetsMargin = margin >= 3;
    conditions.push({
        name: `Lead Margin ≥ 3`,
        status: meetsMargin ? 'PASS' : 'FAIL',
        detail: `Lead: ${margin}`
    });
    
    // Condition 5: Entropy Check (lower is more predictable)
    const entropy = calculateEntropy(counts, total);
    const meetsEntropy = entropy <= config.entropyThreshold;
    conditions.push({
        name: `Entropy ≤ ${config.entropyThreshold}`,
        status: meetsEntropy ? 'PASS' : 'FAIL',
        detail: `H = ${entropy.toFixed(3)}`
    });
    
    // Condition 6: Confidence Interval (95%)
    const ci = calculateConfidenceInterval(maxCount, total);
    const meetsCI = ci.lower > 0.10; // Lower bound above 10%
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
    
    // Condition 1: Minimum Data
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
    
    // Calculate distribution
    let overCount = 0;  // digits > 4 (5,6,7,8,9)
    let underCount = 0; // digits < 5 (0,1,2,3,4)
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
    
    // Condition 2: Dominance Threshold
    const meetsDominance = dominance >= config.dominanceThreshold;
    conditions.push({
        name: `Dominance ≥ ${(config.dominanceThreshold * 100).toFixed(0)}%`,
        status: meetsDominance ? 'PASS' : 'FAIL',
        detail: `${(dominance * 100).toFixed(1)}%`
    });
    
    // Condition 3: Distribution Balance Check
    const balance = Math.min(overRatio, underRatio) / Math.max(overRatio, underRatio);
    const meetsBalance = balance <= config.distributionBalance;
    conditions.push({
        name: `Distribution Imbalance`,
        status: !meetsBalance ? 'PASS' : 'FAIL', // We want imbalance
        detail: `Ratio: ${(balance * 100).toFixed(1)}%`
    });
    
    // Condition 4: Trend Consistency
    const dominantTrend = Math.max(overTrend, underTrend);
    const meetsTrend = dominantTrend >= config.trendConsistency;
    conditions.push({
        name: `Trend Periods ≥ ${config.trendConsistency}`,
        status: meetsTrend ? 'PASS' : 'FAIL',
        detail: `${dominantTrend} periods`
    });
    
    // Determine prediction
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
    
    // Build strength bars
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
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
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
    const z = 1.96; // 95% confidence
    const margin = z * Math.sqrt((p * (1 - p)) / trials);
    return {
        lower: Math.max(0, p - margin),
        upper: Math.min(1, p + margin)
    };
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
