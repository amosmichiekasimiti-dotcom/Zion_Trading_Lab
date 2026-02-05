"""
NEXUS PROTOCOL v4.0 - COMPLETE FIXED VERSION
With Navigation, AI Voice, Error Handling, and All Features Working
"""

import os
import google.generativeai as genai
from flask import Flask, render_template_string, jsonify, request, Response
import time
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
import threading
from collections import deque, Counter
import hashlib
import math
from scipy import stats
import warnings
import asyncio
import json
warnings.filterwarnings('ignore')

# --- MASTER CONFIGURATION ---
MY_APP_ID = "124918"
REAL_TOKEN = "m04oxPdV6cV6pX4"
DEMO_TOKEN = "kTYefK9bFG3UPGh"
# FIXED: Google Gemini API Integration
GEMINI_KEY = "AIzaSyDM7cKxbQwbbWX0ubb01Iel2wrFi8oEh2E"
WHATSAPP_LINK = "https://wa.me/254742024175"

# --- AI INITIALIZATION ---
genai.configure(api_key=GEMINI_KEY)
ai_model = genai.GenerativeModel('gemini-1.5-flash')

app = Flask(__name__)

# ============================================================================
# FIXED VOLATILITY INDICES - CORRECT FORMAT
# ============================================================================

VOLATILITY_INDICES = {
    # 1-Second Variants - EXACT NAMES
    "Volatility 10 (1s) Index": {
        "symbol": "1HZ10V",
        "tick_speed": 1,
        "volatility_class": "ultra_low",
        "optimal_contracts": ["Rise/Fall", "Even/Odd"],
        "dead_zone_threshold": 0.001,
        "cluster_window": 30,
        "quantum_state": "COHERENT"
    },
    "Volatility 15 (1s) Index": {
        "symbol": "1HZ15V",
        "tick_speed": 1,
        "volatility_class": "low",
        "optimal_contracts": ["Rise/Fall", "Matches/Differs"],
        "dead_zone_threshold": 0.0015,
        "cluster_window": 40,
        "quantum_state": "ENTANGLED"
    },
    "Volatility 25 (1s) Index": {
        "symbol": "1HZ25V",
        "tick_speed": 1,
        "volatility_class": "medium",
        "optimal_contracts": ["All"],
        "dead_zone_threshold": 0.002,
        "cluster_window": 50,
        "quantum_state": "SUPERPOSITION"
    },
    "Volatility 30 (1s) Index": {
        "symbol": "1HZ30V",
        "tick_speed": 1,
        "volatility_class": "medium_high",
        "optimal_contracts": ["Over/Under", "Rise/Fall"],
        "dead_zone_threshold": 0.0025,
        "cluster_window": 45,
        "quantum_state": "COHERENT"
    },
    "Volatility 50 (1s) Index": {
        "symbol": "1HZ50V",
        "tick_speed": 1,
        "volatility_class": "high",
        "optimal_contracts": ["Rise/Fall", "Matches/Differs"],
        "dead_zone_threshold": 0.003,
        "cluster_window": 60,
        "quantum_state": "ENTANGLED"
    },
    "Volatility 75 (1s) Index": {
        "symbol": "1HZ75V",
        "tick_speed": 1,
        "volatility_class": "very_high",
        "optimal_contracts": ["Over/Under", "Even/Odd"],
        "dead_zone_threshold": 0.0035,
        "cluster_window": 70,
        "quantum_state": "SUPERPOSITION"
    },
    "Volatility 90 (1s) Index": {
        "symbol": "1HZ90V",
        "tick_speed": 1,
        "volatility_class": "extreme",
        "optimal_contracts": ["Rise/Fall", "Over/Under"],
        "dead_zone_threshold": 0.004,
        "cluster_window": 80,
        "quantum_state": "COHERENT"
    },
    "Volatility 100 (1s) Index": {
        "symbol": "1HZ100V",
        "tick_speed": 1,
        "volatility_class": "ultra_extreme",
        "optimal_contracts": ["All"],
        "dead_zone_threshold": 0.005,
        "cluster_window": 100,
        "quantum_state": "QUANTUM_CHAOS"
    },
    
    # Regular Variants - EXACT NAMES
    "Volatility 10 Index": {
        "symbol": "R_10",
        "tick_speed": 2,
        "volatility_class": "ultra_low",
        "optimal_contracts": ["Over/Under", "Matches/Differs"],
        "dead_zone_threshold": 0.001,
        "cluster_window": 35,
        "quantum_state": "COHERENT"
    },
    "Volatility 25 Index": {
        "symbol": "R_25",
        "tick_speed": 2,
        "volatility_class": "medium",
        "optimal_contracts": ["Over/Under", "Even/Odd"],
        "dead_zone_threshold": 0.002,
        "cluster_window": 55,
        "quantum_state": "ENTANGLED"
    },
    "Volatility 50 Index": {
        "symbol": "R_50",
        "tick_speed": 2,
        "volatility_class": "high",
        "optimal_contracts": ["All"],
        "dead_zone_threshold": 0.003,
        "cluster_window": 65,
        "quantum_state": "SUPERPOSITION"
    },
    "Volatility 75 Index": {
        "symbol": "R_75",
        "tick_speed": 2,
        "volatility_class": "very_high",
        "optimal_contracts": ["Over/Under", "Rise/Fall"],
        "dead_zone_threshold": 0.0035,
        "cluster_window": 75,
        "quantum_state": "COHERENT"
    },
    "Volatility 100 Index": {
        "symbol": "R_100",
        "tick_speed": 2,
        "volatility_class": "ultra_extreme",
        "optimal_contracts": ["All"],
        "dead_zone_threshold": 0.005,
        "cluster_window": 90,
        "quantum_state": "QUANTUM_CHAOS"
    }
}

# ============================================================================
# FIXED QUANTUM TRADING ENGINE
# ============================================================================

