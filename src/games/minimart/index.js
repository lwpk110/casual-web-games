import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';

export function initMinimartGame(container) {
  const GAME_ID = 'minimart';
  const WIDTH = 600;
  const HEIGHT = 480;

  let player = {
    x: 300,
    y: 350,
    targetX: 300,
    targetY: 350,
    speed: 180,
    carrying: { tomato: 0, apple: 0 },
    maxCarry: 6
  };

  let state = {
    coins: storage.loadData().minimartCoins || 100,
    unlocked: {
      appleTree: false,
      appleShelf: false,
      assistant: false
    }
  };

  function saveCoins() {
    const data = storage.loadData();
    data.minimartCoins = state.coins;
    localStorage.setItem('casual_web_games_data', JSON.stringify(data));
  }

  // Interactive Zones & Objects
  let zones = {
    tomatoCrop: { x: 80, y: 380, r: 35, timer: 0, maxTimer: 2.2, icon: '🍅' },
    appleTree: { x: 80, y: 120, r: 35, timer: 0, maxTimer: 2.8, icon: '🍎' },
    tomatoShelf: { x: 240, y: 380, r: 35, stock: 4, maxStock: 10, item: 'tomato', icon: '🛒' },
    appleShelf: { x: 240, y: 120, r: 35, stock: 0, maxStock: 10, item: 'apple', icon: '🛒' },
    cashier: { x: 260, y: 250, r: 35, icon: '🏧' }
  };

  let unlockPads = [
    { id: 'p1', x: 80, y: 120, cost: 100, progress: 0, unlockKey: 'appleTree', label: '🍎 解锁苹果树 ($100)' },
    { id: 'p2', x: 240, y: 120, cost: 150, progress: 0, unlockKey: 'appleShelf', label: '🛒 解锁苹果货架 ($150)' },
    { id: 'p3', x: 160, y: 250, cost: 250, progress: 0, unlockKey: 'assistant', label: '👨‍🍳 雇佣收银助手 ($250)' }
  ];

  let customers = [];
  let coinPiles = [];
  let popups = [];
  let spawnTimer = 0;
  let harvestCooldown = 0;
  let restockCooldown = 0;
  let checkoutCooldown = 0;
  let gameInterval = null;
  let lastTime = performance.now();

  container.innerHTML = `
    <div class="minimart-wrapper">
      <div class="minimart-hud-top">
        <div class="score-box">
          <span class="score-label">超市现金</span>
          <span class="score-value high-score" id="mm-coins">$100</span>
        </div>

        <div class="minimart-backpack-box">
          <span class="score-label">背部容量:</span>
          <div class="inventory-item">🍅 <span id="mm-tomato-count">0</span></div>
          <div class="inventory-item">🍎 <span id="mm-apple-count">0</span></div>
          <span style="font-size:0.8rem; color:var(--text-muted)" id="mm-max-carry">/6</span>
        </div>

        <button id="mm-btn-ad-cash" class="play-btn" style="padding:0.4rem 0.8rem; font-size:0.8rem;">💰 看广告领 $500 创业金</button>
      </div>

      <div class="minimart-map-container">
        <canvas id="minimart-canvas" class="minimart-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#minimart-canvas');
  const ctx = canvas.getContext('2d');
  const coinsEl = container.querySelector('#mm-coins');
  const tomatoCountEl = container.querySelector('#mm-tomato-count');
  const appleCountEl = container.querySelector('#mm-apple-count');
  const adCashBtn = container.querySelector('#mm-btn-ad-cash');

  function updateHUD() {
    coinsEl.textContent = `$${state.coins}`;
    tomatoCountEl.textContent = player.carrying.tomato;
    appleCountEl.textContent = player.carrying.apple;
  }

  updateHUD();

  adCashBtn.addEventListener('click', () => {
    sound.playVictory();
    state.coins += 500;
    saveCoins();
    spawnPopup(WIDTH / 2, HEIGHT / 2, '💰 +$500 创业金到账！');
    updateHUD();
  });

  function spawnPopup(x, y, text) {
    popups.push({ x, y, text, life: 1.0 });
  }

  function handlePointerClick(e) {
    const rect = canvas.getBoundingClientRect();
    player.targetX = e.clientX - rect.left;
    player.targetY = e.clientY - rect.top;
  }

  canvas.addEventListener('click', handlePointerClick);

  function totalCarrying() {
    return player.carrying.tomato + player.carrying.apple;
  }

  function spawnCustomer() {
    if (customers.length >= 4) return;
    
    // Choose available shelf
    let targetShelfKey = 'tomatoShelf';
    if (state.unlocked.appleShelf && Math.random() < 0.5 && zones.appleShelf.stock > 0) {
      targetShelfKey = 'appleShelf';
    }

    const shelf = zones[targetShelfKey];
    customers.push({
      id: Date.now() + Math.random(),
      x: 560,
      y: 250,
      targetX: shelf.x + 35,
      targetY: shelf.y,
      state: 'WALKING_TO_SHELF',
      targetShelf: targetShelfKey,
      hasItem: null,
      speed: 110
    });
  }

  function updatePhysics(dt) {
    // 1. Player Movement
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5) {
      player.x += (dx / dist) * player.speed * dt;
      player.y += (dy / dist) * player.speed * dt;
    }

    harvestCooldown += dt;
    restockCooldown += dt;
    checkoutCooldown += dt;

    // 2. Harvesting Crops (Tomato / Apple)
    if (harvestCooldown > 0.35) {
      // Tomato Crop
      if (Math.hypot(player.x - zones.tomatoCrop.x, player.y - zones.tomatoCrop.y) < 45) {
        if (totalCarrying() < player.maxCarry) {
          player.carrying.tomato++;
          sound.playMove();
          spawnPopup(zones.tomatoCrop.x, zones.tomatoCrop.y - 20, '🍅 +1');
          harvestCooldown = 0;
          updateHUD();
        }
      }
      // Apple Tree (If Unlocked)
      if (state.unlocked.appleTree && Math.hypot(player.x - zones.appleTree.x, player.y - zones.appleTree.y) < 45) {
        if (totalCarrying() < player.maxCarry) {
          player.carrying.apple++;
          sound.playMove();
          spawnPopup(zones.appleTree.x, zones.appleTree.y - 20, '🍎 +1');
          harvestCooldown = 0;
          updateHUD();
        }
      }
    }

    // 3. Unloading to Shelves
    if (restockCooldown > 0.3) {
      // Tomato Shelf
      if (Math.hypot(player.x - zones.tomatoShelf.x, player.y - zones.tomatoShelf.y) < 45) {
        if (player.carrying.tomato > 0 && zones.tomatoShelf.stock < zones.tomatoShelf.maxStock) {
          player.carrying.tomato--;
          zones.tomatoShelf.stock++;
          sound.playCombine();
          spawnPopup(zones.tomatoShelf.x, zones.tomatoShelf.y - 20, '🛒 补货 🍅');
          restockCooldown = 0;
          updateHUD();
        }
      }
      // Apple Shelf
      if (state.unlocked.appleShelf && Math.hypot(player.x - zones.appleShelf.x, player.y - zones.appleShelf.y) < 45) {
        if (player.carrying.apple > 0 && zones.appleShelf.stock < zones.appleShelf.maxStock) {
          player.carrying.apple--;
          zones.appleShelf.stock++;
          sound.playCombine();
          spawnPopup(zones.appleShelf.x, zones.appleShelf.y - 20, '🛒 补货 🍎');
          restockCooldown = 0;
          updateHUD();
        }
      }
    }

    // 4. Cashier Checkout Processing
    const isPlayerAtCashier = Math.hypot(player.x - zones.cashier.x, player.y - zones.cashier.y) < 45;
    const isAssistantActive = state.unlocked.assistant;

    if ((isPlayerAtCashier || isAssistantActive) && checkoutCooldown > 0.6) {
      const waitingCust = customers.find(c => c.state === 'WAITING_CASHIER');
      if (waitingCust) {
        const itemVal = waitingCust.hasItem === 'apple' ? 25 : 15;
        sound.playVictory(); // Ka-Ching sound!
        
        // Spawn coin pile on floor
        coinPiles.push({ x: zones.cashier.x + 25, y: zones.cashier.y + 15, val: itemVal });
        waitingCust.state = 'LEAVING';
        waitingCust.targetX = 560;
        waitingCust.targetY = 250;
        checkoutCooldown = 0;
      }
    }

    // 5. Collect Coin Piles on Floor
    coinPiles.forEach((cp, idx) => {
      if (Math.hypot(player.x - cp.x, player.y - cp.y) < 40) {
        state.coins += cp.val;
        saveCoins();
        sound.playScore();
        spawnPopup(cp.x, cp.y - 15, `+$${cp.val} 🪙`);
        coinPiles.splice(idx, 1);
        updateHUD();
      }
    });

    // 6. Unlock Pads Investment
    unlockPads.forEach(pad => {
      if (!state.unlocked[pad.unlockKey]) {
        if (Math.hypot(player.x - pad.x, player.y - pad.y) < 40 && state.coins > 0) {
          const invest = Math.min(state.coins, 10);
          state.coins -= invest;
          pad.progress += invest;
          saveCoins();
          sound.playMove();

          if (pad.progress >= pad.cost) {
            state.unlocked[pad.unlockKey] = true;
            sound.playVictory();
            spawnPopup(pad.x, pad.y - 30, `🎉 成功解锁！`);
          }
          updateHUD();
        }
      }
    });

    // 7. Customer AI State Machine
    spawnTimer += dt;
    if (spawnTimer > 3.5) {
      spawnCustomer();
      spawnTimer = 0;
    }

    customers.forEach((c, idx) => {
      const cdx = c.targetX - c.x;
      const cdy = c.targetY - c.y;
      const cdist = Math.hypot(cdx, cdy);

      if (cdist > 4) {
        c.x += (cdx / cdist) * c.speed * dt;
        c.y += (cdy / cdist) * c.speed * dt;
      } else {
        if (c.state === 'WALKING_TO_SHELF') {
          const shelf = zones[c.targetShelf];
          if (shelf && shelf.stock > 0) {
            shelf.stock--;
            c.hasItem = shelf.item;
            c.state = 'WALKING_TO_CASHIER';
            c.targetX = zones.cashier.x + 35;
            c.targetY = zones.cashier.y;
          }
        } else if (c.state === 'WALKING_TO_CASHIER') {
          c.state = 'WAITING_CASHIER';
        } else if (c.state === 'LEAVING') {
          customers.splice(idx, 1);
        }
      }
    });

    // 8. Popups Fade
    popups.forEach(p => { p.y -= dt * 25; p.life -= dt * 1.2; });
    popups = popups.filter(p => p.life > 0);
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Floor Tiling
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Supermarket Zone Borders
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);

    // Render Unlock Pads (If locked)
    unlockPads.forEach(pad => {
      if (!state.unlocked[pad.unlockKey]) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 183, 0, 0.15)';
        ctx.strokeStyle = '#ffb700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pad.x, pad.y, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffb700';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pad.label, pad.x, pad.y - 45);
        ctx.fillText(`$${pad.progress}/$${pad.cost}`, pad.x, pad.y + 5);
        ctx.restore();
      }
    });

    // Render Crop Fields & Shelves
    // Tomato Crop
    ctx.font = '36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌿🍅', zones.tomatoCrop.x, zones.tomatoCrop.y);

    // Apple Tree (If Unlocked)
    if (state.unlocked.appleTree) {
      ctx.fillText('🌳🍎', zones.appleTree.x, zones.appleTree.y);
    }

    // Tomato Shelf
    ctx.fillText('🛒', zones.tomatoShelf.x, zones.tomatoShelf.y);
    ctx.fillStyle = '#ff007a'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`🍅 ${zones.tomatoShelf.stock}/10`, zones.tomatoShelf.x, zones.tomatoShelf.y - 25);

    // Apple Shelf (If Unlocked)
    if (state.unlocked.appleShelf) {
      ctx.fillText('🛒', zones.appleShelf.x, zones.appleShelf.y);
      ctx.fillStyle = '#ffb700'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`🍎 ${zones.appleShelf.stock}/10`, zones.appleShelf.x, zones.appleShelf.y - 25);
    }

    // Cashier Counter
    ctx.font = '36px sans-serif';
    ctx.fillText('🏧', zones.cashier.x, zones.cashier.y);

    // Assistant (If Unlocked)
    if (state.unlocked.assistant) {
      ctx.font = '28px sans-serif';
      ctx.fillText('👨‍🍳', zones.cashier.x - 25, zones.cashier.y);
    }

    // Render Coin Piles on Floor
    coinPiles.forEach(cp => {
      ctx.font = '20px sans-serif';
      ctx.fillText('🪙', cp.x, cp.y);
    });

    // Render Customers
    customers.forEach(c => {
      ctx.font = '28px sans-serif';
      ctx.fillText('🧍', c.x, c.y);
      if (c.hasItem) {
        ctx.font = '16px sans-serif';
        ctx.fillText(c.hasItem === 'apple' ? '🍎' : '🍅', c.x + 10, c.y - 15);
      }
    });

    // Render Player Store Manager
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f0ff';
    ctx.font = '32px sans-serif';
    ctx.fillText('👨‍💼', player.x, player.y);

    // Draw Stacked Backpack Items
    if (player.carrying.tomato > 0 || player.carrying.apple > 0) {
      let stackStr = '';
      for (let i = 0; i < player.carrying.tomato; i++) stackStr += '🍅';
      for (let i = 0; i < player.carrying.apple; i++) stackStr += '🍎';
      ctx.font = '14px sans-serif';
      ctx.fillText(stackStr, player.x, player.y - 28);
    }
    ctx.restore();

    // Render Floating Popups
    popups.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillStyle = '#ffb700';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffb700';
      ctx.fillText(p.text, p.x, p.y);
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

  gameInterval = requestAnimationFrame(gameLoop);

  return () => {
    gameInterval = null;
    canvas.removeEventListener('click', handlePointerClick);
  };
}
