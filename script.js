// ============================================
// ZION QUANTUM SENSOR - PROFESSIONAL EDITION
// LONG-LASTING SIGNAL DETECTION FOR ALL OPTION TYPES
// LIVE DERIV DATA · 20+ SECOND SIGNALS
// App ID: 126973 | Token: rbQgwOkbsfDoKw2
// ============================================

class ZionQuantumSensor {
    constructor() {
        // Deriv Credentials
        this.apiToken = 'rbQgwOkbsfDoKw2';
        this.appId = '126973';
        this.websocket = null;
        this.isConnected = false;
        
        // ============================================
        // COMPLETE VOLATILITY LIST - PROPERLY NAMED
        // ============================================
        this.volatilities = {
            // Standard Volatilities (No 1s suffix)
            standard: [
                { id: 'R_10', name: 'Volatility 10', baseVol: 10, displayName: 'VOL 10', type: 'standard' },
                { id: 'R_25', name: 'Volatility 25', baseVol: 25, displayName: 'VOL 25', type: 'standard' },
                { id: 'R_50', name: 'Volatility 50', baseVol: 50, displayName: 'VOL 50', type: 'standard' },
                { id: 'R_75', name: 'Volatility 75', baseVol: 75, displayName: 'VOL 75', type: 'standard' },
                { id: 'R_100', name: 'Volatility 100', baseVol: 100, displayName: 'VOL 100', type: 'standard' }
            ],
            // 1 Second Volatilities (With 1s suffix)
            oneSecond: [
                { id: 'R_10', name: 'Volatility 10 (1s)', baseVol: 10, displayName: 'VOL 10 1s', type: '1s' },
                { id: 'R_15', name: 'Volatility 15 (1s)', baseVol: 15, displayName: 'VOL 15 1s', type: '1s' },
                { id: 'R_25', name: 'Volatility 25 (1s)', baseVol: 25, displayName: 'VOL 25 1s', type: '1s' },
                { id: 'R_30', name: 'Volatility 30 (1s)', baseVol: 30, displayName: 'VOL 30 1s', type: '1s' },
                { id: 'R_50', name: 'Volatility 50 (1s)', baseVol: 50, displayName: 'VOL 50 1s', type: '1s' },
                { id: 'R_75', name: 'Volatility 75 (1s)', baseVol: 75, displayName: 'VOL 75 1s', type: '1s' },
                { id: 'R_90', name: 'Volatility 90 (1s)', baseVol: 90, displayName: 'VOL 90 1s', type: '1s' },
                { id: 'R_100', name: 'Volatility 100 (1s)', baseVol: 100, displayName: 'VOL 100 1s', type: '1s' }
            ]
        };
        
        // ============================================
        // OPTION TYPES - EACH WITH DEDICATED SENSORS
        // ============================================
        this.optionTypes = [
            {
                name: 'EVEN/ODD',
                displayName: 'EVEN / ODD',
                icon: '🎲',
                description: 'Last Digit Sensor',
                color: '#9b59b6',
                secondaryColor: '#8e44ad',
                minConfidence: 75,
                signalDuration: 25, // 25 seconds for even/odd
                // Which volatilities to monitor for this option type
                sensors: [
                    // Low volatilities are best for digit trading
                    { id: 'R_10', type: 'standard', name: 'Volatility 10' },
                    { id: 'R_10', type: '1s', name: 'Volatility 10 (1s)' },
                    { id: 'R_15', type: '1s', name: 'Volatility 15 (1s)' },
                    { id: 'R_25', type: 'standard', name: 'Volatility 25' },
                    { id: 'R_25', type: '1s', name: 'Volatility 25 (1s)' },
                    { id: 'R_30', type: '1s', name: 'Volatility 30 (1s)' }
                ]
            },
            {
                name: 'RISE/FALL',
                displayName: 'RISE / FALL',
                icon: '📈',
                description: 'Direction Sensor',
                color: '#3498db',
                secondaryColor: '#2980b9',
                minConfidence: 80,
                signalDuration: 30, // 30 seconds for rise/fall
                sensors: [
                    // Medium-high volatilities for momentum trading
                    { id: 'R_50', type: 'standard', name: 'Volatility 50' },
                    { id: 'R_50', type: '1s', name: 'Volatility 50 (1s)' },
                    { id: 'R_75', type: 'standard', name: 'Volatility 75' },
                    { id: 'R_75', type: '1s', name: 'Volatility 75 (1s)' },
                    { id: 'R_90', type: '1s', name: 'Volatility 90 (1s)' },
                    { id: 'R_100', type: 'standard', name: 'Volatility 100' },
                    { id: 'R_100', type: '1s', name: 'Volatility 100 (1s)' }
                ]
            },
            {
                name: 'OVER/UNDER',
                displayName: 'OVER / UNDER',
                icon: '⚖️',
                description: 'Range Sensor',
                color: '#e67e22',
                secondaryColor: '#d35400',
                minConfidence: 78,
                signalDuration: 25,
                sensors: [
                    // Medium volatilities for range trading
                    { id: 'R_25', type: 'standard', name: 'Volatility 25' },
                    { id: 'R_25', type: '1s', name: 'Volatility 25 (1s)' },
                    { id: 'R_30', type: '1s', name: 'Volatility 30 (1s)' },
                    { id: 'R_50', type: 'standard', name: 'Volatility 50' },
                    { id: 'R_50', type: '1s', name: 'Volatility 50 (1s)' },
                    { id: 'R_75', type: 'standard', name: 'Volatility 75' },
                    { id: 'R_75', type: '1s', name: 'Volatility 75 (1s)' }
                ]
            },
            {
                name: 'MATCHES/DIFFERS',
                displayName: 'MATCHES / DIFFERS',
                icon: '🔄',
                description: 'Pattern Sensor',
                color: '#e74c3c',
                secondaryColor: '#c0392b',
                minConfidence: 75,
                signalDuration: 20,
                sensors: [
                    // High volatilities for pattern recognition
                    { id: 'R_75', type: 'standard', name: 'Volatility 75' },
                    { id: 'R_75', type: '1s', name: 'Volatility 75 (1s)' },
                    { id: 'R_90', type: '1s', name: 'Volatility 90 (1s)' },
                    { id: 'R_100', type: 'standard', name: 'Volatility 100' },
                    { id: 'R_100', type: '1s', name: 'Volatility 100 (1s)' }
                ]
            }
        ];
        
        // Data Storage
        this.sensorData = {};        // Stores tick data for each sensor
        this.activeSignals = new Map(); // Currently active signals
        this.signalHistory = [];      // History of signals
        this.bestSignals = {};        // Best signal per option type
        
        // Performance
        this.totalSignals = 0;
        this.accurateSignals = 0;
        this.isMuted = false;
        
        // Initialize sensor data structure
        this.initializeSensors();
        
        // Start the sensing machine
        this.init();
    }
    
