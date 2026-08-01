import { sound } from '../../../core/audio.js';
import { storage } from '../../../core/storage.js';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  init(data) {
    this.gameContainer = data.container;
    this.score = 0;
    this.highScore = storage.getHighScore('phaser-shooter');
    this.goldEarned = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.isGameOver = false;
    this.lastFired = 0;
    this.spawnTimer = 0;
  }

  preload() {
    // Generate Procedural Textures using Phaser Graphics (Zero external file dependencies!)
    
    // 1. Star Texture
    const starG = this.make.graphics({ x: 0, y: 0, add: false });
    starG.fillStyle(0xffffff, 0.8);
    starG.fillCircle(2, 2, 2);
    starG.generateTexture('star', 4, 4);

    // 2. Player Ship Texture (Neon Cyan Triangle)
    const playerG = this.make.graphics({ x: 0, y: 0, add: false });
    playerG.fillStyle(0x00f0ff, 1);
    playerG.beginPath();
    playerG.moveTo(16, 0);
    playerG.lineTo(32, 32);
    playerG.lineTo(16, 24);
    playerG.lineTo(0, 32);
    playerG.closePath();
    playerG.fillPath();
    playerG.lineStyle(2, 0x00ff88, 1);
    playerG.strokePath();
    playerG.generateTexture('playerShip', 32, 32);

    // 3. Enemy Ship Texture (Red Cyber Drone)
    const enemyG = this.make.graphics({ x: 0, y: 0, add: false });
    enemyG.fillStyle(0xff007a, 1);
    enemyG.beginPath();
    enemyG.moveTo(0, 0);
    enemyG.lineTo(24, 0);
    enemyG.lineTo(12, 24);
    enemyG.closePath();
    enemyG.fillPath();
    enemyG.generateTexture('enemyShip', 24, 24);

    // 4. Laser Texture
    const laserG = this.make.graphics({ x: 0, y: 0, add: false });
    laserG.fillStyle(0x00ff88, 1);
    laserG.fillRect(0, 0, 4, 12);
    laserG.generateTexture('laser', 4, 12);

    // 5. Particle Texture
    const particleG = this.make.graphics({ x: 0, y: 0, add: false });
    particleG.fillStyle(0xffb700, 1);
    particleG.fillCircle(3, 3, 3);
    particleG.generateTexture('particle', 6, 6);
  }

  create() {
    // Parallax Starfield TileSprite
    this.starfield = this.add.tileSprite(0, 0, 600, 480, 'star').setOrigin(0, 0);

    // Player Physics Sprite
    this.player = this.physics.add.sprite(300, 400, 'playerShip');
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(800, 800);

    // Groups
    this.bullets = this.physics.add.group({ defaultKey: 'laser', maxSize: 30 });
    this.enemies = this.physics.add.group();

    // Phaser Particle Emitter for Explosions
    this.emitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 180 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      active: true,
      emitting: false,
      lifespan: 400
    });

    // Physics Overlaps
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

    // Keyboard Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    // Touch / Pointer Input
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && !this.isGameOver) {
        this.physics.moveToObject(this.player, pointer, 300);
      }
    });

    // Score HUD Text
    this.scoreText = this.add.text(16, 16, '分数: 0', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#00f0ff'
    });

    this.hpText = this.add.text(16, 40, '装甲: 100%', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#00ff88'
    });

    this.highScoreText = this.add.text(450, 16, `最高: ${this.highScore}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#ffb700'
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;

    // Scroll Starfield Parallax
    this.starfield.tilePositionY -= 2;

    // Handle Player Controls
    const speed = 250;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.setVelocityY(speed);
    }

    // Auto-fire Lasers
    if (time > this.lastFired) {
      this.fireLaser();
      this.lastFired = time + 180;
    }

    // Spawn Enemies
    this.spawnTimer += delta;
    if (this.spawnTimer > 800) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Move Enemies Downwards
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.y > 500) {
        enemy.destroy();
      }
    });
  }

  fireLaser() {
    const laser = this.bullets.get(this.player.x, this.player.y - 16);
    if (laser) {
      laser.setActive(true);
      laser.setVisible(true);
      laser.body.velocity.y = -500;
      sound.playMove();
    }
  }

  spawnEnemy() {
    const x = Phaser.Math.Between(30, 570);
    const enemy = this.enemies.create(x, -20, 'enemyShip');
    enemy.setVelocityY(Phaser.Math.Between(100, 220));
  }

  hitEnemy(bullet, enemy) {
    bullet.destroy();
    
    // Trigger Particle Explosion
    this.emitter.explode(12, enemy.x, enemy.y);
    sound.playScore();

    enemy.destroy();

    this.score += 20;
    this.goldEarned += 2;
    this.scoreText.setText(`分数: ${this.score}`);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      storage.setHighScore('phaser-shooter', this.highScore);
      this.highScoreText.setText(`最高: ${this.highScore}`);
    }
  }

  hitPlayer(player, enemy) {
    enemy.destroy();
    this.cameras.main.shake(150, 0.015);
    sound.playGameOver();

    this.hp -= 25;
    this.hpText.setText(`装甲: ${Math.max(0, this.hp)}%`);

    if (this.hp <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.player.setTint(0xff0000);

    const gameOverText = this.add.text(300, 220, 'GAME OVER', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '36px',
      color: '#ff007a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const finalScoreText = this.add.text(300, 270, `最终得分: ${this.score}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
}
