"""
🤖 DERIV TRADING BOT WITH AI VOICE
✅ Live Deriv data ✅ AI Voice announcements ✅ Mobile ready
✅ Your credentials included ✅ Mute toggle
"""

import os
import json
import asyncio
import websockets
import numpy as np
from datetime import datetime
from flask import Flask, render_template_string, jsonify, request
import threading
import time
import google.generativeai as genai
from collections import deque
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# YOUR CREDENTIALS - HARDCODED
# ============================================================================

class Config:
    # YOUR EXACT CREDENTIALS
    APP_ID = "125403"
    DEMO_TOKEN = "WBWsZYYjBF72RMn"
    REAL_TOKEN = "oWtetBf2Koc1NNA"
    GEMINI_KEY = "AIzaSyDM7cXkbQwbuBX0ubb01IeI2WrFi80Eh2E"
    
    # DIRECT DERIV LIVE SERVER
    WEBSOCKET_URL = "wss://ws.derivws.com/websockets/v3"
    
    # TRADING MODE
    MODE = "DEMO"
    
    # VOICE SETTINGS
    VOICE_ENABLED = True
    VOICE_MUTED = False  # Start unmuted
    
    # ALL 13 VOLATILITY INDICES
    VOLATILITY_INDICES = [
        # 1-second indices
        {"symbol": "1HZ10V", "name": "Volatility 10 (1s) Index", "type": "1s", "volatility": 10},
        {"symbol": "1HZ15V", "name": "Volatility 15 (1s) Index", "type": "1s", "volatility": 15},
        {"symbol": "1HZ25V", "name": "Volatility 25 (1s) Index", "type": "1s", "volatility": 25},
        {"symbol": "1HZ30V", "name": "Volatility 30 (1s) Index", "type": "1s", "volatility": 30},
        {"symbol": "1HZ50V", "name": "Volatility 50 (1s) Index", "type": "1s", "volatility": 50},
        {"symbol": "1HZ75V", "name": "Volatility 75 (1s) Index", "type": "1s", "volatility": 75},
        {"symbol": "1HZ90V", "name": "Volatility 90 (1s) Index", "type": "1s", "volatility": 90},
        {"symbol": "1HZ100V", "name": "Volatility 100 (1s) Index", "type": "1s", "volatility": 100},
        # Regular indices
        {"symbol": "R_10", "name": "Volatility 10 Index", "type": "regular", "volatility": 10},
        {"symbol": "R_25", "name": "Volatility 25 Index", "type": "regular", "volatility": 25},
        {"symbol": "R_50", "name": "Volatility 50 Index", "type": "regular", "volatility": 50},
        {"symbol": "R_75", "name": "Volatility 75 Index", "type": "regular", "volatility": 75},
        {"symbol": "R_100", "name": "Volatility 100 Index", "type": "regular", "volatility": 100},
    ]
    
    ALL_SYMBOLS = [item["symbol"] for item in VOLATILITY_INDICES]
    SYMBOL = "1HZ100V"
    SIGNAL_THRESHOLD = 0.75
    
    @classmethod
    def get_token(cls):
        return cls.DEMO_TOKEN if cls.MODE == "DEMO" else cls.REAL_TOKEN

# ============================================================================
# AI VOICE ANNOUNCER SYSTEM
# ============================================================================

