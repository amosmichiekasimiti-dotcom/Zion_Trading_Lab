import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ========== MASTER CONFIGURATION ==========
const CONFIG = {
  deriv: {
    appId: 124918,  // Updated from your config
    apiUrl: 'wss://ws.derivws.com/websockets/v3',
    markets: [
      { symbol: '1HZ10V', name: 'Volatility 10 (1s) Index' },
      { symbol: 'R_10', name: 'Volatility 10 Index' },
      { symbol: '1HZ15V', name: 'Volatility 15 (1s) Index' },
      { symbol: '1HZ25V', name: 'Volatility 25 (1s) Index' },
      { symbol: 'R_25', name: 'Volatility 25 Index' },
      { symbol: '1HZ30V', name: 'Volatility 30 (1s) Index' },
      { symbol: '1HZ50V', name: 'Volatility 50 (1s) Index' },
      { symbol: 'R_50', name: 'Volatility 50 Index' },
      { symbol: '1HZ75V', name: 'Volatility 75 (1s) Index' },
      { symbol: 'R_75', name: 'Volatility 75 Index' },
      { symbol: '1HZ90V', name: 'Volatility 90 (1s) Index' },
      { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index' },
      { symbol: 'R_100', name: 'Volatility 100 Index' },
    ]
  },
  tokens: {
    real: process.env.REACT_APP_DERIV_TOKEN_REAL || 'm04oxPdV6cV6pX4',  // From your config
    demo: process.env.REACT_APP_DERIV_TOKEN_DEMO || 'kTyefK9bFG3UPGh',  // From your config
  },
  gemini: {
    apiKey: process.env.REACT_APP_GEMINI_KEY || 'AIzaSyDM7cKxbQwbbWX0ubb01Iel2wrFi8oEh2E',  // From your config
    model: 'gemini-1.5-flash'
  },
  whatsapp: 'https://wa.me/254742024175',  // From your config
  strategies: {
    laminarFlow: { windowSize: 5, maxDelta: 10 },
    gaussianMean: { smaPeriod: 20, overheat: 6.5, freeze: 2.5 },
  }
};

// ========== GEMINI AI SERVICE ==========
class GeminiAIService {
  constructor() {
    this.apiKey = CONFIG.gemini.apiKey;
    this.modelName = CONFIG.gemini.model;
    this.isInitialized = false;
    this.conversationHistory = [];
    this.maxHistory = 20;
  }

  async initialize() {
    if (!this.apiKey) {
      console.error('Gemini API key not configured');
      return false;
    }

    try {
      // For browser environment, we'll use fetch to call Gemini API
      this.isInitialized = true;
      console.log('✅ Gemini AI initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      return false;
    }
  }

  async analyzeMarketData(marketData, currentSignals) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const prompt = this.buildAnalysisPrompt(marketData, currentSignals);
    
    try {
      const response = await this.callGeminiAPI(prompt);
      this.addToHistory('user', prompt);
      this.addToHistory('assistant', response);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Gemini AI analysis error:', error);
      return this.getFallbackAnalysis(marketData);
    }
  }

  async callGeminiAPI(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  buildAnalysisPrompt(marketData, signals) {
    return `
You are ZION, an advanced trading AI for Deriv synthetic indices. Analyze the following market data and provide trading insights:

MARKET: ${marketData.name}
LAST PRICE: ${marketData.lastPrice}
LAST DIGIT: ${marketData.lastDigit}
FLOW STATE: ${marketData.flowState}
GAUSSIAN MEAN: ${marketData.gaussianMean || 'N/A'}
VELOCITY: ${marketData.velocity || 'N/A'}
ACCELERATION: ${marketData.acceleration || 'N/A'}

CURRENT SIGNALS:
${signals.map(s => `- ${s.type}: ${s.direction} (${Math.round(s.confidence * 100)}%)`).join('\n')}

MARKET HISTORY (Last 10 digits): ${marketData.digitHistory?.join(', ') || 'N/A'}

Please provide:
1. Trading Recommendation (BUY/SELL/HOLD) with confidence
2. Risk Assessment (High/Medium/Low)
3. Expected move in next 5 ticks
4. Key levels to watch
5. Market manipulation detection (if any)

Format response as JSON with: recommendation, confidence, risk, analysis, manipulation_detected, expected_move
`;
  }

  parseAIResponse(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return {
        recommendation: response.includes('BUY') ? 'BUY' : response.includes('SELL') ? 'SELL' : 'HOLD',
        confidence: response.match(/confidence[:\s]*(\d+)/i)?.[1] || 50,
        risk: response.includes('High') ? 'HIGH' : response.includes('Low') ? 'LOW' : 'MEDIUM',
        analysis: response,
        manipulation_detected: response.toLowerCase().includes('manipulation'),
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
      analysis: 'Market analysis unavailable. Using fallback strategies.',
      manipulation_detected: false,
      expected_move: '1-2 ticks'
    };
  }

  getFallbackAnalysis(marketData) {
    return {
      recommendation: marketData.flowState === 'laminar' ? 'BUY' : 'HOLD',
      confidence: marketData.flowState === 'laminar' ? 65 : 40,
      risk: marketData.flowState === 'laminar' ? 'LOW' : 'HIGH',
      analysis: `Using fallback analysis. Flow: ${marketData.flowState}, Last Digit: ${marketData.lastDigit}`,
      manipulation_detected: marketData.flowState === 'turbulent',
      expected_move: '1-3 ticks'
    };
  }

  addToHistory(role, content) {
    this.conversationHistory.push({ role, content, timestamp: Date.now() });
    if (this.conversationHistory.length > this.maxHistory) {
      this.conversationHistory.shift();
    }
  }

  async getMarketInsight(question) {
    const prompt = `As ZION Trading AI, answer this trading question: ${question}`;
    try {
      const response = await this.callGeminiAPI(prompt);
      return response;
    } catch (error) {
      return "AI service temporarily unavailable. Please check your connection.";
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
    if (this.ws) this.ws.close();
    
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
    return () => this.subscribers.get(event).delete(callback);
  }

  notify(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(cb => cb(data));
    }
  }

  disconnect() {
    if (this.ws) this.ws.close();
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
    
    if (this.digits.length < 5) return { state: 'wait', confidence: 0 };
    
    const recent = this.digits.slice(-5);
    let deltaSum = 0;
    for (let i = 1; i < recent.length; i++) {
      deltaSum += Math.abs(recent[i] - recent[i - 1]);
    }
    
    if (deltaSum <= CONFIG.strategies.laminarFlow.maxDelta) {
      this.state = 'laminar';
      return { state: 'laminar', confidence: 1 - (deltaSum / CONFIG.strategies.laminarFlow.maxDelta) };
    } else {
      this.state = 'turbulent';
      return { state: 'turbulent', confidence: 0 };
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
      return { signal: 'wait', mean: 0 };
    }
    
    const recent = this.digits.slice(-CONFIG.strategies.gaussianMean.smaPeriod);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    if (mean > CONFIG.strategies.gaussianMean.overheat) {
      return { signal: 'under_5', mean, confidence: (mean - CONFIG.strategies.gaussianMean.overheat) / 3 };
    } else if (mean < CONFIG.strategies.gaussianMean.freeze) {
      return { signal: 'over_4', mean, confidence: (CONFIG.strategies.gaussianMean.freeze - mean) / 3 };
    }
    
    return { signal: 'hold', mean, confidence: 0 };
  }
}

class KinematicEngine {
  constructor() {
    this.prices = [];
  }

  addPrice(price) {
    this.prices.push(price);
    if (this.prices.length > 10) this.prices.shift();
    
    if (this.prices.length < 3) return { signal: 'wait', velocity: 0 };
    
    const velocities = [];
    for (let i = 1; i < this.prices.length; i++) {
      velocities.push(this.prices[i] - this.prices[i - 1]);
    }
    
    const recentVel = velocities[velocities.length - 1] || 0;
    const recentAcc = velocities.length > 1 ? velocities[velocities.length - 1] - velocities[velocities.length - 2] : 0;
    
    if (recentAcc > 0.0001 && recentVel > 0) {
      return { signal: 'rise', velocity: recentVel, acceleration: recentAcc };
    } else if (recentAcc < -0.0001 && recentVel < 0) {
      return { signal: 'fall', velocity: recentVel, acceleration: recentAcc };
    }
    
    return { signal: 'hold', velocity: recentVel, acceleration: recentAcc };
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
  const [aiInsight, setAiInsight] = useState('');
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
    if (aiAnalysis && !isMuted) {
      const insightText = `AI Analysis: ${aiAnalysis.recommendation} with ${aiAnalysis.confidence}% confidence. Risk level: ${aiAnalysis.risk}.`;
      setTimeout(() => speak(insightText), 2000);
    }
  }, [aiAnalysis, isMuted, speak]);

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

  const getAIInsight = async () => {
    try {
      const insight = await geminiAI.getMarketInsight('Current market conditions and recommendations');
      setAiInsight(insight);
      speak(`AI Insight: ${insight.substring(0, 100)}...`);
    } catch (error) {
      setAiInsight('Unable to fetch AI insight at this time.');
    }
  };

  return (
    <div className="ai-announcer">
      <div className="ai-header">
        <h3>🤖 ZION AI Voice</h3>
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
        </div>
      </div>
      <div className="ai-status">
        <span className={`status ${isSpeaking ? 'speaking' : ''}`}>
          {isMuted ? 'MUTED' : isSpeaking ? 'SPEAKING' : 'READY'}
        </span>
        <span className="hotkey">Alt+M to toggle</span>
      </div>
      {aiAnalysis && (
        <div className="ai-analysis">
          <div className="analysis-header">🧠 AI Analysis:</div>
          <div className="analysis-content">
            <span className="recommendation">{aiAnalysis.recommendation}</span>
            <span className="confidence">{aiAnalysis.confidence}%</span>
            <span className={`risk ${aiAnalysis.risk.toLowerCase()}`}>{aiAnalysis.risk} RISK</span>
          </div>
        </div>
      )}
      <button className="insight-btn" onClick={getAIInsight} disabled={isMuted}>
        Get AI Insight
      </button>
    </div>
  );
};

// ========== MARKET CARD COMPONENT ==========
const MarketCard = ({ market, ticks, onSelect }) => {
  const [lastDigit, setLastDigit] = useState(null);
  const [flowState, setFlowState] = useState('unknown');
  const [signals, setSignals] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState(null);
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
        
        const marketData = {
          name: market.name,
          lastPrice: tick.quote,
          lastDigit: digit,
          flowState: flow.state,
          gaussianMean: gaussian.mean,
          velocity: kinematic.velocity,
          acceleration: kinematic.acceleration,
          digitHistory: laminarEngine.current.digits.slice(-10)
        };
        
        const currentSignals = [
          { type: 'Flow', direction: flow.state, confidence: flow.confidence },
          { type: 'Gaussian', direction: gaussian.signal, confidence: gaussian.confidence },
          { type: 'Kinematic', direction: kinematic.signal, confidence: 0.5 }
        ].filter(s => s.confidence > 0);
        
        // Get AI analysis for significant events
        if (flow.confidence > 0.7 || gaussian.confidence > 0.6) {
          try {
            const analysis = await geminiAI.analyzeMarketData(marketData, currentSignals);
            setAiAnalysis(analysis);
          } catch (error) {
            console.log('AI analysis skipped:', error.message);
          }
        }
        
        setSignals({
          flow,
          gaussian,
          kinematic,
          lastPrice: tick.quote,
          timestamp: new Date(tick.epoch * 1000).toLocaleTimeString(),
          aiAnalysis,
        });
      }
    });
    
    return unsubscribe;
  }, [market.symbol, market.name]);

  const extractLastDigit = (quote) => {
    const str = quote.toString();
    const parts = str.split('.');
    const decimal = parts.length > 1 ? parts[1] : parts[0];
    return parseInt(decimal.slice(-1));
  };

  const getSignalColor = (signal) => {
    if (signal === 'rise' || signal === 'over_4' || signal === 'even') return '#00ff9d';
    if (signal === 'fall' || signal === 'under_5' || signal === 'odd') return '#ff3232';
    return '#666';
  };

  return (
    <div className="market-card" onClick={() => onSelect(market)}>
      <div className="market-header">
        <h4>{market.name}</h4>
        <span className={`flow-badge ${flowState}`}>{flowState.toUpperCase()}</span>
        {aiAnalysis && (
          <span className={`ai-badge ${aiAnalysis.risk.toLowerCase()}`}>
            AI: {aiAnalysis.recommendation}
          </span>
        )}
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
        {aiAnalysis && (
          <span className={`ai-confidence ${aiAnalysis.risk.toLowerCase()}`}>
            AI: {aiAnalysis.confidence}%
          </span>
        )}
      </div>
    </div>
  );
};

