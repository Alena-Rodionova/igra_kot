import { Player } from './Player.js';
import { InputHandler } from './input.js';
import { checkCollision } from './collision.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        
        this.canvas.width = 800;
        this.canvas.height = 450;
        
        this.input = new InputHandler();
        this.player = new Player(this.canvas.width, this.canvas.height);
        
        this.lastTime = 0;
        this.animationFrameId = null;
        this.isPaused = false;
        this.isGameOver = false;
        this.isStarted = false;
        
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.globalTime = 0;

        this.platforms = [
            { x: 0, y: 370, width: 160, height: 35, mainColor: '#9575cd', topColor: '#b39ddb' },
            { x: 230, y: 310, width: 160, height: 25, mainColor: '#9575cd', topColor: '#b39ddb' }, 
            { 
                x: 460, y: 240, width: 140, height: 25, mainColor: '#9575cd', topColor: '#b39ddb',
                isMoving: true, startX: 430, endX: 570, speed: 60, direction: 1 
            },
            { x: 190, y: 160, width: 160, height: 25, mainColor: '#9575cd', topColor: '#b39ddb' },
            { x: 630, y: 150, width: 140, height: 25, mainColor: '#9575cd', topColor: '#b39ddb' }
        ];

        this.spikes = { x: 290, y: 285, width: 35, height: 25, color: '#ff9800' };
        this.hazard = { x: 0, y: 425, width: this.canvas.width, height: 25 };
        
        this.cat = { x: 685, y: 112, width: 30, height: 38 };

        this.items = [];
        this.initItems();

        this.menuScreen = document.getElementById('menu-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.btnPauseHud = document.getElementById('btn-pause-hud');
        this.touchControls = document.getElementById('touch-controls');
        
        this.currentScoreEl = document.getElementById('current-score');
        this.bestScoreEl = document.getElementById('best-score');
        this.finalScoreEl = document.getElementById('final-score');
        this.gameoverTitleEl = document.getElementById('gameover-title');
        
        this.updateHUD();
        this.setupVisibilityListener();
        this.resizeCanvasDisplay();
        window.addEventListener('resize', () => this.resizeCanvasDisplay());
    }

    resizeCanvasDisplay() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        let newWidth = windowWidth - 20;
        let newHeight = newWidth * (450 / 800);
        if (newHeight > windowHeight - 120) {
            newHeight = windowHeight - 120;
            newWidth = newHeight * (800 / 450);
        }
        if (newWidth > 800) { newWidth = 800; newHeight = 450; }
        this.canvas.style.width = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;
    }

    initItems() {
        this.items = [
            { x: 300, y: 210, width: 26, height: 16, collected: false },
            { x: 520, y: 190, width: 26, height: 16, collected: false },
            { x: 260, y: 110, width: 26, height: 16, collected: false }
        ];
    }

    initUI() {
        document.getElementById('btn-start').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-pause-hud').addEventListener('click', () => this.pauseGame());
        document.getElementById('btn-restart-pause').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-retry').addEventListener('click', () => this.startNewGame());
    }

    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isStarted && !this.isPaused && !this.isGameOver) {
                this.pauseGame();
            }
        });
    }

    startNewGame() {
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.isStarted = true;
        this.player.reset();
        
        for(const plat of this.platforms) {
            if(plat.isMoving) plat.x = plat.startX;
        }

        this.initItems();
        this.updateHUD();

        this.menuScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.btnPauseHud.classList.remove('hidden');
        
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.touchControls.classList.remove('hidden-touch');
        }

        this.input.clearKeys();
        this.lastTime = performance.now();
        
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    pauseGame() {
        if (!this.isStarted || this.isGameOver || this.isPaused) return;
        this.isPaused = true;
        this.input.clearKeys();
        this.pauseScreen.classList.remove('hidden');
        this.btnPauseHud.classList.add('hidden');
    }

    resumeGame() {
        if (!this.isPaused || this.isGameOver) return;
        this.isPaused = false;
        this.pauseScreen.classList.add('hidden');
        this.btnPauseHud.classList.remove('hidden');
        this.lastTime = performance.now();
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    endGame(isVictory, message) {
        this.isGameOver = true;
        this.btnPauseHud.classList.add('hidden');
        this.gameoverScreen.classList.remove('hidden');
        this.finalScoreEl.textContent = this.score;
        this.gameoverTitleEl.textContent = message;
        
        if (isVictory) {
            this.gameoverTitleEl.style.color = '#ffb74d';
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.saveBestScore(this.bestScore);
            }
        } else {
            this.gameoverTitleEl.style.color = '#e57373';
        }
        this.updateHUD();
        this.input.clearKeys();
    }

    gameLoop(timestamp) {
        if (this.isPaused || this.isGameOver || !this.isStarted) {
            this.animationFrameId = null;
            return;
        }

        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        if (dt > 0.1) dt = 0.1;

        this.update(dt);
        this.render();

        this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        this.globalTime += dt;

        for (const plat of this.platforms) {
            if (plat.isMoving) {
                let oldX = plat.x;
                plat.x += plat.speed * plat.direction * dt;
                
                if (plat.x >= plat.endX) {
                    plat.x = plat.endX;
                    plat.direction = -1;
                } else if (plat.x <= plat.startX) {
                    plat.x = plat.startX;
                    plat.direction = 1;
                }

                if (this.player.onGround && 
                    this.player.x + this.player.width > oldX && 
                    this.player.x < oldX + plat.width && 
                    Math.abs((this.player.y + this.player.height) - plat.y) < 2) {
                    this.player.x += (plat.x - oldX);
                }
            }
        }

        this.player.update(this.input, dt, this.platforms);

        if (checkCollision(this.player, this.spikes)) {
            this.endGame(false, 'Укололась о кристаллы! 🛑');
            return;
        }

        if (this.player.y + this.player.height > this.canvas.height - 10 || checkCollision(this.player, this.hazard)) {
            this.endGame(false, 'Упала в горячую лаву! 🔥');
            return;
        }

        for (const item of this.items) {
            if (!item.collected && checkCollision(this.player, item)) {
                item.collected = true;
                this.score++;
                this.updateHUD();
            }
        }

        if (checkCollision(this.player, this.cat)) {
            this.endGame(true, 'Ура! Котенок спасен! 🐱✨');
        }
    }

    render() {
        const ctx = this.context;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // --- ВОЗВРАЩЕН КОНТРАСТНЫЙ ТЕМНЫЙ ФОН ---
        let skyGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGrad.addColorStop(0, '#2d243d');
        skyGrad.addColorStop(0.6, '#423659');
        skyGrad.addColorStop(1, '#5c4d7d');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = 'rgba(237, 231, 246, 0.25)';
        for (let i = 0; i < 15; i++) {
            let bubbleX = (i * 61) % this.canvas.width;
            let bubbleY = (i * 37) % (this.canvas.height - 100);
            let radius = Math.abs(Math.sin(this.globalTime * 0.4 + i)) * 3 + 2;
            ctx.beginPath(); ctx.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2); ctx.fill();
        }

        // 2. Лавандовые острова
        for (const plat of this.platforms) {
            ctx.fillStyle = plat.mainColor;
            ctx.fillRect(plat.x, plat.y + 6, plat.width, plat.height - 6);

            ctx.strokeStyle = 'rgba(49, 27, 146, 0.15)';
            ctx.lineWidth = 2;
            for (let offset = 12; offset < plat.height; offset += 8) {
                ctx.beginPath();
                ctx.moveTo(plat.x + 4, plat.y + offset);
                ctx.quadraticCurveTo(plat.x + plat.width / 2, plat.y + offset + (offset % 3), plat.x + plat.width - 4, plat.y + offset);
                ctx.stroke();
            }

            ctx.fillStyle = plat.topColor;
            ctx.fillRect(plat.x, plat.y, plat.width, 6);
        }
        // 3. Кристаллы-шипы
        ctx.save();
        ctx.fillStyle = this.spikes.color;
        ctx.beginPath();
        let startX = this.spikes.x;
        let step = this.spikes.width / 3;
        for (let i = 0; i < 3; i++) {
        let cx = startX + i * step + step / 2;
        ctx.moveTo(cx - step / 2, this.spikes.y + this.spikes.height);
        ctx.lineTo(cx, this.spikes.y);
        ctx.lineTo(cx + step / 2, this.spikes.y + this.spikes.height);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
        // 4. Оранжевые рыбки
        for (const item of this.items) {
        if (!item.collected) {
        ctx.save();
        let hoverY = Math.sin(this.globalTime * 4 + item.x) * 4;
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2 + hoverY);
        ctx.fillStyle = '#ffa726';
        ctx.beginPath();
        ctx.moveTo(item.width / 2.5, 0);
        ctx.bezierCurveTo(item.width / 4, -item.height / 1.8, -item.width / 5, -item.height / 1.8, -item.width / 3, 0);
        ctx.bezierCurveTo(-item.width / 5, item.height / 1.8, item.width / 4, item.height / 1.8, item.width / 2.5, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-item.width / 3, 0);
        ctx.quadraticCurveTo(-item.width / 2, -item.height / 1.5, -item.width / 1.8, -item.height / 2);
        ctx.quadraticCurveTo(-item.width / 2, 0, -item.width / 3, 0);
        ctx.quadraticCurveTo(-item.width / 2, item.height / 1.5, -item.width / 1.8, item.height / 2);
        ctx.quadraticCurveTo(-item.width / 2, 0, -item.width / 3, 0);
        ctx.fill();
        ctx.fillStyle = '#fff9c4';
        ctx.beginPath(); ctx.arc(item.width / 5, -1.5, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        }
        }
        // 5. Пушистый котенок
        ctx.save();
        ctx.translate(this.cat.x, this.cat.y);
        let catTailSwing = Math.sin(this.globalTime * 2.5) * 2.5;
        ctx.strokeStyle = '#ffa726';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(6, 30);
        ctx.bezierCurveTo(0 - catTailSwing, 26, -5 - catTailSwing, 15, -3, 6);
        ctx.stroke();
        ctx.fillStyle = '#ffb74d';
        ctx.beginPath(); ctx.arc(this.cat.width / 2, 24, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(this.cat.width / 2, 22, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffa726';
        ctx.beginPath();
        this.context.moveTo(this.cat.width / 2 - 6, 5); this.context.lineTo(this.cat.width / 2 + 6, 5);
        this.context.quadraticCurveTo(this.cat.width / 2 + 8, 3, this.cat.width - 2, -1);
        this.context.quadraticCurveTo(this.cat.width - 3, 7, this.cat.width - 1, 10);
        this.context.bezierCurveTo(this.cat.width + 2, 15, this.cat.width - 1, 20, this.cat.width / 2, 20);
        this.context.bezierCurveTo(1, 20, -2, 15, 1, 10);
        this.context.quadraticCurveTo(3, 7, 2, -1);
        this.context.quadraticCurveTo(this.cat.width / 2 - 8, 3, this.cat.width / 2 - 6, 5);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath(); ctx.moveTo(4, 5); ctx.lineTo(3, 1); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(this.cat.width - 4, 5); ctx.lineTo(this.cat.width - 3, 1); ctx.lineTo(this.cat.width - 6, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(this.cat.width / 2 - 3, 14, 3, 0, Math.PI * 2); ctx.arc(this.cat.width / 2 + 3, 14, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff8a80';
        ctx.beginPath(); ctx.moveTo(this.cat.width / 2 - 1, 13.5); ctx.lineTo(this.cat.width / 2 + 1, 13.5); ctx.lineTo(this.cat.width / 2, 14.8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#37474f';
        ctx.beginPath(); ctx.arc(this.cat.width / 2 - 4, 11, 1.8, 0, Math.PI * 2); ctx.arc(this.cat.width / 2 + 4, 11, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(this.cat.width / 2 - 3.4, 10.4, 0.6, 0, Math.PI * 2); ctx.arc(this.cat.width / 2 + 4.6, 10.4, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // 6. Игрок
        this.player.draw(ctx);
        // 7. Оранжевая лава
        let lavaGrad = ctx.createLinearGradient(0, this.hazard.y, 0, this.canvas.height);
        lavaGrad.addColorStop(0, '#ff5722');
        lavaGrad.addColorStop(0.5, '#ff9800');
        lavaGrad.addColorStop(1, '#e64a19');
        ctx.fillStyle = lavaGrad;
        ctx.beginPath();
        ctx.moveTo(0, this.canvas.height);
        ctx.lineTo(0, this.hazard.y);
        for (let x = 0; x <= this.canvas.width; x += 25) {
        let y = this.hazard.y + Math.sin(x * 0.03 + this.globalTime * 3.5) * 4;
        ctx.lineTo(x, y);
        }
        ctx.lineTo(this.canvas.width, this.canvas.height);
        ctx.closePath(); ctx.fill();
        }
        updateHUD() {
        this.currentScoreEl.textContent = this.score;
        this.bestScoreEl.textContent = this.bestScore;
        }
        loadBestScore() {
        try {
        const saved = localStorage.getItem('cat_platformer_best');
        return saved ? parseInt(saved, 10) : 0;
        } catch (e) { return 0; }
        }
        saveBestScore(score) {
        try { localStorage.setItem('cat_platformer_best', score.toString()); } catch (e) {}
        }
        }