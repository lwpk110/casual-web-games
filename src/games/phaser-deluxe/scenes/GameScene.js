import { sound } from '../../../core/audio.js';
import { storage } from '../../../core/storage.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.score = 0;
    this.highScore = storage.getHighScore('phaser-deluxe');
    this.goldEarned = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.shield = 0;
    this.killCount = 0;
    this.weaponType = 'laser'; // 'laser', 'plasma', 'missile'
    this.lastFired = 0;
    this.enemySpawnTimer = 0;
    this.bossActive = false;
    this.boss = null;
    this.bossHp = 200;
    this.bossMaxHp = 200;
    this.isGameOver = false;
  }

  create() {
    // Parallax Starfields
    this.starFar = this.add.tileSprite(0, 0, 600, 480, 'star-far').setOrigin(0, 0);
    this.starNear = this.add.tileSprite(0, 0, 600, 480, 'star-near').setOrigin(0, 0);

    // Player Fighter Sprite
    this.player = this.physics.add.sprite(300, 400, 'playerShip');
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(1000, 1000);

    // Engine Thruster Particle Emitter
    this.thrusterParticles = this.add.particles(0, 0, 'flameParticle', {
      speed: { min: 40, max: 120 },
      angle: { min: 80, max: 100 },
      scale: { start: 1.2, end: 0 },
      blendMode: 'ADD',
      lifespan: 250,
      follow: this.player,
      followOffset: { x: 0, y: 22 }
    });

    // Physics Groups
    this.bullets = this.physics.add.group({ defaultKey: 'laserBullet', maxSize: 40 });
    this.enemyBullets = this.physics.add.group({ defaultKey: 'enemyBullet', maxSize: 30 });
    this.enemies = this.physics.add.group();
    this.powerups = this.physics.add.group();

    // Physics Overlaps & Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.hitPlayerByBullet, null, this);
    this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);

    // Inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && !this.isGameOver) {
        this.physics.moveToObject(this.player, pointer, 320);
      }
    });

    // HUD Text Elements
    this.scoreText = this.add.text(16, 16, '分数: 0', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#00f0ff',
      fontStyle: 'bold'
    });

    this.hpText = this.add.text(16, 40, '装甲: 100%', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#00ff88'
    });

    this.highScoreText = this.add.text(450, 16, `最高: ${this.highScore}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#ffb700'
    });

    this.bossWarningText = this.add.text(300, 180, '⚠️ BOSS INCOMING ⚠️', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '28px',
      color: '#ff007a',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // Boss HP Bar Container
    this.bossHpContainer = this.add.container(300, 50).setVisible(false);
    const bossBg = this.add.rectangle(0, 0, 300, 12, 0x1e1b4b);
    this.bossHpBar = this.add.rectangle(-150, 0, 300, 12, 0xff007a).setOrigin(0, 0.5);
    const bossTxt = this.add.text(0, -14, '👑 CYBER MOTHERSHIP BOSS', {
      fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#ff007a'
    }).setOrigin(0.5);
    this.bossHpContainer.add([bossBg, this.bossHpBar, bossTxt]);
  }

  update(time, delta) {
    if (this.isGameOver) return;

    // Scroll Starfield
    this.starFar.tilePositionY -= 0.8;
    this.starNear.tilePositionY -= 2.5;

    // Player Movement Controls
    const speed = 280;
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

    // Auto-fire Weapon
    if (time > this.lastFired) {
      this.fireWeapon();
      this.lastFired = time + 160;
    }

    // Enemy Spawning Logic
    this.enemySpawnTimer += delta;
    if (this.enemySpawnTimer > 750 && !this.bossActive) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }

    // Boss Trigger Check
    if (this.killCount >= 15 && !this.bossActive && !this.boss) {
      this.triggerBossEncounter();
    }

    // Boss Behavior
    if (this.bossActive && this.boss) {
      this.updateBossBehavior(time);
    }

    // Clean Out-of-Bound Objects
    this.bullets.getChildren().forEach(b => { if (b.y < -20) b.destroy(); });
    this.enemyBullets.getChildren().forEach(b => { if (b.y > 500) b.destroy(); });
    this.enemies.getChildren().forEach(e => { if (e.y > 520) e.destroy(); });
  }

  fireWeapon() {
    if (this.weaponType === 'laser') {
      const b1 = this.bullets.get(this.player.x - 10, this.player.y - 16, 'laserBullet');
      const b2 = this.bullets.get(this.player.x + 10, this.player.y - 16, 'laserBullet');
      if (b1) { b1.setActive(true).setVisible(true); b1.body.velocity.y = -550; }
      if (b2) { b2.setActive(true).setVisible(true); b2.body.velocity.y = -550; }
      sound.playMove();
    } else if (this.weaponType === 'plasma') {
      const b = this.bullets.get(this.player.x, this.player.y - 20, 'plasmaBeam');
      if (b) {
        b.setActive(true).setVisible(true);
        b.body.velocity.y = -600;
        sound.playScore();
      }
    }
  }

  spawnEnemy() {
    const x = Phaser.Math.Between(40, 560);
    const isCruiser = Math.random() < 0.3;
    const key = isCruiser ? 'enemyCruiser' : 'enemyDrone';

    const enemy = this.enemies.create(x, -30, key);
    enemy.hp = isCruiser ? 35 : 10;
    enemy.maxHp = enemy.hp;
    enemy.type = isCruiser ? 'cruiser' : 'drone';
    enemy.setVelocityY(isCruiser ? 70 : Phaser.Math.Between(120, 200));

    if (isCruiser) {
      // Cruiser shoots back timer
      this.time.addEvent({
        delay: 1500,
        callback: () => {
          if (enemy.active) {
            const eb = this.enemyBullets.get(enemy.x, enemy.y + 16, 'enemyBullet');
            if (eb) { eb.setActive(true).setVisible(true); eb.body.velocity.y = 220; }
          }
        },
        loop: true
      });
    }
  }

  triggerBossEncounter() {
    this.bossActive = true;
    this.bossWarningText.setVisible(true);
    this.cameras.main.flash(500, 255, 0, 122);
    sound.playGameOver();

    this.tweens.add({
      targets: this.bossWarningText,
      alpha: 0.2,
      duration: 250,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.bossWarningText.setVisible(false);
        this.spawnBoss();
      }
    });
  }

  spawnBoss() {
    this.boss = this.enemies.create(300, -60, 'bossShip');
    this.boss.hp = 200;
    this.boss.maxHp = 200;
    this.boss.type = 'boss';
    this.boss.setCollideWorldBounds(true);
    this.boss.setBounce(1);

    this.bossHpContainer.setVisible(true);

    // Move Boss Down into Arena
    this.tweens.add({
      targets: this.boss,
      y: 100,
      duration: 2000,
      onComplete: () => {
        this.boss.setVelocityX(140);
      }
    });
  }

  updateBossBehavior(time) {
    // Update Boss HP Bar
    const pct = Math.max(0, this.boss.hp / this.boss.maxHp);
    this.bossHpBar.width = 300 * pct;

    // Boss Fires Triple Spread Every 1.5s
    if (Math.random() < 0.03 && this.boss.y >= 90) {
      const angles = [-0.3, 0, 0.3];
      angles.forEach(ang => {
        const eb = this.enemyBullets.get(this.boss.x, this.boss.y + 25, 'enemyBullet');
        if (eb) {
          eb.setActive(true).setVisible(true);
          eb.body.velocity.x = Math.sin(ang) * 200;
          eb.body.velocity.y = Math.cos(ang) * 200;
        }
      });
    }
  }

  hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.hp -= 15;

    // Floating Damage Text
    const dmgTxt = this.add.text(enemy.x, enemy.y - 10, '-15', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#00f0ff',
      fontStyle: 'bold'
    });
    this.tweens.add({
      targets: dmgTxt, y: enemy.y - 30, alpha: 0, duration: 400, onComplete: () => dmgTxt.destroy()
    });

    if (enemy.hp <= 0) {
      this.explodeEnemy(enemy);
    }
  }

  explodeEnemy(enemy) {
    this.cameras.main.shake(120, 0.01);
    sound.playScore();

    // Particle Explosion
    const emitter = this.add.particles(enemy.x, enemy.y, 'flameParticle', {
      speed: { min: 40, max: 160 },
      scale: { start: 1.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 350,
      emitting: false
    });
    emitter.explode(15, enemy.x, enemy.y);

    if (enemy.type === 'boss') {
      this.bossActive = false;
      this.boss = null;
      this.bossHpContainer.setVisible(false);
      this.score += 500;
      this.goldEarned += 50;
      this.cameras.main.flash(600, 255, 255, 255);
      sound.playVictory();
    } else {
      this.score += enemy.type === 'cruiser' ? 40 : 15;
      this.goldEarned += 2;
      this.killCount++;

      // Drop Powerup Chance (15%)
      if (Math.random() < 0.15) {
        const key = Math.random() < 0.5 ? 'powerupShield' : 'powerupNuke';
        const p = this.powerups.create(enemy.x, enemy.y, key);
        p.pType = key;
        p.setVelocityY(80);
      }
    }

    enemy.destroy();
    this.scoreText.setText(`分数: ${this.score}`);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      storage.setHighScore('phaser-deluxe', this.highScore);
      this.highScoreText.setText(`最高: ${this.highScore}`);
    }
  }

  hitPlayer(player, enemy) {
    enemy.destroy();
    this.damagePlayer(25);
  }

  hitPlayerByBullet(player, bullet) {
    bullet.destroy();
    this.damagePlayer(15);
  }

  damagePlayer(amount) {
    this.cameras.main.shake(200, 0.02);
    sound.playGameOver();

    if (this.shield > 0) {
      this.shield = Math.max(0, this.shield - amount);
    } else {
      this.hp -= amount;
    }

    this.hpText.setText(`装甲: ${Math.max(0, this.hp)}% ${this.shield > 0 ? '(🛡️ 护盾生效)' : ''}`);

    if (this.hp <= 0) {
      this.triggerGameOver();
    }
  }

  collectPowerup(player, powerup) {
    const type = powerup.pType;
    powerup.destroy();
    sound.playVictory();

    if (type === 'powerupShield') {
      this.shield = 50;
      this.hpText.setText(`装甲: ${this.hp}% (🛡️ 护盾生效)`);
    } else if (type === 'powerupNuke') {
      // Nuke Bomb: Screen wipe!
      this.cameras.main.flash(500, 255, 255, 255);
      this.enemies.getChildren().forEach(e => this.explodeEnemy(e));
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.thrusterParticles.stop();

    this.scene.start('GameOverScene', {
      score: this.score,
      gold: this.goldEarned,
      kills: this.killCount
    });
  }
}
