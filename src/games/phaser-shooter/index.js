import { MainScene } from './scenes/MainScene.js';

export function initPhaserShooterGame(container) {
  container.innerHTML = `
    <div class="game-canvas-wrapper">
      <div id="phaser-game-container" style="border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></div>
      
      <div class="game-controls-bar">
        <button id="phaser-btn-restart" class="btn-game-action">🚀 重新开始</button>
      </div>

      <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 0.5rem;">
        🎮 操作说明：WASD / 方向键移动，支持鼠标/触摸拖拽控制战机。弹幕自动发射！
      </div>
    </div>
  `;

  const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 480,
    parent: 'phaser-game-container',
    backgroundColor: '#06080f',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [MainScene]
  };

  const game = new Phaser.Game(config);

  // Pass container info to main scene
  game.scene.start('MainScene', { container });

  const restartBtn = container.querySelector('#phaser-btn-restart');
  restartBtn.addEventListener('click', () => {
    game.scene.start('MainScene', { container });
  });

  return () => {
    try {
      game.destroy(true);
    } catch (e) {
      console.warn('Phaser destroy warning:', e);
    }
  };
}
