// Juice Effects for Cyber Swarm: Screen Shake, Floating Damage, Particles
export class CameraJuice {
  constructor() {
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  shake(magnitude = 8, duration = 180) {
    this.shakeMagnitude = magnitude;
    this.shakeDuration = duration;
  }

  update(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt * 1000;
      this.offsetX = (Math.random() * 2 - 1) * this.shakeMagnitude;
      this.offsetY = (Math.random() * 2 - 1) * this.shakeMagnitude;
      if (this.shakeDuration <= 0) {
        this.offsetX = 0;
        this.offsetY = 0;
      }
    }
  }

  applyTransform(ctx) {
    ctx.translate(this.offsetX, this.offsetY);
  }
}

export class FloatingText {
  constructor(x, y, text, color = '#ff007a') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0;
    this.velocityY = -35;
  }

  update(dt) {
    this.y += this.velocityY * dt;
    this.life -= dt * 1.8;
  }

  render(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class Particle {
  constructor(x, y, color = '#00f0ff') {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 120 + 30;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = Math.random() * 3 + 1.5;
    this.life = 1.0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt * 2.5;
  }

  render(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
