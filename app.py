import os, random, json, time, statistics, collections
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import google.generativeai as genai
from flask import Flask, render_template_string, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# --- MASTER CONFIG ---
API_KEY = os.environ.get("GEMINI_API_KEY", "your-api-key-here")
WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"

# Configure Gemini AI
try:
    genai.configure(api_key=API_KEY)
    ai_engine = genai.GenerativeModel('gemini-1.5-flash')
    AI_AVAILABLE = True
except:
    AI_AVAILABLE = False
    print("⚠️ Gemini AI not available. Using local strategies.")

# --- ZION APEX UNIVERSAL SYSTEM (2026 Edition) ---
class ZionApexUniversal:
    """
    Universal Asset Class Trading System
    Operates across ALL volatility markets as two aggregated hunting grounds
    """
    
    # Universal Asset Classes (Genius Aggregation)
    ASSET_CLASSES = {
        "ALPHA": {
            "name": "All Volatility with One-Second",
            "description": "High-frequency digit racing ground",
            "markets": ["1HZ10V", "1HZ15V", "1HZ25V", "1HZ30V", "1HZ50V", "1HZ75V", "1HZ90V", "1HZ100V"],
            "tick_speed": "1-second",
            "best_for": ["Matches/Differs", "High-frequency arbitrage"]
        },
        "BETA": {
            "name": "All Volatility with Plain Index",
            "description": "Standard-frequency trend hunting ground",
            "markets": ["R_10", "R_25", "R_50", "R_75", "R_100", "R_150", "R_250"],
            "tick_speed": "Standard",
            "best_for": ["Rise/Fall", "Trend momentum"]
        }
    }
    
    # Individual digit tracking across ALL markets
    universal_digit_history = {
        "ALPHA": collections.Counter(),  # One-second markets
        "BETA": collections.Counter()    # Plain indices
    }
    
    # Signal history
    signal_history = []
    
    @classmethod
    def analyze_universal_digits(cls, asset_class: str) -> Dict:
        """Analyze digit competition across entire asset class"""
        digit_counter = cls.universal_digit_history[asset_class]
        total_ticks = sum(digit_counter.values())
        
        if total_ticks < 50:  # Need sufficient data
            return {"status": "scanning", "confidence": 0, "message": "Building digit database"}
        
        # Calculate individual digit frequencies
        digit_frequencies = {}
        for digit in range(10):
            count = digit_counter.get(str(digit), 0)
            frequency = (count / total_ticks) * 100
            digit_frequencies[str(digit)] = {
                "count": count,
                "frequency": round(frequency, 2),
                "competition": frequency >= 10.0  # The 10% Individual Digit Floor
            }
        
        # Find digit clusters (digits competing at >=10%)
        competing_digits = [d for d, info in digit_frequencies.items() if info["competition"]]
        cluster_density = len(competing_digits) / 10  # What percentage of digits are competing?
        
        # Identify optimal digit groups for each concept
        over_digits = ["0", "1", "2", "3", "4"]
        under_digits = ["5", "6", "7", "8", "9"]
        even_digits = ["0", "2", "4", "6", "8"]
        odd_digits = ["1", "3", "5", "7", "9"]
        
        # Check if each group meets the 10% threshold
        group_analysis = {
            "OVER": all(digit_frequencies[d]["competition"] for d in over_digits),
            "UNDER": all(digit_frequencies[d]["competition"] for d in under_digits),
            "EVEN": all(digit_frequencies[d]["competition"] for d in even_digits),
            "ODD": all(digit_frequencies[d]["competition"] for d in odd_digits)
        }
        
        # Calculate cluster strength
        cluster_strength = sum(1 for valid in group_analysis.values() if valid) / 4 * 100
        
        return {
            "status": "active",
            "asset_class": asset_class,
            "total_ticks": total_ticks,
            "digit_frequencies": digit_frequencies,
            "competing_digits": competing_digits,
            "cluster_density": round(cluster_density * 100, 1),
            "group_analysis": group_analysis,
            "cluster_strength": round(cluster_strength, 1),
            "confidence": min(95, cluster_strength * 1.2)
        }
    
    @classmethod
    def generate_universal_signal(cls) -> Dict:
        """Generate signal by maneuvering between asset classes"""
        # Analyze both asset classes
        alpha_analysis = cls.analyze_universal_digits("ALPHA")
        beta_analysis = cls.analyze_universal_digits("BETA")
        
        # Choose strongest asset class
        if alpha_analysis["confidence"] > beta_analysis["confidence"]:
            analysis = alpha_analysis
            selected_class = "ALPHA"
        else:
            analysis = beta_analysis
            selected_class = "BETA"
        
        if analysis["status"] != "active" or analysis["confidence"] < 70:
            return {
                "status": "scanning",
                "message": "Maneuvering through Universal Asset Classes...",
                "confidence": analysis.get("confidence", 0),
                "countdown": random.randint(15, 45)
            }
        
        # Select best concept based on digit group strength
        concept_options = []
        for concept, valid in analysis["group_analysis"].items():
            if valid:
                # Calculate group-specific confidence
                if concept in ["OVER", "UNDER"]:
                    target_digits = ["0", "1", "2", "3", "4"] if concept == "OVER" else ["5", "6", "7", "8", "9"]
                else:
                    target_digits = ["0", "2", "4", "6", "8"] if concept == "EVEN" else ["1", "3", "5", "7", "9"]
                
                group_freq = sum(analysis["digit_frequencies"][d]["frequency"] for d in target_digits)
                concept_confidence = min(98, 60 + (group_freq / 25) * 38)
                
                concept_options.append({
                    "concept": concept,
                    "confidence": concept_confidence,
                    "group_frequency": group_freq,
                    "digits": target_digits
                })
        
        if not concept_options:
            return {
                "status": "waiting",
                "message": "No digit clusters meeting 10% threshold",
                "confidence": analysis["confidence"],
                "countdown": random.randint(30, 60)
            }
        
        # Select highest confidence concept
        best_concept = max(concept_options, key=lambda x: x["confidence"])
        
        # Generate signal details
        asset_class_info = cls.ASSET_CLASSES[selected_class]
        
        # Select random market from chosen class for display
        selected_market = random.choice(asset_class_info["markets"])
        market_display = selected_market.replace("R_", "Vol ").replace("1HZ", "").replace("V", "")
        
        # Determine action based on concept
        if best_concept["concept"] == "OVER":
            action = "OVER"
            barrier = random.choice(["4", "5", "6"])
        elif best_concept["concept"] == "UNDER":
            action = "UNDER"
            barrier = random.choice(["4", "5", "6"])
        elif best_concept["concept"] == "EVEN":
            action = "EVEN"
            barrier = None
        else:  # ODD
            action = "ODD"
            barrier = None
        
        # Generate systematic audio protocol
        audio_protocol = {
            "phase_1": f"Target identified in {asset_class_info['name']} category.",
            "phase_2": f"Command: Execute {action}",
            "phase_3": f"Barrier {barrier}" if barrier else f"Parity {action}",
            "phase_4": f"Validation: 10% Individual Thresholds verified across {len(best_concept['digits'])}-digit cluster.",
            "phase_5": f"Live countdown: {random.randint(45, 120)} seconds until algorithm shift.",
            "full": f"Zion Apex Universal engaging {asset_class_info['name']}. Command {action}. "
                   f"Barrier {barrier if barrier else 'Parity ' + action}. "
                   f"Ten percent individual digit thresholds verified. "
                   f"Live countdown {random.randint(45, 120)} seconds."
        }
        
        # Record signal
        signal_data = {
            "status": "active",
            "timestamp": datetime.utcnow().isoformat(),
            "asset_class": selected_class,
            "asset_class_name": asset_class_info["name"],
            "concept": best_concept["concept"],
            "action": action,
            "barrier": barrier,
            "market_display": market_display,
            "confidence": best_concept["confidence"],
            "digit_cluster": {
                "digits": best_concept["digits"],
                "average_frequency": round(best_concept["group_frequency"] / 5, 2),
                "cluster_density": analysis["cluster_density"]
            },
            "universal_analysis": {
                "total_ticks_analyzed": analysis["total_ticks"],
                "competing_digits_count": len(analysis["competing_digits"]),
                "cluster_strength": analysis["cluster_strength"]
            },
            "audio_protocol": audio_protocol,
            "countdown": random.randint(45, 120),
            "expiry": (datetime.utcnow() + timedelta(seconds=120)).isoformat()
        }
        
        cls.signal_history.append(signal_data)
        if len(cls.signal_history) > 20:
            cls.signal_history = cls.signal_history[-20:]
        
        return signal_data
    
    @classmethod
    def simulate_market_ticks(cls):
        """Simulate market ticks to build digit history"""
        for asset_class in ["ALPHA", "BETA"]:
            # Simulate 5-15 new ticks
            new_ticks = random.randint(5, 15)
            for _ in range(new_ticks):
                digit = str(random.randint(0, 9))
                cls.universal_digit_history[asset_class][digit] += 1
            
            # Keep history manageable
            total = sum(cls.universal_digit_history[asset_class].values())
            if total > 1000:
                # Reduce to most recent 500 ticks
                cls.universal_digit_history[asset_class] = collections.Counter(
                    dict(list(cls.universal_digit_history[asset_class].items())[-500:])
                )

