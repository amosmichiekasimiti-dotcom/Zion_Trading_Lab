
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ========== MASTER CONFIGURATION ==========
const CONFIG = {
  deriv: {
    appId: 124918,
    apiUrl: 'wss://ws.derivws.com/websockets/v3',
    markets: [
      { symbol: '1HZ10V', name: 'Volatility 10 (1s) Index', digits: 1 },
      { symbol: 'R_10', name: 'Volatility 10 Index', digits: 2 },
      { symbol: '1HZ15V', name: 'Volatility 15 (1s) Index', digits: 1 },
      { symbol: '1HZ25V', name: 'Volatility 25 (1s) Index', digits: 1 },
      { symbol: 'R_25', name: 'Volatility 25 Index', digits: 2 },
      { symbol: '1HZ30V', name: 'Volatility 30 (1s) Index', digits: 1 },
      { symbol: '1HZ50V', name: 'Volatility 50 (1s) Index', digits: 1 },
      { symbol: 'R_50', name: 'Volatility 50 Index', digits: 2 },
      { symbol: '1HZ75V', name: 'Volatility 75 (1s) Index', digits: 1 },
      { symbol: 'R_75', name: 'Volatility 75 Index', digits: 2 },
      { symbol: '1HZ90V', name: 'Volatility 90 (1s) Index', digits: 1 },
      { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index', digits: 1 },
      { symbol: 'R_100', name: 'Volatility 100 Index', digits: 2 }
    ]
  },
  tokens: {
    real: process.env.REACT_APP_DERIV_TOKEN_REAL || 'm04oxPdV6cV6pX4',
    demo: process.env.REACT_APP_DERIV_TOKEN_DEMO || 'kTyefK9bFG3UPGh'
  },
  gemini: {
    apiKey: process.env.REACT_APP_GEMINI_KEY || 'AIzaSyDM7cKxbQwbbWX0ubb01Iel2wrFi8oEh2E',
    model: 'gemini-1.5-flash'
  },
  whatsapp: 'https://wa.me/254742024175',
  strategies: {
    laminarFlow: { windowSize: 5, maxDelta: 10, turbulentThreshold: 20 },
    gaussianMean: { smaPeriod: 20, overheat: 6.5, freeze: 2.5 },
    kinematicMomentum: { accelerationPeriod: 3, minAcceleration: 0.0001 }
  }
};

// ========== GEMINI AI SERVICE ==========
class GeminiAIService {
  constructor() {
    this.apiKey = CONFIG.gemini.apiKey;
    this.modelName = CONFIG.gemini.model;
    this.isInitialized = false;
    this.conversationHistory = [];
  }

  async initialize() {
    if (!this.apiKey) {
      console.warn('Gemini API key not configured');
      return false;
    }
    this.isInitialized = true;
    console.log('✅ Gemini AI initialized');
    return true;
  }

  async analyzeMarketData(marketData, currentSignals) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.apiKey) {
      return this.getFallbackAnalysis(marketData);
    }

    try {
      const prompt = this.buildAnalysisPrompt(marketData, currentSignals);
      const response = await this.callGeminiAPI(prompt);
      this.addToHistory('user', prompt);
      this.addToHistory('assistant', response);
      return this.parseAIResponse(response);
    } catch (error) {
      console.warn('Gemini AI analysis error, using fallback:', error.message);
      return this.getFallbackAnalysis(marketData);
    }
  }

  async callGeminiAPI(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  }

  buildAnalysisPrompt(marketData, signals) {
    return `
You are ZION, an advanced trading AI for Deriv synthetic indices. Analyze the following market data:

MARKET: ${marketData.name}
LAST PRICE: ${marketData.lastPrice}
LAST DIGIT: ${marketData.lastDigit}
FLOW STATE: ${marketData.flowState}
GAUSSIAN MEAN: ${marketData.gaussianMean || 'N/A'}
VELOCITY: ${marketData.velocity || 'N/A'}
ACCELERATION: ${marketData.acceleration || 'N/A'}

CURRENT SIGNALS:
${signals.map(s => `- ${s.type}: ${s.direction} (${Math.round(s.confidence * 100)}%)`).join('\n')}

Provide trading recommendation as JSON with: recommendation, confidence, risk, analysis, expected_move
`;
  }

  parseAIResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        recommendation: response.includes('BUY') ? 'BUY' : response.includes('SELL') ? 'SELL' : 'HOLD',
        confidence: response.match(/confidence[:\s]*(\d+)/i)?.[1] || 50,
        risk: response.includes('High') ? 'HIGH' : response.includes('Low') ? 'LOW' : 'MEDIUM',
        analysis: response.substring(0, 200),
        expected_move: '1-2 ticks'
      };
    } catch (error) {
      return this.getDefaultResponse();
    }
  }

  getDefaultResponse() {
    return {
      recommendation: 'HOLD',
      confidence: 50,
      risk: 'MEDIUM',
      analysis: 'Market analysis unavailable.',
      expected_move: '1-2 ticks'
    };
  }

  getFallbackAnalysis(marketData) {
    return {
      recommendation: marketData.flowState === 'laminar' ? 'BUY' : 'HOLD',
      confidence: marketData.flowState === 'laminar' ? 65 : 40,
      risk: marketData.flowState === 'laminar' ? 'LOW' : 'HIGH',
      analysis: `Flow: ${marketData.flowState}, Digit: ${marketData.lastDigit}`,
      expected_move: '1-3 ticks'
    };
  }

  addToHistory(role, content) {
    this.conversationHistory.push({ role, content, timestamp: Date.now() });
    if (this.conversationHistory.length > 20) {
      this.conversationHistory.shift();
    }
  }

  async getMarketInsight(question) {
    try {
      const response = await this.callGeminiAPI(`Trading question: ${question}`);
      return response;
    } catch (error) {
      return "AI service temporarily unavailable.";
    }
  }
}

