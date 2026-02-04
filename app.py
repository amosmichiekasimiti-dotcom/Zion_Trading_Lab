from flask import Flask, render_template_string, jsonify, request
import os
import json
from datetime import datetime
import random

app = Flask(__name__)

# ZION AI Configuration
MY_APP_ID = "124918"
REAL_TOKEN = "m04oxPdV6cV6pX4"
DEMO_TOKEN = "kTYefK9bFG3UPGh"
GEMINI_KEY = "AIzaSyDM7cKxbQwbbWX0ubb01Iel2wrFi8oEh2E"
WHATSAPP_LINK = "https://wa.me/254742024175"

# Trading Configuration
TRADING_CONFIG = {
    "stop_loss": 3,
    "take_profit": 2,
    "martingale": False,
    "martingale_multiplier": 2.0,
    "max_martingale": 3,
    "account_type": "demo",
    "stake_amount": 10
}

# Market Groups
MARKET_GROUPS = {
    "rise_fall": [
        {"name": "Volatility 10 (1s) Index", "symbol": "1HZ10V"},
        {"name": "Volatility 10 Index", "symbol": "R_10"},
        {"name": "Volatility 25 (1s) Index", "symbol": "1HZ25V"},
        {"name": "Volatility 25 Index", "symbol": "R_25"},
        {"name": "Volatility 50 (1s) Index", "symbol": "1HZ50V"},
        {"name": "Volatility 50 Index", "symbol": "R_50"},
        {"name": "Volatility 75 (1s) Index", "symbol": "1HZ75V"},
        {"name": "Volatility 75 Index", "symbol": "R_75"},
        {"name": "Volatility 90 (1s) Index", "symbol": "1HZ90V"},
        {"name": "Volatility 100 (1s) Index", "symbol": "1HZ100V"},
        {"name": "Volatility 100 Index", "symbol": "R_100"}
    ],
    "even_odd": [
        {"name": "Volatility 10 (1s) Index", "symbol": "1HZ10V"},
        {"name": "Volatility 25 (1s) Index", "symbol": "1HZ25V"},
        {"name": "Volatility 50 (1s) Index", "symbol": "1HZ50V"},
        {"name": "Volatility 75 (1s) Index", "symbol": "1HZ75V"},
        {"name": "Volatility 90 (1s) Index", "symbol": "1HZ90V"},
        {"name": "Volatility 100 (1s) Index", "symbol": "1HZ100V"}
    ],
    "over_under": [
        {"name": "Volatility 10 Index", "symbol": "R_10"},
        {"name": "Volatility 25 Index", "symbol": "R_25"},
        {"name": "Volatility 50 Index", "symbol": "R_50"},
        {"name": "Volatility 75 Index", "symbol": "R_75"},
        {"name": "Volatility 100 Index", "symbol": "R_100"}
    ],
    "matches_differs": [
        {"name": "Volatility 10 (1s) Index", "symbol": "1HZ10V"},
        {"name": "Volatility 25 (1s) Index", "symbol": "1HZ25V"},
        {"name": "Volatility 50 (1s) Index", "symbol": "1HZ50V"},
        {"name": "Volatility 75 (1s) Index", "symbol": "1HZ75V"}
    ]
}