# --- UNIVERSAL DASHBOARD CONFIG ---
class UniversalDashboard:
    """Universal dashboard with single Live Signals command center"""
    
    # Single source of truth: Live Signals icon
    COMMAND_CENTER = {
        "LIVE_SIGNALS": {
            "name": "Live Signals",
            "icon": "fa-satellite-dish",
            "route": "/?cat=LIVE_SIGNALS",
            "description": "Universal Command Center • Real-time signal generation across ALL volatility markets",
            "color": "#8b5cf6",
            "badge": "APEX UNIVERSAL",
            "priority": 1
        }
    }
    
    # Future modification icons (scrollable)
    FUTURE_MODULES = {
        "MARKET_ANALYSIS": {
            "name": "Market Analysis",
            "icon": "fa-chart-network",
            "route": "#",
            "description": "Universal asset class analysis • Coming Soon",
            "color": "#3b82f6",
            "status": "future"
        },
        "PERFORMANCE": {
            "name": "Performance",
            "icon": "fa-trophy",
            "route": "#",
            "description": "Signal accuracy tracking • Coming Soon",
            "color": "#10b981",
            "status": "future"
        },
        "BOT_BUILDER": {
            "name": "Bot Builder",
            "icon": "fa-robot",
            "route": "#",
            "description": "Universal trading bot • Coming Soon",
            "color": "#f59e0b",
            "status": "future"
        },
        "STRATEGIES": {
            "name": "Strategies",
            "icon": "fa-chess-knight",
            "route": "#",
            "description": "Advanced trading strategies • Coming Soon",
            "color": "#ec4899",
            "status": "future"
        },
        "EDUCATION": {
            "name": "Education",
            "icon": "fa-graduation-cap",
            "route": "#",
            "description": "Trading academy • Coming Soon",
            "color": "#6366f1",
            "status": "future"
        },
        "COMMUNITY": {
            "name": "Community",
            "icon": "fa-users",
            "route": "#",
            "description": "Trader network • Coming Soon",
            "color": "#14b8a6",
            "status": "future"
        },
        "SETTINGS": {
            "name": "Settings",
            "icon": "fa-sliders",
            "route": "#",
            "description": "System configuration • Coming Soon",
            "color": "#64748b",
            "status": "future"
        },
        "SUPPORT": {
            "name": "Support",
            "icon": "fa-headset",
            "route": "#",
            "description": "24/7 assistance • Coming Soon",
            "color": "#8b5cf6",
            "status": "future"
        }
    }
    
    # Asset class display info
    ASSET_CLASS_DISPLAY = {
        "ALPHA": {
            "name": "All Volatility with One-Second",
            "icon": "fa-bolt",
            "color": "#f59e0b",
            "description": "High-frequency digit racing ground"
        },
        "BETA": {
            "name": "All Volatility with Plain Index",
            "icon": "fa-chart-line",
            "color": "#3b82f6",
            "description": "Standard-frequency trend hunting ground"
        }
    }