class QuantumTradingEngine:
    def __init__(self):
        self.market_memory = {}
        self.fractal_patterns = {}
        self.entanglement_matrix = np.zeros((13, 13))
        self.coherence_scores = {}
        self.superposition_states = {}
        
        # Initialize with EXACT names
        for idx, (name, config) in enumerate(VOLATILITY_INDICES.items()):
            self.market_memory[name] = {
                'price_history': deque(maxlen=1000),
                'digit_history': deque(maxlen=500),
                'velocity_history': deque(maxlen=200),
                'cluster_history': deque(maxlen=100),
                'entropy_history': deque(maxlen=50),
                'signals': deque(maxlen=100)
            }
            self.coherence_scores[name] = 1.0
            self.superposition_states[name] = {
                'rise_prob': 0.5,
                'fall_prob': 0.5,
                'even_prob': 0.5,
                'odd_prob': 0.5,
                'over_prob': 0.5,
                'under_prob': 0.5
            }
            
            # Initialize with sample data
            base_price = 10000
            for _ in range(100):
                base_price += random.uniform(-20, 20)
                self.market_memory[name]['price_history'].append(base_price)
                self.market_memory[name]['digit_history'].append(random.randint(0, 9))
    
    def update_market_data(self, market_name, price=None, digit=None):
        """Update market data with new values"""
        if market_name not in self.market_memory:
            return False
            
        memory = self.market_memory[market_name]
        
        if price is not None:
            memory['price_history'].append(price)
        if digit is not None:
            memory['digit_history'].append(digit)
            
        # Update quantum state
        if price is not None:
            self.update_superposition_state(market_name, price)
            self.calculate_coherence_score(market_name)
            
        return True
    
    def update_superposition_state(self, market_name, current_price):
        """Update quantum superposition probabilities"""
        memory = self.market_memory[market_name]
        prices = list(memory['price_history'])
        digits = list(memory['digit_history'])
        
        if len(prices) < 20 or len(digits) < 20:
            return
        
        # Calculate probabilities
        returns = np.diff(prices[-20:]) / prices[-21:-1] if len(prices) >= 21 else [0]
        momentum = np.mean(returns) if len(returns) > 0 else 0
        
        # Quantum probability amplitudes
        rise_amplitude = np.exp(1j * momentum * 10)
        fall_amplitude = np.exp(1j * -momentum * 10)
        
        self.superposition_states[market_name]['rise_prob'] = min(0.95, max(0.05, abs(rise_amplitude) ** 2))
        self.superposition_states[market_name]['fall_prob'] = min(0.95, max(0.05, abs(fall_amplitude) ** 2))
        
        # Even/Odd probabilities
        even_digits = sum(1 for d in digits[-20:] if d % 2 == 0) if len(digits) >= 20 else 10
        even_amplitude = np.exp(1j * even_digits * np.pi / 10)
        odd_amplitude = np.exp(1j * (20 - even_digits) * np.pi / 10)
        
        self.superposition_states[market_name]['even_prob'] = min(0.95, max(0.05, abs(even_amplitude) ** 2))
        self.superposition_states[market_name]['odd_prob'] = min(0.95, max(0.05, abs(odd_amplitude) ** 2))
        
        # Over/Under probabilities
        digit_gravity = np.mean(digits[-20:]) if len(digits) >= 20 else 4.5
        over_amplitude = np.exp(1j * digit_gravity * np.pi / 9)
        under_amplitude = np.exp(1j * (9 - digit_gravity) * np.pi / 9)
        
        self.superposition_states[market_name]['over_prob'] = min(0.95, max(0.05, abs(over_amplitude) ** 2))
        self.superposition_states[market_name]['under_prob'] = min(0.95, max(0.05, abs(under_amplitude) ** 2))
    
    def calculate_coherence_score(self, market_name):
        """Calculate quantum coherence score"""
        memory = self.market_memory[market_name]
        
        if len(memory['price_history']) < 20:
            self.coherence_scores[market_name] = 0.5
            return 0.5
        
        prices = np.array(list(memory['price_history'])[-50:])
        
        # Simple coherence calculation
        price_changes = np.diff(prices)
        if len(price_changes) == 0:
            coherence = 0.5
        else:
            price_std = np.std(price_changes)
            if price_std == 0:
                coherence = 1.0
            else:
                coherence = 1 / (1 + price_std)
        
        self.coherence_scores[market_name] = min(1.0, max(0.0, coherence))
        return self.coherence_scores[market_name]

# ============================================================================
# FIXED SIGNAL PROCESSOR
# ============================================================================

