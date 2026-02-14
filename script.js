// ============================================
// ZION TRADING LAB - PROFESSIONAL SCANNER
// ALL VOLATILITY INDICES · 20-SECOND SIGNALS
// App ID: 126973 | Token: rbQgwOkbsfDoKw2
// ============================================

class ZionProfessionalScanner {
    constructor() {
        // Your Deriv credentials
        this.apiToken = 'rbQgwOkbsfDoKw2';
        this.appId = '126973';
        this.websocket = null;
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // ALL 13 VOLATILITY INDICES
        this.volatilityIndices = [
            { name: 'Volatility 10 (1s)', symbol: 'R_10', tickSpeed: '1s', baseVol: 10 },
            { name: 'Volatility 10', symbol: 'R_10', tickSpeed: '1s', baseVol: 10 },
            { name: 'Volatility 15 (1s)', symbol: 'R_15', tickSpeed: '1s', baseVol: 15 },
            { name: 'Volatility 25 (1s)', symbol: 'R_25', tickSpeed: '1s', baseVol: 25 },
            { name: 'Volatility 25', symbol: 'R_25', tickSpeed: '1s', baseVol: 25 },
            { name: 'Volatility 30 (1s)', symbol: 'R_30', tickSpeed: '1s', baseVol: 30 },
            { name: 'Volatility 50 (1s)', symbol: 'R_50', tickSpeed: '1s', baseVol: 50 },
            { name: 'Volatility 50', symbol: 'R_50', tickSpeed: '1s', baseVol: 50 },
            { name: 'Volatility 75 (1s)', symbol: 'R_75', tickSpeed: '1s', baseVol: 75 },
            { name: 'Volatility 75', symbol: 'R_75', tickSpeed: '1s', baseVol: 75 },
            { name: 'Volatility 90 (1s)', symbol: 'R_90', tickSpeed: '1s', baseVol: 90 },
            { name: 'Volatility 100 (1s)', symbol: 'R_100', tickSpeed: '1s', baseVol: 100 },
            { name: 'Volatility 100', symbol: 'R_100', tickSpeed: '1s', baseVol: 100 }
        ];
        
        // Market types mapping
        this.marketTypes = {
            'RISE/FALL': { strategy: 'momentum', minVol: 50 },
            'EVEN/ODD': { strategy: 'digit', minVol: 25 },
            'OVER/UNDER': { strategy: 'stochastic', minVol: 30 },
            'MATCHES/DIFFERS': { strategy: 'pattern', minVol: 75 }
        };
        
        // Data storage
        this.priceHistory = {};
        this.signals = {};
        this.activeSignals = new Map();
        this.signalHistory = [];
        
        // Performance metrics
        this.signalsGenerated = 0;
        this.signalsAccurate = 0;
        this.isMuted = false;
        
        this.init();
    }
    
    async init() {
        this.createVolatilityGrid();
        this.setupEventListeners();
        await this.connectDerivWebSocket();
        this.startSignalEngine();
        this.initAIVoice();
    }
    
    createVolatilityGrid() {
        const grid = document.getElementById('marketGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Group by volatility
        const volatilityGroups = {
            'Low (10-25)': this.volatilityIndices.filter(v => v.baseVol <= 25),
            'Medium (30-50)': this.volatilityIndices.filter(v => v.baseVol > 25 && v.baseVol <= 50),
            'High (75-100)': this.volatilityIndices.filter(v => v.baseVol >= 75)
        };
        
        for (const [groupName, indices] of Object.entries(volatilityGroups)) {
            // Group header
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `<span>${groupName}</span> <i class="fas fa-chart-line"></i>`;
            grid.appendChild(header);
            
            // Cards for each volatility
            indices.forEach((vol) => {
                const card = document.createElement('div');
                card.className = 'market-card';
                card.dataset.symbol = vol.symbol;
                card.dataset.volatility = vol.baseVol;
                card.dataset.name = vol.name;
                
                const marketType = this.getMarketTypeForVolatility(vol.baseVol);
                card.dataset.market = marketType;
                
                card.innerHTML = `
                    <div class="vol-badge">${vol.name}</div>
                    <div class="main-row">
                        <div>${marketType.split('/')[0]}</div>
                        <div>${marketType.split('/')[1] || ''}</div>
                    </div>
                    <div class="price-display" id="price-${vol.symbol}">---</div>
                    <div class="signal-display" id="signal-${vol.symbol}"></div>
                    <div class="timer-display" id="timer-${vol.symbol}"></div>
                    <div class="market-footer">${vol.baseVol}% volatility</div>
                `;
                
                card.addEventListener('click', () => this.selectMarket(card));
                grid.appendChild(card);
            });
        }
    }
    
    getMarketTypeForVolatility(vol) {
        if (vol >= 75) return 'MATCHES/DIFFERS';
        if (vol >= 50) return 'RISE/FALL';
        if (vol >= 30) return 'OVER/UNDER';
        return 'EVEN/ODD';
    }
    
    async connectDerivWebSocket() {
        const statusEl = document.getElementById('apiStatus');
        
        try {
            this.websocket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);
            
            this.websocket.onopen = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#2ecc71"></i> LIVE DATA: CONNECTED';
                this.sendAuthorize();
                this.subscribeToAllVolatilities();
                this.startHeartbeat();
            };
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeData(data);
            };
            
