from flask import Flask, render_template_string
import os

app = Flask(__name__)

# ZION AI Configuration
MY_APP_ID = "124918"
REAL_TOKEN = "m04oxPdV6cV6pX4"
DEMO_TOKEN = "kTYefK9bFG3UPGh"
GEMINI_KEY = "AIzaSyDM7cKxbQwbbWX0ubb01Iel2wrFi8oEh2E"
WHATSAPP_LINK = "https://wa.me/254742024175"

# HTML Template with CSS and JavaScript
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZION AI Ultimate Terminal | PRO v3.0.4</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #00ff88;
            --primary-dark: #00cc6a;
            --secondary: #6c63ff;
            --dark-bg: #0a0e17;
            --card-bg: #1a1f2e;
            --card-hover: #242b3d;
            --text-light: #ffffff;
            --text-dim: #8a94a6;
            --danger: #ff4757;
            --warning: #ffa502;
            --success: #00ff88;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', sans-serif;
            background: var(--dark-bg);
            color: var(--text-light);
            overflow-x: hidden;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(10, 14, 23, 0.95);
            border-bottom: 2px solid var(--primary);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo {
            font-family: 'Orbitron', sans-serif;
            font-size: 2rem;
            font-weight: 900;
            background: linear-gradient(135deg, #00ff88 0%%, #6c63ff 100%%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .version-badge {
            background: var(--primary);
            color: var(--dark-bg);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
        }
        
        .nav-menu {
            display: flex;
            gap: 2rem;
            list-style: none;
        }
        
        .nav-link {
            color: var(--text-light);
            text-decoration: none;
            font-weight: 500;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .nav-link:hover {
            background: var(--primary);
            color: var(--dark-bg);
        }
        
        .header-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .btn {
            padding: 10px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #00ff88 0%%, #6c63ff 100%%);
            color: white;
        }
        
        .btn-danger {
            background: var(--danger);
            color: white;
        }
        
        .market-scroll-container {
            background: var(--card-bg);
            margin: 20px 2rem;
            border-radius: 12px;
            padding: 15px;
            overflow: hidden;
        }
        
        .market-scroll-bar {
            display: flex;
            gap: 15px;
            overflow-x: auto;
            padding: 10px;
        }
        
        .market-scroll-bar::-webkit-scrollbar {
            display: none;
        }
        
        .market-card {
            min-width: 180px;
            background: var(--dark-bg);
            border-radius: 10px;
            padding: 20px;
            border: 2px solid transparent;
            transition: all 0.3s ease;
            text-align: center;
            cursor: pointer;
            flex-shrink: 0;
        }
        
        .market-card.active {
            border-color: var(--primary);
        }
        
        .market-icon {
            font-size: 2rem;
            margin-bottom: 10px;
            color: var(--primary);
        }
        
        .market-name {
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 5px;
        }
        
        .market-status {
            font-size: 0.9rem;
            color: var(--text-dim);
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: 3fr 1fr;
            gap: 20px;
            padding: 0 2rem 2rem;
        }
        
        .signals-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
        }
        
        .signal-card {
            background: var(--card-bg);
            border-radius: 15px;
            padding: 25px;
            border-left: 5px solid var(--primary);
        }
        
        .signal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .signal-type {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary);
        }
        
        .confidence-badge {
            background: linear-gradient(135deg, #00ff88 0%%, #6c63ff 100%%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 700;
        }
        
        .signal-details {
            margin-bottom: 20px;
        }
        
        .signal-metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .metric-label {
            color: var(--text-dim);
        }
        
        .metric-value {
            font-weight: 600;
        }
        
        .countdown-timer {
            text-align: center;
            margin: 20px 0;
            font-family: 'Orbitron', sans-serif;
        }
        
        .timer-display {
            font-size: 3rem;
            font-weight: 700;
            color: var(--primary);
        }
        
        .execute-btn {
            width: 100%%;
            padding: 15px;
            background: var(--danger);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.2rem;
            font-weight: 700;
            cursor: pointer;
            margin-top: 15px;
        }
        
        .execute-btn:disabled {
            background: #666;
            cursor: not-allowed;
        }
        
        .voice-panel {
            background: var(--card-bg);
            border-radius: 15px;
            padding: 25px;
            border: 2px solid var(--secondary);
        }
        
        .voice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .voice-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--secondary);
        }
        
        .voice-controls {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%%;
        }
        
        input:checked + .toggle-slider {
            background-color: var(--success);
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(30px);
        }
        
        .voice-message-box {
            background: var(--dark-bg);
            padding: 20px;
            border-radius: 10px;
            min-height: 100px;
            margin-bottom: 20px;
            border: 1px solid rgba(108, 99, 255, 0.3);
        }
        
        .speak-btn {
            width: 100%%;
            background: var(--secondary);
            color: white;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .sidebar {
            background: var(--card-bg);
            border-radius: 15px;
            padding: 25px;
        }
        
        .sidebar-title {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--primary);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .credential-item {
            background: var(--dark-bg);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            border-left: 4px solid var(--secondary);
        }
        
        .credential-label {
            font-size: 0.9rem;
            color: var(--text-dim);
            margin-bottom: 5px;
        }
        
        .credential-value {
            font-family: 'Orbitron', monospace;
            font-size: 0.9rem;
            color: var(--primary);
            word-break: break-all;
        }
        
        .whatsapp-btn {
            width: 100%%;
            background: #25D366;
            color: white;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            text-decoration: none;
        }
        
        .footer {
            background: var(--card-bg);
            padding: 2rem;
            margin-top: 2rem;
            border-top: 2px solid var(--primary-dark);
        }
        
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .footer-logo {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, #00ff88 0%%, #6c63ff 100%%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .footer-links {
            display: flex;
            gap: 2rem;
            list-style: none;
        }
        
        .footer-link {
            color: var(--text-dim);
            text-decoration: none;
        }
        
        .copyright {
            color: var(--text-dim);
            font-size: 0.9rem;
            text-align: center;
            margin-top: 1rem;
        }
        
        @media (max-width: 1200px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                gap: 15px;
                padding: 1rem;
            }
            
            .nav-menu {
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
            }
            
            .market-scroll-container {
                margin: 20px 1rem;
            }
            
            .dashboard {
                padding: 0 1rem 1rem;
            }
            
            .signals-section {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo-container">
            <div class="logo">ZION AI</div>
            <div class="version-badge">v3.0.4-PRO</div>
        </div>
        
        <nav>
            <ul class="nav-menu">
                <li><a href="#" class="nav-link"><i class="fas fa-chart-line"></i> Dashboard</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-robot"></i> Bot Builder</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-bolt"></i> Signals</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-chart-bar"></i> Analysis</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-copy"></i> CopyTrade</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-globe"></i> MultiMarket</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-cogs"></i> Strategies</a></li>
            </ul>
        </nav>
        
        <div class="header-controls">
            <button class="btn btn-primary" id="startTradingBtn">
                <i class="fas fa-play"></i> Start Trading
            </button>
            <button class="btn btn-danger" id="emergencyStopBtn">
                <i class="fas fa-stop"></i> Emergency Stop
            </button>
        </div>
    </header>

    <div class="market-scroll-container">
        <div class="market-scroll-bar" id="marketScroll"></div>
    </div>

    <main class="dashboard">
        <div class="signals-section" id="signalsSection"></div>

        <div class="sidebar-section">
            <div class="voice-panel">
                <div class="voice-header">
                    <div class="voice-title">
                        <i class="fas fa-broadcast-tower"></i>
                        AI VOICE BROADCAST
                    </div>
                    <div class="voice-controls">
                        <label class="toggle-switch">
                            <input type="checkbox" id="voiceToggle" checked>
                            <span class="toggle-slider"></span>
                        </label>
                        <span id="voiceStatus">Voice ON</span>
                    </div>
                </div>
                <div class="voice-message-box" id="voiceMessage">
                    Signal validated for Volatility 10 Index. Rise contract, 2 minute duration. Confidence 94%%. MTFA aligned. Prepare XML bot for execution in 10 seconds...
                </div>
                <button class="speak-btn" id="speakBtn">
                    <i class="fas fa-volume-up"></i> SPEAK MESSAGE
                </button>
            </div>

            <div class="sidebar">
                <div class="sidebar-title">
                    <i class="fas fa-key"></i> SECURE CREDENTIALS
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">APP ID</div>
                    <div class="credential-value">''' + MY_APP_ID + '''</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">REAL TOKEN</div>
                    <div class="credential-value">''' + REAL_TOKEN + '''</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">DEMO TOKEN</div>
                    <div class="credential-value">''' + DEMO_TOKEN + '''</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">GEMINI API KEY</div>
                    <div class="credential-value">''' + GEMINI_KEY + '''</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">VERSION</div>
                    <div class="credential-value">3.0.4-PRO</div>
                </div>
                
                <a href="''' + WHATSAPP_LINK + '''" target="_blank" class="whatsapp-btn">
                    <i class="fab fa-whatsapp"></i> WHATSAPP SUPPORT
                </a>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="footer-content">
            <div class="footer-logo">ZION AI TRADING LAB</div>
            <ul class="footer-links">
                <li><a href="#" class="footer-link">Dashboard</a></li>
                <li><a href="#" class="footer-link">CopyTrade</a></li>
                <li><a href="#" class="footer-link">DTrader</a></li>
                <li><a href="#" class="footer-link">MultiMarket</a></li>
                <li><a href="#" class="footer-link">Circles</a></li>
                <li><a href="#" class="footer-link">Strategies</a></li>
            </ul>
        </div>
        <div class="copyright">
            © 2024 ZION AI Ultimate Terminal. All rights reserved.
        </div>
    </footer>

    <script>
        const MARKETS = [
            { name: "Volatility 10 (1s) Index", active: true },
            { name: "Volatility 10 Index", active: true },
            { name: "Volatility 15 (1s) Index", active: false },
            { name: "Volatility 25 (1s) Index", active: true },
            { name: "Volatility 25 Index", active: false },
            { name: "Volatility 30 (1s) Index", active: false },
            { name: "Volatility 50 (1s) Index", active: true },
            { name: "Volatility 50 Index", active: false },
            { name: "Volatility 75 (1s) Index", active: false },
            { name: "Volatility 75 Index", active: false },
            { name: "Volatility 90 (1s) Index", active: false },
            { name: "Volatility 100 (1s) Index", active: false },
            { name: "Volatility 100 Index", active: false }
        ];

        const SIGNALS = [
            {
                id: 1,
                type: "RISE/FALL",
                confidence: 94,
                market: "Volatility 10 Index",
                direction: "RISE",
                duration: "2 minutes",
                mtfa: "Aligned",
                gemini: "Confirmed",
                countdown: 10
            },
            {
                id: 2,
                type: "EVEN/ODD",
                confidence: 92,
                market: "Volatility 25 (1s) Index",
                direction: "ODD",
                streak: "4 Consecutive Evens",
                probability: "92.3%%",
                payout: "45%%",
                countdown: 8
            },
            {
                id: 3,
                type: "OVER/UNDER",
                confidence: 91,
                market: "Volatility 50 Index",
                direction: "Under 3/4",
                payout: "42%%",
                gravity: "High Cluster 5-9",
                gemini: "Validated",
                countdown: 15
            },
            {
                id: 4,
                type: "MATCHES/DIFFERS",
                confidence: "SCANNING",
                market: "Volatility 75 (1s) Index",
                status: "Scanning MTFA...",
                coldDigits: "Analyzing...",
                frequency: "Processing...",
                confidenceVal: "Calculating..."
            }
        ];

        class ZIONTerminal {
            constructor() {
                this.isTrading = false;
                this.voiceEnabled = true;
                this.timers = {};
                this.init();
            }

            init() {
                this.renderMarkets();
                this.renderSignals();
                this.bindEvents();
                this.startDemo();
            }

            renderMarkets() {
                const container = document.getElementById('marketScroll');
                container.innerHTML = MARKETS.map(market => {
                    const name = market.name.split(' ')[1];
                    return `
                        <div class="market-card ${market.active ? 'active' : ''}">
                            <div class="market-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="market-name">${name}</div>
                            <div class="market-status">
                                ${market.active ? '<span style="color: #00ff88">● ACTIVE</span>' : '<span style="color: #8a94a6">○ INACTIVE</span>'}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            renderSignals() {
                const container = document.getElementById('signalsSection');
                container.innerHTML = SIGNALS.map(signal => {
                    if (signal.type === "RISE/FALL") {
                        return `
                            <div class="signal-card">
                                <div class="signal-header">
                                    <div class="signal-type">${signal.type}</div>
                                    <div class="confidence-badge">${signal.confidence}%%</div>
                                </div>
                                <div class="signal-details">
                                    <div class="signal-metric">
                                        <span class="metric-label">Market:</span>
                                        <span class="metric-value">${signal.market}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Direction:</span>
                                        <span class="metric-value" style="color: #00ff88">${signal.direction}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Duration:</span>
                                        <span class="metric-value">${signal.duration}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">MTFA:</span>
                                        <span class="metric-value" style="color: #00ff88">${signal.mtfa}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Gemini AI:</span>
                                        <span class="metric-value" style="color: #00ff88">${signal.gemini}</span>
                                    </div>
                                </div>
                                <div class="countdown-timer">
                                    <div class="timer-display" id="timer1">${this.formatTime(signal.countdown)}</div>
                                    <div style="color: #8a94a6; font-size: 0.9rem;">XML Bot Sync Countdown</div>
                                </div>
                                <button class="execute-btn" onclick="zion.executeTrade(1)" id="executeBtn1">
                                    <i class="fas fa-rocket"></i> EXECUTE TRADE
                                </button>
                            </div>
                        `;
                    } else if (signal.type === "EVEN/ODD") {
                        return `
                            <div class="signal-card">
                                <div class="signal-header">
                                    <div class="signal-type">${signal.type}</div>
                                    <div class="confidence-badge">${signal.confidence}%%</div>
                                </div>
                                <div class="signal-details">
                                    <div class="signal-metric">
                                        <span class="metric-label">Market:</span>
                                        <span class="metric-value">${signal.market}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Prediction:</span>
                                        <span class="metric-value" style="color: #6c63ff">${signal.direction}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Streak:</span>
                                        <span class="metric-value">${signal.streak}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Probability:</span>
                                        <span class="metric-value" style="color: #00ff88">${signal.probability}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Payout:</span>
                                        <span class="metric-value" style="color: #ffa502">${signal.payout}</span>
                                    </div>
                                </div>
                                <div class="countdown-timer">
                                    <div class="timer-display" id="timer2">${this.formatTime(signal.countdown)}</div>
                                    <div style="color: #8a94a6; font-size: 0.9rem;">XML Bot Sync Countdown</div>
                                </div>
                                <button class="execute-btn" onclick="zion.executeTrade(2)" id="executeBtn2">
                                    <i class="fas fa-rocket"></i> EXECUTE TRADE
                                </button>
                            </div>
                        `;
                    } else if (signal.type === "OVER/UNDER") {
                        return `
                            <div class="signal-card">
                                <div class="signal-header">
                                    <div class="signal-type">${signal.type}</div>
                                    <div class="confidence-badge">${signal.confidence}%%</div>
                                </div>
                                <div class="signal-details">
                                    <div class="signal-metric">
                                        <span class="metric-label">Market:</span>
                                        <span class="metric-value">${signal.market}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Barrier:</span>
                                        <span class="metric-value" style="color: #ff4757">${signal.direction}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Expected Payout:</span>
                                        <span class="metric-value" style="color: #ffa502">${signal.payout}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Digit Gravity:</span>
                                        <span class="metric-value" style="color: #00ff88">${signal.gravity}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Gemini AI:</span>
                                        <span class="metric-value" style="color: #00ff88">${signal.gemini}</span>
                                    </div>
                                </div>
                                <div class="countdown-timer">
                                    <div class="timer-display" id="timer3">${this.formatTime(signal.countdown)}</div>
                                    <div style="color: #8a94a6; font-size: 0.9rem;">XML Bot Sync Countdown</div>
                                </div>
                                <button class="execute-btn" onclick="zion.executeTrade(3)" id="executeBtn3">
                                    <i class="fas fa-rocket"></i> EXECUTE TRADE
                                </button>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="signal-card">
                                <div class="signal-header">
                                    <div class="signal-type">${signal.type}</div>
                                    <div class="confidence-badge" style="background: #ffa502">${signal.confidence}</div>
                                </div>
                                <div class="signal-details">
                                    <div class="signal-metric">
                                        <span class="metric-label">Status:</span>
                                        <span class="metric-value" style="color: #ffa502">${signal.status}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Market:</span>
                                        <span class="metric-value">${signal.market}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Cold Digits:</span>
                                        <span class="metric-value">${signal.coldDigits}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Frequency:</span>
                                        <span class="metric-value">${signal.frequency}</span>
                                    </div>
                                    <div class="signal-metric">
                                        <span class="metric-label">Confidence:</span>
                                        <span class="metric-value" style="color: #ffa502">${signal.confidenceVal}</span>
                                    </div>
                                </div>
                                <div class="countdown-timer">
                                    <div class="timer-display" style="color: #ffa502; font-size: 2rem;">
                                        <i class="fas fa-sync fa-spin"></i>
                                    </div>
                                    <div style="color: #8a94a6; font-size: 0.9rem;">AI Analysis in Progress</div>
                                </div>
                                <button class="execute-btn" disabled>
                                    <i class="fas fa-hourglass-half"></i> AWAITING SIGNAL
                                </button>
                            </div>
                        `;
                    }
                }).join('');
            }

            formatTime(seconds) {
                if (!seconds) return "00:00";
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
            }

            startCountdown(signalId, seconds) {
                const timerElement = document.getElementById('timer' + signalId);
                const buttonElement = document.getElementById('executeBtn' + signalId);
                
                if (!timerElement || !buttonElement) return;

                this.timers[signalId] = {
                    seconds: seconds,
                    interval: setInterval(() => {
                        this.timers[signalId].seconds--;
                        
                        if (this.timers[signalId].seconds <= 0) {
                            clearInterval(this.timers[signalId].interval);
                            timerElement.textContent = "00:00";
                            timerElement.style.color = "#ff4757";
                            buttonElement.disabled = true;
                            buttonElement.innerHTML = '<i class="fas fa-clock"></i> EXPIRED';
                        } else {
                            timerElement.textContent = this.formatTime(this.timers[signalId].seconds);
                            
                            if (this.timers[signalId].seconds <= 5) {
                                timerElement.style.color = "#ffa502";
                            }
                        }
                    }, 1000)
                };
            }

            bindEvents() {
                document.getElementById('startTradingBtn').addEventListener('click', () => this.startTrading());
                document.getElementById('emergencyStopBtn').addEventListener('click', () => this.emergencyStop());
                document.getElementById('speakBtn').addEventListener('click', () => this.speak());
                
                document.getElementById('voiceToggle').addEventListener('change', (e) => {
                    this.voiceEnabled = e.target.checked;
                    const status = document.getElementById('voiceStatus');
                    if (this.voiceEnabled) {
                        status.textContent = "Voice ON";
                        status.style.color = "#00ff88";
                    } else {
                        status.textContent = "Voice OFF";
                        status.style.color = "#8a94a6";
                        window.speechSynthesis.cancel();
                    }
                });
            }

            startDemo() {
                setTimeout(() => {
                    this.startCountdown(1, 10);
                    this.startCountdown(2, 8);
                    this.startCountdown(3, 15);
                }, 1000);

                setTimeout(() => {
                    if (this.voiceEnabled) {
                        this.speak("Welcome to ZION AI Ultimate Terminal version 3.0.4 PRO. System initialized.");
                    }
                }, 2000);
            }

            executeTrade(signalId) {
                const signal = SIGNALS.find(s => s.id === signalId);
                if (!signal) return;

                if (this.voiceEnabled) {
                    let message = "";
                    if (signal.type === "RISE/FALL") {
                        message = "Executing " + signal.direction + " contract on " + signal.market;
                    } else if (signal.type === "EVEN/ODD") {
                        message = "Executing " + signal.direction + " prediction on " + signal.market;
                    } else if (signal.type === "OVER/UNDER") {
                        message = "Executing " + signal.direction + " barrier on " + signal.market;
                    }
                    this.speak(message);
                }

                alert("Trade executed: " + signal.type + "\\nMarket: " + signal.market);

                if (this.timers[signalId]) {
                    clearInterval(this.timers[signalId].interval);
                }
                this.startCountdown(signalId, signal.countdown);
            }

            startTrading() {
                if (confirm("Start ZION AI trading engine?")) {
                    if (this.voiceEnabled) {
                        this.speak("ZION AI trading engine starting.");
                    }

                    this.isTrading = true;
                    
                    const startBtn = document.getElementById('startTradingBtn');
                    startBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> TRADING ACTIVE';
                    startBtn.style.background = '#00ff88';
                }
            }

            emergencyStop() {
                if (confirm("EMERGENCY STOP: This will halt all trading activity.")) {
                    Object.values(this.timers).forEach(timer => {
                        if (timer.interval) {
                            clearInterval(timer.interval);
                        }
                    });
                    this.timers = {};

                    document.querySelectorAll('.execute-btn').forEach(btn => {
                        btn.disabled = true;
                        btn.innerHTML = '<i class="fas fa-stop"></i> TRADING HALTED';
                    });

                    const startBtn = document.getElementById('startTradingBtn');
                    startBtn.innerHTML = '<i class="fas fa-play"></i> START TRADING';
                    startBtn.style.background = '';

                    if (this.voiceEnabled) {
                        this.speak("Emergency stop activated.");
                    }
                }
            }

            speak(customMessage) {
                if (!this.voiceEnabled) return;

                const message = customMessage || document.getElementById('voiceMessage').textContent;
                const speakBtn = document.getElementById('speakBtn');

                speakBtn.disabled = true;
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> SPEAKING...';

                if ('speechSynthesis' in window) {
                    const speech = new SpeechSynthesisUtterance(message);
                    speech.rate = 1.2;
                    speech.pitch = 1.0;
                    speech.volume = 1;
                    
                    speech.onend = () => {
                        speakBtn.disabled = false;
                        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> SPEAK MESSAGE';
                    };
                    
                    window.speechSynthesis.speak(speech);
                } else {
                    alert("Your browser doesn't support speech synthesis.");
                    speakBtn.disabled = false;
                    speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> SPEAK MESSAGE';
                }
            }
        }

        const zion = new ZIONTerminal();
        window.zion = zion;
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return HTML_TEMPLATE

@app.route('/health')
def health():
    return "ZION AI Ultimate Terminal v3.0.4-PRO - Running"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