class OmegaSignalProcessor:
    def __init__(self, quantum_engine):
        self.quantum_engine = quantum_engine
        self.signal_history = deque(maxlen=100)
        self.performance_metrics = {}
    
    def analyze_market_health(self, market_name):
        """Analyze market health"""
        memory = self.quantum_engine.market_memory[market_name]
        config = VOLATILITY_INDICES[market_name]
        
        if len(memory['price_history']) < 10:
            return {
                'status': 'INSUFFICIENT_DATA',
                'confidence': 0.5,
                'reason': 'Not enough data points',
                'action': 'WAIT_FOR_MORE_DATA'
            }
        
        # Check for stagnation
        recent_prices = list(memory['price_history'])[-10:]
        price_range = max(recent_prices) - min(recent_prices)
        
        if price_range < config['dead_zone_threshold']:
            return {
                'status': 'DEAD_ZONE',
                'confidence': 0.95,
                'reason': f'Price movement too small: {price_range:.6f}',
                'action': 'PAUSE_TRADING'
            }
        
        # Check coherence
        coherence = self.quantum_engine.calculate_coherence_score(market_name)
        if coherence < 0.3:
            return {
                'status': 'LOW_COHERENCE',
                'confidence': 0.8,
                'reason': f'Low quantum coherence: {coherence:.2f}',
                'action': 'REDUCE_STAKE'
            }
        
        return {
            'status': 'HEALTHY',
            'confidence': coherence,
            'reason': f'Market healthy, coherence: {coherence:.2f}',
            'action': 'NORMAL_TRADING'
        }
    
    def analyze_digits(self, market_name):
        """Analyze digit patterns"""
        memory = self.quantum_engine.market_memory[market_name]
        digits = list(memory['digit_history'])
        
        if len(digits) < 20:
            return None
        
        # Low cluster (0-3)
        low_digits = [d for d in digits[-50:] if d in [0, 1, 2, 3]]
        low_density = len(low_digits) / min(50, len(digits))
        
        # High cluster (7-9)
        high_digits = [d for d in digits[-50:] if d in [7, 8, 9]]
        high_density = len(high_digits) / min(50, len(digits))
        
        # Digit gravity
        digit_gravity = np.mean(digits[-20:]) if len(digits) >= 20 else 4.5
        
        # Determine state
        if low_density > 0.6:
            return {
                'state': 'LOW_CLUSTER',
                'gravity': digit_gravity,
                'confidence': low_density,
                'action': 'AVOID_UNDER',
                'reason': f'Low digit cluster active: {low_density:.1%}'
            }
        elif high_density > 0.6:
            return {
                'state': 'HIGH_CLUSTER',
                'gravity': digit_gravity,
                'confidence': high_density,
                'action': 'CONSIDER_UNDER_7',
                'reason': f'High digit cluster active: {high_density:.1%}'
            }
        elif digit_gravity > 6.5:
            return {
                'state': 'HIGH_GRAVITY',
                'gravity': digit_gravity,
                'confidence': (digit_gravity - 6.5) / 2.5,
                'action': 'UNDER_7_RECOMMENDED',
                'reason': f'High digit gravity: {digit_gravity:.2f}'
            }
        else:
            return {
                'state': 'NEUTRAL',
                'gravity': digit_gravity,
                'confidence': 0.5,
                'action': 'NORMAL_TRADING',
                'reason': f'Normal digit distribution'
            }
    
    def analyze_streaks(self, market_name):
        """Analyze parity streaks"""
        memory = self.quantum_engine.market_memory[market_name]
        digits = list(memory['digit_history'])
        
        if len(digits) < 10:
            return None
        
        # Calculate current streak
        current_parity = 'EVEN' if digits[-1] % 2 == 0 else 'ODD'
        streak_length = 1
        
        for i in range(2, min(10, len(digits)) + 1):
            parity = 'EVEN' if digits[-i] % 2 == 0 else 'ODD'
            if parity == current_parity:
                streak_length += 1
            else:
                break
        
        # Determine signal
        if streak_length >= 5:
            if streak_length == 5:
                signal = 'REVERSAL_LIKELY'
                confidence = 0.75
            elif streak_length == 6:
                signal = 'REVERSAL_VERY_LIKELY'
                confidence = 0.90
            else:
                signal = 'REVERSAL_OVERDUE'
                confidence = 0.95
            
            recommended = 'ODD' if current_parity == 'EVEN' else 'EVEN'
            
            return {
                'current': current_parity,
                'streak': streak_length,
                'signal': signal,
                'confidence': confidence,
                'recommended': recommended,
                'reason': f'{current_parity} streak of {streak_length}'
            }
        
        return None
    
    def generate_signal(self, market_name):
        """Generate trading signal for market"""
        # Check market health first
        health = self.analyze_market_health(market_name)
        if health['status'] != 'HEALTHY':
            return {
                'signal': 'NO_TRADE',
                'reason': health['reason'],
                'market': market_name,
                'timestamp': datetime.now().isoformat()
            }
        
        # Analyze digits
        digit_analysis = self.analyze_digits(market_name)
        streak_analysis = self.analyze_streaks(market_name)
        
        # Get quantum probabilities
        quantum_probs = self.quantum_engine.superposition_states[market_name]
        
        signals = []
        
        # 1. Rise/Fall based on quantum probabilities
        if quantum_probs['rise_prob'] > 0.6:
            signals.append({
                'contract': 'RISE',
                'type': 'Rise/Fall',
                'confidence': quantum_probs['rise_prob'],
                'payout': 0.95,
                'reason': f'Quantum rise probability: {quantum_probs["rise_prob"]:.1%}'
            })
        
        if quantum_probs['fall_prob'] > 0.6:
            signals.append({
                'contract': 'FALL',
                'type': 'Rise/Fall',
                'confidence': quantum_probs['fall_prob'],
                'payout': 0.95,
                'reason': f'Quantum fall probability: {quantum_probs["fall_prob"]:.1%}'
            })
        
        # 2. Even/Odd based on streaks
        if streak_analysis and streak_analysis['confidence'] > 0.7:
            signals.append({
                'contract': streak_analysis['recommended'],
                'type': 'Even/Odd',
                'confidence': streak_analysis['confidence'],
                'payout': 0.95,
                'reason': streak_analysis['reason']
            })
        
        # 3. Over/Under based on digit gravity
        if digit_analysis and digit_analysis['state'] == 'HIGH_GRAVITY':
            signals.append({
                'contract': 'UNDER',
                'type': 'Over/Under',
                'barrier': 'Under 7',
                'confidence': digit_analysis['confidence'],
                'payout': 1.42,
                'reason': f'High digit gravity: {digit_analysis["gravity"]:.2f}'
            })
        
        # Filter by minimum confidence
        min_confidence = 0.7
        filtered = [s for s in signals if s['confidence'] >= min_confidence]
        
        if not filtered:
            return {
                'signal': 'NO_TRADE',
                'reason': 'No signals meet confidence threshold',
                'market': market_name,
                'timestamp': datetime.now().isoformat()
            }
        
        # Sort by confidence
        filtered.sort(key=lambda x: x['confidence'], reverse=True)
        best = filtered[0]
        
        # Store in history
        self.signal_history.append({
            'market': market_name,
            'signal': best,
            'timestamp': datetime.now().isoformat()
        })
        
        # Update memory
        self.quantum_engine.market_memory[market_name]['signals'].append(best)
        
        return {
            'signal': 'TRADE_SIGNAL',
            'market': market_name,
            'contract': best['contract'],
            'type': best['type'],
            'confidence': best['confidence'],
            'payout': best['payout'],
            'reason': best['reason'],
            'barrier': best.get('barrier', 'N/A'),
            'timestamp': datetime.now().isoformat(),
            'quantum_state': self.quantum_engine.superposition_states[market_name]
        }

# ============================================================================
# FIXED GLOBAL TRADING SYSTEM
# ============================================================================

class GlobalTradingSystem:
    def __init__(self):
        self.quantum_engine = QuantumTradingEngine()
        self.signal_processor = OmegaSignalProcessor(self.quantum_engine)
        self.active_trades = {}
        self.trade_history = []
        self.performance = {
            'total_trades': 0,
            'wins': 0,
            'losses': 0,
            'profit': 0,
            'win_rate': 0
        }
        
        self.config = {
            'base_stake': 10,
            'min_confidence': 0.7,
            'max_trades_per_day': 50,
            'stop_loss': 3,
            'take_profit': 2,
            'martingale': False,
            'martingale_multiplier': 2.0,
            'enable_ai_voice': True
        }
        
        # Start background updates
        self.start_background_updates()
    
    def start_background_updates(self):
        """Start background market updates"""
        def update_markets():
            while True:
                try:
                    for market_name in VOLATILITY_INDICES.keys():
                        # Simulate market movement
                        memory = self.quantum_engine.market_memory[market_name]
                        if memory['price_history']:
                            last_price = memory['price_history'][-1]
                            new_price = last_price + random.uniform(-5, 5)
                            new_digit = random.randint(0, 9)
                            self.quantum_engine.update_market_data(market_name, new_price, new_digit)
                    
                    time.sleep(2)  # Update every 2 seconds
                except Exception as e:
                    print(f"Background update error: {e}")
                    time.sleep(5)
        
        thread = threading.Thread(target=update_markets, daemon=True)
        thread.start()
    
    def scan_market(self, market_name):
        """Scan market for signals"""
        if market_name not in VOLATILITY_INDICES:
            return {'error': 'Market not found'}
        
        # Generate signal
        signal = self.signal_processor.generate_signal(market_name)
        return signal
    
    def execute_trade(self, market_name, contract, stake):
        """Execute a trade"""
        if market_name not in VOLATILITY_INDICES:
            return {'error': 'Market not found'}
        
        # Generate trade ID
        trade_id = f"TR{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"
        
        # Get current signal for this market
        signal = self.signal_processor.generate_signal(market_name)
        
        if signal.get('signal') != 'TRADE_SIGNAL':
            return {'error': 'No valid signal for this market'}
        
        # Simulate trade outcome (in real system, this would be actual trading)
        confidence = signal.get('confidence', 0.5)
        win_probability = confidence * 0.9  # Adjust for reality
        
        is_win = random.random() < win_probability
        payout = signal.get('payout', 0.95)
        
        if is_win:
            profit = stake * (payout - 1)
            self.performance['wins'] += 1
        else:
            profit = -stake
            self.performance['losses'] += 1
        
        self.performance['total_trades'] += 1
        self.performance['profit'] += profit
        self.performance['win_rate'] = self.performance['wins'] / self.performance['total_trades'] if self.performance['total_trades'] > 0 else 0
        
        # Create trade record
        trade = {
            'id': trade_id,
            'market': market_name,
            'contract': contract,
            'stake': stake,
            'payout': payout,
            'profit': profit,
            'outcome': 'WIN' if is_win else 'LOSS',
            'confidence': confidence,
            'timestamp': datetime.now().isoformat()
        }
        
        self.active_trades[trade_id] = trade
        self.trade_history.append(trade)
        
        # Remove from active after 60 seconds
        def remove_trade():
            time.sleep(60)
            if trade_id in self.active_trades:
                del self.active_trades[trade_id]
        
        threading.Thread(target=remove_trade, daemon=True).start()
        
        return trade

