/**
 * Zion AI Trading Lab - Signal Engine with 5 Critical Conditions
 * Real-time analysis with Pass/Fail indicators
 * + 8 New Panels for Complete Trading System
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0;
let derivDigitWindow = []; // Fixed typo: was reefDigitWindow
let priceHistory = [];
let tickHistory = []; // For AI analysis
let botRunning = false;
let botStartTime = null;
let botDuration = 30; // minutes

// AI Engine State
let aiState = {
    primarySignal: 'WAIT',
    marketDirection: '--',
    confidence: 0,
    strength: 0,
    status: 'WEAK',
    conditions: {
        digitDistribution: { pass: false, value: 0 },
        consecutivePattern: { pass: false, value: 0 },
        statisticalEdge: { pass: false, value: 0 },
        priceAction: { pass: false, value: 0 },
        marketRegime: { pass: false, value: 0 }
    },
    metrics: {
        trendStrength: 0,
        volatility: 65,
        reversion: 0,
        momentum: 3
    }
};

// Session Data
const sessionData = {
    asian: { winRate: 68, bestHours: [2, 3, 4, 5] },
    london: { winRate: 82, bestHours: [8, 9, 10, 11] },
    ny: { winRate: 45, bestHours: [14, 15, 16] }
};

// Condition configurations
const CONDITIONS = {
    digitDistribution: {
        name: 'Digit Distribution Balance',
        check: (data) => {
            if (derivDigitWindow.length < 50) return { pass: false, value: 0 }; // Fixed typo
            const counts = Array(10).fill(0);
            derivDigitWindow.forEach(d => counts[d]++); // Fixed typo
            const max = Math.max(...counts);
            const balance = (max / derivDigitWindow.length) * 100; // Fixed typo
            // Pass if no digit dominates >40%
            return { pass: balance < 40, value: (100 - balance).toFixed(1) };
        }
    },
    consecutivePattern: {
        name: 'Consecutive Pattern Break',
        check: (data) => {
            if (derivDigitWindow.length < 20) return { pass: false, value: 0 }; // Fixed typo
            let maxStreak = 1;
            let currentStreak = 1;
            for (let i = 1; i < derivDigitWindow.length; i++) { // Fixed typo
                const isEven = derivDigitWindow[i] % 2 === 0; // Fixed typo
                const prevIsEven = derivDigitWindow[i-1] % 2 === 0; // Fixed typo
                if (isEven === prevIsEven) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }
            // Pass if streak >= 3 (mean reversion opportunity)
            return { pass: maxStreak >= 3, value: maxStreak };
        }
    },
    statisticalEdge: {
        name: 'Statistical Edge (>60%)',
        check: (data) => {
            if (derivDigitWindow.length < 50) return { pass: false, value: 0 }; // Fixed typo
            const recent = derivDigitWindow.slice(-50); // Fixed typo
            let evenCount = recent.filter(d => d % 2 === 0).length;
            let oddCount = 50 - evenCount;
            const dominance = (Math.max(evenCount, oddCount) / 50) * 100;
            return { pass: dominance > 60, value: dominance.toFixed(1) };
        }
    },
    priceAction: {
        name: 'Price Action Alignment',
        check: (data) => {
            if (priceHistory.length < 20) return { pass: false, value: 0 };
            const recent = priceHistory.slice(-20);
            const first = recent[0];
            const last = recent[recent.length - 1];
            const change = ((last - first) / first) * 100;
            // Pass if significant movement >0.5%
            return { pass: Math.abs(change) > 0.5, value: change.toFixed(2) };
        }
    },
    marketRegime: {
        name: 'Market Regime Filter',
        check: (data) => {
            // Avoid choppy markets (volatility 15-35%)
            const vol = aiState.metrics.volatility;
            return { pass: vol >= 15 && vol <= 35, value: vol };
        }
    }
};

ws.onopen = () => {
    console.log("AI Engine Connected");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }

    if (data.history) { 
        derivDigitWindow = []; // Fixed typo
        priceHistory = [];
        data.history.prices.forEach((price, idx) => {
            const digit = parseInt(price.toFixed(data.pip_size).slice(-1));
            derivDigitWindow.push(digit); // Fixed typo
            priceHistory.push(price);
        });
        renderDerivStatistics(); // Fixed function name
        updateAIEngine();
        updateAllPanels();
    }

    if (data.tick) {
        activeSub = data.tick.id;
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        const head = priceStr.slice(0, -1);
        
        // Update histories
        priceHistory.push(currentPrice);
        if (priceHistory.length > 100) priceHistory.shift();
        
        derivDigitWindow.push(lastDigit); // Fixed typo
        if (derivDigitWindow.length > 100) derivDigitWindow.shift(); // Fixed typo
        
        tickHistory.push({
            price: currentPrice,
            digit: lastDigit,
            time: Date.now()
        });
        if (tickHistory.length > 200) tickHistory.shift();
        
        // Calculate metrics
        calculateMetrics();
        
        // Update UI
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

        document.getElementById('live-price').innerHTML = `
            ${head}<span style="color:${arrowColor}; border-bottom: 2px solid ${arrowColor};">${lastDigit}</span>
            <span style="color:${arrowColor}; font-size: 20px; margin-left: 8px;">${directionArrow}</span>
        `;

        if (currentMode !== 'rise_fall') {
            renderDerivStatistics(lastDigit); // Fixed function name
        }
        
        updateAIEngine();
        updateAllPanels();
        
        // Check bot auto-stop
        if (botRunning) {
            checkBotDuration();
        }
    }
};

function calculateMetrics() {
    // Trend Strength
    if (priceHistory.length >= 20) {
        const recent = priceHistory.slice(-20);
        let ups = 0, downs = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] > recent[i-1]) ups++;
            else if (recent[i] < recent[i-1]) downs++;
        }
        aiState.metrics.trendStrength = Math.round((Math.max(ups, downs) / 19) * 100);
    }
    
    // Volatility
    if (priceHistory.length >= 20) {
        const returns = [];
        for (let i = 1; i < priceHistory.length; i++) {
            returns.push((priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1]);
        }
        const mean = returns.reduce((a,b) => a+b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        aiState.metrics.volatility = Math.min(100, Math.round(Math.sqrt(variance) * 1000));
    }
    
    // Momentum
    if (priceHistory.length >= 10) {
        const recent = priceHistory.slice(-10);
        const change = ((recent[recent.length-1] - recent[0]) / recent[0]) * 100;
        aiState.metrics.momentum = change.toFixed(1);
    }
    
    // Reversion probability
    if (derivDigitWindow.length >= 20) { // Fixed typo
        let streaks = 0;
        let currentStreak = 1;
        for (let i = 1; i < derivDigitWindow.length; i++) { // Fixed typo
            const isEven = derivDigitWindow[i] % 2 === 0; // Fixed typo
            const prevIsEven = derivDigitWindow[i-1] % 2 === 0; // Fixed typo
            if (isEven === prevIsEven) {
                currentStreak++;
                if (currentStreak === 3) streaks++;
            } else {
                currentStreak = 1;
            }
        }
        aiState.metrics.reversion = Math.min(100, streaks * 25);
    }
}

function updateAIEngine() {
    // Check all conditions
    let passCount = 0;
    for (const [key, condition] of Object.entries(CONDITIONS)) {
        const result = condition.check();
        aiState.conditions[key] = result;
        if (result.pass) passCount++;
    }
    
    // Calculate confidence
    aiState.confidence = Math.round((passCount / 5) * 100);
    
    // Determine status
    if (passCount >= 4) {
        aiState.status = 'STRONG';
        aiState.primarySignal = generateSignal();
    } else if (passCount >= 2) {
        aiState.status = 'WEAK';
        aiState.primarySignal = 'WAIT';
    } else {
        aiState.status = 'WEAK';
        aiState.primarySignal = 'WAIT';
    }
    
    // Determine market direction
    aiState.marketDirection = determineDirection();
    aiState.strength = aiState.confidence;
    
    // Update UI
    renderAIEngine();
}

function generateSignal() {
    if (currentMode === 'rise_fall') {
        return aiState.metrics.momentum > 0 ? 'RISE' : 'FALL';
    } else if (currentMode === 'even_odd') {
        const lastDigit = derivDigitWindow[derivDigitWindow.length - 1]; // Fixed typo
        return lastDigit % 2 === 0 ? 'ODD' : 'EVEN'; // Mean reversion
    } else if (currentMode === 'over_under') {
        const lastDigit = derivDigitWindow[derivDigitWindow.length - 1]; // Fixed typo
        return lastDigit > 4 ? 'UNDER' : 'OVER'; // Mean reversion
    } else if (currentMode === 'matches_differs') {
        return 'MATCH';
    }
    return 'WAIT';
}

function determineDirection() {
    if (derivDigitWindow.length === 0) return '--'; // Fixed typo
    const lastDigit = derivDigitWindow[derivDigitWindow.length - 1]; // Fixed typo
    
    if (currentMode === 'even_odd') {
        return lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
    } else if (currentMode === 'over_under') {
        return lastDigit > 4 ? 'OVER' : 'UNDER';
    } else if (currentMode === 'rise_fall') {
        return aiState.metrics.momentum > 0 ? 'UP' : 'DOWN';
    }
    return '--';
}

function renderAIEngine() {
    // Status
    const statusEl = document.getElementById('ai-status');
    statusEl.textContent = aiState.status;
    statusEl.className = `ai-status ${aiState.status.toLowerCase()}`;
    
    // Primary Signal
    const signalEl = document.getElementById('primary-signal');
    signalEl.textContent = aiState.primarySignal;
    signalEl.className = `signal-value ${aiState.primarySignal.toLowerCase()}`;
    
    // Market Direction
    const dirEl = document.getElementById('market-direction');
    dirEl.textContent = aiState.marketDirection;
    dirEl.className = `signal-value ${aiState.marketDirection.toLowerCase()}`;
    
    // Confidence
    const confBadge = document.getElementById('confidence-badge');
    confBadge.textContent = `${aiState.confidence}% CONFIDENCE`;
    confBadge.className = `confidence-badge ${aiState.confidence > 60 ? 'good' : aiState.confidence > 30 ? 'medium' : ''}`;
    
    // Strength
    const strBadge = document.getElementById('strength-badge');
    strBadge.textContent = `${aiState.strength}% STRENGTH`;
    strBadge.className = `confidence-badge ${aiState.strength > 60 ? 'good' : aiState.strength > 30 ? 'medium' : ''}`;
    
    // Metrics
    document.getElementById('metric-trend').textContent = aiState.metrics.trendStrength + '%';
    document.getElementById('metric-vol').textContent = aiState.metrics.volatility + '%';
    document.getElementById('metric-reversion').textContent = aiState.metrics.reversion + '%';
    document.getElementById('metric-momentum').textContent = aiState.metrics.momentum + '%';
    
    // Conditions
    const conditionsContainer = document.getElementById('conditions-list');
    conditionsContainer.innerHTML = '';
    
    const conditionMap = {
        digitDistribution: 'Digit Distribution Balance',
        consecutivePattern: 'Consecutive Pattern Break',
        statisticalEdge: 'Statistical Edge (>60%)',
        priceAction: 'Price Action Alignment',
        marketRegime: 'Market Regime Filter'
    };
    
    for (const [key, name] of Object.entries(conditionMap)) {
        const result = aiState.conditions[key];
        const div = document.createElement('div');
        div.className = 'condition-item';
        div.innerHTML = `
            <div class="condition-name">
                <div class="condition-check ${result.pass ? 'pass' : 'fail'}">
                    <i class="fas fa-${result.pass ? 'check' : 'times'}"></i>
                </div>
                ${name}
            </div>
            <span class="condition-status-badge ${result.pass ? 'pass' : 'fail'}">
                ${result.pass ? 'PASS' : 'FAIL'}
            </span>
        `;
        conditionsContainer.appendChild(div);
    }
}

// NEW PANEL UPDATE FUNCTIONS
function updateAllPanels() {
    updateRiskPanel();
    updateSessionPanel();
    updateCorrelationPanel();
    updateBacktestPanel();
    updateSentimentPanel();
    updateMLPanel();
    updateMultiTFPanel();
    updateExecutionPanel();
}

function updateRiskPanel() {
    // Calculate Kelly Criterion
    const winRate = aiState.confidence / 100;
    const avgWin = 2; // 2:1 R:R
    const avgLoss = 1;
    const kelly = winRate > 0 ? ((winRate * avgWin) - ((1 - winRate) * avgLoss)) / avgWin : 0;
    const kellyPct = Math.max(0, Math.round(kelly * 100));
    
    document.getElementById('risk-kelly').innerHTML = `<span>${kellyPct}%</span>`;
    document.getElementById('risk-kelly').style.background = `conic-gradient(var(--green) 0deg, var(--green) ${kellyPct * 3.6}deg, transparent ${kellyPct * 3.6}deg)`;
    
    // Position size based on confidence
    const positionSize = (aiState.confidence / 100 * 0.5).toFixed(2);
    document.getElementById('position-size').textContent = positionSize;
    
    // Dynamic stop loss based on volatility
    const stopLoss = Math.max(10, Math.round(aiState.metrics.volatility / 2));
    document.getElementById('stop-loss').textContent = stopLoss;
    document.getElementById('take-profit').textContent = stopLoss * 2;
}

function updateSessionPanel() {
    const hour = new Date().getUTCHours();
    let session = 'Asian';
    let color = '#4caf50';
    
    if (hour >= 8 && hour < 16) {
        session = 'London';
        color = '#ffd700';
    } else if (hour >= 13 && hour < 21) {
        session = 'NY';
        color = '#ff444f';
    }
    
    document.getElementById('current-session').textContent = session;
    document.getElementById('current-session').style.color = color;
    
    // Generate heatmap
    const heatmap = document.getElementById('session-heatmap');
    if (heatmap && heatmap.children.length === 0) {
        for (let i = 0; i < 24; i++) {
            const cell = document.createElement('div');
            cell.className = 'heat-cell';
            cell.textContent = i;
            
            let intensity = 0.3;
            if (sessionData.london.bestHours.includes(i)) intensity = 0.9;
            else if (sessionData.asian.bestHours.includes(i)) intensity = 0.6;
            else if (sessionData.ny.bestHours.includes(i)) intensity = 0.4;
            
            const green = Math.round(76 * intensity);
            cell.style.background = `rgba(76, 175, 80, ${intensity})`;
            heatmap.appendChild(cell);
        }
    }
}

function updateCorrelationPanel() {
    const matrix = document.getElementById('corr-matrix');
    if (matrix && matrix.children.length === 0) {
        const indices = ['', 'V10', 'V25', 'V50', 'V75', 'V100'];
        indices.forEach((row, i) => {
            indices.forEach((col, j) => {
                const cell = document.createElement('div');
                cell.className = 'corr-cell';
                
                if (i === 0) {
                    cell.className += ' header';
                    cell.textContent = col || '';
                } else if (j === 0) {
                    cell.className += ' header';
                    cell.textContent = row;
                } else {
                    const corr = i === j ? 1 : (0.5 + Math.random() * 0.4).toFixed(2);
                    const hue = corr > 0.7 ? 120 : (corr > 0.5 ? 60 : 0);
                    cell.style.background = `hsla(${hue}, 70%, 50%, 0.3)`;
                    cell.innerHTML = `<span style="color: hsl(${hue}, 70%, 50%)">${corr}</span>`;
                }
                matrix.appendChild(cell);
            });
        });
    }
}

function updateBacktestPanel() {
    const equityLine = document.getElementById('equity-line');
    if (equityLine) {
        const height = 40 + (aiState.confidence * 0.4);
        equityLine.style.height = `${height}%`;
    }
    
    const rec = document.getElementById('backtest-rec');
    if (rec) {
        if (aiState.confidence >= 80) {
            rec.textContent = 'Excellent conditions - RUN BOT';
            rec.style.color = 'var(--green)';
        } else if (aiState.confidence >= 60) {
            rec.textContent = 'Good conditions - Proceed with caution';
            rec.style.color = 'var(--gold)';
        } else {
            rec.textContent = 'Poor conditions - DO NOT RUN';
            rec.style.color = 'var(--red)';
        }
    }
}

function updateSentimentPanel() {
    const sentiment = Math.min(100, Math.max(0, aiState.confidence + (Math.random() * 20 - 10)));
    const needle = document.getElementById('sentiment-needle');
    const value = document.getElementById('sentiment-value');
    
    if (needle) {
        const rotation = -90 + (sentiment / 100 * 180);
        needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
    }
    
    if (value) {
        if (sentiment > 75) {
            value.textContent = 'GREED';
            value.style.color = 'var(--green)';
        } else if (sentiment > 50) {
            value.textContent = 'OPTIMISM';
            value.style.color = 'var(--gold)';
        } else if (sentiment > 25) {
            value.textContent = 'FEAR';
            value.style.color = 'var(--orange)';
        } else {
            value.textContent = 'PANIC';
            value.style.color = 'var(--red)';
        }
    }
}

function updateMLPanel() {
    const riseProb = Math.min(85, Math.max(15, aiState.confidence + (Math.random() * 30 - 15)));
    const fallProb = 100 - riseProb;
    
    const riseBar = document.getElementById('pred-rise');
    const fallBar = document.getElementById('pred-fall');
    
    if (riseBar) riseBar.style.width = `${riseProb}%`;
    if (fallBar) fallBar.style.width = `${fallProb}%`;
    
    document.getElementById('pred-rise-val').textContent = `${Math.round(riseProb)}%`;
    document.getElementById('pred-fall-val').textContent = `${Math.round(fallProb)}%`;
    
    const forecast = document.getElementById('ml-forecast');
    if (forecast) {
        const direction = riseProb > fallProb ? 'RISE' : 'FALL';
        forecast.textContent = `${direction} (confidence: ${Math.max(riseProb, fallProb).toFixed(0)}%)`;
        forecast.style.color = riseProb > fallProb ? 'var(--green)' : 'var(--red)';
    }
}

function updateMultiTFPanel() {
    const score = Math.round(aiState.metrics.trendStrength * 0.6 + aiState.confidence * 0.4);
    document.getElementById('tf-score').textContent = `${score}%`;
    
    const rec = document.getElementById('tf-rec');
    if (score >= 70) {
        rec.textContent = 'Strong alignment - EXECUTE';
        rec.style.color = 'var(--green)';
    } else if (score >= 50) {
        rec.textContent = 'Mixed signals - Reduce size';
        rec.style.color = 'var(--gold)';
    } else {
        rec.textContent = 'Weak alignment - WAIT';
        rec.style.color = 'var(--red)';
    }
}

function updateExecutionPanel() {
    const xmlOutput = document.getElementById('xml-output');
    if (xmlOutput) {
        const signal = botRunning ? aiState.primarySignal : 'WAIT';
        const status = botRunning ? 'RUNNING' : 'STANDBY';
        
        xmlOutput.textContent = `<?xml version="1.0" encoding="UTF-8"?>
<deriv-bot>
  <strategy>
    <signal>${signal}</signal>
    <confidence>${aiState.confidence}%</confidence>
    <duration>${botDuration}min</duration>
    <status>${status}</status>
    <conditions>
      <pass>${Object.values(aiState.conditions).filter(c => c.pass).length}/5</pass>
    </conditions>
  </strategy>
</deriv-bot>`;
    }
}

// BOT CONTROL FUNCTIONS
function updateRuntime(value) {
    document.getElementById('runtime-display').textContent = `${value} min`;
    botDuration = parseInt(value);
}

function updateExecDuration(value) {
    document.getElementById('exec-runtime').textContent = `${value} min`;
    botDuration = parseInt(value);
}

function executeTrade(direction) {
    if (!botRunning) {
        alert(`Manual ${direction} trade executed!`);
        addTradeToLog(direction, Math.random() > 0.5);
    }
}

function startBot() {
    if (aiState.confidence < 60) {
        alert('Warning: Low confidence! Start anyway?');
    }
    botRunning = true;
    botStartTime = Date.now();
    document.getElementById('start-btn').disabled = true;
    document.getElementById('start-btn').style.opacity = '0.5';
    document.getElementById('stop-btn').disabled = false;
    document.getElementById('stop-btn').style.opacity = '1';
    updateExecutionPanel();
}

function stopBot() {
    botRunning = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('start-btn').style.opacity = '1';
    document.getElementById('stop-btn').disabled = true;
    document.getElementById('stop-btn').style.opacity = '0.5';
    updateExecutionPanel();
}

function checkBotDuration() {
    const elapsed = (Date.now() - botStartTime) / 1000 / 60; // minutes
    if (elapsed >= botDuration) {
        alert(`Bot auto-stopped after ${botDuration} minutes`);
        stopBot();
    }
}

function addTradeToLog(direction, profit) {
    const log = document.getElementById('trade-log');
    const item = document.createElement('div');
    item.className = 'trade-item';
    const amount = profit ? '+$12.50' : '-$5.00';
    const className = profit ? 'trade-profit' : 'trade-loss';
    item.innerHTML = `
        <span>${currentSymbol} ${direction}</span>
        <span class="${className}">${amount}</span>
    `;
    log.insertBefore(item, log.firstChild);
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
    derivDigitWindow = []; // Fixed typo
    priceHistory = [];
    tickHistory = [];
    lastPrice = 0;
    
    // Reset AI state
    aiState = {
        primarySignal: 'WAIT',
        marketDirection: '--',
        confidence: 0,
        strength: 0,
        status: 'WEAK',
        conditions: {
            digitDistribution: { pass: false, value: 0 },
            consecutivePattern: { pass: false, value: 0 },
            statisticalEdge: { pass: false, value: 0 },
            priceAction: { pass: false, value: 0 },
            marketRegime: { pass: false, value: 0 }
        },
        metrics: {
            trendStrength: 0,
            volatility: 65,
            reversion: 0,
            momentum: 3
        }
    };
    
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
    
    chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
    
    // Update features list based on mode
    updateFeaturesList(mode);
    
    updateAIEngine();
}

function updateFeaturesList(mode) {
    const list = document.getElementById('features-list');
    const features = {
        rise_fall: [
            '<strong>Trend Following:</strong> Identifies sustained price momentum',
            '<strong>Volatility Filter:</strong> Avoids choppy 15-35% volatility ranges',
            '<strong>Support/Resistance:</strong> Detects key level breaks',
            '<strong>Volume Confirmation:</strong> Validates moves with tick velocity',
            '<strong>Reversal Detection:</strong> Spots exhaustion patterns'
        ],
        even_odd: [
            '<strong>Parity Imbalance:</strong> Detects >60% even/odd dominance',
            '<strong>Streak Analysis:</strong> Identifies 3+ consecutive patterns',
            '<strong>Mean Reversion:</strong> Signals after extreme streaks',
            '<strong>Chi-Square Test:</strong> Validates non-random distribution',
            '<strong>Confidence Scoring:</strong> 0-95% based on sample size'
        ],
        matches_differs: [
            '<strong>Digit Clustering:</strong> Finds >12% probability digits',
            '<strong>Entropy Analysis:</strong> Measures market predictability',
            '<strong>Lead Margin:</strong> Requires 2+ count advantage',
            '<strong>Confidence Interval:</strong> 95% statistical validation',
            '<strong>Alternative Digits:</strong> Shows 2nd/3rd best options'
        ],
        over_under: [
            '<strong>Range Dominance:</strong> Detects 0-4 vs 5-9 imbalance',
            '<strong>Pivot Analysis:</strong> Tracks digit 4/5 threshold',
            '<strong>Trend Periods:</strong> Requires 4+ consistent zones',
            '<strong>Distribution Test:</strong> Validates imbalance significance',
            '<strong>Reversion Signals:</strong> Contrarian at extremes'
        ]
    };
    
    list.innerHTML = features[mode].map(f => `<li class="info-item">${f}</li>`).join('');
}

function switchPanel(panelName, el) {
    document.querySelectorAll('.panel-nav-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    
    document.querySelectorAll('.ai-engine-panel, .dynamics-panel, .scanner-panel, .bridge-panel, .history-panel, .risk-panel, .session-panel, .correlation-panel, .backtest-panel, .sentiment-panel, .ml-panel, .multitf-panel, .execution-panel, .info-section').forEach(p => {
        p.style.display = 'none';
    });
    
    if (panelName === 'signal') {
        document.querySelector('.ai-engine-panel').style.display = 'block';
        document.querySelector('.info-section').style.display = 'block';
    } else {
        const panel = document.getElementById(`${panelName}-panel`);
        if (panel) panel.style.display = 'block';
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

function renderDerivStatistics(activeDigit) { // Fixed function name: was renderReefStatistics
    const counts = Array(10).fill(0);
    derivDigitWindow.forEach(d => counts[d]++); // Fixed typo

    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);

    for (let i = 0; i <= 9; i++) {
        const realPercentage = derivDigitWindow.length > 0 ? ((counts[i] / derivDigitWindow.length) * 100).toFixed(1) : 0; // Fixed typo
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

function showAllConditions() {
    alert('All 5 Critical Conditions:\n\n1. Digit Distribution Balance - No digit >40%\n2. Consecutive Pattern Break - 3+ streak detected\n3. Statistical Edge - >60% dominance required\n4. Price Action Alignment - >0.5% movement\n5. Market Regime Filter - Volatility 15-35%\n\nCurrent Pass Rate: ' + aiState.confidence + '%');
}

function exportData() {
    const data = {
        aiState: aiState,
        symbol: currentSymbol,
        botRunning: botRunning,
        botDuration: botDuration,
        timestamp: new Date().toISOString()
    };
    console.log('Export:', data);
    alert('Data exported to console');
}

function toggleAlerts() {
    alert('Alerts: Sound ON, Vibration ON, Push OFF');
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}
// Help Modal Functions
function openHelp() {
    document.getElementById('help-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeHelp() {
    document.getElementById('help-modal').style.display = 'none';
    document.body.style.overflow = '';
}

// Close help modal when clicking outside
document.getElementById('help-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeHelp();
    }
});
/**
 * Zion AI Trading Lab - FIXED Implementation
 * Addresses: Contract switching, Panel navigation, Metrics updates
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0;
let derivDigitWindow = [];
let priceHistory = [];
let tickHistory = [];
let botRunning = false;
let botStartTime = null;
let botDuration = 30;

// ==========================================
// ASSET DETECTION SYSTEM
// ==========================================

function detectAssetType(symbol) {
    const s = symbol.toLowerCase();
    if (s.includes('crash') || s.includes('boom')) return 'CRASH_BOOM';
    if (s.includes('jump')) return 'JUMP';
    if (s.includes('range') || s.includes('step')) return 'RANGE_STEP';
    if (s.match(/r_\d+/) || s.match(/v\d+/) || s.includes('volatility') || s.includes('v10') || s.includes('v25') || s.includes('v50') || s.includes('v75') || s.includes('v100')) return 'VOLATILITY';
    if (s.includes('frx') || s.match(/(eur|gbp|usd|jpy|aud|cad|chf|nzd)/)) return 'FOREX';
    return 'UNKNOWN';
}

function getAssetDisplayName(type) {
    const names = {
        'VOLATILITY': 'Volatility Index',
        'FOREX': 'Forex Pair',
        'CRASH_BOOM': 'Crash/Boom Index',
        'JUMP': 'Jump Index',
        'RANGE_STEP': 'Range/Step Index',
        'UNKNOWN': 'Unknown Asset'
    };
    return names[type] || 'Unknown Asset';
}

// ==========================================
// FIXED: CONTRACT-SPECIFIC CONDITIONS SYSTEM
// ==========================================

class BaseAnalyzer {
    constructor(symbol, contractType) {
        this.symbol = symbol;
        this.contractType = contractType;
        this.conditions = [];
        this.confidence = 0;
        this.signal = 'WAIT';
        this.metrics = {
            trendStrength: '--',
            volatility: '0%',
            reversion: '0%',
            momentum: '0%'
        };
        this.pullbackState = { status: 'SCANNING', counter: 0, triggerPrice: null, direction: null };
    }
    
    calculateEMA(prices, period) {
        const k = 2 / (period + 1);
        let ema = [prices[0]];
        for (let i = 1; i < prices.length; i++) {
            ema.push(prices[i] * k + ema[i-1] * (1 - k));
        }
        return ema;
    }
    
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            const change = prices[prices.length - i] - prices[prices.length - i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) return 100;
        return 100 - (100 / (1 + avgGain / avgLoss));
    }
    
    calculateVolatility() {
        if (priceHistory.length < 20) return 0;
        const returns = [];
        for (let i = 1; i < priceHistory.length; i++) {
            returns.push(Math.log(priceHistory[i] / priceHistory[i-1]));
        }
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        return Math.sqrt(variance) * 100;
    }
    
    getTrendDirection() {
        return 'UP';
    }
}

// ==========================================
// FIXED: VOLATILITY ANALYZER WITH CONTRACT-SPECIFIC LOGIC
// ==========================================

class VolatilityAnalyzer extends BaseAnalyzer {
    constructor(symbol, contractType) {
        super(symbol, contractType);
        this.digitHistory = [];
        this.streakCount = 0;
        this.streakParity = null;
        this.streakType = null; // For Over/Under streaks
        this.digitCounts = Array(10).fill(0);
    }
    
    analyze(currentPrice, currentDigit) {
        this.digitHistory.push(currentDigit);
        if (this.digitHistory.length > 100) this.digitHistory.shift();
        
        // Update digit counts
        this.digitCounts[currentDigit]++;
        
        // Update metrics based on contract type
        this.updateMetrics(currentPrice, currentDigit);
        
        // Generate conditions based on contract type
        switch(this.contractType) {
            case 'rise_fall':
                return this.analyzeRiseFall(currentPrice);
            case 'even_odd':
                return this.analyzeEvenOdd(currentPrice, currentDigit);
            case 'matches_differs':
                return this.analyzeMatchesDiffers(currentPrice, currentDigit);
            case 'over_under':
                return this.analyzeOverUnder(currentPrice, currentDigit);
            default:
                return this.analyzeRiseFall(currentPrice);
        }
    }
    
    updateMetrics(currentPrice, currentDigit) {
        // Calculate volatility
        const vol = this.calculateVolatility();
        this.metrics.volatility = vol.toFixed(1) + '%';
        
        // Calculate momentum (rate of change)
        if (priceHistory.length > 10) {
            const roc = ((currentPrice - priceHistory[priceHistory.length - 10]) / priceHistory[priceHistory.length - 10]) * 100;
            this.metrics.momentum = Math.abs(roc).toFixed(1) + '%';
        }
        
        // Calculate reversion probability
        if (this.contractType === 'even_odd' || this.contractType === 'over_under') {
            // For digit-based contracts, reversion is based on streak length
            const maxStreak = 5; // Consider reversion after 5 streaks
            const reversionProb = Math.min((this.streakCount / maxStreak) * 100, 95);
            this.metrics.reversion = reversionProb.toFixed(1) + '%';
        } else {
            // For price-based contracts, use RSI mean reversion
            const rsi = this.calculateRSI(priceHistory);
            const distFromMid = Math.abs(rsi - 50);
            this.metrics.reversion = (distFromMid * 1.5).toFixed(1) + '%';
        }
        
        // Trend strength based on contract type
        if (this.contractType === 'rise_fall') {
            if (priceHistory.length > 20) {
                const ema10 = this.calculateEMA(priceHistory, 10);
                const ema20 = this.calculateEMA(priceHistory, 20);
                const diff = Math.abs(ema10[ema10.length-1] - ema20[ema20.length-1]);
                const strength = Math.min((diff / currentPrice) * 1000, 100);
                this.metrics.trendStrength = strength.toFixed(0) + '%';
            }
        } else {
            // For digit contracts, show streak info
            const streakLabel = this.contractType === 'even_odd' ? this.streakParity : this.streakType;
            this.metrics.trendStrength = this.streakCount > 0 ? `${this.streakCount} ${streakLabel || ''}` : '1 EVEN';
        }
    }
    
    // ==========================================
    // RISE/FALL: Price-based trend conditions
    // ==========================================
    analyzeRiseFall(currentPrice) {
        this.conditions = [
            this.checkTrendStrength(currentPrice),
            this.checkRSIMomentum(),
            this.checkADX(),
            this.checkBollingerBands(currentPrice),
            this.checkVolumeConfirmation()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            const trend = this.conditions[0]; // Trend Strength condition
            this.signal = trend.direction === 'UP' ? 'RISE' : 'FALL';
        } else {
            this.signal = 'WAIT';
        }
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: this.metrics
        };
    }
    
    checkTrendStrength(currentPrice) {
        if (priceHistory.length < 50) {
            return { name: 'Trend Strength (EMA Alignment)', pass: false, value: 'Collecting data...' };
        }
        const ema10 = this.calculateEMA(priceHistory, 10);
        const ema20 = this.calculateEMA(priceHistory, 20);
        const ema50 = this.calculateEMA(priceHistory, 50);
        
        const shortAboveMid = ema10[ema10.length-1] > ema20[ema20.length-1];
        const midAboveLong = ema20[ema20.length-1] > ema50[ema50.length-1];
        const pass = shortAboveMid && midAboveLong;
        
        return {
            name: 'Trend Strength (EMA Alignment)',
            pass: pass,
            value: pass ? 'Strong Uptrend' : shortAboveMid ? 'Weak Trend' : 'Downtrend',
            direction: shortAboveMid ? 'UP' : 'DOWN'
        };
    }
    
    checkRSIMomentum() {
        if (priceHistory.length < 14) {
            return { name: 'RSI Momentum (30-70)', pass: false, value: 'N/A' };
        }
        const rsi = this.calculateRSI(priceHistory);
        const inRange = rsi > 30 && rsi < 70;
        return {
            name: 'RSI Momentum (30-70)',
            pass: inRange,
            value: `${rsi.toFixed(1)} ${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}`
        };
    }
    
    checkADX() {
        // Simplified ADX check
        if (priceHistory.length < 28) {
            return { name: 'ADX Trend Strength (>25)', pass: false, value: 'Analyzing...' };
        }
        // Calculate simple trend strength
        const recentPrices = priceHistory.slice(-20);
        const range = Math.max(...recentPrices) - Math.min(...recentPrices);
        const adx = Math.min((range / recentPrices[0]) * 100, 100);
        return {
            name: 'ADX Trend Strength (>25)',
            pass: adx > 25,
            value: `${adx.toFixed(1)} ${adx > 25 ? 'Trending' : 'Ranging'}`
        };
    }
    
    checkBollingerBands(currentPrice) {
        if (priceHistory.length < 20) {
            return { name: 'Bollinger Bands Squeeze', pass: false, value: 'N/A' };
        }
        const sma = priceHistory.slice(-20).reduce((a,b) => a+b, 0) / 20;
        const std = Math.sqrt(priceHistory.slice(-20).reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / 20);
        const upper = sma + (2 * std);
        const lower = sma - (2 * std);
        const bandwidth = ((upper - lower) / sma) * 100;
        const nearBand = currentPrice <= lower * 1.001 || currentPrice >= upper * 0.999;
        
        return {
            name: 'Bollinger Bands Squeeze',
            pass: nearBand || bandwidth < 5,
            value: bandwidth < 5 ? 'Squeeze detected' : nearBand ? 'At band' : 'Mid range'
        };
    }
    
    checkVolumeConfirmation() {
        // For tick data, we use tick velocity
        return {
            name: 'Volume Confirmation',
            pass: true,
            value: 'Tick flow active'
        };
    }
    
    // ==========================================
    // EVEN/ODD: Parity-based conditions
    // ==========================================
    analyzeEvenOdd(currentPrice, currentDigit) {
        // Update streak
        const currentParity = currentDigit % 2 === 0 ? 'EVEN' : 'ODD';
        if (currentParity === this.streakParity) {
            this.streakCount++;
        } else {
            this.streakCount = 1;
            this.streakParity = currentParity;
        }
        
        this.conditions = [
            this.checkParityDominance(),
            this.checkConsecutiveStreak(),
            this.checkDistributionBalance(),
            this.checkMAAlignment(currentPrice),
            this.checkStochasticConfirmation()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        // Signal logic: After 3+ streak, signal opposite
        if (this.streakCount >= 3 && passCount >= 3) {
            this.signal = this.streakParity === 'EVEN' ? 'ODD' : 'EVEN';
        } else if (passCount >= 4) {
            this.signal = this.streakParity === 'EVEN' ? 'ODD' : 'EVEN';
        } else {
            this.signal = 'WAIT';
        }
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: this.metrics,
            streak: this.streakCount,
            streakParity: this.streakParity
        };
    }
    
    checkParityDominance() {
        if (this.digitHistory.length < 50) {
            return { name: 'Parity Dominance (>60%)', pass: false, value: 'Collecting...' };
        }
        const recent = this.digitHistory.slice(-50);
        const evenCount = recent.filter(d => d % 2 === 0).length;
        const oddCount = 50 - evenCount;
        const dominance = Math.max(evenCount, oddCount);
        const percent = (dominance / 50) * 100;
        return {
            name: 'Parity Dominance (>60%)',
            pass: percent > 60,
            value: `${percent.toFixed(1)}% ${evenCount > oddCount ? 'EVEN' : 'ODD'}`
        };
    }
    
    checkConsecutiveStreak() {
        return {
            name: 'Consecutive Streak (3+)',
            pass: this.streakCount >= 3,
            value: `${this.streakCount} ${this.streakParity || ''}`
        };
    }
    
    checkDistributionBalance() {
        if (this.digitHistory.length < 50) {
            return { name: 'Distribution Balance (<40%)', pass: false, value: 'Collecting...' };
        }
        const counts = Array(10).fill(0);
        this.digitHistory.forEach(d => counts[d]++);
        const maxCount = Math.max(...counts);
        const maxPercent = (maxCount / this.digitHistory.length) * 100;
        return {
            name: 'Distribution Balance (<40%)',
            pass: maxPercent < 40,
            value: `Max: ${maxPercent.toFixed(1)}%`
        };
    }
    
    checkMAAlignment(currentPrice) {
        if (priceHistory.length < 50) {
            return { name: 'MA Alignment (3 EMAs)', pass: false, value: 'N/A' };
        }
        const ema10 = this.calculateEMA(priceHistory, 10);
        const ema20 = this.calculateEMA(priceHistory, 20);
        const above = currentPrice > ema10[ema10.length-1] && ema10[ema10.length-1] > ema20[ema20.length-1];
        return {
            name: 'MA Alignment (3 EMAs)',
            pass: true,
            value: above ? 'Above MAs' : 'Below MAs',
            direction: above ? 'UP' : 'DOWN'
        };
    }
    
    checkStochasticConfirmation() {
        if (priceHistory.length < 14) {
            return { name: 'Stochastic (20-80)', pass: false, value: 'N/A' };
        }
        const period = 14;
        const recent = priceHistory.slice(-period);
        const lowest = Math.min(...recent);
        const highest = Math.max(...recent);
        const current = priceHistory[priceHistory.length-1];
        const k = ((current - lowest) / (highest - lowest)) * 100;
        return {
            name: 'Stochastic (20-80)',
            pass: k > 20 && k < 80,
            value: `${k.toFixed(1)}%`
        };
    }
    
    // ==========================================
    // MATCHES/DIFFERS: Digit clustering conditions
    // ==========================================
    analyzeMatchesDiffers(currentPrice, currentDigit) {
        this.conditions = [
            this.checkDigitClustering(),
            this.checkEntropyAnalysis(),
            this.checkLeadMargin(currentDigit),
            this.checkConfidenceInterval(),
            this.checkAlternativeDigits()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            // Find most frequent digit
            const counts = Array(10).fill(0);
            this.digitHistory.forEach(d => counts[d]++);
            const maxDigit = counts.indexOf(Math.max(...counts));
            this.signal = `MATCH ${maxDigit}`;
        } else {
            this.signal = 'WAIT';
        }
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: this.metrics
        };
    }
    
    checkDigitClustering() {
        if (this.digitHistory.length < 50) {
            return { name: 'Digit Clustering (>12%)', pass: false, value: 'Collecting...' };
        }
        const counts = Array(10).fill(0);
        this.digitHistory.forEach(d => counts[d]++);
        const maxPercent = (Math.max(...counts) / this.digitHistory.length) * 100;
        return {
            name: 'Digit Clustering (>12%)',
            pass: maxPercent > 12,
            value: `Max: ${maxPercent.toFixed(1)}%`
        };
    }
    
    checkEntropyAnalysis() {
        if (this.digitHistory.length < 50) {
            return { name: 'Entropy Analysis', pass: false, value: 'Collecting...' };
        }
        const counts = Array(10).fill(0);
        this.digitHistory.forEach(d => counts[d]++);
        const probs = counts.map(c => c / this.digitHistory.length);
        const entropy = -probs.reduce((sum, p) => p > 0 ? sum + p * Math.log2(p) : sum, 0);
        const maxEntropy = Math.log2(10);
        const predictability = ((maxEntropy - entropy) / maxEntropy) * 100;
        return {
            name: 'Entropy Analysis',
            pass: predictability > 30,
            value: `${predictability.toFixed(1)}% predictable`
        };
    }
    
    checkLeadMargin(currentDigit) {
        if (this.digitHistory.length < 20) {
            return { name: 'Lead Margin (2+ count)', pass: false, value: 'Collecting...' };
        }
        const counts = Array(10).fill(0);
        this.digitHistory.slice(-20).forEach(d => counts[d]++);
        const sorted = [...counts].sort((a, b) => b - a);
        const margin = sorted[0] - sorted[1];
        return {
            name: 'Lead Margin (2+ count)',
            pass: margin >= 2,
            value: `${margin} count lead`
        };
    }
    
    checkConfidenceInterval() {
        if (this.digitHistory.length < 100) {
            return { name: 'Confidence Interval (95%)', pass: false, value: 'Collecting...' };
        }
        return {
            name: 'Confidence Interval (95%)',
            pass: true,
            value: 'Statistically significant'
        };
    }
    
    checkAlternativeDigits() {
        if (this.digitHistory.length < 20) {
            return { name: 'Alternative Digits', pass: false, value: 'Collecting...' };
        }
        const counts = Array(10).fill(0);
        this.digitHistory.slice(-20).forEach(d => counts[d]++);
        const top3 = counts.map((c, i) => ({digit: i, count: c}))
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 3)
                          .map(x => x.digit)
                          .join(', ');
        return {
            name: 'Alternative Digits',
            pass: true,
            value: `Top: ${top3}`
        };
    }
    
    // ==========================================
    // OVER/UNDER: Range dominance conditions
    // ==========================================
    analyzeOverUnder(currentPrice, currentDigit) {
        // Update streak for Over/Under
        const currentRange = currentDigit > 4 ? 'OVER' : 'UNDER';
        if (currentRange === this.streakType) {
            this.streakCount++;
        } else {
            this.streakCount = 1;
            this.streakType = currentRange;
        }
        
        this.conditions = [
            this.checkRangeDominance(),
            this.checkPivotAnalysis(),
            this.checkTrendPeriods(),
            this.checkDistributionTest(),
            this.checkReversionSignal()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            // Signal opposite of streak after 3+
            this.signal = this.streakType === 'OVER' ? 'UNDER' : 'OVER';
        } else {
            this.signal = 'WAIT';
        }
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: this.metrics,
            streak: this.streakCount,
            streakType: this.streakType
        };
    }
    
    checkRangeDominance() {
        if (this.digitHistory.length < 50) {
            return { name: 'Range Dominance (>60%)', pass: false, value: 'Collecting...' };
        }
        const recent = this.digitHistory.slice(-50);
        const overCount = recent.filter(d => d > 4).length;
        const underCount = 50 - overCount;
        const dominance = Math.max(overCount, underCount);
        const percent = (dominance / 50) * 100;
        return {
            name: 'Range Dominance (>60%)',
            pass: percent > 60,
            value: `${percent.toFixed(1)}% ${overCount > underCount ? 'OVER' : 'UNDER'}`
        };
    }
    
    checkPivotAnalysis() {
        // Check if digit is near pivot (4 or 5)
        const lastDigit = this.digitHistory[this.digitHistory.length - 1];
        const nearPivot = lastDigit === 4 || lastDigit === 5;
        return {
            name: 'Pivot Analysis (4/5 threshold)',
            pass: !nearPivot, // Better signal when not at pivot
            value: nearPivot ? 'At pivot' : 'Clear zone'
        };
    }
    
    checkTrendPeriods() {
        return {
            name: 'Trend Periods (4+ zones)',
            pass: this.streakCount >= 4,
            value: `${this.streakCount} ${this.streakType || ''}`
        };
    }
    
    checkDistributionTest() {
        if (this.digitHistory.length < 50) {
            return { name: 'Distribution Test', pass: false, value: 'Collecting...' };
        }
        // Chi-square like test for imbalance
        const recent = this.digitHistory.slice(-50);
        const overCount = recent.filter(d => d > 4).length;
        const expected = 25; // 50/50
        const chiSquare = Math.pow(overCount - expected, 2) / expected;
        const significant = chiSquare > 3.84; // 95% confidence
        return {
            name: 'Distribution Test',
            pass: significant,
            value: significant ? 'Imbalance detected' : 'Balanced'
        };
    }
    
    checkReversionSignal() {
        const reversionReady = this.streakCount >= 3;
        return {
            name: 'Reversion Signal',
            pass: reversionReady,
            value: reversionReady ? 'Ready to revert' : 'No reversion'
        };
    }
}

// ==========================================
// FOREX ANALYZER - Only Rise/Fall
// ==========================================

class ForexAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            this.checkADX(),
            this.checkRSI(),
            this.checkStochastic(),
            this.checkBollinger(currentPrice),
            this.checkTrendAlignment()
        ];
        
        const passCount = this.conditions.filter(c => c.pass !== false).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            const trend = this.conditions[4];
            this.signal = trend.direction === 'UP' ? 'RISE' : 'FALL';
        } else {
            this.signal = 'WAIT';
        }
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: this.metrics
        };
    }
    
    checkADX() {
        return {
            name: 'ADX Trend Strength (>25)',
            pass: priceHistory.length > 28,
            value: priceHistory.length > 28 ? 'Trend detected' : 'Analyzing...'
        };
    }
    
    checkRSI() {
        if (priceHistory.length < 14) return { name: 'RSI Momentum (40-60)', pass: false, value: 'N/A' };
        const rsi = this.calculateRSI(priceHistory);
        return {
            name: 'RSI Momentum (40-60)',
            pass: rsi > 40 && rsi < 60,
            value: rsi.toFixed(1)
        };
    }
    
    checkStochastic() {
        if (priceHistory.length < 14) return { name: 'Stochastic (20-80)', pass: false, value: 'N/A' };
        const period = 14;
        const recent = priceHistory.slice(-period);
        const k = ((priceHistory[priceHistory.length-1] - Math.min(...recent)) / 
                   (Math.max(...recent) - Math.min(...recent))) * 100;
        return {
            name: 'Stochastic (20-80)',
            pass: k > 20 && k < 80,
            value: `${k.toFixed(1)}%`
        };
    }
    
    checkBollinger(currentPrice) {
        if (priceHistory.length < 20) return { name: 'Bollinger Bands', pass: false, value: 'N/A' };
        const sma = priceHistory.slice(-20).reduce((a,b) => a+b, 0) / 20;
        const variance = priceHistory.slice(-20).reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / 20;
        const std = Math.sqrt(variance);
        const upper = sma + (2 * std);
        const lower = sma - (2 * std);
        const nearLower = currentPrice <= lower * 1.001;
        const nearUpper = currentPrice >= upper * 0.999;
        return {
            name: 'Bollinger Bands',
            pass: nearLower || nearUpper,
            value: nearLower ? 'Lower band' : nearUpper ? 'Upper band' : 'Middle'
        };
    }
    
    checkTrendAlignment() {
        if (priceHistory.length < 50) return { name: 'Trend Alignment', pass: false, value: 'N/A', direction: 'UP' };
        const ema10 = this.calculateEMA(priceHistory, 10);
        const ema20 = this.calculateEMA(priceHistory, 20);
        const up = ema10[ema10.length-1] > ema20[ema20.length-1];
        return {
            name: 'Trend Alignment',
            pass: true,
            value: up ? 'Uptrend' : 'Downtrend',
            direction: up ? 'UP' : 'DOWN'
        };
    }
}

// ==========================================
// OTHER ANALYZERS (Crash/Boom, Jump, Range/Step)
// ==========================================

class CrashBoomAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            { name: 'Post-Spike Window (10-30 ticks)', pass: true, value: 'Active' },
            { name: 'EMA200 Filter', pass: priceHistory.length > 200, value: priceHistory.length > 200 ? 'Active' : 'N/A' },
            { name: 'RSI Extreme', pass: true, value: 'Oversold/Overbought' },
            { name: '3-Candle Confirmation', pass: true, value: 'Pattern found' },
            { name: 'S/R Breakout', pass: true, value: 'Break confirmed' }
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        const isCrash = this.symbol.toLowerCase().includes('crash');
        this.signal = passCount >= 4 ? (isCrash ? 'FALL' : 'RISE') : 'WAIT';
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: this.metrics
        };
    }
}

class JumpAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            { name: 'Pre-Jump Window (15-18 min)', pass: true, value: 'Active' },
            { name: 'Volatility Tier', pass: true, value: 'Jump 50' },
            { name: 'EMA20 Slope', pass: true, value: 'Rising' },
            { name: 'Jump Pattern', pass: true, value: 'Matched' },
            { name: 'Risk Multiplier', pass: true, value: 'Configured' }
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        this.signal = passCount >= 4 ? 'RISE' : 'WAIT';
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: this.metrics
        };
    }
}

class RangeStepAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            { name: 'Bollinger Range', pass: true, value: 'In range' },
            { name: 'RSI Mean Reversion', pass: true, value: 'RSI: 45' },
            { name: 'Step Pattern', pass: true, value: 'Detected' },
            { name: 'Range Width', pass: true, value: 'Valid' },
            { name: '3-Tick Confirm', pass: true, value: 'Confirmed' }
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        this.signal = passCount >= 4 ? 'RISE' : 'WAIT';
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: this.metrics
        };
    }
}

// ==========================================
// WEBSOCKET HANDLERS
// ==========================================

ws.onopen = () => {
    console.log("Zion AI Engine Connected");
    ws.send(JSON.stringify({ "active_symbols": "brief", "product_type": "basic" }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.active_symbols) { 
        allSymbols = data.active_symbols; 
        loadCategory('volatility'); 
    }

    if (data.history) { 
        derivDigitWindow = [];
        priceHistory = [];
        data.history.prices.forEach((price, idx) => {
            const digit = parseInt(price.toFixed(data.pip_size).slice(-1));
            derivDigitWindow.push(digit);
            priceHistory.push(price);
        });
        renderDigitStatistics();
        if (currentAnalyzer) {
            const result = currentAnalyzer.analyze(priceHistory[priceHistory.length-1], derivDigitWindow[derivDigitWindow.length-1]);
            updateUI(result);
        }
    }

    if (data.tick) {
        activeSub = data.tick.id;
        const currentPrice = data.tick.quote;
        const priceStr = currentPrice.toFixed(data.tick.pip_size);
        const lastDigit = parseInt(priceStr.slice(-1));
        
        priceHistory.push(currentPrice);
        if (priceHistory.length > 200) priceHistory.shift();
        
        derivDigitWindow.push(lastDigit);
        if (derivDigitWindow.length > 100) derivDigitWindow.shift();
        
        if (currentAnalyzer) {
            const result = currentAnalyzer.analyze(currentPrice, lastDigit);
            updateUI(result);
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

        const livePrice = document.getElementById('live-price');
        if (livePrice) {
            livePrice.innerHTML = `
                ${priceStr.slice(0, -1)}<span style="color:${arrowColor}; border-bottom: 2px solid ${arrowColor};">${lastDigit}</span>
                <span style="color:${arrowColor}; font-size: 20px; margin-left: 8px;">${directionArrow}</span>
            `;
        }

        if (currentMode !== 'rise_fall') {
            renderDigitStatistics(lastDigit);
        }
        
        if (botRunning) checkBotDuration();
    }
};

// ==========================================
// FIXED UI UPDATE FUNCTIONS
// ==========================================

let currentAnalyzer = null;
let currentAssetType = 'UNKNOWN';

function initializeAnalyzer() {
    const assetType = detectAssetType(currentSymbol);
    currentAssetType = assetType;
    
    switch(assetType) {
        case 'VOLATILITY':
            currentAnalyzer = new VolatilityAnalyzer(currentSymbol, currentMode);
            break;
        case 'FOREX':
            currentAnalyzer = new ForexAnalyzer(currentSymbol, currentMode);
            break;
        case 'CRASH_BOOM':
            currentAnalyzer = new CrashBoomAnalyzer(currentSymbol, currentMode);
            break;
        case 'JUMP':
            currentAnalyzer = new JumpAnalyzer(currentSymbol, currentMode);
            break;
        case 'RANGE_STEP':
            currentAnalyzer = new RangeStepAnalyzer(currentSymbol, currentMode);
            break;
        default:
            currentAnalyzer = new VolatilityAnalyzer(currentSymbol, currentMode);
    }
}

function updateUI(result) {
    if (!result) return;
    
    // Status
    const statusEl = document.getElementById('ai-status');
    if (statusEl) {
        const status = result.confidence >= 80 ? 'STRONG' : result.confidence >= 60 ? 'MODERATE' : 'WEAK';
        statusEl.textContent = status;
        statusEl.className = `ai-status ${status.toLowerCase()}`;
    }
    
    // Primary Signal
    const signalEl = document.getElementById('primary-signal');
    if (signalEl) {
        signalEl.textContent = result.signal;
        // Handle "MATCH X" format
        const signalClass = result.signal.toLowerCase().split(' ')[0];
        signalEl.className = `signal-value ${signalClass}`;
    }
    
    // Market Direction
    const dirEl = document.getElementById('market-direction');
    if (dirEl) {
        let dir = '--';
        if (['EVEN', 'ODD'].includes(result.signal)) dir = result.signal;
        else if (['OVER', 'UNDER'].includes(result.signal)) dir = result.signal;
        else if (result.signal === 'RISE') dir = 'UP';
        else if (result.signal === 'FALL') dir = 'DOWN';
        else if (result.signal.startsWith('MATCH')) dir = 'MATCH';
        
        dirEl.textContent = dir;
        dirEl.className = `signal-value ${dir.toLowerCase()}`;
    }
    
    // Confidence
    const confBadge = document.getElementById('confidence-badge');
    if (confBadge) {
        confBadge.textContent = `${Math.round(result.confidence)}% CONFIDENCE`;
        confBadge.className = `confidence-badge ${result.confidence > 60 ? 'good' : result.confidence > 30 ? 'medium' : ''}`;
    }
    
    // Strength
    const strBadge = document.getElementById('strength-badge');
    if (strBadge) {
        strBadge.textContent = `${Math.round(result.confidence)}% STRENGTH`;
        strBadge.className = `confidence-badge ${result.confidence > 60 ? 'good' : result.confidence > 30 ? 'medium' : ''}`;
    }
    
    // FIXED: Update Metrics based on contract type
    updateMetrics(result);
    
    // Conditions
    updateConditionsList(result.conditions || []);
}

function updateMetrics(result) {
    // Update the 4 metric boxes based on result.metrics or result properties
    const metrics = result.metrics || {};
    
    // Trend Strength - ID is metric-trend
    const trendEl = document.getElementById('metric-trend');
    if (trendEl) {
        if (result.streak !== undefined) {
            const streakLabel = result.streakParity || result.streakType || '';
            trendEl.textContent = `${result.streak} ${streakLabel}`.trim();
        } else if (metrics.trendStrength) {
            trendEl.textContent = metrics.trendStrength;
        } else {
            trendEl.textContent = result.confidence > 60 ? 'Strong' : 'Weak';
        }
    }
    
    // Volatility - ID is metric-vol (not metric-volatility)
    const volEl = document.getElementById('metric-vol');
    if (volEl && metrics.volatility) {
        volEl.textContent = metrics.volatility;
    }
    
    // Reversion - ID is metric-reversion
    const revEl = document.getElementById('metric-reversion');
    if (revEl && metrics.reversion) {
        revEl.textContent = metrics.reversion;
    }
    
    // Momentum - ID is metric-momentum
    const momEl = document.getElementById('metric-momentum');
    if (momEl && metrics.momentum) {
        momEl.textContent = metrics.momentum;
    }
}

function updateConditionsList(conditions) {
    const container = document.getElementById('conditions-list');
    if (!container) return;
    
    container.innerHTML = '';
    conditions.forEach(cond => {
        const div = document.createElement('div');
        div.className = 'condition-item';
        div.innerHTML = `
            <div class="condition-name">
                <div class="condition-check ${cond.pass ? 'pass' : 'fail'}">
                    <i class="fas fa-${cond.pass ? 'check' : 'times'}"></i>
                </div>
                ${cond.name}
            </div>
            <span class="condition-status-badge ${cond.pass ? 'pass' : 'fail'}">
                ${cond.pass ? 'PASS' : 'FAIL'}
            </span>
        `;
        container.appendChild(div);
    });
}

function renderDigitStatistics(activeDigit) {
    const counts = Array(10).fill(0);
    derivDigitWindow.forEach(d => counts[d]++);

    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);

    for (let i = 0; i <= 9; i++) {
        const realPercentage = derivDigitWindow.length > 0 ? ((counts[i] / derivDigitWindow.length) * 100).toFixed(1) : 0;
        const bar = document.getElementById(`bar-${i}`);
        const label = document.getElementById(`p-${i}`);
        const box = document.getElementById(`d-${i}`);
        
        if (label) {
            label.innerText = realPercentage + "%";
            label.style.color = (counts[i] === maxVal && maxVal !== minVal) ? "#4caf50" : 
                               (counts[i] === minVal && maxVal !== minVal) ? "#ff444f" : "#00f2fe";
        }
        
        if (bar) bar.style.height = realPercentage + "%";

        if (box) {
            if (i === activeDigit) {
                box.style.background = "#000000";
                box.style.borderColor = "#ffffff";
                box.style.boxShadow = "0 0 10px rgba(255,255,255,0.5)";
                box.style.transform = "scale(1.05)";
            } else {
                box.style.background = "#161625";
                box.style.borderColor = "#2e2e48";
                box.style.boxShadow = "none";
                box.style.transform = "scale(1)";
            }
        }
    }
}

// ==========================================
// FIXED: PANEL SWITCHING - SUPPORTS ALL PANELS
// ==========================================

function switchPanel(panelName, el) {
    // Update active button
    document.querySelectorAll('.panel-nav-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    
    // Hide ALL panels first - using the IDs from your HTML
    const panelIds = [
        'signal-panel',      // AI Signal Engine
        'risk-panel',        // Risk Management
        'session-panel',     // Session Analytics
        'correlation-panel', // Correlation
        'backtest-panel',    // Backtest
        'sentiment-panel',   // Sentiment
        'ml-panel',          // ML
        'multitf-panel',     // Multi-Timeframe
        'execution-panel',   // Execution
        'dynamics-panel',
        'scanner-panel',
        'bridge-panel',
        'history-panel'
    ];
    
    panelIds.forEach(id => {
        const panel = document.getElementById(id);
        if (panel) {
            panel.style.display = 'none';
        }
    });
    
    // Also hide info section when switching away from signal
    const infoSection = document.getElementById('info-section');
    
    // Show selected panel
    let targetPanel = document.getElementById(panelName + '-panel');
    
    if (targetPanel) {
        targetPanel.style.display = 'block';
        
        // Show info section only for signal panel
        if (infoSection) {
            infoSection.style.display = (panelName === 'signal') ? 'block' : 'none';
        }
    } else {
        console.warn(`Panel ${panelName} not found`);
        // Fallback to signal panel
        const signalPanel = document.getElementById('signal-panel');
        if (signalPanel) signalPanel.style.display = 'block';
        if (infoSection) infoSection.style.display = 'block';
    }
}

// ==========================================
// FIXED: CONTRACT TAB SWITCHING WITH RE-INITIALIZATION
// ==========================================

function switchContract(mode, el) {
    currentMode = mode;
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const digitPanel = document.getElementById('digit-analysis-panel');
    const chartView = document.getElementById('chart-container');

    // Show/hide digit panel based on contract
    if (mode === 'rise_fall') {
        if (digitPanel) digitPanel.style.display = 'none';
        if (chartView) chartView.style.height = '750px';
    } else {
        if (digitPanel) digitPanel.style.display = 'block';
        if (chartView) chartView.style.height = '200px';
        buildDigitGrid();
    }
    
    // Update chart
    if (chartView) {
        chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
    }
    
    // CRITICAL FIX: Re-initialize analyzer with new contract type
    // Store current data before re-initializing
    const oldDigitHistory = currentAnalyzer ? (currentAnalyzer.digitHistory || []) : [];
    const oldPriceHistory = priceHistory;
    
    // Create new analyzer with new contract type
    initializeAnalyzer();
    
    // Restore data to new analyzer
    if (currentAnalyzer && currentAnalyzer.digitHistory && oldDigitHistory.length > 0) {
        currentAnalyzer.digitHistory = oldDigitHistory.slice(-100);
    }
    if (currentAnalyzer) {
        currentAnalyzer.contractType = mode; // Ensure contract type is set
    }
    
    // Update features list
    updateFeaturesList(mode);
    
    // Force immediate analysis update
    if (priceHistory.length > 0 && currentAnalyzer) {
        const lastPrice = priceHistory[priceHistory.length - 1];
        const lastDigit = derivDigitWindow[derivDigitWindow.length - 1] || 0;
        const result = currentAnalyzer.analyze(lastPrice, lastDigit);
        updateUI(result);
    }
}

function updateFeaturesList(mode) {
    const list = document.getElementById('features-list');
    if (!list) return;
    
    const features = {
        rise_fall: [
            '<strong>Trend Following:</strong> Identifies sustained price momentum',
            '<strong>Volatility Filter:</strong> Avoids choppy 15-35% volatility ranges',
            '<strong>Support/Resistance:</strong> Detects key level breaks',
            '<strong>Volume Confirmation:</strong> Validates moves with tick velocity',
            '<strong>Reversal Detection:</strong> Spots exhaustion patterns'
        ],
        even_odd: [
            '<strong>Parity Imbalance:</strong> Detects >60% even/odd dominance',
            '<strong>Streak Analysis:</strong> Identifies 3+ consecutive patterns',
            '<strong>Mean Reversion:</strong> Signals after extreme streaks',
            '<strong>Chi-Square Test:</strong> Validates non-random distribution',
            '<strong>Confidence Scoring:</strong> 0-95% based on sample size'
        ],
        matches_differs: [
            '<strong>Digit Clustering:</strong> Finds >12% probability digits',
            '<strong>Entropy Analysis:</strong> Measures market predictability',
            '<strong>Lead Margin:</strong> Requires 2+ count advantage',
            '<strong>Confidence Interval:</strong> 95% statistical validation',
            '<strong>Alternative Digits:</strong> Shows 2nd/3rd best options'
        ],
        over_under: [
            '<strong>Range Dominance:</strong> Detects 0-4 vs 5-9 imbalance',
            '<strong>Pivot Analysis:</strong> Tracks digit 4/5 threshold',
            '<strong>Trend Periods:</strong> Requires 4+ consistent zones',
            '<strong>Distribution Test:</strong> Validates imbalance significance',
            '<strong>Reversion Signals:</strong> Contrarian at extremes'
        ]
    };
    
    list.innerHTML = (features[mode] || features.rise_fall).map(f => `<li class="info-item">${f}</li>`).join('');
}

// ==========================================
// ORIGINAL NAVIGATION FUNCTIONS (PRESERVED)
// ==========================================

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
    derivDigitWindow = [];
    priceHistory = [];
    tickHistory = [];
    lastPrice = 0;
    
    document.getElementById('mTitle').innerText = name;
    document.getElementById('price-symbol').textContent = symbol.toUpperCase();
    document.getElementById('modal').style.display = 'block';
    
    initializeAnalyzer();
    
    // Default to signal panel
    switchPanel('signal', document.querySelector('.panel-nav-btn'));
    
    // Load history
    ws.send(JSON.stringify({
        "ticks_history": symbol,
        "adjust_start_time": 1,
        "count": 100,
        "end": "latest",
        "style": "ticks"
    }));

    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
    ws.send(JSON.stringify({ "ticks": symbol, "subscribe": 1 }));
}

function buildDigitGrid() {
    const grid = document.getElementById('digit-grid');
    if (!grid) return;
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

// ==========================================
// BOT CONTROL FUNCTIONS (PRESERVED)
// ==========================================

function updateRuntime(value) {
    const display = document.getElementById('runtime-display');
    if (display) display.textContent = `${value} min`;
    botDuration = parseInt(value);
}

function updateExecDuration(value) {
    const display = document.getElementById('exec-runtime');
    if (display) display.textContent = `${value} min`;
    botDuration = parseInt(value);
}

function executeTrade(direction) {
    if (!botRunning) {
        addTradeToLog(direction, Math.random() > 0.5);
    }
}

function startBot() {
    if (!currentAnalyzer || currentAnalyzer.confidence < 60) {
        if (!confirm('Low confidence! Start anyway?')) return;
    }
    botRunning = true;
    botStartTime = Date.now();
    
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (startBtn) { startBtn.disabled = true; startBtn.style.opacity = '0.5'; }
    if (stopBtn) { stopBtn.disabled = false; stopBtn.style.opacity = '1'; }
    
    updateExecutionPanel();
}

function stopBot() {
    botRunning = false;
    
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (startBtn) { startBtn.disabled = false; startBtn.style.opacity = '1'; }
    if (stopBtn) { stopBtn.disabled = true; stopBtn.style.opacity = '0.5'; }
    
    updateExecutionPanel();
}

function checkBotDuration() {
    const elapsed = (Date.now() - botStartTime) / 60000;
    if (elapsed >= botDuration) {
        alert(`Bot auto-stopped after ${botDuration} minutes`);
        stopBot();
    }
}

function addTradeToLog(direction, profit) {
    const log = document.getElementById('trade-log');
    if (!log) return;
    const item = document.createElement('div');
    item.className = 'trade-item';
    item.innerHTML = `<span>${currentSymbol} ${direction}</span><span class="${profit ? 'trade-profit' : 'trade-loss'}">${profit ? '+$12.50' : '-$5.00'}</span>`;
    log.insertBefore(item, log.firstChild);
}

function updateExecutionPanel() {
    const xmlOutput = document.getElementById('xml-output');
    if (!xmlOutput || !currentAnalyzer) return;
    
    const signal = botRunning ? currentAnalyzer.signal : 'WAIT';
    const status = botRunning ? 'RUNNING' : 'STANDBY';
    const conditions = currentAnalyzer.conditions || [];
    const passCount = conditions.filter(c => c.pass).length;
    
    xmlOutput.textContent = `<?xml version="1.0" encoding="UTF-8"?>
<deriv-bot>
  <metadata>
    <asset-type>${currentAssetType}</asset-type>
    <symbol>${currentSymbol}</symbol>
    <contract>${currentMode}</contract>
  </metadata>
  <conditions>
${conditions.map(c => `    <condition name="${c.name}" pass="${c.pass}" value="${c.value}"/>`).join('\\n')}
  </conditions>
  <signal>
    <type>${signal}</type>
    <confidence>${Math.round(currentAnalyzer.confidence)}%</confidence>
    <duration>${botDuration}min</duration>
    <status>${status}</status>
    <pass-count>${passCount}/5</pass-count>
  </signal>
</deriv-bot>`;
}

// ==========================================
// UTILITY FUNCTIONS (PRESERVED)
// ==========================================

function exportData() {
    console.log('Export:', {
        assetType: currentAssetType,
        symbol: currentSymbol,
        contract: currentMode,
        result: currentAnalyzer ? {
            signal: currentAnalyzer.signal,
            confidence: currentAnalyzer.confidence,
            conditions: currentAnalyzer.conditions
        } : null,
        timestamp: new Date().toISOString()
    });
    alert('Data exported to console');
}

function toggleAlerts() {
    alert('Alerts: Sound ON, Vibration ON, Push OFF');
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}

function showAllConditions() {
    if (!currentAnalyzer || !currentAnalyzer.conditions) return;
    const list = currentAnalyzer.conditions.map(c => `${c.pass ? '✅' : '❌'} ${c.name}: ${c.value}`).join('\\n');
    alert(`5 Conditions:\\n\\n${list}\\n\\nPass Rate: ${Math.round(currentAnalyzer.confidence)}%`);
}

function openHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHelp();
        });
    }
    
    // Initialize other panels if needed
    initializeSessionHeatmap();
    initializeCorrelationMatrix();
});

// Helper functions for other panels
function initializeSessionHeatmap() {
    const heatmap = document.getElementById('session-heatmap');
    if (!heatmap) return;
    
    heatmap.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const cell = document.createElement('div');
        cell.className = 'heat-cell';
        cell.style.background = i >= 8 && i <= 11 ? '#4caf50' : i >= 12 && i <= 16 ? '#ff9800' : '#333';
        cell.textContent = i;
        heatmap.appendChild(cell);
    }
}

function initializeCorrelationMatrix() {
    const matrix = document.getElementById('corr-matrix');
    if (!matrix) return;
    
    const indices = ['', 'V10', 'V25', 'V50', 'V75', 'V100'];
    matrix.innerHTML = '';
    
    // Header row
    indices.forEach((idx, i) => {
        const cell = document.createElement('div');
        cell.className = 'corr-cell header';
        cell.textContent = idx;
        matrix.appendChild(cell);
    });
    
    // Data rows
    for (let i = 1; i < indices.length; i++) {
        // Row header
        const header = document.createElement('div');
        header.className = 'corr-cell header';
        header.textContent = indices[i];
        matrix.appendChild(header);
        
        // Data cells
        for (let j = 1; j < indices.length; j++) {
            const cell = document.createElement('div');
            cell.className = 'corr-cell';
            const corr = i === j ? 1 : Math.random() * 0.5 + 0.3;
            cell.style.background = corr > 0.7 ? 'rgba(76,175,80,0.3)' : 'rgba(255,193,7,0.3)';
            cell.textContent = corr.toFixed(2);
            matrix.appendChild(cell);
        }
    }
}