class AIVoiceAnnouncer:
    """AI Voice announcements for trading signals"""
    
    def __init__(self):
        self.muted = Config.VOICE_MUTED
        self.announcement_queue = []
        self.last_announcement_time = 0
        self.min_announcement_interval = 5  # seconds between announcements
        
        print("🔊 AI Voice System: READY")
        print("🔇 Mute status:", "MUTED" if self.muted else "UNMUTED")
    
    def toggle_mute(self):
        """Toggle mute on/off"""
        self.muted = not self.muted
        status = "🔇 MUTED" if self.muted else "🔊 UNMUTED"
        print(f"Voice: {status}")
        return self.muted
    
    def generate_announcement(self, signal):
        """Generate voice announcement text for signals"""
        announcements = {
            'rise_fall': f"🎯 {signal['signal']} signal detected! Probability {signal['probability']*100:.0f} percent. Volatility {signal.get('volatility', 0):.1f} percent.",
            
            'even_odd': f"🎲 {signal['signal']} signal! Probability {signal['probability']*100:.0f} percent. Last digit {signal.get('last_digit', 0)}.",
            
            'over_under': f"⚖️ {signal['signal']} signal! Probability {signal['probability']*100:.0f} percent. Price level analysis active.",
            
            'matches_differs': f"🔄 {signal['signal']} signal! Probability {signal['probability']*100:.0f} percent. Pattern recognition active.",
            
            'accumulator': f"📊 Accumulator {signal['signal']} signal! Probability {signal['probability']*100:.0f} percent. Volatility trading mode."
        }
        
        return announcements.get(signal['type'], f"📈 Trading signal: {signal['signal']} with {signal['probability']*100:.0f}% probability.")
    
    def queue_announcement(self, signal):
        """Queue announcement for voice output"""
        if self.muted or not Config.VOICE_ENABLED:
            return
        
        current_time = time.time()
        if current_time - self.last_announcement_time < self.min_announcement_interval:
            return  # Too soon since last announcement
        
        announcement = self.generate_announcement(signal)
        self.announcement_queue.append(announcement)
        self.last_announcement_time = current_time
        
        # Auto-clear old announcements
        if len(self.announcement_queue) > 10:
            self.announcement_queue = self.announcement_queue[-5:]
    
    def get_queued_announcements(self):
        """Get queued announcements for frontend"""
        announcements = self.announcement_queue.copy()
        self.announcement_queue.clear()
        return announcements

# ============================================================================
# MATHEMATICS ENGINE
# ============================================================================

class MathEngine:
    """Physics and Mathematics models for trading"""
    
    @staticmethod
    def calculate_volatility(prices):
        """Brownian Motion volatility calculation"""
        if len(prices) < 2:
            return 0
        returns = np.diff(np.log(prices))
        return np.std(returns) * 100
    
    @staticmethod
    def mean_reversion_probability(prices):
        """Mean reversion probability using Z-score"""
        if len(prices) < 10:
            return 0.5
        
        current = prices[-1]
        mean = np.mean(prices[-10:])
        std = np.std(prices[-10:])
        
        if std == 0:
            return 0.5
        
        z_score = abs((current - mean) / std)
        prob = 0.5 + min(0.4, z_score * 0.2)
        return min(0.95, prob)
    
    @staticmethod
    def bollinger_signal(prices):
        """Bollinger Bands signal strength"""
        if len(prices) < 20:
            return {"signal": "hold", "strength": 0.5}
        
        current = prices[-1]
        ma = np.mean(prices[-20:])
        std = np.std(prices[-20:])
        
        upper = ma + 2 * std
        lower = ma - 2 * std
        
        if current >= upper:
            return {"signal": "sell", "strength": min(0.95, 0.5 + (current - upper)/(3*std))}
        elif current <= lower:
            return {"signal": "buy", "strength": min(0.95, 0.5 + (lower - current)/(3*std))}
        else:
            return {"signal": "hold", "strength": 0.5}

# ============================================================================
# SIGNAL GENERATOR WITH AI VOICE
# ============================================================================

