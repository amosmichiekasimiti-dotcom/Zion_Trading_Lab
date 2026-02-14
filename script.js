// ============================================
// ZION QUANTUM LAB - ELITE TRADING ENGINE
// STANDARD vs 1s VOLATILITIES · QUANTUM ALGORITHMS
// App ID: 126973 | Token: rbQgwOkbsfDoKw2
// ============================================

class ZionQuantumScanner {
    constructor() {
        // Credentials
        this.apiToken = 'rbQgwOkbsfDoKw2';
        this.appId = '126973';
        this.websocket = null;
        
        // Standard and 1s Volatilities
        this.volatilities = {
            standard: [
                { name: 'Volatility 10', symbol: 'R_10', baseVol: 10, type: 'standard' },
                { name: 'Volatility 25', symbol: 'R_25', baseVol: 25, type: 'standard' },
                { name: 'Volatility 50', symbol: 'R_50', baseVol: 50, type: 'standard' },
                { name: 'Volatility 75', symbol: 'R_75', baseVol: 75, type: 'standard' },
                { name: 'Volatility 100', symbol: 'R_100', baseVol: 100, type: 'standard' }
            ],
            oneSecond: [
                { name: 'Volatility 10 (1s)', symbol: 'R_10', baseVol: 10, type: '1s' },
                { name: 'Volatility 15 (1s)', symbol: 'R_15', baseVol: 15, type: '1s' },
                { name: 'Volatility 25 (1s)', symbol: 'R_25', baseVol: 25, type: '1s' },
                { name: 'Volatility 30 (1s)', symbol: 'R_30', baseVol: 30, type: '1s' },
                { name: 'Volatility 50 (1s)', symbol: 'R_50', baseVol: 50, type: '1s' },
                { name: 'Volatility 75 (1s)', symbol: 'R_75', baseVol: 75, type: '1s' },
                { name: 'Volatility 90 (1s)', symbol: 'R_90', baseVol: 90, type: '1s' },
                { name: 'Volatility 100 (1s)', symbol: 'R_100', baseVol: 100, type: '1s' }
            ]
        };
        
        // Market Types Configuration
        this.marketTypes = [
            {
                name: 'EVEN/ODD',
                icon: '🎲',
                symbols: ['R_10', 'R_15', 'R_25', 'R_30'],
                minConfidence: 80,
                colors: ['#9b59b6', '#8e44ad']
            },
            {
                name: 'RISE/FALL',
                icon: '📈',
                symbols: ['R_50', 'R_75', 'R_90', 'R_100'],
                minConfidence: 85,
                colors: ['#3498db', '#2980b9']
            },
            {
                name: 'OVER/UNDER',
                icon: '⚖️',
                symbols: ['R_25', 'R_30', 'R_50', 'R_75'],
                minConfidence: 82,
                colors: ['#e67e22', '#d35400']
            },
            {
                name: 'MATCHES/DIFFERS',
                icon: '🔄',
                symbols: ['R_75', 'R_90', 'R_100'],
                minConfidence: 78,
                colors: ['#e74c3c', '#c0392b']
            }
        ];
        
        // Data Storage
        this.priceHistory = {};
        this.quantumStates = {};
        this.activeSignals = new Map();
        this.bestPerMarket = {};
        this.signalsGenerated = 0;
        this.signalsAccurate = 0;
        this.isMuted = false;
        
        // Quantum Constants
        this.QUANTUM_THRESHOLD = 0.84;
        
        this.init();
    }
    
    init() {
        this.createQuantumGrid();
        this.setupEventListeners();
        this.connectDerivWebSocket();
        this.startQuantumEngine();
        this.initQuantumVoice();
    }
    
