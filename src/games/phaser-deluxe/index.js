import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

export function initPhaserDeluxeGame(container) {
  container.innerHTML = `
    <div class="game-canvas-wrapper">
      <div id="phaser-deluxe-container" style="border-radius: 14px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,240,255,0.2);"></div>
      <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 0.5rem;">
        ⚡ 深度采用 Phaser 3 WebGL 引擎！拥有 Arcade 物理引擎、尾焰粒子发射器、巨型 BOSS 战与相机震屏特效。
      </div>
    </div>
  `;

  const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 480,
    parent: 'phaser-deluxe-container',
    backgroundColor: '#06080f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [BootScene, MainMenuScene, GameScene, GameOverScene]
  };

  const game = new Phaser.Game(config);

  return () => {
    try {
      game.destroy(true);
    } catch (e) {
      console.warn('Phaser Deluxe destroy warning:', e);
    }
  };
}
