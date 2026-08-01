export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const progressG = this.add.graphics();
    this.load.on('progress', (val) => {
      progressG.clear();
      progressG.fillStyle(0x00f0ff, 1);
      progressG.fillRect(150, 230, 300 * val, 20);
    });

    // Synthesize High-Detail Procedural Vector Textures using Phaser Graphics
    
    // 1. Parallax Star Textures (Small, Medium, Large)
    const starG = this.make.graphics({ add: false });
    starG.fillStyle(0xffffff, 0.9);
    starG.fillCircle(2, 2, 2);
    starG.generateTexture('star-far', 4, 4);

    const starG2 = this.make.graphics({ add: false });
    starG2.fillStyle(0x00f0ff, 1);
    starG2.fillCircle(3, 3, 3);
    starG2.generateTexture('star-near', 6, 6);

    // 2. High-Detail Player Ship (Cyber Fighter)
    const playerG = this.make.graphics({ add: false });
    playerG.fillStyle(0x00f0ff, 1);
    playerG.beginPath();
    playerG.moveTo(24, 0);   // Nose
    playerG.lineTo(36, 32);  // Right wing tip
    playerG.lineTo(28, 28);
    playerG.lineTo(24, 40);  // Tail center
    playerG.lineTo(20, 28);
    playerG.lineTo(12, 32);  // Left wing tip
    playerG.closePath();
    playerG.fillPath();
    playerG.lineStyle(2, 0x00ff88, 1);
    playerG.strokePath();
    // Cockpit
    playerG.fillStyle(0x00ff88, 1);
    playerG.fillCircle(24, 16, 4);
    playerG.generateTexture('playerShip', 48, 48);

    // 3. Heavy Armored Cruiser Enemy
    const cruiserG = this.make.graphics({ add: false });
    cruiserG.fillStyle(0x7000ff, 1);
    cruiserG.fillRect(4, 0, 32, 28);
    cruiserG.fillStyle(0xff007a, 1);
    cruiserG.fillRect(0, 8, 40, 12);
    cruiserG.lineStyle(2, 0x00f0ff, 1);
    cruiserG.strokeRect(4, 0, 32, 28);
    cruiserG.generateTexture('enemyCruiser', 40, 32);

    // 4. Drone Swarm Enemy
    const droneG = this.make.graphics({ add: false });
    droneG.fillStyle(0xff007a, 1);
    droneG.beginPath();
    droneG.moveTo(12, 0);
    droneG.lineTo(24, 20);
    droneG.lineTo(12, 16);
    droneG.lineTo(0, 20);
    droneG.closePath();
    droneG.fillPath();
    droneG.generateTexture('enemyDrone', 24, 24);

    // 5. Giant Boss Ship
    const bossG = this.make.graphics({ add: false });
    bossG.fillStyle(0x1e1b4b, 1);
    bossG.fillRect(10, 0, 80, 50);
    bossG.fillStyle(0xff007a, 1);
    bossG.fillRect(0, 15, 100, 25);
    bossG.fillStyle(0xffb700, 1);
    bossG.fillCircle(50, 25, 14); // Glowing Core
    bossG.lineStyle(3, 0x00f0ff, 1);
    bossG.strokeRect(10, 0, 80, 50);
    bossG.generateTexture('bossShip', 100, 55);

    // 6. Bullets & Lasers
    const laserG = this.make.graphics({ add: false });
    laserG.fillStyle(0x00f0ff, 1);
    laserG.fillRect(0, 0, 4, 16);
    laserG.generateTexture('laserBullet', 4, 16);

    const enemyBulletG = this.make.graphics({ add: false });
    enemyBulletG.fillStyle(0xff007a, 1);
    enemyBulletG.fillCircle(4, 4, 4);
    enemyBulletG.generateTexture('enemyBullet', 8, 8);

    const plasmaG = this.make.graphics({ add: false });
    plasmaG.fillStyle(0xffb700, 1);
    plasmaG.fillCircle(6, 6, 6);
    plasmaG.generateTexture('plasmaBeam', 12, 12);

    // 7. Powerups (Shield, Nuke, Heal)
    const shieldG = this.make.graphics({ add: false });
    shieldG.fillStyle(0x00f0ff, 1);
    shieldG.fillCircle(12, 12, 12);
    shieldG.lineStyle(2, 0xffffff, 1);
    shieldG.strokeCircle(12, 12, 12);
    shieldG.generateTexture('powerupShield', 24, 24);

    const nukeG = this.make.graphics({ add: false });
    nukeG.fillStyle(0xff007a, 1);
    nukeG.fillCircle(12, 12, 12);
    nukeG.lineStyle(2, 0xffb700, 1);
    nukeG.strokeCircle(12, 12, 12);
    nukeG.generateTexture('powerupNuke', 24, 24);

    // 8. Thruster Flame Particle
    const flameG = this.make.graphics({ add: false });
    flameG.fillStyle(0xffb700, 1);
    flameG.fillCircle(3, 3, 3);
    flameG.generateTexture('flameParticle', 6, 6);
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}