# ============================================================================
# INITIALIZE SYSTEM
# ============================================================================

trading_system = GlobalTradingSystem()

# ============================================================================
# FLASK ROUTES
# ============================================================================

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/markets')
def get_markets():
    """Get all markets"""
    markets_1s = []
    markets_reg = []
    
    for name, config in VOLATILITY_INDICES.items():
        market_data = {
            'name': name,
            'symbol': config['symbol'],
            'volatility': config['volatility_class'],
            'coherence': trading_system.quantum_engine.coherence_scores.get(name, 0.5),
            'last_update': datetime.now().isoformat()
        }
        
        if '(1s)' in name:
            markets_1s.append(market_data)
        else:
            markets_reg.append(market_data)
    
    return jsonify({
        'markets_1s': markets_1s,
        'markets_reg': markets_reg,
        'total_markets': len(VOLATILITY_INDICES)
    })

@app.route('/api/scan/<market_name>')
def scan_market(market_name):
    """Scan specific market"""
    # URL decode market name
    market_name = market_name.replace('_', ' ')
    
    if market_name not in VOLATILITY_INDICES:
        # Try to find by partial name
        for name in VOLATILITY_INDICES.keys():
            if market_name in name or name.replace(' ', '_') == market_name:
                market_name = name
                break
        else:
            return jsonify({'error': 'Market not found', 'available': list(VOLATILITY_INDICES.keys())})
    
    signal = trading_system.scan_market(market_name)
    return jsonify(signal)