# Signal detection algorithms
class ZIONSignalProcessor:
    @staticmethod
    def analyze_even_odd(last_20_digits):
        """Analyze for Even/Odd signals"""
        if len(last_20_digits) < 10:
            return None
        
        # Count evens and odds
        evens = [d for d in last_20_digits if d % 2 == 0]
        odds = [d for d in last_20_digits if d % 2 == 1]
        
        even_count = len(evens)
        odd_count = len(odds)
        
        # Check for at least 3 digits with >10%% frequency
        digit_counts = {}
        for digit in last_20_digits:
            digit_counts[digit] = digit_counts.get(digit, 0) + 1
        
        high_freq_digits = [d for d, count in digit_counts.items() if count/len(last_20_digits) >= 0.10]
        
        if len(high_freq_digits) >= 3:
            # Find most and second most appearing digits
            sorted_digits = sorted(digit_counts.items(), key=lambda x: x[1], reverse=True)
            if len(sorted_digits) >= 2:
                most_freq = sorted_digits[0][0]
                second_most = sorted_digits[1][0]
                
                # Check if both are even
                if most_freq % 2 == 0 and second_most % 2 == 0 and even_count < odd_count:
                    return {
                        "signal": "EVEN",
                        "confidence": min(95, 70 + (len(high_freq_digits) * 5)),
                        "reason": f"Most frequent digits {most_freq}, {second_most} are even"
                    }
                # Check if both are odd
                elif most_freq % 2 == 1 and second_most % 2 == 1 and odd_count < even_count:
                    return {
                        "signal": "ODD",
                        "confidence": min(95, 70 + (len(high_freq_digits) * 5)),
                        "reason": f"Most frequent digits {most_freq}, {second_most} are odd"
                    }
        
        return None
    
    @staticmethod
    def analyze_over_under(last_20_digits):
        """Analyze for Over/Under signals"""
        if len(last_20_digits) < 10:
            return None
        
        # Count overs (5-9) and unders (0-4)
        overs = [d for d in last_20_digits if d >= 5]
        unders = [d for d in last_20_digits if d <= 4]
        
        over_count = len(overs)
        under_count = len(unders)
        
        # Check for at least 3 digits with >10%% frequency
        digit_counts = {}
        for digit in last_20_digits:
            digit_counts[digit] = digit_counts.get(digit, 0) + 1
        
        high_freq_digits = [d for d, count in digit_counts.items() if count/len(last_20_digits) >= 0.10]
        
        if len(high_freq_digits) >= 3:
            # Find most and second most appearing digits
            sorted_digits = sorted(digit_counts.items(), key=lambda x: x[1], reverse=True)
            if len(sorted_digits) >= 2:
                most_freq = sorted_digits[0][0]
                second_most = sorted_digits[1][0]
                
                # Check if both are over
                if most_freq >= 5 and second_most >= 5 and over_count < under_count:
                    return {
                        "signal": "OVER",
                        "barrier": "Over 4/5",
                        "confidence": min(92, 65 + (len(high_freq_digits) * 5)),
                        "reason": f"Most frequent digits {most_freq}, {second_most} are high (5-9)"
                    }
                # Check if both are under
                elif most_freq <= 4 and second_most <= 4 and under_count < over_count:
                    return {
                        "signal": "UNDER",
                        "barrier": "Under 5/6",
                        "confidence": min(92, 65 + (len(high_freq_digits) * 5)),
                        "reason": f"Most frequent digits {most_freq}, {second_most} are low (0-4)"
                    }
        
        return None
    
    @staticmethod
    def analyze_rise_fall(prices):
        """Analyze for Rise/Fall signals"""
        if len(prices) < 20:
            return None
        
        recent = prices[-10:]
        previous = prices[-20:-10]
        
        recent_avg = sum(recent) / len(recent)
        previous_avg = sum(previous) / len(previous)
        
        if recent_avg > previous_avg * 1.02:
            return {
                "signal": "RISE",
                "confidence": min(90, 70 + ((recent_avg/previous_avg - 1) * 1000)),
                "reason": f"Price increased by {((recent_avg/previous_avg)-1)*100:.1f}%%"
            }
        elif recent_avg < previous_avg * 0.98:
            return {
                "signal": "FALL",
                "confidence": min(90, 70 + ((1 - recent_avg/previous_avg) * 1000)),
                "reason": f"Price decreased by {((1-recent_avg/previous_avg))*100:.1f}%%"
            }
        
        return None

