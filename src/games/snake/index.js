import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';

export function initSnakeGame(container) {
  const GAME_ID = 'snake';
  const GRID_SIZE = 20;
  const TILE_COUNT = 20;
  const CANVAS_SIZE = 400;

  let snake = [];
  let food = { x: 5, y: 5, type: 'normal' };
  let dx = 1;
  let dy = 0;
  let score = 0;
  let highScore = storage.getHighScore(GAME_ID);
  let gameInterval = null;
  let isPaused = false;
  let isGameOver = false;

  container.innerHTML = `
    <div class="game-canvas-wrapper">
      <div class="game-score-bar">
        <div class="score-box">
          <span class="score-label">当前得分</span>
          <span class="score-value" id="snake-score">0</span>
        </div>
        <div class="score-box">
          <span class="score-label">最高纪录</span>
          <span class="score-value high-score" id="snake-high-score">${highScore}</span>
        </div>
      </div>
      <canvas id="snake-canvas" class="game-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
      
      <div class="game-controls-bar">
        <button id="snake-btn-start" class="btn-game-action">🚀 新游戏</button>
        <button id="snake-btn-pause" class="btn-game-action">⏸️ 暂停</button>
      </div>

      <div class="mobile-controls">
        <button class="dpad-btn dpad-up" id="dpad-up">▲</button>
        <button class="dpad-btn dpad-left" id="dpad-left">◄</button>
        <button class="dpad-btn dpad-right" id="dpad-right">►</button>
        <button class="dpad-btn dpad-down" id="dpad-down">▼</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#snake-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = container.querySelector('#snake-score');
  const highScoreEl = container.querySelector('#snake-high-score');
  const startBtn = container.querySelector('#snake-btn-start');
  const pauseBtn = container.querySelector('#snake-btn-pause');

  function resetGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    isPaused = false;
    isGameOver = false;
    scoreEl.textContent = '0';
    spawnFood();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 100);
  }

  function spawnFood() {
    food = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT),
      type: Math.random() < 0.2 ? 'gold' : 'normal'
    };
  }

  function handleKeydown(e) {
    if (isGameOver) return;
    if (['ArrowUp', 'KeyW'].includes(e.code) && dy === 0) { dx = 0; dy = -1; sound.playMove(); }
    else if (['ArrowDown', 'KeyS'].includes(e.code) && dy === 0) { dx = 0; dy = 1; sound.playMove(); }
    else if (['ArrowLeft', 'KeyA'].includes(e.code) && dx === 0) { dx = -1; dy = 0; sound.playMove(); }
    else if (['ArrowRight', 'KeyD'].includes(e.code) && dx === 0) { dx = 1; dy = 0; sound.playMove(); }
  }

  document.addEventListener('keydown', handleKeydown);

  // Mobile D-Pad controls
  container.querySelector('#dpad-up').addEventListener('click', () => { if (dy === 0) { dx = 0; dy = -1; sound.playMove(); } });
  container.querySelector('#dpad-down').addEventListener('click', () => { if (dy === 0) { dx = 0; dy = 1; sound.playMove(); } });
  container.querySelector('#dpad-left').addEventListener('click', () => { if (dx === 0) { dx = -1; dy = 0; sound.playMove(); } });
  container.querySelector('#dpad-right').addEventListener('click', () => { if (dx === 0) { dx = 1; dy = 0; sound.playMove(); } });

  startBtn.addEventListener('click', () => resetGame());
  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶️ 继续' : '⏸️ 暂停';
  });

  function gameLoop() {
    if (isPaused || isGameOver) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision check
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
      triggerGameOver();
      return;
    }

    // Self collision check
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        triggerGameOver();
        return;
      }
    }

    snake.unshift(head);

    // Eat food check
    if (head.x === food.x && head.y === food.y) {
      const points = food.type === 'gold' ? 30 : 10;
      score += points;
      scoreEl.textContent = score;
      sound.playScore();

      if (storage.setHighScore(GAME_ID, score)) {
        highScore = score;
        highScoreEl.textContent = highScore;
      }

      spawnFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function triggerGameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
    sound.playGameOver();

    ctx.fillStyle = 'rgba(10, 12, 22, 0.8)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#ff007a';
    ctx.font = 'bold 32px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束 GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);

    ctx.fillStyle = '#f0f3fe';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(`最终得分: ${score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 30);
  }

  function draw() {
    // Clear Canvas
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Grid Lines (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < TILE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
      ctx.stroke();
    }

    // Draw Food with Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = food.type === 'gold' ? '#ffb700' : '#00f0ff';
    ctx.fillStyle = food.type === 'gold' ? '#ffb700' : '#00f0ff';
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * GRID_SIZE, (food.y + 0.5) * GRID_SIZE, GRID_SIZE / 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake
    snake.forEach((segment, idx) => {
      ctx.shadowBlur = idx === 0 ? 15 : 5;
      ctx.shadowColor = '#00ff88';
      ctx.fillStyle = idx === 0 ? '#00ff88' : `rgba(0, 255, 136, ${1 - idx / snake.length * 0.7})`;
      
      ctx.beginPath();
      ctx.roundRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
        idx === 0 ? 6 : 4
      );
      ctx.fill();
    });

    ctx.shadowBlur = 0; // Reset shadow
  }

  resetGame();

  // Return cleanup function to unbind keyboard listeners when modal closes
  return () => {
    clearInterval(gameInterval);
    document.removeEventListener('keydown', handleKeydown);
  };
}
