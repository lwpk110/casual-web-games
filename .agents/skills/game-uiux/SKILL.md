---
name: game-uiux
description: Principles and code practices for game interface design, Game Juice (screen shake, hit stop, particle bursts, squish and stretch), dynamic feedback loops, HUD ergonomics, and immersive audio-visual micro-interactions.
---

# Game UI/UX & Game Juice Design Skill

本技能为游戏界面 UI/UX 设计与游戏“汁水感”(Game Juice) 视听反馈指南。优秀的游戏视觉与打击感反馈能够大幅提升玩家的沉浸感与留存率。

---

## 1. 游戏 Juice 视听反馈核心要素

“Game Juice” 指通过细节丰富的视觉、听觉与震动反馈，让简单的玩家操作获得极致的爽快感与正向心理刺激。

### 1.1 屏幕震动 (Screen Shake)

任何重击、爆炸或得分时刻都应加入轻微的震屏特效：

```javascript
class CameraJuice {
  constructor(canvas) {
    this.canvas = canvas;
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  shake(magnitude = 10, duration = 200) {
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
```

### 1.2 顿帧 / 击中停顿 (Hit Stop / Frame Freeze)

在重要击中或消去瞬间暂停画面 30~80 毫秒，创造强烈的力量冲击感：

```javascript
function triggerHitStop(milliseconds = 50) {
  const start = performance.now();
  while (performance.now() - start < milliseconds) {
    // 阻塞短帧以创造物理顿感
  }
}
```

### 1.3 挤压与拉伸 (Squish & Stretch)

角色跳跃、落地或球体碰撞时，动态改变缩放比例（例如跳跃时 `scaleX=0.8, scaleY=1.2`，落地时 `scaleX=1.3, scaleY=0.7`），然后以 Elastic 缓动恢复。

### 1.4 浮动文字与得分飘字 (Floating Damage / Combo Text)

任何得分或连击时弹出渐隐上升的数字：

```javascript
class FloatingText {
  constructor(x, y, text, color = '#ff007a') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0; // Alpha opacity
    this.velocityY = -40; // 上升速度
  }

  update(dt) {
    this.y += this.velocityY * dt;
    this.life -= dt * 1.5; // 渐隐
  }

  render(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
```

---

## 2. HUD 与 UI 配色设计规范

1. **暗黑霓虹调色盘 (Dark Neon Palette)**:
   - 背景色: `#0a0c16` ~ `#121526`
   - 主高光: 荧光青 `#00f0ff`、霓虹紫 `#7000ff`、粉红 `#ff007a`
   - 奖励/金币: 闪耀金 `#ffb700`、翡翠绿 `#00ff88`
2. **玻璃拟态 UI 容器 (Glassmorphism)**:
   - 运用 `backdrop-filter: blur(16px)` + 1px 半透明边框 `rgba(255, 255, 255, 0.08)`。
3. **按钮悬停与按压微动画**:
   - 悬停: `transform: translateY(-2px)` + `box-shadow` 发光扩散。
   - 按压: `transform: scale(0.95)`。

---

## 3. Web Audio 动态声效设计 (Audio Juice)

为所有交互动作匹配声效：
- **按压/菜单移动**: 低音短音阶 (200~300Hz Sine)
- **金币/得分**: 双音阶递增上升 (587Hz -> 880Hz Triangle)
- **连击/Combo**: 升调和弦 (C Major Arpeggio)
- **失败/Game Over**: 锯齿波降调 (Sawtooth Downward Sweep)
