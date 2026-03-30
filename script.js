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
});