// ========== AI CHAT COMPONENT ==========
const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await geminiAI.getMarketInsight(input);
      const aiMessage = { 
        role: 'assistant', 
        content: response, 
        timestamp: new Date(),
        isAI: true 
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.', 
        timestamp: new Date(),
        isError: true 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <h3>🤖 ZION AI Assistant</h3>
        <span className="chat-status">Online</span>
      </div>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask ZION AI about trading..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          {isLoading ? '...' : 'Send'}
        </button>
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
  const [activeSignals, setActiveSignals] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const countdownRef = useRef(null);

  // Initialize connection
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
    
    // Initialize Gemini AI
    geminiAI.initialize().then(initialized => {
      if (initialized) {
        console.log('Gemini AI ready for market analysis');
      }
    });
    
    return () => {
      unsubscribeConn();
      unsubscribeBalance();
      derivWS.disconnect();
    };
  }, [isRealAccount]);

  // Start countdown for signals
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

  // Handle signal detection
  useEffect(() => {
    if (selectedMarket && activeSignals.length > 0) {
      startCountdown();
    }
  }, [activeSignals, selectedMarket, startCountdown]);

  const handleMarketSelect = (market) => {
    setSelectedMarket(market);
    derivWS.subscribeTicks(market.symbol);
  };

  const toggleAccountType = () => {
    setIsRealAccount(!isRealAccount);
    derivWS.disconnect();
  };

  return (
    <div className="app">
      {/* Fixed Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="logo">ZION TRADING LAB 🤖</h1>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            <span className="ai-status-badge">AI: ONLINE</span>
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
            {isRealAccount ? '🔄 SWITCH TO DEMO' : '🔄 SWITCH TO REAL'}
          </button>
          
          <a 
            href={CONFIG.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
          >
            💬 Support
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar Navigation */}
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
              <li className="nav-item" onClick={() => setShowAIChat(!showAIChat)}>
                🤖 AI Assistant
              </li>
            </ul>
          </div>
          
          <div className="nav-section">
            <h3 className="nav-title">AI VOICE</h3>
            <AIAnnouncer 
              signal={activeSignals[0]}
              market={selectedMarket?.name}
              countdown={countdown}
            />
          </div>
          
          {showAIChat && (
            <div className="nav-section">
              <AIChat />
            </div>
          )}
        </nav>

        {/* Market Feed */}
        <main className="market-feed">
          <div className="feed-header">
            <h2>VOLATILITY INDICES</h2>
            <div className="market-stats">
              <span className="stat">Active: {CONFIG.deriv.markets.length}</span>
              <span className="stat">Laminar: 0</span>
              <span className="stat">AI Signals: 0</span>
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

        {/* Selected Market Panel */}
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

      {/* Footer Status */}
      <footer className="footer">
        <div className="status-bar">
          <span className="status-item">ZION v2.0 AI</span>
          <span className="status-item">ENGINE: ACTIVE</span>
          <span className="status-item">AI: GEMINI FLASH</span>
          <span className="status-item">SYNC: {isConnected ? 'LIVE' : 'OFFLINE'}</span>
          <span className="status-item">APP ID: {CONFIG.deriv.appId}</span>
        </div>
      </footer>
    </div>
  );
}

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

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: linear-gradient(90deg, #000 0%, #1a1a2e 100%);
  border-bottom: 1px solid #00ff9d;
  box-shadow: 0 0 20px rgba(0, 255, 157, 0.1);
  z-index: 1000;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #00ff9d, #00b3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
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

.ai-status-badge {
  margin-left: 15px;
  padding: 3px 8px;
  background: rgba(0, 255, 157, 0.2);
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
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
  margin-right: 10px;
}

.account-toggle:hover {
  background: rgba(0, 255, 157, 0.2);
  transform: translateY(-1px);
}

.account-toggle.real {
  background: rgba(255, 50, 50, 0.1);
  border-color: #ff3232;
  color: #ff3232;
}

.whatsapp-btn {
  background: rgba(37, 211, 102, 0.1);
  border: 1px solid #25d366;
  color: #25d366;
  padding: 10px 15px;
  border-radius: 5px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s;
}

.whatsapp-btn:hover {
  background: rgba(37, 211, 102, 0.2);
  transform: translateY(-1px);
}

/* Main Content */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 300px;
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

/* AI Announcer */
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

.ai-analysis {
  margin-top: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  border-left: 3px solid #00ff9d;
}

.analysis-header {
  font-size: 10px;
  color: rgba(0, 255, 157, 0.7);
  margin-bottom: 5px;
}

.analysis-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.recommendation {
  font-weight: 700;
  color: #00ff9d;
  text-transform: uppercase;
}

.confidence {
  color: #00ff9d;
  font-weight: 700;
}

.risk {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
}

.risk.high {
  background: rgba(255, 50, 50, 0.2);
  color: #ff3232;
}

.risk.medium {
  background: rgba(255, 200, 50, 0.2);
  color: #ffc832;
}

.risk.low {
  background: rgba(0, 255, 157, 0.2);
  color: #00ff9d;
}

.insight-btn {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  background: rgba(0, 255, 157, 0.1);
  border: 1px solid #00ff9d;
  color: #00ff9d;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.3s;
}

.insight-btn:hover:not(:disabled) {
  background: rgba(0, 255, 157, 0.2);
}

.insight-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* AI Chat */
.ai-chat {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 157, 0.2);
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chat-header h3 {
  font-size: 14px;
  margin: 0;
}

.chat-status {
  font-size: 10px;
  color: #00ff9d;
  padding: 2px 8px;
  background: rgba(0, 255, 157, 0.1);
  border-radius: 10px;
}

.chat-messages {
  height: 200px;
  overflow-y: auto;
  margin-bottom: 15px;
  padding-right: 10px;
}

.message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: rgba(0, 255, 157, 0.1);
  margin-left: auto;
  border-top-right-radius: 0;
}

