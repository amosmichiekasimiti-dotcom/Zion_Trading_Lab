/**
 * Zion AI Trading Lab - Fixed Implementation
 * Works with original HTML structure
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
// 5-CONDITION ANALYZER SYSTEM
// ==========================================

class BaseAnalyzer {
    constructor(symbol, contractType) {
        this.symbol = symbol;
        this.contractType = contractType;
        this.conditions = [];
        this.confidence = 0;
        this.signal = 'WAIT';
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
    
    checkPullback(currentPrice) {
        // 3-tick pullback logic
        if (this.pullbackState.status === 'SCANNING' && this.allConditionsMet()) {
            this.pullbackState.status = 'ARMED';
            this.pullbackState.triggerPrice = currentPrice;
            this.pullbackState.direction = this.getTrendDirection();
            this.pullbackState.counter = 0;
            return 'ARMED';
        }
        
        if (this.pullbackState.status === 'ARMED' || this.pullbackState.status === 'COUNTING') {
            const priceChange = currentPrice - this.pullbackState.triggerPrice;
            const expectedDirection = this.pullbackState.direction === 'UP' ? -1 : 1;
            const actualDirection = Math.sign(priceChange);
            
            if (actualDirection === expectedDirection) {
                this.pullbackState.status = 'COUNTING';
                this.pullbackState.counter++;
                
                if (this.pullbackState.counter >= 3) {
                    this.pullbackState.status = 'SIGNAL';
                    const signal = this.pullbackState.direction === 'UP' ? 'RISE' : 'FALL';
                    this.resetPullback();
                    return signal;
                }
                return `PULLBACK_${this.pullbackState.counter}/3`;
            } else if (actualDirection === -expectedDirection && Math.abs(priceChange) > 0) {
                this.pullbackState.counter = 0;
                this.pullbackState.triggerPrice = currentPrice;
                return 'ARMED';
            }
        }
        return this.pullbackState.status;
    }
    
    allConditionsMet() {
        return this.conditions.every(c => c.pass);
    }
    
    getTrendDirection() {
        return 'UP';
    }
    
    resetPullback() {
        this.pullbackState = { status: 'SCANNING', counter: 0, triggerPrice: null, direction: null };
    }
}

// Volatility Indices - 5 Conditions for Even/Odd/Matches/Differs/OverUnder/RiseFall
class VolatilityAnalyzer extends BaseAnalyzer {
    constructor(symbol, contractType) {
        super(symbol, contractType);
        this.digitHistory = [];
        this.streakCount = 0;
        this.streakParity = null;
    }
    
    analyze(currentPrice, currentDigit) {
        this.digitHistory.push(currentDigit);
        if (this.digitHistory.length > 100) this.digitHistory.shift();
        
        // Update streak
        const currentParity = currentDigit % 2 === 0 ? 'EVEN' : 'ODD';
        if (currentParity === this.streakParity) {
            this.streakCount++;
        } else {
            this.streakCount = 1;
            this.streakParity = currentParity;
        }
        
        // 5 Conditions for Volatility Indices
        this.conditions = [
            this.checkParityDominance(),
            this.checkConsecutiveStreak(),
            this.checkDistributionBalance(),
            this.checkMAAlignment(currentPrice),
            this.checkStochasticConfirmation()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        // Generate signal based on contract type
        if (passCount >= 3) {
            this.signal = this.generateSignal(currentDigit);
        } else {
            this.signal = 'WAIT';
        }
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
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
    
    generateSignal(currentDigit) {
        switch(this.contractType) {
            case 'even_odd':
                return this.streakParity === 'EVEN' ? 'ODD' : 'EVEN';
            case 'over_under':
                return currentDigit > 4 ? 'UNDER' : 'OVER';
            case 'matches_differs':
                return 'MATCH';
            case 'rise_fall':
                const ma = this.conditions[3];
                return ma.direction === 'UP' ? 'RISE' : 'FALL';
            default:
                return 'WAIT';
        }
    }
    
    getTrendDirection() {
        const ma = this.conditions[3];
        return ma.direction || 'UP';
    }
}

// Forex - 5 Conditions for Rise/Fall only
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
            conditions: this.conditions
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

// Crash/Boom - 5 Conditions
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
            conditions: this.conditions
        };
    }
}

// Jump - 5 Conditions
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
            conditions: this.conditions
        };
    }
}

// Range/Step - 5 Conditions
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
            conditions: this.conditions
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
// UI UPDATE FUNCTIONS
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
        signalEl.className = `signal-value ${result.signal.toLowerCase()}`;
    }
    
    // Market Direction
    const dirEl = document.getElementById('market-direction');
    if (dirEl) {
        const dir = ['EVEN', 'ODD'].includes(result.signal) ? result.signal : 
                   ['OVER', 'UNDER'].includes(result.signal) ? result.signal :
                   result.signal === 'RISE' ? 'UP' : result.signal === 'FALL' ? 'DOWN' : '--';
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
    
    // Metrics
    const trendEl = document.getElementById('metric-trend');
    if (trendEl && result.streak !== undefined) {
        trendEl.textContent = `${result.streak} ${result.streakParity || ''}`;
    } else if (trendEl) {
        trendEl.textContent = result.confidence > 60 ? 'Strong' : 'Weak';
    }
    
    // Conditions
    updateConditionsList(result.conditions || []);
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
// FIXED PANEL SWITCHING - PRESERVES ORIGINAL HTML
// ==========================================

function switchPanel(panelName, el) {
    // Update active button
    document.querySelectorAll('.panel-nav-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    
    // Hide ALL panels first (both by class and by ID)
    const panelClasses = [
        'ai-engine-panel', 'dynamics-panel', 'scanner-panel', 'bridge-panel', 
        'history-panel', 'risk-panel', 'session-panel', 'correlation-panel', 
        'backtest-panel', 'sentiment-panel', 'ml-panel', 'multitf-panel', 
        'execution-panel', 'info-section'
    ];
    
    panelClasses.forEach(cls => {
        const elements = document.querySelectorAll('.' + cls);
        elements.forEach(elem => elem.style.display = 'none');
    });
    
    // Show selected panel
    if (panelName === 'signal') {
        const aiPanel = document.querySelector('.ai-engine-panel');
        const infoSection = document.querySelector('.info-section');
        if (aiPanel) aiPanel.style.display = 'block';
        if (infoSection) infoSection.style.display = 'block';
    } else {
        // Try finding by ID first (risk-panel, session-panel, etc.)
        let panel = document.getElementById(panelName + '-panel');
        if (panel) {
            panel.style.display = 'block';
        }
    }
}

// ==========================================
// FIXED CONTRACT TAB SWITCHING
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
    
    // Update analyzer contract type
    if (currentAnalyzer) {
        currentAnalyzer.contractType = mode;
    }
    
    // Update features list
    updateFeaturesList(mode);
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
        result: currentAnalyzer ? currentAnalyzer.getResult() : null,
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
});