    initializeSensors() {
        // Create a data store for each unique sensor
        this.optionTypes.forEach(option => {
            option.sensors.forEach(sensor => {
                const key = `${sensor.id}-${sensor.type}`;
                if (!this.sensorData[key]) {
                    this.sensorData[key] = {
                        id: sensor.id,
                        type: sensor.type,
                        name: sensor.name,
                        ticks: [],
                        lastPrice: null,
                        indicators: {},
                        lastSignal: null,
                        signalCount: 0
                    };
                }
            });
        });
    }
    
    init() {
        this.buildInterface();
        this.setupEventListeners();
        this.connectToDeriv();
        this.startSensingEngine();
        this.initVoice();
    }
    
    buildInterface() {
        const container = document.getElementById('marketSections');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Create a section for each option type
        this.optionTypes.forEach(option => {
            const section = this.createOptionSection(option);
            container.appendChild(section);
        });
        
        // Update counts
        this.updateSensorCounts();
    }
    
    createOptionSection(option) {
        const section = document.createElement('div');
        section.className = 'market-section';
        section.id = `section-${option.name.toLowerCase().replace('/', '-')}`;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <div class="section-icon">${option.icon}</div>
            <div class="section-title">
                <h2 style="color: ${option.color}">${option.displayName}</h2>
                <div class="section-subtitle">
                    <span>🔍 ${option.description}</span>
                    <span>⏱️ ${option.signalDuration}s signals</span>
                </div>
            </div>
            <div class="section-badge" id="badge-${option.name.toLowerCase().replace('/', '-')}">
                🎯 SENSOR ACTIVE<br>
                <small>${option.sensors.length} sensors</small>
            </div>
        `;
        section.appendChild(header);
        
        // Create grid for sensors
        const grid = document.createElement('div');
        grid.className = 'vol-grid';
        
        // Add a card for each sensor in this option type
        option.sensors.forEach(sensor => {
            const card = this.createSensorCard(sensor, option);
            grid.appendChild(card);
        });
        
        section.appendChild(grid);
        return section;
    }
    
    createSensorCard(sensor, option) {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.dataset.symbol = sensor.id;
        card.dataset.type = sensor.type;
        card.dataset.market = option.name;
        card.dataset.key = `${sensor.id}-${sensor.type}`;
        
        const [left, right] = option.displayName.split('/');
        
        card.innerHTML = `
            <div class="vol-badge ${sensor.type}">
                ${sensor.type === 'standard' ? '📊 STANDARD' : '⚡ 1 SECOND'}
            </div>
            <div class="vol-name">${sensor.name}</div>
            <div class="main-row">
                <div style="color: ${option.color}">${left.trim()}</div>
                <div style="color: ${option.secondaryColor}">${right ? right.trim() : ''}</div>
            </div>
            <div class="price-display" id="price-${sensor.id}-${sensor.type}">
                ---
            </div>
            <div class="signal-quantum" id="signal-${sensor.id}-${sensor.type}">
                <div class="signal-primary">
                    <span class="signal-type">⏳ SENSOR</span>
                    <span class="signal-confidence low">0%</span>
                </div>
                <div class="signal-duration">
                    <i class="fas fa-hourglass-half"></i> Waiting for data...
                </div>
                <div class="signal-reason">Initializing sensor</div>
            </div>
            <div class="timer-quantum" id="timer-${sensor.id}-${sensor.type}" style="display: none;">
                <span class="timer-text">0s</span>
                <div class="timer-progress"><div class="timer-progress-fill" style="width: 0%"></div></div>
            </div>
            <div class="market-footer">
                <span class="volatility-value"><i class="fas fa-bolt"></i> ${sensor.baseVol || '--'}%</span>
                <span class="signal-frequency" id="freq-${sensor.id}-${sensor.type}">0 signals</span>
            </div>
        `;
        
        return card;
    }
    
    connectToDeriv() {
        const statusEl = document.getElementById('apiStatus');
        
        try {
            this.websocket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);
            
            this.websocket.onopen = () => {
                this.isConnected = true;
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#2ecc71"></i> SENSOR ONLINE · LIVE DATA STREAM';
                this.authenticate();
                this.subscribeToAllSensors();
            };
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.processTickData(data);
            };
            
            this.websocket.onclose = () => {
                this.isConnected = false;
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> SENSOR RECONNECTING...';
                setTimeout(() => this.connectToDeriv(), 5000);
            };
            
            this.websocket.onerror = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> SENSOR ERROR';
            };
            
        } catch (error) {
            statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> CONNECTION FAILED';
        }
    }
    
    authenticate() {
        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                "authorize": this.apiToken
            }));
        }
    }
    
    subscribeToAllSensors() {
        // Get unique symbols
        const symbols = [...new Set([
            ...this.volatilities.standard.map(v => v.id),
            ...this.volatilities.oneSecond.map(v => v.id)
        ])];
        
        symbols.forEach(symbol => {
            this.websocket.send(JSON.stringify({
                "ticks": symbol,
                "subscribe": 1
            }));
        });
        
        console.log(`📡 Subscribed to ${symbols.length} symbols`);
    }
    
    processTickData(data) {
        if (data.error) {
            console.error('API Error:', data.error);
            return;
        }
        
        if (data.tick) {
            const { symbol, quote, epoch } = data.tick;
            
            // Update both standard and 1s versions
            ['standard', '1s'].forEach(type => {
                const key = `${symbol}-${type}`;
                if (this.sensorData[key]) {
                    this.sensorData[key].ticks.push({
                        price: quote,
                        time: Date.now(),
                        epoch: epoch
                    });
                    
                    // Keep last 100 ticks
                    if (this.sensorData[key].ticks.length > 100) {
                        this.sensorData[key].ticks.shift();
                    }
                    
                    this.sensorData[key].lastPrice = quote;
                    
                    // Update price display
                    this.updatePriceDisplay(symbol, type, quote);
                    
                    // Run sensor analysis
                    this.analyzeSensor(key);
                }
            });
        }
    }
    
    updatePriceDisplay(symbol, type, price) {
        const priceEl = document.getElementById(`price-${symbol}-${type}`);
        if (priceEl) {
            priceEl.textContent = price.toFixed(5);
            
            // Flash effect
            priceEl.style.transition = 'background 0.2s';
            priceEl.style.background = '#4ac7ff33';
            setTimeout(() => {
                priceEl.style.background = '#0b1020';
            }, 200);
        }
    }
    
    startSensingEngine() {
        // Run analysis every 500ms
        setInterval(() => {
            this.runAllSensors();
        }, 500);
        
        // Update timers every 100ms
        setInterval(() => {
            this.updateSignalTimers();
        }, 100);
        
        // Clean up expired signals
        setInterval(() => {
            this.cleanExpiredSignals();
        }, 1000);
        
        console.log('🔍 Sensing engine started');
    }
    
    runAllSensors() {
        // Process each option type
        this.optionTypes.forEach(option => {
            let bestForOption = null;
            let bestConfidence = 0;
            
            option.sensors.forEach(sensor => {
                const key = `${sensor.id}-${sensor.type}`;
                const sensorData = this.sensorData[key];
                
                if (!sensorData || sensorData.ticks.length < 30) return;
                
                // Check if already has active signal
                if (this.activeSignals.has(key)) return;
                
                // Run specific sensor based on option type
                let signal = null;
                
                switch(option.name) {
                    case 'EVEN/ODD':
                        signal = this.evenOddSensor(sensorData, option);
                        break;
                    case 'RISE/FALL':
                        signal = this.riseFallSensor(sensorData, option);
                        break;
                    case 'OVER/UNDER':
                        signal = this.overUnderSensor(sensorData, option);
                        break;
                    case 'MATCHES/DIFFERS':
                        signal = this.matchesDiffersSensor(sensorData, option);
                        break;
                }
                
                if (signal && signal.confidence >= option.minConfidence) {
                    // This is a valid signal
                    this.emitSignal(key, sensor, option, signal);
                    
                    if (signal.confidence > bestConfidence) {
                        bestConfidence = signal.confidence;
                        bestForOption = { key, sensor, signal };
                    }
                }
            });
            
            // Update best signal for this option type
            if (bestForOption) {
                this.updateOptionBadge(option, bestForOption);
            }
        });
        
        // Update overall best signal
        this.updateOverallBest();
    }
    
    // ============================================
    // EVEN/ODD SENSOR - Digit Analysis for Long Signals
    // ============================================
    evenOddSensor(data, option) {
        const ticks = data.ticks;
        const recentTicks = ticks.slice(-40);
        
        // Extract last digits
        const digits = recentTicks.map(t => Math.floor(t.price * 100000) % 10);
        const lastDigit = digits[digits.length - 1];
        
        // Calculate entropy (randomness)
        const freq = Array(10).fill(0);
        digits.forEach(d => freq[d]++);
        let entropy = 0;
        freq.forEach(f => {
            const p = f / digits.length;
            if (p > 0) entropy -= p * Math.log2(p);
        });
        const maxEntropy = Math.log2(10);
        const normEntropy = entropy / maxEntropy;
        
        // Detect patterns (decay)
        let pattern = 0;
        for (let i = 1; i < 10; i++) {
            if (digits[digits.length - i] === lastDigit) pattern++;
        }
        
        // Check even/odd streaks
        const evenCount = digits.slice(-15).filter(d => d % 2 === 0).length;
        const evenRatio = evenCount / 15;
        
        // Determine signal
        let signalType = '';
        let confidence = 50;
        let reason = '';
        
        // Strong pattern detection
        if (evenRatio > 0.8) {
            // Too many evens, odds are due
            signalType = lastDigit % 2 === 0 ? 'ODD (REVERSAL)' : 'EVEN';
            confidence = 75 + (evenRatio - 0.8) * 50;
            reason = `Even streak: ${evenCount}/15, reversal likely`;
        } else if (evenRatio < 0.2) {
            // Too many odds, evens are due
            signalType = lastDigit % 2 === 0 ? 'EVEN' : 'EVEN (REVERSAL)';
            confidence = 75 + (0.2 - evenRatio) * 50;
            reason = `Odd streak: ${15-evenCount}/15, reversal likely`;
        } else if (normEntropy < 0.7) {
            // Low entropy means pattern emerging
            if (pattern > 3) {
                signalType = lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
                confidence = 70 + pattern * 5;
                reason = `Pattern detected: ${pattern} repeats`;
            } else {
                signalType = lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
                confidence = 60;
                reason = 'Normal distribution';
            }
        } else {
            // Random - low confidence
            signalType = lastDigit % 2 === 0 ? 'EVEN' : 'ODD';
            confidence = 55;
            reason = 'High entropy, low certainty';
        }
        
        // Long signal check
        const isLongSignal = pattern > 2 && confidence > 75;
        
        return {
            type: signalType,
            confidence: Math.min(98, Math.round(confidence)),
            duration: isLongSignal ? option.signalDuration : 15,
            reason: reason,
            isLong: isLongSignal,
            entropy: normEntropy.toFixed(2),
            pattern: pattern
        };
    }
    
    // ============================================
    // RISE/FALL SENSOR - Momentum Analysis for Long Signals
    // ============================================
    riseFallSensor(data, option) {
        const ticks = data.ticks;
        const prices = ticks.slice(-40).map(t => t.price);
        
        // Calculate indicators
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const current = prices[prices.length - 1];
        
        // Volatility
        const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        
        // Momentum (rate of change)
        const mom5 = (prices[prices.length - 1] - prices[prices.length - 6]) / 5;
        const mom10 = (prices[prices.length - 1] - prices[prices.length - 11]) / 10;
        const mom20 = (prices[prices.length - 1] - prices[prices.length - 21]) / 20;
        
        // Trend strength
        const trend = (mom5 * 0.5 + mom10 * 0.3 + mom20 * 0.2) / stdDev;
        
        // RSI approximation
        let gains = 0, losses = 0;
        for (let i = 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i-1];
            if (diff > 0) gains += diff;
            else losses -= diff;
        }
        const rsi = gains + losses === 0 ? 50 : 100 - (100 / (1 + gains/losses));
        
        // Determine signal
        let signalType = '';
        let confidence = 50;
        let reason = '';
        
        // Strong trend detection
        if (trend > 0.5) {
            signalType = 'RISE';
            confidence = 70 + Math.min(25, trend * 20);
            reason = `Strong upward momentum: ${trend.toFixed(2)}`;
        } else if (trend < -0.5) {
            signalType = 'FALL';
            confidence = 70 + Math.min(25, Math.abs(trend) * 20);
            reason = `Strong downward momentum: ${trend.toFixed(2)}`;
        } else if (rsi > 70) {
            signalType = 'FALL (REVERSAL)';
            confidence = 75;
            reason = `Overbought (RSI: ${rsi.toFixed(0)})`;
        } else if (rsi < 30) {
            signalType = 'RISE (REVERSAL)';
            confidence = 75;
            reason = `Oversold (RSI: ${rsi.toFixed(0)})`;
        } else {
            signalType = prices[prices.length - 1] > prices[prices.length - 2] ? 'RISE' : 'FALL';
            confidence = 60;
            reason = `Weak momentum, following last tick`;
        }
        
        // Long signal check
        const isLongSignal = Math.abs(trend) > 0.8 && confidence > 75;
        
        return {
            type: signalType,
            confidence: Math.min(98, Math.round(confidence)),
            duration: isLongSignal ? option.signalDuration : 20,
            reason: reason,
            isLong: isLongSignal,
            trend: trend.toFixed(2),
            rsi: rsi.toFixed(0)
        };
    }
    
    // ============================================
    // OVER/UNDER SENSOR - Range Analysis for Long Signals
    // ============================================
    overUnderSensor(data, option) {
        const ticks = data.ticks;
        const prices = ticks.slice(-50).map(t => t.price);
        
        // Calculate support/resistance levels
        const max = Math.max(...prices);
        const min = Math.min(...prices);
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const current = prices[prices.length - 1];
        
        // Position in range
        const range = max - min;
        const position = range === 0 ? 0.5 : (current - min) / range;
        
        // Distance from mean (Z-score)
        const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const zScore = (current - mean) / stdDev;
        
        // Determine signal
        let signalType = '';
        let confidence = 50;
        let reason = '';
        
        if (position > 0.85) {
            signalType = 'UNDER';
            confidence = 75 + (position - 0.85) * 50;
            reason = `Near resistance (${(position*100).toFixed(0)}% of range)`;
        } else if (position < 0.15) {
            signalType = 'OVER';
            confidence = 75 + (0.15 - position) * 50;
            reason = `Near support (${(position*100).toFixed(0)}% of range)`;
        } else if (zScore > 1.5) {
            signalType = 'UNDER';
            confidence = 70 + (zScore - 1.5) * 15;
            reason = `Z-score: ${zScore.toFixed(2)} above mean`;
        } else if (zScore < -1.5) {
            signalType = 'OVER';
            confidence = 70 + Math.abs(zScore + 1.5) * 15;
            reason = `Z-score: ${zScore.toFixed(2)} below mean`;
        } else {
            signalType = current > mean ? 'OVER' : 'UNDER';
            confidence = 60;
            reason = `Near mean (${(position*100).toFixed(0)}% range)`;
        }
        
        // Long signal check
        const isLongSignal = (position > 0.9 || position < 0.1) && confidence > 75;
        
        return {
            type: signalType,
            confidence: Math.min(98, Math.round(confidence)),
            duration: isLongSignal ? option.signalDuration : 15,
            reason: reason,
            isLong: isLongSignal,
            position: (position * 100).toFixed(0),
            zScore: zScore.toFixed(2)
        };
    }
    
    // ============================================
    // MATCHES/DIFFERS SENSOR - Pattern Analysis for Long Signals
    // ============================================
    matchesDiffersSensor(data, option) {
        const ticks = data.ticks;
        const digits = ticks.slice(-40).map(t => Math.floor(t.price * 100000) % 10);
        
        const lastDigit = digits[digits.length - 1];
        const prevDigit = digits[digits.length - 2];
        
        // Pattern detection
        let matches = 0;
        for (let i = 1; i < 10; i++) {
            if (digits[digits.length - i] === lastDigit) matches++;
        }
        
        // Check for repeating patterns
        let pattern = '';
        for (let i = 1; i <= 3; i++) {
            pattern += digits[digits.length - i];
        }
        
        // Find pattern frequency
        let patternCount = 0;
        for (let i = 0; i < digits.length - 3; i++) {
            if (digits.slice(i, i+3).join('') === pattern) patternCount++;
        }
        
        // Determine signal
        let signalType = lastDigit === prevDigit ? 'MATCHES' : 'DIFFERS';
        let confidence = 50;
        let reason = '';
        
        if (matches > 4) {
            // Strong match pattern
            signalType = 'MATCHES';
            confidence = 75 + matches * 3;
            reason = `Strong match pattern (${matches}/10)`;
        } else if (patternCount > 2) {
            // Repeating pattern
            signalType = 'MATCHES';
            confidence = 70 + patternCount * 5;
            reason = `Pattern ${pattern} repeating`;
        } else if (lastDigit === prevDigit) {
            confidence = 60;
            reason = 'Recent match, low confidence';
        } else {
            confidence = 55;
            reason = 'Recent differ, random distribution';
        }
        
        // Long signal check
        const isLongSignal = matches > 3 || patternCount > 2;
        
        return {
            type: signalType,
            confidence: Math.min(98, Math.round(confidence)),
            duration: isLongSignal ? option.signalDuration : 15,
            reason: reason,
            isLong: isLongSignal,
            matches: matches,
            pattern: pattern
        };
    }
    
    emitSignal(key, sensor, option, signal) {
        const expiryTime = Date.now() + (signal.duration * 1000);
        
        // Check if already has active signal
        if (this.activeSignals.has(key)) {
            const existing = this.activeSignals.get(key);
            if (existing.signal.confidence > signal.confidence) {
                return; // Keep stronger signal
            }
        }
        
        const signalData = {
            id: `${key}-${Date.now()}`,
            key: key,
            symbol: sensor.id,
            type: sensor.type,
            optionType: option.name,
            sensorName: sensor.name,
            signal: signal,
            expiry: expiryTime,
            timestamp: Date.now()
        };
        
        this.activeSignals.set(key, signalData);
        this.totalSignals++;
        
        // Update UI
        this.displaySignal(key, signalData);
        this.updateSensorFrequency(key);
        
        // Update signal count
        document.getElementById('signalCount').innerText = this.activeSignals.size;
        
        // Voice for long signals
        if (!this.isMuted && signal.isLong) {
            this.speak(`Long ${option.name} signal on ${sensor.name} with ${signal.confidence} percent confidence`);
        }
        
        console.log('🔔 SIGNAL DETECTED:', signalData);
    }
    
    displaySignal(key, signalData) {
        const signalEl = document.getElementById(`signal-${signalData.symbol}-${signalData.type}`);
        const timerEl = document.getElementById(`timer-${signalData.symbol}-${signalData.type}`);
        
        if (!signalEl) return;
        
        const signal = signalData.signal;
        let confidenceClass = 'low';
        if (signal.confidence >= 85) confidenceClass = 'high';
        else if (signal.confidence >= 70) confidenceClass = 'medium';
        
        // Get option colors
        const option = this.optionTypes.find(o => o.name === signalData.optionType);
        const typeColor = option ? option.color : '#4ac7ff';
        
        signalEl.innerHTML = `
            <div class="signal-primary">
                <span class="signal-type" style="color: ${typeColor}">${signal.type}</span>
                <span class="signal-confidence ${confidenceClass}">${signal.confidence}%</span>
            </div>
            <div class="signal-duration">
                <i class="fas fa-hourglass-half"></i> ${signal.duration}s signal
                ${signal.isLong ? ' 👑 LONG' : ''}
            </div>
            <div class="signal-reason">🔍 ${signal.reason}</div>
        `;
        
        // Show and update timer
        timerEl.style.display = 'flex';
        
        // Highlight card
        const card = document.querySelector(`[data-key="${key}"]`);
        if (card) {
            card.classList.add('signal-active');
            if (signal.isLong) {
                card.classList.add('elite-signal');
            }
        }
    }
    
    updateSensorFrequency(key) {
        const freqEl = document.getElementById(`freq-${key.split('-')[0]}-${key.split('-')[1]}`);
        if (freqEl) {
            const current = parseInt(freqEl.innerText) || 0;
            freqEl.innerText = `${current + 1} signals`;
        }
    }
    
    updateSignalTimers() {
        const now = Date.now();
        
        for (const [key, signalData] of this.activeSignals) {
            const timerEl = document.getElementById(`timer-${signalData.symbol}-${signalData.type}`);
            
            if (!timerEl) continue;
            
            const timeLeft = Math.max(0, signalData.expiry - now);
            const secondsLeft = Math.ceil(timeLeft / 1000);
            const progressPercent = (timeLeft / (signalData.signal.duration * 1000)) * 100;
            
            if (timeLeft > 0) {
                timerEl.innerHTML = `
                    <span class="timer-text">${secondsLeft}s</span>
                    <div class="timer-progress">
                        <div class="timer-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                `;
            } else {
                timerEl.style.display = 'none';
                
                // Remove highlight
                const card = document.querySelector(`[data-key="${key}"]`);
                if (card) {
                    card.classList.remove('signal-active', 'elite-signal');
                }
            }
        }
    }
    
    cleanExpiredSignals() {
        const now = Date.now();
        for (const [key, signal] of this.activeSignals) {
            if (signal.expiry <= now) {
                this.activeSignals.delete(key);
            }
        }
        document.getElementById('signalCount').innerText = this.activeSignals.size;
    }
    
    updateOptionBadge(option, best) {
        const badgeId = `badge-${option.name.toLowerCase().replace('/', '-')}`;
        const badge = document.getElementById(badgeId);
        
        if (badge) {
            const sensor = best.sensor;
            badge.innerHTML = `
                👑 ${sensor.name}<br>
                <small>${best.signal.type} (${best.signal.confidence}%)</small>
            `;
        }
    }
    
    updateOverallBest() {
        let bestSignal = null;
        let highestConfidence = 0;
        
        for (const signal of this.activeSignals.values()) {
            if (signal.signal.confidence > highestConfidence) {
                highestConfidence = signal.signal.confidence;
                bestSignal = signal;
            }
        }
        
        if (bestSignal) {
            const bestEl = document.getElementById('bestMarket');
            bestEl.innerHTML = `
                <span class="quantum-indicator"></span>
                👑 ${bestSignal.optionType} on ${bestSignal.sensorName} (${bestSignal.signal.confidence}%) - ${bestSignal.signal.duration}s
            `;
        }
    }
    
    updateSensorCounts() {
        // Count total sensors
        let total = 0;
        this.optionTypes.forEach(option => {
            total += option.sensors.length;
        });
    }
    
    setupEventListeners() {
        document.getElementById('menuButton')?.addEventListener('click', () => {
            document.getElementById('socialContainer').classList.toggle('hidden');
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
                this.speak('Sensors activated');
            }
        });
        
        document.querySelectorAll('.social-item').forEach(item => {
            item.addEventListener('click', () => {
                const social = item.dataset.social;
                window.open(`https://${social}.com`, '_blank');
            });
        });
        
        document.querySelector('.d-no')?.addEventListener('dblclick', () => {
            this.runDiagnostic();
        });
    }
    
    runDiagnostic() {
        this.speak('Running sensor diagnostic');
        document.getElementById('bestMarket').innerHTML = `
            <span class="quantum-indicator"></span>
            🔍 DIAGNOSTIC: ${Object.keys(this.sensorData).length} sensors active
        `;
        
        setTimeout(() => {
            this.updateOverallBest();
        }, 2000);
    }
    
    initVoice() {
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.voices = window.speechSynthesis.getVoices();
            };
        }
    }
    
    speak(message) {
        if (this.isMuted || !window.speechSynthesis) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Sensor: ${message}`);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.voice = this.voices?.find(v => v.name.includes('Google') || v.name.includes('Samantha'));
        window.speechSynthesis.speak(utterance);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quantumSensor = new ZionQuantumSensor();
});
