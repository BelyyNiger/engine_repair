// Инициализация Telegram Web App
Telegram.WebApp.ready();
Telegram.WebApp.expand();

// Конфигурация игры
const config = {
    soundEnabled: true,
    targetScore: 100,
    bombThresholds: [15, 40, 80],
    bombPenalties: [5, 15, 30],
    partTypes: 10,
    bombTypes: 3
};

// Пути к ресурсам
const assetPaths = {
    images: {
        background: {
            menu: 'assets/images/background/garage_doors_menu.jpg',
            game: 'assets/images/background/garage_interior.jpg'
        },
        car: {
            normal: 'assets/images/car/niva.png',
            broken: 'assets/images/car/niva_broken.png'
        },
        parts: [
            'assets/images/parts/piston.png',
            'assets/images/parts/spark_plug.png',
            'assets/images/parts/timing_belt.png',
            'assets/images/parts/oil_filter.png',
            'assets/images/parts/fuel_pump.png',
            'assets/images/parts/camshaft_gear.png',
            'assets/images/parts/oxygen_sensor.png',
            'assets/images/parts/valve.png',
            'assets/images/parts/bearing.png',
            'assets/images/parts/head_gasket.png'
        ],
        bombs: [
            'assets/images/bombs/bomb_small.png',
            'assets/images/bombs/bomb_medium.png',
            'assets/images/bombs/bomb_large.png'
        ],
        ui: {
            pause: 'assets/images/ui/pause_button.png',
            soundOn: 'assets/images/ui/sound_on.png',
            soundOff: 'assets/images/ui/sound_off.png'
        }
    },
    sounds: {
        music: 'assets/sounds/music/background_music.mp3',
        effects: {
            click: 'assets/sounds/effects/button_click.mp3',
            collect: 'assets/sounds/effects/collect_part.mp3',
            bomb1: 'assets/sounds/effects/bomb_explode_1.mp3',
            bomb2: 'assets/sounds/effects/bomb_explode_2.mp3',
            bomb3: 'assets/sounds/effects/bomb_explode_3.mp3',
            victory: 'assets/sounds/effects/victory.mp3',
            gameOver: 'assets/sounds/effects/game_over.mp3',
            countdown: 'assets/sounds/effects/countdown.mp3'
        }
    },
    animations: {
        victory: 'assets/animations/victory.gif'
    }
};

// Элементы DOM
const elements = {
    menu: document.getElementById('menu'),
    gameCanvas: document.getElementById('gameCanvas'),
    pauseBtn: document.getElementById('pause-btn'),
    pauseMenu: document.getElementById('pause-menu'),
    countdown: document.getElementById('countdown'),
    scoreDisplay: document.getElementById('score-display'),
    scoreText: document.getElementById('score-text'),
    playBtn: document.getElementById('play-btn'),
    soundBtn: document.getElementById('sound-btn'),
    resumeBtn: document.getElementById('resume-btn'),
    gameOver: document.getElementById('game-over'),
    resultTitle: document.getElementById('result-title'),
    resultImage: document.getElementById('result-image'),
    restartBtn: document.getElementById('restart-btn')
};

// Игровые переменные
let game = {
    ctx: null,
    score: 0,
    isPaused: false,
    isRunning: false,
    car: null,
    items: [],
    lastSpawn: 0,
    activeBombs: [false, false, false],
    assets: {
        images: {},
        sounds: {},
        animations: {}
    },
    backgroundMusic: null
};

// Загрузка ресурсов
async function loadAssets() {
    try {
        // Загрузка изображений
        await loadImages();
        
        // Загрузка звуков
        await loadSounds();
        
        console.log('Все ресурсы загружены успешно');
        return true;
    } catch (error) {
        console.error('Ошибка загрузки ресурсов:', error);
        return false;
    }
}

// Загрузка изображений
async function loadImages() {
    const imagePromises = [];
    
    // Фоновые изображения
    imagePromises.push(loadImage(assetPaths.images.background.menu, 'backgroundMenu'));
    imagePromises.push(loadImage(assetPaths.images.background.game, 'backgroundGame'));
    
    // Машины
    imagePromises.push(loadImage(assetPaths.images.car.normal, 'carNormal'));
    imagePromises.push(loadImage(assetPaths.images.car.broken, 'carBroken'));
    
    // Запчасти
    for (let i = 0; i < assetPaths.images.parts.length; i++) {
        imagePromises.push(loadImage(assetPaths.images.parts[i], `part${i}`));
    }
    
    // Бомбы
    for (let i = 0; i < assetPaths.images.bombs.length; i++) {
        imagePromises.push(loadImage(assetPaths.images.bombs[i], `bomb${i}`));
    }
    
    // UI элементы
    imagePromises.push(loadImage(assetPaths.images.ui.pause, 'pauseButton'));
    imagePromises.push(loadImage(assetPaths.images.ui.soundOn, 'soundOn'));
    imagePromises.push(loadImage(assetPaths.images.ui.soundOff, 'soundOff'));
    
    await Promise.all(imagePromises);
}

