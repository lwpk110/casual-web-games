import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';

export function initSuikaGame(container) {
  const GAME_ID = 'suika';
  const WIDTH = 440;
  const HEIGHT = 560;
  const DANGER_Y = 95;

  const TIERS = [
    { tier: 0, r: 14, name: '微尘', color: '#8e9bb0', score: 2, icon: '✨' },
    { tier: 1, r: 20, name: '彗星', color: '#00f0ff', score: 4, icon: '☄️' },
    { tier: 2, r: 28, name: '水星', color: '#00ff88', score: 8, icon: '💧' },
    { tier: 3, r: 36, name: '火星', color: '#ff007a', score: 16, icon: '🔥' },
    { tier: 4, r: 45, name: '金星', color: '#ffb700', score: 32, icon: '🌟' },
    { tier: 5, r: 55, name: '地球', color: '#38bdf8', score: 64, icon: '🌍' },
    { tier: 6, r: 68, name: '天王星', color: '#818cf8', score: 128, icon: '💎' },
    { tier: 7, r: 82, name: '海王星', color: '#a855f7', score: 256, icon: '🔮' },
    { tier: 8, r: 98, name: '木星', color: '#f97316', score: 512, icon: '🪐' },
    { tier: 9, r: 115, name: '太阳', color: '#eab308', score: 1024, icon: '☀️' },
    { tier: 10, r: 135, name: '黑洞', color: '#ec4899', score: 2048, icon: '🌌' }
  ];

  let balls = [];
  let shockwaves = [];
  let particles = [];
  let score = 0;
  let highScore = storage.getHighScore(GAME_ID);
  let currentTier = getRandomSpawnTier();
  let nextTier = getRandomSpawnTier();
  let pointerX = WIDTH / 2;
  let canDrop = true;
  let dropCooldownTimer = 0;
  let dangerTimer = 0;
  let isGameOver = false;
  let gameInterval = null;
  let lastTime = performance.now();

  container.innerHTML = `
    <div class="suika-wrapper">
      <div class="suika-header-bar">
        <div class="score-box">
          <span class="score-label">当前得分</span>
          <span class="score-value" id="suika-score">0</span>
        </div>

        <div class="next-preview-box">
          <span class="score-label">下一个:</span>
          <div class="next-preview-circle" id="suika-next-circle">✨</div>
        </div>

        <div class="score-box">
          <span class="score-label">最高纪录</span>
          <span class="score-value high-score" id="suika-high-score">${highScore}</span>
        </div>
      </div>

      <div class="suika-container-box">
        <div class="danger-line-indicator" id="danger-line"></div>
        <canvas id="suika-canvas" class="suika-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
      </div>

      <div class="game-controls-bar" style="margin-top:0.75rem;">
        <button id="suika-btn-restart" class="btn-game-action">🚀 重新开始</button>
        <button id="suika-btn-ad-bomb" class="btn-game-action">💣 广告黑洞清场</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#suika-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = container.querySelector('#suika-score');
  const highScoreEl = container.querySelector('#suika-high-score');
  const nextCircleEl = container.querySelector('#suika-next-circle');
  const dangerLineEl = container.querySelector('#danger-line');
  const restartBtn = container.querySelector('#suika-btn-restart');
  const adBombBtn = container.querySelector('#suika-btn-ad-bomb');

  function getRandomSpawnTier() {
    // Return tier between 0 and 3 for spawn
    return Math.floor(Math.random() * 4);
  }

  function updateNextUI() {
    const t = TIERS[nextTier];
    nextCircleEl.style.background = t.color;
    nextCircleEl.style.boxShadow = `0 0 10px ${t.color}`;
    nextCircleEl.textContent = t.icon;
  }

  updateNextUI();

  // Pointer Input
  function handlePointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : pointerX);
    pointerX = Math.max(TIERS[currentTier].r, Math.min(WIDTH - TIERS[currentTier].r, clientX - rect.left));
  }

  function handlePointerClick(e) {
    if (!canDrop || isGameOver) return;
    dropBall();
  }

  canvas.addEventListener('mousemove', handlePointerMove);
  canvas.addEventListener('touchmove', handlePointerMove);
  canvas.addEventListener('click', handlePointerClick);
  canvas.addEventListener('touchend', handlePointerClick);

  restartBtn.addEventListener('click', () => resetGame());
  adBombBtn.addEventListener('click', () => {
    // Clear bottom half balls via Ad Bomb
    sound.playVictory();
    balls = balls.filter(b => b.y < HEIGHT / 2);
    createShockwave(WIDTH / 2, HEIGHT * 0.75, 180);
    adBombBtn.textContent = '💣 清场完成';
    adBombBtn.disabled = true;
  });

  function dropBall() {
    const tierData = TIERS[currentTier];
    balls.push({
      x: pointerX,
      y: 50,
      vx: 0,
      vy: 120,
      tier: currentTier,
      r: tierData.r,
      color: tierData.color,
      icon: tierData.icon,
      isResting: false
    });

    sound.playMove();
    canDrop = false;
    currentTier = nextTier;
    nextTier = getRandomSpawnTier();
    updateNextUI();

    setTimeout(() => {
      canDrop = true;
    }, 450);
  }

  function resetGame() {
    balls = [];
    shockwaves = [];
    particles = [];
    score = 0;
    currentTier = getRandomSpawnTier();
    nextTier = getRandomSpawnTier();
    canDrop = true;
    isGameOver = false;
    dangerTimer = 0;
    scoreEl.textContent = '0';
    dangerLineEl.classList.remove('danger-warning-pulse');
    updateNextUI();
    adBombBtn.disabled = false;
    adBombBtn.textContent = '💣 广告黑洞清场';
  }

  function createShockwave(x, y, maxR = 60) {
    shockwaves.push({ x, y, r: 5, maxR, life: 1.0 });
  }

  function createParticleBurst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 30;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        r: Math.random() * 4 + 2
      });
    }
  }

  function updatePhysics(dt) {
    if (isGameOver) return;

    const GRAVITY = 550;
    const RESTITUTION = 0.35;
    const FRICTION = 0.98;

    // 1. Position & Velocity Updates
    balls.forEach(b => {
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= FRICTION;

      // Wall boundaries
      if (b.x - b.r < 0) { b.x = b.r; b.vx *= -RESTITUTION; }
      if (b.x + b.r > WIDTH) { b.x = WIDTH - b.r; b.vx *= -RESTITUTION; }
      if (b.y + b.r > HEIGHT) { b.y = HEIGHT - b.r; b.vy *= -RESTITUTION; b.vx *= 0.92; }
    });

    // 2. Ball to Ball Collisions & Merging
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];
        if (!b1 || !b2) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b1.r + b2.r;

        if (dist < minDist && dist > 0) {
          // Check for Merge!
          if (b1.tier === b2.tier && b1.tier < TIERS.length - 1) {
            const nextTierIdx = b1.tier + 1;
            const newTier = TIERS[nextTierIdx];
            const midX = (b1.x + b2.x) / 2;
            const midY = (b1.y + b2.y) / 2;

            // Remove merged balls
            balls.splice(j, 1);
            balls.splice(i, 1);

            // Spawn upgraded ball
            balls.push({
              x: midX,
              y: midY,
              vx: (Math.random() - 0.5) * 40,
              vy: -60,
              tier: nextTierIdx,
              r: newTier.r,
              color: newTier.color,
              icon: newTier.icon,
              isResting: false
            });

            // Score & FX
            score += newTier.score;
            scoreEl.textContent = score;
            if (storage.setHighScore(GAME_ID, score)) {
              highScore = score;
              highScoreEl.textContent = highScore;
            }

            sound.playCombine();
            createShockwave(midX, midY, newTier.r * 1.5);
            createParticleBurst(midX, midY, newTier.color);
            break;
          } else {
            // Standard Elastic Collision Resolution
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            b1.vx -= p * nx * 0.6;
            b1.vy -= p * ny * 0.6;
            b2.vx += p * nx * 0.6;
            b2.vy += p * ny * 0.6;
          }
        }
      }
    }

    // 3. Danger Line Check
    let overDanger = false;
    balls.forEach(b => {
      if (b.y - b.r < DANGER_Y && Math.hypot(b.vx, b.vy) < 20) {
        overDanger = true;
      }
    });

    if (overDanger) {
      dangerTimer += dt;
      dangerLineEl.classList.add('danger-warning-pulse');
      if (dangerTimer > 3.2) {
        triggerGameOver();
      }
    } else {
      dangerTimer = Math.max(0, dangerTimer - dt);
      dangerLineEl.classList.remove('danger-warning-pulse');
    }

    // 4. Update FX
    shockwaves.forEach(sw => {
      sw.r += dt * 120;
      sw.life -= dt * 2;
    });
    shockwaves = shockwaves.filter(sw => sw.life > 0);

    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 2.2;
    });
    particles = particles.filter(p => p.life > 0);
  }

  function triggerGameOver() {
    isGameOver = true;
    sound.playGameOver();
    setTimeout(() => {
      alert(`🎉 游戏结束！您的最终合成得分是: ${score}`);
    }, 150);
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw Background Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
    }

    // Draw Drop Indicator at Top
    if (canDrop && !isGameOver) {
      const curData = TIERS[currentTier];
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pointerX, 45);
      ctx.lineTo(pointerX, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Indicator Ball
      ctx.shadowBlur = 15;
      ctx.shadowColor = curData.color;
      ctx.fillStyle = curData.color;
      ctx.beginPath();
      ctx.arc(pointerX, 45, curData.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = `${curData.r}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(curData.icon, pointerX, 45);
    }

    // Draw Shockwaves
    shockwaves.forEach(sw => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
      ctx.strokeStyle = `rgba(0, 240, 255, ${sw.life})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Balls
    balls.forEach(b => {
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      // Inner Highlight Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 2, 0, Math.PI * 2);
      ctx.stroke();

      // Icon Center
      ctx.fillStyle = '#000';
      ctx.font = `${Math.max(10, b.r * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, b.x, b.y);
    });

    // Draw Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function gameLoop(now) {
    const dt = Math.min(0.08, (now - lastTime) / 1000);
    lastTime = now;

    updatePhysics(dt);
    render();

    if (gameInterval) requestAnimationFrame(gameLoop);
  }

  resetGame();
  gameInterval = requestAnimationFrame(gameLoop);

  return () => {
    gameInterval = null;
    canvas.removeEventListener('mousemove', handlePointerMove);
    canvas.removeEventListener('touchmove', handlePointerMove);
    canvas.removeEventListener('click', handlePointerClick);
    canvas.removeEventListener('touchend', handlePointerClick);
  };
}
