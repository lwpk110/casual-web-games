import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';
import { CameraJuice, FloatingText, Particle } from './juice.js';

export function initSurvivorGame(container) {
  const GAME_ID = 'survivor';
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 480;

  // Local Storage Meta Upgrades
  let metaData = storage.loadData().survivorMeta || {
    gold: 0,
    hpLevel: 0,
    dmgLevel: 0,
    spdLevel: 0
  };

  function saveMeta() {
    const data = storage.loadData();
    data.survivorMeta = metaData;
    localStorage.setItem('casual_web_games_data', JSON.stringify(data));
  }

  // Game World State
  let player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    radius: 12,
    speed: 160 + metaData.spdLevel * 15,
    maxHp: 100 + metaData.hpLevel * 25,
    hp: 100 + metaData.hpLevel * 25,
    level: 1,
    exp: 0,
    maxExp: 30,
    goldEarned: 0,
    weapons: {
      laser: 1,      // Level 1-5
      lightning: 0,  // Level 0-5
      shield: 0,     // Level 0-5
      magnet: 1      // Level 1-5
    }
  };

  let keys = {};
  let enemies = [];
  let bullets = [];
  let expOrbs = [];
  let floatingTexts = [];
  let particles = [];
  
  let cameraJuice = new CameraJuice();
  let gameInterval = null;
  let lastTime = performance.now();
  let spawnTimer = 0;
  let laserTimer = 0;
  let lightningTimer = 0;
  let isPaused = false;
  let isGameOver = false;
  let hasResurrected = false;

  container.innerHTML = `
    <div class="survivor-container">
      <div class="survivor-hud">
        <div class="survivor-bar-wrapper">
          <span class="survivor-bar-label">生命值 HP</span>
          <div class="progress-track">
            <div class="progress-fill-hp" id="survivor-hp-bar"></div>
          </div>
        </div>

        <div class="score-box">
          <span class="score-label">等级 LV</span>
          <span class="score-value" id="survivor-level">1</span>
        </div>

        <div class="score-box">
          <span class="score-label">金币 GOLD</span>
          <span class="score-value high-score" id="survivor-gold">0</span>
        </div>

        <div class="survivor-bar-wrapper">
          <span class="survivor-bar-label">经验 EXP</span>
          <div class="progress-track">
            <div class="progress-fill-exp" id="survivor-exp-bar"></div>
          </div>
        </div>
      </div>

      <div style="position: relative;">
        <canvas id="survivor-canvas" class="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>
        <div id="survivor-upgrade-overlay" class="upgrade-modal-overlay" style="display: none;"></div>
      </div>

      <div class="game-controls-bar">
        <button id="survivor-btn-shop" class="btn-game-action">🛠️ 科技工坊</button>
        <button id="survivor-btn-pause" class="btn-game-action">⏸️ 暂停</button>
      </div>

      <div class="mobile-controls">
        <button class="dpad-btn dpad-up" id="surv-up">▲</button>
        <button class="dpad-btn dpad-left" id="surv-left">◄</button>
        <button class="dpad-btn dpad-right" id="surv-right">►</button>
        <button class="dpad-btn dpad-down" id="surv-down">▼</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#survivor-canvas');
  const ctx = canvas.getContext('2d');
  const hpBar = container.querySelector('#survivor-hp-bar');
  const expBar = container.querySelector('#survivor-exp-bar');
  const levelEl = container.querySelector('#survivor-level');
  const goldEl = container.querySelector('#survivor-gold');
  const upgradeOverlay = container.querySelector('#survivor-upgrade-overlay');
  const shopBtn = container.querySelector('#survivor-btn-shop');
  const pauseBtn = container.querySelector('#survivor-btn-pause');

  function updateHUD() {
    const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
    const expPct = Math.min(100, (player.exp / player.maxExp) * 100);
    hpBar.style.width = `${hpPct}%`;
    expBar.style.width = `${expPct}%`;
    levelEl.textContent = player.level;
    goldEl.textContent = player.goldEarned + metaData.gold;
  }

  function handleKeyDown(e) { keys[e.code] = true; }
  function handleKeyUp(e) { keys[e.code] = false; }
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Mobile D-Pad Continuous Input
  let mobileDir = { x: 0, y: 0 };
  const bindDpad = (id, dx, dy) => {
    const btn = container.querySelector(id);
    btn.addEventListener('pointerdown', () => { mobileDir.x = dx; mobileDir.y = dy; });
    btn.addEventListener('pointerup', () => { mobileDir.x = 0; mobileDir.y = 0; });
    btn.addEventListener('pointerleave', () => { mobileDir.x = 0; mobileDir.y = 0; });
  };
  bindDpad('#surv-up', 0, -1);
  bindDpad('#surv-down', 0, 1);
  bindDpad('#surv-left', -1, 0);
  bindDpad('#surv-right', 1, 0);

  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶️ 继续' : '⏸️ 暂停';
  });

  shopBtn.addEventListener('click', () => showShopModal());

  function resetGame() {
    player.x = CANVAS_WIDTH / 2;
    player.y = CANVAS_HEIGHT / 2;
    player.maxHp = 100 + metaData.hpLevel * 25;
    player.hp = player.maxHp;
    player.speed = 160 + metaData.spdLevel * 15;
    player.level = 1;
    player.exp = 0;
    player.maxExp = 30;
    player.goldEarned = 0;
    player.weapons = { laser: 1, lightning: 0, shield: 0, magnet: 1 };
    
    enemies = [];
    bullets = [];
    expOrbs = [];
    floatingTexts = [];
    particles = [];
    isGameOver = false;
    isPaused = false;
    hasResurrected = false;

    updateHUD();
    upgradeOverlay.style.display = 'none';
  }

  function spawnEnemy() {
    const isBoss = Math.random() < 0.05 && enemies.filter(e => e.type === 'boss').length === 0;
    const type = isBoss ? 'boss' : (Math.random() < 0.3 ? 'chaser' : 'drone');
    
    let x, y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -20 : CANVAS_WIDTH + 20;
      y = Math.random() * CANVAS_HEIGHT;
    } else {
      x = Math.random() * CANVAS_WIDTH;
      y = Math.random() < 0.5 ? -20 : CANVAS_HEIGHT + 20;
    }

    const enemy = {
      x, y,
      type,
      hp: type === 'boss' ? 120 : (type === 'chaser' ? 25 : 8),
      maxHp: type === 'boss' ? 120 : (type === 'chaser' ? 25 : 8),
      speed: type === 'boss' ? 45 : (type === 'chaser' ? 70 : 100),
      radius: type === 'boss' ? 24 : (type === 'chaser' ? 14 : 9),
      color: type === 'boss' ? '#ff007a' : (type === 'chaser' ? '#ffb700' : '#00f0ff')
    };

    enemies.push(enemy);
  }

  function fireLaser() {
    if (enemies.length === 0) return;
    // Find nearest enemy
    let nearest = null;
    let minDist = Infinity;
    enemies.forEach(e => {
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < minDist) { minDist = d; nearest = e; }
    });

    if (nearest && minDist < 350) {
      const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
      const count = player.weapons.laser;
      
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.15;
        bullets.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(angle + spread) * 450,
          vy: Math.sin(angle + spread) * 450,
          dmg: 12 + metaData.dmgLevel * 3,
          radius: 4,
          color: '#00f0ff'
        });
      }
      sound.playMove();
    }
  }

  function fireLightning() {
    if (player.weapons.lightning <= 0 || enemies.length === 0) return;
    const count = player.weapons.lightning + 1;
    // Target random enemies
    const targets = [...enemies].sort(() => Math.random() - 0.5).slice(0, count);

    targets.forEach(e => {
      e.hp -= 25 + metaData.dmgLevel * 5;
      floatingTexts.push(new FloatingText(e.x, e.y - 10, '⚡ 25', '#7000ff'));
      for (let i = 0; i < 6; i++) particles.push(new Particle(e.x, e.y, '#7000ff'));
    });
    sound.playScore();
  }

  function triggerLevelUp() {
    isPaused = true;
    sound.playVictory();

    const ALL_UPGRADES = [
      { id: 'laser', name: '双发/多连发激光', icon: '🚀', desc: '增加主炮同时发射的激光数量与威力' },
      { id: 'lightning', name: '等离子闪电链', icon: '⚡', desc: '解锁/强化自动寻找目标的连锁闪电攻击' },
      { id: 'shield', name: '能量力场护盾', icon: '🛡️', desc: '环绕战机的能量圈，持续对贴近敌人造成伤害' },
      { id: 'magnet', name: '量子经验磁铁', icon: '🧲', desc: '大幅扩大经验晶体与金币的自动吸附范围' },
      { id: 'heal', name: '应急装甲修复', icon: '💖', desc: '立即恢复 50% 属性最大生命值' }
    ];

    // Pick 3 random upgrades
    const choices = [...ALL_UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);

    upgradeOverlay.innerHTML = `
      <div class="upgrade-title">✨ 战斗升级 (LEVEL ${player.level})</div>
      <div class="upgrade-cards-grid">
        ${choices.map(c => `
          <div class="upgrade-card" data-id="${c.id}">
            <div class="upgrade-card-icon">${c.icon}</div>
            <div class="upgrade-card-name">${c.name}</div>
            <div class="upgrade-card-desc">${c.desc}</div>
          </div>
        `).join('')}
      </div>
    `;

    upgradeOverlay.style.display = 'flex';

    upgradeOverlay.querySelectorAll('.upgrade-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        if (id === 'heal') {
          player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5);
        } else {
          player.weapons[id] = (player.weapons[id] || 0) + 1;
        }
        upgradeOverlay.style.display = 'none';
        isPaused = false;
        updateHUD();
      });
    });
  }

  function triggerGameOver() {
    isGameOver = true;
    sound.playGameOver();

    // Add earned gold to metaData
    metaData.gold += player.goldEarned;
    saveMeta();

    if (!hasResurrected) {
      // Show Resurrection Modal
      upgradeOverlay.innerHTML = `
        <div class="upgrade-title" style="color:#ff007a">💀 战机摧毁 GAME OVER</div>
        <p style="color:var(--text-muted); margin-bottom:1.5rem">本局获得金币: <strong style="color:var(--accent-amber)">${player.goldEarned}</strong></p>
        <div style="display:flex; flex-direction:column; gap:1rem; width:100%; max-width:320px;">
          <button id="btn-ad-resurrect" class="play-btn" style="padding:0.8rem; justify-content:center">🎬 观看广告满血复活 + 清场</button>
          <button id="btn-give-up" class="btn-game-action" style="padding:0.8rem; justify-content:center">放弃并进入结算</button>
        </div>
      `;
      upgradeOverlay.style.display = 'flex';

      upgradeOverlay.querySelector('#btn-ad-resurrect').addEventListener('click', () => {
        hasResurrected = true;
        player.hp = player.maxHp;
        enemies = []; // Clear enemies
        cameraJuice.shake(20, 400);
        sound.playVictory();
        upgradeOverlay.style.display = 'none';
        isGameOver = false;
        updateHUD();
      });

      upgradeOverlay.querySelector('#btn-give-up').addEventListener('click', () => {
        showSettlementModal();
      });
    } else {
      showSettlementModal();
    }
  }

  function showSettlementModal() {
    upgradeOverlay.innerHTML = `
      <div class="upgrade-title">🏆 战果结算</div>
      <p style="color:var(--text-muted); font-size:1.1rem; margin-bottom:1.5rem">
        存活等级: <strong>LV ${player.level}</strong><br>
        获得金币: <strong style="color:var(--accent-amber)">${player.goldEarned} GOLD</strong>
      </p>
      <div style="display:flex; flex-direction:column; gap:1rem; width:100%; max-width:320px;">
        <button id="btn-ad-triple" class="play-btn" style="padding:0.8rem; justify-content:center">🎬 看广告领取 3 倍金币 (${player.goldEarned * 3})</button>
        <button id="btn-restart" class="btn-game-action" style="padding:0.8rem; justify-content:center">🚀 重新开始</button>
      </div>
    `;
    upgradeOverlay.style.display = 'flex';

    upgradeOverlay.querySelector('#btn-ad-triple').addEventListener('click', () => {
      metaData.gold += player.goldEarned * 2; // Extra 2x
      saveMeta();
      sound.playCombine();
      resetGame();
    });

    upgradeOverlay.querySelector('#btn-restart').addEventListener('click', () => {
      resetGame();
    });
  }

  function showShopModal() {
    isPaused = true;
    const hpCost = (metaData.hpLevel + 1) * 50;
    const dmgCost = (metaData.dmgLevel + 1) * 50;
    const spdCost = (metaData.spdLevel + 1) * 50;

    upgradeOverlay.innerHTML = `
      <div class="upgrade-title">🛠️ 科技工坊 (局外天赋)</div>
      <p style="color:var(--text-muted); margin-bottom:1rem">当前金币: <strong style="color:var(--accent-amber)">${metaData.gold} GOLD</strong></p>
      <div class="shop-modal-container">
        <div class="shop-item">
          <div class="shop-item-info">
            <span class="shop-item-name">💖 基础生命值 (LV ${metaData.hpLevel})</span>
            <span class="shop-item-level">+25 最大 HP</span>
          </div>
          <button id="buy-hp" class="play-btn" ${metaData.gold < hpCost ? 'disabled style="opacity:0.5"' : ''}>${hpCost} G</button>
        </div>

        <div class="shop-item">
          <div class="shop-item-info">
            <span class="shop-item-name">⚔️ 基础伤害力 (LV ${metaData.dmgLevel})</span>
            <span class="shop-item-level">+3 全武器攻击伤害</span>
          </div>
          <button id="buy-dmg" class="play-btn" ${metaData.gold < dmgCost ? 'disabled style="opacity:0.5"' : ''}>${dmgCost} G</button>
        </div>

        <div class="shop-item">
          <div class="shop-item-info">
            <span class="shop-item-name">⚡ 战机飞行速度 (LV ${metaData.spdLevel})</span>
            <span class="shop-item-level">+15 移动速度</span>
          </div>
          <button id="buy-spd" class="play-btn" ${metaData.gold < spdCost ? 'disabled style="opacity:0.5"' : ''}>${spdCost} G</button>
        </div>
      </div>
      <button id="close-shop" class="btn-game-action" style="margin-top:1.5rem">返回战斗</button>
    `;

    upgradeOverlay.style.display = 'flex';

    const updateShopView = () => showShopModal();

    upgradeOverlay.querySelector('#buy-hp')?.addEventListener('click', () => {
      if (metaData.gold >= hpCost) {
        metaData.gold -= hpCost;
        metaData.hpLevel++;
        saveMeta();
        sound.playScore();
        updateShopView();
      }
    });

    upgradeOverlay.querySelector('#buy-dmg')?.addEventListener('click', () => {
      if (metaData.gold >= dmgCost) {
        metaData.gold -= dmgCost;
        metaData.dmgLevel++;
        saveMeta();
        sound.playScore();
        updateShopView();
      }
    });

    upgradeOverlay.querySelector('#buy-spd')?.addEventListener('click', () => {
      if (metaData.gold >= spdCost) {
        metaData.gold -= spdCost;
        metaData.spdLevel++;
        saveMeta();
        sound.playScore();
        updateShopView();
      }
    });

    upgradeOverlay.querySelector('#close-shop').addEventListener('click', () => {
      upgradeOverlay.style.display = 'none';
      isPaused = false;
      updateHUD();
    });
  }

  function update(dt) {
    if (isPaused || isGameOver) return;

    cameraJuice.update(dt);

    // Player Movement
    let dx = 0, dy = 0;
    if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
    if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) dx += 1;

    if (mobileDir.x !== 0 || mobileDir.y !== 0) {
      dx = mobileDir.x;
      dy = mobileDir.y;
    }

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    player.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.x + dx * player.speed * dt));
    player.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.y + dy * player.speed * dt));

    // Timers & Firing
    spawnTimer += dt;
    laserTimer += dt;
    lightningTimer += dt;

    if (spawnTimer > Math.max(0.4, 1.2 - player.level * 0.05)) {
      spawnEnemy();
      spawnTimer = 0;
    }

    if (laserTimer > 0.45) {
      fireLaser();
      laserTimer = 0;
    }

    if (lightningTimer > 2.0 && player.weapons.lightning > 0) {
      fireLightning();
      lightningTimer = 0;
    }

    // Shield Aura Damage Check
    if (player.weapons.shield > 0) {
      const auraRadius = 40 + player.weapons.shield * 10;
      enemies.forEach(e => {
        if (Math.hypot(e.x - player.x, e.y - player.y) < auraRadius + e.radius) {
          e.hp -= 20 * dt;
        }
      });
    }

    // Move Bullets
    bullets.forEach((b, bIdx) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Bullet hit enemy check
      enemies.forEach(e => {
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
          e.hp -= b.dmg;
          bullets.splice(bIdx, 1);
          floatingTexts.push(new FloatingText(e.x, e.y - 8, `-${Math.round(b.dmg)}`, '#00f0ff'));
          for (let i = 0; i < 4; i++) particles.push(new Particle(e.x, e.y, b.color));
        }
      });
    });

    // Filter out-of-bound bullets
    bullets = bullets.filter(b => b.x >= -50 && b.x <= CANVAS_WIDTH + 50 && b.y >= -50 && b.y <= CANVAS_HEIGHT + 50);

    // Update Enemies & Collisions
    enemies.forEach((e, eIdx) => {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;

      // Player Collision Check
      if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius) {
        player.hp -= (e.type === 'boss' ? 40 : 15) * dt;
        cameraJuice.shake(6, 100);
        updateHUD();
        if (player.hp <= 0) {
          triggerGameOver();
        }
      }

      // Enemy Death Check
      if (e.hp <= 0) {
        // Drop EXP and Gold
        const expAmount = e.type === 'boss' ? 50 : (e.type === 'chaser' ? 15 : 5);
        expOrbs.push({ x: e.x, y: e.y, amount: expAmount, isGold: e.type === 'boss' });

        if (e.type === 'boss') {
          player.goldEarned += 25;
          cameraJuice.shake(12, 250);
          sound.playCombine();
        } else {
          player.goldEarned += 1;
        }

        for (let i = 0; i < 8; i++) particles.push(new Particle(e.x, e.y, e.color));
        enemies.splice(eIdx, 1);
        updateHUD();
      }
    });

    // Update EXP Orbs & Pickup Check
    const magnetRadius = 60 + player.weapons.magnet * 25;
    expOrbs.forEach((orb, oIdx) => {
      const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
      if (dist < magnetRadius) {
        // Magnet Pull
        orb.x += (player.x - orb.x) * 8 * dt;
        orb.y += (player.y - orb.y) * 8 * dt;
      }

      if (dist < player.radius + 8) {
        player.exp += orb.amount;
        expOrbs.splice(oIdx, 1);
        sound.playMove();

        if (player.exp >= player.maxExp) {
          player.exp -= player.maxExp;
          player.level++;
          player.maxExp = Math.round(player.maxExp * 1.35);
          triggerLevelUp();
        }
        updateHUD();
      }
    });

    // Update Particles & Floating Text
    floatingTexts.forEach(ft => ft.update(dt));
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);

    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => p.life > 0);
  }

  function render() {
    ctx.save();
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    cameraJuice.applyTransform(ctx);

    // Draw Subtle Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // Draw EXP Orbs
    expOrbs.forEach(orb => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = orb.isGold ? '#ffb700' : '#00ff88';
      ctx.fillStyle = orb.isGold ? '#ffb700' : '#00ff88';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.isGold ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Shield Aura
    if (player.weapons.shield > 0) {
      const auraRadius = 40 + player.weapons.shield * 10;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f0ff';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Bullets
    bullets.forEach(b => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Enemies
    enemies.forEach(e => {
      ctx.shadowBlur = 12;
      ctx.shadowColor = e.color;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // Boss Health Bar
      if (e.type === 'boss') {
        const barWidth = 40;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 12, barWidth, 5);
        ctx.fillStyle = '#ff007a';
        ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 12, barWidth * (e.hp / e.maxHp), 5);
      }
    });

    // Draw Player Ship
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff88';
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Particles & Floating Texts
    particles.forEach(p => p.render(ctx));
    floatingTexts.forEach(ft => ft.render(ctx));

    ctx.restore();
  }

  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    update(dt);
    render();

    if (gameInterval) requestAnimationFrame(gameLoop);
  }

  resetGame();
  gameInterval = requestAnimationFrame(gameLoop);

  return () => {
    gameInterval = null;
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };
}
