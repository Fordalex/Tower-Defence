const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let enemiesKilled = 0;
let enemiesReachedEnd = 0;
const maxEnemiesReachedEnd = 10;
let money = 100;
const towerCost = 20;
const enemyReward = 10;
const enemyPath = [
    { x: 0, y: 275 },
    { x: 425, y: 275 },
    { x: 425, y: 125 },
    { x: 625, y: 125 },
    { x: 625, y: 625 },
];

class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.range = 100;
        this.shootDelay = 1000;
        this.lastShot = Date.now();
        this.img = new Image();
        const svg = document.getElementById('towerSvg');
        const xml = new XMLSerializer().serializeToString(svg);
        const svg64 = btoa(xml);
        const b64Start = 'data:image/svg+xml;base64,';
        const image64 = b64Start + svg64;
        this.img.src = image64;
    }

    draw() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    shoot(enemies) {
        const now = Date.now();
        if (now - this.lastShot > this.shootDelay) {
            for (let enemy of enemies) {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.range) {
                    bullets.push(new Bullet(this.x, this.y, enemy));
                    this.lastShot = now;
                    playSound('gunshot.wav');
                    break;
                }
            }
        }
    }
}

class Bullet {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 5;
        this.speed = 3;
        this.target = target;
    }

    draw() {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / distance;
        const ny = dy / distance;

        this.x += nx * this.speed;
        this.y += ny * this.speed;

        // Check for collision with the target enemy
        if (distance < this.target.width / 2) {
            this.target.health -= 10;
            this.target = null;
            return true;
        }

        return false;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.health = 100;
        this.speed = 1;
        this.path = enemyPath;
        this.pathIndex = 0;
        this.img = new Image();
        const svg = document.getElementById('enemySvg');
        const xml = new XMLSerializer().serializeToString(svg);
        const svg64 = btoa(xml);
        const b64Start = 'data:image/svg+xml;base64,';
        const image64 = b64Start + svg64;
        this.img.src = image64;
    }

    draw() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

        // Draw enemy health
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText(this.health, this.x + this.width / 2 - 5, this.y - 5);
    }

    update() {
        const target = this.path[this.pathIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.pathIndex++;
            if (this.pathIndex >= this.path.length) {
                // Enemy reached the end
                return true;
            }
        } else {
            const nx = dx / distance;
            const ny = dy / distance;
            this.x += nx * this.speed;
            this.y += ny * this.speed;
        }

        return false;
    }
}

const towers = [];
const bullets = [];
const enemies = [];

canvas.addEventListener('click', (event) => {
    if (money >= towerCost && !isGridCellOccupied(hoverX, hoverY)) {
        const centerX = hoverX * gridSize + gridSize / 5;
        const centerY = hoverY * gridSize + gridSize / 5;
        towers.push(new Tower(centerX, centerY));
        money -= towerCost;
    }
});


const gridSize = 50;

function drawGrid() {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function isGridCellOccupied(x, y) {
    const centerX = x * gridSize + gridSize / 5;
    const centerY = y * gridSize + gridSize / 5;

    return towers.some(tower => {
        return tower.x === centerX && tower.y === centerY;
    });
}

function playSound(src) {
    const audio = new Audio(src);
    audio.play();
}

function spawnEnemy() {
    enemies.push(new Enemy(0, 300));
    playSound('enemy_spawn.wav');
}

function gameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 70, canvas.height / 2);
}

function drawPath() {
    ctx.beginPath();
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 40;
    
    const pathPoints = enemyPath
    
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    
    for (let i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    
    ctx.stroke();
}

function drawHUD() {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.fillText(`Enemies Killed: ${enemiesKilled}`, 20, canvas.height - 20);
    ctx.fillText(`Enemies Reached End: ${enemiesReachedEnd}/${maxEnemiesReachedEnd}`, 220, canvas.height - 20);
    ctx.fillText(`Money: $${money}`, 520, canvas.height - 20);
}

function drawHoverEffect(x, y) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
}

let hoverX = 0;
let hoverY = 0;

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    hoverX = Math.floor(x / gridSize);
    hoverY = Math.floor(y / gridSize);
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    drawPath();
    towers.forEach(tower => tower.draw());
    bullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    drawHUD();
    drawHoverEffect(hoverX, hoverY);
}


function update() {
    towers.forEach(tower => tower.shoot(enemies));
    bullets.forEach((bullet, index) => {
        if (bullet.update()) {
            bullets.splice(index, 1);
        }
    });    
    enemies.forEach((enemy, index) => {
        if (enemiesReachedEnd >= maxEnemiesReachedEnd) {
            gameOver();
            return;
        }

        if (enemy.update()) {
            enemiesReachedEnd++;
            enemies.splice(index, 1);
        } else if (enemy.health <= 0) {
            enemiesKilled++;
            enemies.splice(index, 1);
            money += enemyReward;
            playSound('enemy_death.wav');
        }
    });      
}

function gameLoop() {
    draw();
    update();
    requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy, 5000);
gameLoop();
