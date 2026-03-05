(function () {
    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/widget.css';
    document.head.appendChild(link);

    // Create Widget Markup
    const widgetHTML = `
        <div class="acc-widget-trigger" id="accTrigger" title="Prilagodba pristupačnosti">
            <svg viewBox="0 0 24 24"><path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M10.5,7H13.5C14.6,7 15.5,7.9 15.5,9V14.5H14V22H10V14.5H8.5V9C8.5,7.9 9.4,7 10.5,7Z"/></svg>
        </div>
        <div class="acc-panel" id="accPanel">
            <div class="acc-header">
                <h3>Pristupačnost</h3>
                <button id="accClose" style="background:none; border:none; cursor:pointer; font-size:1.5rem;">&times;</button>
            </div>
            
            <div class="acc-section">
                <h4>Vizualne prilagodbe</h4>
                <div class="acc-grid">
                    <button class="acc-btn" data-action="contrast">Visoki kontrast</button>
                    <button class="acc-btn" data-action="grayscale">Sive nijanse</button>
                    <button class="acc-btn" data-action="invert">Invertiraj boje</button>
                    <button class="acc-btn" data-action="reset">Vrati izvorno</button>
                </div>
            </div>

            <div class="acc-section">
                <h4>Tekst i Font</h4>
                <div class="acc-grid">
                    <button class="acc-btn" data-action="font-plus">Povećaj tekst</button>
                    <button class="acc-btn" data-action="font-minus">Smanji tekst</button>
                    <button class="acc-btn" data-action="dyslexic">Disleksija font</button>
                    <button class="acc-btn" data-action="highlight-links">Istakni poveznice</button>
                </div>
            </div>

            <div class="acc-section">
                <h4>Alati za pomoć</h4>
                <div class="acc-grid">
                    <button class="acc-btn" data-action="reader">Čitač ekrana</button>
                    <button class="acc-btn" id="btnReport">Izvještaj grešaka</button>
                </div>
            </div>
            
            <div id="accStatus" style="font-size: 0.7rem; color: #888; text-align: center; margin-top: 10px;">
                Usklađeno s NN 17/19
            </div>
        </div>
    `;

    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = widgetHTML;
    document.body.appendChild(widgetContainer);

    // Logic
    const trigger = document.getElementById('accTrigger');
    const panel = document.getElementById('accPanel');
    const closeBtn = document.getElementById('accClose');
    const reportBtn = document.getElementById('btnReport');

    trigger.addEventListener('click', () => panel.classList.toggle('active'));
    closeBtn.addEventListener('click', () => panel.classList.remove('active'));

    let fontSize = 100;
    let readerActive = false;

    document.querySelectorAll('.acc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.getAttribute('data-action');

            switch (action) {
                case 'contrast':
                    document.body.classList.toggle('acc-high-contrast');
                    break;
                case 'grayscale':
                    document.body.classList.toggle('acc-grayscale');
                    break;
                case 'invert':
                    document.body.classList.toggle('acc-inverted');
                    break;
                case 'reset':
                    document.body.className = '';
                    fontSize = 100;
                    document.body.style.fontSize = fontSize + '%';
                    break;
                case 'font-plus':
                    fontSize += 10;
                    document.body.style.fontSize = fontSize + '%';
                    break;
                case 'font-minus':
                    fontSize -= 10;
                    document.body.style.fontSize = fontSize + '%';
                    break;
                case 'dyslexic':
                    document.body.classList.toggle('acc-dyslexic');
                    break;
                case 'highlight-links':
                    const links = document.querySelectorAll('a');
                    links.forEach(l => {
                        l.style.backgroundColor = l.style.backgroundColor === 'yellow' ? '' : 'yellow';
                        l.style.color = l.style.color === 'black' ? '' : 'black';
                        l.style.textDecoration = 'underline';
                    });
                    break;
                case 'reader':
                    toggleReader();
                    break;
            }
        });
    });

    // Screen Reader Implementation
    function toggleReader() {
        readerActive = !readerActive;
        if (readerActive) {
            alert('Čitač ekrana je aktiviran. Prijeđite mišem preko teksta.');
            document.body.addEventListener('mouseover', speakElement);
        } else {
            document.body.removeEventListener('mouseover', speakElement);
            window.speechSynthesis.cancel();
        }
    }

    function speakElement(e) {
        if (!readerActive) return;
        const text = e.target.innerText;
        if (text) {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'hr-HR';
            window.speechSynthesis.speak(msg);
        }
    }

    // Report Logic
    reportBtn.addEventListener('click', async () => {
        reportBtn.innerText = 'Skeniram...';
        try {
            const res = await fetch('https://web-uskladenje.vercel.app/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: window.location.href })
            });
            const data = await res.json();
            console.log('Accessibility Report:', data);
            alert(`Pronađeno ${data.stats.violations} kritičnih grešaka. Detalji su ispisani u konzoli.`);
        } catch (err) {
            alert('Greška pri dohvaćanju izvještaja.');
        } finally {
            reportBtn.innerText = 'Izvještaj grešaka';
        }
    });

})();
