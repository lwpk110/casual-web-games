---
name: game-studio
description: Comprehensive game engineering standards, engine selection, game loops, state machine architectures, object pooling, 60 FPS performance optimization, and asset management for professional casual and web games.
---

# Game Studio Engineering & Architecture Skill

本技能为专业游戏开发工程规范与架构指南，旨在指导构建高帧率、高性能、可复用且具备商业化扩充能力的现代网页游戏。

---

## 1. 核心游戏架构与游戏循环 (Game Loop)

### 1.1 定频 / 变频游戏循环 (Delta Time Loop)

任何商业游戏的核心在于严谨的 `requestAnimationFrame` 循环，结合 `deltaTime`（增量时间）防止不同设备刷新率导致的动作加速或卡顿：

```javascript
class GameLoop {
  constructor(updateFn, renderFn) {
    this.update = updateFn;
    this.render = renderFn;
    this.lastTime = 0;
    this.accumulatedTime = 0;
    this.targetFPS = 60;
    this.timeStep = 1000 / this.targetFPS;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulatedTime += dt;

    // 防止标签页后台切换造成的“死锁追赶”
    if (this.accumulatedTime > 1000) this.accumulatedTime = this.timeStep;

    while (this.accumulatedTime >= this.timeStep) {
      this.update(this.timeStep / 1000); // 传入秒数
      this.accumulatedTime -= this.timeStep;
    }

    const interpolation = this.accumulatedTime / this.timeStep;
    this.render(interpolation);

    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.isRunning = false;
  }
}
```

---

## 2. 状态机模式 (State Machine Pattern)

用于管理游戏全局状态（Main Menu, Playing, Paused, GameOver, Victory, Shop）：

```javascript
class StateMachine {
  constructor() {
    this.states = new Map();
    this.currentState = null;
  }

  addState(name, stateObject) {
    this.states.set(name, stateObject);
  }

  switchState(name, ...args) {
    if (this.currentState && this.currentState.exit) {
      this.currentState.exit();
    }
    this.currentState = this.states.get(name);
    if (this.currentState && this.currentState.enter) {
      this.currentState.enter(...args);
    }
  }

  update(dt) {
    if (this.currentState && this.currentState.update) {
      this.currentState.update(dt);
    }
  }

  render(interpolation) {
    if (this.currentState && this.currentState.render) {
      this.currentState.render(interpolation);
    }
  }
}
```

---

## 3. 对象池 (Object Pooling - 消除 GC 卡顿)

子弹、粒子、敌人在频繁创建和销毁时会导致浏览器垃圾回收 (Garbage Collection) 掉帧。必须使用对象池复用内存对象：

```javascript
class ObjectPool {
  constructor(createFn, initialSize = 50) {
    this.createFn = createFn;
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  get() {
    let obj = this.pool.find(item => !item.active);
    if (!obj) {
      obj = this.createFn();
      this.pool.push(obj);
    }
    obj.active = true;
    if (obj.reset) obj.reset();
    return obj;
  }

  release(obj) {
    obj.active = false;
  }
}
```

---

## 4. 多输入适配层 (Input Manager)

统一支持 PC 键盘、鼠标、触摸手势与 Gamepad 手柄输入：

- **Keyboard**: 监听 `keydown` / `keyup` mapping 到语义动作 (MoveUp, Fire, Pause)。
- **Touch**: 支持 Swipe 拖拽手势、Virtual Joystick (虚拟摇杆) 与点击。
- **Gamepad**: 使用 `navigator.getGamepads()` 实时轮询手柄按键与摇杆轴。

---

## 5. 性能与发布检查清单

1. **60 FPS 性能指标**: Draw Calls 保持在 100 以内，粒子总数控制在对象池限制中。
2. **Web Audio 声效预加载**: 预合成音效缓存，避免首次触发音频延迟。
3. **断网与自动保存**: 使用 `localStorage` 自动存盘进度与金币资产。
