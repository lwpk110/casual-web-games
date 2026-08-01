import { storage } from '../../../core/storage.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    // Parallax Starfield
    this.starFar = this.add.tileSprite(0, 0, 600, 480, 'star-far').setOrigin(0, 0);
    this.starNear = this.add.tileSprite(0, 0, 600, 480, 'star-near').setOrigin(0, 0);

    const highScore = storage.getHighScore('phaser-deluxe');

    // Title Banner
    const title = this.add.text(300, 140, 'CYBER STRIKE DELUXE', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '32px',
      color: '#00f0ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(300, 185, '⚡ PHASER 3 WEBGL ENGINE ⚡', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // High Score Text
    this.add.text(300, 240, `🏆 最高纪录: ${highScore} PTS`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#ffb700'
    }).setOrigin(0.5);

    // Start Prompt with Pulsing Tween
    const startTxt = this.add.text(300, 320, '👉 点击屏幕 或 按空格键 开始游戏 👈', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startTxt,
      alpha: 0.2,
      duration: 750,
      yoyo: true,
      repeat: -1
    });

    // Control Hints
    this.add.text(300, 420, '🎮 操作: WASD / 方向键 / 鼠标拖拽移动 | 自动射击弹幕', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#8e9bb0'
    }).setOrigin(0.5);

    // Input Listeners
    this.input.on('pointerdown', () => this.startGame());
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
  }

  update() {
    this.starFar.tilePositionY -= 0.5;
    this.starNear.tilePositionY -= 1.5;
  }

  startGame() {
    this.scene.start('GameScene');
  }
}
