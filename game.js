// ==================== CONFIGURACIÓN ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar canvas al contenedor
function resizeCanvas() {
    const container = document.querySelector('.game-area');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const CELL_SIZE = 8;
let GRID_WIDTH, GRID_HEIGHT;

function updateGridSize() {
    GRID_WIDTH = Math.floor(canvas.width / CELL_SIZE);
    GRID_HEIGHT = Math.floor(canvas.height / CELL_SIZE);
}

updateGridSize();

// Colores Nokia LCD
const COLORS = {
    background: '#9bbc0f',
    dark: '#0f380f',
    medium: '#306230',
    light: '#8bac0f'
};

// ==================== ESTADO DEL JUEGO ====================
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;
let speed = 100;

// ==================== ELEMENTOS DOM ====================
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');

// Botones
const keyUp = document.getElementById('keyUp');
const keyDown = document.getElementById('keyDown');
const keyLeft = document.getElementById('keyLeft');
const keyRight = document.getElementById('keyRight');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

// ==================== INICIALIZACIÓN ====================
function init() {
    highScoreEl.textContent = formatScore(highScore);
    drawBackground();
    setupEventListeners();
}

function formatScore(num) {
    return num.toString().padStart(4, '0');
}

function startGame() {
    resizeCanvas();
    updateGridSize();
    
    // Reiniciar serpiente en el centro
    const centerX = Math.floor(GRID_WIDTH / 2);
    const centerY = Math.floor(GRID_HEIGHT / 2);
    
    snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY },
        { x: centerX - 3, y: centerY }
    ];
    
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = 100;
    
    scoreEl.textContent = formatScore(score);
    startOverlay.classList.add('hide');
    gameOverOverlay.classList.remove('show');
    
    spawnFood();
    gameRunning = true;
    gamePaused = false;
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, speed);
}

function pauseGame() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.textContent = formatScore(highScore);
    }
    
    finalScoreEl.textContent = score;
    gameOverOverlay.classList.add('show');
}

// ==================== LÓGICA DEL JUEGO ====================
function spawnFood() {
    let validPosition = false;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (!validPosition && attempts < maxAttempts) {
        food.x = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
        food.y = Math.floor(Math.random() * (GRID_HEIGHT - 2)) + 1;
        
        validPosition = !snake.some(segment => 
            segment.x === food.x && segment.y === food.y
        );
        attempts++;
    }
}

function update() {
    if (gamePaused) return;
    
    direction = { ...nextDirection };
    
    // Nueva posición de la cabeza
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    
    // Colisión con paredes
    if (head.x < 0 || head.x >= GRID_WIDTH || 
        head.y < 0 || head.y >= GRID_HEIGHT) {
        gameOver();
        return;
    }
    
    // Colisión consigo misma
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Verificar si comió
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = formatScore(score);
        spawnFood();
        
        // Aumentar velocidad
        if (speed > 50 && score % 50 === 0) {
            speed -= 5;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, speed);
        }
    } else {
        snake.pop();
    }
    
    // Victoria (llenar 80% de la cuadrícula)
    if (snake.length >= GRID_WIDTH * GRID_HEIGHT * 0.8) {
        gameOver();
        return;
    }
    
    draw();
}

// ==================== RENDERIZADO ====================
function drawBackground() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    drawBackground();
    drawFood();
    drawSnake();
}

function drawFood() {
    const x = food.x * CELL_SIZE;
    const y = food.y * CELL_SIZE;
    const size = CELL_SIZE;
    const pixel = Math.floor(size / 3);
    
    ctx.fillStyle = COLORS.dark;
    
    // Patrón de comida estilo Nokia (manzana pixelada)
    ctx.fillRect(x + pixel, y, pixel, pixel);
    ctx.fillRect(x, y + pixel, pixel, pixel);
    ctx.fillRect(x + pixel, y + pixel, pixel, pixel);
    ctx.fillRect(x + pixel * 2, y + pixel, pixel, pixel);
    ctx.fillRect(x, y + pixel * 2, pixel, pixel);
    ctx.fillRect(x + pixel, y + pixel * 2, pixel, pixel);
    ctx.fillRect(x + pixel * 2, y + pixel * 2, pixel, pixel);
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const isHead = index === 0;
        const isTail = index === snake.length - 1;
        
        if (isHead) {
            drawSnakeHead(x, y);
        } else if (isTail) {
            drawSnakeTail(x, y, index);
        } else {
            drawSnakeBody(x, y, index);
        }
    });
}