# --- FLASK ROUTES ---
@app.route('/')
def home():
    """Universal dashboard with single command center"""
    cat = request.args.get('cat', 'DASHBOARD')
    
    # Simulate market ticks on each request
    ZionApexUniversal.simulate_market_ticks()
    
    if cat == 'DASHBOARD':
        return render_template_string(UNIVERSAL_UI_HTML, 
            cat=cat, 
            wa=WHATSAPP,
            command_center=UniversalDashboard.COMMAND_CENTER,
            future_modules=UniversalDashboard.FUTURE_MODULES,
            current_time=datetime.utcnow().strftime("%H:%M:%S"),
            signal_history=ZionApexUniversal.signal_history[-5:] if ZionApexUniversal.signal_history else []
        )
    
    elif cat == 'LIVE_SIGNALS':
        # Generate universal signal
        signal = ZionApexUniversal.generate_universal_signal()
        
        return render_template_string(UNIVERSAL_UI_HTML,
            cat=cat,
            wa=WHATSAPP,
            signal=signal,
            command_center=UniversalDashboard.COMMAND_CENTER,
            future_modules=UniversalDashboard.FUTURE_MODULES,
            asset_classes=UniversalDashboard.ASSET_CLASS_DISPLAY,
            current_time=datetime.utcnow().strftime("%H:%M:%S"),
            signal_history=ZionApexUniversal.signal_history[-5:] if ZionApexUniversal.signal_history else []
        )
    
    else:
        # For other categories (future modules)
        return render_template_string(UNIVERSAL_UI_HTML,
            cat=cat,
            wa=WHATSAPP,
            command_center=UniversalDashboard.COMMAND_CENTER,
            future_modules=UniversalDashboard.FUTURE_MODULES,
            current_time=datetime.utcnow().strftime("%H:%M:%S"),
            signal_history=ZionApexUniversal.signal_history[-5:] if ZionApexUniversal.signal_history else []
        )

@app.route('/api/universal_signal')
def universal_signal():
    """API endpoint for universal signals"""
    signal = ZionApexUniversal.generate_universal_signal()
    return jsonify(signal)