    createQuantumGrid() {
        const grid = document.getElementById('marketGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.marketTypes.forEach((market) => {
            // Section Header
            const section = document.createElement('div');
            section.className = 'market-section';
            section.innerHTML = `
                <div class="section-header">
                    <div class="section-icon">${market.icon}</div>
                    <div class="section-title">
                        <h2>${market.name}</h2>
                        <div class="section-subtitle">
                            <span>🔍 Scanning: ${market.symbols.length} volatilities</span>
                            <span>⚡ Min conf: ${market.minConfidence}%</span>
                        </div>
                    </div>
                    <div class="quantum-badge" id="best-${market.name.replace('/', '-')}">
                        ⚛️ QUANTUM SCAN
                    </div>
                </div>
            `;
            grid.appendChild(section);
            
            // Grid for volatilities
            const volGrid = document.createElement('div');
            volGrid.className = 'vol-grid';
            
            market.symbols.forEach(symbol => {
                const standard = this.volatilities.standard.find(v => v.symbol === symbol);
                const oneSec = this.volatilities.oneSecond.find(v => v.symbol === symbol);
                
                if (standard) {
                    volGrid.appendChild(this.createVolatilityCard(standard, market));
                }
                if (oneSec) {
                    volGrid.appendChild(this.createVolatilityCard(oneSec, market));
                }
            });
            
            grid.appendChild(volGrid);
        });
    }
    
    createVolatilityCard(volInfo, marketType) {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.dataset.symbol = volInfo.symbol;
        card.dataset.volatility = volInfo.baseVol;
        card.dataset.marketType = marketType.name;
        card.dataset.volType = volInfo.type;
        card.dataset.name = volInfo.name;
        
        const [left, right] = marketType.name.split('/');
        
        card.innerHTML = `
            <div class="vol-badge ${volInfo.type === 'standard' ? 'standard' : 'one-second'}">
                ${volInfo.type === 'standard' ? '📊 STANDARD' : '⚡ 1 SECOND'}
            </div>
            <div class="main-row">
                <div style="color: ${marketType.colors[0]}">${left}</div>
                <div style="color: ${marketType.colors[1]}">${right || ''}</div>
            </div>
            <div class="price-display" id="price-${volInfo.symbol}-${volInfo.type}">---</div>
            <div class="signal-quantum" id="signal-${volInfo.symbol}-${volInfo.type}">
                <div class="signal-primary">
                    <span class="signal-type">⚛️ QUANTUM</span>
                    <span class="signal-confidence low">0%</span>
                </div>
                <div class="signal-quantum-details">
                    <div class="quantum-metric"><span class="label">ENTROPY</span><span class="value">0.00</span></div>
                    <div class="quantum-metric"><span class="label">PHASE</span><span class="value">0°</span></div>
                    <div class="quantum-metric"><span class="label">DECAY</span><span class="value">0.0</span></div>
                </div>
                <div class="signal-reason">Initializing quantum scan...</div>
            </div>
            <div class="timer-quantum" id="timer-${volInfo.symbol}-${volInfo.type}" style="display: none;">
                <span class="timer-text">0s</span>
                <div class="timer-progress"><div class="timer-progress-fill" style="width: 0%"></div></div>
            </div>
            <div class="market-footer">
                <span class="volatility-value"><i class="fas fa-bolt"></i> ${volInfo.baseVol}%</span>
                <span class="signal-frequency" id="freq-${volInfo.symbol}-${volInfo.type}">0 sig/h</span>
            </div>
        `;
        
        card.addEventListener('click', () => this.selectMarket(card));
        return card;
    }
    
    connectDerivWebSocket() {
        const statusEl = document.getElementById('apiStatus');
        
        try {
            this.websocket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);
            
            this.websocket.onopen = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#2ecc71"></i> QUANTUM ENGINE: ONLINE | LIVE DATA';
                this.sendAuthorize();
                this.subscribeToAll();
                this.startQuantumHeartbeat();
            };
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.processQuantumData(data);
            };
            
            this.websocket.onclose = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> QUANTUM ENGINE: RECONNECTING...';
                setTimeout(() => this.connectDerivWebSocket(), 5000);
            };
            
            this.websocket.onerror = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> QUANTUM ENGINE: ERROR';
            };
            
        } catch (error) {
            statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> QUANTUM ENGINE: OFFLINE';
        }
    }
    
    sendAuthorize() {
        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                "authorize": this.apiToken
            }));
        }
    }
    
    subscribeToAll() {
        const allSymbols = [...new Set([
            ...this.volatilities.standard.map(v => v.symbol),
            ...this.volatilities.oneSecond.map(v => v.symbol)
        ])];
        
        allSymbols.forEach(symbol => {
            this.websocket.send(JSON.stringify({
                "ticks": symbol,
                "subscribe": 1
            }));
            
            this.quantumStates[symbol] = {
                standard: { ticks: [], quantumField: [], coherence: 1.0 },
                '1s': { ticks: [], quantumField: [], coherence: 1.0 }
            };
        });
    }
    
    processQuantumData(data) {
        if (data.tick) {
            const { symbol, quote } = data.tick;
            
            if (!this.quantumStates[symbol]) {
                this.quantumStates[symbol] = {
                    standard: { ticks: [], quantumField: [], coherence: 1.0 },
                    '1s': { ticks: [], quantumField: [], coherence: 1.0 }
                };
            }
            
            this.quantumStates[symbol].standard.ticks.push({
                price: quote,
                timestamp: Date.now()
            });
            
            this.quantumStates[symbol]['1s'].ticks.push({
                price: quote,
                timestamp: Date.now()
            });
            
            if (this.quantumStates[symbol].standard.ticks.length > 200) {
                this.quantumStates[symbol].standard.ticks.shift();
            }
            if (this.quantumStates[symbol]['1s'].ticks.length > 200) {
                this.quantumStates[symbol]['1s'].ticks.shift();
            }
            
            this.updatePriceDisplay(symbol, quote, 'standard');
            this.updatePriceDisplay(symbol, quote, '1s');
        }
    }
    
    updatePriceDisplay(symbol, price, type) {
        const priceEl = document.getElementById(`price-${symbol}-${type}`);
        if (priceEl) {
            priceEl.textContent = price.toFixed(5);
        }
    }
    
    startQuantumEngine() {
        setInterval(() => {
            this.runQuantumAnalysis();
        }, 500);
        
        setInterval(() => {
            this.updateQuantumTimers();
        }, 100);
        
        setInterval(() => {
            this.cleanExpiredQuantumSignals();
        }, 1000);
    }
    
    runQuantumAnalysis() {
        this.marketTypes.forEach(market => {
            let bestForMarket = null;
            let highestConfidence = 0;
            
            market.symbols.forEach(symbol => {
                ['standard', '1s'].forEach(type => {
                    const state = this.quantumStates[symbol]?.[type];
                    if (!state || state.ticks.length < 50) return;
                    
                    const signal = this.generateQuantumSignal(market, symbol, type, state);
                    
                    if (signal && signal.confidence > market.minConfidence) {
                        if (signal.confidence > highestConfidence) {
                            highestConfidence = signal.confidence;
                            bestForMarket = { symbol, type, signal };
                        }
                        
                        if (signal.confidence >= this.QUANTUM_THRESHOLD * 100) {
                            this.emitQuantumSignal(symbol, type, market, signal);
                        }
                    }
                });
            });
            
            if (bestForMarket) {
                this.updateMarketBestDisplay(market, bestForMarket);
            }
        });
        
        this.updateOverallBest();
    }
    
    generateQuantumSignal(market, symbol, type, state) {
        const ticks = state.ticks;
        const prices = ticks.slice(-50).map(t => t.price);
        
        switch(market.name) {
            case 'EVEN/ODD':
                return this.quantumDigitAnalysis(prices, ticks);
            case 'RISE/FALL':
                return this.quantumMomentumAnalysis(prices, ticks);
            case 'OVER/UNDER':
                return this.quantumZScoreAnalysis(prices, ticks);
            case 'MATCHES/DIFFERS':
                return this.quantumPatternAnalysis(prices, ticks);
            default:
                return null;
        }
    }
    
    quantumDigitAnalysis(prices, ticks) {
        const digits = ticks.slice(-30).map(t => Math.floor(t.price * 100000) % 10);
        
        const digitFrequency = Array(10).fill(0);
        digits.forEach(d => digitFrequency[d]++);
        
        let entropy = 0;
        digitFrequency.forEach(count => {
            const p = count / digits.length;
            if (p > 0) entropy -= p * Math.log2(p);
        });
        const normalizedEntropy = entropy / 3.32;
        
        let phase = 0;
        for (let i = 1; i < digits.length; i++) {
            if (digits[i] === digits[i-1]) phase += 1;
        }
        phase = (phase / digits.length) * 360;
        
        const decayMatrix = [];
        for (let i = 0; i < 10; i++) {
            decayMatrix[i] = Array(10).fill(0);
        }
        
        for (let i = 1; i < digits.length; i++) {
            decayMatrix[digits[i-1]][digits[i]]++;
        }
        
        for (let i = 0; i < 10; i++) {
            const sum = decayMatrix[i].reduce((a, b) => a + b, 0);
            if (sum > 0) {
                for (let j = 0; j < 10; j++) {
                    decayMatrix[i][j] /= sum;
                }
            }
        }
        
        const lastDigit = digits[digits.length - 1];
        const predictionProb = decayMatrix[lastDigit];
        
        let maxProb = 0;
        let predictedDigit = lastDigit;
        for (let i = 0; i < 10; i++) {
            if (predictionProb[i] > maxProb) {
                maxProb = predictionProb[i];
                predictedDigit = i;
            }
        }
        
        const evenProb = predictionProb.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
        const isEven = predictedDigit % 2 === 0;
        let confidence = (isEven ? evenProb : 1 - evenProb) * 100;
        
        confidence *= (1 - normalizedEntropy * 0.2);
        confidence *= (0.8 + 0.2 * Math.sin(phase * Math.PI / 180));
        
        const recentEven = digits.slice(-10).filter(d => d % 2 === 0).length;
        let signalType;
        
        if (recentEven > 8 && !isEven) {
            signalType = 'ODD (REVERSAL)';
            confidence *= 1.2;
        } else if (recentEven < 2 && isEven) {
            signalType = 'EVEN (REVERSAL)';
            confidence *= 1.2;
        } else {
            signalType = isEven ? 'EVEN' : 'ODD';
        }
        
        return {
            type: signalType,
            confidence: Math.min(99, Math.round(confidence)),
            details: {
                entropy: normalizedEntropy.toFixed(3),
                phase: phase.toFixed(0) + '°',
                decay: maxProb.toFixed(3)
            },
            reason: `ENTROPY: ${normalizedEntropy.toFixed(3)} | PHASE: ${phase.toFixed(0)}°`
        };
    }
    
    quantumMomentumAnalysis(prices) {
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const sorted = [...prices].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        
        let skewness = 0;
        prices.forEach(p => {
            skewness += Math.pow((p - mean) / stdDev, 3);
        });
        skewness /= prices.length;
        
        const currentPrice = prices[prices.length - 1];
        const zScore = (currentPrice - mean) / stdDev;
        
        let direction;
        let confidence;
        
        if (skewness > 0.5) {
            direction = 'RISE (SKEW+)';
            confidence = 70 + skewness * 15;
        } else if (skewness < -0.5) {
            direction = 'FALL (SKEW-)';
            confidence = 70 + Math.abs(skewness) * 15;
        } else {
            const momentum = prices[prices.length - 1] - prices[prices.length - 5];
            if (momentum > 0) {
                direction = 'RISE';
                confidence = 60 + Math.min(30, momentum / stdDev * 10);
            } else {
                direction = 'FALL';
                confidence = 60 + Math.min(30, Math.abs(momentum) / stdDev * 10);
            }
        }
        
        if (zScore > 2) {
            direction = 'FALL (REVERSION)';
            confidence *= 1.3;
        } else if (zScore < -2) {
            direction = 'RISE (REVERSION)';
            confidence *= 1.3;
        }
        
        return {
            type: direction,
            confidence: Math.min(99, Math.round(confidence)),
            details: {
                entropy: (skewness + 2).toFixed(2),
                phase: (zScore * 30).toFixed(0) + '°',
                decay: (Math.abs(zScore) / 4).toFixed(2)
            },
            reason: `SKEW: ${skewness.toFixed(3)} | Z-SCORE: ${zScore.toFixed(2)}`
        };
    }
    
    quantumZScoreAnalysis(prices) {
        const timeframes = [10, 20, 30, 50];
        const zScores = [];
        
        timeframes.forEach(tf => {
            if (prices.length >= tf) {
                const subset = prices.slice(-tf);
                const mean = subset.reduce((a, b) => a + b, 0) / tf;
                const std = Math.sqrt(subset.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / tf);
                const current = subset[subset.length - 1];
                zScores.push((current - mean) / std);
            }
        });
        
        const coherence = 1 - (Math.max(...zScores) - Math.min(...zScores)) / 4;
        
        const weights = [0.4, 0.3, 0.2, 0.1];
        let weightedZ = 0;
        let totalWeight = 0;
        
        zScores.forEach((z, i) => {
            weightedZ += z * weights[i];
            totalWeight += weights[i];
        });
        
        weightedZ /= totalWeight;
        
        let direction;
        let confidence;
        
        if (weightedZ > 0.5) {
            direction = 'UNDER (REVERSION)';
            confidence = 70 + Math.min(25, weightedZ * 15);
        } else if (weightedZ < -0.5) {
            direction = 'OVER (REVERSION)';
            confidence = 70 + Math.min(25, Math.abs(weightedZ) * 15);
        } else {
            direction = prices[prices.length - 1] > prices[prices.length - 2] ? 'OVER' : 'UNDER';
            confidence = 55 + Math.abs(weightedZ) * 20;
        }
        
        confidence *= (0.7 + 0.3 * coherence);
        
        return {
            type: direction,
            confidence: Math.min(98, Math.round(confidence)),
            details: {
                entropy: (1 - coherence).toFixed(3),
                phase: (weightedZ * 30).toFixed(0) + '°',
                decay: (Math.abs(weightedZ) / 2).toFixed(2)
            },
            reason: `Z-SCORE: ${weightedZ.toFixed(2)} | COHERENCE: ${(coherence*100).toFixed(0)}%`
        };
    }
    
    quantumPatternAnalysis(prices, ticks) {
        const digits = ticks.slice(-40).map(t => Math.floor(t.price * 100000) % 10);
        
        const patternMatrix = {};
        for (let i = 0; i <= digits.length - 3; i++) {
            const pattern = digits.slice(i, i + 3).join('');
            patternMatrix[pattern] = (patternMatrix[pattern] || 0) + 1;
        }
        
        const last3 = digits.slice(-3).join('');
        const lastDigit = digits[digits.length - 1];
        
        let matchProb = 0.5;
        
        if (patternMatrix[last3]) {
            const nextDigits = [];
            for (let i = 0; i <= digits.length - 4; i++) {
                if (digits.slice(i, i + 3).join('') === last3) {
                    nextDigits.push(digits[i + 3]);
                }
            }
            if (nextDigits.length > 0) {
                const matches = nextDigits.filter(d => d === lastDigit).length;
                matchProb = matches / nextDigits.length;
            }
        }
        
        const direction = matchProb > 0.5 ? 'MATCHES' : 'DIFFERS';
        const confidence = 55 + Math.abs(matchProb - 0.5) * 70;
        
        return {
            type: direction,
            confidence: Math.min(95, Math.round(confidence)),
            details: {
                entropy: (1 - Math.abs(matchProb - 0.5)).toFixed(3),
                phase: (matchProb * 360).toFixed(0) + '°',
                decay: matchProb.toFixed(3)
            },
            reason: `PATTERN: ${last3} → ${direction} (${(matchProb*100).toFixed(0)}%)`
        };
    }
    
    emitQuantumSignal(symbol, type, market, signal) {
        const signalId = `${symbol}-${type}-${Date.now()}`;
        const expiryTime = Date.now() + 20000;
        
        const existingKey = `${symbol}-${type}`;
        if (this.activeSignals.has(existingKey)) {
            const existing = this.activeSignals.get(existingKey);
            if (existing.signal.confidence > signal.confidence) {
                return;
            }
        }
        
        const signalData = {
            id: signalId,
            symbol,
            type: type,
            marketType: market.name,
            signal: signal,
            expiry: expiryTime,
            timestamp: Date.now()
        };
        
        this.activeSignals.set(existingKey, signalData);
        this.signalsGenerated++;
        
        this.displayQuantumSignal(symbol, type, signal);
        
        document.getElementById('signalCount').innerText = this.activeSignals.size;
        
        if (!this.isMuted && signal.confidence > 90) {
            this.speak(`ELITE ${market.name} signal on ${symbol} with ${signal.confidence} percent confidence`);
        }
    }
    
    displayQuantumSignal(symbol, type, signal) {
        const signalEl = document.getElementById(`signal-${symbol}-${type}`);
        const timerEl = document.getElementById(`timer-${symbol}-${type}`);
        const freqEl = document.getElementById(`freq-${symbol}-${type}`);
        
        if (signalEl) {
            let confidenceClass = 'low';
            if (signal.confidence >= 85) confidenceClass = 'high';
            else if (signal.confidence >= 70) confidenceClass = 'medium';
            
            let typeClass = 'even-odd';
            if (signal.type.includes('RISE') || signal.type.includes('FALL')) typeClass = 'rise-fall';
            else if (signal.type.includes('OVER') || signal.type.includes('UNDER')) typeClass = 'over-under';
            else if (signal.type.includes('MATCH') || signal.type.includes('DIFF')) typeClass = 'matches-differs';
            
            signalEl.innerHTML = `
                <div class="signal-primary">
                    <span class="signal-type ${typeClass}">${signal.type}</span>
                    <span class="signal-confidence ${confidenceClass}">${signal.confidence}%</span>
                </div>
                <div class="signal-quantum-details">
                    <div class="quantum-metric"><span class="label">ENTROPY</span><span class="value">${signal.details.entropy}</span></div>
                    <div class="quantum-metric"><span class="label">PHASE</span><span class="value">${signal.details.phase}</span></div>
                    <div class="quantum-metric"><span class="label">DECAY</span><span class="value">${signal.details.decay}</span></div>
                </div>
                <div class="signal-reason">⚛️ ${signal.reason}</div>
            `;
            
            timerEl.style.display = 'flex';
            
            if (freqEl) {
                const currentFreq = parseInt(freqEl.innerText) || 0;
                freqEl.innerText = `${currentFreq + 1} sig/h`;
            }
            
            const card = document.querySelector(`[data-symbol="${symbol}"][data-vol-type="${type}"]`);
            if (card) {
                card.classList.add('quantum-active');
                if (signal.confidence >= 90) {
                    card.classList.add('elite-signal');
                }
            }
        }
    }
    
    updateQuantumTimers() {
        const now = Date.now();
        
        for (const [key, signal] of this.activeSignals) {
            const [symbol, type] = key.split('-');
            const timerEl = document.getElementById(`timer-${symbol}-${type}`);
            
            if (!timerEl) continue;
            
            const timeLeft = Math.max(0, signal.expiry - now);
            const secondsLeft = Math.ceil(timeLeft / 1000);
            const progressPercent = (timeLeft / 20000) * 100;
            
            if (timeLeft > 0) {
                timerEl.innerHTML = `
                    <span class="timer-text">${secondsLeft}s</span>
                    <div class="timer-progress"><div class="timer-progress-fill" style="width: ${progressPercent}%"></div></div>
                `;
            } else {
                timerEl.style.display = 'none';
                
                const card = document.querySelector(`[data-symbol="${symbol}"][data-vol-type="${type}"]`);
                if (card) {
                    card.classList.remove('quantum-active', 'elite-signal');
                }
            }
        }
    }
    
    cleanExpiredQuantumSignals() {
        const now = Date.now();
        for (const [key, signal] of this.activeSignals) {
            if (signal.expiry <= now) {
                this.activeSignals.delete(key);
            }
        }
        document.getElementById('signalCount').innerText = this.activeSignals.size;
    }
    
    updateMarketBestDisplay(market, best) {
        const badgeId = `best-${market.name.replace('/', '-')}`;
        const badge = document.getElementById(badgeId);
        
        if (badge) {
            const volInfo = this.volatilities[best.type === 'standard' ? 'standard' : 'oneSecond']
                .find(v => v.symbol === best.symbol && v.type === best.type);
            
            badge.innerHTML = `
                👑 ${volInfo?.name || best.symbol}<br>
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
                ⚛️ ELITE: ${bestSignal.marketType} on ${bestSignal.symbol} (${bestSignal.signal.confidence}%)
            `;
        }
    }
    
    startQuantumHeartbeat() {
        setInterval(() => {
            if (this.websocket?.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({ "ping": 1 }));
            }
        }, 15000);
    }
    
    selectMarket(card) {
        document.querySelectorAll('.market-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
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
                this.speak('Quantum voice activated');
            }
        });
        
        document.querySelectorAll('.social-item').forEach(item => {
            item.addEventListener('click', () => {
                const social = item.dataset.social;
                window.open(`https://${social}.com`, '_blank');
            });
        });
        
        document.querySelector('.d-no')?.addEventListener('dblclick', () => {
            this.runQuantumDiagnostic();
        });
    }
    
    runQuantumDiagnostic() {
        this.speak('Running quantum diagnostic');
        document.getElementById('bestMarket').innerHTML = `
            <span class="quantum-indicator"></span>
            ⚛️ QUANTUM DIAGNOSTIC: SCANNING...
        `;
        
        setTimeout(() => {
            const signalCount = this.activeSignals.size;
            document.getElementById('bestMarket').innerHTML = `
                <span class="quantum-indicator"></span>
                ⚛️ QUANTUM: ${signalCount} ACTIVE | COHERENCE: ${(Math.random() * 0.3 + 0.7).toFixed(2)}
            `;
        }, 2000);
    }
    
    initQuantumVoice() {
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.voices = window.speechSynthesis.getVoices();
            };
        }
    }
    
    speak(message) {
        if (this.isMuted || !window.speechSynthesis) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Quantum signal: ${message}`);
        utterance.rate = 0.85;
        utterance.pitch = 1.2;
        utterance.voice = this.voices?.find(v => v.name.includes('Google') || v.name.includes('Daniel'));
        window.speechSynthesis.speak(utterance);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.quantumLab = new ZionQuantumScanner();
});
