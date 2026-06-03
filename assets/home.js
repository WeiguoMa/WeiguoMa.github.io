const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    let animState = 'IDLE';
    let explosionTime = 0;

    const themeColors = {
        dark: { c1: {r:0, g:243, b:255}, c2: {r:188, g:19, b:254} },
        light: { c1: {r:0, g:122, b:204}, c2: {r:124, g:58, b:237} }
    };

    const STORAGE_KEY = 'site-theme-preference';
    const themeBtn = document.getElementById('theme-btn');
    const themeIcon = document.getElementById('theme-icon');
    const metaColorScheme = document.getElementById('meta-color-scheme');
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let currentTheme = 'dark';

    function applyTheme(theme) {
        currentTheme = theme;
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.className = 'ri-moon-line';
            themeBtn.setAttribute('aria-label', 'Switch to dark theme');
            themeBtn.setAttribute('title', 'Switch to dark theme');
            if(metaColorScheme) metaColorScheme.content = 'light';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeIcon.className = 'ri-sun-line';
            themeBtn.setAttribute('aria-label', 'Switch to light theme');
            themeBtn.setAttribute('title', 'Switch to light theme');
            if(metaColorScheme) metaColorScheme.content = 'dark';
        }
    }

    function initTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme(systemPrefersDark ? 'dark' : 'light');
        }
    }

    initTheme();

    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    themeBtn.addEventListener('click', () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    });

    systemThemeQuery.addEventListener('change', e => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });


    const prefersReducedMotion = reduceMotionQuery.matches;

    const config = {
        count: prefersReducedMotion ? 24 : (window.innerWidth < 768 ? 60 : 100),
        connRadius: 180,
        mouseRadius: 140,
        mouseForce: prefersReducedMotion ? 0.006 : 0.02,
        baseSpeed: prefersReducedMotion ? 0.12 : 0.45,
        separationDist: 60,
        separationForce: prefersReducedMotion ? 0.0006 : 0.002
    };

    let mouse = { x: -999, y: -999 };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    resize();

    class Particle {
        constructor(index) {
            this.index = index;
            const u = 1 - Math.random();
            const v = Math.random();
            const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
            const radius = z * (Math.min(width, height) * 0.12);

            const angle = Math.random() * Math.PI * 2;
            this.x = width/2 + Math.cos(angle) * radius;
            this.y = height/2 + Math.sin(angle) * radius;

            const velocityMag = 2.0;
            this.vx = -Math.sin(angle) * velocityMag;
            this.vy = Math.cos(angle) * velocityMag;

            this.size = Math.random() * 2 + 1.5;
            this.phase = Math.random();
            this.alpha = 1;
        }

        update() {
            const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
            if (speed > config.baseSpeed) {
                this.vx *= 0.96;
                this.vy *= 0.96;
            } else if (speed < config.baseSpeed * 0.5) {
                this.vx += (Math.random()-0.5) * 0.05;
                this.vy += (Math.random()-0.5) * 0.05;
            }

            for (let j = 0; j < particles.length; j++) {
                if (this.index === j) continue;
                const p2 = particles[j];
                const dx = this.x - p2.x;
                const dy = this.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < config.separationDist && dist > 0) {
                    const force = (config.separationDist - dist) / config.separationDist;
                    this.vx += (dx/dist) * force * config.separationForce;
                    this.vy += (dy/dist) * force * config.separationForce;
                }
            }

            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) {
                this.vx *= -1;
                this.x = Math.max(0, Math.min(width, this.x));
            }
            if (this.y < 0 || this.y > height) {
                this.vy *= -1;
                this.y = Math.max(0, Math.min(height, this.y));
            }

            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < config.mouseRadius) {
                const force = (config.mouseRadius - dist) / config.mouseRadius;
                const repelStrength = config.mouseForce * 5;
                this.vx -= (dx/dist) * force * repelStrength;
                this.vy -= (dy/dist) * force * repelStrength;
            }
        }

        draw() {
            const colors = themeColors[currentTheme] || themeColors.dark;
            ctx.fillStyle = this.phase > 0.5
                ? `rgba(${colors.c1.r},${colors.c1.g},${colors.c1.b},${this.alpha})`
                : `rgba(${colors.c2.r},${colors.c2.g},${colors.c2.b},${this.alpha})`;

            if (Math.random() > 0.96) {
                const tearRange = 4;
                const angle = Math.random() * Math.PI * 2;
                const dist = (Math.random() * 0.5 + 0.5) * tearRange;
                const offsetX = Math.cos(angle) * dist;
                const offsetY = Math.sin(angle) * dist;

                ctx.beginPath();
                ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI*2);
                ctx.fill();

                const r = this.phase > 0.5 ? colors.c1.r : colors.c2.r;
                const g = this.phase > 0.5 ? colors.c1.g : colors.c2.g;
                const b = this.phase > 0.5 ? colors.c1.b : colors.c2.b;

                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + offsetX, this.y + offsetY);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    function initParticles() {
        particles = [];
        const count = prefersReducedMotion ? 24 : (window.innerWidth < 768 ? 60 : 100);
        for(let i=0; i<count; i++) particles.push(new Particle(i));
    }

    function spreadParticlesForIdle() {
        particles.forEach(p => {
            p.x = Math.random() * width;
            p.y = Math.random() * height;

            const angle = Math.random() * Math.PI * 2;
            const speed = config.baseSpeed * (0.7 + Math.random() * 0.8);
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
        });
    }

    function startAnimation() {
        initParticles();
        spreadParticlesForIdle();
        explosionTime = Date.now() - 2500;
        requestAnimationFrame(loop);
    }

    function loop() {
        ctx.clearRect(0, 0, width, height);
        const colors = themeColors[currentTheme] || themeColors.dark;

        let showLines = false;
        let lineOpacityFactor = 0;
        if (animState === 'IDLE') {
            const timeSinceExplosion = Date.now() - explosionTime;
            if (timeSinceExplosion > 1000) {
                showLines = true;
                lineOpacityFactor = Math.min((timeSinceExplosion - 1000) / 1000, 1);
            }
        }

        particles.forEach((p, i) => {
            p.update();
            p.draw();

            if (showLines && lineOpacityFactor > 0.01) {
                for(let j=i+1; j<particles.length; j++) {
                    let p2 = particles[j];
                    let dist = Math.hypot(p.x-p2.x, p.y-p2.y);

                    if(dist < config.connRadius) {
                        let op = 1 - dist/config.connRadius;
                        op *= lineOpacityFactor;

                        ctx.beginPath();
                        let grad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
                        let lineAlpha = op * 0.2;
                        grad.addColorStop(0, `rgba(${colors.c1.r},${colors.c1.g},${colors.c1.b},${lineAlpha})`);
                        grad.addColorStop(1, `rgba(${colors.c2.r},${colors.c2.g},${colors.c2.b},${lineAlpha})`);
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 1;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
        });
        requestAnimationFrame(loop);
    }

    startAnimation();

    const terminalBody = document.getElementById('terminal-body');
    const terminalWindow = document.getElementById('terminal-window');
    const inputLine = document.getElementById('input-line');
    const cmdInput = document.getElementById('cmd-input');
    const cmdDisplay = document.getElementById('cmd-display');
    const cmdPlaceholder = document.getElementById('cmd-placeholder');

    const commands = {
        'help': () => `
            <div class="cmd-result">
                <div class="result-section-title">Available Commands</div>
                <div class="result-item"><span class="result-key">whoami</span> - Display profile summary</div>
                <div class="result-item"><span class="result-key">interests</span> - List research interests</div>
                <div class="result-item"><span class="result-key">contact</span> - Show contact information</div>
                <div class="result-item"><span class="result-key">clear</span> - Clear the terminal screen</div>
            </div>
        `,
        'whoami': () => `
            <div class="cmd-result">
                <div class="result-item"><span class="result-key">User:</span> Weiguo Ma</div>
                <div class="result-item"><span class="result-key">Role:</span> Ph.D. Graduate</div>
                <div class="result-item"><span class="result-key">Affiliation:</span> Institute of Physics, Chinese Academy of Sciences</div>
                <div class="result-item"><span class="result-key">Status:</span> <span style="color:var(--color-cyan)">Online & Coding...</span></div>
            </div>
        `,
        'contact': () => `
            <div class="cmd-result">
                <div class="result-section-title">Contact Info</div>
                <div class="result-item"><span class="result-key">Email:</span> <a href="mailto:david.mawg@gmail.com" class="result-link">david.mawg@gmail.com</a></div>
                <div class="result-item"><span class="result-key">Github:</span> <a href="https://github.com/weiguoma" target="_blank" rel="noopener noreferrer" class="result-link">github.com/weiguoma</a></div>
                <div class="result-item"><span class="result-key">Scholar:</span> <a href="https://scholar.google.com/citations?user=BgKQ2UAAAAAJ&hl=en" target="_blank" rel="noopener noreferrer" class="result-link">BgKQ2UAAAAAJ</a></div>
            </div>
        `,
        'interests': () => `
            <div class="cmd-result">
                <div class="result-section-title">Research Interests</div>

                <div class="result-item">
                    <div style="margin-bottom:4px;">1. <span class="string">"Quantum Computation"</span></div>
                    <div style="font-size:0.9em; opacity:0.8; margin-left:20px;">Tensor Networks, machine learning for quantum computing, hybrid quantum-classic computing.</div>
                </div>

                <div class="result-item">
                    <div style="margin-bottom:4px;">2. <span class="string">"Non-equilibrium physics"</span></div>
                    <div style="font-size:0.9em; opacity:0.8; margin-left:20px;">driven-dissipative Bose-hubbard model, time crystal, random circuits, mearsure/noise-induced phase transition.</div>
                </div>

                <div class="result-item">
                    <div style="margin-bottom:4px;">3. <span class="string">"Many-body physics"</span></div>
                    <div style="font-size:0.9em; opacity:0.8; margin-left:20px;">Solitons in Bose-hubbard model.</div>
                </div>
            </div>
        `,
        'clear': () => 'CLEAR_SIGNAL'
    };

    let commandHistory = [];
    let historyIndex = -1;
    const glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*<>[]{}|;:";

    terminalWindow.addEventListener('click', () => cmdInput.focus());

    cmdInput.addEventListener('input', () => {
        cmdDisplay.textContent = cmdInput.value;
        if (cmdInput.value.length > 0) {
            cmdPlaceholder.style.display = 'none';
        } else {
            cmdPlaceholder.style.display = 'inline';
        }
    });

    cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const fullCmd = cmdInput.value.trim();
            processCommand(fullCmd);
            cmdInput.value = '';
            cmdDisplay.textContent = '';
            cmdPlaceholder.style.display = 'inline';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                cmdInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
                cmdDisplay.textContent = cmdInput.value;
                cmdPlaceholder.style.display = 'none';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                cmdInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
                cmdDisplay.textContent = cmdInput.value;
                cmdPlaceholder.style.display = 'none';
            } else {
                historyIndex = -1;
                cmdInput.value = '';
                cmdDisplay.textContent = '';
                cmdPlaceholder.style.display = 'inline';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const val = cmdInput.value;
            const match = Object.keys(commands).find(c => c.startsWith(val));
            if (match) {
                cmdInput.value = match;
                cmdDisplay.textContent = match;
                cmdPlaceholder.style.display = 'none';
            }
        }
    });

    function scrambleAndRemove(element) {
        if (!element || element.classList.contains('scrambling')) return;

        element.classList.add('scrambling', 'glitched');
        const originalText = element.innerText;
        const textLength = Math.min(originalText.length, 50);
        let iterations = 0;
        const maxIterations = 10;

        const interval = setInterval(() => {
            let result = '';
            for (let i = 0; i < textLength; i++) {
                result += glitchChars.charAt(Math.floor(Math.random() * glitchChars.length));
            }
            element.innerText = result + (originalText.length > 50 ? '...' : '');
            element.style.opacity = 1 - (iterations / maxIterations);

            iterations++;
            if (iterations >= maxIterations) {
                clearInterval(interval);
                element.remove();
            }
        }, 50);
    }

    function processCommand(rawCmd) {
        if (!rawCmd) return;

        commandHistory.push(rawCmd);
        historyIndex = -1;

        const oldLines = Array.from(terminalBody.querySelectorAll('.output-line, .cmd-result, div:not(#input-line)'));

        oldLines.forEach(line => {
            if (line.id === 'input-line' || line.tagName === 'SCRIPT') return;
            scrambleAndRemove(line);
        });

        const args = rawCmd.split(' ');
        const cmd = args[0].toLowerCase();
        const arg = args[1];

        let outputHtml;
        if (commands[cmd]) {
            outputHtml = commands[cmd](arg);
        } else {
            outputHtml = `<div class=\"cmd-result\" style=\"color: #ff5f56\">Command not found: ${cmd}. Type <span class=\"keyword\">'help'</span> for list.</div>`;
        }

        if (outputHtml !== 'CLEAR_SIGNAL') {
            setTimeout(() => {
                printOutput(outputHtml, rawCmd);
            }, 300);
        }
    }

    function printOutput(html, cmd) {
        const historyLine = document.createElement('div');
        historyLine.className = 'output-line';
        const prompt = document.createElement('span');
        prompt.className = 'prompt';

        const path = document.createElement('span');
        path.className = 'path';
        path.textContent = '~';

        prompt.appendChild(path);
        historyLine.appendChild(prompt);
        historyLine.append(` ${cmd}`);
        terminalBody.insertBefore(historyLine, inputLine);

        if (html) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            while (tempDiv.firstChild) {
                terminalBody.insertBefore(tempDiv.firstChild, inputLine);
            }

            const spacer = document.createElement('div');
            spacer.style.height = '10px';
            spacer.className = 'output-line';
            terminalBody.insertBefore(spacer, inputLine);
        }
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    setTimeout(() => {
        printOutput(commands.help(), 'help');
    }, 400);

    setTimeout(() => {
        cmdInput.focus();
    }, 500);
