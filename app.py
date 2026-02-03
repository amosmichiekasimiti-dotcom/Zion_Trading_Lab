import os, random, collections
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__)

# --- CONFIG ---
API_KEY = os.environ.get("AIzaSyDM7cKxbQwbwBX0ubbO1Iel2WrFi8oEh2E")
WHATSAPP = "https://wa.me/254742024175?text=Hello%20Zion%20Support"

# Configure Gemini AI
try:
    genai.configure(api_key=API_KEY)
    ai_engine = genai.GenerativeModel('gemini-1.5-flash')
    AI_AVAILABLE = True
except:
    AI_AVAILABLE = False
    print("⚠️ Gemini AI not available. Using local strategies.")

# --- ZION APEX UNIVERSAL SYSTEM ---
class ZionApexUniversal:
    ASSET_CLASSES = {
        "ALPHA": {"name": "All Volatility with One-Second",
                  "markets": ["1HZ10V","1HZ15V","1HZ25V","1HZ30V","1HZ50V","1HZ75V","1HZ90V","1HZ100V"]},
        "BETA": {"name": "All Volatility with Plain Index",
                 "markets": ["R_10","R_25","R_50","R_75","R_100","R_150","R_250"]}
    }
    universal_digit_history = {"ALPHA": collections.Counter(), "BETA": collections.Counter()}
    signal_history = []

    @classmethod
    def simulate_market_ticks(cls):
        for asset_class in ["ALPHA","BETA"]:
            for _ in range(random.randint(5,15)):
                cls.universal_digit_history[asset_class][str(random.randint(0,9))] += 1
            total = sum(cls.universal_digit_history[asset_class].values())
            if total > 1000:
                cls.universal_digit_history[asset_class] = collections.Counter(
                    dict(list(cls.universal_digit_history[asset_class].items())[-500:])
                )

    @classmethod
    def analyze_universal_digits(cls, asset_class):
        digit_counter = cls.universal_digit_history[asset_class]
        total_ticks = sum(digit_counter.values())
        if total_ticks < 50:
            return {"status": "scanning", "confidence": 0, "message": "Building digit database"}
        digit_frequencies = {str(d): {"count": digit_counter.get(str(d),0),
                                      "frequency": round((digit_counter.get(str(d),0)/total_ticks)*100,2),
                                      "competition": (digit_counter.get(str(d),0)/total_ticks)*100 >= 10}
                             for d in range(10)}
        competing_digits = [d for d,info in digit_frequencies.items() if info["competition"]]
        cluster_density = len(competing_digits)/10
        over_digits, under_digits = ["0","1","2","3","4"], ["5","6","7","8","9"]
        even_digits, odd_digits = ["0","2","4","6","8"], ["1","3","5","7","9"]
        group_analysis = {
            "OVER": all(digit_frequencies[d]["competition"] for d in over_digits),
            "UNDER": all(digit_frequencies[d]["competition"] for d in under_digits),
            "EVEN": all(digit_frequencies[d]["competition"] for d in even_digits),
            "ODD": all(digit_frequencies[d]["competition"] for d in odd_digits)
        }
        cluster_strength = sum(1 for valid in group_analysis.values() if valid)/4*100
        return {
            "status":"active","asset_class":asset_class,"total_ticks":total_ticks,
            "digit_frequencies":digit_frequencies,"competing_digits":competing_digits,
            "cluster_density": round(cluster_density*100,1),
            "group_analysis": group_analysis,
            "cluster_strength": round(cluster_strength,1),
            "confidence": min(95, cluster_strength*1.2)
        }

    @classmethod
    def generate_universal_signal(cls):
        alpha_analysis = cls.analyze_universal_digits("ALPHA")
        beta_analysis = cls.analyze_universal_digits("BETA")
        analysis = alpha_analysis if alpha_analysis["confidence"] > beta_analysis["confidence"] else beta_analysis
        selected_class = "ALPHA" if analysis==alpha_analysis else "BETA"

        if analysis["status"] != "active" or analysis["confidence"]<70:
            return {"status":"scanning","message":"Maneuvering through Universal Asset Classes...",
                    "confidence":analysis.get("confidence",0),"countdown":random.randint(15,45)}

        concept_options=[]
        for concept,valid in analysis["group_analysis"].items():
            if valid:
                if concept in ["OVER","UNDER"]:
                    target_digits = ["0","1","2","3","4"] if concept=="OVER" else ["5","6","7","8","9"]
                else:
                    target_digits = ["0","2","4","6","8"] if concept=="EVEN" else ["1","3","5","7","9"]
                group_freq = sum(analysis["digit_frequencies"][d]["frequency"] for d in target_digits)
                concept_confidence = min(98, 60 + (group_freq/25)*38)
                concept_options.append({"concept":concept,"confidence":concept_confidence,
                                        "group_frequency":group_freq,"digits":target_digits})
        if not concept_options:
            return {"status":"waiting","message":"No digit clusters meeting 10% threshold",
                    "confidence":analysis["confidence"],"countdown":random.randint(30,60)}

        best_concept = max(concept_options,key=lambda x:x["confidence"])
        asset_class_info = cls.ASSET_CLASSES[selected_class]
        selected_market = random.choice(asset_class_info["markets"])
        market_display = selected_market.replace("R_","Vol ").replace("1HZ","").replace("V","")
        action = best_concept["concept"]
        barrier = random.choice(["4","5","6"]) if action in ["OVER","UNDER"] else None
        audio_protocol = {
            "phase_1": f"Target identified in {asset_class_info['name']} category.",
            "phase_2": f"Command: Execute {action}",
            "phase_3": f"Barrier {barrier}" if barrier else f"Parity {action}",
            "phase_4": f"Validation: 10% Individual Thresholds verified across {len(best_concept['digits'])}-digit cluster.",
            "phase_5": f"Live countdown: {random.randint(45,120)} seconds until algorithm shift.",
            "full": f"Zion Apex Universal engaging {asset_class_info['name']}. Command {action}. Barrier {barrier if barrier else 'Parity '+action}. Ten percent individual digit thresholds verified."
        }
        signal_data = {
            "status":"active","timestamp":datetime.utcnow().isoformat(),
            "asset_class":selected_class,"asset_class_name":asset_class_info["name"],
            "concept":best_concept["concept"],"action":action,"barrier":barrier,
            "market_display":market_display,"confidence":best_concept["confidence"],
            "digit_cluster":{"digits":best_concept["digits"],
                             "average_frequency":round(best_concept["group_frequency"]/5,2),
                             "cluster_density":analysis["cluster_density"]},
            "universal_analysis":{"total_ticks_analyzed":analysis["total_ticks"],
                                  "competing_digits_count":len(analysis["competing_digits"]),
                                  "cluster_strength":analysis["cluster_strength"]},
            "audio_protocol":audio_protocol,
            "countdown":random.randint(45,120),
            "expiry":(datetime.utcnow()+timedelta(seconds=120)).isoformat()
        }
        cls.signal_history.append(signal_data)
        if len(cls.signal_history)>20:
            cls.signal_history = cls.signal_history[-20:]
        return signal_data