// Вспомогательная функция загрузки изображения
function loadImage(src, key) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            game.assets.images[key] = img;
            resolve();
        };
        img.onerror = () => {
            console.warn(`Не удалось загрузить изображение: ${src}`);
            // Создаем заглушку
            game.assets.images[key] = createPlaceholderImage();
            resolve();
        };
        img.src = src;
    });
}

// Создание заглушки для отсутствующих изображений
function createPlaceholderImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText('IMG', 35, 50);
    
    return canvas;
}

// Загрузка звуков
async function loadSounds() {
    // Для звуков просто сохраняем пути, реальная загрузка будет при воспроизведении
    game.assets.sounds = assetPaths.sounds.effects;
    game.assets.sounds.music = assetPaths.sounds.music;
}

// Инициализация игры
function initGame() {
    const canvas = elements.gameCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    game.ctx = canvas.getContext('2d');
    
    // Инициализируем машину игрока
    game.car = {
        x: canvas.width / 2 - 40,
        y: canvas.height - 120,
        width: 80,
        height: 60,
        speed: 8
    };
    
    game.score = 0;
    game.items = [];
    game.activeBombs = [false, false, false];
    game.isRunning = true;
    game.isPaused = false;
    
    updateScoreDisplay();
    
    // Запускаем фоновую музыку
    if (config.soundEnabled) {
        playBackgroundMusic();
    }
    
    gameLoop();
}

// Игровой цикл
function gameLoop() {
    if (!game.isRunning || game.isPaused) return;
    
    update();
    render();
    
    requestAnimationFrame(gameLoop);
}

function update() {
    const now = Date.now();
    
    // Спавн новых предметов
    if (now - game.lastSpawn > 800) { // Увеличили частоту спавна
        spawnItem();
        game.lastSpawn = now;
    }
    
    // Обновление позиций предметов
    for (let i = game.items.length - 1; i >= 0; i--) {
        const item = game.items[i];
        item.y += item.speed;
        
        // Проверка столкновения с машиной
        if (checkCollision(game.car, item)) {
            if (item.type === 'part') {
                game.score += 1;
                playSound('collect');
            } else {
                game.score = Math.max(0, game.score - item.penalty);
                playSound(`bomb${item.subType + 1}`);
            }
            game.items.splice(i, 1);
            updateScoreDisplay();
            checkGameEnd();
            continue;
        }
        
        // Удаление вышедших за экран предметов
        if (item.y > elements.gameCanvas.height) {
            game.items.splice(i, 1);
        }
    }
    
    // Активация бомб при достижении порогов
    for (let i = 0; i < config.bombThresholds.length; i++) {
        if (game.score >= config.bombThresholds[i]) {
            game.activeBombs[i] = true;
        }
    }
    
    // Обработка ввода
    handleInput();
}

