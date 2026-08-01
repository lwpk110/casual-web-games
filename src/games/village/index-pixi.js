import { createHDApplication } from '../../core/pixi-engine.js';
import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';

export function initVillagePixiGame(container) {
  const GAME_ID = 'village-pixi';
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
    coins: 100,
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
    { id: 8, type: 'bridge', x: 500, y: 240, r: 30, isRepaired: false, req: { wood: 10, stone: 5 } }
  ];

  container.innerHTML = `
    <div class="village-wrapper">
      <div class="village-hud-top">
        <div class="village-energy-box">
          <span class="energy-icon">⚡</span>
          <div class="progress-track" style="width: 110px;">
            <div class="progress-fill-exp" id="vpixi-energy-bar" style="width: 100%; background: linear-gradient(90deg, #ffb700, #00ff88);"></div>
          </div>
          <span style="font-size:0.85rem; font-weight:700" id="vpixi-energy-text">50/50</span>
        </div>

        <div class="village-inventory-bar">
          <div class="inventory-item">🪵 <span id="vp-wood">0</span></div>
          <div class="inventory-item">🪨 <span id="vp-stone">0</span></div>
          <div class="inventory-item">🪙 <span id="vp-coins">100</span></div>
        </div>

        <button id="vpixi-btn-ad-energy" class="play-btn" style="padding:0.4rem 0.8rem; font-size:0.8rem;">⚡ 领 30 能量</button>
      </div>

      <div class="village-map-container">
        <div class="quest-panel-sidebar">
          <div class="quest-header">📜 日出村庄任务链 (HD Pixi)</div>
          <div id="vpixi-quest-list"></div>
        </div>
        <div id="pixi-village-container" style="width:100%; height:100%;"></div>
      </div>
    </div>
  `;

  const pixiContainer = container.querySelector('#pixi-village-container');
  const energyBarEl = container.querySelector('#vpixi-energy-bar');
  const energyTextEl = container.querySelector('#vpixi-energy-text');
  const woodEl = container.querySelector('#vp-wood');
  const stoneEl = container.querySelector('#vp-stone');
  const coinsEl = container.querySelector('#vp-coins');
  const questListEl = container.querySelector('#vpixi-quest-list');
  const adEnergyBtn = container.querySelector('#vpixi-btn-ad-energy');

  const app = createHDApplication(pixiContainer, WIDTH, HEIGHT);

  // Background River Graphics
  const bgGfx = new PIXI.Graphics();
  bgGfx.beginFill(0x1e3a1e);
  bgGfx.drawRect(0, 0, WIDTH, HEIGHT);
  bgGfx.endFill();
  bgGfx.beginFill(0x1e40af);
  bgGfx.drawRect(480, 0, 120, HEIGHT);
  bgGfx.endFill();
  app.stage.addChild(bgGfx);

  // Player Container
  const playerTxt = new PIXI.Text('👨‍🌾', { fontSize: 32, align: 'center' });
  playerTxt.anchor.set(0.5);
  playerTxt.x = player.x;
  playerTxt.y = player.y;
  app.stage.addChild(playerTxt);

  // Map Object Pixi Elements
  const objectContainers = new Map();

  function renderMapObjects() {
    mapObjects.forEach(obj => {
      let containerObj = objectContainers.get(obj.id);
      if (!containerObj) {
        containerObj = new PIXI.Container();
        const gfx = new PIXI.Graphics();
        
        let iconStr = '🌲';
        let fillColor = 0x15803d;

        if (obj.type === 'tree') { iconStr = '🌲'; fillColor = 0x15803d; }
        else if (obj.type === 'rock') { iconStr = '🪨'; fillColor = 0x64748b; }
        else if (obj.type === 'berry') { iconStr = '🍓'; fillColor = 0xd97706; }
        else if (obj.type === 'bridge') { iconStr = obj.isRepaired ? '🌉' : '⛓️'; fillColor = 0x854d0e; }
        else if (obj.type === 'cottage') { iconStr = obj.isRepaired ? '🏡' : '🏚️'; fillColor = 0x451a03; }

        gfx.beginFill(fillColor, 0.4);
        gfx.drawCircle(0, 0, obj.r);
        gfx.endFill();

        const txt = new PIXI.Text(iconStr, { fontSize: obj.r * 1.2, align: 'center' });
        txt.anchor.set(0.5);

        containerObj.addChild(gfx);
        containerObj.addChild(txt);
        containerObj.x = obj.x;
        containerObj.y = obj.y;

        containerObj.eventMode = 'static';
        containerObj.cursor = 'pointer';
        containerObj.on('pointerdown', () => {
          player.targetX = obj.x;
          player.targetY = obj.y + 15;
          player.isMoving = true;
          player.pendingObj = obj;
        });

        app.stage.addChild(containerObj);
        objectContainers.set(obj.id, containerObj);
      }
    });
  }

  renderMapObjects();

  function updateHUD() {
    const pct = (state.energy / state.maxEnergy) * 100;
    energyBarEl.style.width = `${pct}%`;
    energyTextEl.textContent = `${Math.round(state.energy)}/${state.maxEnergy}`;
    woodEl.textContent = state.wood;
    stoneEl.textContent = state.stone;
    coinsEl.textContent = state.coins;

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
    updateHUD();
  });

  let currentObj = null;

  app.ticker.add((delta) => {
    const dt = delta / 60;
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      player.x += (dx / dist) * player.speed * dt;
      player.y += (dy / dist) * player.speed * dt;
    } else {
      player.x = player.targetX;
      player.y = player.targetY;
      if (player.isMoving && player.pendingObj) {
        interact(player.pendingObj);
        player.pendingObj = null;
      }
      player.isMoving = false;
    }

    playerTxt.x = player.x;
    playerTxt.y = player.y;
  });

  function interact(obj) {
    if (['tree', 'rock', 'berry'].includes(obj.type)) {
      if (state.energy < obj.cost) {
        sound.playGameOver();
        return;
      }

      state.energy -= obj.cost;
      obj.hp--;
      sound.playMove();

      if (obj.type === 'tree') {
        state.wood += obj.reward.wood;
        state.quests[0].count++;
        if (state.quests[0].count >= state.quests[0].target && !state.quests[0].done) {
          state.quests[0].done = true;
          state.coins += 100;
          sound.playVictory();
        }
      } else if (obj.type === 'rock') {
        state.stone += obj.reward.stone;
      } else if (obj.type === 'berry') {
        state.energy = Math.min(state.maxEnergy, state.energy + obj.reward.energy);
      }

      if (obj.hp <= 0) {
        const c = objectContainers.get(obj.id);
        if (c) app.stage.removeChild(c);
        mapObjects = mapObjects.filter(o => o.id !== obj.id);
      }
      updateHUD();
    }
  }

  return () => {
    try {
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    } catch (e) {
      console.warn('Pixi destroy warning:', e);
    }
  };
}
