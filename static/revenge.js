/**
 * REVENGE SHOOTER - 2D Keyboard Shooting Game
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ▼ BGM用の設定と再生開始を追加 ▼
const revengeBgm = new Audio('/static/Device_Pressure.mp3');
revengeBgm.loop = true;  // ループ再生
revengeBgm.volume = 0.3; // 音量

// 画面が開いた瞬間に再生を開始する
revengeBgm.play().catch(e => console.log("BGM再生エラー:", e));

let cw = canvas.width = window.innerWidth;
let ch = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
});

// ゲーム設定
const TARGET_SCORE = 2000;
let gameState = 'START'; 
let score = 0;
let timeLeft = 60;
let combo = 0;
let comboTimer = 0;
let gameLoopId, spawnIntervalId, timerId;

// ターゲットの顔画像
const targetImg = new Image();
targetImg.src = targetImageSrc;

// 入力管理
const keys = {};
window.addEventListener('keydown', (e) => { 
    keys[e.code] = true; 
    if(gameState === 'START' && e.code === 'Enter') startGame();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// --- クラス定義 ---
class Player {
    constructor() {
        this.width = 60; this.height = 40;
        this.x = cw / 2 - this.width / 2;
        this.y = ch - this.height - 20;
        this.speed = 5;
        this.lastShotTime = 0;
        this.fireRate = 100;
    }
    update() {
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > cw) this.x = cw - this.width;

        if (keys['Space']) {
            const now = Date.now();
            if (now - this.lastShotTime > this.fireRate) {
                bullets.push(new Bullet(this.x + this.width / 2, this.y));
                this.lastShotTime = now;
            }
        }
    }
    draw(ctx) {
        ctx.fillStyle = '#00f2ff'; ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff'; ctx.fill(); ctx.shadowBlur = 0;
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x; this.y = y; this.width = 6; this.height = 20; this.speed = 15;
    }
    update() { this.y -= this.speed; }
    draw(ctx) {
        ctx.fillStyle = '#ffea00'; ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        ctx.shadowBlur = 10; ctx.shadowColor = '#ffea00'; ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height); ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor() {
        this.radius = 30 + Math.random() * 20;
        this.x = Math.random() * (cw - this.radius * 2) + this.radius;
        this.y = -this.radius;
        
        // ★要望対応：落下速度を大幅にアップ（5〜10の速度）
        this.vy = 5 + Math.random() * 5; 
        
        this.vx = (Math.random() - 0.5) * 2;
        this.hp = Math.floor(this.radius / 15);
        this.maxHp = this.hp;
    }
    update() {
        this.y += this.vy; this.x += this.vx;
        if (this.x < this.radius || this.x > cw - this.radius) this.vx *= -1;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.clip();
        
        if (targetImg.complete && targetImg.src) {
            ctx.drawImage(targetImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.fillStyle = '#555'; ctx.fill();
        }
        
        if (this.hp < this.maxHp) { ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fill(); }
        ctx.lineWidth = 3; ctx.strokeStyle = '#ff0055'; ctx.stroke(); ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10; this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0; this.decay = Math.random() * 0.05 + 0.02;
        this.color = color; this.size = Math.random() * 4 + 2;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1.0;
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.life = 1.0; this.vy = -1;
    }
    update() { this.y += this.vy; this.life -= 0.02; }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
        ctx.font = 'bold 20px Orbitron'; ctx.fillText(this.text, this.x, this.y); ctx.globalAlpha = 1.0;
    }
}

let player;
let bullets = [];
let enemies = [];
let particles = [];
let floatingTexts = [];

function checkCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            let dx = e.x - b.x; let dy = e.y - b.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < e.radius + b.width) {
                e.hp--; bullets.splice(j, 1);
                createParticles(b.x, b.y, '#ffea00', 5);
                
                if (e.hp <= 0) {
                    combo++; comboTimer = 120;
                    let pts = 50 * combo; score += pts;
                    document.getElementById('score-display').innerText = `SCORE: ${score}`;
                    
                    showCombo();
                    floatingTexts.push(new FloatingText(e.x, e.y, `+${pts}`, '#00f2ff'));
                    createParticles(e.x, e.y, '#ff0055', 30);
                    
                    enemies.splice(i, 1); break;
                }
            }
        }
    }
}

function createParticles(x, y, color, count) { for(let i=0; i<count; i++) particles.push(new Particle(x, y, color)); }

function showCombo() {
    const cd = document.getElementById('combo-display');
    if (combo >= 2) { cd.innerText = `${combo}x COMBO!`; cd.classList.add('active'); }
}

function update() {
    if (gameState !== 'PLAYING') return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#fff'; for(let i=0; i<5; i++) ctx.fillRect(Math.random()*cw, Math.random()*ch, 1, 3);

    player.update(); player.draw(ctx);

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; b.update(); b.draw(ctx);
        if (b.y < -50) bullets.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i]; e.update(); e.draw(ctx);
        if (e.y > ch + e.radius) { combo = 0; enemies.splice(i, 1); }
    }

    checkCollisions();

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.update(); p.draw(ctx);
        if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i]; ft.update(); ft.draw(ctx);
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) { combo = 0; document.getElementById('combo-display').classList.remove('active'); }
    }

    gameLoopId = requestAnimationFrame(update);
}

document.getElementById('start-btn').addEventListener('click', startGame);

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameState = 'PLAYING';
    score = 0; timeLeft = 60; combo = 0;
    player = new Player(); bullets = []; enemies = []; particles = [];
    document.getElementById('score-display').innerText = `SCORE: 0`;
    document.getElementById('time-display').innerText = `TIME: 60`;

    spawnIntervalId = setInterval(() => {
        // 落下する数を増やす（例：毎回 3〜6個 同時に降らせる）
        let spawnCount = Math.floor(Math.random() * 4) + 3; 
        
        // 残り30秒を切ったらさらに激しくする（例：さらに +2個）
        if (timeLeft < 30) spawnCount += 2; 
        
        for(let i=0; i<spawnCount; i++) enemies.push(new Enemy());
    }, 1000);

    timerId = setInterval(() => {
        timeLeft--;
        document.getElementById('time-display').innerText = `TIME: ${timeLeft}`;
        if (timeLeft <= 0) endGame();
    }, 1000);

    update();
}

async function endGame() {
    gameState = 'END';
    clearInterval(spawnIntervalId); clearInterval(timerId); cancelAnimationFrame(gameLoopId);

    // ▼ ゲーム終了時（結果画面に移行する前）にBGMをピタッと止める ▼
    revengeBgm.pause();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.fillRect(0, 0, cw, ch);

    const isWin = score >= TARGET_SCORE;
    
    // ★要望対応：結果だけでなくスコア(score)もバックエンドに送信する
    const res = await fetch('/revenge_result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            result: isWin ? 'win' : 'lose',
            score: score // スコアを付与
        })
    });
    
    if (res.ok) {
        setTimeout(() => { window.location.href = '/select'; }, 1000);
    }
}