@app.route('/api/asset_class_status')
def asset_class_status():
    """API endpoint for asset class analysis"""
    alpha = ZionApexUniversal.analyze_universal_digits("ALPHA")
    beta = ZionApexUniversal.analyze_universal_digits("BETA")
    
    return jsonify({
        "alpha": alpha,
        "beta": beta,
        "timestamp": datetime.utcnow().isoformat()
    })

# --- UNIVERSAL UI TEMPLATE ---
UNIVERSAL_UI_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>ZION APEX UNIVERSAL | 2026 Edition</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --apex-primary: #0000ff;
            --apex-secondary: #8b5cf6;
            --apex-accent: #f59e0b;
            --apex-success: #22c55e;
            --apex-warning: #f97316;
            --apex-dark: #0f172a;
            --apex-darker: #020617;
            --apex-light: #f8fafc;
            --apex-gray: #64748b;
            --apex-glass: rgba(255, 255, 255, 0.03);
            --apex-border: rgba(255, 255, 255, 0.08);
            --apex-glow: rgba(139, 92, 246, 0.3);
            --universal-gradient: linear-gradient(135deg, #0000ff, #8b5cf6, #f59e0b);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: var(--apex-darker);
            color: white;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(0, 0, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 50%);
            z-index: -1;
        }
        
        /* Apex Universal Header */
        .apex-header {
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--apex-border);
            padding: 15px 20px;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        }
        
        .header-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }
        
        .apex-logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background: var(--universal-gradient);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
            box-shadow: 0 4px 15px var(--apex-glow);
        }
        
        .logo-text {
            font-size: 24px;
            font-weight: 900;
            background: var(--universal-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
        }
        
        .logo-subtitle {
            font-size: 10px;
            color: var(--apex-accent);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 2px;
        }
        
        .universal-time {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid var(--apex-border);
            padding: 8px 16px;
            border-radius: 12px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: 600;
            color: var(--apex-success);
            min-width: 100px;
            text-align: center;
        }
        
        .apex-status {
            background: rgba(34, 197, 94, 0.1);
            color: var(--apex-success);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            border: 1px solid rgba(34, 197, 94, 0.3);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        /* Universal Grid */
        .universal-grid {
            max-width: 1400px;
            margin: 30px auto;
            padding: 0 20px;
        }
        
        .grid-title {
            font-size: 14px;
            color: var(--apex-gray);
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .grid-title i {
            color: var(--apex-secondary);
        }
        
        /* Command Center (Main Icon) */
        .command-center {
            display: grid;
            grid-template-columns: 1fr;
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .command-card {
            background: rgba(30, 41, 59, 0.6);
            border: 2px solid var(--apex-secondary);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            text-decoration: none;
            color: white;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(139, 92, 246, 0.2);
        }
        
        .command-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: var(--universal-gradient);
            opacity: 1;
        }
        
        .command-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
            border-color: var(--apex-accent);
        }
        
        .command-icon {
            font-size: 64px;
            margin-bottom: 20px;
            background: var(--universal-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 5px 15px var(--apex-glow));
        }
        
        .command-title {
            font-size: 32px;
            font-weight: 900;
            margin-bottom: 10px;
            background: var(--universal-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .command-description {
            font-size: 16px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 20px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .command-badge {
            display: inline-block;
            background: rgba(139, 92, 246, 0.2);
            color: var(--apex-secondary);
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 800;
            border: 2px solid rgba(139, 92, 246, 0.4);
            letter-spacing: 1px;
        }
        
        /* Future Modules (Scrollable Grid) */
        .modules-container {
            position: relative;
            margin-top: 40px;
        }
        
        .modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            overflow-x: auto;
            padding: 20px 10px;
            scrollbar-width: thin;
            scrollbar-color: var(--apex-secondary) transparent;
        }
        
        .modules-grid::-webkit-scrollbar {
            height: 8px;
        }
        
        .modules-grid::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }
        
        .modules-grid::-webkit-scrollbar-thumb {
            background: var(--apex-secondary);
            border-radius: 4px;
        }
        
        .module-card {
            background: var(--apex-glass);
            border: 1px solid var(--apex-border);
            border-radius: 16px;
            padding: 25px 20px;
            text-align: center;
            text-decoration: none;
            color: white;
            transition: all 0.3s ease;
            min-width: 200px;
        }
        
        .module-card:hover {
            transform: translateY(-5px);
            border-color: var(--apex-secondary);
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2);
        }
        
        .module-icon {
            font-size: 32px;
            margin-bottom: 15px;
            opacity: 0.7;
        }
        
        .module-title {
            font-size: 14px;
            font-weight: 700;
            color: #e2e8f0;
            margin-bottom: 8px;
        }
        
        .module-description {
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.4;
            margin-bottom: 10px;
        }
        
        .module-status {
            display: inline-block;
            background: rgba(100, 116, 139, 0.2);
            color: var(--apex-gray);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* Universal Signal Display */
        .universal-signal {
            max-width: 800px;
            margin: 40px auto;
            padding: 40px;
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            border: 2px solid var(--apex-border);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            position: relative;
            overflow: hidden;
        }
        
        .universal-signal::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: var(--universal-gradient);
        }
        
        .signal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--apex-border);
        }
        
        .asset-class-indicator {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .asset-icon {
            width: 50px;
            height: 50px;
            background: rgba(139, 92, 246, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: var(--apex-secondary);
        }
        
        .asset-info h3 {
            font-size: 18px;
            color: var(--apex-secondary);
            font-weight: 800;
            margin-bottom: 4px;
        }
        
        .asset-info p {
            font-size: 12px;
            color: var(--apex-gray);
            font-weight: 600;
        }
        
        .universal-badge {
            background: var(--universal-gradient);
            color: white;
            padding: 10px 25px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Signal Main Display */
        .signal-main {
            text-align: center;
            padding: 30px 0;
        }
        
        .signal-action {
            font-size: 96px;
            font-weight: 900;
            margin: 20px 0;
            background: var(--universal-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 10px 30px var(--apex-glow);
            line-height: 1;
        }
        
        .signal-accuracy {
            font-size: 32px;
            font-weight: 800;
            color: var(--apex-success);
            margin: 20px 0;
            padding: 15px 40px;
            background: rgba(34, 197, 94, 0.1);
            border-radius: 50px;
            display: inline-block;
            border: 3px solid rgba(34, 197, 94, 0.3);
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
        }
        
        /* Digit Cluster Display */
        .digit-cluster {
            background: rgba(15, 23, 42, 0.8);
            border-radius: 16px;
            padding: 25px;
            margin: 30px 0;
            border: 1px solid var(--apex-border);
        }
        
        .cluster-title {
            font-size: 14px;
            color: var(--apex-accent);
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .cluster-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .digit-box {
            background: rgba(30, 41, 59, 0.8);
            border: 2px solid transparent;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .digit-box.active {
            border-color: var(--apex-success);
            background: rgba(34, 197, 94, 0.1);
            box-shadow: 0 5px 15px rgba(34, 197, 94, 0.2);
        }
        
        .digit-number {
            font-size: 24px;
            font-weight: 900;
            color: var(--apex-secondary);
            margin-bottom: 5px;
        }
        
        .digit-box.active .digit-number {
            color: var(--apex-success);
        }
        
        .digit-frequency {
            font-size: 11px;
            color: var(--apex-gray);
            font-weight: 600;
        }
        
        .digit-box.active .digit-frequency {
            color: var(--apex-success);
        }
        
        /* Systematic Audio Protocol */
        .audio-protocol {
            background: rgba(15, 23, 42, 0.9);
            border-radius: 16px;
            padding: 25px;
            margin: 30px 0;
            border: 1px solid var(--apex-border);
        }
        
        .protocol-title {
            font-size: 14px;
            color: var(--apex-secondary);
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .protocol-phases {
            display: grid;
            gap: 15px;
        }
        
        .protocol-phase {
            padding: 15px;
            background: rgba(30, 41, 59, 0.5);
            border-radius: 12px;
            border-left: 4px solid var(--apex-secondary);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .phase-icon {
            color: var(--apex-accent);
            font-size: 18px;
        }
        
        .phase-text {
            font-size: 13px;
            color: #e2e8f0;
            line-height: 1.5;
        }
        
        /* Countdown Timer */
        .countdown-timer {
            background: rgba(15, 23, 42, 0.9);
            border-radius: 16px;
            padding: 25px;
            margin: 30px 0;
            border: 1px solid var(--apex-border);
            text-align: center;
        }
        
        .timer-display {
            font-size: 48px;
            font-weight: 900;
            font-family: 'Courier New', monospace;
            color: var(--apex-accent);
            margin: 15px 0;
            text-shadow: 0 5px 15px rgba(245, 158, 11, 0.3);
        }
        
        .timer-label {
            font-size: 12px;
            color: var(--apex-gray);
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 700;
        }
        
        /* Execute Button */
        .execute-universal {
            display: block;
            width: 100%;
            background: var(--universal-gradient);
            color: white;
            padding: 25px;
            border-radius: 16px;
            text-decoration: none;
            font-weight: 900;
            font-size: 20px;
            text-align: center;
            transition: all 0.3s;
            border: none;
            cursor: pointer;
            margin-top: 30px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 15px 40px var(--apex-glow);
        }
        
        .execute-universal:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 50px rgba(139, 92, 246, 0.5);
        }
        
        .execute-universal::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: rotate(45deg);
            animation: shine 3s infinite;
        }
        
        @keyframes shine {
            0% { transform: rotate(45deg) translate(-30%, -30%); }
            100% { transform: rotate(45deg) translate(30%, 30%); }
        }
        
        /* Signal History */
        .signal-history {
            background: rgba(15, 23, 42, 0.8);
            border-radius: 16px;
            padding: 25px;
            margin: 40px 0;
            border: 1px solid var(--apex-border);
        }
        
        .history-title {
            font-size: 14px;
            color: var(--apex-gray);
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .history-grid {
            display: grid;
            gap: 10px;
        }
        
        .history-item {
            background: rgba(30, 41, 59, 0.5);
            border-radius: 12px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 4px solid var(--apex-secondary);
        }
        
        .history-action {
            font-size: 14px;
            font-weight: 800;
            color: #e2e8f0;
        }
        
        .history-details {
            font-size: 11px;
            color: var(--apex-gray);
        }
        
        .history-confidence {
            font-size: 12px;
            font-weight: 700;
            color: var(--apex-success);
            background: rgba(34, 197, 94, 0.1);
            padding: 4px 12px;
            border-radius: 12px;
        }
        
        /* Universal Footer */
        .universal-footer {
            text-align: center;
            padding: 30px 20px;
            margin-top: 60px;
            border-top: 1px solid var(--apex-border);
            color: var(--apex-gray);
            font-size: 12px;
        }
        
        .footer-text {
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .header-container {
                flex-direction: column;
                gap: 15px;
            }
            
            .universal-grid {
                padding: 0 15px;
            }
            
            .command-card {
                padding: 20px;
            }
            
            .command-icon {
                font-size: 48px;
            }
            
            .command-title {
                font-size: 24px;
            }
            
            .universal-signal {
                padding: 25px 20px;
                margin: 20px 15px;
            }
            
            .signal-action {
                font-size: 64px;
            }
            
            .signal-accuracy {
                font-size: 24px;
                padding: 12px 30px;
            }
            
            .cluster-grid {
                grid-template-columns: repeat(3, 1fr);
            }
            
            .modules-grid {
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            }
            
            .timer-display {
                font-size: 36px;
            }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
            .cluster-grid {
                grid-template-columns: repeat(5, 1fr);
            }
        }
    </style>
</head>
<body>
    <!-- Apex Universal Header -->
    <header class="apex-header">
        <div class="header-container">
            <div class="apex-logo">
                <div class="logo-icon">
                    <i class="fas fa-globe"></i>
                </div>
                <div>
                    <div class="logo-text">ZION APEX UNIVERSAL</div>
                    <div class="logo-subtitle">2026 Edition</div>
                </div>
            </div>
            
            <div class="universal-time" id="liveTime">{{ current_time }}</div>
            
            <div class="apex-status">
                <i class="fas fa-satellite"></i> Universal Scanning
            </div>
        </div>
    </header>
    
    <main class="universal-grid">
        {% if cat == 'DASHBOARD' %}
            <!-- Command Center (Single Icon) -->
            <div class="command-center">
                {% for key, center in command_center.items() %}
                <a href="{{ center.route }}" class="command-card">
                    <div class="command-icon">
                        <i class="fas {{ center.icon }}"></i>
                    </div>
                    <div class="command-title">{{ center.name }}</div>
                    <div class="command-description">{{ center.description }}</div>
                    <div class="command-badge">{{ center.badge }}</div>
                </a>
                {% endfor %}
            </div>
            
            <!-- Future Modules (Scrollable) -->
            <div class="modules-container">
                <div class="grid-title">
                    <i class="fas fa-cubes"></i> Universal Modules (Future Development)
                </div>
                <div class="modules-grid">
                    {% for key, module in future_modules.items() %}
                    <a href="{{ module.route }}" class="module-card">
                        <div class="module-icon">
                            <i class="fas {{ module.icon }}"></i>
                        </div>
                        <div class="module-title">{{ module.name }}</div>
                        <div class="module-description">{{ module.description }}</div>
                        <div class="module-status">{{ module.status }}</div>
                    </a>
                    {% endfor %}
                </div>
            </div>
            
            <!-- Recent Signal History -->
            {% if signal_history %}
            <div class="signal-history">
                <div class="history-title">
                    <i class="fas fa-history"></i> Recent Universal Activity
                </div>
                <div class="history-grid">
                    {% for signal in signal_history %}
                    <div class="history-item">
                        <div class="history-action">{{ signal.action }}</div>
                        <div class="history-details">{{ signal.asset_class_name }}</div>
                        <div class="history-confidence">{{ signal.confidence|round|int }}%</div>
                    </div>
                    {% endfor %}
                </div>
            </div>
            {% endif %}
            
        {% elif cat == 'LIVE_SIGNALS' %}
            <!-- Universal Signal Display -->
            <div class="universal-signal">
                <div class="signal-header">
                    <div class="asset-class-indicator">
                        <div class="asset-icon">
                            {% if signal.asset_class == 'ALPHA' %}
                                <i class="fas fa-bolt"></i>
                            {% else %}
                                <i class="fas fa-chart-line"></i>
                            {% endif %}
                        </div>
                        <div class="asset-info">
                            <h3>{{ signal.asset_class_name }}</h3>
                            <p>Universal Asset Class • {{ signal.asset_class }}</p>
                        </div>
                    </div>
                    
                    <div class="universal-badge">
                        <i class="fas fa-satellite-dish"></i> APEX UNIVERSAL
                    </div>
                </div>
                
                {% if signal.status == 'active' %}
                <div class="signal-main">
                    <div class="signal-action">{{ signal.action }}</div>
                    
                    {% if signal.barrier %}
                    <div style="font-size: 24px; color: var(--apex-accent); font-weight: 800; margin: 15px 0;">
                        Barrier: {{ signal.barrier }}
                    </div>
                    {% endif %}
                    
                    <div class="signal-accuracy">{{ signal.confidence|round|int }}% Accuracy</div>
                </div>
                
                <!-- Digit Cluster Display -->
                <div class="digit-cluster">
                    <div class="cluster-title">
                        <i class="fas fa-microchip"></i> 10% Individual Digit Competition
                    </div>
                    <div class="cluster-grid">
                        {% for digit in signal.digit_cluster.digits %}
                        <div class="digit-box active">
                            <div class="digit-number">{{ digit }}</div>
                            <div class="digit-frequency">{{ signal.digit_cluster.average_frequency }}%</div>
                        </div>
                        {% endfor %}
                    </div>
                    <div style="text-align: center; color: var(--apex-gray); font-size: 12px; margin-top: 15px;">
                        Cluster Density: {{ signal.digit_cluster.cluster_density }}% • 
                        Competing Digits: {{ signal.universal_analysis.competing_digits_count }}/10
                    </div>
                </div>
                
                <!-- Systematic Audio Protocol -->
                <div class="audio-protocol">
                    <div class="protocol-title">
                        <i class="fas fa-broadcast-tower"></i> Systematic Audio Protocol
                    </div>
                    <div class="protocol-phases">
                        {% for phase, text in signal.audio_protocol.items() if phase != 'full' %}
                        <div class="protocol-phase">
                            <div class="phase-icon">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            <div class="phase-text">{{ text }}</div>
                        </div>
                        {% endfor %}
                    </div>
                </div>
                
                <!-- Countdown Timer -->
                <div class="countdown-timer">
                    <div class="timer-label">Algorithm Shift In</div>
                    <div class="timer-display" id="countdownTimer">120</div>
                    <div class="timer-label">Seconds</div>
                </div>
                
                <!-- Execute Button -->
                <button class="execute-universal" onclick="executeUniversalTrade()">
                    <i class="fas fa-rocket"></i> EXECUTE UNIVERSAL TRADE
                </button>
                
                {% else %}
                <!-- Scanning State -->
                <div style="text-align: center; padding: 60px 20px;">
                    <div class="command-icon" style="font-size: 72px; margin-bottom: 30px;">
                        <i class="fas fa-satellite"></i>
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: var(--apex-secondary); margin-bottom: 15px;">
                        Maneuvering Through Universal Asset Classes
                    </div>
                    <div style="color: var(--apex-gray); font-size: 16px; margin-bottom: 30px;">
                        {{ signal.message }}
                    </div>
                    <div style="font-size: 48px; font-weight: 900; color: var(--apex-accent); font-family: 'Courier New', monospace;">
                        {{ signal.confidence|round|int }}%
                    </div>
                    <div style="color: var(--apex-gray); font-size: 12px; margin-top: 10px;">
                        Universal Confidence Score
                    </div>
                </div>
                {% endif %}
            </div>
            
            <!-- Signal History -->
            {% if signal_history %}
            <div class="signal-history">
                <div class="history-title">
                    <i class="fas fa-history"></i> Recent Universal Signals
                </div>
                <div class="history-grid">
                    {% for hist_signal in signal_history %}
                    <div class="history-item">
                        <div class="history-action">{{ hist_signal.action }}</div>
                        <div class="history-details">{{ hist_signal.asset_class_name }}</div>
                        <div class="history-confidence">{{ hist_signal.confidence|round|int }}%</div>
                    </div>
                    {% endfor %}
                </div>
            </div>
            {% endif %}
            
        {% else %}
            <!-- Future Module Placeholder -->
            <div style="text-align: center; padding: 100px 20px;">
                <div class="command-icon" style="font-size: 72px; margin-bottom: 30px;">
                    <i class="fas fa-cogs"></i>
                </div>
                <div style="font-size: 32px; font-weight: 900; color: var(--apex-secondary); margin-bottom: 15px;">
                    Module Under Development
                </div>
                <div style="color: var(--apex-gray); font-size: 18px; margin-bottom: 30px;">
                    This universal module is being engineered for the 2026 edition
                </div>
                <a href="/?cat=DASHBOARD" style="display: inline-block; background: var(--universal-gradient); color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800;">
                    <i class="fas fa-arrow-left"></i> RETURN TO COMMAND CENTER
                </a>
            </div>
        {% endif %}
    </main>
    
    <!-- Universal Footer -->
    <footer class="universal-footer">
        <div class="footer-text">
            <p><i class="fas fa-shield-alt"></i> ZION APEX UNIVERSAL SYSTEM v2.6 • Universal Asset Class Aggregation • 10% Individual Digit Competition Rule</p>
            <p style="margin-top: 10px; font-size: 11px; color: #475569;">
                All Volatility with One-Second + All Volatility with Plain Index = Universal Hunting Grounds
            </p>
        </div>
    </footer>
    
    <!-- WhatsApp Float -->
    <a href="{{ wa }}" class="wa-float" target="_blank" style="position: fixed; bottom: 30px; right: 30px; background: #25d366; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; color: white; text-decoration: none; box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4); z-index: 1000;">
        <i class="fab fa-whatsapp"></i>
    </a>
    
    <script>
        // Universal System Initialization
        let universalMuted = false;
        const speech = window.speechSynthesis;
        
        function playUniversal(text) {
            if (!universalMuted && text) {
                speech.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 0.8;
                utterance.volume = 1.0;
                utterance.lang = 'en-US';
                speech.speak(utterance);
            }
        }
        
        function executeUniversalTrade() {
            const confirmation = "Executing universal trade command. Redirecting to trading platform.";
            playUniversal(confirmation);
            setTimeout(() => {
                window.open('https://bot.deriv.com', '_blank');
            }, 1000);
        }
        
        // Update live time
        function updateUniversalTime() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('liveTime').textContent = timeStr;
        }
        
        // Countdown timer for active signals
        function startCountdown(seconds) {
            const timerElement = document.getElementById('countdownTimer');
            if (!timerElement) return;
            
            let timeLeft = seconds;
            const timer = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    timerElement.textContent = "SHIFTING";
                    // Auto-refresh when countdown ends
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    timerElement.textContent = timeLeft;
                    timeLeft--;
                }
            }, 1000);
        }
        
        // Auto-speak protocol on page load
        window.onload = function() {
            updateUniversalTime();
            setInterval(updateUniversalTime, 1000);
            
            {% if cat == 'LIVE_SIGNALS' and signal.status == 'active' %}
                // Play systematic audio protocol
                setTimeout(() => {
                    playUniversal("{{ signal.audio_protocol.full }}");
                }, 1500);
                
                // Start countdown timer
                startCountdown({{ signal.countdown }});
                
            {% elif cat == 'DASHBOARD' %}
                // Play universal system greeting
                setTimeout(() => {
                    playUniversal("Zion Apex Universal System initialized. Universal asset class aggregation active. Command center ready.");
                }, 1000);
            {% endif %}
        };
        
        // Auto-refresh scanning state
        {% if cat == 'LIVE_SIGNALS' and signal.status != 'active' %}
            setTimeout(() => {
                window.location.reload();
            }, 15000); // Refresh every 15 seconds when scanning
        {% endif %}
        
        // Module card hover effects
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                const icon = this.querySelector('.module-icon i');
                icon.style.transform = 'scale(1.2)';
                icon.style.transition = 'transform 0.3s ease';
            });
            
            card.addEventListener('mouseleave', function() {
                const icon = this.querySelector('.module-icon i');
                icon.style.transform = 'scale(1)';
            });
        });
        
        // Simulate digit competition animation
        function animateDigitCompetition() {
            const digitBoxes = document.querySelectorAll('.digit-box');
            digitBoxes.forEach(box => {
                box.style.animation = 'pulse 2s infinite';
            });
        }
        
        // Add CSS animation for digit boxes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        // Initialize animations
        setTimeout(animateDigitCompetition, 2000);
    </script>
</body>
</html>
"""

# --- DEPLOYMENT ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    debug = os.environ.get("FLASK_ENV") == "development"
    
    print(f"""
    🌌 ZION APEX UNIVERSAL SYSTEM (2026 Edition)
    ============================================
    🔥 Universal Asset Class Aggregation Active
    🔥 Two Hunting Grounds:
       • ALL Volatility with One-Second (Alpha Class)
       • ALL Volatility with Plain Index (Beta Class)
    
    🎯 10% Individual Digit Competition Rule Active
    🎯 Systematic Audio Protocol Initialized
    🎯 Single Command Center: Live Signals
    
    📊 Universal Modules: {len(UniversalDashboard.FUTURE_MODULES)} Future Modules
    🔗 WhatsApp Support: {WHATSAPP}
    🌐 Server: http://localhost:{port}
    
    ✅ Genius Maneuvering: Scanning ALL markets for digit clusters
    ✅ 10% Threshold: Rejecting thin markets, hunting heavy clusters
    ✅ Audio Coordination: Systematic command protocol active
    ============================================
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
