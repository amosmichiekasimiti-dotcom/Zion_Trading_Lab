            .nav-item.active { background: #316dca; color: white; }
            .main { flex: 1; padding: 40px; overflow-y: auto; display: flex; justify-content: center; position: relative; }
            .signal-card { width: 100%; max-width: 480px; background: var(--card); border: 1px solid #444c56; border-radius: 24px; padding: 35px; border-top: 8px solid {{ color }}; height: fit-content; }
            .accuracy-tag { color: var(--green); font-weight: 800; font-size: 12px; margin-bottom: 10px; display: block; }
            .contract-name { font-size: 42px; font-weight: 900; color: {{ color }}; margin: 15px 0; }
            .target-badge { display: inline-block; margin-top: 25px; padding: 12px 25px; border: 2px dashed var(--gold); color: var(--gold); border-radius: 12px; font-weight: 900; font-size: 18px; }
            #timer-box { font-size: 24px; font-weight: 900; color: var(--gold); margin-bottom: 20px; text-align: center; border: 1px solid var(--gold); padding: 10px; border-radius: 10px; display: none; }
            #timer-box.active { display: block; }
            #v-btn { position: fixed; bottom: 30px; right: 30px; background: #316dca; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; z-index: 1000; font-size: 24px; }
            @media (max-width: 850px) { body { flex-direction: column; } .sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; padding: 10px; } .sidebar h1 { display: none; } .nav-item { white-space: nowrap; } }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <h1 style="font-size:18px; color:var(--blue); margin-bottom: 20px;">ZION LAB</h1>
            <a href="/?cat=EVEN_ODD" class="nav-item {% if cat == 'EVEN_ODD' %}active{% endif %}">EVEN / ODD</a>
            <a href="/?cat=RISE_FALL" class="nav-item {% if cat == 'RISE_FALL' %}active{% endif %}">RISE / FALL</a>
            <a href="/?cat=MATCH_DIFFER" class="nav-item {% if cat == 'MATCH_DIFFER' %}active{% endif %}">MATCHES</a>
            <a href="/?cat=OVER_UNDER" class="nav-item {% if cat == 'OVER_UNDER' %}active{% endif %}">OVER / UNDER</a>
            <a href="/?cat=ACCUMULATORS" class="nav-item {% if cat == 'ACCUMULATORS' %}active{% endif %}">ACCUMULATORS</a>
        </div>
        <div class="main">
            <div class="signal-card">
                <div id="timer-box" class="{% if show_timer == 'true' %}active{% endif %}">CALCULATING: <span id="count">10</span>s</div>
                <span class="accuracy-tag">{{ accuracy }}% ACCURACY</span>
                <div style="font-size:12px; color:#768390; font-weight:800; margin-bottom:15px;">{{ market }}</div>
                <div class="contract-name">{{ contract }}</div>
                <div style="background:#22272e; padding:20px; border-radius:15px; font-size:14px; border: 1px solid #444c56;">{{ logic }}</div>
                <div class="target-badge">{{ target }}</div>
                <a href="https://bot.deriv.com" style="display:block; margin-top:30px; background:var(--green); color:white; text-align:center; padding:18px; border-radius:15px; text-decoration:none; font-weight:900;">EXECUTE ON XML BOT</a>
            </div>
            <div id="v-btn" onclick="toggleMute()"><i id="v-icon" class="fa-solid fa-volume-high"></i></div>
        </div>
        <script>
            let isMuted = localStorage.getItem('zionMuted') === 'true';
            const icon = document.getElementById('v-icon');
            if (isMuted) { icon.classList.replace('fa-volume-high', 'fa-volume-xmark'); }

            function toggleMute() {
                isMuted = !isMuted;
                localStorage.setItem('zionMuted', isMuted);
                location.reload();
            }

            if ("{{ show_timer }}" === "true") {
                let timeLeft = 10;
                let timerElement = document.getElementById('count');
                let timerBox = document.getElementById('timer-box');
                let timerId = setInterval(() => {
                    timeLeft--;
                    timerElement.innerText = timeLeft;
                    if (timeLeft <= 0) {
                        clearInterval(timerId);
                        timerBox.innerHTML = "🔥 STRIKE NOW!";
                        timerBox.style.background = "rgba(210, 153, 34, 0.2)";
                    }
                }, 1000);
            }

            window.onload = () => {
                if(!isMuted) {
                    const msg = new SpeechSynthesisUtterance("{{ voice }}");
                    msg.rate = 0.95;
                    window.speechSynthesis.speak(msg);
                }
            };
            setTimeout(() => { 
                const urlParams = new URLSearchParams(window.location.search);
                const currentCat = urlParams.get('cat') || 'EVEN_ODD';
                window.location.href = "/?cat=" + currentCat; 
            }, 12000);
        </script>
    </body>
    </html>
    """
    return render_template_string(HTML_TEMPLATE, market=market, contract=contract, logic=logic, accuracy=accuracy, color=color, target=target, voice=voice, cat=cat, show_timer=show_timer)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 10000)))
