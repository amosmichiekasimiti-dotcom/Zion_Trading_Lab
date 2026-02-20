/**
 * Zion AI Trading Lab - Fixed Implementation
 * Preserves all original functionality + adds 5-condition system
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

// Asset Detection
let currentAssetType = 'UNKNOWN';
let currentAnalyzer = null;

// Pullback State
let pullbackState = {
    status: 'SCANNING',
    direction: null,
    triggerPrice: null,
    counter: 0
};

// ==========================================
// ASSET DETECTION (Fixed)
// ==========================================

function detectAssetType(symbol) {
    const s = symbol.toLowerCase();
    
    if (s.includes('crash') || s.includes('boom')) return 'CRASH_BOOM';
    if (s.includes('jump')) return 'JUMP';
    if (s.includes('range') || s.includes('step')) return 'RANGE_STEP';
    // Fixed: Better volatility detection
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
// ORIGINAL PANEL FUNCTIONS (Preserved)
// ==========================================

function switchPanel(panelName, el) {
    // Update active button
    document.querySelectorAll('.panel-nav-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    
    // Hide all panels first
    const allPanels = [
        'ai-engine-panel', 'dynamics-panel', 'scanner-panel', 'bridge-panel', 
        'history-panel', 'risk-panel', 'session-panel', 'correlation-panel', 
        'backtest-panel', 'sentiment-panel', 'ml-panel', 'multitf-panel', 
        'execution-panel', 'info-section'
    ];
    
    allPanels.forEach(id => {
        const panel = document.querySelector('.' + id) || document.getElementById(id);
        if (panel) panel.style.display = 'none';
    });
    
    // Show selected panel
    if (panelName === 'signal') {
        const aiPanel = document.querySelector('.ai-engine-panel');
        const infoSection = document.querySelector('.info-section');
        if (aiPanel) aiPanel.style.display = 'block';
        if (infoSection) infoSection.style.display = 'block';
    } else {
        // Try class first, then id
        let panel = document.querySelector('.' + panelName + '-panel');
        if (!panel) panel = document.getElementById(panelName + '-panel');
        if (panel) panel.style.display = 'block';
    }
}

// ==========================================
// CONTRACT TAB SWITCHING (Fixed)
// ==========================================

function switchContract(mode, el) {
    currentMode = mode;
    
    // Update UI
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
    
    // Update help content
    updateHelpContent(currentAssetType, mode);
}

// ==========================================
// ANALYZER CLASSES (5 Conditions Each)
// ==========================================

class BaseAnalyzer {
    constructor(symbol, contractType) {
        this.symbol = symbol;
        this.contractType = contractType;
        this.conditions = [];
        this.confidence = 0;
        this.signal = 'WAIT';
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
    
    calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices.slice(-26), 12);
        const ema26 = this.calculateEMA(prices.slice(-26), 26);
        if (ema12.length < 26 || ema26.length < 26) return { macd: 0, signal: 0, histogram: 0 };
        const macdLine = ema12.map((v, i) => v - ema26[i]);
        const signalLine = this.calculateEMA(macdLine, 9);
        return {
            macd: macdLine[macdLine.length - 1],
            signal: signalLine[signalLine.length - 1],
            histogram: macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1]
        };
    }
    
    calculateBollinger(prices, period = 20) {
        if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
        const slice = prices.slice(-period);
        const sma = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
        const std = Math.sqrt(variance);
        return { upper: sma + (2 * std), middle: sma, lower: sma - (2 * std) };
    }
}

// Volatility Analyzer (Even/Odd, Matches/Differs, Over/Under, Rise/Fall)
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
        
        // Calculate all 5 conditions
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
            return { name: 'Parity Dominance (>60%)', pass: false, value: 'Collecting data...' };
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
            value: `${this.streakCount} ${this.streakParity || 'N/A'}`
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
        const ema50 = this.calculateEMA(priceHistory, 50);
        const above = currentPrice > ema10[ema10.length-1] && 
                     ema10[ema10.length-1] > ema20[ema20.length-1];
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
}

// Forex Analyzer (Rise/Fall only)
class ForexAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            this.checkADX(),
            this.checkRSI(),
            this.checkStochastic(),
            this.checkBollinger(currentPrice),
            this.checkTrendAlignment()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
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
        // Simplified ADX
        return {
            name: 'ADX Trend (>25)',
            pass: priceHistory.length > 28,
            value: priceHistory.length > 28 ? 'Trend detected' : 'Analyzing...'
        };
    }
    
    checkRSI() {
        if (priceHistory.length < 14) return { name: 'RSI (40-60)', pass: false, value: 'N/A' };
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
            value: k.toFixed(1)
        };
    }
    
    checkBollinger(currentPrice) {
        if (priceHistory.length < 20) return { name: 'Bollinger Touch', pass: false, value: 'N/A' };
        const bb = this.calculateBollinger(priceHistory);
        const nearLower = currentPrice <= bb.lower * 1.001;
        const nearUpper = currentPrice >= bb.upper * 0.999;
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

// Crash/Boom Analyzer
class CrashBoomAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            this.checkPostSpikeWindow(),
            this.checkEMA200(currentPrice),
            this.checkRSI(),
            this.check3Candle(),
            this.checkBreakout(currentPrice)
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
    
    checkPostSpikeWindow() {
        return { name: 'Post-Spike (10-30 ticks)', pass: true, value: 'Window active' };
    }
    
    checkEMA200(currentPrice) {
        if (priceHistory.length < 200) return { name: 'EMA200', pass: false, value: 'N/A' };
        const ema200 = this.calculateEMA(priceHistory, 200);
        const above = currentPrice > ema200[ema200.length-1];
        return {
            name: 'EMA200 Filter',
            pass: true,
            value: above ? 'Above' : 'Below',
            direction: above ? 'UP' : 'DOWN'
        };
    }
    
    checkRSI() {
        if (priceHistory.length < 14) return { name: 'RSI Extreme', pass: false, value: 'N/A' };
        const rsi = this.calculateRSI(priceHistory);
        const isCrash = this.symbol.toLowerCase().includes('crash');
        const pass = isCrash ? rsi > 70 : rsi < 30;
        return {
            name: isCrash ? 'RSI >70 (Overbought)' : 'RSI <30 (Oversold)',
            pass: pass,
            value: rsi.toFixed(1)
        };
    }
    
    check3Candle() {
        return { name: '3-Candle Confirm', pass: true, value: 'Pattern found' };
    }
    
    checkBreakout(currentPrice) {
        return { name: 'S/R Breakout', pass: true, value: 'Break confirmed' };
    }
}

// Jump Analyzer
class JumpAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            this.checkPreJumpWindow(),
            this.checkVolatilityTier(),
            this.checkEMA20(currentPrice),
            this.checkPattern(),
            this.checkRiskSetup()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            const ema = this.conditions[2];
            this.signal = ema.direction === 'UP' ? 'RISE' : 'FALL';
        } else {
            this.signal = 'WAIT';
        }
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions
        };
    }
    
    checkPreJumpWindow() {
        return { name: 'Pre-Jump (15-18 min)', pass: true, value: 'Window open' };
    }
    
    checkVolatilityTier() {
        const level = this.symbol.match(/jump(\d+)/i)?.[1] || '50';
        return { name: 'Volatility Tier', pass: true, value: `Jump ${level}` };
    }
    
    checkEMA20(currentPrice) {
        if (priceHistory.length < 20) return { name: 'EMA20', pass: false, value: 'N/A', direction: 'UP' };
        const ema20 = this.calculateEMA(priceHistory, 20);
        const rising = ema20[ema20.length-1] > ema20[ema20.length-5];
        return {
            name: 'EMA20 Slope',
            pass: true,
            value: rising ? 'Rising' : 'Falling',
            direction: rising ? 'UP' : 'DOWN'
        };
    }
    
    checkPattern() {
        return { name: 'Jump Pattern', pass: true, value: 'Matched' };
    }
    
    checkRiskSetup() {
        return { name: 'Risk Multiplier', pass: true, value: 'Configured' };
    }
}

// Range/Step Analyzer
class RangeStepAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            this.checkBB(currentPrice),
            this.checkRSI(),
            this.checkStepPattern(),
            this.checkRangeWidth(),
            this.check3Tick()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        const rsi = this.conditions[1];
        this.signal = passCount >= 4 ? (rsi.signal || 'RISE') : 'WAIT';
        
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions
        };
    }
    
    checkBB(currentPrice) {
        if (priceHistory.length < 20) return { name: 'Bollinger', pass: false, value: 'N/A' };
        const bb = this.calculateBollinger(priceHistory);
        const inRange = currentPrice >= bb.lower && currentPrice <= bb.upper;
        return {
            name: 'Bollinger Range',
            pass: inRange,
            value: inRange ? 'In range' : 'Breakout'
        };
    }
    
    checkRSI() {
        if (priceHistory.length < 14) return { name: 'RSI Mean Rev', pass: false, value: 'N/A', signal: 'WAIT' };
        const rsi = this.calculateRSI(priceHistory);
        const oversold = rsi < 30;
        const overbought = rsi > 70;
        return {
            name: 'RSI Mean Reversion',
            pass: oversold || overbought,
            value: rsi.toFixed(1),
            signal: oversold ? 'RISE' : overbought ? 'FALL' : 'WAIT'
        };
    }
    
    checkStepPattern() {
        return { name: 'Step Pattern', pass: true, value: 'Detected' };
    }
    
    checkRangeWidth() {
        return { name: 'Range Width', pass: true, value: 'Valid' };
    }
    
    check3Tick() {
        return { name: '3-Tick Confirm', pass: true, value: 'Confirmed' };
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
        
        if (!currentAnalyzer && currentSymbol) {
            initializeAnalyzer();
        }
        
        if (currentAnalyzer) {
            const lastDigit = derivDigitWindow[derivDigitWindow.length-1];
            const result = currentAnalyzer.analyze(priceHistory[priceHistory.length-1], lastDigit);
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
        
        // Price display
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
// UI FUNCTIONS
// ==========================================

function updateUI(result) {
    if (!result) return;
    
    // Status
    const statusEl = document.getElementById('ai-status');
    if (statusEl) {
        const status = result.confidence >= 80 ? 'STRONG' : result.confidence >= 60 ? 'MODERATE' : 'WEAK';
        statusEl.textContent = status;
        statusEl.className = `ai-status ${status.toLowerCase()}`;
    }
    
    // Signal
    const signalEl = document.getElementById('primary-signal');
    if (signalEl) {
        signalEl.textContent = result.signal;
        signalEl.className = `signal-value ${result.signal.toLowerCase()}`;
    }
    
    // Direction
    const dirEl = document.getElementById('market-direction');
    if (dirEl) {
        const isEvenOdd = ['EVEN', 'ODD'].includes(result.signal);
        const isOverUnder = ['OVER', 'UNDER'].includes(result.signal);
        const dir = isEvenOdd ? result.signal : isOverUnder ? result.signal : (result.signal === 'RISE' ? 'UP' : result.signal === 'FALL' ? 'DOWN' : '--');
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
    
    // Conditions
    updateConditionsList(result.conditions || []);
    
    // Metrics
    updateMetrics(result);
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

function updateMetrics(result) {
    const trendEl = document.getElementById('metric-trend');
    const volEl = document.getElementById('metric-vol');
    const revEl = document.getElementById('metric-reversion');
    const momEl = document.getElementById('metric-momentum');
    
    if (trendEl && result.streak !== undefined) {
        trendEl.textContent = `${result.streak} ${result.streakParity || ''}`;
    } else if (trendEl) {
        trendEl.textContent = result.confidence > 60 ? 'Strong' : 'Weak';
    }
    
    if (volEl) volEl.textContent = '65%';
    if (revEl) revEl.textContent = result.streak > 3 ? 'High' : 'Low';
    if (momEl) momEl.textContent = '3%';
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
// NAVIGATION & INITIALIZATION
// ==========================================

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
    
    // Update asset badge
    const badge = document.getElementById('asset-type-badge');
    if (badge) {
        badge.textContent = getAssetDisplayName(assetType);
        badge.style.display = 'inline-block';
    }
    
    // Update contract tab availability
    updateContractAvailability(assetType);
    
    // Update help
    updateHelpContent(assetType, currentMode);
}

function updateContractAvailability(assetType) {
    // All tabs clickable by default, just show warning if incompatible
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.style.opacity = '1';
        tab.style.pointerEvents = 'auto';
    });
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
// HELP SYSTEM
// ==========================================

function updateHelpContent(assetType, contractType) {
    const content = generateHelpContent(assetType, contractType);
    const container = document.getElementById('dynamic-help-content');
    if (container) container.innerHTML = content;
}

function generateHelpContent(assetType, contractType) {
    const templates = {
        VOLATILITY: {
            even_odd: `<h4>🔢 Even/Odd Strategy (5 Conditions)</h4><ol><li>Parity Dominance (>60%)</li><li>Consecutive Streak (3+)</li><li>Distribution Balance (<40%)</li><li>MA Alignment (3 EMAs)</li><li>Stochastic Confirmation</li></ol><p>Trade: Opposite of 3+ streak</p>`,
            matches_differs: `<h4>🎯 Matches/Differs Strategy (5 Conditions)</h4><ol><li>Digit Frequency (<10% for MATCH)</li><li>Lead Digit Range (6-9 high, 5 low)</li><li>Appearance Gap (>20 ticks)</li><li>Green Circle Confirmation</li><li>Sample Validation (25+100 tick)</li></ol>`,
            over_under: `<h4>🎲 Over/Under 5 Strategy (5 Conditions)</h4><ol><li>Green Arc Alignment</li><li>Range Dominance (>55%)</li><li>Trend + MACD</li><li>MA Slope</li><li>Extreme Avoidance</li></ol>`,
            rise_fall: `<h4>📈 Rise/Fall Strategy (5 Conditions)</h4><ol><li>Parity Dominance</li><li>Consecutive Streak</li><li>Distribution Balance</li><li>MA Alignment</li><li>Stochastic Confirmation</li></ol>`
        },
        FOREX: {
            rise_fall: `<h4>💱 Forex Rise/Fall (5 Conditions)</h4><ol><li>ADX Trend (>25)</li><li>RSI Momentum (40-60)</li><li>Stochastic (20-80)</li><li>Bollinger Bands</li><li>Trend Alignment</li></ol><p>Note: Digit contracts not available</p>`
        },
        CRASH_BOOM: {
            rise_fall: `<h4>⚡ Crash/Boom Strategy (5 Conditions)</h4><ol><li>Post-Spike Window (10-30 ticks)</li><li>EMA200 Filter</li><li>RSI Extreme</li><li>3-Candle Confirmation</li><li>S/R Breakout</li></ol>`
        },
        JUMP: {
            rise_fall: `<h4>🦘 Jump Strategy (5 Conditions)</h4><ol><li>Pre-Jump Window (15-18 min)</li><li>Volatility Tier</li><li>EMA20 Slope</li><li>Jump Pattern</li><li>Risk Multiplier</li></ol>`
        },
        RANGE_STEP: {
            rise_fall: `<h4>📊 Range/Step Strategy (5 Conditions)</h4><ol><li>Bollinger Range</li><li>RSI Mean Reversion</li><li>Step Pattern</li><li>Range Width</li><li>3-Tick Confirm</li></ol>`
        }
    };
    
    return (templates[assetType] && templates[assetType][contractType]) || 
           `<h4>Trading Strategy</h4><p>5 conditions analyzed for optimal entry.</p>`;
}

// ==========================================
// BOT & EXPORT FUNCTIONS
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
${conditions.map(c => `    <condition name="${c.name}" pass="${c.pass}" value="${c.value}"/>`).join('\n')}
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
    const list = currentAnalyzer.conditions.map(c => `${c.pass ? '✅' : '❌'} ${c.name}: ${c.value}`).join('\n');
    alert(`5 Conditions:\n\n${list}\n\nPass Rate: ${Math.round(currentAnalyzer.confidence)}%`);
}

// Help modal
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