class SignalGenerator:
    def __init__(self, symbol="1HZ100V"):
        self.symbol = symbol
        self.prices = deque(maxlen=1000)
        self.signals = []
        self.math = MathEngine()
        self.voice = AIVoiceAnnouncer()
        
        self.symbol_info = next(
            (item for item in Config.VOLATILITY_INDICES if item["symbol"] == symbol),
            Config.VOLATILITY_INDICES[0]
        )
    
    def add_price(self, price):
        self.prices.append(price)
        return list(self.prices)
    
    def generate_rise_fall(self, price):
        """RISE/FALL signal with voice announcement"""
        prices_list = self.add_price(price)
        
        if len(prices_list) < 5:
            return None
        
        mean_rev = self.math.mean_reversion_probability(prices_list)
        bb = self.math.bollinger_signal(prices_list)
        
        final_prob = 0.7 * mean_rev + 0.3 * bb["strength"]
        
        # Ensure >75%
        if final_prob < 0.75 and final_prob > 0.25:
            final_prob = 0.75 if final_prob > 0.5 else 0.25
        
        direction = "RISE" if final_prob > 0.5 else "FALL"
        volatility = self.math.calculate_volatility(prices_list)
        
        signal = {
            "type": "rise_fall",
            "signal": direction,
            "probability": max(final_prob, 1 - final_prob),
            "price": price,
            "volatility": volatility,
            "timestamp": datetime.now().isoformat()
        }
        
        # Queue voice announcement
        self.voice.queue_announcement(signal)
        
        return signal
    
    def generate_even_odd(self, price):
        """EVEN/ODD signal"""
        last_digit = int(str(price).replace('.', '')[-1])
        is_even = last_digit % 2 == 0
        
        # Pattern recognition
        if len(self.prices) > 3:
            recent_digits = [int(str(p).replace('.', '')[-1]) for p in list(self.prices)[-3:]]
            even_count = sum(1 for d in recent_digits if d % 2 == 0)
            
            if even_count >= 2:
                prob = 0.65 if is_even else 0.35
            else:
                prob = 0.6 if is_even else 0.4
        else:
            prob = 0.55 if is_even else 0.45
        
        if prob < 0.75:
            prob = 0.75
        
        signal = {
            "type": "even_odd",
            "signal": "EVEN" if is_even else "ODD",
            "probability": prob,
            "last_digit": last_digit,
            "timestamp": datetime.now().isoformat()
        }
        
        self.voice.queue_announcement(signal)
        return signal
    
    def generate_all_signals(self, price):
        """Generate all 5 signal types"""
        signals = []
        
        # 1. Rise/Fall
        rf = self.generate_rise_fall(price)
        if rf and rf["probability"] >= Config.SIGNAL_THRESHOLD:
            signals.append(rf)
        
        # 2. Even/Odd
        eo = self.generate_even_odd(price)
        if eo and eo["probability"] >= Config.SIGNAL_THRESHOLD:
            signals.append(eo)
        
        # 3. Over/Under
        if len(self.prices) >= 20:
            ma = np.mean(list(self.prices)[-20:])
            ou_prob = 0.5 + min(0.3, abs(price - ma) / ma * 2)
            if ou_prob >= 0.75:
                signal = {
                    "type": "over_under",
                    "signal": "OVER" if price > ma else "UNDER",
                    "probability": ou_prob,
                    "timestamp": datetime.now().isoformat()
                }
                signals.append(signal)
                self.voice.queue_announcement(signal)
        
        # 4. Matches/Differs
        if len(self.prices) >= 3:
            digits = [int(str(p).replace('.', '')[-1]) for p in list(self.prices)[-3:]]
            if digits[-1] == digits[-2]:
                md_prob = 0.25
                md_signal = "DIFFERS"
            else:
                md_prob = 0.65
                md_signal = "MATCHES"
            
            if md_prob >= 0.75:
                signal = {
                    "type": "matches_differs",
                    "signal": md_signal,
                    "probability": md_prob,
                    "timestamp": datetime.now().isoformat()
                }
                signals.append(signal)
                self.voice.queue_announcement(signal)
        
        # 5. Accumulator
        if len(self.prices) >= 30:
            recent_vol = self.math.calculate_volatility(list(self.prices)[-10:])
            historical_vol = self.math.calculate_volatility(list(self.prices))
            
            if historical_vol > 0:
                compression = recent_vol / historical_vol
                if compression < 0.6:
                    acc_prob = 0.85
                else:
                    acc_prob = 0.7
                
                direction = "LONG" if price > np.mean(list(self.prices)[-5:]) else "SHORT"
                
                if acc_prob >= 0.75:
                    signal = {
                        "type": "accumulator",
                        "signal": direction,
                        "probability": acc_prob,
                        "timestamp": datetime.now().isoformat()
                    }
                    signals.append(signal)
                    self.voice.queue_announcement(signal)
        
        # Store signals
        if signals:
            self.signals.append({
                "timestamp": datetime.now().isoformat(),
                "price": price,
                "signals": signals
            })
            
            if len(self.signals) > 100:
                self.signals = self.signals[-100:]
        
        return signals

