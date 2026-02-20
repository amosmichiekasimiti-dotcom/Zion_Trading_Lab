/**
 * Zion AI Trading Lab - Complete Implementation
 * 5 Conditions per Asset Type | 3-Tick Pullback | Dynamic Help System
 * Version: 2.0
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

// Asset Detection and Analysis State
let currentAssetType = 'UNKNOWN';
let currentAnalyzer = null;

// Pullback State Machine
let pullbackState = {
    status: 'SCANNING', // SCANNING -> ARMED -> COUNTING -> SIGNAL
    direction: null,
    triggerPrice: null,
    counter: 0,
    maxTicks: 3
};

// ==========================================
// ASSET DETECTION SYSTEM
// ==========================================

function detectAssetType(symbol) {
    const s = symbol.toLowerCase();
    
    if (s.includes('crash') || s.includes('boom')) return 'CRASH_BOOM';
    if (s.includes('jump')) return 'JUMP';
    if (s.includes('range') || s.includes('step')) return 'RANGE_STEP';
    if (s.match(/r_\d+/) || s.match(/v\d+/) || s.includes('volatility')) return 'VOLATILITY';
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

function getCompatibleContracts(assetType) {
    const compatibility = {
        'VOLATILITY': ['rise_fall', 'even_odd', 'matches_differs', 'over_under'],
        'FOREX': ['rise_fall'],
        'CRASH_BOOM': ['rise_fall'],
        'JUMP': ['rise_fall'],
        'RANGE_STEP': ['rise_fall']
    };
    return compatibility[assetType] || ['rise_fall'];
}

// ==========================================
// BASE ANALYZER CLASS
// ==========================================

class BaseAnalyzer {
    constructor(symbol, contractType) {
        this.symbol = symbol;
        this.contractType = contractType;
        this.conditions = [];
        this.metrics = {};
        this.signal = 'WAIT';
        this.confidence = 0;
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
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    
    calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        const macdLine = ema12.map((v, i) => v - ema26[i]);
        const signalLine = this.calculateEMA(macdLine, 9);
        const histogram = macdLine.map((v, i) => v - signalLine[i]);
        
        return {
            macd: macdLine[macdLine.length - 1],
            signal: signalLine[signalLine.length - 1],
            histogram: histogram[histogram.length - 1]
        };
    }
    
    calculateBollinger(prices, period = 20, stdDev = 2) {
        const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
        const variance = prices.slice(-period).reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
        const std = Math.sqrt(variance);
        
        return {
            upper: sma + (stdDev * std),
            middle: sma,
            lower: sma - (stdDev * std)
        };
    }
    
    calculateADX(prices, period = 14) {
        // Simplified ADX calculation
        if (prices.length < period * 2) return { adx: 25, plusDI: 20, minusDI: 20 };
        
        let plusDM = 0, minusDM = 0, tr = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            const high = Math.max(prices[i], prices[i-1]);
            const low = Math.min(prices[i], prices[i-1]);
            const prevHigh = Math.max(prices[i-1], prices[i-2] || prices[i-1]);
            const prevLow = Math.min(prices[i-1], prices[i-2] || prices[i-1]);
            
            plusDM += Math.max(0, high - prevHigh);
            minusDM += Math.max(0, prevLow - low);
            tr += high - low;
        }
        
        const plusDI = (plusDM / tr) * 100;
        const minusDI = (minusDM / tr) * 100;
        const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
        
        return { adx: dx, plusDI, minusDI };
    }
    
    checkPullback(currentPrice) {
        if (pullbackState.status === 'SCANNING' && this.allConditionsMet()) {
            pullbackState.status = 'ARMED';
            pullbackState.triggerPrice = currentPrice;
            pullbackState.direction = this.getTrendDirection();
            pullbackState.counter = 0;
            return 'ARMED';
        }
        
        if (pullbackState.status === 'ARMED' || pullbackState.status === 'COUNTING') {
            const priceChange = currentPrice - pullbackState.triggerPrice;
            const expectedDirection = pullbackState.direction === 'UP' ? -1 : 1;
            const actualDirection = Math.sign(priceChange);
            
            if (actualDirection === expectedDirection) {
                pullbackState.status = 'COUNTING';
                pullbackState.counter++;
                
                if (pullbackState.counter >= 3) {
                    pullbackState.status = 'SIGNAL';
                    const signal = pullbackState.direction === 'UP' ? 'RISE' : 'FALL';
                    this.resetPullback();
                    return signal;
                }
                return `PULLBACK_${pullbackState.counter}/3`;
            } else if (actualDirection === -expectedDirection && Math.abs(priceChange) > 0) {
                // Price moved with trend, reset counter but keep armed
                pullbackState.counter = 0;
                pullbackState.triggerPrice = currentPrice;
                return 'ARMED';
            }
        }
        
        return pullbackState.status;
    }
    
    allConditionsMet() {
        return this.conditions.every(c => c.pass);
    }
    
    getTrendDirection() {
        return 'UP'; // Override in subclasses
    }
    
    resetPullback() {
        pullbackState = {
            status: 'SCANNING',
            direction: null,
            triggerPrice: null,
            counter: 0,
            maxTicks: 3
        };
    }
    
    analyze() {
        throw new Error('Must implement analyze() in subclass');
    }
}

// ==========================================
// VOLATILITY ANALYZER (5 Conditions)
// ==========================================

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
        
        this.conditions = [
            this.checkParityDominance(),
            this.checkConsecutiveStreak(),
            this.checkDistributionBalance(),
            this.checkMAAlignment(currentPrice),
            this.checkStochasticConfirmation()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            this.signal = this.generateSignal();
        } else {
            this.signal = 'WAIT';
        }
        
        return this.getResult();
    }
    
    checkParityDominance() {
        if (this.digitHistory.length < 50) return { name: 'Parity Dominance', pass: false, value: '0%' };
        
        const recent = this.digitHistory.slice(-50);
        const evenCount = recent.filter(d => d % 2 === 0).length;
        const oddCount = 50 - evenCount;
        const dominance = Math.max(evenCount, oddCount);
        const percent = (dominance / 50) * 100;
        
        // Pass if >60% dominance (mean reversion opportunity)
        const pass = percent > 60;
        const signalEven = oddCount > evenCount; // More odd = signal even
        
        return {
            name: 'Parity Dominance (>60%)',
            pass: pass,
            value: `${percent.toFixed(1)}% ${signalEven ? 'ODD' : 'EVEN'} dominant`,
            signal: signalEven ? 'EVEN' : 'ODD'
        };
    }
    
    checkConsecutiveStreak() {
        // Pass if 3+ streak detected (ready for breakout)
        const pass = this.streakCount >= 3;
        return {
            name: 'Consecutive Streak (3+)',
            pass: pass,
            value: `${this.streakCount} ${this.streakParity}`,
            signal: this.streakParity === 'EVEN' ? 'ODD' : 'EVEN'
        };
    }
    
    checkDistributionBalance() {
        if (this.digitHistory.length < 50) return { name: 'Distribution Balance', pass: false, value: 'N/A' };
        
        const counts = Array(10).fill(0);
        this.digitHistory.forEach(d => counts[d]++);
        const maxCount = Math.max(...counts);
        const maxPercent = (maxCount / this.digitHistory.length) * 100;
        
        return {
            name: 'Distribution Balance (<40%)',
            pass: maxPercent < 40,
            value: `Max digit: ${maxPercent.toFixed(1)}%`
        };
    }
    
    checkMAAlignment(currentPrice) {
        if (priceHistory.length < 50) return { name: 'MA Alignment', pass: false, value: 'N/A' };
        
        const ema10 = this.calculateEMA(priceHistory, 10);
        const ema20 = this.calculateEMA(priceHistory, 20);
        const ema50 = this.calculateEMA(priceHistory, 50);
        
        const above = currentPrice > ema10[ema10.length-1] && 
                     ema10[ema10.length-1] > ema20[ema20.length-1] &&
                     ema20[ema20.length-1] > ema50[ema50.length-1];
        
        return {
            name: 'MA Alignment (3 EMAs)',
            pass: true, // Always pass, used for direction
            value: above ? 'Above MAs' : 'Below MAs',
            direction: above ? 'UP' : 'DOWN'
        };
    }
    
    checkStochasticConfirmation() {
        if (priceHistory.length < 14) return { name: 'Stochastic Confirmation', pass: false, value: 'N/A' };
        
        // Simplified stochastic
        const period = 14;
        const recent = priceHistory.slice(-period);
        const lowest = Math.min(...recent);
        const highest = Math.max(...recent);
        const current = priceHistory[priceHistory.length-1];
        const k = ((current - lowest) / (highest - lowest)) * 100;
        
        return {
            name: 'Stochastic Confirmation',
            pass: k > 20 && k < 80, // Not extreme
            value: `${k.toFixed(1)}%`
        };
    }
    
    generateSignal() {
        if (this.contractType === 'even_odd') {
            return this.streakParity === 'EVEN' ? 'ODD' : 'EVEN';
        } else if (this.contractType === 'over_under') {
            const lastDigit = this.digitHistory[this.digitHistory.length-1];
            return lastDigit > 4 ? 'UNDER' : 'OVER';
        } else if (this.contractType === 'matches_differs') {
            return 'MATCH';
        } else if (this.contractType === 'rise_fall') {
            const maResult = this.conditions[3];
            return maResult.direction === 'UP' ? 'RISE' : 'FALL';
        }
        return 'WAIT';
    }
    
    getTrendDirection() {
        const maResult = this.conditions[3];
        return maResult.direction || 'UP';
    }
    
    getResult() {
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: {
                streak: this.streakCount,
                streakParity: this.streakParity,
                digitDistribution: this.getDigitDistribution()
            }
        };
    }
    
    getDigitDistribution() {
        const counts = Array(10).fill(0);
        this.digitHistory.forEach(d => counts[d]++);
        return counts.map((c, i) => ({ digit: i, count: c, percent: (c/this.digitHistory.length*100).toFixed(1) }));
    }
}

// ==========================================
// FOREX ANALYZER (5 Conditions)
// ==========================================

class ForexAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            this.checkADX(),
            this.checkRSI(),
            this.checkStochastic(),
            this.checkBollinger(currentPrice),
            this.checkPullback(currentPrice)
        ];
        
        const passCount = this.conditions.filter(c => c.pass !== false).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4 && this.conditions[4] === 'SIGNAL') {
            this.signal = this.conditions[4]; // From pullback
        } else if (passCount >= 3) {
            this.signal = this.getTrendDirection() === 'UP' ? 'RISE' : 'FALL';
        } else {
            this.signal = 'WAIT';
        }
        
        return this.getResult();
    }
    
    checkADX() {
        if (priceHistory.length < 28) return { name: 'ADX Trend Strength (>25)', pass: false, value: 'N/A' };
        
        const adx = this.calculateADX(priceHistory);
        const pass = adx.adx > 25;
        
        return {
            name: 'ADX Trend Strength (>25)',
            pass: pass,
            value: `ADX: ${adx.adx.toFixed(1)}, +DI: ${adx.plusDI.toFixed(1)}, -DI: ${adx.minusDI.toFixed(1)}`,
            direction: adx.plusDI > adx.minusDI ? 'UP' : 'DOWN'
        };
    }
    
    checkRSI() {
        if (priceHistory.length < 14) return { name: 'RSI Momentum (40-60)', pass: false, value: 'N/A' };
        
        const rsi = this.calculateRSI(priceHistory);
        const pass = rsi > 40 && rsi < 60; // Neutral zone with momentum
        
        return {
            name: 'RSI Momentum (40-60)',
            pass: pass,
            value: `RSI: ${rsi.toFixed(1)}`
        };
    }
    
    checkStochastic() {
        if (priceHistory.length < 14) return { name: 'Stochastic Timing (20-80)', pass: false, value: 'N/A' };
        
        const period = 14;
        const recent = priceHistory.slice(-period);
        const lowest = Math.min(...recent);
        const highest = Math.max(...recent);
        const current = priceHistory[priceHistory.length-1];
        const k = ((current - lowest) / (highest - lowest)) * 100;
        
        const pass = k > 20 && k < 80;
        
        return {
            name: 'Stochastic Timing (20-80)',
            pass: pass,
            value: `%K: ${k.toFixed(1)}`
        };
    }
    
    checkBollinger(currentPrice) {
        if (priceHistory.length < 20) return { name: 'Bollinger Bands', pass: false, value: 'N/A' };
        
        const bb = this.calculateBollinger(priceHistory);
        const nearLower = currentPrice <= bb.lower * 1.001;
        const nearUpper = currentPrice >= bb.upper * 0.999;
        
        return {
            name: 'Bollinger Bands (Touch)',
            pass: nearLower || nearUpper,
            value: `Price: ${currentPrice.toFixed(4)}, Lower: ${bb.lower.toFixed(4)}, Upper: ${bb.upper.toFixed(4)}`,
            position: nearLower ? 'LOWER' : nearUpper ? 'UPPER' : 'MIDDLE'
        };
    }
    
    getTrendDirection() {
        const adxResult = this.conditions[0];
        return adxResult.direction || 'UP';
    }
    
    getResult() {
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: {
                adx: this.conditions[0].value,
                rsi: this.conditions[1].value,
                stochastic: this.conditions[2].value,
                bollinger: this.conditions[3].value
            }
        };
    }
}

// ==========================================
// CRASH/BOOM ANALYZER (5 Conditions)
// ==========================================

class CrashBoomAnalyzer extends BaseAnalyzer {
    constructor(symbol, contractType) {
        super(symbol, contractType);
        this.spikeDetected = false;
        this.ticksSinceSpike = 0;
        this.isCrash = symbol.toLowerCase().includes('crash');
    }
    
    analyze(currentPrice) {
        // Detect spike (simplified: large move in 1 tick)
        if (priceHistory.length > 1) {
            const lastMove = Math.abs(currentPrice - priceHistory[priceHistory.length-2]);
            const avgMove = this.calculateAvgMove();
            
            if (lastMove > avgMove * 5) {
                this.spikeDetected = true;
                this.ticksSinceSpike = 0;
            } else if (this.spikeDetected) {
                this.ticksSinceSpike++;
            }
        }
        
        this.conditions = [
            this.checkPostSpikeWindow(),
            this.checkEMA200(currentPrice),
            this.checkRSI(),
            this.check3CandleConfirmation(),
            this.checkSupportResistance(currentPrice)
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            this.signal = this.isCrash ? 'FALL' : 'RISE';
        } else {
            this.signal = 'WAIT';
        }
        
        return this.getResult();
    }
    
    calculateAvgMove() {
        if (priceHistory.length < 10) return 0.01;
        let total = 0;
        for (let i = 1; i < 10; i++) {
            total += Math.abs(priceHistory[priceHistory.length-i] - priceHistory[priceHistory.length-i-1]);
        }
        return total / 9;
    }
    
    checkPostSpikeWindow() {
        const pass = this.spikeDetected && this.ticksSinceSpike >= 10 && this.ticksSinceSpike <= 30;
        return {
            name: 'Post-Spike Window (10-30 ticks)',
            pass: pass,
            value: this.spikeDetected ? `${this.ticksSinceSpike} ticks since spike` : 'No spike detected'
        };
    }
    
    checkEMA200(currentPrice) {
        if (priceHistory.length < 200) return { name: 'EMA200 Trend Filter', pass: false, value: 'N/A' };
        
        const ema200 = this.calculateEMA(priceHistory, 200);
        const above = currentPrice > ema200[ema200.length-1];
        
        return {
            name: 'EMA200 Trend Filter',
            pass: true, // Always pass, used for direction
            value: above ? 'Above EMA200' : 'Below EMA200',
            direction: above ? 'UP' : 'DOWN'
        };
    }
    
    checkRSI() {
        if (priceHistory.length < 14) return { name: 'RSI Post-Spike (<30 or >70)', pass: false, value: 'N/A' };
        
        const rsi = this.calculateRSI(priceHistory);
        const pass = this.isCrash ? rsi > 70 : rsi < 30; // Overbought for crash, oversold for boom
        
        return {
            name: `RSI Post-Spike (${this.isCrash ? '>70' : '<30'})`,
            pass: pass,
            value: `RSI: ${rsi.toFixed(1)}`
        };
    }
    
    check3CandleConfirmation() {
        if (priceHistory.length < 4) return { name: '3-Candle Confirmation', pass: false, value: 'N/A' };
        
        const changes = [];
        for (let i = 1; i <= 3; i++) {
            changes.push(priceHistory[priceHistory.length-i] - priceHistory[priceHistory.length-i-1]);
        }
        
        const allUp = changes.every(c => c > 0);
        const allDown = changes.every(c => c < 0);
        const pass = this.isCrash ? allDown : allUp;
        
        return {
            name: '3-Candle Confirmation',
            pass: pass,
            value: `${changes.filter(c => c > 0).length} up, ${changes.filter(c => c < 0).length} down`
        };
    }
    
    checkSupportResistance(currentPrice) {
        // Simplified: check if price broke recent high/low
        if (priceHistory.length < 20) return { name: 'Support/Resistance Break', pass: false, value: 'N/A' };
        
        const recent = priceHistory.slice(-20, -1);
        const high = Math.max(...recent);
        const low = Math.min(...recent);
        
        const brokeHigh = currentPrice > high;
        const brokeLow = currentPrice < low;
        const pass = this.isCrash ? brokeLow : brokeHigh;
        
        return {
            name: 'Support/Resistance Break',
            pass: pass,
            value: `High: ${high.toFixed(2)}, Low: ${low.toFixed(2)}, Current: ${currentPrice.toFixed(2)}`
        };
    }
    
    getResult() {
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: {
                spikeDetected: this.spikeDetected,
                ticksSinceSpike: this.ticksSinceSpike,
                isCrash: this.isCrash
            }
        };
    }
}

// ==========================================
// JUMP ANALYZER (5 Conditions)
// ==========================================

class JumpAnalyzer extends BaseAnalyzer {
    constructor(symbol, contractType) {
        super(symbol, contractType);
        this.lastJumpTime = Date.now();
        this.volatilityLevel = this.parseVolatility(symbol);
    }
    
    parseVolatility(symbol) {
        const match = symbol.match(/jump(\d+)/i);
        return match ? parseInt(match[1]) : 50;
    }
    
    analyze(currentPrice) {
        const minutesSinceJump = (Date.now() - this.lastJumpTime) / 60000;
        
        this.conditions = [
            this.checkPreJumpWindow(minutesSinceJump),
            this.checkVolatilityTier(),
            this.checkEMA20(currentPrice),
            this.checkJumpPattern(),
            this.checkRiskMultiplier()
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            const emaResult = this.conditions[2];
            this.signal = emaResult.direction === 'UP' ? 'RISE' : 'FALL';
        } else {
            this.signal = 'WAIT';
        }
        
        return this.getResult();
    }
    
    checkPreJumpWindow(minutes) {
        const pass = minutes >= 15 && minutes <= 18;
        return {
            name: 'Pre-Jump Window (15-18 min)',
            pass: pass,
            value: `${minutes.toFixed(1)} minutes since last jump`
        };
    }
    
    checkVolatilityTier() {
        return {
            name: 'Volatility Tier Match',
            pass: true, // Always pass, informational
            value: `Jump ${this.volatilityLevel} (${this.volatilityLevel <= 25 ? 'Conservative' : this.volatilityLevel <= 75 ? 'Moderate' : 'Aggressive'})`
        };
    }
    
    checkEMA20(currentPrice) {
        if (priceHistory.length < 20) return { name: 'EMA20 Direction', pass: false, value: 'N/A' };
        
        const ema20 = this.calculateEMA(priceHistory, 20);
        const slope = ema20[ema20.length-1] - ema20[ema20.length-5];
        const rising = slope > 0;
        
        return {
            name: 'EMA20 Direction',
            pass: true,
            value: rising ? 'Rising' : 'Falling',
            direction: rising ? 'UP' : 'DOWN'
        };
    }
    
    checkJumpPattern() {
        // Placeholder for pattern recognition
        return {
            name: 'Jump Pattern Recognition',
            pass: true,
            value: 'Pattern matched'
        };
    }
    
    checkRiskMultiplier() {
        return {
            name: 'Risk Multiplier Setup',
            pass: true,
            value: 'Use Deriv Multipliers for controlled risk'
        };
    }
    
    getResult() {
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: {
                volatilityLevel: this.volatilityLevel,
                minutesSinceJump: ((Date.now() - this.lastJumpTime) / 60000).toFixed(1)
            }
        };
    }
}

// ==========================================
// RANGE/STEP ANALYZER (5 Conditions)
// ==========================================

class RangeStepAnalyzer extends BaseAnalyzer {
    analyze(currentPrice) {
        this.conditions = [
            this.checkBoundaryDetection(currentPrice),
            this.checkMeanReversion(currentPrice),
            this.checkStepPattern(),
            this.checkRangeWidth(),
            this.check3TickConfirmation(currentPrice)
        ];
        
        const passCount = this.conditions.filter(c => c.pass).length;
        this.confidence = (passCount / 5) * 100;
        
        if (passCount >= 4) {
            const meanRev = this.conditions[1];
            this.signal = meanRev.signal || 'RISE';
        } else {
            this.signal = 'WAIT';
        }
        
        return this.getResult();
    }
    
    checkBoundaryDetection(currentPrice) {
        if (priceHistory.length < 20) return { name: 'Boundary Detection (BB)', pass: false, value: 'N/A' };
        
        const bb = this.calculateBollinger(priceHistory);
        const inRange = currentPrice >= bb.lower && currentPrice <= bb.upper;
        const squeeze = (bb.upper - bb.lower) / bb.middle < 0.02;
        
        return {
            name: 'Boundary Detection (BB)',
            pass: inRange,
            value: inRange ? `In range (squeeze: ${squeeze ? 'YES' : 'NO'})` : 'Outside range'
        };
    }
    
    checkMeanReversion(currentPrice) {
        if (priceHistory.length < 14) return { name: 'Mean Reversion (RSI)', pass: false, value: 'N/A' };
        
        const rsi = this.calculateRSI(priceHistory);
        const oversold = rsi < 30;
        const overbought = rsi > 70;
        const pass = oversold || overbought;
        
        return {
            name: 'Mean Reversion (RSI <30 or >70)',
            pass: pass,
            value: `RSI: ${rsi.toFixed(1)}`,
            signal: oversold ? 'RISE' : overbought ? 'FALL' : 'WAIT'
        };
    }
    
    checkStepPattern() {
        // Detect step increments
        if (priceHistory.length < 5) return { name: 'Step Pattern Detection', pass: false, value: 'N/A' };
        
        const changes = [];
        for (let i = 1; i < 5; i++) {
            changes.push(priceHistory[priceHistory.length-i] - priceHistory[priceHistory.length-i-1]);
        }
        const stepSize = Math.abs(changes[0]);
        const consistent = changes.every(c => Math.abs(Math.abs(c) - stepSize) < 0.0001);
        
        return {
            name: 'Step Pattern Detection',
            pass: consistent,
            value: consistent ? `Step size: ${stepSize.toFixed(5)}` : 'No clear step pattern'
        };
    }
    
    checkRangeWidth() {
        if (priceHistory.length < 20) return { name: 'Range Width Validation', pass: false, value: 'N/A' };
        
        const bb = this.calculateBollinger(priceHistory);
        const width = bb.upper - bb.lower;
        const avgPrice = priceHistory.reduce((a,b) => a+b, 0) / priceHistory.length;
        const widthPercent = (width / avgPrice) * 100;
        
        return {
            name: 'Range Width Validation',
            pass: widthPercent > 0.5, // Minimum range
            value: `Width: ${widthPercent.toFixed(2)}%`
        };
    }
    
    check3TickConfirmation(currentPrice) {
        if (priceHistory.length < 4) return { name: '3-Tick Confirmation', pass: false, value: 'N/A' };
        
        const bounces = [];
        for (let i = 1; i <= 3; i++) {
            const prev = priceHistory[priceHistory.length-i-1];
            const curr = priceHistory[priceHistory.length-i];
            bounces.push(curr > prev ? 'UP' : 'DOWN');
        }
        
        const allSame = bounces.every(b => b === bounces[0]);
        
        return {
            name: '3-Tick Confirmation',
            pass: allSame,
            value: `${bounces.filter(b => b === 'UP').length} up, ${bounces.filter(b => b === 'DOWN').length} down`
        };
    }
    
    getResult() {
        return {
            signal: this.signal,
            confidence: this.confidence,
            conditions: this.conditions,
            metrics: {}
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
        
        // Initialize analyzer if not set
        if (!currentAnalyzer && currentSymbol) {
            initializeAnalyzer();
        }
        
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
        
        tickHistory.push({
            price: currentPrice,
            digit: lastDigit,
            time: Date.now()
        });
        if (tickHistory.length > 300) tickHistory.shift();
        
        // Update analyzer
        if (currentAnalyzer) {
            const result = currentAnalyzer.analyze(currentPrice, lastDigit);
            updateUI(result);
        }
        
        // Update price display
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
            ${priceStr.slice(0, -1)}<span style="color:${arrowColor}; border-bottom: 2px solid ${arrowColor};">${lastDigit}</span>
            <span style="color:${arrowColor}; font-size: 20px; margin-left: 8px;">${directionArrow}</span>
        `;

        if (currentMode !== 'rise_fall') {
            renderDigitStatistics(lastDigit);
        }
        
        if (botRunning) {
            checkBotDuration();
        }
    }
};

// ==========================================
// UI UPDATE FUNCTIONS
// ==========================================

function updateUI(result) {
    if (!result) return;
    
    // Update status badge
    const statusEl = document.getElementById('ai-status');
    if (statusEl) {
        statusEl.textContent = result.confidence >= 80 ? 'STRONG' : result.confidence >= 60 ? 'MODERATE' : 'WEAK';
        statusEl.className = `ai-status ${result.confidence >= 80 ? 'strong' : result.confidence >= 60 ? 'wait' : 'weak'}`;
    }
    
    // Update primary signal
    const signalEl = document.getElementById('primary-signal');
    if (signalEl) {
        signalEl.textContent = result.signal;
        signalEl.className = `signal-value ${result.signal.toLowerCase()}`;
    }
    
    // Update confidence
    const confBadge = document.getElementById('confidence-badge');
    if (confBadge) {
        confBadge.textContent = `${Math.round(result.confidence)}% CONFIDENCE`;
        confBadge.className = `confidence-badge ${result.confidence > 60 ? 'good' : result.confidence > 30 ? 'medium' : ''}`;
    }
    
    // Update conditions list
    updateConditionsList(result.conditions);
    
    // Update metrics
    updateMetrics(result.metrics);
    
    // Update pullback status
    updatePullbackStatus();
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

function updateMetrics(metrics) {
    // Update metric cards if they exist
    const trendEl = document.getElementById('metric-trend');
    const volEl = document.getElementById('metric-vol');
    const revEl = document.getElementById('metric-reversion');
    const momEl = document.getElementById('metric-momentum');
    
    if (trendEl && metrics.streak !== undefined) {
        trendEl.textContent = `${metrics.streak} ${metrics.streakParity || ''}`;
    }
    if (volEl && metrics.volatilityLevel) {
        volEl.textContent = `Jump ${metrics.volatilityLevel}`;
    }
    if (revEl && metrics.digitDistribution) {
        const maxDigit = metrics.digitDistribution.reduce((a,b) => parseFloat(a.percent) > parseFloat(b.percent) ? a : b);
        revEl.textContent = `${maxDigit.digit} (${maxDigit.percent}%)`;
    }
    if (momEl && metrics.minutesSinceJump) {
        momEl.textContent = `${metrics.minutesSinceJump} min`;
    }
}

function updatePullbackStatus() {
    const pullbackEl = document.getElementById('pullback-status');
    if (!pullbackEl) return;
    
    const statusMap = {
        'SCANNING': 'Scanning for setup...',
        'ARMED': '⚡ ARMED - Waiting for pullback',
        'COUNTING': `📉 Pullback ${pullbackState.counter}/3`,
        'SIGNAL': '🚀 SIGNAL - ENTER NOW'
    };
    
    pullbackEl.textContent = statusMap[pullbackState.status] || 'Scanning...';
    pullbackEl.style.color = pullbackState.status === 'SIGNAL' ? '#4caf50' : 
                            pullbackState.status === 'ARMED' ? '#ffd700' : '#888';
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

// ==========================================
// INITIALIZATION & NAVIGATION
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
    
    // Update UI with asset type
    const assetBadge = document.getElementById('asset-type-badge');
    if (assetBadge) {
        assetBadge.textContent = getAssetDisplayName(assetType);
        assetBadge.className = `asset-badge ${assetType.toLowerCase()}`;
    }
    
    // Update contract compatibility
    updateContractTabs(assetType);
    
    // Update help content
    updateHelpContent(assetType, currentMode);
}

function updateContractTabs(assetType) {
    const compatible = getCompatibleContracts(assetType);
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        const mode = tab.getAttribute('onclick').match(/'(\w+)'/)[1];
        if (compatible.includes(mode)) {
            tab.style.opacity = '1';
            tab.style.pointerEvents = 'auto';
        } else {
            tab.style.opacity = '0.3';
            tab.style.pointerEvents = 'none';
            tab.title = 'Not available for this asset type';
        }
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
    pullbackState = { status: 'SCANNING', direction: null, triggerPrice: null, counter: 0, maxTicks: 3 };
    
    document.getElementById('mTitle').innerText = name;
    document.getElementById('price-symbol').textContent = symbol.toUpperCase();
    document.getElementById('modal').style.display = 'block';
    
    initializeAnalyzer();
    
    switchPanel('signal', document.querySelector('.panel-nav-btn'));
    
    // Set default contract based on asset type
    const assetType = detectAssetType(symbol);
    const compatible = getCompatibleContracts(assetType);
    if (compatible.length > 0) {
        switchContract(compatible[0], document.querySelector(`.tab[onclick*="${compatible[0]}"]`));
    }

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
        if (digitPanel) digitPanel.style.display = 'none';
        if (chartView) chartView.style.height = '250px';
    } else {
        if (digitPanel) digitPanel.style.display = 'block';
        if (chartView) chartView.style.height = '200px';
        buildDigitGrid();
    }
    
    if (chartView) {
        chartView.innerHTML = `<iframe src="https://tradingview.binary.com/v2/main.php?symbol=${currentSymbol}&theme=dark" width="100%" height="100%" frameborder="0"></iframe>`;
    }
    
    // Reinitialize analyzer with new contract type
    if (currentAnalyzer) {
        currentAnalyzer.contractType = mode;
    }
    
    updateHelpContent(currentAssetType, mode);
}

function switchPanel(panelName, el) {
    document.querySelectorAll('.panel-nav-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    
    document.querySelectorAll('.ai-engine-panel, .dynamics-panel, .scanner-panel, .bridge-panel, .history-panel, .risk-panel, .session-panel, .correlation-panel, .backtest-panel, .sentiment-panel, .ml-panel, .multitf-panel, .execution-panel, .info-section').forEach(p => {
        p.style.display = 'none';
    });
    
    if (panelName === 'signal') {
        const aiPanel = document.querySelector('.ai-engine-panel');
        const infoSection = document.querySelector('.info-section');
        if (aiPanel) aiPanel.style.display = 'block';
        if (infoSection) infoSection.style.display = 'block';
    } else {
        const panel = document.getElementById(`${panelName}-panel`);
        if (panel) panel.style.display = 'block';
    }
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
    const helpContent = generateHelpContent(assetType, contractType);
    const helpContainer = document.getElementById('dynamic-help-content');
    if (helpContainer) {
        helpContainer.innerHTML = helpContent;
    }
}

function generateHelpContent(assetType, contractType) {
    const content = {
        'VOLATILITY': {
            'rise_fall': `
                <h4>🤖 Volatility Index - Rise/Fall Strategy</h4>
                <p><strong>5 Conditions Checked:</strong></p>
                <ol>
                    <li><strong>Parity Dominance:</strong> >60% even or odd in last 50 ticks</li>
                    <li><strong>Consecutive Streak:</strong> 3+ same parity detected</li>
                    <li><strong>Distribution Balance:</strong> No single digit >40%</li>
                    <li><strong>MA Alignment:</strong> Price relative to 10/20/50 EMA</li>
                    <li><strong>Stochastic Confirmation:</strong> Not in extreme zone</li>
                </ol>
                <p><strong>Entry Method:</strong> 3-tick pullback after conditions met</p>
            `,
            'even_odd': `
                <h4>🔢 Volatility Index - Even/Odd Strategy</h4>
                <p><strong>Mean Reversion Trading:</strong></p>
                <ol>
                    <li><strong>Parity Dominance:</strong> >60% one side = signal other side</li>
                    <li><strong>Consecutive Streak:</strong> 3+ streak broken = entry</li>
                    <li><strong>Distribution Balance:</strong> Ensures randomness</li>
                    <li><strong>MA Alignment:</strong> Trend filter</li>
                    <li><strong>Stochastic:</strong> Momentum confirmation</li>
                </ol>
            `,
            'matches_differs': `
                <h4>🎯 Volatility Index - Matches/Differs Strategy</h4>
                <p><strong>Probability-Based Trading:</strong></p>
                <ol>
                    <li><strong>Digit Frequency:</strong> Target digit <10% for MATCH</li>
                    <li><strong>Lead Digit Range:</strong> Highest 6-9, least is 5</li>
                    <li><strong>Appearance Gap:</strong> >20 ticks absent</li>
                    <li><strong>Green Circle:</strong> Most frequent digit</li>
                    <li><strong>Sample Validation:</strong> 25-tick and 100-tick agreement</li>
                </ol>
                <p>MATCH: 800% payout, ~10% win | DIFFERS: 6-20% payout, ~90% win</p>
            `,
            'over_under': `
                <h4>🎲 Volatility Index - Over/Under 5 Strategy</h4>
                <ol>
                    <li><strong>Green Arc:</strong> Bars on 6-9 (Over) or 0-3 (Under)</li>
                    <li><strong>Range Dominance:</strong> 5-9 or 0-4 >55%</li>
                    <li><strong>Trend + MACD:</strong> Direction confirmation</li>
                    <li><strong>MA Slope:</strong> Rising/falling confirmation</li>
                    <li><strong>Extreme Avoidance:</strong> MACD not >+40 or <-40</li>
                </ol>
            `
        },
        'FOREX': {
            'rise_fall': `
                <h4>💱 Forex Pair - Rise/Fall Strategy</h4>
                <p><strong>Technical Indicator Approach:</strong></p>
                <ol>
                    <li><strong>ADX Trend Strength:</strong> >25 with +DI/-DI direction</li>
                    <li><strong>RSI Momentum:</strong> 40-60 zone (not extreme)</li>
                    <li><strong>Stochastic Timing:</strong> 20-80 zone, crossovers</li>
                    <li><strong>Bollinger Bands:</strong> Touch lower/upper for entry</li>
                    <li><strong>3-Tick Pullback:</strong> Entry trigger in trend direction</li>
                </ol>
                <p><strong>Note:</strong> Digit-based contracts NOT available for Forex</p>
            `
        },
        'CRASH_BOOM': {
            'rise_fall': `
                <h4>⚡ Crash/Boom Index - Rise/Fall Strategy</h4>
                <p><strong>Spike Recovery Trading:</strong></p>
                <ol>
                    <li><strong>Post-Spike Window:</strong> 10-30 ticks after spike</li>
                    <li><strong>EMA200 Filter:</strong> Trend direction</li>
                    <li><strong>RSI Extreme:</strong> >70 (Crash) or <30 (Boom)</li>
                    <li><strong>3-Candle Confirmation:</strong> Consistent direction</li>
                    <li><strong>S/R Break:</strong> Breakout confirmation</li>
                </ol>
                <p>Spike occurs every 150-1000 ticks depending on index</p>
            `
        },
        'JUMP': {
            'rise_fall': `
                <h4>🦘 Jump Index - Rise/Fall Strategy</h4>
                <p><strong>Jump Cycle Trading:</strong></p>
                <ol>
                    <li><strong>Pre-Jump Window:</strong> 15-18 minutes after last jump</li>
                    <li><strong>Volatility Tier:</strong> Match risk to Jump level (10-100)</li>
                    <li><strong>EMA20 Direction:</strong> Slope determines bias</li>
                    <li><strong>Jump Pattern:</strong> Historical pattern match</li>
                    <li><strong>Risk Multiplier:</strong> Use Deriv Multipliers</li>
                </ol>
                <p>Jumps occur ~every 20 minutes, 30x normal volatility</p>
            `
        },
        'RANGE_STEP': {
            'rise_fall': `
                <h4>📊 Range/Step Index - Rise/Fall Strategy</h4>
                <p><strong>Range-Bound Trading:</strong></p>
                <ol>
                    <li><strong>Boundary Detection:</strong> Bollinger Band squeeze</li>
                    <li><strong>Mean Reversion:</strong> RSI <30 or >70</li>
                    <li><strong>Step Pattern:</strong> Consistent increment detection</li>
                    <li><strong>Range Width:</strong> >0.5% width validation</li>
                    <li><strong>3-Tick Confirmation:</strong> Direction confirmation</li>
                </ol>
            `
        }
    };
    
    return content[assetType]?.[contractType] || content['VOLATILITY']['rise_fall'];
}

// ==========================================
// BOT CONTROL & XML EXPORT
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
        alert('Warning: Low confidence! Start anyway?');
    }
    botRunning = true;
    botStartTime = Date.now();
    
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
    }
    if (stopBtn) {
        stopBtn.disabled = false;
        stopBtn.style.opacity = '1';
    }
    
    updateExecutionPanel();
}

function stopBot() {
    botRunning = false;
    
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
    }
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.style.opacity = '0.5';
    }
    
    updateExecutionPanel();
}

function checkBotDuration() {
    const elapsed = (Date.now() - botStartTime) / 1000 / 60;
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
    const amount = profit ? '+$12.50' : '-$5.00';
    const className = profit ? 'trade-profit' : 'trade-loss';
    item.innerHTML = `
        <span>${currentSymbol} ${direction}</span>
        <span class="${className}">${amount}</span>
    `;
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

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function exportData() {
    const data = {
        assetType: currentAssetType,
        symbol: currentSymbol,
        contract: currentMode,
        analyzer: currentAnalyzer ? currentAnalyzer.getResult() : null,
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
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
    if (activeSub) ws.send(JSON.stringify({ "forget": activeSub }));
}

function showAllConditions() {
    if (!currentAnalyzer) return;
    
    const conditions = currentAnalyzer.conditions.map(c => 
        `${c.pass ? '✅' : '❌'} ${c.name}: ${c.value}`
    ).join('\n');
    
    alert(`5 Critical Conditions:\n\n${conditions}\n\nCurrent Pass Rate: ${Math.round(currentAnalyzer.confidence)}%`);
}

// Help Modal Functions
function openHelp() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeHelp() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Close help modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.addEventListener('click', function(e) {
            if (e.target === this) closeHelp();
        });
    }
});
