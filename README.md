# 🎮 Casual Web Games Studio (休闲网页游戏工作室)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub Pages](https://img.shields.io/badge/deployment-GitHub%20Pages-brightgreen.svg)
![HTML5](https://img.shields.io/badge/Stack-HTML5%20%7C%20Phaser%203%20%7C%20ES6+-orange.svg)

专门用于制作、展示与拓展**休闲网页游戏**的开源工作室仓库。引入标杆级 **Phaser 3 游戏引擎**，结合现代暗黑玻璃拟态 (Glassmorphism) 视觉设计，零加载即开即玩。

---

## 🌟 平台特色

- **Phaser 3 标杆引擎支持**: 完美整合行业流行 2D 游戏引擎 Phaser 3 (https://github.com/phaserjs/phaser)，原生 WebGL 硬件加速与 Arcade 物理机制。
- **零依赖极速加载**: 纯原生 HTML5, ES6 Modules 与 CSS3 打造。
- **暗黑霓虹视觉**: 具备视觉冲击力的现代 UI 与微动画。
- **Web Audio 纯代码音效**: 内置原生 Web Audio API 音效合成引擎，无需外挂音频资源文件。
- **完全响应式**: 适配 PC 端键盘/鼠标与移动端触摸控制 (内置虚拟 D-Pad 摇杆)。
- **数据持久化**: 自动保存本地最高得分纪录 (LocalStorage)。
- **GitHub Pages 自动化发布**: Push 到 `main` 分支自动构建并在线上线。

---

## 🎲 内置精选游戏

| 游戏名称 | 游戏类型 | 特色描述 |
| :--- | :--- | :--- |
| 🚀 **赛博割草者 (Cyber Swarm)** | 动作肉鸽 | 蜂群割草、自动射击、3 选 1 随机升级、震屏顿帧 Juice 特效、复活与三倍金币广告 |
| 🐍 **霓虹贪吃蛇 (Cyber Snake)** | 动作街机 | 拖尾粒子特效、金币食物倍率、动态平滑移动与音效反馈 |
| 🧩 **2048 炫彩版 (Neon 2048)** | 烧脑益智 | 数字块合成特效、多层色阶高光、一键撤销功能 |
| 🃏 **记忆连连看 (Memory Match)** | 脑力锻炼 | 炫彩图标翻牌匹配、最少步数评估与挑战 |

---

## 📁 目录结构

```
game-studio/
├── index.html                 # 游戏大厅主入口
├── styles/
│   ├── main.css               # 主设计系统 & 视觉样式
│   └── game-container.css     # 游戏画布与通用 UI 控制组件
├── src/
│   ├── core/
│   │   ├── audio.js           # Web Audio API 极简音效引擎
│   │   ├── storage.js         # LocalStorage 高分记录与持久化
│   │   └── ui.js              # 全局模态框与组件逻辑
│   ├── games/
│   │   ├── snake/             # 霓虹贪吃蛇逻辑
│   │   ├── 2048/              # 2048 炫彩版逻辑
│   │   └── memory/            # 记忆卡牌翻牌逻辑
│   └── main.js                # 平台路由与大厅逻辑
└── .github/workflows/         # GitHub Pages 自动部署流程
```

---

## 🛠️ 如何添加新游戏 (How to Add a New Game)

1. 在 `src/games/` 目录下新建新游戏文件夹（如 `src/games/tetris/index.js`）。
2. 实现初始化函数 `export function initTetrisGame(container)`，并返回清理函数 `cleanup`。
3. 在 `src/main.js` 中的 `GAMES` 数组追加游戏配置项：

```javascript
{
  id: 'tetris',
  title: '俄罗斯方块',
  category: 'arcade',
  badge: '经典方块',
  icon: '🧱',
  desc: '经典下落消除游戏...',
  initFn: initTetrisGame
}
```

---

## 🚀 本地运行

在本地运行静态服务器即可访问：

```bash
# 使用 npx 启动简易 HTTP 服务
npx serve .
```

或直接在浏览器中打开 `index.html` 文件。

---

## 📄 License
[MIT License](LICENSE)