signal_processor = ZIONSignalProcessor()

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/config', methods=['GET', 'POST'])
def config():
    global TRADING_CONFIG
    if request.method == 'POST':
        data = request.json
        TRADING_CONFIG.update(data)
        return jsonify({"status": "success", "config": TRADING_CONFIG})
    return jsonify({"status": "success", "config": TRADING_CONFIG})

@app.route('/api/markets')
def markets():
    return jsonify(MARKET_GROUPS)

@app.route('/api/check_signal', methods=['POST'])
def check_signal():
    data = request.json
    signal_type = data.get('type')
    market_data = data.get('data', [])
    
    if signal_type == 'even_odd':
        result = signal_processor.analyze_even_odd(market_data)
    elif signal_type == 'over_under':
        result = signal_processor.analyze_over_under(market_data)
    elif signal_type == 'rise_fall':
        result = signal_processor.analyze_rise_fall(market_data)
    else:
        result = None
    
    return jsonify({"signal": result})

@app.route('/api/execute_trade', methods=['POST'])
def execute_trade():
    data = request.json
    # In production, this would connect to Deriv API
    # For demo, simulate trade execution
    
    trade_data = {
        "status": "success",
        "trade_id": f"TR{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000,9999)}",
        "type": data.get('type'),
        "market": data.get('market'),
        "stake": TRADING_CONFIG['stake_amount'],
        "payout": data.get('payout', 85),
        "timestamp": datetime.now().isoformat()
    }
    
    return jsonify(trade_data)

@app.route('/api/balance')
def balance():
    # Simulate balance check
    balances = {
        "demo": {"currency": "USD", "balance": 10000.50},
        "real": {"currency": "USD", "balance": 2500.75}
    }
    return jsonify(balances[TRADING_CONFIG['account_type']])