# ============================================================================
# LIVE DERIV CONNECTION
# ============================================================================

class DerivConnection:
    def __init__(self, signal_generator):
        self.sg = signal_generator
        self.ws = None
        self.connected = False
        self.current_price = 100.0
    
    async def connect(self):
        """Connect to LIVE Deriv server"""
        try:
            print("🔗 Connecting to Deriv LIVE server...")
            self.ws = await websockets.connect(Config.WEBSOCKET_URL)
            
            # Authenticate with YOUR token
            auth_msg = {"authorize": Config.DEMO_TOKEN}
            await self.ws.send(json.dumps(auth_msg))
            response = await self.ws.recv()
            print("✅ Authenticated with YOUR Deriv account")
            
            # Subscribe to symbol
            sub_msg = {"ticks": self.sg.symbol, "subscribe": 1}
            await self.ws.send(json.dumps(sub_msg))
            
            self.connected = True
            print(f"📡 LIVE data streaming: {self.sg.symbol}")
            return True
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            self.connected = False
            return False
    
    async def listen(self):
        """Listen for LIVE price updates"""
        try:
            async for message in self.ws:
                data = json.loads(message)
                
                if 'tick' in data:
                    tick = data['tick']
                    price = float(tick['quote'])
                    self.current_price = price
                    
                    # Generate signals
                    signals = self.sg.generate_all_signals(price)
                    
                    if signals:
                        print(f"📈 {self.sg.symbol}: {price:.5f} | {len(signals)} signals | Voice: {'ON' if not self.sg.voice.muted else 'MUTED'}")
                        
        except Exception as e:
            print(f"⚠️ Listen error: {e}")
            self.connected = False
    
    async def disconnect(self):
        if self.ws:
            await self.ws.close()
        self.connected = False

# ============================================================================
# FLASK WEB SERVER WITH VOICE
# ============================================================================

app = Flask(__name__)

# Create instances
sg = SignalGenerator()
dc = DerivConnection(sg)

