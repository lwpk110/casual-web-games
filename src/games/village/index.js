import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';

export function initVillageGame(container) {
  const GAME_ID = 'village';
  const WIDTH = 600;
  const HEIGHT = 480;

  let player = {
    x: 280,
    y: 260,
    targetX: 280,
    targetY: 260,
    speed: 160,
    isMoving: false
  };

  let state = {
    energy: 50,
    maxEnergy: 50,
    wood: 0,
    stone: 0,
    wheat: 0,
    coins: 100,
    treesChopped: 0,
    bridgeFixed: false,
    cottageFixed: false,
    quests: [
      { id: 'q1', text: '🌲 砍伐 2 棵野生树木', done: false, count: 0, target: 2, reward: '+20⚡ +100🪙' },
      { id: 'q2', text: '🌉 修复破旧木桥 (10木材+5石料)', done: false, count: 0, target: 1, reward: '解锁雪山地图' },
      { id: 'q3', text: '🏚️ 重建日出农舍 (15木材+10石料)', done: false, count: 0, target: 1, reward: '👑 村长勋章' }
    ]
  };

  let mapObjects = [
    { id: 1, type: 'tree', x: 100, y: 150, r: 24, hp: 3, maxHp: 3, cost: 5, reward: { wood: 3 } },
    { id: 2, type: 'tree', x: 450, y: 110, r: 24, hp: 3, maxHp: 3, cost: 5, reward: { wood: 3 } },
    { id: 3, type: 'tree', x: 140, y: 360, r: 24, hp: 3, maxHp: 3, cost: 5, reward: { wood: 3 } },
    { id: 4, type: 'rock', x: 80, y: 270, r: 20, hp: 3, maxHp: 3, cost: 8, reward: { stone: 3 } },
    { id: 5, type: 'rock', x: 400, y: 380, r: 20, hp: 3, maxHp: 3, cost: 8, reward: { stone: 3 } },
    { id: 6, type: 'berry', x: 330, y: 100, r: 18, hp: 1, maxHp: 1, cost: 3, reward: { energy: 15 } },
    { id: 7, type: 'cottage', x: 260, y: 120, r: 35, isRepaired: false, req: { wood: 15, stone: 10 } },
    { id: 8, type: 'bridge', x: 500, y: 240, r: 30, isRepaired: false, req: { wood: 10, stone: 5 } },
    { id: 9, type: 'farm', x: 360, y: 340, r: 22, state: 'empty', timer: 0 }
  ];

  let floatingPopups = [];
  let particles = [];
  let currentTargetObj = null;
  let regenTimer = 0;
  let gameInterval = null;
  let lastTime = performance.now();

  container.innerHTML = `
    <div class="village-wrapper">
      <div class="village-hud-top">
        <div class="village-energy-box">
          <span class="energy-icon">⚡</span>
          <div class="progress-track" style="width: 110px;">
            <div class="progress-fill-exp" id="village-energy-bar" style="width: 100%; background: linear-gradient(90deg, #ffb700, #00ff88);"></div>
          </div>
          <span style="font-size:0.85rem; font-weight:700" id="village-energy-text">50/50</span>
        </div>

        <div class="village-inventory-bar">
          <div class="inventory-item">🪵 <span id="inv-wood">0</span></div>
          <div class="inventory-item">🪨 <span id="inv-stone">0</span></div>
          <div class="inventory-item">🪙 <span id="inv-coins">100</span></div>
        </div>

        <button id="village-btn-ad-energy" class="play-btn" style="padding:0.4rem 0.8rem; font-size:0.8rem;">⚡ 领 30 能量</button>
      </div>

      <div class="village-map-container">
        <div class="quest-panel-sidebar">
          <div class="quest-header">📜 日出村庄任务链</div>
          <div id="quest-list"></div>
        </div>
        <canvas id="village-canvas" class="village-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#village-canvas');
  const ctx = canvas.getContext('2d');
  const energyBarEl = container.querySelector('#village-energy-bar');
  const energyTextEl = container.querySelector('#village-energy-text');
  const woodEl = container.querySelector('#inv-wood');
  const stoneEl = container.querySelector('#inv-stone');
  const coinsEl = container.querySelector('#inv-coins');
  const questListEl = container.querySelector('#quest-list');
  const adEnergyBtn = container.querySelector('#village-btn-ad-energy');

  function updateHUD() {
    const pct = (state.energy / state.maxEnergy) * 100;
    energyBarEl.style.width = `${pct}%`;
    energyTextEl.textContent = `${Math.round(state.energy)}/${state.maxEnergy}`;
    woodEl.textContent = state.wood;
    stoneEl.textContent = state.stone;
    coinsEl.textContent = state.coins;

    // Render Quest List
    questListEl.innerHTML = state.quests.map(q => `
      <div class="quest-item ${q.done ? 'completed' : ''}">
        ${q.text} <br>
        <span style="color:var(--text-muted); font-size:0.75rem;">奖励: ${q.reward}</span>
      </div>
    `).join('');
  }

  updateHUD();

  adEnergyBtn.addEventListener('click', () => {
    sound.playVictory();
    state.energy = Math.min(state.maxEnergy, state.energy + 30);
    spawnPopup(WIDTH / 2, HEIGHT / 2, '⚡ +30 能量充沛！');
    updateHUD();
  });

  function spawnPopup(x, y, text) {
    floatingPopups.push({ x, y, text, life: 1.0 });
  }

  function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check clicked map object
    let clickedObj = null;
    mapObjects.forEach(obj => {
      if (Math.hypot(obj.x - clickX, obj.y - clickY) < obj.r + 10) {
        clickedObj = obj;
      }
    });

    if (clickedObj) {
      currentTargetObj = clickedObj;
      player.targetX = clickedObj.x;
      player.targetY = clickedObj.y + 15;
      player.isMoving = true;
    } else {
      currentTargetObj = null;
      player.targetX = clickX;
      player.targetY = clickY;
      player.isMoving = true;
    }
  }

  canvas.addEventListener('click', handleCanvasClick);

  function interactObject(obj) {
    // Tree / Rock / Berry Harvesting
    if (['tree', 'rock', 'berry'].includes(obj.type)) {
      if (state.energy < obj.cost) {
        sound.playGameOver();
        spawnPopup(obj.x, obj.y - 20, '⚡ 能量不足！点击按钮看广告补充');
        return;
      }

      state.energy -= obj.cost;
      obj.hp--;
      sound.playMove();

      if (obj.type === 'tree') {
        state.wood += obj.reward.wood;
        spawnPopup(obj.x, obj.y - 20, `🪵 +${obj.reward.wood}`);
        state.quests[0].count++;
        if (state.quests[0].count >= state.quests[0].target && !state.quests[0].done) {
          state.quests[0].done = true;
          state.energy = Math.min(state.maxEnergy, state.energy + 20);
          state.coins += 100;
          sound.playVictory();
          spawnPopup(WIDTH / 2, HEIGHT / 2, '🎉 完成任务: +20⚡ +100🪙');
        }
      } else if (obj.type === 'rock') {
        state.stone += obj.reward.stone;
        spawnPopup(obj.x, obj.y - 20, `🪨 +${obj.reward.stone}`);
      } else if (obj.type === 'berry') {
        state.energy = Math.min(state.maxEnergy, state.energy + obj.reward.energy);
        spawnPopup(obj.x, obj.y - 20, `⚡ +${obj.reward.energy}`);
      }

      if (obj.hp <= 0) {
        mapObjects = mapObjects.filter(o => o.id !== obj.id);
      }
      updateHUD();
    }
    // Bridge Repair
    else if (obj.type === 'bridge') {
      if (obj.isRepaired) return;
      if (state.wood >= obj.req.wood && state.stone >= obj.req.stone) {
        state.wood -= obj.req.wood;
        state.stone -= obj.req.stone;
        obj.isRepaired = true;
        state.quests[1].done = true;
        state.coins += 200;
        sound.playVictory();
        spawnPopup(obj.x, obj.y - 30, '🌉 木桥修复成功！解锁雪山');
        updateHUD();
      } else {
        sound.playGameOver();
        spawnPopup(obj.x, obj.y - 20, `需要 🪵10 🪨5 (当前 🪵${state.wood} 🪨${state.stone})`);
      }
    }
    // Cottage Restoration
    else if (obj.type === 'cottage') {
      if (obj.isRepaired) return;
      if (state.wood >= obj.req.wood && state.stone >= obj.req.stone) {
        state.wood -= obj.req.wood;
        state.stone -= obj.req.stone;
        obj.isRepaired = true;
        state.quests[2].done = true;
        sound.playVictory();
        spawnPopup(obj.x, obj.y - 30, '👑 重建农舍成功！获得村长勋章');
        updateHUD();
      } else {
        sound.playGameOver();
        spawnPopup(obj.x, obj.y - 20, `需要 🪵15 🪨10 (当前 🪵${state.wood} 🪨${state.stone})`);
      }
    }
  }

  function update(dt) {
    // Energy Auto Regen
    regenTimer += dt;
    if (regenTimer > 3.0) {
      state.energy = Math.min(state.maxEnergy, state.energy + 1);
      regenTimer = 0;
      updateHUD();
    }

    // Player Movement
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      player.x += (dx / dist) * player.speed * dt;
      player.y += (dy / dist) * player.speed * dt;
    } else {
      player.x = player.targetX;
      player.y = player.targetY;
      if (player.isMoving && currentTargetObj) {
        interactObject(currentTargetObj);
        currentTargetObj = null;
      }
      player.isMoving = false;
    }

    // Floating Popups Update
    floatingPopups.forEach(p => {
      p.y -= dt * 25;
      p.life -= dt * 1.2;
    });
    floatingPopups = floatingPopups.filter(p => p.life > 0);
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Render Grass Tile Background
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // River Line & Bridge Area
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(480, 0, 120, HEIGHT); // River on the right

    // Render Map Objects
    mapObjects.forEach(obj => {
      ctx.save();
      if (obj.type === 'tree') {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🌲', obj.x, obj.y);
      } else if (obj.type === 'rock') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🪨', obj.x, obj.y);
      } else if (obj.type === 'berry') {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🍓', obj.x, obj.y);
      } else if (obj.type === 'bridge') {
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.isRepaired ? '🌉' : '⛓️', obj.x, obj.y);
      } else if (obj.type === 'cottage') {
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.isRepaired ? '🏡' : '🏚️', obj.x, obj.y);
      }
      ctx.restore();
    });

    // Render Player Character
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👨‍🌾', player.x, player.y);
    ctx.restore();

    // Render Floating Popups
    floatingPopups.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00ff88';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    });
  }

  function gameLoop(now) {
    const dt = Math.min(0.08, (now - lastTime) / 1000);
    lastTime = now;

    update(dt);
    render();

    if (gameInterval) requestAnimationFrame(gameLoop);
  }

  gameInterval = requestAnimationFrame(gameLoop);

  return () => {
    gameInterval = null;
    canvas.removeEventListener('click', handleCanvasClick);
  };
}