const geminiAI = new GeminiAIService();

// ========== WEB SOCKET MANAGER ==========
class DerivWebSocket {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.currentToken = CONFIG.tokens.demo;
  }

  connect(useRealAccount = false) {
    if (this.ws) {
      this.ws.close();
    }
    
    this.currentToken = useRealAccount ? CONFIG.tokens.real : CONFIG.tokens.demo;
    
    this.ws = new WebSocket(`${CONFIG.deriv.apiUrl}?app_id=${CONFIG.deriv.appId}`);
    
    this.ws.onopen = () => {
      console.log('✅ Connected to Deriv');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.send({ authorize: this.currentToken });
      this.notify('connection', { connected: true, accountType: useRealAccount ? 'real' : 'demo' });
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.tick) this.notify('tick', data.tick);
        if (data.balance) this.notify('balance', data.balance);
        if (data.authorize) this.notify('auth', data.authorize);
        if (data.error) console.error('Deriv Error:', data.error);
      } catch (err) {
        console.error('Parse error:', err);
      }
    };

    this.ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      this.notify('error', e);
    };

    this.ws.onclose = () => {
      this.connected = false;
      if (this.reconnectAttempts < 5) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(useRealAccount), 3000);
      }
    };
  }

  send(data) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribeTicks(symbol) {
    this.send({ ticks: symbol, subscribe: 1 });
  }

  unsubscribeTicks(symbol) {
    this.send({ ticks: symbol, subscribe: 0 });
  }

  subscribeBalance() {
    this.send({ balance: 1, subscribe: 1 });
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    return () => {
      if (this.subscribers.has(event)) {
        this.subscribers.get(event).delete(callback);
      }
    };
  }

  notify(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          console.error('Subscriber error:', error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
}

const derivWS = new DerivWebSocket();

// ========== TRADING ENGINES ==========
class LaminarFlowEngine {
  constructor() {
    this.digits = [];
    this.state = 'unknown';
  }

  addDigit(digit) {
    this.digits.push(digit);
    if (this.digits.length > 50) this.digits.shift();
    
    if (this.digits.length < CONFIG.strategies.laminarFlow.windowSize) {
      return { state: 'wait', confidence: 0 };
    }
    
    const recent = this.digits.slice(-CONFIG.strategies.laminarFlow.windowSize);
    let deltaSum = 0;
    for (let i = 1; i < recent.length; i++) {
      deltaSum += Math.abs(recent[i] - recent[i - 1]);
    }
    
    if (deltaSum <= CONFIG.strategies.laminarFlow.maxDelta) {
      this.state = 'laminar';
      return { state: 'laminar', confidence: 1 - (deltaSum / CONFIG.strategies.laminarFlow.maxDelta) };
    } else if (deltaSum >= CONFIG.strategies.laminarFlow.turbulentThreshold) {
      this.state = 'turbulent';
      return { state: 'turbulent', confidence: 0 };
    } else {
      this.state = 'transitional';
      return { state: 'transitional', confidence: 0.5 };
    }
  }
}

class GaussianEngine {
  constructor() {
    this.digits = [];
  }

  addDigit(digit) {
    this.digits.push(digit);
    if (this.digits.length > 100) this.digits.shift();
    
    if (this.digits.length < CONFIG.strategies.gaussianMean.smaPeriod) {
      return { signal: 'wait', mean: 0, confidence: 0 };
    }
    
    const recent = this.digits.slice(-CONFIG.strategies.gaussianMean.smaPeriod);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    let signal = 'hold';
    let confidence = 0;
    
    if (mean > CONFIG.strategies.gaussianMean.overheat) {
      signal = 'under_5';
      confidence = Math.min(1, (mean - CONFIG.strategies.gaussianMean.overheat) / 3);
    } else if (mean < CONFIG.strategies.gaussianMean.freeze) {
      signal = 'over_4';
      confidence = Math.min(1, (CONFIG.strategies.gaussianMean.freeze - mean) / 3);
    }
    
    return { signal, mean, confidence };
  }
}

class KinematicEngine {
  constructor() {
    this.prices = [];
  }

  addPrice(price) {
    this.prices.push(price);
    if (this.prices.length > 10) this.prices.shift();
    
    if (this.prices.length < 3) {
      return { signal: 'wait', velocity: 0, acceleration: 0, confidence: 0 };
    }
    
    const velocities = [];
    for (let i = 1; i < this.prices.length; i++) {
      velocities.push(this.prices[i] - this.prices[i - 1]);
    }
    
    const recentVel = velocities[velocities.length - 1] || 0;
    const recentAcc = velocities.length > 1 ? velocities[velocities.length - 1] - velocities[velocities.length - 2] : 0;
    
    let signal = 'hold';
    let confidence = 0;
    
    if (recentAcc > CONFIG.strategies.kinematicMomentum.minAcceleration && recentVel > 0) {
      signal = 'rise';
      confidence = Math.min(1, recentAcc / 0.001);
    } else if (recentAcc < -CONFIG.strategies.kinematicMomentum.minAcceleration && recentVel < 0) {
      signal = 'fall';
      confidence = Math.min(1, Math.abs(recentAcc) / 0.001);
    }
    
    return { signal, velocity: recentVel, acceleration: recentAcc, confidence };
  }
}

// ========== AI VOICE COMPONENT ==========
const AIAnnouncer = ({ signal, market, countdown, aiAnalysis }) => {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('ai_muted') === 'true';
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('ai_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = useRef(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;
    return () => {
      if (synth.current?.speaking) {
        synth.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ai_muted', isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('ai_volume', volume.toString());
  }, [volume]);

  const speak = useCallback((text) => {
    if (isMuted || !synth.current) return;
    
    if (synth.current.speaking) {
      synth.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    const voices = synth.current.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Female') && v.lang.includes('en'));
    if (femaleVoice) utterance.voice = femaleVoice;
    
    synth.current.speak(utterance);
  }, [isMuted, volume]);

  useEffect(() => {
    if (!isMuted && signal && market) {
      const text = `${market.replace('Volatility', 'Vol')}. ${signal.type} signal. ${signal.direction}. Confidence ${Math.round(signal.confidence * 100)}%. Trading in 3... 2... 1... Now.`;
      speak(text);
    }
  }, [signal, market, isMuted, speak]);

  useEffect(() => {
    if (!isMuted && countdown && countdown <= 3 && countdown > 0) {
      speak(countdown.toString());
    }
  }, [countdown, isMuted, speak]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        setIsMuted(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const testVoice = () => {
    speak("Zion Trading Lab. AI Voice active. Ready for trading signals.");
  };

  return (
    <div className="ai-announcer">
      <div className="ai-header">
        <h3>🔊 AI Voice</h3>
        <div className="ai-controls">
          <button 
            className={`mute-btn ${isMuted ? 'muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => setVolume(e.target.value / 100)}
            disabled={isMuted}
          />
          <span className="volume-text">{Math.round(volume * 100)}%</span>
          <button className="test-btn" onClick={testVoice} disabled={isMuted}>
            Test
          </button>
        </div>
      </div>
      <div className="ai-status">
        <span className={`status ${isSpeaking ? 'speaking' : ''}`}>
          {isMuted ? 'MUTED' : isSpeaking ? 'SPEAKING' : 'READY'}
        </span>
        <span className="hotkey">Alt+M</span>
      </div>
    </div>
  );
};

// ========== MARKET CARD COMPONENT ==========
const MarketCard = ({ market, onSelect }) => {
  const [lastDigit, setLastDigit] = useState(null);
  const [flowState, setFlowState] = useState('unknown');
  const [signals, setSignals] = useState({});
  const laminarEngine = useRef(new LaminarFlowEngine());
  const gaussianEngine = useRef(new GaussianEngine());
  const kinematicEngine = useRef(new KinematicEngine());

  useEffect(() => {
    const unsubscribe = derivWS.subscribe('tick', async (tick) => {
      if (tick.symbol === market.symbol) {
        const digit = extractLastDigit(tick.quote);
        setLastDigit(digit);
        
        const flow = laminarEngine.current.addDigit(digit);
        setFlowState(flow.state);
        
        const gaussian = gaussianEngine.current.addDigit(digit);
        const kinematic = kinematicEngine.current.addPrice(parseFloat(tick.quote));
        
        setSignals({
          flow,
          gaussian,
          kinematic,
          lastPrice: tick.quote,
          timestamp: new Date(tick.epoch * 1000).toLocaleTimeString()
        });
      }
    });
    
    return unsubscribe;
  }, [market.symbol]);

  const extractLastDigit = (quote) => {
    const str = quote.toString();
    const parts = str.split('.');
    const decimal = parts.length > 1 ? parts[1] : parts[0];
    return parseInt(decimal.slice(-1));
  };

  const getSignalColor = (signal) => {
    if (signal === 'rise' || signal === 'over_4') return '#00ff9d';
    if (signal === 'fall' || signal === 'under_5') return '#ff3232';
    return '#666';
  };

  return (
    <div className="market-card" onClick={() => onSelect(market)}>
      <div className="market-header">
        <h4>{market.name}</h4>
        <span className={`flow-badge ${flowState}`}>{flowState.toUpperCase()}</span>
      </div>
      
      <div className="market-data">
        <div className="price-display">
          <span className="price">{signals.lastPrice || '--'}</span>
          <span className="last-digit">[{lastDigit !== null ? lastDigit : '--'}]</span>
        </div>
        
        <div className="signals-grid">
          <div className="signal-item">
            <span className="signal-label">Rise/Fall:</span>
            <span className="signal-value" style={{ color: getSignalColor(signals.kinematic?.signal) }}>
              {signals.kinematic?.signal?.toUpperCase() || '--'}
            </span>
          </div>
          
          <div className="signal-item">
            <span className="signal-label">Over/Under:</span>
            <span className="signal-value" style={{ color: getSignalColor(signals.gaussian?.signal) }}>
              {signals.gaussian?.signal?.replace('_', ' ')?.toUpperCase() || '--'}
            </span>
          </div>
          
          <div className="signal-item">
            <span className="signal-label">Flow:</span>
            <span className="signal-value" style={{ 
              color: flowState === 'laminar' ? '#00ff9d' : '#ff3232' 
            }}>
              {flowState.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="market-footer">
        <span className="timestamp">{signals.timestamp || '--:--:--'}</span>
        <span className="confidence">
          {signals.flow?.confidence ? `${Math.round(signals.flow.confidence * 100)}%` : '--%'}
        </span>
      </div>
    </div>
  );
};

// ========== MAIN APP COMPONENT ==========
function App() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [balance, setBalance] = useState({ real: 0, demo: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [isRealAccount, setIsRealAccount] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    derivWS.connect(isRealAccount);
    
    const unsubscribeConn = derivWS.subscribe('connection', (data) => {
      setIsConnected(data.connected);
    });
    
    const unsubscribeBalance = derivWS.subscribe('balance', (data) => {
      if (isRealAccount) {
        setBalance(prev => ({ ...prev, real: data.balance }));
      } else {
        setBalance(prev => ({ ...prev, demo: data.balance }));
      }
    });
    
    geminiAI.initialize();
    
    return () => {
      unsubscribeConn();
      unsubscribeBalance();
      derivWS.disconnect();
    };
  }, [isRealAccount]);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleMarketSelect = (market) => {
    setSelectedMarket(market);
    derivWS.subscribeTicks(market.symbol);
    startCountdown();
  };

  const toggleAccountType = () => {
    setIsRealAccount(!isRealAccount);
    derivWS.disconnect();
  };

  // ========== STYLES ==========
  const styles = `
    .app {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0a0a0a;
      color: #00ff9d;
      font-family: 'Segoe UI', 'Roboto Mono', monospace;
      overflow: hidden;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 25px;
      background: linear-gradient(90deg, #000 0%, #1a1a2e 100%);
      border-bottom: 1px solid #00ff9d;
      box-shadow: 0 0 20px rgba(0, 255, 157, 0.1);
    }
    
    .logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 2px;
      background: linear-gradient(45deg, #00ff9d, #00b3ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .status-dot.connected {
      background: #00ff9d;
      box-shadow: 0 0 10px #00ff9d;
      animation: pulse 2s infinite;
    }
    
    .status-dot.disconnected {
      background: #ff3232;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    .balance-display {
      display: flex;
      gap: 20px;
      margin-right: 20px;
    }
    
    .balance {
      padding: 8px 15px;
      border-radius: 5px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(0, 255, 157, 0.3);
    }
    
    .balance.real {
      border-color: #00ff9d;
    }
    
    .balance .label {
      font-size: 10px;
      opacity: 0.7;
      margin-right: 5px;
    }
    
    .balance .amount {
      font-size: 14px;
      font-weight: 700;
    }
    
    .account-toggle {
      background: rgba(0, 255, 157, 0.1);
      border: 1px solid #00ff9d;
      color: #00ff9d;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.3s;
    }
    
    .account-toggle:hover {
      background: rgba(0, 255, 157, 0.2);
    }
    
    .account-toggle.real {
      background: rgba(255, 50, 50, 0.1);
      border-color: #ff3232;
      color: #ff3232;
    }
    
    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .sidebar {
      width: 250px;
      background: #0a0a0a;
      border-right: 1px solid rgba(0, 255, 157, 0.1);
      padding: 20px;
      overflow-y: auto;
    }
    
    .nav-section {
      margin-bottom: 30px;
    }
    
    .nav-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(0, 255, 157, 0.5);
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(0, 255, 157, 0.1);
    }
    
    .nav-menu {
      list-style: none;
    }
    
    .nav-item {
      padding: 12px 15px;
      margin: 5px 0;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 14px;
    }
    
    .nav-item:hover {
      background: rgba(0, 255, 157, 0.1);
    }
    
    .nav-item.active {
      background: rgba(0, 255, 157, 0.2);
      border-left: 3px solid #00ff9d;
    }
    
    .ai-announcer {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 255, 157, 0.2);
      border-radius: 8px;
      padding: 15px;
    }
    
    .ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .ai-header h3 {
      font-size: 14px;
      margin: 0;
    }
    
    .ai-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .mute-btn {
      background: rgba(0, 255, 157, 0.1);
      border: 1px solid #00ff9d;
      color: #00ff9d;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .mute-btn.muted {
      background: rgba(255, 50, 50, 0.1);
      border-color: #ff3232;
      color: #ff3232;
    }
    
    .ai-controls input[type="range"] {
      width: 60px;
      height: 4px;
      background: rgba(0, 255, 157, 0.2);
      border-radius: 2px;
    }
    
    .volume-text {
      font-size: 11px;
      width: 30px;
      text-align: center;
    }
    
    .test-btn {
      padding: 5px 10px;
      background: rgba(0, 255, 157, 0.1);
      border: 1px solid #00ff9d;
      color: #00ff9d;
      border-radius: 3px;
      font-size: 10px;
      cursor: pointer;
    }
    
    .test-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .ai-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      margin-top: 10px;
    }
    
    .status.speaking {
      color: #00ff9d;
      animation: blink 1s infinite;
    }
    
    .hotkey {
      color: rgba(0, 255, 157, 0.5);
    }
    
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .market-feed {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
    
    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .feed-header h2 {
      font-size: 18px;
      font-weight: 600;
    }
    
    .market-stats {
      display: flex;
      gap: 20px;
    }
    
    .stat {
      padding: 5px 10px;
      background: rgba(0, 255, 157, 0.1);
      border-radius: 3px;
      font-size: 12px;
    }
    
    .markets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
    }
    
    .market-card {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      border: 1px solid rgba(0, 255, 157, 0.2);
      border-radius: 10px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .market-card:hover {
      border-color: #00ff9d;
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(0, 255, 157, 0.1);
    }
    
    .market-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .market-header h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }
    
    .flow-badge {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    
    .flow-badge.laminar {
      background: rgba(0, 255, 157, 0.2);
      color: #00ff9d;
    }
    
    .flow-badge.turbulent {
      background: rgba(255, 50, 50, 0.2);
      color: #ff3232;
    }
    
    .flow-badge.transitional {
      background: rgba(255, 200, 50, 0.2);
      color: #ffc832;
    }
    
    .market-data {
      margin-bottom: 15px;
    }
    
    .price-display {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .price {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }
    
    .last-digit {
      font-size: 18px;
      color: rgba(0, 255, 157, 0.7);
      background: rgba(0, 255, 157, 0.1);
      padding: 2px 8px;
      border-radius: 5px;
    }
    
    .signals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    
    .signal-item {
      display: flex;
      flex-direction: column;
    }
    
    .signal-label {
      font-size: 10px;
      color: rgba(0, 255, 157, 0.7);
      margin-bottom: 2px;
    }
    
    .signal-value {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    
    .market-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid rgba(0, 255, 157, 0.1);
      font-size: 10px;
    }
    
    .timestamp {
      color: rgba(0, 255, 157, 0.5);
    }
    
    .confidence {
      font-weight: 700;
      color: #00ff9d;
    }
    
    .selected-panel {
      width: 300px;
      background: #0a0a0a;
      border-left: 1px solid rgba(0, 255, 157, 0.1);
      padding: 20px;
    }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(0, 255, 157, 0.1);
    }
    
    .panel-header h3 {
      font-size: 16px;
      margin: 0;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: #00ff9d;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    
    .close-btn:hover {
      background: rgba(0, 255, 157, 0.1);
    }
    
    .digit-display {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .digit-circle {
      width: 100px;
      height: 100px;
      border: 3px solid #00ff9d;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
      background: rgba(0, 255, 157, 0.1);
    }
    
    .digit {
      font-size: 36px;
      font-weight: 700;
      color: #00ff9d;
    }
    
    .digit-label {
      font-size: 10px;
      color: rgba(0, 255, 157, 0.7);
      margin-top: 5px;
    }
    
    .digit-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .stat-label {
      font-size: 9px;
      color: rgba(0, 255, 157, 0.7);
      margin-bottom: 3px;
    }
    
    .stat-value {
      font-size: 12px;
      font-weight: 700;
    }
    
    .stat-value.laminar {
      color: #00ff9d;
    }
    
    .signal-actions {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 15px;
    }
    
    .signal-actions h4 {
      font-size: 12px;
      margin: 0 0 15px 0;
      color: rgba(0, 255, 157, 0.7);
      text-align: center;
    }
    
    .signals-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .signal-action {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      background: rgba(0, 255, 157, 0.05);
      border-radius: 5px;
    }
    
    .signal-name {
      font-size: 12px;
      font-weight: 600;
      flex: 1;
    }
    
    .trade-btn {
      padding: 5px 10px;
      border: none;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      margin: 0 10px;
    }
    
    .trade-btn.buy {
      background: rgba(0, 255, 157, 0.2);
      color: #00ff9d;
    }
    
    .trade-btn.sell {
      background: rgba(255, 50, 50, 0.2);
      color: #ff3232;
    }
    
    .trade-btn:hover {
      transform: translateY(-1px);
      opacity: 0.9;
    }
    
    .signal-confidence {
      font-size: 10px;
      font-weight: 700;
      color: #00ff9d;
    }
    
    .countdown-box {
      text-align: center;
      padding: 15px;
      background: rgba(0, 255, 157, 0.1);
      border-radius: 5px;
    }
    
    .countdown-text {
      font-size: 10px;
      color: rgba(0, 255, 157, 0.7);
      margin-bottom: 5px;
    }
    
    .countdown-number {
      font-size: 36px;
      font-weight: 700;
      color: #00ff9d;
      animation: pulse 1s infinite;
    }
    
    .footer {
      padding: 10px 25px;
      background: rgba(0, 0, 0, 0.5);
      border-top: 1px solid rgba(0, 255, 157, 0.1);
    }
    
    .status-bar {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: rgba(0, 255, 157, 0.7);
    }
    
    .status-item {
      padding: 3px 10px;
      background: rgba(0, 255, 157, 0.1);
      border-radius: 3px;
    }
    
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #00ff9d;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #00cc7a;
    }
  `;

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerHTML = styles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="logo">ZION TRADING LAB</h1>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
        </div>
        
        <div className="header-right">
          <div className="balance-display">
            <div className="balance real">
              <span className="label">REAL:</span>
              <span className="amount">${balance.real.toFixed(2)}</span>
            </div>
            <div className="balance demo">
              <span className="label">DEMO:</span>
              <span className="amount">${balance.demo.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            className={`account-toggle ${isRealAccount ? 'real' : 'demo'}`}
            onClick={toggleAccountType}
          >
            {isRealAccount ? '🔄 DEMO' : '🔄 REAL'}
          </button>
        </div>
      </header>

      <div className="main-content">
        <nav className="sidebar">
          <div className="nav-section">
            <h3 className="nav-title">STRATEGY LABS</h3>
            <ul className="nav-menu">
              <li className="nav-item active">🏠 Master Hub</li>
              <li className="nav-item">🚀 Momentum Lab</li>
              <li className="nav-item">🌀 Entropy Station</li>
              <li className="nav-item">⚖️ Gravity Zone</li>
              <li className="nav-item">🎯 Resonance Pulse</li>
              <li className="nav-item">🛡️ Risk Controller</li>
            </ul>
          </div>
          
          <div className="nav-section">
            <h3 className="nav-title">AI VOICE</h3>
            <AIAnnouncer 
              signal={selectedMarket ? { type: 'test', direction: 'TEST', confidence: 0.8 } : null}
              market={selectedMarket?.name}
              countdown={countdown}
            />
          </div>
        </nav>

        <main className="market-feed">
          <div className="feed-header">
            <h2>VOLATILITY INDICES</h2>
            <div className="market-stats">
              <span className="stat">Active: {CONFIG.deriv.markets.length}</span>
              <span className="stat">Laminar: 0</span>
              <span className="stat">Signals: 0</span>
            </div>
          </div>
          
          <div className="markets-grid">
            {CONFIG.deriv.markets.map(market => (
              <MarketCard 
                key={market.symbol}
                market={market}
                onSelect={handleMarketSelect}
              />
            ))}
          </div>
        </main>

        {selectedMarket && (
          <aside className="selected-panel">
            <div className="panel-header">
              <h3>{selectedMarket.name}</h3>
              <button className="close-btn" onClick={() => setSelectedMarket(null)}>×</button>
            </div>
            
            <div className="panel-content">
              <div className="digit-display">
                <div className="digit-circle">
                  <span className="digit">--</span>
                  <span className="digit-label">Last Digit</span>
                </div>
                
                <div className="digit-stats">
                  <div className="stat-item">
                    <span className="stat-label">Flow State</span>
                    <span className="stat-value laminar">LAMINAR</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Confidence</span>
                    <span className="stat-value">85%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Mean</span>
                    <span className="stat-value">4.8</span>
                  </div>
                </div>
              </div>
              
              <div className="signal-actions">
                <h4>ACTIVE SIGNALS</h4>
                <div className="signals-list">
                  <div className="signal-action">
                    <span className="signal-name">RISE</span>
                    <button className="trade-btn buy">BUY RISE</button>
                    <span className="signal-confidence">78%</span>
                  </div>
                  <div className="signal-action">
                    <span className="signal-name">UNDER 5</span>
                    <button className="trade-btn sell">BUY UNDER</button>
                    <span className="signal-confidence">65%</span>
                  </div>
                  <div className="signal-action">
                    <span className="signal-name">ODD</span>
                    <button className="trade-btn buy">BUY ODD</button>
                    <span className="signal-confidence">72%</span>
                  </div>
                </div>
                
                {countdown && (
                  <div className="countdown-box">
                    <div className="countdown-text">TRADING IN</div>
                    <div className="countdown-number">{countdown}</div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      <footer className="footer">
        <div className="status-bar">
          <span className="status-item">ZION v2.0</span>
          <span className="status-item">ENGINE: ACTIVE</span>
          <span className="status-item">APP ID: {CONFIG.deriv.appId}</span>
          <span className="status-item">SYNC: {isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
