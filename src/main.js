import { ui } from './core/ui.js';
import { storage } from './core/storage.js';
import { initPhaserShooterGame } from './games/phaser-shooter/index.js';
import { initSurvivorGame } from './games/survivor/index.js';
import { initSnakeGame } from './games/snake/index.js';
import { init2048Game } from './games/2048/index.js';
import { initMemoryGame } from './games/memory/index.js';

const GAMES = [
  {
    id: 'phaser-shooter',
    title: '赛博星际战机 (Phaser 3)',
    category: 'action',
    badge: '⚡ Phaser3 引擎',
    bgClass: 'memory-bg',
    icon: '⚡',
    desc: '使用行业标杆 Phaser 3 游戏框架打造！拥有 WebGL 硬件加速、Arcade 物理碰撞与星空视差滚动。',
    initFn: initPhaserShooterGame
  },
  {
    id: 'survivor',
    title: '赛博割草者 (Cyber Swarm)',
    category: 'action',
    badge: '🔥 肉鸽热游',
    bgClass: 'fusion-bg',
    icon: '🚀',
    desc: '极简弹幕割草肉鸽！自动射击敌人蜂群，升级解锁 3 选 1 炫彩武器与局外天赋强化。',
    initFn: initSurvivorGame
  },
  {
    id: 'snake',
    title: '霓虹贪吃蛇 (Cyber Snake)',
    category: 'action',
    badge: '经典街机',
    bgClass: 'snake-bg',
    icon: '🐍',
    desc: '带有粒子尾迹特效与金币倍率加成的经典贪吃蛇！考研反应力与灵活操控。',
    initFn: initSnakeGame
  },
  {
    id: '2048',
    title: '2048 炫彩版 (Neon 2048)',
    category: 'puzzle',
    badge: '益智烧脑',
    bgClass: 'fusion-bg',
    icon: '🧩',
    desc: '组合相同数字，冲刺 2048 极限高分！提供撤销功能与炫酷音效。',
    initFn: init2048Game
  },
  {
    id: 'memory',
    title: '记忆连连看 (Memory Match)',
    category: 'casual',
    badge: '脑力锻炼',
    bgClass: 'memory-bg',
    icon: '🃏',
    desc: '翻开卡牌匹配炫彩图标，挑战最少步数通关！锻炼记忆力与专注度。',
    initFn: initMemoryGame
  }
];

function renderGameGrid(filterCategory = 'all') {
  const gridContainer = document.getElementById('games-grid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '';

  const filtered = filterCategory === 'all'
    ? GAMES
    : GAMES.filter(g => g.category === filterCategory);

  filtered.forEach(game => {
    const highScore = storage.getHighScore(game.id);
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="game-card-preview ${game.bgClass}">
        <span class="game-badge">${game.badge}</span>
        <div class="game-card-icon">${game.icon}</div>
      </div>
      <div class="game-card-body">
        <h3 class="game-title">${game.title}</h3>
        <p class="game-desc">${game.desc}</p>
        <div class="game-card-footer">
          <div class="high-score-tag">
            🏆 最高: <span>${highScore || '--'}</span>
          </div>
          <button class="play-btn">🎮 立即游玩</button>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      ui.openModal(game.title, (container) => {
        const cleanup = game.initFn(container);
        return cleanup;
      }, () => {
        // Refresh high scores on portal when modal closes
        renderGameGrid(filterCategory);
      });
    });

    gridContainer.appendChild(card);
  });
}

function initCategoryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.category || 'all';
      renderGameGrid(category);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ui.init();
  renderGameGrid();
  initCategoryFilters();
});