@app.route('/health')
def health():
    return "ZION AI Terminal v3.0.4 - Running"

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>ZION AI Ultimate Terminal | PRO v3.0.4</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        /* RESET AND BASE */
        html {
            font-size: 16px;
            -webkit-text-size-adjust: 100%%;
            -ms-text-size-adjust: 100%%;
            text-size-adjust: 100%%;
            overflow-x: hidden;
            height: 100%%;
        }
        
        body {
            font-family: 'Roboto', sans-serif;
            background: #0a0e17;
            color: #ffffff;
            min-height: 100vh;
            width: 100vw;
            overflow-x: hidden;
            position: relative;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        /* Disable zoom on mobile */
        input, textarea, select, button {
            font-size: 16px;
        }
        
        /* MAIN CONTAINER */
        .app-container {
            width: 100%%;
            max-width: 100%%;
            overflow-x: hidden;
            position: relative;
        }
        
        /* HEADER */
        .header {
            background: rgba(10, 14, 23, 0.98);
            border-bottom: 2px solid #00ff88;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.8rem;
            font-weight: 900;
            background: linear-gradient(135deg, #00ff88 0%%, #6c63ff 100%%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            white-space: nowrap;
        }
        
        .version-badge {
            background: #00ff88;
            color: #0a0e17;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            white-space: nowrap;
        }
        
        /* ACCOUNT SWITCHER */
        .account-switcher {
            display: flex;
            gap: 8px;
            background: #1a1f2e;
            padding: 6px;
            border-radius: 8px;
        }
        
        .account-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            background: transparent;
            color: #8a94a6;
        }
        
        .account-btn.active {
            background: #00ff88;
            color: #0a0e17;
        }
        
        /* MAIN CONTENT */
        .main-content {
            padding-top: 80px;
            padding-bottom: 80px;
            width: 100%%;
            max-width: 1200px;
            margin: 0 auto;
            padding-left: 16px;
            padding-right: 16px;
        }
        
        /* MARKET GROUPS */
        .market-groups {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .market-group-card {
            background: #1a1f2e;
            border-radius: 15px;
            padding: 20px;
            border-left: 4px solid;
        }
        
        .group-title {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .group-markets {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .market-tag {
            background: #242b3d;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .market-tag:hover {
            background: #2d354a;
        }
        
        .market-tag.active {
            background: #00ff88;
            color: #0a0e17;
            font-weight: 600;
        }
        
        /* TRADING PANEL */
        .trading-panel {
            background: #1a1f2e;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            border: 2px solid #6c63ff;
        }
        
        .panel-title {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: #6c63ff;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .control-group {
            margin-bottom: 20px;
        }
        
        .control-label {
            display: block;
            margin-bottom: 8px;
            color: #8a94a6;
            font-size: 0.9rem;
        }
        
        .control-input {
            width: 100%%;
            padding: 12px;
            background: #242b3d;
            border: 1px solid #2d354a;
            border-radius: 8px;
            color: white;
            font-size: 1rem;
        }
        
        .control-row {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .control-item {
            flex: 1;
        }
        
        /* SIGNAL CARD */
        .signal-card {
            background: #1a1f2e;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            border-left: 5px solid #00ff88;
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
            color: #00ff88;
        }
        
        .confidence-badge {
            background: linear-gradient(135deg, #00ff88 0%%, #6c63ff 100%%);
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
            color: #8a94a6;
        }
        
        .metric-value {
            font-weight: 600;
        }
        
        /* ACTION BUTTONS */
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .action-btn {
            flex: 1;
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
            transition: all 0.3s ease;
        }
        
        .btn-yes {
            background: #00ff88;
            color: #0a0e17;
        }
        
        .btn-no {
            background: #ff4757;
            color: white;
        }
        
        .btn-execute {
            background: #ff4757;
            color: white;
            width: 100%%;
        }
        
        /* LIVE CONNECTION STATUS */
        .connection-status {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1a1f2e;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 2px solid #00ff88;
            z-index: 1000;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%%;
            background: #00ff88;
            animation: pulse 2s infinite;
        }
        
        .balance-display {
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            color: #00ff88;
        }
        
        /* ANIMATIONS */
        @keyframes pulse {
            0%% { opacity: 1; }
            50%% { opacity: 0.5; }
            100%% { opacity: 1; }
        }
        
        /* RESPONSIVE */
        @media (max-width: 768px) {
            .header {
                padding: 10px;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .logo {
                font-size: 1.5rem;
            }
            
            .main-content {
                padding-top: 120px;
                padding-left: 10px;
                padding-right: 10px;
            }
            
            .market-groups {
                grid-template-columns: 1fr;
            }
            
            .control-row {
                flex-direction: column;
            }
            
            .action-buttons {
                flex-direction: column;
            }
        }
        
        /* SCROLL BAR */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #1a1f2e;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #00ff88;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- HEADER -->
        <header class="header">
            <div class="logo-container">
                <div class="logo">ZION AI</div>
                <div class="version-badge">v3.0.4-PRO</div>
            </div>
            
            <div class="account-switcher" id="accountSwitcher">
                <button class="account-btn active" data-account="demo">DEMO</button>
                <button class="account-btn" data-account="real">REAL</button>
            </div>
        </header>
        
        <!-- MAIN CONTENT -->
        <main class="main-content">
            <!-- MARKET GROUPS -->
            <div class="market-groups" id="marketGroups"></div>
            
            <!-- TRADING CONTROL PANEL -->
            <div class="trading-panel">
                <div class="panel-title">
                    <i class="fas fa-sliders-h"></i>
                    TRADING CONTROL PANEL
                </div>
                
                <div class="control-row">
                    <div class="control-item">
                        <label class="control-label">Stop Loss (Consecutive Losses)</label>
                        <input type="number" class="control-input" id="stopLoss" value="3" min="1" max="10">
                    </div>
                    
                    <div class="control-item">
                        <label class="control-label">Take Profit (Consecutive Wins)</label>
                        <input type="number" class="control-input" id="takeProfit" value="2" min="1" max="10">
                    </div>
                </div>
                
                <div class="control-row">
                    <div class="control-item">
                        <label class="control-label">Stake Amount ($)</label>
                        <input type="number" class="control-input" id="stakeAmount" value="10" min="1" max="1000">
                    </div>
                    
                    <div class="control-item">
                        <label class="control-label">Martingale Multiplier</label>
                        <input type="number" class="control-input" id="martingaleMultiplier" value="2.0" min="1.5" max="5.0" step="0.1">
                    </div>
                </div>
                
                <div class="control-group">
                    <label class="control-label">
                        <input type="checkbox" id="enableMartingale"> Enable Martingale Strategy
                    </label>
                </div>
                
                <button class="action-btn btn-execute" onclick="saveConfig()">
                    <i class="fas fa-save"></i> SAVE SETTINGS
                </button>
            </div>
            
            <!-- SIGNAL DETECTION AREA -->
            <div class="signal-card" id="signalArea" style="display: none;">
                <div class="signal-header">
                    <div class="signal-type" id="signalType">SIGNAL DETECTED</div>
                    <div class="confidence-badge" id="signalConfidence">95%%</div>
                </div>
                
                <div class="signal-details" id="signalDetails"></div>
                
                <div class="action-buttons" id="signalActions">
                    <button class="action-btn btn-yes" onclick="confirmSignal()">
                        <i class="fas fa-check"></i> YES, EXECUTE
                    </button>
                    <button class="action-btn btn-no" onclick="ignoreSignal()">
                        <i class="fas fa-times"></i> NO, IGNORE
                    </button>
                </div>
            </div>
            
            <!-- ACTIVE TRADES -->
            <div class="signal-card" id="activeTrades">
                <div class="signal-header">
                    <div class="signal-type">ACTIVE TRADES</div>
                </div>
                <div id="tradesList">
                    <div style="color: #8a94a6; text-align: center; padding: 20px;">
                        No active trades
                    </div>
                </div>
            </div>
        </main>
        
        <!-- CONNECTION STATUS -->
        <footer class="connection-status">
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span>Connected to Deriv</span>
            </div>
            <div class="balance-display" id="balanceDisplay">
                $10,000.50
            </div>
        </footer>
    </div>

    <script>
        // Configuration
        let config = {
            stopLoss: 3,
            takeProfit: 2,
            stakeAmount: 10,
            martingale: false,
            martingaleMultiplier: 2.0,
            accountType: 'demo',
            maxMartingale: 3
        };
        
        let activeTrades = [];
        let currentSignal = null;
        let selectedMarket = null;
        let selectedType = null;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            loadConfig();
            renderMarketGroups();
            updateBalance();
            startSignalScanning();
        });
        
        // Load configuration
        async function loadConfig() {
            try {
                const response = await fetch('/api/config');
                const data = await response.json();
                if (data.status === 'success') {
                    config = data.config;
                    updateConfigUI();
                }
            } catch (error) {
                console.log('Using default config');
            }
        }
        
        function updateConfigUI() {
            document.getElementById('stopLoss').value = config.stopLoss;
            document.getElementById('takeProfit').value = config.takeProfit;
            document.getElementById('stakeAmount').value = config.stakeAmount;
            document.getElementById('martingaleMultiplier').value = config.martingaleMultiplier;
            document.getElementById('enableMartingale').checked = config.martingale;
            
            // Update account switcher
            document.querySelectorAll('.account-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.account === config.accountType) {
                    btn.classList.add('active');
                }
            });
        }
        
        // Save configuration
        async function saveConfig() {
            config.stopLoss = parseInt(document.getElementById('stopLoss').value);
            config.takeProfit = parseInt(document.getElementById('takeProfit').value);
            config.stakeAmount = parseFloat(document.getElementById('stakeAmount').value);
            config.martingaleMultiplier = parseFloat(document.getElementById('martingaleMultiplier').value);
            config.martingale = document.getElementById('enableMartingale').checked;
            
            try {
                const response = await fetch('/api/config', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(config)
                });
                
                const data = await response.json();
                if (data.status === 'success') {
                    alert('Settings saved successfully!');
                }
            } catch (error) {
                alert('Error saving settings');
            }
        }
        
        // Account switching
        document.querySelectorAll('.account-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                config.accountType = this.dataset.account;
                saveConfig();
                updateBalance();
            });
        });
        
        // Render market groups
        async function renderMarketGroups() {
            try {
                const response = await fetch('/api/markets');
                const marketGroups = await response.json();
                const container = document.getElementById('marketGroups');
                
                const groups = [
                    { id: 'rise_fall', name: 'RISE/FALL', color: '#00ff88', icon: 'fa-chart-line' },
                    { id: 'even_odd', name: 'EVEN/ODD', color: '#6c63ff', icon: 'fa-exchange-alt' },
                    { id: 'over_under', name: 'OVER/UNDER', color: '#ff4757', icon: 'fa-balance-scale' },
                    { id: 'matches_differs', name: 'MATCHES/DIFFERS', color: '#ffa502', icon: 'fa-equals' }
                ];
                
                container.innerHTML = groups.map(group => `
                    <div class="market-group-card" style="border-left-color: ${group.color}">
                        <div class="group-title">
                            <i class="fas ${group.icon}"></i>
                            ${group.name}
                        </div>
                        <div class="group-markets" id="${group.id}Markets">
                            ${marketGroups[group.id]?.map(market => `
                                <div class="market-tag" 
                                     data-type="${group.id}" 
                                     data-market="${market.symbol}"
                                     onclick="selectMarket('${group.id}', '${market.symbol}', '${market.name}')">
                                    ${market.name}
                                </div>
                            `).join('') || ''}
                        </div>
                        <button class="action-btn" style="background: ${group.color}" 
                                onclick="scanMarket('${group.id}')">
                            <i class="fas fa-search"></i> SCAN ${group.name}
                        </button>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading markets:', error);
            }
        }
        
        // Select market
        function selectMarket(type, symbol, name) {
            selectedType = type;
            selectedMarket = { symbol, name };
            
            // Update UI
            document.querySelectorAll('.market-tag').forEach(tag => {
                tag.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Auto-scan selected market
            scanMarket(type);
        }
        
        // Scan market for signals
        async function scanMarket(type) {
            if (!selectedMarket) {
                alert('Please select a market first');
                return;
            }
            
            // Generate sample data based on market type
            let sampleData = [];
            if (type === 'even_odd' || type === 'over_under') {
                // Generate 20 random digits (0-9)
                sampleData = Array.from({length: 20}, () => Math.floor(Math.random() * 10));
            } else if (type === 'rise_fall') {
                // Generate price data
                sampleData = Array.from({length: 20}, (_, i) => 100 + Math.random() * 10 + i * 0.1);
            }
            
            try {
                const response = await fetch('/api/check_signal', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        type: type,
                        data: sampleData
                    })
                });
                
                const result = await response.json();
                
                if (result.signal) {
                    showSignal(result.signal, type, selectedMarket.name);
                } else {
                    alert('No strong signal detected for ' + selectedMarket.name);
                }
            } catch (error) {
                console.error('Error scanning market:', error);
            }
        }
        
        // Show detected signal
        function showSignal(signal, type, market) {
            currentSignal = { ...signal, type, market };
            
            const signalArea = document.getElementById('signalArea');
            const detailsDiv = document.getElementById('signalDetails');
            
            document.getElementById('signalType').textContent = 
                `${signal.signal} SIGNAL - ${market}`;
            
            document.getElementById('signalConfidence').textContent = 
                `${signal.confidence}%%`;
            
            detailsDiv.innerHTML = `
                <div class="signal-metric">
                    <span class="metric-label">Market:</span>
                    <span class="metric-value">${market}</span>
                </div>
                <div class="signal-metric">
                    <span class="metric-label">Signal Type:</span>
                    <span class="metric-value">${signal.signal}</span>
                </div>
                <div class="signal-metric">
                    <span class="metric-label">Confidence:</span>
                    <span class="metric-value" style="color: #00ff88">${signal.confidence}%%</span>
                </div>
                ${signal.barrier ? `
                <div class="signal-metric">
                    <span class="metric-label">Barrier:</span>
                    <span class="metric-value">${signal.barrier}</span>
                </div>
                ` : ''}
                <div class="signal-metric">
                    <span class="metric-label">Reason:</span>
                    <span class="metric-value">${signal.reason}</span>
                </div>
            `;
            
            signalArea.style.display = 'block';
            signalArea.scrollIntoView({ behavior: 'smooth' });
            
            // Auto-speak signal
            speakSignal(signal, market);
        }
        
        // Confirm signal and execute trade
        async function confirmSignal() {
            if (!currentSignal) return;
            
            try {
                const response = await fetch('/api/execute_trade', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        type: currentSignal.type,
                        market: currentSignal.market,
                        signal: currentSignal.signal,
                        stake: config.stakeAmount,
                        barrier: currentSignal.barrier || null
                    })
                });
                
                const trade = await response.json();
                
                // Add to active trades
                activeTrades.push({
                    id: trade.trade_id,
                    type: trade.type,
                    market: trade.market,
                    stake: trade.stake,
                    payout: trade.payout,
                    timestamp: trade.timestamp,
                    status: 'pending'
                });
                
                updateTradesList();
                
                alert(`Trade ${trade.trade_id} executed successfully!`);
                document.getElementById('signalArea').style.display = 'none';
                
                // Update balance
                updateBalance();
                
            } catch (error) {
                alert('Error executing trade: ' + error.message);
            }
        }
        
        // Ignore signal
        function ignoreSignal() {
            document.getElementById('signalArea').style.display = 'none';
            currentSignal = null;
        }
        
        // Update trades list
        function updateTradesList() {
            const tradesList = document.getElementById('tradesList');
            
            if (activeTrades.length === 0) {
                tradesList.innerHTML = `
                    <div style="color: #8a94a6; text-align: center; padding: 20px;">
                        No active trades
                    </div>
                `;
                return;
            }
            
            tradesList.innerHTML = activeTrades.map(trade => `
                <div class="signal-metric">
                    <span class="metric-label">${trade.market} (${trade.type})</span>
                    <span class="metric-value">
                        $${trade.stake} → $${(trade.stake * (trade.payout/100)).toFixed(2)}
                        <span style="color: #8a94a6; font-size: 0.9rem; margin-left: 10px;">
                            ${new Date(trade.timestamp).toLocaleTimeString()}
                        </span>
                    </span>
                </div>
            `).join('');
        }
        
        // Update balance
        async function updateBalance() {
            try {
                const response = await fetch('/api/balance');
                const balance = await response.json();
                document.getElementById('balanceDisplay').textContent = 
                    `$${balance.balance.toFixed(2)}`;
            } catch (error) {
                console.error('Error updating balance:', error);
            }
        }
        
        // Start automatic signal scanning
        function startSignalScanning() {
            // Scan every 30 seconds
            setInterval(async () => {
                if (selectedMarket && selectedType) {
                    await scanMarket(selectedType);
                }
            }, 30000);
        }
        
        // Text-to-speech for signals
        function speakSignal(signal, market) {
            if (!('speechSynthesis' in window)) return;
            
            const message = `Signal detected for ${market}. ${signal.signal} with ${signal.confidence} percent confidence. ${signal.reason}. Confirm or ignore?`;
            
            const speech = new SpeechSynthesisUtterance(message);
            speech.rate = 1.2;
            speech.pitch = 1.0;
            speech.volume = 1;
            
            window.speechSynthesis.speak(speech);
        }
    </script>
</body>
</html>
'''

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
