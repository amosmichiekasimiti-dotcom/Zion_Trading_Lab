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
            --gradient: linear-gradient(135deg, #00ff88 0%, #6c63ff 100%);
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

        /* Header */
        .header {
            background: rgba(10, 14, 23, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 2px solid var(--primary);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 4px 30px rgba(0, 255, 136, 0.1);
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
            background: var(--gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 2px;
        }

        .version-badge {
            background: var(--primary);
            color: var(--dark-bg);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 1px;
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

        .nav-link:hover, .nav-link.active {
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
            background: var(--gradient);
            color: white;
        }

        .btn-danger {
            background: var(--danger);
            color: white;
        }

        /* Market Scroll Bar */
        .market-scroll-container {
            background: var(--card-bg);
            margin: 20px 2rem;
            border-radius: 12px;
            padding: 15px;
            overflow: hidden;
            position: relative;
        }

        .market-scroll-bar {
            display: flex;
            gap: 15px;
            overflow-x: auto;
            scroll-behavior: smooth;
            padding: 10px;
            scrollbar-width: none;
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
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
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

        /* Main Dashboard */
        .dashboard {
            display: grid;
            grid-template-columns: 3fr 1fr;
            gap: 20px;
            padding: 0 2rem 2rem;
            min-height: calc(100vh - 200px);
        }

        /* Signal Cards */
        .signals-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .signal-card {
            background: var(--card-bg);
            border-radius: 15px;
            padding: 25px;
            border-left: 5px solid var(--primary);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .signal-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
            background: var(--gradient);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.9rem;
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
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        .execute-btn {
            width: 100%;
            padding: 15px;
            background: var(--danger);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.2rem;
            font-weight: 700;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
        }

        .execute-btn:hover {
            background: #ff2e43;
            transform: scale(1.02);
        }

        .execute-btn:disabled {
            background: #666;
            cursor: not-allowed;
            transform: none;
        }

        /* AI Voice Panel */
        .voice-panel {
            background: var(--card-bg);
            border-radius: 15px;
            padding: 25px;
            border: 2px solid var(--secondary);
            height: fit-content;
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
            border-radius: 50%;
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
            font-family: 'Roboto', sans-serif;
            font-size: 1rem;
            line-height: 1.5;
            color: var(--text-light);
        }

        .speak-btn {
            width: 100%;
            background: var(--secondary);
            color: white;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .speak-btn:hover {
            background: #5a52ff;
            transform: scale(1.02);
        }

        .speak-btn:disabled {
            background: #666;
            cursor: not-allowed;
            transform: none;
        }

        /* Sidebar */
        .sidebar {
            background: var(--card-bg);
            border-radius: 15px;
            padding: 25px;
            height: fit-content;
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
            width: 100%;
            background: #25D366;
            color: white;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            text-decoration: none;
        }

        .whatsapp-btn:hover {
            background: #128C7E;
            transform: scale(1.02);
        }

        /* Footer */
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
            background: var(--gradient);
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
            transition: color 0.3s ease;
        }

        .footer-link:hover {
            color: var(--primary);
        }

        .copyright {
            color: var(--text-dim);
            font-size: 0.9rem;
            text-align: center;
            margin-top: 1rem;
        }

        /* Responsive */
        @media (max-width: 1200px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                order: -1;
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
    <!-- Header -->
    <header class="header">
        <div class="logo-container">
            <div class="logo">ZION AI</div>
            <div class="version-badge">v3.0.4-PRO</div>
        </div>
        
        <nav>
            <ul class="nav-menu">
                <li><a href="#" class="nav-link active"><i class="fas fa-chart-line"></i> Dashboard</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-robot"></i> Bot Builder</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-bolt"></i> Signals</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-chart-bar"></i> Analysis</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-copy"></i> CopyTrade</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-globe"></i> MultiMarket</a></li>
                <li><a href="#" class="nav-link"><i class="fas fa-cogs"></i> Strategies</a></li>
            </ul>
        </nav>
        
        <div class="header-controls">
            <button class="btn btn-primary" onclick="startTrading()">
                <i class="fas fa-play"></i> Start Trading
            </button>
            <button class="btn btn-danger" onclick="emergencyStop()">
                <i class="fas fa-stop"></i> Emergency Stop
            </button>
        </div>
    </header>

    <!-- Market Scroll Bar -->
    <div class="market-scroll-container">
        <div class="market-scroll-bar" id="marketScroll">
            <!-- Markets will be populated by JavaScript -->
        </div>
    </div>

    <!-- Main Dashboard -->
    <main class="dashboard">
        <!-- Signals Section -->
        <div class="signals-section">
            <!-- Signal Card 1 -->
            <div class="signal-card">
                <div class="signal-header">
                    <div class="signal-type">RISE/FALL</div>
                    <div class="confidence-badge">94%</div>
                </div>
                <div class="signal-details">
                    <div class="signal-metric">
                        <span class="metric-label">Market:</span>
                        <span class="metric-value">Volatility 10 Index</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Direction:</span>
                        <span class="metric-value" style="color: var(--success)">RISE</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Duration:</span>
                        <span class="metric-value">2 minutes</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">MTFA:</span>
                        <span class="metric-value" style="color: var(--success)">Aligned</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Gemini AI:</span>
                        <span class="metric-value" style="color: var(--success)">Confirmed</span>
                    </div>
                </div>
                <div class="countdown-timer">
                    <div class="timer-display" id="timer1">00:10</div>
                    <div style="color: var(--text-dim); font-size: 0.9rem;">XML Bot Sync Countdown</div>
                </div>
                <button class="execute-btn" onclick="executeTrade('rise_fall')" id="executeBtn1">
                    <i class="fas fa-rocket"></i> EXECUTE TRADE
                </button>
            </div>

            <!-- Signal Card 2 -->
            <div class="signal-card">
                <div class="signal-header">
                    <div class="signal-type">EVEN/ODD</div>
                    <div class="confidence-badge">92%</div>
                </div>
                <div class="signal-details">
                    <div class="signal-metric">
                        <span class="metric-label">Market:</span>
                        <span class="metric-value">Volatility 25 (1s) Index</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Prediction:</span>
                        <span class="metric-value" style="color: var(--secondary)">ODD</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Streak:</span>
                        <span class="metric-value">4 Consecutive Evens</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Probability:</span>
                        <span class="metric-value" style="color: var(--success)">92.3%</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Payout:</span>
                        <span class="metric-value" style="color: var(--warning)">45%</span>
                    </div>
                </div>
                <div class="countdown-timer">
                    <div class="timer-display" id="timer2">00:08</div>
                    <div style="color: var(--text-dim); font-size: 0.9rem;">XML Bot Sync Countdown</div>
                </div>
                <button class="execute-btn" onclick="executeTrade('even_odd')" id="executeBtn2">
                    <i class="fas fa-rocket"></i> EXECUTE TRADE
                </button>
            </div>

            <!-- Signal Card 3 -->
            <div class="signal-card">
                <div class="signal-header">
                    <div class="signal-type">OVER/UNDER</div>
                    <div class="confidence-badge">91%</div>
                </div>
                <div class="signal-details">
                    <div class="signal-metric">
                        <span class="metric-label">Market:</span>
                        <span class="metric-value">Volatility 50 Index</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Barrier:</span>
                        <span class="metric-value" style="color: var(--danger)">Under 3/4</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Expected Payout:</span>
                        <span class="metric-value" style="color: var(--warning)">42%</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Digit Gravity:</span>
                        <span class="metric-value" style="color: var(--success)">High Cluster 5-9</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Gemini AI:</span>
                        <span class="metric-value" style="color: var(--success)">Validated</span>
                    </div>
                </div>
                <div class="countdown-timer">
                    <div class="timer-display" id="timer3">00:15</div>
                    <div style="color: var(--text-dim); font-size: 0.9rem;">XML Bot Sync Countdown</div>
                </div>
                <button class="execute-btn" onclick="executeTrade('over_under')" id="executeBtn3">
                    <i class="fas fa-rocket"></i> EXECUTE TRADE
                </button>
            </div>

            <!-- Signal Card 4 (Scanning) -->
            <div class="signal-card">
                <div class="signal-header">
                    <div class="signal-type">MATCHES/DIFFERS</div>
                    <div class="confidence-badge">SCANNING</div>
                </div>
                <div class="signal-details">
                    <div class="signal-metric">
                        <span class="metric-label">Status:</span>
                        <span class="metric-value" style="color: var(--warning)">Scanning MTFA...</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Market:</span>
                        <span class="metric-value">Volatility 75 (1s) Index</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Cold Digits:</span>
                        <span class="metric-value">Analyzing...</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Frequency:</span>
                        <span class="metric-value">Processing...</span>
                    </div>
                    <div class="signal-metric">
                        <span class="metric-label">Confidence:</span>
                        <span class="metric-value" style="color: var(--warning)">Calculating...</span>
                    </div>
                </div>
                <div class="countdown-timer">
                    <div class="timer-display" style="color: var(--warning); font-size: 2rem;">
                        <i class="fas fa-sync fa-spin"></i>
                    </div>
                    <div style="color: var(--text-dim); font-size: 0.9rem;">AI Analysis in Progress</div>
                </div>
                <button class="execute-btn" disabled>
                    <i class="fas fa-hourglass-half"></i> AWAITING SIGNAL
                </button>
            </div>
        </div>

        <!-- Sidebar with Credentials & Voice Panel -->
        <div class="sidebar-section">
            <!-- AI Voice Broadcast Panel -->
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
                        <span style="font-size: 0.9rem; color: var(--text-dim);">Voice ON</span>
                    </div>
                </div>
                <div class="voice-message-box" id="voiceMessage">
                    Signal validated for Volatility 10 Index. Rise contract, 2 minute duration. Confidence 94%. MTFA aligned. Prepare XML bot for execution in 10 seconds...
                </div>
                <button class="speak-btn" onclick="speakMessage()" id="speakBtn">
                    <i class="fas fa-volume-up"></i> SPEAK MESSAGE
                </button>
            </div>

            <!-- Credentials Panel -->
            <div class="sidebar">
                <div class="sidebar-title">
                    <i class="fas fa-key"></i> SECURE CREDENTIALS
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">APP ID</div>
                    <div class="credential-value">124918</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">REAL TOKEN</div>
                    <div class="credential-value">m04oxPdV6cV6pX4</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">DEMO TOKEN</div>
                    <div class="credential-value">kTYefK9bFG3UPGh</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">GEMINI API KEY</div>
                    <div class="credential-value">AIzaSyDM7cKxbQwbwBXOubb01Iel2WrFi8oEh2E</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-label">VERSION</div>
                    <div class="credential-value">3.0.4-PRO</div>
                </div>
                
                <a href="https://wa.me/254742024175" target="_blank" class="whatsapp-btn">
                    <i class="fab fa-whatsapp"></i> WHATSAPP SUPPORT
                </a>
            </div>
        </div>
    </main>

    <!-- Footer -->
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
            © 2024 ZION AI Ultimate Terminal. All rights reserved. | Version 3.0.4-PRO | For authorized use only.
        </div>
    </footer>

    <script>
        // Market Data
        const markets = [
            { name: "Volatility 10 (1s) Index", icon: "fas fa-chart-line", active: true },
            { name: "Volatility 10 Index", icon: "fas fa-chart-line", active: true },
            { name: "Volatility 15 (1s) Index", icon: "fas fa-chart-line", active: false },
            { name: "Volatility 25 (1s) Index", icon: "fas fa-chart-line", active: true },
            { name: "Volatility 25 Index", icon: "fas fa-chart-line", active: false },
            { name: "Volatility 30 (1s) Index", icon: "fas fa-chart-line", active: false },
            { name: "Volatility 50 (1s) Index", icon: "fas fa-chart-line", active: true },
            { name: "Volatility 50 Index", icon: "fas fa-chart-line", active: false },
            { name: "Volatility 75 (1s) Index", icon: "fas fa-chart-line", active: false },
            { name: "Volatility 75 Index", icon: "fas fa-chart-line", active: false },
            { name: "Volatility 90 (1s) Index", icon: "fas fa-chart-line", active: false },
            { name: "Volatility 100 (1s) Index", icon: "fas fa-chart-line", active: false },
            { name: "Volatility 100 Index", icon: "fas fa-chart-line", active: false }
        ];

        // Initialize Markets
        function initializeMarkets() {
            const marketScroll = document.getElementById('marketScroll');
            markets.forEach(market => {
                const marketCard = document.createElement('div');
                marketCard.className = `market-card ${market.active ? 'active' : ''}`;
                marketCard.innerHTML = `
                    <div class="market-icon">
                        <i class="${market.icon}"></i>
                    </div>
                    <div class="market-name">${market.name.split(' ')[1]}</div>
                    <div class="market-status">
                        ${market.active ? '<span style="color: var(--success)">● ACTIVE</span>' : '<span style="color: var(--text-dim)">○ INACTIVE</span>'}
                    </div>
                `;
                marketCard.onclick = () => selectMarket(market.name);
                marketScroll.appendChild(marketCard);
            });
        }

        // Select Market
        function selectMarket(marketName) {
            console.log(`Selected market: ${marketName}`);
            // In production, this would update the signals for the selected market
            speakMessage(`Market switched to ${marketName}. Loading signals...`);
        }

        // Countdown Timers
        const timers = {
            timer1: { seconds: 10, interval: null },
            timer2: { seconds: 8, interval: null },
            timer3: { seconds: 15, interval: null }
        };

        function startCountdown(timerId, seconds) {
            const timerElement = document.getElementById(timerId);
            const buttonId = timerId.replace('timer', 'executeBtn');
            const executeBtn = document.getElementById(buttonId);
            
            timers[timerId].seconds = seconds;
            
            timers[timerId].interval = setInterval(() => {
                timers[timerId].seconds--;
                
                if (timers[timerId].seconds <= 0) {
                    clearInterval(timers[timerId].interval);
                    timerElement.textContent = "00:00";
                    timerElement.style.color = "var(--danger)";
                    executeBtn.disabled = true;
                    executeBtn.innerHTML = '<i class="fas fa-clock"></i> EXPIRED';
                    speakMessage("Countdown expired. Signal no longer valid.");
                } else {
                    const minutes = Math.floor(timers[timerId].seconds / 60);
                    const secs = timers[timerId].seconds % 60;
                    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    
                    // Color change warning
                    if (timers[timerId].seconds <= 5) {
                        timerElement.style.color = "var(--warning)";
                        if (timers[timerId].seconds === 5) {
                            speakMessage("5 seconds remaining. Prepare to execute.");
                        }
                    }
                }
            }, 1000);
        }

        // Execute Trade
        function executeTrade(type) {
            const voiceToggle = document.getElementById('voiceToggle');
            
            if (voiceToggle.checked) {
                switch(type) {
                    case 'rise_fall':
                        speakMessage("Executing Rise contract on Volatility 10 Index. 2 minute duration. XML bot synchronized.");
                        break;
                    case 'even_odd':
                        speakMessage("Executing Odd prediction on Volatility 25 1 second Index. Statistical streak analysis confirmed.");
                        break;
                    case 'over_under':
                        speakMessage("Executing Under 3/4 barrier on Volatility 50 Index. 42 percent payout confirmed.");
                        break;
                }
            }
            
            // Simulate trade execution
            alert(`Trade executed: ${type.toUpperCase().replace('_', ' ')}\nXML Bot synchronized successfully!`);
            
            // Reset countdown for demo purposes
            setTimeout(() => {
                startCountdown('timer1', 10);
                startCountdown('timer2', 8);
                startCountdown('timer3', 15);
            }, 2000);
        }

        // Voice Functions
        function speakMessage(customMessage = null) {
            const voiceToggle = document.getElementById('voiceToggle');
            const speakBtn = document.getElementById('speakBtn');
            const voiceMessage = document.getElementById('voiceMessage');
            
            if (!voiceToggle.checked) {
                alert("Voice is turned off. Enable voice in the broadcast panel.");
                return;
            }
            
            const message = customMessage || voiceMessage.textContent;
            
            // Disable button during speech
            speakBtn.disabled = true;
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> SPEAKING...';
            
            // Use Web Speech API
            if ('speechSynthesis' in window) {
                const speech = new SpeechSynthesisUtterance(message);
                speech.rate = 1.2;
                speech.pitch = 1.0;
                speech.volume = 1;
                
                speech.onend = function() {
                    speakBtn.disabled = false;
                    speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> SPEAK MESSAGE';
                };
                
                window.speechSynthesis.speak(speech);
            } else {
                alert("Your browser doesn't support speech synthesis. Please use Chrome or Edge.");
                speakBtn.disabled = false;
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> SPEAK MESSAGE';
            }
        }

        // Start Trading
        function startTrading() {
            if (confirm("Start ZION AI trading engine? This will begin signal generation and execution.")) {
                speakMessage("ZION AI trading engine starting. Initializing Multi Time Frame Analysis. Loading market data. All systems nominal.");
                
                // Start countdowns
                startCountdown('timer1', 10);
                startCountdown('timer2', 8);
                startCountdown('timer3', 15);
                
                // Update UI
                document.querySelector('.btn-primary').innerHTML = '<i class="fas fa-sync fa-spin"></i> TRADING ACTIVE';
                document.querySelector('.btn-primary').style.background = 'var(--success)';
                
                // Simulate market scanning
                setTimeout(() => {
                    const scanningCard = document.querySelectorAll('.signal-card')[3];
                    scanningCard.querySelector('.confidence-badge').textContent = "89%";
                    scanningCard.querySelector('.confidence-badge').style.background = "var(--gradient)";
                    scanningCard.querySelectorAll('.signal-metric')[2].querySelector('.metric-value').textContent = "3, 7 (Cold)";
                    scanningCard.querySelectorAll('.signal-metric')[3].querySelector('.metric-value').textContent = "15 ticks absent";
                    scanningCard.querySelectorAll('.signal-metric')[4].querySelector('.metric-value').textContent = "89%";
                    scanningCard.querySelectorAll('.signal-metric')[4].querySelector('.metric-value').style.color = "var(--success)";
                    scanningCard.querySelector('.timer-display').innerHTML = "00:12";
                    scanningCard.querySelector('.timer-display').style.color = "var(--primary)";
                    scanningCard.querySelector('.execute-btn').disabled = false;
                    scanningCard.querySelector('.execute-btn').innerHTML = '<i class="fas fa-rocket"></i> EXECUTE TRADE';
                    scanningCard.querySelector('.execute-btn').onclick = () => executeTrade('matches_differs');
                }, 3000);
            }
        }

        // Emergency Stop
        function emergencyStop() {
            if (confirm("EMERGENCY STOP: This will halt all trading activity and cancel pending signals. Continue?")) {
                // Stop all countdowns
                Object.keys(timers).forEach(timerId => {
                    if (timers[timerId].interval) {
                        clearInterval(timers[timerId].interval);
                    }
                });
                
                // Disable all execute buttons
                document.querySelectorAll('.execute-btn').forEach(btn => {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-stop"></i> TRADING HALTED';
                });
                
                // Reset UI
                document.querySelector('.btn-primary').innerHTML = '<i class="fas fa-play"></i> START TRADING';
                document.querySelector('.btn-primary').style.background = '';
                
                speakMessage("Emergency stop activated. All trading halted. Signals cancelled. System in safe mode.");
            }
        }

        // Voice Toggle
        document.getElementById('voiceToggle').addEventListener('change', function() {
            const statusText = this.nextElementSibling.nextElementSibling;
            if (this.checked) {
                statusText.textContent = "Voice ON";
                statusText.style.color = "var(--success)";
                speakMessage("Voice broadcast activated. Ready for signal announcements.");
            } else {
                statusText.textContent = "Voice OFF";
                statusText.style.color = "var(--text-dim)";
                // Clear speech queue
                window.speechSynthesis.cancel();
            }
        });

        // Initialize on load
        document.addEventListener('DOMContentLoaded', function() {
            initializeMarkets();
            
            // Auto-start countdowns for demo
            setTimeout(() => {
                startCountdown('timer1', 10);
                startCountdown('timer2', 8);
                startCountdown('timer3', 15);
            }, 1000);
            
            // Welcome message
            setTimeout(() => {
                if (document.getElementById('voiceToggle').checked) {
                    speakMessage("Welcome to ZION AI Ultimate Terminal version 3.0.4 PRO. System initialized. Multi Time Frame Analysis active. Google Gemini AI integrated. Ready for trading.");
                }
            }, 2000);
        });

        // Prevent right-click for security
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            alert("Right-click disabled for security reasons.");
        });

        // Prevent text selection on credentials
        document.querySelectorAll('.credential-value').forEach(el => {
            el.addEventListener('selectstart', function(e) {
                e.preventDefault();
            });
        });
    </script>
</body>
</html>
