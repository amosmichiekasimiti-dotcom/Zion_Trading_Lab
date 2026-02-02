            body { background: var(--bg); color: white; font-family: 'Inter', sans-serif; margin: 0; }
            .navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #000; border-bottom: 1px solid #1f2937; position: sticky; top:0; z-index: 1000; }
            .logo { font-weight: 900; color: var(--blue); }
            .container { padding: 20px; max-width: 500px; margin: auto; }
            .signal-card { background: var(--card); border-radius: 20px; padding: 30px; border-left: 8px solid {{ color }}; position: relative; border-top: 1px solid #333; }
            .accuracy { font-size: 50px; font-weight: 900; margin: 0; }
            .xml-btn { background: linear-gradient(90deg, #3b82f6, #1d4ed8); color: white; padding: 15px; border-radius: 12px; text-decoration: none; display: block; text-align: center; margin-top: 20px; font-weight: bold; border: 1px solid rgba(255,255,255,0.1); }
            .grid-nav { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
            .nav-item { background: var(--card); border-radius: 12px; padding: 15px 5px; text-align: center; color: white; text-decoration: none; font-size: 10px; border: 1px solid #333; }
            .nav-item i { display: block; font-size: 22px; margin-bottom: 8px; }
        </style>
    </head>
    <body>
        <nav class="navbar">
            <i class="fa-solid fa-bars-staggered"></i>
            <div class="logo">ZION TRADING LAB</div>
            <i id="v-btn" class="fa-solid fa-volume-high" onclick="toggleMute()" style="color:var(--blue); cursor:pointer;"></i>
        </nav>
        <div class="container">
            <div class="signal-card">
                <div style="font-size:11px; font-weight:bold; color:var(--blue);"><i class="fa-solid fa-microchip"></i> {{ market }}</div>
                <div class="accuracy">{{ accuracy }}%</div>
                <div style="font-size:13px; color:#cfd8dc; margin-top:10px;"><b>CONDITION:</b> {{ logic }}</div>
                <div style="font-size:30px; font-weight:900; color:{{ color }}; margin-top:15px; text-transform:uppercase;">{{ contract }}</div>
                <div style="margin-top:15px; font-weight:800; color:#fcd34d; border:1px dashed #fcd34d; padding:8px 15px; display:inline-block; border-radius:10px; background:rgba(252,211,77,0.05);">{{ target_info }}</div>
            </div>
            <a href="https://bot.deriv.com" class="xml-btn">DOWNLOAD RECOMMENDED XML BOT</a>
            <div class="grid-nav">
                <a href="#" class="nav-item"><i class="fa-solid fa-house" style="color:var(--blue)"></i>HOME</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-robot" style="color:var(--red)"></i>XML BOTS</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-bolt" style="color:var(--gold)"></i>SIGNALS</a>
            </div>
        </div>
        <script>
            let isMuted = localStorage.getItem('zionMuted') === 'true';
            if(isMuted) document.getElementById('v-btn').classList.replace('fa-volume-high', 'fa-volume-xmark');
            function toggleMute() { isMuted = !isMuted; localStorage.setItem('zionMuted', isMuted); location.reload(); }
            window.onload = () => { if(!isMuted) { let m = new SpeechSynthesisUtterance("{{ voice }}"); m.rate=0.92; window.speechSynthesis.speak(m); } };
            setTimeout(() => { location.reload(); }, 12000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, accuracy=accuracy, color=color, target_info=target_info, voice=voice, countdown_needed=countdown_needed)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