function render() {
    const ctx = game.ctx;
    const canvas = elements.gameCanvas;
    
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рендер фона гаража
    if (game.assets.images.backgroundGame) {
        ctx.drawImage(game.assets.images.backgroundGame, 0, 0, canvas.width, canvas.height);
    } else {
        // Запасной фон
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Рендер предметов
    game.items.forEach(item => {
        if (item.type === 'part') {
            const partImage = game.assets.images[`part${item.subType}`];
            if (partImage) {
                ctx.drawImage(partImage, item.x, item.y, item.width, item.height);
            }
        } else {
            const bombImage = game.assets.images[`bomb${item.subType}`];
            if (bombImage) {
                ctx.drawImage(bombImage, item.x, item.y, item.width, item.height);
            }
        }
    });
    
    // Рендер машины
    if (game.assets.images.carNormal) {
        ctx.drawImage(game.assets.images.carNormal, game.car.x, game.car.y, game.car.width, game.car.height);
    }
}

function spawnItem() {
    const canvas = elements.gameCanvas;
    const bombChance = 0.25; // 25% chance for bomb
    
    if (Math.random() < bombChance && game.activeBombs.some(b => b)) {
        // Выбираем активный тип бомбы
        const availableBombs = game.activeBombs.map((active, index) => active ? index : -1).filter(i => i !== -1);
        if (availableBombs.length > 0) {
            const bombType = availableBombs[Math.floor(Math.random() * availableBombs.length)];
            game.items.push({
                x: Math.random() * (canvas.width - 40),
                y: -40,
                width: 40,
                height: 40,
                type: 'bomb',
                subType: bombType,
                speed: 3 + Math.random() * 2,
                penalty: config.bombPenalties[bombType]
            });
        }
    } else {
        // Спавн запчасти
        game.items.push({
            x: Math.random() * (canvas.width - 35),
            y: -35,
            width: 35,
            height: 35,
            type: 'part',
            subType: Math.floor(Math.random() % config.partTypes),
            speed: 2 + Math.random() * 2
        });
    }
}

function checkCollision(car, item) {
    return car.x < item.x + item.width &&
           car.x + car.width > item.x &&
           car.y < item.y + item.height &&
           car.y + car.height > item.y;
}

function updateScoreDisplay() {
    elements.scoreText.textContent = `${game.score}/${config.targetScore}`;
}

function checkGameEnd() {
    if (game.score >= config.targetScore) {
        endGame(true);
    } else if (game.score <= 0) {
        endGame(false);
    }
}

function endGame(isWin) {
    game.isRunning = false;
    
    // Останавливаем музыку
    if (game.backgroundMusic) {
        game.backgroundMusic.pause();
        game.backgroundMusic.currentTime = 0;
    }
    
    if (isWin) {
        elements.resultTitle.textContent = 'Двигатель починен!';
        elements.resultImage.src = assetPaths.animations.victory;
        playSound('victory');
    } else {
        elements.resultTitle.textContent = 'Потрачено';
        if (game.assets.images.carBroken) {
            elements.resultImage.src = game.assets.images.carBroken.src;
        }
        playSound('gameOver');
    }
    
    elements.gameOver.style.display = 'flex';
    sendResultsToTelegram(isWin);
}

function playSound(type) {
    if (!config.soundEnabled) return;
    
    try {
        const soundPath = game.assets.sounds[type];
        if (soundPath) {
            const audio = new Audio(soundPath);
            audio.volume = 0.7;
            audio.play().catch(e => console.log('Audio play error:', e));
        }
    } catch (error) {
        console.log('Sound error:', error);
    }
}

function playBackgroundMusic() {
    if (!config.soundEnabled || !game.assets.sounds.music) return;
    
    try {
        game.backgroundMusic = new Audio(game.assets.sounds.music);
        game.backgroundMusic.volume = 0.5;
        game.backgroundMusic.loop = true;
        game.backgroundMusic.play().catch(e => console.log('Music play error:', e));
    } catch (error) {
        console.log('Music error:', error);
    }
}

function startCountdown() {
    elements.countdown.style.display = 'flex';
    let count = 3;
    
    function updateCountdown() {
        elements.countdown.textContent = count;
        playSound('countdown');
        
        if (count > 0) {
            count--;
            setTimeout(updateCountdown, 1000);
        } else {
            elements.countdown.style.display = 'none';
            game.isPaused = false;
            gameLoop();
        }
    }
    
    updateCountdown();
}

// Управление машиной
let keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function handleInput() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        game.car.x = Math.max(0, game.car.x - game.car.speed);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        game.car.x = Math.min(elements.gameCanvas.width - game.car.width, game.car.x + game.car.speed);
    }
}

// Touch controls для мобильных устройств
let touchStartX = 0;

elements.gameCanvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    e.preventDefault();
});

elements.gameCanvas.addEventListener('touchmove', (e) => {
    if (!game.isRunning || game.isPaused) return;
    
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX;
    
    game.car.x = Math.max(0, Math.min(
        elements.gameCanvas.width - game.car.width, 
        game.car.x + deltaX
    ));
    
    touchStartX = touchX;
    e.preventDefault();
});

// Отправка результатов в Telegram
function sendResultsToTelegram(isWin) {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({
            game: 'engine_repair',
            score: game.score,
            win: isWin,
            timestamp: Date.now()
        }));
    }
}

// Обработчики событий UI
elements.playBtn.addEventListener('click', async () => {
    playSound('click');
    const loaded = await loadAssets();
    if (loaded) {
        elements.menu.style.display = 'none';
        initGame();
    } else {
        alert('Не все ресурсы загрузились, но игра будет запущена с базовой графикой');
        elements.menu.style.display = 'none';
        initGame();
    }
});

elements.soundBtn.addEventListener('click', () => {
    playSound('click');
    config.soundEnabled = !config.soundEnabled;
    elements.soundBtn.textContent = config.soundEnabled ? '🔊 Звук Вкл' : '🔇 Звук Выкл';
    
    if (config.soundEnabled && game.isRunning) {
        playBackgroundMusic();
    } else if (game.backgroundMusic) {
        game.backgroundMusic.pause();
    }
});

elements.pauseBtn.addEventListener('click', () => {
    playSound('click');
    if (game.isRunning && !game.isPaused) {
        game.isPaused = true;
        elements.pauseMenu.style.display = 'flex';
    }
});

elements.resumeBtn.addEventListener('click', () => {
    playSound('click');
    elements.pauseMenu.style.display = 'none';
    startCountdown();
});

elements.restartBtn.addEventListener('click', () => {
    playSound('click');
    elements.gameOver.style.display = 'none';
    initGame();
});

// Адаптация к изменению размера окна
window.addEventListener('resize', () => {
    if (game.isRunning && game.ctx) {
        const canvas = elements.gameCanvas;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Обновляем позицию машины
        game.car.x = Math.min(game.car.x, canvas.width - game.car.width);
    }
});

// Предзагрузка основных ресурсов при загрузке страницы
window.addEventListener('load', () => {
    // Устанавливаем фон меню
    if (assetPaths.images.background.menu) {
        elements.menu.style.backgroundImage = `url('${assetPaths.images.background.menu}')`;
    }
});