            this.websocket.onclose = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> DISCONNECTED - Reconnecting...';
                this.reconnectWebSocket();
            };
            
            this.websocket.onerror = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> CONNECTION ERROR';
            };
            
        } catch (error) {
            statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> FAILED TO CONNECT';
        }
    }
    
    sendAuthorize() {
        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                "authorize": this.apiToken
            }));
        }
    }
    
    subscribeToAllVolatilities() {
        const uniqueSymbols = [...new Set(this.volatilityIndices.map(v => v.symbol))];
        
        uniqueSymbols.forEach(symbol => {
            this.websocket.send(JSON.stringify({
                "ticks": symbol,
                "subscribe": 1
            }));
            
            this.websocket.send(JSON.stringify({
                "ticks_history": symbol,
                "adjust_start_time": 1,
                "count": 100,
                "end": "latest",
                "granularity": 60,
                "style": "candles"
            }));
            
            this.priceHistory[symbol] = {
                ticks: [],
                candles: [],
                lastUpdate: null,
                volatility: this.volatilityIndices.find(v => v.symbol === symbol)?.baseVol || 50
            };
        });
    }
    
    handleRealTimeData(data) {
        if (data.error) {
            console.error('API Error:', data.error);
            return;
        }
        
        if (data.tick) {
            this.processTick(data.tick);
        }
        
        if (data.candles) {
            this.processCandles(data.echo_req?.ticks_history, data.candles);
        }
    }
    
    processTick(tick) {
        const { symbol, quote } = tick;
        
        if (!this.priceHistory[symbol]) {
            this.priceHistory[symbol] = { ticks: [], lastUpdate: null };
        }
        
        this.priceHistory[symbol].ticks.push({
            price: quote,
            timestamp: Date.now()
        });
        
        if (this.priceHistory[symbol].ticks.length > 100) {
            this.priceHistory[symbol].ticks.shift();
        }
        
        this.priceHistory[symbol].lastUpdate = Date.now();
        
        this.updatePriceDisplay(symbol, quote);
        this.analyzeForSignals(symbol, quote);
    }
    
    processCandles(symbol, candles) {
        if (symbol && candles) {
            this.priceHistory[symbol].candles = candles;
        }
    }
    
    updatePriceDisplay(symbol, price) {
        const priceEl = document.getElementById(`price-${symbol}`);
        if (priceEl) {
            priceEl.textContent = price.toFixed(5);
            priceEl.style.background = '#2ecc7122';
            setTimeout(() => {
                priceEl.style.background = '#0f1627';
            }, 200);
        }
    }
    
    startSignalEngine() {
        setInterval(() => {
            this.scanAllMarkets();
            this.updateSignalTimers();
        }, 1000);
        
        setInterval(() => {
            this.cleanExpiredSignals();
        }, 5000);
    }
    
    scanAllMarkets() {
        for (const symbol in this.priceHistory) {
            const history = this.priceHistory[symbol];
            if (history.ticks.length < 20) continue;
            
            const recentTicks = history.ticks.slice(-30);
            const currentPrice = recentTicks[recentTicks.length - 1]?.price;
            
            if (currentPrice) {
                this.analyzeForSignals(symbol, currentPrice);
            }
        }
    }
    
    analyzeForSignals(symbol, currentPrice) {
        const history = this.priceHistory[symbol];
        const ticks = history.ticks;
        const volatility = history.volatility || 50;
        
        if (ticks.length < 10) return;
        if (this.activeSignals.has(symbol)) return;
        
        const recentTicks = ticks.slice(-20);
        const prices = recentTicks.map(t => t.price);
        
        const indicators = this.calculateIndicators(prices);
        const marketType = this.getMarketTypeForVolatility(volatility);
        const signal = this.generateSignal(marketType, indicators, currentPrice, recentTicks);
        
        if (signal && signal.confidence >= 75) {
            this.emitSignal(symbol, marketType, signal, currentPrice);
        }
    }
    
    calculateIndicators(prices) {
        if (prices.length < 5) return null;
        
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const sorted = [...prices].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        
        // Linear regression slope
        const xMean = (prices.length - 1) / 2;
        const yMean = mean;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < prices.length; i++) {
            numerator += (i - xMean) * (prices[i] - yMean);
            denominator += Math.pow(i - xMean, 2);
        }
        
        const slope = denominator !== 0 ? numerator / denominator : 0;
        const momentum = prices.length > 10 ? (prices[prices.length - 1] - prices[prices.length - 10]) / 10 : 0;
        
        // RSI
        let gains = 0, losses = 0;
        for (let i = 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i-1];
            if (diff > 0) gains += diff;
            else losses -= diff;
        }
        const rsi = gains + losses === 0 ? 50 : 100 - (100 / (1 + gains/losses));
        
        // Gaussian skew
        const skew = (3 * (mean - median)) / stdDev;
        
        // Digit analysis
        const lastDigit = Math.floor(prices[prices.length - 1] * 100000) % 10;
        const prevDigit = Math.floor(prices[prices.length - 2] * 100000) % 10;
        
        return {
            mean, median, stdDev, slope, momentum, rsi, skew, lastDigit, prevDigit,
            currentPrice: prices[prices.length - 1]
        };
    }
    
    generateSignal(marketType, indicators, currentPrice, ticks) {
        if (!indicators) return null;
        
        switch(marketType) {
            case 'RISE/FALL':
                return this.generateRiseFallSignal(indicators);
            case 'EVEN/ODD':
                return this.generateEvenOddSignal(indicators, ticks);
            case 'OVER/UNDER':
                return this.generateOverUnderSignal(indicators);
            case 'MATCHES/DIFFERS':
                return this.generateMatchesDiffersSignal(indicators);
            default:
                return null;
        }
    }
    
    generateRiseFallSignal(indicators) {
        const { slope, momentum, rsi, skew } = indicators;
        
        const trendStrength = Math.abs(slope) / indicators.stdDev;
        const momentumStrength = Math.abs(momentum) / indicators.stdDev;
        const skewFactor = skew > 0.5 ? 0.2 : skew < -0.5 ? -0.2 : 0;
        
        let confidence = (trendStrength * 30 + momentumStrength * 30 + (50 - Math.abs(50 - rsi)) * 0.4);
        confidence = Math.min(95, Math.max(55, confidence + skewFactor * 20));
        
        const direction = slope + momentum > 0 ? 'RISE' : 'FALL';
        
        const isOverbought = rsi > 70;
        const isOversold = rsi < 30;
        
        let finalDirection = direction;
        if (isOverbought && direction === 'RISE') {
            finalDirection = 'FALL (reversal)';
            confidence *= 1.1;
        } else if (isOversold && direction === 'FALL') {
            finalDirection = 'RISE (reversal)';
            confidence *= 1.1;
        }
        
        return {
            type: finalDirection,
            confidence: Math.min(95, Math.round(confidence)),
            entry: 'NOW',
            duration: 20,
            reason: `Trend: ${slope > 0 ? '↑' : '↓'} | RSI: ${Math.round(rsi)}`
        };
    }
    
    generateEvenOddSignal(indicators, ticks) {
        const { lastDigit } = indicators;
        
        const last10Digits = ticks.slice(-10).map(t => Math.floor(t.price * 100000) % 10);
        const recentEvenCount = last10Digits.filter(d => d % 2 === 0).length;
        
        let confidence = 50;
        let prediction;
        
        if (recentEvenCount > 7) {
            confidence = 80;
            prediction = lastDigit % 2 === 0 ? 'ODD (reversal)' : 'EVEN (reversal)';
        } else if (recentEvenCount < 3) {
            confidence = 80;
            prediction = lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
        } else {
            confidence = 60;
            prediction = lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
        }
        
        return {
            type: prediction,
            confidence,
            entry: 'NOW',
            duration: 20,
            reason: `Even: ${recentEvenCount}/10 last digits`
        };
    }
    
    generateOverUnderSignal(indicators) {
        const { currentPrice, mean, stdDev } = indicators;
        
        const zScore = (currentPrice - mean) / stdDev;
        let prediction;
        let confidence;
        
        if (Math.abs(zScore) < 0.5) {
            prediction = currentPrice > mean ? 'OVER' : 'UNDER';
            confidence = 55;
        } else if (zScore > 1) {
            prediction = 'UNDER (reversion)';
            confidence = 75 + (zScore - 1) * 10;
        } else if (zScore < -1) {
            prediction = 'OVER (reversion)';
            confidence = 75 + Math.abs(zScore + 1) * 10;
        } else {
            prediction = currentPrice > mean ? 'OVER' : 'UNDER';
            confidence = 65;
        }
        
        return {
            type: prediction,
            confidence: Math.min(95, Math.round(confidence)),
            entry: 'NOW',
            duration: 20,
            reason: `Z-Score: ${zScore.toFixed(2)}`
        };
    }
    
    generateMatchesDiffersSignal(indicators) {
        const { lastDigit, prevDigit } = indicators;
        
        const matches = lastDigit === prevDigit;
        
        return {
            type: matches ? 'MATCHES' : 'DIFFERS',
            confidence: matches ? 55 : 60,
            entry: 'NOW',
            duration: 20,
            reason: `${prevDigit} → ${lastDigit}`
        };
    }
    
    emitSignal(symbol, marketType, signal, price) {
        const expiryTime = Date.now() + (signal.duration * 1000);
        
        const signalData = {
            id: `${symbol}-${Date.now()}`,
            symbol,
            marketType,
            signal: signal.type,
            confidence: signal.confidence,
            duration: signal.duration,
            price: price,
            reason: signal.reason,
            expiry: expiryTime,
            timestamp: Date.now()
        };
        
        this.activeSignals.set(symbol, signalData);
        this.displaySignal(symbol, signalData);
        
        if (!this.isMuted && signal.confidence > 85) {
            this.speak(`${signal.type} on ${symbol}`);
        }
        
        this.signalsGenerated++;
        this.signalHistory.push(signalData);
        this.updateAccuracyDisplay();
    }
    
    displaySignal(symbol, signal) {
        const signalEl = document.getElementById(`signal-${symbol}`);
        const timerEl = document.getElementById(`timer-${symbol}`);
        
        if (signalEl) {
            signalEl.innerHTML = `
                <div class="signal-active">
                    <span class="signal-type">${signal.signal}</span>
                    <span class="signal-conf">${signal.confidence}%</span>
                </div>
                <div class="signal-reason">${signal.reason}</div>
            `;
            signalEl.style.background = '#2ecc7122';
            signalEl.style.borderLeft = '4px solid #2ecc71';
        }
    }
    
    updateSignalTimers() {
        const now = Date.now();
        
        for (const [symbol, signal] of this.activeSignals) {
            const timerEl = document.getElementById(`timer-${symbol}`);
            if (!timerEl) continue;
            
            const timeLeft = Math.max(0, Math.ceil((signal.expiry - now) / 1000));
            
            if (timeLeft > 0) {
                timerEl.innerHTML = `
                    <div class="timer-active">
                        <i class="fas fa-hourglass-half"></i> ${timeLeft}s left
                    </div>
                `;
            } else {
                timerEl.innerHTML = '';
                this.verifySignalAccuracy(symbol, signal);
                
                const signalEl = document.getElementById(`signal-${symbol}`);
                if (signalEl) {
                    signalEl.innerHTML = '';
                    signalEl.style.background = 'transparent';
                    signalEl.style.borderLeft = 'none';
                }
            }
        }
    }
    
    verifySignalAccuracy(symbol, signal) {
        const history = this.priceHistory[symbol];
        if (!history || history.ticks.length < 20) return;
        
        const signalTime = signal.timestamp;
        const expiryTime = signal.expiry;
        
        const signalTick = history.ticks.find(t => t.timestamp >= signalTime);
        const expiryTick = history.ticks.find(t => t.timestamp >= expiryTime);
        
        if (signalTick && expiryTick) {
            const movement = expiryTick.price - signalTick.price;
            let accurate = false;
            
            if (signal.signal.includes('RISE') && movement > 0) accurate = true;
            else if (signal.signal.includes('FALL') && movement < 0) accurate = true;
            
            if (accurate) {
                this.signalsAccurate++;
            }
        }
        
        this.activeSignals.delete(symbol);
        this.updateAccuracyDisplay();
    }
    
    updateAccuracyDisplay() {
        const accuracyEl = document.getElementById('accuracyDisplay');
        if (accuracyEl && this.signalsGenerated > 0) {
            const accuracy = (this.signalsAccurate / this.signalsGenerated * 100).toFixed(1);
            accuracyEl.innerHTML = `🎯 Accuracy: ${accuracy}% (${this.signalsAccurate}/${this.signalsGenerated})`;
        }
    }
    
    startHeartbeat() {
        setInterval(() => {
            if (this.websocket?.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({ "ping": 1 }));
            }
        }, 30000);
    }
    
    reconnectWebSocket() {
        if (this.connectionAttempts >= this.maxReconnectAttempts) return;
        
        this.connectionAttempts++;
        setTimeout(() => {
            this.connectDerivWebSocket();
        }, 5000 * this.connectionAttempts);
    }
    
    selectMarket(card) {
        document.querySelectorAll('.market-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        const marketName = card.dataset.market;
        const symbol = card.dataset.symbol;
        document.getElementById('bestMarket').innerText = `📊 Monitoring: ${marketName} (${symbol})`;
    }
    
    setupEventListeners() {
        document.getElementById('menuButton')?.addEventListener('click', () => {
            document.getElementById('socialContainer').classList.toggle('hidden');
            this.speak('Menu opened');
        });
        
        document.getElementById('muteToggle')?.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            const icon = document.getElementById('voiceIcon');
            const label = document.getElementById('muteLabel');
            
            if (this.isMuted) {
                icon.className = 'fas fa-volume-off';
                label.innerText = 'unmute';
            } else {
                icon.className = 'fas fa-volume-up';
                label.innerText = 'mute';
                this.speak('Voice activated');
            }
        });
        
        document.querySelectorAll('.social-item').forEach(item => {
            item.addEventListener('click', () => {
                const social = item.dataset.social;
                this.speak(`Opening ${social}`);
                window.open(`https://${social}.com`, '_blank');
            });
        });
        
        document.querySelector('.d-no')?.addEventListener('dblclick', () => {
            this.runFullMarketScan();
        });
    }
    
    runFullMarketScan() {
        this.speak('Running full market scan');
        document.getElementById('bestMarket').innerHTML = '🔍 SCANNING ALL 13 INDICES...';
        
        setTimeout(() => {
            let bestConfidence = 0;
            let bestSignal = null;
            
            for (const signal of this.activeSignals.values()) {
                if (signal.confidence > bestConfidence) {
                    bestConfidence = signal.confidence;
                    bestSignal = signal;
                }
            }
            
            if (bestSignal) {
                document.getElementById('bestMarket').innerHTML = 
                    `🔥 BEST: ${bestSignal.symbol} - ${bestSignal.signal} (${bestSignal.confidence}%)`;
            }
        }, 2000);
    }
    
    cleanExpiredSignals() {
        const now = Date.now();
        for (const [symbol, signal] of this.activeSignals) {
            if (signal.expiry <= now) {
                this.activeSignals.delete(symbol);
            }
        }
    }
    
    initAIVoice() {
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.voices = window.speechSynthesis.getVoices();
            };
        }
    }
    
    speak(message) {
        if (this.isMuted || !window.speechSynthesis) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.voice = this.voices?.find(v => v.name.includes('Google') || v.name.includes('Samantha'));
        window.speechSynthesis.speak(utterance);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.zionLab = new ZionProfessionalScanner();
});
