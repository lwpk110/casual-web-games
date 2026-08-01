import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';

export function init2048Game(container) {
  const GAME_ID = '2048';
  let grid = Array(4).fill(null).map(() => Array(4).fill(0));
  let historyGrid = null;
  let historyScore = 0;
  let score = 0;
  let highScore = storage.getHighScore(GAME_ID);
  let isGameOver = false;

  container.innerHTML = `
    <div class="game-canvas-wrapper">
      <div class="game-score-bar">
        <div class="score-box">
          <span class="score-label">当前得分</span>
          <span class="score-value" id="fusion-score">0</span>
        </div>
        <div class="score-box">
          <span class="score-label">最高纪录</span>
          <span class="score-value high-score" id="fusion-high-score">${highScore}</span>
        </div>
      </div>
      
      <div class="grid-2048-container" id="grid-2048"></div>

      <div class="game-controls-bar">
        <button id="fusion-btn-start" class="btn-game-action">🚀 新游戏</button>
        <button id="fusion-btn-undo" class="btn-game-action">↩️ 撤销上一步</button>
      </div>

      <div class="mobile-controls">
        <button class="dpad-btn dpad-up" id="d2048-up">▲</button>
        <button class="dpad-btn dpad-left" id="d2048-left">◄</button>
        <button class="dpad-btn dpad-right" id="d2048-right">►</button>
        <button class="dpad-btn dpad-down" id="d2048-down">▼</button>
      </div>
    </div>
  `;

  const gridEl = container.querySelector('#grid-2048');
  const scoreEl = container.querySelector('#fusion-score');
  const highScoreEl = container.querySelector('#fusion-high-score');
  const startBtn = container.querySelector('#fusion-btn-start');
  const undoBtn = container.querySelector('#fusion-btn-undo');

  function saveHistory() {
    historyGrid = grid.map(row => [...row]);
    historyScore = score;
  }

  function undo() {
    if (!historyGrid) return;
    grid = historyGrid.map(row => [...row]);
    score = historyScore;
    historyGrid = null;
    scoreEl.textContent = score;
    renderGrid();
  }

  function resetGame() {
    grid = Array(4).fill(null).map(() => Array(4).fill(0));
    score = 0;
    historyGrid = null;
    isGameOver = false;
    scoreEl.textContent = '0';
    addRandomTile();
    addRandomTile();
    renderGrid();
  }

  function addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grid[r][c];
        const tile = document.createElement('div');
        tile.className = 'tile-2048';
        tile.setAttribute('data-value', val);
        tile.textContent = val > 0 ? val : '';
        gridEl.appendChild(tile);
      }
    }
  }

  function move(direction) {
    if (isGameOver) return;
    saveHistory();

    let moved = false;
    let mergedScore = 0;

    // Helper functions for sliding rows
    const slide = (row) => {
      let arr = row.filter(val => val !== 0);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          mergedScore += arr[i];
          arr[i + 1] = 0;
          sound.playCombine();
        }
      }
      arr = arr.filter(val => val !== 0);
      while (arr.length < 4) arr.push(0);
      return arr;
    };

    const newGrid = Array(4).fill(null).map(() => Array(4).fill(0));

    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < 4; r++) {
        let row = grid[r];
        if (direction === 'right') row = [...row].reverse();
        let newRow = slide(row);
        if (direction === 'right') newRow.reverse();
        newGrid[r] = newRow;
        if (newRow.join(',') !== grid[r].join(',')) moved = true;
      }
    } else {
      for (let c = 0; c < 4; c++) {
        let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        if (direction === 'down') col.reverse();
        let newCol = slide(col);
        if (direction === 'down') newCol.reverse();
        for (let r = 0; r < 4; r++) newGrid[r][c] = newCol[r];
        if (newCol.join(',') !== [grid[0][c], grid[1][c], grid[2][c], grid[3][c]].join(',')) moved = true;
      }
    }

    if (moved) {
      grid = newGrid;
      score += mergedScore;
      scoreEl.textContent = score;
      sound.playMove();

      if (storage.setHighScore(GAME_ID, score)) {
        highScore = score;
        highScoreEl.textContent = highScore;
      }

      addRandomTile();
      renderGrid();

      if (checkGameOver()) {
        isGameOver = true;
        sound.playGameOver();
        setTimeout(() => alert(`游戏结束！您的最终得分是: ${score}`), 100);
      }
    }
  }

  function checkGameOver() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) return false;
        if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
        if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
      }
    }
    return true;
  }

  function handleKeydown(e) {
    if (['ArrowUp', 'KeyW'].includes(e.code)) { move('up'); }
    else if (['ArrowDown', 'KeyS'].includes(e.code)) { move('down'); }
    else if (['ArrowLeft', 'KeyA'].includes(e.code)) { move('left'); }
    else if (['ArrowRight', 'KeyD'].includes(e.code)) { move('right'); }
  }

  document.addEventListener('keydown', handleKeydown);

  // Mobile D-Pad controls
  container.querySelector('#d2048-up').addEventListener('click', () => move('up'));
  container.querySelector('#d2048-down').addEventListener('click', () => move('down'));
  container.querySelector('#d2048-left').addEventListener('click', () => move('left'));
  container.querySelector('#d2048-right').addEventListener('click', () => move('right'));

  startBtn.addEventListener('click', () => resetGame());
  undoBtn.addEventListener('click', () => undo());

  resetGame();

  return () => {
    document.removeEventListener('keydown', handleKeydown);
  };
}
