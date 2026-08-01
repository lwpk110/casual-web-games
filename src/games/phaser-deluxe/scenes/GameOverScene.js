export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.score = data.score || 0;
    this.gold = data.gold || 0;
    this.kills = data.kills || 0;
  }

  create() {
    this.starFar = this.add.tileSprite(0, 0, 600, 480, 'star-far').setOrigin(0, 0);

    this.add.text(300, 120, '💀 战机摧毁 GAME OVER', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '32px',
      color: '#ff007a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(300, 180, `最终得分: ${this.score}  |  击杀数: ${this.kills}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(300, 220, `获得金币: ${this.gold} GOLD`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '20px',
      color: '#ffb700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const restartBtn = this.add.text(300, 310, '🚀 重新开始战斗', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      color: '#00f0ff',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setStyle({ color: '#00ff88' }));
    restartBtn.on('pointerout', () => restartBtn.setStyle({ color: '#00f0ff' }));
    restartBtn.on('pointerdown', () => this.scene.start('GameScene'));

    const menuBtn = this.add.text(300, 370, '🏠 返回主菜单', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      color: '#8e9bb0',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }

  update() {
    this.starFar.tilePositionY -= 0.5;
  }
}
