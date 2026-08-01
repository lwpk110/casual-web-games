import { sound } from '../../core/audio.js';
import { storage } from '../../core/storage.js';

export function initMemoryGame(container) {
  const GAME_ID = 'memory';
  const EMOJIS = ['👾', '🚀', '⚡', '💎', '🎮', '🔮', '🤖', '🛸'];
  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let isLockBoard = false;
  let highScore = storage.getHighScore(GAME_ID);

  container.innerHTML = `
    <div class="game-canvas-wrapper">
      <div class="game-score-bar">
        <div class="score-box">
          <span class="score-label">翻牌步数</span>
          <span class="score-value" id="memory-moves">0</span>
        </div>
        <div class="score-box">
          <span class="score-label">最佳纪录 (最少步数)</span>
          <span class="score-value high-score" id="memory-high-score">${highScore === 0 ? '--' : highScore}</span>
        </div>
      </div>

      <div class="memory-grid" id="memory-grid"></div>

      <div class="game-controls-bar">
        <button id="memory-btn-start" class="btn-game-action">🚀 重新洗牌</button>
      </div>
    </div>
  `;

  const gridEl = container.querySelector('#memory-grid');
  const movesEl = container.querySelector('#memory-moves');
  const highScoreEl = container.querySelector('#memory-high-score');
  const startBtn = container.querySelector('#memory-btn-start');

  function resetGame() {
    const deck = [...EMOJIS, ...EMOJIS];
    // Shuffle array
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    cards = deck;
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLockBoard = false;
    movesEl.textContent = '0';

    renderGrid();
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    cards.forEach((symbol, index) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.index = index;
      card.dataset.symbol = symbol;
      card.textContent = '❓';
      card.addEventListener('click', () => handleCardClick(card));
      gridEl.appendChild(card);
    });
  }

  function handleCardClick(card) {
    if (isLockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    sound.playFlip();
    card.classList.add('flipped');
    card.textContent = card.dataset.symbol;
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      moves++;
      movesEl.textContent = moves;
      checkMatch();
    }
  }

  function checkMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.symbol === card2.dataset.symbol;

    if (isMatch) {
      sound.playCombine();
      card1.classList.add('matched');
      card2.classList.add('matched');
      matchedPairs++;
      flippedCards = [];

      if (matchedPairs === EMOJIS.length) {
        sound.playVictory();
        setTimeout(() => {
          alert(`🎉 恭喜通关！您一共用了 ${moves} 步。`);
          // Record lowest moves as high score
          const currentBest = storage.getHighScore(GAME_ID);
          if (currentBest === 0 || moves < currentBest) {
            storage.setHighScore(GAME_ID, moves);
            highScoreEl.textContent = moves;
          }
        }, 300);
      }
    } else {
      isLockBoard = true;
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.textContent = '❓';
        card2.textContent = '❓';
        flippedCards = [];
        isLockBoard = false;
      }, 900);
    }
  }

  startBtn.addEventListener('click', () => resetGame());

  resetGame();

  return () => {};
}