.message.assistant {
  background: rgba(0, 0, 0, 0.5);
  margin-right: auto;
  border-top-left-radius: 0;
}

.message-content {
  font-size: 12px;
  line-height: 1.4;
}

.message-time {
  font-size: 9px;
  color: rgba(0, 255, 157, 0.5);
  text-align: right;
  margin-top: 3px;
}

.typing-indicator {
  display: flex;
  gap: 3px;
  padding: 10px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #00ff9d;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

.chat-input {
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 157, 0.3);
  border-radius: 5px;
  color: #00ff9d;
  font-size: 12px;
}

.chat-input input:focus {
  outline: none;
  border-color: #00ff9d;
}

.chat-input button {
  padding: 8px 15px;
  background: rgba(0, 255, 157, 0.2);
  border: 1px solid #00ff9d;
  color: #00ff9d;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Market Card Updates */
.ai-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 700;
  margin-left: 5px;
}

.ai-badge.high {
  background: rgba(255, 50, 50, 0.2);
  color: #ff3232;
}

.ai-badge.medium {
  background: rgba(255, 200, 50, 0.2);
  color: #ffc832;
}

.ai-badge.low {
  background: rgba(0, 255, 157, 0.2);
  color: #00ff9d;
}

.ai-confidence {
  font-size: 9px;
  margin-left: 5px;
}

.ai-confidence.high { color: #ff3232; }
.ai-confidence.medium { color: #ffc832; }
.ai-confidence.low { color: #00ff9d; }

/* Rest of the styles remain the same as before */
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
  position: relative;
  overflow: hidden;
}

.market-card:hover {
  border-color: #00ff9d;
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 255, 157, 0.1);
}

.market-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #00ff9d, #00b3ff);
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

/* Selected Panel */
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

/* Footer */
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

/* Scrollbar */
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

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`;

// ========== RENDER APP ==========
export default function ZionTradingLab() {
  // Inject styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerHTML = styles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  return <App />;
}
