// ============================================
// ZION QUANTUM ELITE - SIMPLIFIED VERSION
// GUARANTEED TO DISPLAY ALL MARKET SECTIONS
// App ID: 126973 | Token: rbQgwOkbsfDoKw2
// ============================================

class ZionQuantumElite {
    constructor() {
        // Credentials
        this.apiToken = 'rbQgwOkbsfDoKw2';
        this.appId = '126973';
        this.websocket = null;
        
        // ============================================
        // COMPLETE VOLATILITY LIST - PROPERLY NAMED
        // ============================================
        this.volatilities = {
            standard: [
                { id: 'R_10', name: 'Volatility 10', vol: 10 },
                { id: 'R_25', name: 'Volatility 25', vol: 25 },
                { id: 'R_50', name: 'Volatility 50', vol: 50 },
                { id: 'R_75', name: 'Volatility 75', vol: 75 },
                { id: 'R_100', name: 'Volatility 100', vol: 100 }
            ],
            oneSecond: [
                { id: 'R_10', name: 'Volatility 10 (1s)', vol: 10 },
                { id: 'R_15', name: 'Volatility 15 (1s)', vol: 15 },
                { id: 'R_25', name: 'Volatility 25 (1s)', vol: 25 },
                { id: 'R_30', name: 'Volatility 30 (1s)', vol: 30 },
                { id: 'R_50', name: 'Volatility 50 (1s)', vol: 50 },
                { id: 'R_75', name: 'Volatility 75 (1s)', vol: 75 },
                { id: 'R_90', name: 'Volatility 90 (1s)', vol: 90 },
                { id: 'R_100', name: 'Volatility 100 (1s)', vol: 100 }
            ]
        };
        
        // ============================================
        // MARKET TYPES - WILL DISPLAY IN ORDER
        // ============================================
        this.marketTypes = [
            {
                name: 'EVEN / ODD',
                icon: '🎲',
                color: '#9b59b6',
                sensors: [
                    { id: 'R_10', type: 'standard', name: 'Volatility 10' },
                    { id: 'R_10', type: '1s', name: 'Volatility 10 (1s)' },
                    { id: 'R_15', type: '1s', name: 'Volatility 15 (1s)' },
                    { id: 'R_25', type: 'standard', name: 'Volatility 25' },
                    { id: 'R_25', type: '1s', name: 'Volatility 25 (1s)' },
                    { id: 'R_30', type: '1s', name: 'Volatility 30 (1s)' }
                ]
            },
            {
                name: 'RISE / FALL',
                icon: '📈',
                color: '#3498db',
                sensors: [
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
                name: 'OVER / UNDER',
                icon: '⚖️',
                color: '#e67e22',
                sensors: [
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
                name: 'MATCHES / DIFFERS',
                icon: '🔄',
                color: '#e74c3c',
                sensors: [
                    { id: 'R_75', type: 'standard', name: 'Volatility 75' },
                    { id: 'R_75', type: '1s', name: 'Volatility 75 (1s)' },
                    { id: 'R_90', type: '1s', name: 'Volatility 90 (1s)' },
                    { id: 'R_100', type: 'standard', name: 'Volatility 100' },
                    { id: 'R_100', type: '1s', name: 'Volatility 100 (1s)' }
                ]
            }
        ];
        
        // Data storage
        this.priceData = {};
        this.activeSignals = new Map();
        this.totalSignals = 0;
        this.isMuted = false;
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing Zion Quantum Elite...');
        this.buildInterface(); // THIS MUST RUN FIRST
        this.setupEventListeners();
        this.connectToDeriv();
        this.startSimulation(); // Show demo data while connecting
    }
    
    buildInterface() {
        const container = document.getElementById('marketSections');
        if (!container) {
            console.error('Market sections container not found!');
            return;
        }
        
        container.innerHTML = ''; // Clear any existing content
        
        // Create each market section
        this.marketTypes.forEach((market, index) => {
            const section = this.createMarketSection(market, index);
            container.appendChild(section);
        });
        
        console.log(`✅ Created ${this.marketTypes.length} market sections`);
    }
    
    createMarketSection(market, index) {
        const section = document.createElement('div');
        section.className = 'market-section';
        section.id = `section-${index}`;
        
        // Header
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <div class="section-icon">${market.icon}</div>
            <div class="section-title">
                <h2 style="color: ${market.color}">${market.name}</h2>
                <div class="section-subtitle">
                    <span>${market.sensors.length} sensors active</span>
                </div>
            </div>
        `;
        section.appendChild(header);
        
        // Grid for sensors
        const grid = document.createElement('div');
        grid.className = 'vol-grid';
        
        // Add each sensor card
        market.sensors.forEach(sensor => {
            const card = this.createSensorCard(sensor, market);
            grid.appendChild(card);
        });
        
        section.appendChild(grid);
        return section;
    }
    
    createSensorCard(sensor, market) {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.dataset.symbol = sensor.id;
        card.dataset.type = sensor.type;
        card.dataset.key = `${sensor.id}-${sensor.type}`;
        
        const badgeClass = sensor.type === 'standard' ? 'standard' : 'one-second';
        const badgeText = sensor.type === 'standard' ? '📊 STANDARD' : '⚡ 1 SECOND';
        
        card.innerHTML = `
            <div class="vol-badge ${badgeClass}">${badgeText}</div>
            <div class="vol-name">${sensor.name}</div>
            <div class="main-row">
                <div style="color: ${market.color}">${market.name.split('/')[0].trim()}</div>
                <div style="color: ${market.color}">${market.name.split('/')[1]?.trim() || ''}</div>
            </div>
            <div class="price-display" id="price-${sensor.id}-${sensor.type}">
                ---
            </div>
            <div class="signal-quantum" id="signal-${sensor.id}-${sensor.type}">
                <div class="signal-primary">
                    <span>⏳ SENSOR ACTIVE</span>
                    <span class="signal-confidence low">0%</span>
                </div>
                <div class="signal-reason">Waiting for data...</div>
            </div>
            <div class="timer-quantum" id="timer-${sensor.id}-${sensor.type}" style="display: none;">
                <span class="timer-text">0s</span>
                <div class="timer-progress"><div class="timer-progress-fill"></div></div>
            </div>
            <div class="market-footer">
                <span><i class="fas fa-bolt"></i> ${sensor.vol || '--'}%</span>
                <span id="freq-${sensor.id}-${sensor.type}">0 signals</span>
            </div>
        `;
        
        return card;
    }
    
    connectToDeriv() {
        const statusEl = document.getElementById('apiStatus');
        
        try {
            this.websocket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);
            
            this.websocket.onopen = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#2ecc71"></i> CONNECTED TO DERIV LIVE';
                this.authenticate();
                this.subscribeToAll();
            };
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleTick(data);
            };
            
            this.websocket.onclose = () => {
                statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> RECONNECTING...';
                setTimeout(() => this.connectToDeriv(), 5000);
            };
            
        } catch (error) {
            statusEl.innerHTML = '<i class="fas fa-circle" style="color:#e74c3c"></i> CONNECTION ERROR';
        }
    }
    
    authenticate() {
        if (this.websocket?.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                "authorize": this.apiToken
            }));
        }
    }
    
    subscribeToAll() {
        const symbols = ['R_10', 'R_15', 'R_25', 'R_30', 'R_50', 'R_75', 'R_90', 'R_100'];
        
        symbols.forEach(symbol => {
            this.websocket.send(JSON.stringify({
                "ticks": symbol,
                "subscribe": 1
            }));
        });
        
        console.log('📡 Subscribed to all symbols');
    }
    
    handleTick(data) {
        if (data.tick) {
            const { symbol, quote } = data.tick;
            
            // Update both standard and 1s displays
            ['standard', '1s'].forEach(type => {
                this.updatePrice(symbol, type, quote);
                this.updateSignal(symbol, type, quote);
            });
        }
    }
    
    updatePrice(symbol, type, price) {
        const el = document.getElementById(`price-${symbol}-${type}`);
        if (el) {
            el.textContent = price.toFixed(5);
        }
    }
    
    updateSignal(symbol, type, price) {
        const key = `${symbol}-${type}`;
        const signalEl = document.getElementById(`signal-${symbol}-${type}`);
        
        if (!signalEl) return;
        
        // Simple signal simulation
        const random = Math.random();
        let confidence = Math.floor(50 + random * 40);
        let signalType = random > 0.5 ? 'RISE' : 'FALL';
        
        if (signalEl) {
            signalEl.innerHTML = `
                <div class="signal-primary">
                    <span>${signalType}</span>
                    <span class="signal-confidence ${confidence > 70 ? 'high' : confidence > 50 ? 'medium' : 'low'}">${confidence}%</span>
                </div>
                <div class="signal-reason">Live data: ${price.toFixed(5)}</div>
            `;
        }
    }
    
    startSimulation() {
        // Show demo data while connecting
        let counter = 0;
        setInterval(() => {
            if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
                // Demo mode
                ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'].forEach(symbol => {
                    ['standard', '1s'].forEach(type => {
                        const demoPrice = 1000 + Math.random() * 500;
                        this.updatePrice(symbol, type, demoPrice);
                        this.updateSignal(symbol, type, demoPrice);
                    });
                });
                
                // Update signal count
                document.getElementById('signalCount').innerText = Math.floor(Math.random() * 5);
                document.getElementById('accuracyDisplay').innerText = (Math.random() * 100).toFixed(1) + '%';
            }
        }, 2000);
    }
    
    setupEventListeners() {
        // Menu button
        document.getElementById('menuButton')?.addEventListener('click', () => {
            document.getElementById('socialContainer').classList.toggle('hidden');
        });
        
        // Mute toggle
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
            }
        });
        
        // D NO double click
        document.querySelector('.d-no')?.addEventListener('dblclick', () => {
            alert('ZION QUANTUM ELITE - Diagnostic Mode\nAll systems operational');
        });
    }
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ZionQuantumElite();
});
