document.addEventListener('DOMContentLoaded', () => {
    // --- Intersection Observer for Scroll Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- 2048 Game Logic ---
    const SIZE = 4;
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let grid = [];
    let mergedState = [];
    let score = 0;
    let gameOver = false;
    let won = false;

    let touchStartX = 0, touchStartY = 0;
    let touchEndX = 0, touchEndY = 0;

    const gameEl = document.getElementById('game-container');
    if (gameEl) {
        document.addEventListener('keydown', handleInput);

        gameEl.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: false });

        // Prevent scrolling while swiping on the game area
        gameEl.addEventListener('touchmove', e => {
            e.preventDefault();
        }, { passive: false });

        gameEl.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: false });

        window.addEventListener('resize', () => {
            clearTimeout(window.resizeTimer);
            window.resizeTimer = setTimeout(() => renderBoard(), 100);
        });

        // Initialize Game
        restartGame();
    }

    // Make restartGame available globally so the button onclick="restartGame()" works
    window.restartGame = restartGame;

    function restartGame() {
        grid = Array(SIZE).fill().map(() => Array(SIZE).fill(null));
        mergedState = Array(SIZE).fill().map(() => Array(SIZE).fill(false));
        score = 0;
        gameOver = false;
        won = false;
        updateScore(0);
        document.getElementById('game-message').style.display = 'none';
        document.getElementById('tile-container').innerHTML = '';

        addNewTile(true);
        addNewTile(true);
        renderBoard();
    }

    function handleInput(e) {
        if (gameOver) return;

        // Only prevent default for arrow keys if the game section is in view? 
        // We'll just listen. If user is playing game, arrow keys shouldn't scroll page normally 
        // to give a better experience, but for now we won't preventDefault globally so they can scroll.
        let isArrowKey = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);

        // Verify if user is interacting currently in the view of the game box roughly
        const rect = gameEl.getBoundingClientRect();
        const isInView = (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight));

        if (isArrowKey && isInView) e.preventDefault();

        let moved = false;
        switch (e.key) {
            case "ArrowUp": moved = moveUp(); break;
            case "ArrowDown": moved = moveDown(); break;
            case "ArrowLeft": moved = moveLeft(); break;
            case "ArrowRight": moved = moveRight(); break;
            default: return;
        }
        if (moved) afterMove();
    }

    function handleSwipe() {
        if (gameOver) return;
        const threshold = 30;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
        let moved = false;
        if (Math.abs(dx) > Math.abs(dy)) moved = dx > 0 ? moveRight() : moveLeft();
        else moved = dy > 0 ? moveDown() : moveUp();
        if (moved) afterMove();
    }

    function afterMove() {
        renderBoard();
        setTimeout(() => { addNewTile(); renderBoard(); checkState(); }, 120);
    }

    function addNewTile(skipAnim = false) {
        let empty = [];
        for (let r = 0; r < SIZE; r++) { for (let c = 0; c < SIZE; c++) { if (!grid[r][c]) empty.push({ r, c }); } }
        if (empty.length > 0) {
            let { r, c } = empty[Math.floor(Math.random() * empty.length)];
            let val = Math.random() < 0.9 ? 1 : 2;
            grid[r][c] = !skipAnim ? { val: val, isNew: true } : val;
        }
    }

    function getVal(r, c) {
        let cell = grid[r][c];
        if (cell === null) return null;
        return (typeof cell === 'object') ? cell.val : cell;
    }

    function resetMergeFlags() {
        mergedState = Array(SIZE).fill().map(() => Array(SIZE).fill(false));
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                let v = getVal(r, c);
                if (v) grid[r][c] = v;
            }
        }
    }

    function slide(row) {
        let arr = row.filter(val => val !== null);
        return arr.concat(Array(SIZE - arr.length).fill(null));
    }

    function combine(row) {
        let mergedIndices = [];
        for (let i = 0; i < SIZE - 1; i++) {
            if (row[i] !== null && row[i] === row[i + 1]) {
                row[i]++;
                row[i + 1] = null;
                score += Math.pow(2, row[i]);
                updateScore(score);
                mergedIndices.push(i);
                if (row[i] === 11 && !won) { won = true; showMessage("You Win!"); }
            }
        }
        return { row, mergedIndices };
    }

    function operate(rowValues) {
        let row = slide(rowValues);
        let result = combine(row);
        row = result.row;
        row = slide(row);
        return { row, mergedIndices: result.mergedIndices };
    }

    function getRow(r) { return [getVal(r, 0), getVal(r, 1), getVal(r, 2), getVal(r, 3)]; }
    function getCol(c) { return [getVal(0, c), getVal(1, c), getVal(2, c), getVal(3, c)]; }

    function moveLeft() {
        resetMergeFlags(); let changed = false;
        for (let r = 0; r < SIZE; r++) {
            let oldRow = getRow(r); let res = operate(oldRow);
            if (JSON.stringify(oldRow) !== JSON.stringify(res.row)) changed = true;
            for (let c = 0; c < SIZE; c++) grid[r][c] = res.row[c];
            res.mergedIndices.forEach(c => mergedState[r][c] = true);
        }
        return changed;
    }

    function moveRight() {
        resetMergeFlags(); let changed = false;
        for (let r = 0; r < SIZE; r++) {
            let oldRow = getRow(r); let res = operate([...oldRow].reverse()); let finalRow = [...res.row].reverse();
            if (JSON.stringify(oldRow) !== JSON.stringify(finalRow)) changed = true;
            for (let c = 0; c < SIZE; c++) grid[r][c] = finalRow[c];
            res.mergedIndices.forEach(i => mergedState[r][SIZE - 1 - i] = true);
        }
        return changed;
    }

    function moveUp() {
        resetMergeFlags(); let changed = false;
        for (let c = 0; c < SIZE; c++) {
            let oldCol = getCol(c); let res = operate(oldCol);
            if (JSON.stringify(oldCol) !== JSON.stringify(res.row)) changed = true;
            for (let r = 0; r < SIZE; r++) { grid[r][c] = res.row[r]; if (res.mergedIndices.includes(r)) mergedState[r][c] = true; }
        }
        return changed;
    }

    function moveDown() {
        resetMergeFlags(); let changed = false;
        for (let c = 0; c < SIZE; c++) {
            let oldCol = getCol(c); let res = operate([...oldCol].reverse()); let finalCol = [...res.row].reverse();
            if (JSON.stringify(oldCol) !== JSON.stringify(finalCol)) changed = true;
            for (let r = 0; r < SIZE; r++) { grid[r][c] = finalCol[r]; if (res.mergedIndices.includes(SIZE - 1 - r)) mergedState[r][c] = true; }
        }
        return changed;
    }

    function renderBoard() {
        const container = document.getElementById('tile-container'); container.innerHTML = '';
        const bgCells = document.querySelectorAll('.grid-cell');
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                let rawVal = grid[r][c];
                if (rawVal) {
                    let val = (typeof rawVal === 'object') ? rawVal.val : rawVal;
                    let isNew = (typeof rawVal === 'object') ? rawVal.isNew : false;
                    let bgCell = bgCells[r * SIZE + c];
                    let wrapper = document.createElement('div'); wrapper.classList.add('tile-wrapper');
                    wrapper.style.width = bgCell.offsetWidth + 'px'; wrapper.style.height = bgCell.offsetWidth + 'px';
                    wrapper.style.transform = `translate(${bgCell.offsetLeft}px, ${bgCell.offsetTop}px)`;
                    let inner = document.createElement('div'); inner.classList.add('tile-inner');
                    let letter = ALPHABET[val - 1] || "?";
                    wrapper.classList.add(`tile-${val <= 11 ? letter : 'super'}`);
                    inner.textContent = letter;
                    if (mergedState[r][c]) {
                        wrapper.classList.add('pop-anim');
                        let scaleVal = Math.min(1.25, 1.1 + (val * 0.015));
                        wrapper.style.setProperty('--pop-scale', scaleVal);
                        wrapper.style.setProperty('--pop-glow', val > 8 ? "rgba(255, 200, 50, 0.8)" : (val > 5 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"));
                        wrapper.style.zIndex = 100;
                    } else if (isNew) wrapper.classList.add('new-tile-anim');
                    wrapper.appendChild(inner); container.appendChild(wrapper);
                }
            }
        }
    }

    function updateScore(s) { document.getElementById('score').innerText = s; }

    function checkState() {
        for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (getVal(r, c) === null) return;
        for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
            let current = getVal(r, c);
            if ((c < SIZE - 1 && getVal(r, c + 1) === current) || (r < SIZE - 1 && getVal(r + 1, c) === current)) return;
        }
        gameOver = true; showMessage("Game Over");
    }

    function showMessage(msg) {
        document.getElementById('message-text').innerText = msg;
        document.getElementById('game-message').style.display = 'flex';
    }

    // --- Theme Switch Logic ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = savedTheme === 'dark';
        themeSwitch.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // --- Interactive Dot Grid Physics ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        // High-DPI Scaling for sharpness
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        let dots = [];
        const spacing = 40;
        
        // Resolve CSS variables for Canvas ingestion
        const rootStyles = getComputedStyle(document.documentElement);
        const colorPrimary = rootStyles.getPropertyValue('--primary').trim() || '#386FA4';
        const colorSecondary = rootStyles.getPropertyValue('--secondary').trim() || '#9E7682';
        const colorTertiary = rootStyles.getPropertyValue('--tertiary').trim() || '#C36F09';
        const themeColors = [colorPrimary, colorSecondary, colorTertiary];
        
        function initDots() {
            dots = [];
            width = window.innerWidth;
            
            // Maintain 100vh canvas for rendering speed, but generate geometry for the entire scroll structure
            const documentHeight = Math.max(window.innerHeight * 1.5, document.documentElement.scrollHeight);
            height = documentHeight; 
            
            const viewportHeight = window.innerHeight;
            
            canvas.width = width * dpr;
            canvas.height = viewportHeight * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale
            ctx.scale(dpr, dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${viewportHeight}px`;
            
            // True Honeycomb Lattice Generator
            const hexRadius = spacing; 
            const hexWidth = Math.sqrt(3) * hexRadius;
            const hexHeight = 2 * hexRadius; 
            
            let row = 0;
            // Draw slightly out of bounds to allow scrolling elasticity overlap
            for (let y = -spacing * 2; y < height + spacing * 2; y += 1.5 * hexRadius) {
                let offsetX = (row % 2 === 1) ? (hexWidth / 2) : 0;
                for (let x = -spacing * 2; x < width + spacing * 2; x += hexWidth) {
                    
                    let cx = x + offsetX;
                    let cy = y;
                    
                    // Generate two points per hexagon center to create the Bravais lattice basis
                    
                    // Point 1: Top of slice
                    let p1x = cx;
                    let p1y = cy - 0.5 * hexRadius;
                    let b1x = p1x + (Math.random() - 0.5) * spacing * 0.48;
                    let b1y = p1y + (Math.random() - 0.5) * spacing * 0.48;
                    
                    dots.push({
                        origX: p1x, origY: p1y,
                        baseX: b1x, baseY: b1y,
                        x: b1x, y: b1y,
                        vx: 0, vy: 0,
                        radius: 1.5, // Uniform scale
                        color: Math.random() < 0.1 ? themeColors[Math.floor(Math.random() * themeColors.length)] : null,
                        drawNeighbors: [],
                        allNeighbors: [],
                        timeOffset: Math.random() * 100,
                        pulseSpeed: 0.8 + Math.random() * 0.4
                    });

                    // Point 2: Bottom of slice
                    let p2x = cx;
                    let p2y = cy + 0.5 * hexRadius;
                    let b2x = p2x + (Math.random() - 0.5) * spacing * 0.48;
                    let b2y = p2y + (Math.random() - 0.5) * spacing * 0.48;
                    
                    dots.push({
                        origX: p2x, origY: p2y,
                        baseX: b2x, baseY: b2y,
                        x: b2x, y: b2y,
                        vx: 0, vy: 0,
                        radius: 1.5, // Uniform scale
                        color: Math.random() < 0.1 ? themeColors[Math.floor(Math.random() * themeColors.length)] : null,
                        drawNeighbors: [],
                        allNeighbors: [],
                        timeOffset: Math.random() * 100,
                        pulseSpeed: 0.8 + Math.random() * 0.4
                    });
                }
                row++;
            }
            
            // Pre-calculate strict line connections for empty Hex Mesh
            for (let i = 0; i < dots.length; i++) {
                for (let j = i + 1; j < dots.length; j++) {
                    // Honeycomb theoretical bond distance is EXACTLY `spacing` (40px)
                    const dist = Math.hypot(dots[i].origX - dots[j].origX, dots[i].origY - dots[j].origY);
                    if (dist > 0 && dist < spacing * 1.25) {
                        dots[i].drawNeighbors.push(dots[j]);
                        dots[i].allNeighbors.push(dots[j]);
                        dots[j].allNeighbors.push(dots[i]); // two-way graph
                    }
                }
            }
        }
        
        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                initDots();
            }
        });
        initDots();

        let mouse = { x: -1000, y: -1000 };
        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        function animate() {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(dpr, dpr); // Restore standard dpi scale
            
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const baseFillColorStr = isDark ? '255,255,255' : '0,0,0';
            
            const time = Date.now() * 0.001; 
            
            // Exactly 40% scrolling ratio
            const parallaxY = window.scrollY * 0.4;
            // Translate the Canvas coordinates upwards relative to smooth scrolling
            ctx.translate(0, -parallaxY); 

            // Neural Cascade Opacity Setup
            let tempPulse = new Float32Array(dots.length);
            let tempColor = new Array(dots.length);
            
            for (let i = 0; i < dots.length; i++) {
                let dot = dots[i];
                const centerDistX = Math.abs((width / 2) - dot.baseX) / (width / 2);
                
                // Track mouse proximity (Adjusted for parallax math natively so light binds perfectly to structure)
                const distToMouse = Math.hypot(mouse.x - dot.x, (mouse.y + parallaxY) - dot.y);
                const isHovered = distToMouse < 180;
                
                // Only fire pulses if colored AND outside the center 60%
                if (dot.color && centerDistX > 0.6) {
                    // 50% less frequent 
                    const phase = (time * 0.25 * dot.pulseSpeed) + dot.timeOffset;
                    dot.pulse = Math.pow((Math.sin(phase) + 1) / 2, 1000); 
                    
                    // Rests at Gray (null), ONLY adopts native color if currently firing OR hovered
                    dot.cascadeColor = (dot.pulse > 0.01 || isHovered) ? dot.color : null;
                } else {
                    dot.pulse = 0;
                    dot.cascadeColor = (dot.color && isHovered) ? dot.color : null; 
                }
            }
            
            // 2-Hop Jacobi Graph Diffusion for natural glowing color cascades
            for (let iter = 0; iter < 2; iter++) {
                for (let i = 0; i < dots.length; i++) {
                    let maxPulse = dots[i].pulse;
                    let bestColor = dots[i].cascadeColor;
                    
                    for (let neighbor of dots[i].allNeighbors) {
                        let potentialPulse = neighbor.pulse * 0.5; // Cascading loss per hop
                        
                        // Colored nodes resist having their Hue overridden unless the wave is very strong (>0.2)
                        let overrideThreshold = dots[i].color ? Math.max(dots[i].pulse, 0.2) : dots[i].pulse;
                        
                        if (potentialPulse > overrideThreshold) {
                            maxPulse = potentialPulse;
                            bestColor = neighbor.cascadeColor;
                        } else if (potentialPulse > maxPulse) {
                            // Adopt the kinetic intensity of the weak wave, but flare up with native color instead of remaining gray 
                            maxPulse = potentialPulse;
                            if (dots[i].color) bestColor = dots[i].color;
                        }
                    }
                    tempPulse[i] = maxPulse;
                    tempColor[i] = bestColor;
                }
                // Lock in pass
                for (let i = 0; i < dots.length; i++) {
                    dots[i].pulse = tempPulse[i];
                    dots[i].cascadeColor = tempColor[i];
                }
            }

            // First Pass: Physics
            for (let dot of dots) {
                const centerDistX = Math.abs((width / 2) - dot.baseX) / (width / 2);
                
                // Active Breathing isolated to thematic nodes outside center 60%
                if (dot.color && centerDistX > 0.6) {
                    const phase = (time * 0.5 * dot.pulseSpeed) + dot.timeOffset;
                    dot.vx += Math.sin(phase) * 0.030;
                    dot.vy += Math.cos(phase * 0.8) * 0.030;
                }
                
                // Neural Physical Ripple: Expanding force when Action Potential fires
                if (dot.pulse > 0.1) {
                    for (let neighbor of dot.allNeighbors) {
                        const ndx = neighbor.x - dot.x;
                        const ndy = neighbor.y - dot.y;
                        const dist = Math.max(Math.sqrt(ndx*ndx + ndy*ndy), 1);
                        
                        // Push force reduced by 50% (from 1.5 to 0.75)
                        const pushForce = dot.pulse * 0.75 / dist; 
                        neighbor.vx += ndx * pushForce;
                        neighbor.vy += ndy * pushForce;
                    }
                }
                
                // Mouse Drag Elasticity & Light Flare (Mapped to parallax grid Y)
                const dx = mouse.x - dot.x;
                const dy = (mouse.y + parallaxY) - dot.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                let mouseGlow = 0;
                if (dist < 180) {
                    const force = (180 - dist) / 180;
                    dot.vx -= (dx / dist) * force * 0.8;
                    dot.vy -= (dy / dist) * force * 0.8;
                    
                    // Creates a smooth gradient light source matching the physics radius
                    mouseGlow = Math.pow(force, 1.5); 
                }
                
                // Spring restitution returning to anchors (Reduced 30% for a looser, more organic mesh)
                dot.vx += (dot.baseX - dot.x) * 0.025;
                dot.vy += (dot.baseY - dot.y) * 0.025;
                
                // Structural String Pull 
                for (let neighbor of dot.drawNeighbors) {
                    const ndx = neighbor.x - dot.x;
                    const ndy = neighbor.y - dot.y;
                    const curDist = Math.sqrt(ndx*ndx + ndy*ndy);
                    const restDist = Math.hypot(neighbor.baseX - dot.baseX, neighbor.baseY - dot.baseY);
                    
                    const diff = (curDist - restDist) / Math.max(restDist, 1);
                    
                    // Reduced 30% for loose honeycomb deformation
                    const pullX = ndx * diff * 0.008;
                    const pullY = ndy * diff * 0.008;
                    
                    dot.vx += pullX;
                    dot.vy += pullY;
                    neighbor.vx -= pullX;
                    neighbor.vy -= pullY;
                }
                
                // Inertia & Friction
                dot.vx *= 0.85;
                dot.vy *= 0.85;
                
                dot.x += dot.vx;
                dot.y += dot.vy;
                
                // Parabolic X-Axis Opacity Mask (Widened 25% readability flat-zone)
                const currentCenterDistX = Math.abs((width / 2) - dot.x) / (width / 2);
                const shiftedDist = Math.max(0, currentCenterDistX - 0.25) / 0.75;
                const structAlpha = Math.pow(shiftedDist, 2.5) * 0.45; // Base opacity severely reduced for contrast 
                
                // Additive flares (Neuron Pulse + Mouse Proximity Light)
                // Mouse Glow is gated entirely by the underlying parabolic visibility mask
                const gatedMouseGlow = mouseGlow * Math.max(0, Math.pow(shiftedDist, 1.5));
                
                const totalAdditiveGlare = Math.min((dot.pulse * 0.375) + (gatedMouseGlow * 0.5), 1.0);
                let alpha = structAlpha + (totalAdditiveGlare * (1 - structAlpha)); 
                
                dot.alpha = alpha > 0.01 ? alpha : 0;
            }
            
            // Second Pass: Draw Meshes (Lines)
            ctx.lineWidth = 1 * dpr;
            for (let dot of dots) {
                if (dot.alpha === 0) continue;
                for (let neighbor of dot.drawNeighbors) {
                    if (neighbor.alpha === 0) continue;
                    
                    const lineAlpha = (dot.alpha + neighbor.alpha) / 2 * 0.35; 
                    
                    ctx.beginPath();
                    ctx.moveTo(dot.x, dot.y);
                    ctx.lineTo(neighbor.x, neighbor.y);
                    
                    // Wave Color bridging
                    let strokeColor = null;
                    let maxPulseIntensity = Math.max(dot.pulse, neighbor.pulse);
                    
                    if (maxPulseIntensity > 0.05) {
                        strokeColor = dot.pulse > neighbor.pulse ? dot.cascadeColor : neighbor.cascadeColor;
                    }
                    
                    if (strokeColor) {
                        // Action potential colors are 20% richer now
                        ctx.globalAlpha = Math.min(lineAlpha * 2.5, 1); 
                        ctx.strokeStyle = strokeColor;
                    } else {
                        ctx.globalAlpha = 1;
                        ctx.strokeStyle = `rgba(${baseFillColorStr}, ${lineAlpha})`;
                    }
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1.0;

            // Third Pass: Draw Nodes (Dots)
            for (let dot of dots) {
                if (dot.alpha === 0) continue;
                
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius * (1 + dot.pulse * 0.5), 0, Math.PI * 2);
                
                const activeColor = dot.cascadeColor; 
                
                if (activeColor) {
                    ctx.globalAlpha = Math.min(dot.alpha * 2.5, 1);
                    ctx.fillStyle = activeColor;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.fillStyle = `rgba(${baseFillColorStr}, ${dot.alpha})`;
                    ctx.fill();
                }
            }
            
            requestAnimationFrame(animate);
        }
        animate();
    }
});