# --- DASHBOARD ASSET INFO ---
ASSET_CLASS_DISPLAY = {
    "ALPHA":{"name":"All Volatility with One-Second","icon":"fa-bolt","color":"#f59e0b"},
    "BETA":{"name":"All Volatility with Plain Index","icon":"fa-chart-line","color":"#3b82f6"}
}

# --- FLASK ROUTES ---
@app.route('/')
def home():
    cat = request.args.get('cat','DASHBOARD')
    ZionApexUniversal.simulate_market_ticks()
    if cat=='LIVE_SIGNALS':
        signal = ZionApexUniversal.generate_universal_signal()
        return render_template("universal_ui.html", cat=cat, wa=WHATSAPP, signal=signal,
                               asset_classes=ASSET_CLASS_DISPLAY,
                               signal_history=ZionApexUniversal.signal_history[-5:],
                               current_time=datetime.utcnow().strftime("%H:%M:%S"))
    return render_template("universal_ui.html", cat=cat, wa=WHATSAPP,
                           signal_history=ZionApexUniversal.signal_history[-5:],
                           current_time=datetime.utcnow().strftime("%H:%M:%S"))

@app.route('/api/universal_signal')
def api_signal():
    signal = ZionApexUniversal.generate_universal_signal()
    return jsonify(signal)

@app.route('/api/asset_class_status')
def api_status():
    alpha = ZionApexUniversal.analyze_universal_digits("ALPHA")
    beta = ZionApexUniversal.analyze_universal_digits("BETA")
    return jsonify({"alpha":alpha,"beta":beta,"timestamp":datetime.utcnow().isoformat()})

if __name__=="__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