function drawSnakeHead(x, y) {
    ctx.fillStyle = COLORS.dark;
    const size = CELL_SIZE;
    const pixel = Math.floor(size / 3);
    
    // Cabeza completa
    ctx.fillRect(x, y, size, size);
    
    // Ojos según dirección
    ctx.fillStyle = COLORS.background;
    
    if (direction.x === 1) { // Derecha
        ctx.fillRect(x + pixel * 2 + 1, y + pixel - 1, 2, 2);
        ctx.fillRect(x + pixel * 2 + 1, y + pixel * 2, 2, 2);
    } else if (direction.x === -1) { // Izquierda
        ctx.fillRect(x + pixel - 2, y + pixel - 1, 2, 2);
        ctx.fillRect(x + pixel - 2, y + pixel * 2, 2, 2);
    } else if (direction.y === -1) { // Arriba
        ctx.fillRect(x + pixel - 1, y + pixel - 2, 2, 2);
        ctx.fillRect(x + pixel * 2, y + pixel - 2, 2, 2);
    } else { // Abajo
        ctx.fillRect(x + pixel - 1, y + pixel * 2 + 1, 2, 2);
        ctx.fillRect(x + pixel * 2, y + pixel * 2 + 1, 2, 2);
    }
}

function drawSnakeBody(x, y, index) {
    ctx.fillStyle = COLORS.dark;
    const size = CELL_SIZE;
    const pixel = Math.floor(size / 3);
    
    const prev = snake[index - 1];
    const curr = snake[index];
    const next = snake[index + 1];
    
    // Cuerpo base (centro)
    ctx.fillRect(x + pixel / 2, y + pixel / 2, size - pixel, size - pixel);
    
    // Conexiones con segmentos adyacentes
    if (prev) {
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        
        if (dx === 1) ctx.fillRect(x + size - pixel, y + pixel / 2, pixel, size - pixel);
        else if (dx === -1) ctx.fillRect(x, y + pixel / 2, pixel, size - pixel);
        if (dy === 1) ctx.fillRect(x + pixel / 2, y + size - pixel, size - pixel, pixel);
        else if (dy === -1) ctx.fillRect(x + pixel / 2, y, size - pixel, pixel);
    }
    
    if (next) {
        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        
        if (dx === 1) ctx.fillRect(x + size - pixel, y + pixel / 2, pixel, size - pixel);
        else if (dx === -1) ctx.fillRect(x, y + pixel / 2, pixel, size - pixel);
        if (dy === 1) ctx.fillRect(x + pixel / 2, y + size - pixel, size - pixel, pixel);
        else if (dy === -1) ctx.fillRect(x + pixel / 2, y, size - pixel, pixel);
    }
}

function drawSnakeTail(x, y, index) {
    ctx.fillStyle = COLORS.dark;
    const size = CELL_SIZE;
    const pixel = Math.floor(size / 3);
    
    const prev = snake[index - 1];
    const curr = snake[index];
    
    if (prev) {
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        
        // Cola más pequeña apuntando hacia el cuerpo
        if (dx === 1) {
            ctx.fillRect(x + pixel, y + pixel / 2, size - pixel, size - pixel);
        } else if (dx === -1) {
            ctx.fillRect(x, y + pixel / 2, size - pixel, size - pixel);
        } else if (dy === 1) {
            ctx.fillRect(x + pixel / 2, y + pixel, size - pixel, size - pixel);
        } else if (dy === -1) {
            ctx.fillRect(x + pixel / 2, y, size - pixel, size - pixel);
        }
    }
}

// ==================== CONTROLES ====================
function handleKeyPress(dir) {
    if (!gameRunning) {
        startGame();
        return;
    }
    
    switch(dir) {
        case 'up':
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'down':
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'left':
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'right':
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
    }
    
    // Efecto visual en botón
    const keyMap = {
        'up': keyUp,
        'down': keyDown,
        'left': keyLeft,
        'right': keyRight
    };
    
    const btn = keyMap[dir];
    if (btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 100);
    }
}

function setupEventListeners() {
    // Teclado
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                handleKeyPress('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                handleKeyPress('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                handleKeyPress('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                handleKeyPress('right');
                break;
            case ' ':
                e.preventDefault();
                if (!gameRunning || gameOverOverlay.classList.contains('show')) {
                    startGame();
                }
                break;
            case 'p':
            case 'P':
                pauseGame();
                break;
        }
    });
    
    // Botones de la cruceta
    keyUp.addEventListener('click', () => handleKeyPress('up'));
    keyDown.addEventListener('click', () => handleKeyPress('down'));
    keyLeft.addEventListener('click', () => handleKeyPress('left'));
    keyRight.addEventListener('click', () => handleKeyPress('right'));
    
    // Botones de acción
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    
    // Soporte táctil (swipe)
    let touchStartX = 0;
    let touchStartY = 0;
    
    const lcdScreen = document.querySelector('.lcd-screen');
    
    lcdScreen.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    lcdScreen.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    lcdScreen.addEventListener('touchend', (e) => {
        if (!gameRunning) {
            startGame();
            return;
        }
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        const minSwipe = 30;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > minSwipe) handleKeyPress('right');
            else if (dx < -minSwipe) handleKeyPress('left');
        } else {
            if (dy > minSwipe) handleKeyPress('down');
            else if (dy < -minSwipe) handleKeyPress('up');
        }
    }, { passive: true });
}

// ==================== INICIAR ====================
init();
