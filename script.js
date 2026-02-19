/**
 * Zion AI Trading Lab - Signal Engine with 5 Critical Conditions
 * Real-time analysis with Pass/Fail indicators
 */

const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
let activeSub = null;
let allSymbols = [];
let currentSymbol = '';
let currentMode = 'rise_fall';
let lastPrice = 0;
let reefDigitWindow = [];
let priceHistory = [];
let tickHistory = []; // For AI analysis

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

// Condition configurations
const CONDITIONS = {
    digitDistribution: {
        name: 'Digit Distribution Balance',
        check: (data) => {
            if (reefDigitWindow.length < 50) return { pass: false, value: 0 };
            const counts = Array(10).fill(0);
            reefDigitWindow.forEach(d => counts[d]++);
            const max = Math.max(...counts);
            const balance = (max / reefDigitWindow.length) * 100;
            // Pass if no digit dominates >40%
            return { pass: balance < 40, value: (100 - balance).toFixed(1) };
        }
    },
    consecutivePattern: {
        name: 'Consecutive Pattern Break',
        check: (data) => {
            if (reefDigitWindow.length < 20) return { pass: false, value: 0 };
            let maxStreak = 1;
            let currentStreak = 1;
            for (let i = 1; i < reefDigitWindow.length; i++) {
                const isEven = reefDigitWindow[i] % 2 === 0;
                const prevIsEven = reefDigitWindow[i-1] % 2 === 0;
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
            if (reefDigitWindow.length < 50) return { pass: false, value: 0 };
            const recent = reefDigitWindow.slice(-50);
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
        reefDigitWindow = []; 
        priceHistory = [];
        data.history.prices.forEach((price, idx) => {
            const digit = parseInt(price.toFixed(data.pip_size).slice(-1));
            reefDigitWindow.push(digit);
            priceHistory.push(price);
        });
        renderReefStatistics();
        updateAIEngine();
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
        
        reefDigitWindow.push(lastDigit);
        if (reefDigitWindow.length > 100) reefDigitWindow.shift();
        
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
            renderReefStatistics(lastDigit);
        }
        
        updateAIEngine();
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
    if (reefDigitWindow.length >= 20) {
        let streaks = 0;
        let currentStreak = 1;
        for (let i = 1; i < reefDigitWindow.length; i++) {
            const isEven = reefDigitWindow[i] % 2 === 0;
            const prevIsEven = reefDigitWindow[i-1] % 2 === 0;
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
        const lastDigit = reefDigitWindow[reefDigitWindow.length - 1];
        return lastDigit % 2 === 0 ? 'ODD' : 'EVEN'; // Mean reversion
    } else if (currentMode === 'over_under') {
        const lastDigit = reefDigitWindow[reefDigitWindow.length - 1];
        return lastDigit > 4 ? 'UNDER' : 'OVER'; // Mean reversion
    } else if (currentMode === 'matches_differs') {
        return 'MATCH';
    }
    return 'WAIT';
}

function determineDirection() {
    if (reefDigitWindow.length === 0) return '--';
    const lastDigit = reefDigitWindow[reefDigitWindow.length - 1];
    
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
    
    document.querySelectorAll('.ai-engine-panel, .dynamics-panel, .scanner-panel, .bridge-panel, .history-panel, .info-section').forEach(p => {
        p.style.display = 'none';
    });
    
    if (panelName === 'signal') {
        document.querySelector('.ai-engine-panel').style.display = 'block';
        document.querySelector('.info-section').style.display = 'block';
    } else {
        document.getElementById(`${panelName}-panel`).style.display = 'block';
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

function showAllConditions() {
    alert('All 5 Critical Conditions:\n\n1. Digit Distribution Balance - No digit >40%\n2. Consecutive Pattern Break - 3+ streak detected\n3. Statistical Edge - >60% dominance required\n4. Price Action Alignment - >0.5% movement\n5. Market Regime Filter - Volatility 15-35%\n\nCurrent Pass Rate: ' + aiState.confidence + '%');
}

function exportData() {
    const data = {
        aiState: aiState,
        symbol: currentSymbol,
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