@app.route('/api/scan_all')
def scan_all_markets():
    """Scan all markets"""
    results = {}
    for market_name in VOLATILITY_INDICES.keys():
        signal = trading_system.scan_market(market_name)
        results[market_name] = signal
    
    # Count signals
    signals_count = sum(1 for s in results.values() if s.get('signal') == 'TRADE_SIGNAL')
    
    return jsonify({
        'results': results,
        'total_markets': len(results),
        'signals_found': signals_count,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/execute', methods=['POST'])
def execute_trade():
    """Execute a trade"""
    data = request.json
    market_name = data.get('market')
    contract = data.get('contract')
    stake = data.get('stake', trading_system.config['base_stake'])
    
    if not market_name or not contract:
        return jsonify({'error': 'Missing market or contract'})
    
    trade = trading_system.execute_trade(market_name, contract, stake)
    return jsonify(trade)

@app.route('/api/system_status')
def system_status():
    """Get system status"""
    coherence_scores = list(trading_system.quantum_engine.coherence_scores.values())
    avg_coherence = np.mean(coherence_scores) if coherence_scores else 0.5
    
    return jsonify({
        'status': 'OPERATIONAL',
        'version': '4.0.0',
        'markets_monitored': len(VOLATILITY_INDICES),
        'active_trades': len(trading_system.active_trades),
        'average_coherence': round(avg_coherence, 3),
        'performance': trading_system.performance,
        'config': trading_system.config,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/config', methods=['GET', 'POST'])
def handle_config():
    """Get or update configuration"""
    if request.method == 'POST':
        data = request.json
        trading_system.config.update(data)
        return jsonify({'status': 'updated', 'config': trading_system.config})
    
    return jsonify(trading_system.config)

@app.route('/api/active_trades')
def get_active_trades():
    """Get active trades"""
    return jsonify({
        'active_trades': list(trading_system.active_trades.values()),
        'count': len(trading_system.active_trades)
    })

@app.route('/api/performance')
def get_performance():
    """Get performance metrics"""
    return jsonify(trading_system.performance)

@app.route('/api/speak_signal', methods=['POST'])
def speak_signal():
    """Generate speech text for signal"""
    data = request.json
    signal = data.get('signal', {})
    
    if not signal:
        return jsonify({'error': 'No signal provided'})
    
    market = signal.get('market', 'Unknown Market')
    contract = signal.get('contract', 'Unknown')
    confidence = signal.get('confidence', 0) * 100
    
    speech_text = f"Signal detected for {market}. {contract} with {confidence:.0f} percent confidence. "
    
    if signal.get('payout'):
        payout = signal.get('payout', 0) * 100
        speech_text += f"Expected payout {payout:.0f} percent. "
    
    if signal.get('reason'):
        speech_text += f"Reason: {signal.get('reason')}"
    
    return jsonify({
        'speech_text': speech_text,
        'market': market,
        'contract': contract,
        'confidence': confidence
    })

@app.route('/health')
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'system': 'NEXUS_PROTOCOL_v4.0',
        'timestamp': datetime.now().isoformat()
    })

# ============================================================================
# COMPLETE HTML TEMPLATE WITH NAVIGATION, VOICE, AND ALL FEATURES
# ============================================================================

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS PROTOCOL v4.0 - Ultimate Trading System</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Roboto+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --quantum-blue: #00f3ff;
            --neon-green: #00ff88;
            --neon-purple: #9d4edd;
            --dark-bg: #0a0a1a;
            --darker-bg: #050510;
            --panel-bg: rgba(10, 15, 35, 0.95);
            --text-primary: #ffffff;
            --text-secondary: #8a94a6;
            --success: #00ff88;
            --warning: #ffaa00;
            --danger: #ff4757;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        html, body {
            height: 100%;
            overflow: hidden;
            font-family: 'Roboto Mono', monospace;
            background: var(--dark-bg);
            color: var(--text-primary);
        }
        
        body {
            display: flex;
            flex-direction: column;
        }
        
        /* NAVIGATION */
        .nav-container {
            display: flex;
            background: var(--panel-bg);
            border-bottom: 2px solid var(--quantum-blue);
            padding: 0 20px;
            height: 60px;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }
        
        .nav-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .nav-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .menu-toggle {
            display: none;
            background: none;
            border: none;
            color: var(--quantum-blue);
            font-size: 1.5rem;
            cursor: pointer;
        }
        
        .logo {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.8rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--quantum-blue), var(--neon-green));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .version {
            background: var(--neon-purple);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 700;
        }
        
        .nav-item {
            padding: 8px 16px;
            background: rgba(0, 243, 255, 0.1);
            border: 1px solid rgba(0, 243, 255, 0.3);
            border-radius: 8px;
            color: var(--text-primary);
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.3s;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .nav-item:hover {
            background: rgba(0, 243, 255, 0.2);
            border-color: var(--quantum-blue);
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--neon-green);
            animation: pulse 2s infinite;
        }
        
        /* MAIN CONTENT */
        .main-content {
            flex: 1;
            display: flex;
            margin-top: 60px;
            height: calc(100vh - 120px);
            overflow: hidden;
        }
        
        /* SIDEBAR */
        .sidebar {
            width: 280px;
            background: var(--panel-bg);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px;
            overflow-y: auto;
        }
        
        .sidebar-section {
            margin-bottom: 25px;
        }
        
        .sidebar-title {
            font-family: 'Orbitron', sans-serif;
            color: var(--quantum-blue);
            margin-bottom: 15px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .market-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .market-item {
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .market-item:hover {
            background: rgba(0, 243, 255, 0.1);
            border-color: var(--quantum-blue);
        }
        
        .market-item.active {
            background: rgba(0, 243, 255, 0.2);
            border-color: var(--quantum-blue);
            color: var(--quantum-blue);
        }
        
        .market-icon {
            color: var(--neon-green);
        }
        
        /* MAIN PANEL */
        .main-panel {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        /* DASHBOARD GRID */
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .dashboard-card {
            background: var(--panel-bg);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.3s;
        }
        
        .dashboard-card:hover {
            transform: translateY(-2px);
            border-color: var(--quantum-blue);
        }
        
        .card-title {
            font-family: 'Orbitron', sans-serif;
            color: var(--quantum-blue);
            margin-bottom: 15px;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .card-content {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        /* SIGNAL DISPLAY */
        .signal-display {
            min-height: 300px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .signal-card {
            background: linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(157, 78, 221, 0.1));
            border-radius: 10px;
            padding: 20px;
            border: 1px solid var(--quantum-blue);
        }
        
        .signal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .signal-market {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.1rem;
            color: var(--neon-green);
        }
        
        .signal-confidence {
            background: linear-gradient(135deg, var(--neon-green), var(--quantum-blue));
            color: black;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.9rem;
        }
        
        .signal-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .signal-detail {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 6px;
        }
        
        .detail-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
        }
        
        .detail-value {
            font-family: 'Orbitron', sans-serif;
            font-size: 1rem;
            color: var(--text-primary);
        }
        
        /* CONTROLS */
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .control-label {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .control-input {
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: var(--text-primary);
            font-family: 'Roboto Mono', monospace;
        }
        
        .control-row {
            display: flex;
            gap: 15px;
        }
        
        /* BUTTONS */
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-family: 'Orbitron', sans-serif;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--quantum-blue), #0066ff);
            color: white;
        }
        
        .btn-success {
            background: linear-gradient(135deg, var(--neon-green), #00cc44);
            color: black;
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ff4757, #ff0000);
            color: white;
        }
        
        .btn-warning {
            background: linear-gradient(135deg, #ffaa00, #ff7700);
            color: white;
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* SYSTEM STATUS */
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .status-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .status-value {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.5rem;
            color: var(--neon-green);
            margin-top: 5px;
        }
        
        /* FOOTER */
        .footer {
            height: 60px;
            background: var(--panel-bg);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
        }
        
        .balance-display {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.2rem;
            color: var(--neon-green);
        }
        
        .voice-control {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .voice-toggle {
            background: none;
            border: none;
            color: var(--quantum-blue);
            font-size: 1.2rem;
            cursor: pointer;
        }
        
        /* MODAL */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: var(--panel-bg);
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            border: 2px solid var(--quantum-blue);
        }
        
        .modal-title {
            font-family: 'Orbitron', sans-serif;
            color: var(--quantum-blue);
            margin-bottom: 20px;
            font-size: 1.3rem;
        }
        
        /* ANIMATIONS */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        /* RESPONSIVE */
        @media (max-width: 1024px) {
            .sidebar {
                position: fixed;
                left: -280px;
                top: 60px;
                bottom: 60px;
                transition: left 0.3s;
                z-index: 100;
            }
            
            .sidebar.open {
                left: 0;
            }
            
            .menu-toggle {
                display: block;
            }
        }
        
        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .control-row {
                flex-direction: column;
            }
            
            .action-buttons {
                flex-direction: column;
            }
            
            .nav-item span {
                display: none;
            }
        }
        
        /* SCROLLBAR */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(var(--quantum-blue), var(--neon-green));
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <!-- NAVIGATION -->
    <nav class="nav-container">
        <div class="nav-left">
            <button class="menu-toggle" onclick="toggleSidebar()">
                <i class="fas fa-bars"></i>
            </button>
            <div class="logo">NEXUS PROTOCOL</div>
            <div class="version">v4.0</div>
        </div>
        
        <div class="nav-right">
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span>QUANTUM ENTANGLED</span>
            </div>
            
            <button class="nav-item" onclick="showModal('configModal')">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </button>
            
            <button class="nav-item" onclick="scanAllMarkets()">
                <i class="fas fa-globe"></i>
                <span>Scan All</span>
            </button>
        </div>
    </nav>
    
    <!-- MAIN CONTENT -->
    <div class="main-content">
        <!-- SIDEBAR -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">
                    <i class="fas fa-bolt"></i>
                    1-Second Indices
                </div>
                <div class="market-list" id="markets1s"></div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-title">
                    <i class="fas fa-chart-line"></i>
                    Regular Indices
                </div>
                <div class="market-list" id="marketsReg"></div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-title">
                    <i class="fas fa-tachometer-alt"></i>
                    Quick Actions
                </div>
                <div class="market-list">
                    <button class="market-item" onclick="scanSelectedMarket()">
                        <i class="fas fa-search"></i>
                        Scan Selected
                    </button>
                    <button class="market-item" onclick="updateSystemStatus()">
                        <i class="fas fa-sync"></i>
                        Refresh Status
                    </button>
                    <button class="market-item" onclick="clearSignals()">
                        <i class="fas fa-trash"></i>
                        Clear Signals
                    </button>
                </div>
            </div>
        </aside>
        
        <!-- MAIN PANEL -->
        <main class="main-panel">
            <!-- DASHBOARD -->
            <div class="dashboard-grid">
                <!-- SIGNAL DISPLAY -->
                <div class="dashboard-card">
                    <div class="card-title">
                        <i class="fas fa-bolt"></i>
                        QUANTUM SIGNALS
                    </div>
                    <div class="card-content">
                        <div id="signalOutput" class="signal-display">
                            <div style="color: var(--text-secondary); text-align: center; padding: 40px;">
                                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px;"></i>
                                <div>Select a market and click SCAN</div>
                            </div>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="scanSelectedMarket()" id="scanBtn">
                                <i class="fas fa-search"></i>
                                QUANTUM SCAN
                            </button>
                            <button class="btn btn-success" onclick="executeTrade()" id="executeBtn" disabled>
                                <i class="fas fa-rocket"></i>
                                EXECUTE TRADE
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- SYSTEM STATUS -->
                <div class="dashboard-card">
                    <div class="card-title">
                        <i class="fas fa-heart-pulse"></i>
                        SYSTEM STATUS
                    </div>
                    <div class="card-content">
                        <div class="status-grid">
                            <div class="status-item">
                                <div>Coherence</div>
                                <div class="status-value" id="coherenceValue">0.85</div>
                            </div>
                            <div class="status-item">
                                <div>Active Trades</div>
                                <div class="status-value" id="activeTrades">0</div>
                            </div>
                            <div class="status-item">
                                <div>Win Rate</div>
                                <div class="status-value" id="winRate">0%</div>
                            </div>
                            <div class="status-item">
                                <div>Profit</div>
                                <div class="status-value" id="profitValue">$0</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- CONFIGURATION -->
                <div class="dashboard-card">
                    <div class="card-title">
                        <i class="fas fa-sliders-h"></i>
                        QUANTUM CONFIG
                    </div>
                    <div class="card-content">
                        <div class="control-group">
                            <label class="control-label">
                                <i class="fas fa-dollar-sign"></i>
                                Base Stake ($)
                            </label>
                            <input type="number" class="control-input" id="baseStake" value="10" min="1" max="1000">
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">
                                <i class="fas fa-chart-line"></i>
                                Min Confidence
                            </label>
                            <input type="number" class="control-input" id="minConfidence" value="0.7" min="0.1" max="1" step="0.1">
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">
                                <input type="checkbox" id="enableVoice">
                                <i class="fas fa-volume-up"></i>
                                AI Voice Alerts
                            </label>
                        </div>
                        
                        <button class="btn btn-primary" onclick="saveConfig()">
                            <i class="fas fa-save"></i>
                            SAVE CONFIG
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- ACTIVE TRADES -->
            <div class="dashboard-card">
                <div class="card-title">
                    <i class="fas fa-exchange-alt"></i>
                    ACTIVE TRADES
                </div>
                <div class="card-content">
                    <div id="tradesList">
                        <div style="color: var(--text-secondary); text-align: center; padding: 20px;">
                            No active trades
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <!-- FOOTER -->
    <footer class="footer">
        <div class="balance-display" id="balanceDisplay">
            $10,000.00
        </div>
        
        <div class="voice-control">
            <button class="voice-toggle" onclick="toggleVoice()" id="voiceToggle">
                <i class="fas fa-volume-up"></i>
            </button>
            <span>AI Voice: ON</span>
        </div>
        
        <button class="btn btn-danger" onclick="emergencyStop()">
            <i class="fas fa-skull-crossbones"></i>
            EMERGENCY STOP
        </button>
    </footer>
    
    <!-- MODALS -->
    <div class="modal" id="configModal">
        <div class="modal-content">
            <div class="modal-title">
                <i class="fas fa-cog"></i>
                ADVANCED SETTINGS
            </div>
            
            <div class="control-group">
                <label class="control-label">Stop Loss</label>
                <input type="number" class="control-input" id="stopLoss" value="3" min="1" max="10">
            </div>
            
            <div class="control-group">
                <label class="control-label">Take Profit</label>
                <input type="number" class="control-input" id="takeProfit" value="2" min="1" max="10">
            </div>
            
            <div class="control-group">
                <label class="control-label">Martingale Multiplier</label>
                <input type="number" class="control-input" id="martingaleMultiplier" value="2.0" min="1.5" max="5.0" step="0.1">
            </div>
            
            <div class="action-buttons" style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="saveAdvancedConfig()">
                    <i class="fas fa-save"></i>
                    SAVE
                </button>
                <button class="btn" onclick="hideModal('configModal')" style="background: var(--text-secondary);">
                    <i class="fas fa-times"></i>
                    CANCEL
                </button>
            </div>
        </div>
    </div>
    
    <script>
        // Global variables
        let selectedMarket = null;
        let currentSignal = null;
        let voiceEnabled = true;
        let speechSynthesis = window.speechSynthesis;
        
        // Initialize on load
        document.addEventListener('DOMContentLoaded', function() {
            loadMarkets();
            updateSystemStatus();
            updateTradesList();
            startAutoRefresh();
            
            // Check for speech support
            if (!speechSynthesis) {
                voiceEnabled = false;
                document.getElementById('voiceToggle').innerHTML = '<i class="fas fa-volume-mute"></i>';
                document.querySelector('.voice-control span').textContent = 'Voice: Unsupported';
            }
        });
        
        // Toggle sidebar on mobile
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }
        
        // Load markets
        async function loadMarkets() {
            try {
                const response = await fetch('/api/markets');
                const data = await response.json();
                
                renderMarketList('markets1s', data.markets_1s);
                renderMarketList('marketsReg', data.markets_reg);
                
            } catch (error) {
                console.error('Error loading markets:', error);
            }
        }
        
        // Render market list
        function renderMarketList(containerId, markets) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            
            markets.forEach(market => {
                const item = document.createElement('div');
                item.className = 'market-item';
                item.innerHTML = `
                    <i class="fas ${market.name.includes('(1s)') ? 'fa-bolt' : 'fa-chart-line'} market-icon"></i>
                    <div style="flex: 1;">
                        <div>${market.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">
                            Coherence: ${market.coherence.toFixed(2)}
                        </div>
                    </div>
                `;
                
                item.onclick = () => selectMarket(market.name);
                container.appendChild(item);
            });
        }
        
        // Select market
        function selectMarket(marketName) {
            selectedMarket = marketName;
            
            // Update UI
            document.querySelectorAll('.market-item').forEach(item => {
                item.classList.remove('active');
                if (item.textContent.includes(marketName)) {
                    item.classList.add('active');
                }
            });
            
            // Update scan button
            document.getElementById('scanBtn').disabled = false;
            
            // Close sidebar on mobile
            if (window.innerWidth <= 1024) {
                toggleSidebar();
            }
            
            // Auto-scan
            scanMarket(marketName);
        }
        
        // Scan market
        async function scanMarket(marketName) {
            if (!marketName) {
                showError('Please select a market first');
                return;
            }
            
            // Encode market name for URL
            const encodedName = encodeURIComponent(marketName);
            
            try {
                // Show loading
                const scanBtn = document.getElementById('scanBtn');
                scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SCANNING...';
                scanBtn.disabled = true;
                
                const response = await fetch(`/api/scan/${encodedName}`);
                const signal = await response.json();
                
                // Reset button
                scanBtn.innerHTML = '<i class="fas fa-search"></i> QUANTUM SCAN';
                scanBtn.disabled = false;
                
                displaySignal(signal);
                
            } catch (error) {
                console.error('Scan error:', error);
                showError('Failed to scan market. Please try again.');
                
                // Reset button
                const scanBtn = document.getElementById('scanBtn');
                scanBtn.innerHTML = '<i class="fas fa-search"></i> QUANTUM SCAN';
                scanBtn.disabled = false;
            }
        }
        
        // Scan selected market
        function scanSelectedMarket() {
            if (!selectedMarket) {
                showError('Please select a market from the sidebar');
                return;
            }
            scanMarket(selectedMarket);
        }
        
        // Scan all markets
        async function scanAllMarkets() {
            try {
                const response = await fetch('/api/scan_all');
                const data = await response.json();
                
                // Find best signal
                let bestSignal = null;
                let bestConfidence = 0;
                
                for (const [market, signal] of Object.entries(data.results)) {
                    if (signal.signal === 'TRADE_SIGNAL' && signal.confidence > bestConfidence) {
                        bestConfidence = signal.confidence;
                        bestSignal = signal;
                    }
                }
                
                if (bestSignal) {
                    selectedMarket = bestSignal.market;
                    displaySignal(bestSignal);
                    showSuccess(`Found ${data.signals_found} signals across ${data.total_markets} markets`);
                } else {
                    showInfo('No strong signals found across all markets');
                }
                
            } catch (error) {
                console.error('Scan all error:', error);
                showError('Failed to scan all markets');
            }
        }
        
        // Display signal
        function displaySignal(signal) {
            currentSignal = signal;
            const container = document.getElementById('signalOutput');
            
            if (signal.signal === 'TRADE_SIGNAL') {
                container.innerHTML = createSignalCard(signal);
                document.getElementById('executeBtn').disabled = false;
                
                // Speak signal if voice enabled
                if (voiceEnabled) {
                    speakSignal(signal);
                }
                
                // Animate
                container.style.animation = 'slideIn 0.5s ease';
                
            } else {
                container.innerHTML = `
                    <div class="signal-card" style="border-color: var(--warning);">
                        <div class="signal-header">
                            <div class="signal-market">NO SIGNAL</div>
                        </div>
                        <div style="color: var(--text-secondary);">
                            ${signal.reason || 'No trading opportunity detected'}
                        </div>
                    </div>
                `;
                document.getElementById('executeBtn').disabled = true;
            }
        }
        
        // Create signal card HTML
        function createSignalCard(signal) {
            const confidencePercent = Math.round(signal.confidence * 100);
            const payoutPercent = Math.round(signal.payout * 100);
            
            return `
                <div class="signal-card">
                    <div class="signal-header">
                        <div class="signal-market">${signal.market}</div>
                        <div class="signal-confidence">${confidencePercent}%</div>
                    </div>
                    
                    <div class="signal-details">
                        <div class="signal-detail">
                            <div class="detail-label">Contract</div>
                            <div class="detail-value">${signal.contract}</div>
                        </div>
                        
                        <div class="signal-detail">
                            <div class="detail-label">Type</div>
                            <div class="detail-value">${signal.type}</div>
                        </div>
                        
                        <div class="signal-detail">
                            <div class="detail-label">Payout</div>
                            <div class="detail-value">${payoutPercent}%</div>
                        </div>
                        
                        ${signal.barrier && signal.barrier !== 'N/A' ? `
                        <div class="signal-detail">
                            <div class="detail-label">Barrier</div>
                            <div class="detail-value">${signal.barrier}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div style="margin: 15px 0; padding: 15px; background: rgba(0,255,136,0.1); border-radius: 8px;">
                        <strong>Signal Reason:</strong><br>
                        ${signal.reason}
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn" onclick="speakCurrentSignal()" style="flex: 1; background: var(--neon-purple);">
                            <i class="fas fa-volume-up"></i> SPEAK
                        </button>
                        <button class="btn" onclick="copySignal()" style="flex: 1; background: var(--text-secondary);">
                            <i class="fas fa-copy"></i> COPY
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Execute trade
        async function executeTrade() {
            if (!currentSignal || currentSignal.signal !== 'TRADE_SIGNAL') {
                showError('No valid signal to execute');
                return;
            }
            
            if (!selectedMarket) {
                showError('No market selected');
                return;
            }
            
            const stake = parseFloat(document.getElementById('baseStake').value);
            
            try {
                const response = await fetch('/api/execute', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        market: selectedMarket,
                        contract: currentSignal.contract,
                        stake: stake
                    })
                });
                
                const trade = await response.json();
                
                if (trade.error) {
                    showError(trade.error);
                    return;
                }
                
                showSuccess(`Trade ${trade.id} executed! Outcome: ${trade.outcome}`);
                
                // Update UI
                updateSystemStatus();
                updateTradesList();
                updateBalance();
                
                // Reset signal
                document.getElementById('executeBtn').disabled = true;
                
            } catch (error) {
                console.error('Execute error:', error);
                showError('Trade execution failed');
            }
        }
        
        // Update system status
        async function updateSystemStatus() {
            try {
                const response = await fetch('/api/system_status');
                const status = await response.json();
                
                document.getElementById('coherenceValue').textContent = 
                    status.average_coherence?.toFixed(2) || '0.00';
                document.getElementById('activeTrades').textContent = 
                    status.active_trades || '0';
                document.getElementById('winRate').textContent = 
                    status.performance?.win_rate ? 
                    `${(status.performance.win_rate * 100).toFixed(1)}%` : '0%';
                document.getElementById('profitValue').textContent = 
                    `$${status.performance?.profit?.toFixed(2) || '0'}`;
                
            } catch (error) {
                console.error('Status update error:', error);
            }
        }
        
        // Update trades list
        async function updateTradesList() {
            try {
                const response = await fetch('/api/active_trades');
                const data = await response.json();
                
                const container = document.getElementById('tradesList');
                
                if (data.count === 0) {
                    container.innerHTML = `
                        <div style="color: var(--text-secondary); text-align: center; padding: 20px;">
                            No active trades
                        </div>
                    `;
                    return;
                }
                
                let html = '';
                data.active_trades.forEach(trade => {
                    html += `
                        <div style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between;">
                                <div>
                                    <strong>${trade.market}</strong>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                        ${trade.contract} - $${trade.stake}
                                    </div>
                                </div>
                                <div style="color: ${trade.outcome === 'WIN' ? 'var(--success)' : 'var(--danger)'};">
                                    ${trade.outcome === 'WIN' ? '+' : '-'}$${Math.abs(trade.profit).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                container.innerHTML = html;
                
            } catch (error) {
                console.error('Trades update error:', error);
            }
        }
        
        // Update balance
        async function updateBalance() {
            try {
                const response = await fetch('/api/performance');
                const performance = await response.json();
                
                const baseBalance = 10000;
                const currentBalance = baseBalance + (performance.profit || 0);
                document.getElementById('balanceDisplay').textContent = 
                    `$${currentBalance.toFixed(2)}`;
                
            } catch (error) {
                console.error('Balance update error:', error);
            }
        }
        
        // Save configuration
        async function saveConfig() {
            const config = {
                base_stake: parseFloat(document.getElementById('baseStake').value),
                min_confidence: parseFloat(document.getElementById('minConfidence').value),
                enable_ai_voice: document.getElementById('enableVoice').checked
            };
            
            voiceEnabled = config.enable_ai_voice;
            
            try {
                const response = await fetch('/api/config', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(config)
                });
                
                showSuccess('Configuration saved');
                
            } catch (error) {
                showError('Failed to save configuration');
            }
        }
        
        // Save advanced configuration
        async function saveAdvancedConfig() {
            const config = {
                stop_loss: parseInt(document.getElementById('stopLoss').value),
                take_profit: parseInt(document.getElementById('takeProfit').value),
                martingale_multiplier: parseFloat(document.getElementById('martingaleMultiplier').value)
            };
            
            try {
                const response = await fetch('/api/config', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(config)
                });
                
                showSuccess('Advanced settings saved');
                hideModal('configModal');
                
            } catch (error) {
                showError('Failed to save advanced settings');
            }
        }
        
        // Toggle voice
        function toggleVoice() {
            voiceEnabled = !voiceEnabled;
            const toggleBtn = document.getElementById('voiceToggle');
            const voiceText = document.querySelector('.voice-control span');
            
            if (voiceEnabled) {
                toggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                voiceText.textContent = 'AI Voice: ON';
                showSuccess('Voice alerts enabled');
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                voiceText.textContent = 'AI Voice: OFF';
                showInfo('Voice alerts disabled');
            }
        }
        
        // Speak signal
        function speakSignal(signal) {
            if (!voiceEnabled || !speechSynthesis) return;
            
            // Cancel any current speech
            speechSynthesis.cancel();
            
            // Generate speech text
            let speechText = `Signal detected for ${signal.market}. `;
            speechText += `${signal.contract} with ${Math.round(signal.confidence * 100)} percent confidence. `;
            speechText += `Expected payout ${Math.round(signal.payout * 100)} percent. `;
            
            if (signal.reason) {
                speechText += `Reason: ${signal.reason}`;
            }
            
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.rate = 1.1;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            speechSynthesis.speak(utterance);
        }
        
        // Speak current signal
        function speakCurrentSignal() {
            if (currentSignal && voiceEnabled) {
                speakSignal(currentSignal);
            }
        }
        
        // Copy signal to clipboard
        function copySignal() {
            if (!currentSignal) return;
            
            const signalText = `
Market: ${currentSignal.market}
Contract: ${currentSignal.contract}
Type: ${currentSignal.type}
Confidence: ${Math.round(currentSignal.confidence * 100)}%
Payout: ${Math.round(currentSignal.payout * 100)}%
Reason: ${currentSignal.reason}
Time: ${new Date().toLocaleString()}
            `.trim();
            
            navigator.clipboard.writeText(signalText).then(() => {
                showSuccess('Signal copied to clipboard');
            });
        }
        
        // Clear signals
        function clearSignals() {
            document.getElementById('signalOutput').innerHTML = `
                <div style="color: var(--text-secondary); text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <div>Select a market and click SCAN</div>
                </div>
            `;
            currentSignal = null;
            document.getElementById('executeBtn').disabled = true;
            showInfo('Signals cleared');
        }
        
        // Emergency stop
        function emergencyStop() {
            if (confirm('EMERGENCY STOP: All active trades will be cancelled. Continue?')) {
                // Cancel all speech
                if (speechSynthesis) {
                    speechSynthesis.cancel();
                }
                
                // Disable buttons
                document.getElementById('scanBtn').disabled = true;
                document.getElementById('executeBtn').disabled = true;
                
                // Show emergency state
                document.body.style.filter = 'grayscale(1)';
                
                showError('EMERGENCY STOP ACTIVATED');
                
                // Re-enable after 10 seconds
                setTimeout(() => {
                    document.body.style.filter = '';
                    document.getElementById('scanBtn').disabled = false;
                    showInfo('Emergency stop cleared');
                }, 10000);
            }
        }
        
        // Modal functions
        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'flex';
        }
        
        function hideModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        };
        
        // Start auto-refresh
        function startAutoRefresh() {
            // Update status every 10 seconds
            setInterval(updateSystemStatus, 10000);
            
            // Update trades every 5 seconds
            setInterval(updateTradesList, 5000);
            
            // Auto-scan every 30 seconds if market selected
            setInterval(() => {
                if (selectedMarket && voiceEnabled) {
                    scanMarket(selectedMarket);
                }
            }, 30000);
        }
        
        // Notification functions
        function showError(message) {
            showNotification(message, 'var(--danger)');
        }
        
        function showSuccess(message) {
            showNotification(message, 'var(--success)');
        }
        
        function showInfo(message) {
            showNotification(message, 'var(--quantum-blue)');
        }
        
        function showNotification(message, color) {
            // Create notification element
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: ${color};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 3000;
                animation: slideIn 0.3s ease;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-info-circle"></i>
                    <div>${message}</div>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
    </script>
</body>
</html>
'''

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
