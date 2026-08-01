import { createHDApplication } from '../../core/pixi-engine.js';
import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';

export function initSuikaPixiGame(container) {
  const GAME_ID = 'suika-pixi';
  const WIDTH = 440;
  const HEIGHT = 560;
  const DANGER_Y = 95;

  const TIERS = [
    { tier: 0, r: 14, name: '微尘', color: 0x8e9bb0, score: 2, icon: '✨' },
    { tier: 1, r: 20, name: '彗星', color: 0x00f0ff, score: 4, icon: '☄️' },
    { tier: 2, r: 28, name: '水星', color: 0x00ff88, score: 8, icon: '💧' },
    { tier: 3, r: 36, name: '火星', color: 0xff007a, score: 16, icon: '🔥' },
    { tier: 4, r: 45, name: '金星', color: 0xffb700, score: 32, icon: '🌟' },
    { tier: 5, r: 55, name: '地球', color: 0x38bdf8, score: 64, icon: '🌍' },
    { tier: 6, r: 68, name: '天王星', color: 0x818cf8, score: 128, icon: '💎' },
    { tier: 7, r: 82, name: '海王星', color: 0xa855f7, score: 256, icon: '🔮' },
    { tier: 8, r: 98, name: '木星', color: 0xf97316, score: 512, icon: '🪐' },
    { tier: 9, r: 115, name: '太阳', color: 0xeab308, score: 1024, icon: '☀️' },
    { tier: 10, r: 135, name: '黑洞', color: 0xec4899, score: 2048, icon: '🌌' }
  ];

  container.innerHTML = `
    <div class="suika-wrapper">
      <div class="suika-header-bar">
        <div class="score-box">
          <span class="score-label">当前得分</span>
          <span class="score-value" id="suika-pixi-score">0</span>
        </div>

        <div class="next-preview-box">
          <span class="score-label">下一个:</span>
          <div class="next-preview-circle" id="suika-pixi-next-circle">✨</div>
        </div>

        <div class="score-box">
          <span class="score-label">最高纪录</span>
          <span class="score-value high-score" id="suika-pixi-high-score">0</span>
        </div>
      </div>

      <div class="suika-container-box">
        <div class="danger-line-indicator" id="suika-pixi-danger"></div>
        <div id="pixi-suika-container" style="width: 100%; height: 100%;"></div>
      </div>

      <div class="game-controls-bar" style="margin-top:0.75rem;">
        <button id="suika-pixi-btn-restart" class="btn-game-action">🚀 重新开始</button>
        <button id="suika-pixi-btn-ad-bomb" class="btn-game-action">💣 广告黑洞清场</button>
      </div>
    </div>
  `;

  const pixiContainer = container.querySelector('#pixi-suika-container');
  const scoreEl = container.querySelector('#suika-pixi-score');
  const highScoreEl = container.querySelector('#suika-pixi-high-score');
  const nextCircleEl = container.querySelector('#suika-pixi-next-circle');
  const restartBtn = container.querySelector('#suika-pixi-btn-restart');
  const adBombBtn = container.querySelector('#suika-pixi-btn-ad-bomb');

  // Initialize High-DPI Pixi.js Application
  const app = createHDApplication(pixiContainer, WIDTH, HEIGHT);

  let balls = [];
  let score = 0;
  let highScore = storage.getHighScore(GAME_ID);
  let currentTier = getRandomSpawnTier();
  let nextTier = getRandomSpawnTier();
  let pointerX = WIDTH / 2;
  let canDrop = true;
  let isGameOver = false;

  highScoreEl.textContent = highScore;

  function getRandomSpawnTier() {
    return Math.floor(Math.random() * 4);
  }

  function updateNextUI() {
    const t = TIERS[nextTier];
    const hexColor = '#' + t.color.toString(16).padStart(6, '0');
    nextCircleEl.style.background = hexColor;
    nextCircleEl.style.boxShadow = `0 0 10px ${hexColor}`;
    nextCircleEl.textContent = t.icon;
  }

  updateNextUI();

  // Pointer Interaction
  app.view.addEventListener('pointermove', (e) => {
    const rect = app.view.getBoundingClientRect();
    const x = e.clientX - rect.left;
    pointerX = Math.max(TIERS[currentTier].r, Math.min(WIDTH - TIERS[currentTier].r, x));
  });

  app.view.addEventListener('pointerdown', () => {
    if (canDrop && !isGameOver) {
      dropBall();
    }
  });

  restartBtn.addEventListener('click', () => resetGame());
  adBombBtn.addEventListener('click', () => {
    sound.playVictory();
    balls.forEach(b => {
      if (b.y > HEIGHT / 2) {
        app.stage.removeChild(b.gfx);
      }
    });
    balls = balls.filter(b => b.y <= HEIGHT / 2);
    adBombBtn.disabled = true;
    adBombBtn.textContent = '💣 清场完成';
  });

  function dropBall() {
    const tData = TIERS[currentTier];
    
    // Create Pixi Graphics Container
    const ballContainer = new PIXI.Container();
    const gfx = new PIXI.Graphics();
    gfx.beginFill(tData.color);
    gfx.drawCircle(0, 0, tData.r);
    gfx.endFill();
    gfx.lineStyle(2, 0xffffff, 0.5);
    gfx.drawCircle(0, 0, tData.r - 2);

    const txt = new PIXI.Text(tData.icon, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: Math.max(12, tData.r * 0.9),
      fill: '#000000',
      align: 'center'
    });
    txt.anchor.set(0.5);

    ballContainer.addChild(gfx);
    ballContainer.addChild(txt);
    ballContainer.x = pointerX;
    ballContainer.y = 50;

    app.stage.addChild(ballContainer);

    balls.push({
      x: pointerX,
      y: 50,
      vx: 0,
      vy: 120,
      tier: currentTier,
      r: tData.r,
      gfx: ballContainer
    });

    sound.playMove();
    canDrop = false;
    currentTier = nextTier;
    nextTier = getRandomSpawnTier();
    updateNextUI();

    setTimeout(() => { canDrop = true; }, 420);
  }

  function resetGame() {
    balls.forEach(b => app.stage.removeChild(b.gfx));
    balls = [];
    score = 0;
    currentTier = getRandomSpawnTier();
    nextTier = getRandomSpawnTier();
    canDrop = true;
    isGameOver = false;
    scoreEl.textContent = '0';
    updateNextUI();
    adBombBtn.disabled = false;
    adBombBtn.textContent = '💣 广告黑洞清场';
  }

  // Pixi Ticker Physics Update Loop
  app.ticker.add((delta) => {
    if (isGameOver) return;

    const dt = delta / 60;
    const GRAVITY = 550;
    const RESTITUTION = 0.35;
    const FRICTION = 0.98;

    // Position updates
    balls.forEach(b => {
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= FRICTION;

      if (b.x - b.r < 0) { b.x = b.r; b.vx *= -RESTITUTION; }
      if (b.x + b.r > WIDTH) { b.x = WIDTH - b.r; b.vx *= -RESTITUTION; }
      if (b.y + b.r > HEIGHT) { b.y = HEIGHT - b.r; b.vy *= -RESTITUTION; b.vx *= 0.92; }

      b.gfx.x = b.x;
      b.gfx.y = b.y;
    });

    // Merging check
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
          if (b1.tier === b2.tier && b1.tier < TIERS.length - 1) {
            const nextIdx = b1.tier + 1;
            const newTier = TIERS[nextIdx];
            const midX = (b1.x + b2.x) / 2;
            const midY = (b1.y + b2.y) / 2;

            app.stage.removeChild(b1.gfx);
            app.stage.removeChild(b2.gfx);

            balls.splice(j, 1);
            balls.splice(i, 1);

            // Create new upgraded ball container
            const newContainer = new PIXI.Container();
            const gfx = new PIXI.Graphics();
            gfx.beginFill(newTier.color);
            gfx.drawCircle(0, 0, newTier.r);
            gfx.endFill();
            gfx.lineStyle(2, 0xffffff, 0.5);
            gfx.drawCircle(0, 0, newTier.r - 2);

            const txt = new PIXI.Text(newTier.icon, {
              fontFamily: 'Outfit, sans-serif',
              fontSize: Math.max(12, newTier.r * 0.9),
              fill: '#000000',
              align: 'center'
            });
            txt.anchor.set(0.5);

            newContainer.addChild(gfx);
            newContainer.addChild(txt);
            newContainer.x = midX;
            newContainer.y = midY;

            app.stage.addChild(newContainer);

            balls.push({
              x: midX,
              y: midY,
              vx: (Math.random() - 0.5) * 40,
              vy: -60,
              tier: nextIdx,
              r: newTier.r,
              gfx: newContainer
            });

            score += newTier.score;
            scoreEl.textContent = score;
            if (storage.setHighScore(GAME_ID, score)) {
              highScore = score;
              highScoreEl.textContent = highScore;
            }

            sound.playCombine();
            break;
          } else {
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
  });

  return () => {
    try {
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    } catch (e) {
      console.warn('Pixi destroy warning:', e);
    }
  };
}