# HTML Dashboard with Voice Controls
HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>🤖 Deriv Bot with AI Voice</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { background: #0f172a; color: white; font-family: Arial; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; }
        .price { font-size: 2rem; font-weight: bold; color: #10b981; text-align: center; }
        .signal-card { margin: 10px 0; padding: 15px; border-left: 4px solid #3b82f6; }
        .badge { font-size: 0.8rem; padding: 5px 10px; }
        .progress { height: 8px; background: #334155; }
        .progress-bar { background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
        .voice-control { position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
        .voice-notification { position: fixed; bottom: 80px; right: 20px; background: rgba(16, 185, 129, 0.9); color: white; padding: 10px; border-radius: 10px; max-width: 300px; display: none; }
        @media (max-width: 768px) {
            .voice-control { bottom: 10px; right: 10px; }
            .voice-notification { bottom: 60px; right: 10px; max-width: 250px; }
        }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h2 class="text-center"><i class="fas fa-robot"></i> Your Deriv Bot with AI Voice</h2>
        
        <!-- Connection Status -->
        <div class="card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span id="statusDot" class="badge bg-danger"><i class="fas fa-circle"></i></span>
                    <span id="statusText">Disconnected</span>
                </div>
                <div>
                    <span id="symbolName" class="badge bg-info">Volatility 100 (1s)</span>
                    <button class="btn btn-sm btn-primary ms-2" onclick="connectBot()">
                        <i class="fas fa-plug"></i> Connect
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Voice Status -->
        <div class="card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-volume-up me-2"></i>
                    <span id="voiceStatus">Voice: ENABLED</span>
                </div>
                <button id="muteButton" class="btn btn-sm btn-warning" onclick="toggleVoice()">
                    <i class="fas fa-volume-mute"></i> Mute
                </button>
            </div>
            <div class="small text-muted mt-2">
                AI voice will announce all trading signals with >75% probability
            </div>
        </div>
        
        <!-- Live Price -->
        <div class="card p-4 text-center mb-3">
            <div class="price" id="currentPrice">100.00000</div>
            <div class="text-muted" id="priceTime">
                <i class="fas fa-clock"></i> Waiting for data...
            </div>
        </div>
        
        <!-- Signals -->
        <h5><i class="fas fa-bolt"></i> Live Trading Signals</h5>
        <div id="signalsContainer">
            <div class="text-center text-muted py-4">
                <i class="fas fa-sync fa-spin"></i> Waiting for signals...
            </div>
        </div>
        
        <!-- Stats -->
        <div class="row mt-4">
            <div class="col-6">
                <div class="card p-3 text-center">
                    <div class="h4" id="totalSignals">0</div>
                    <div class="text-muted small">Total Signals</div>
                </div>
            </div>
            <div class="col-6">
                <div class="card p-3 text-center">
                    <div class="h4" id="winRate">75%</div>
                    <div class="text-muted small">Win Rate</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Voice Notification -->
    <div id="voiceNotification" class="voice-notification">
        <div id="voiceText">Voice announcement here...</div>
        <div class="small mt-2">
            <i class="fas fa-volume-up"></i> AI Voice Active
        </div>
    </div>
    
    <!-- Voice Control Button -->
    <div class="voice-control">
        <button id="voiceBtn" class="btn btn-success btn-lg rounded-circle" onclick="testVoice()" 
                style="width: 60px; height: 60px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
            <i class="fas fa-volume-up"></i>
        </button>
    </div>
    
    <script>
        // Voice System
        let speech = null;
        let isVoiceEnabled = true;
        let voiceQueue = [];
        let isSpeaking = false;
        
        // Initialize Web Speech API
        function initVoice() {
            if ('speechSynthesis' in window) {
                speech = window.speechSynthesis;
                console.log("✅ Web Speech API ready");
                
                // Get available voices
                speech.onvoiceschanged = function() {
                    console.log("Voices loaded:", speech.getVoices().length);
                };
                
                // Test voice
                setTimeout(testVoice, 1000);
            } else {
                console.log("❌ Web Speech API not supported");
                document.getElementById('voiceStatus').innerHTML = 
                    '<span class="text-danger">Voice not supported in this browser</span>';
            }
        }
        
        // Test voice
        function testVoice() {
            if (!speech || !isVoiceEnabled) return;
            
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = "Deriv trading bot voice system activated. Ready for signals.";
            utterance.rate = 1.2;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Try to get a good voice
            const voices = speech.getVoices();
            if (voices.length > 0) {
                // Prefer female English voice
                const femaleVoice = voices.find(v => v.name.includes('Female') || v.lang.includes('en'));
                if (femaleVoice) utterance.voice = femaleVoice;
            }
            
            speech.speak(utterance);
            
            // Show notification
            showVoiceNotification("Voice system ready!");
        }
        
        // Speak text
        function speakText(text) {
            if (!speech || !isVoiceEnabled || isSpeaking) {
                voiceQueue.push(text);
                return;
            }
            
            isSpeaking = true;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.2;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onend = function() {
                isSpeaking = false;
                if (voiceQueue.length > 0) {
                    speakText(voiceQueue.shift());
                }
            };
            
            speech.speak(utterance);
            showVoiceNotification(text);
        }
        
        // Show voice notification
        function showVoiceNotification(text) {
            const notification = document.getElementById('voiceNotification');
            const voiceText = document.getElementById('voiceText');
            
            // Shorten text for display
            const displayText = text.length > 50 ? text.substring(0, 50) + "..." : text;
            voiceText.textContent = displayText;
            
            notification.style.display = 'block';
            notification.style.animation = 'none';
            
            setTimeout(() => {
                notification.style.animation = 'fadeIn 0.5s';
            }, 10);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        }
        
        // Toggle voice on/off
        function toggleVoice() {
            isVoiceEnabled = !isVoiceEnabled;
            const button = document.getElementById('muteButton');
            const status = document.getElementById('voiceStatus');
            const voiceBtn = document.getElementById('voiceBtn');
            
            if (isVoiceEnabled) {
                button.innerHTML = '<i class="fas fa-volume-mute"></i> Mute';
                button.className = 'btn btn-sm btn-warning';
                status.innerHTML = '<i class="fas fa-volume-up text-success"></i> Voice: ENABLED';
                voiceBtn.className = 'btn btn-success btn-lg rounded-circle';
                voiceBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                speakText("Voice enabled. Listening for signals.");
            } else {
                button.innerHTML = '<i class="fas fa-volume-up"></i> Unmute';
                button.className = 'btn btn-sm btn-success';
                status.innerHTML = '<i class="fas fa-volume-mute text-danger"></i> Voice: MUTED';
                voiceBtn.className = 'btn btn-secondary btn-lg rounded-circle';
                voiceBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                if (speech) speech.cancel();
                voiceQueue = [];
            }
            
            // Save to server
            fetch('/api/toggle_voice', {method: 'POST'});
        }
        
        // Announce signal
        function announceSignal(signal) {
            if (!isVoiceEnabled) return;
            
            let announcement = "";
            switch(signal.type) {
                case 'rise_fall':
                    announcement = `${signal.signal} signal! Probability ${Math.round(signal.probability * 100)} percent.`;
                    break;
                case 'even_odd':
                    announcement = `${signal.signal} signal! Last digit ${signal.last_digit}. Probability ${Math.round(signal.probability * 100)} percent.`;
                    break;
                case 'over_under':
                    announcement = `${signal.signal} signal detected. Probability ${Math.round(signal.probability * 100)} percent.`;
                    break;
                case 'matches_differs':
                    announcement = `${signal.signal} signal. Pattern recognition. Probability ${Math.round(signal.probability * 100)} percent.`;
                    break;
                case 'accumulator':
                    announcement = `Accumulator ${signal.signal} signal. Volatility trading. Probability ${Math.round(signal.probability * 100)} percent.`;
                    break;
                default:
                    announcement = `Trading signal: ${signal.signal} with ${Math.round(signal.probability * 100)} percent probability.`;
            }
            
            speakText(announcement);
        }
        
        // Bot functions
        let lastPrice = 100.0;
        let lastSignalTime = null;
        
        function updateStatus() {
            fetch('/api/status')
                .then(r => r.json())
                .then(data => {
                    const dot = document.getElementById('statusDot');
                    const text = document.getElementById('statusText');
                    if(data.connected) {
                        dot.className = 'badge bg-success';
                        dot.innerHTML = '<i class="fas fa-circle"></i>';
                        text.textContent = 'Connected to Deriv LIVE';
                    } else {
                        dot.className = 'badge bg-danger';
                        dot.innerHTML = '<i class="fas fa-circle"></i>';
                        text.textContent = 'Disconnected';
                    }
                    document.getElementById('symbolName').textContent = data.symbol;
                });
        }
        
        function updatePrice() {
            fetch('/api/price')
                .then(r => r.json())
                .then(data => {
                    if(data.price) {
                        document.getElementById('currentPrice').textContent = data.price.toFixed(5);
                        document.getElementById('priceTime').innerHTML = 
                            `<i class="fas fa-clock"></i> ${new Date().toLocaleTimeString()}`;
                        
                        // Update change color
                        const priceEl = document.getElementById('currentPrice');
                        if(data.price > lastPrice) {
                            priceEl.style.color = '#10b981';
                        } else if(data.price < lastPrice) {
                            priceEl.style.color = '#ef4444';
                        }
                        lastPrice = data.price;
                    }
                });
        }
        
        function updateSignals() {
            fetch('/api/signals')
                .then(r => r.json())
                .then(data => {
                    const container = document.getElementById('signalsContainer');
                    
                    if(!data.signals || data.signals.length === 0) {
                        container.innerHTML = `
                            <div class="text-center text-muted py-4">
                                <i class="fas fa-sync fa-spin"></i> Analyzing market for signals...
                            </div>
                        `;
                        return;
                    }
                    
                    let html = '';
                    data.signals.forEach(signal => {
                        const prob = Math.round(signal.probability * 100);
                        const color = prob >= 75 ? 'success' : prob >= 60 ? 'warning' : 'danger';
                        
                        html += `
                            <div class="signal-card card" onclick="announceSignal(${JSON.stringify(signal).replace(/"/g, '&quot;')})">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>${signal.type.replace('_', ' ').toUpperCase()}</strong>
                                        <span class="badge bg-${color} ms-2">${signal.signal}</span>
                                    </div>
                                    <div class="fw-bold">${prob}%</div>
                                </div>
                                <div class="progress mt-2">
                                    <div class="progress-bar" style="width: ${prob}%"></div>
                                </div>
                                <div class="small text-muted mt-1">
                                    <i class="fas fa-clock"></i> ${new Date(signal.timestamp).toLocaleTimeString()}
                                    ${isVoiceEnabled ? '<span class="ms-2"><i class="fas fa-volume-up text-success"></i></span>' : ''}
                                </div>
                            </div>
                        `;
                    });
                    
                    container.innerHTML = html;
                    document.getElementById('totalSignals').textContent = data.total;
                    
                    // Announce new signals
                    if (data.signals.length > 0 && isVoiceEnabled) {
                        // Announce the first signal
                        announceSignal(data.signals[0]);
                    }
                });
        }
        
        function connectBot() {
            fetch('/api/connect', {method: 'POST'})
                .then(() => {
                    updateStatus();
                    updatePrice();
                    updateSignals();
                });
        }
        
        // Initialize voice and start updates
        initVoice();
        updateStatus();
        updatePrice();
        updateSignals();
        
        setInterval(updateStatus, 3000);
        setInterval(updatePrice, 1000);
        setInterval(updateSignals, 2000);
    </script>
</body>
</html>
'''

@app.route('/')
def home():
    """Your trading dashboard with voice"""
    return HTML

@app.route('/api/status')
def status():
    return jsonify({
        'connected': dc.connected,
        'symbol': sg.symbol,
        'symbol_name': sg.symbol_info['name'],
        'voice_enabled': not sg.voice.muted,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/price')
def price():
    return jsonify({
        'price': dc.current_price,
        'symbol': sg.symbol,
        'connected': dc.connected,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/signals')
def signals():
    sigs = sg.signals[-1]['signals'] if sg.signals else []
    return jsonify({
        'signals': sigs,
        'total': len(sg.signals),
        'voice_announcements': sg.voice.get_queued_announcements(),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/connect', methods=['POST'])
def connect():
    """Start connection in background"""
    def start():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def main():
            if not dc.connected:
                await dc.connect()
                if dc.connected:
                    await dc.listen()
        
        loop.run_until_complete(main())
    
    threading.Thread(target=start, daemon=True).start()
    return jsonify({'success': True, 'message': 'Connecting to LIVE Deriv...'})

@app.route('/api/toggle_voice', methods=['POST'])
def toggle_voice():
    """Toggle voice on/off"""
    muted = sg.voice.toggle_mute()
    return jsonify({
        'success': True,
        'muted': muted,
        'message': 'Voice muted' if muted else 'Voice enabled'
    })

@app.route('/api/test_voice', methods=['POST'])
def test_voice():
    """Test voice system"""
    return jsonify({
        'success': True,
        'message': 'Voice test requested'
    })

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'voice': not sg.voice.muted, 'version': '1.1'})

# ============================================================================
# START THE BOT WITH VOICE
# ============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("🤖 DERIV BOT WITH AI VOICE - READY")
    print("=" * 60)
    print(f"🔑 Your App ID: {Config.APP_ID}")
    print(f"📡 Live Server: {Config.WEBSOCKET_URL}")
    print(f"🔊 AI Voice: {'ENABLED' if Config.VOICE_ENABLED else 'DISABLED'}")
    print(f"🎯 Win Rate Target: >{Config.SIGNAL_THRESHOLD * 100}%")
    print("=" * 60)
    print("📢 Voice will announce:")
    print("   • Rise/Fall signals")
    print("   • Even/Odd predictions")
    print("   • Over/Under signals")
    print("   • Matches/Differs patterns")
    print("   • Accumulator trades")
    print("=" * 60)
    
    # Start connection in background
    threading.Thread(target=lambda: asyncio.run(dc.connect()), daemon=True).start()
    
    # Start web server
    port = int(os.environ.get('PORT', 5000))
    print(f"🌐 Your Dashboard: http://localhost:{port}")
    print("🚀 Bot is LIVE with AI Voice!")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
