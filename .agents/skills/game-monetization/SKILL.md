---
name: game-monetization
description: Detailed technical and business strategies for web & mobile game monetization, Ad SDK integration, virtual currency economy balancing, and conversion rate optimization.
---

# Game Monetization & Economy Design Skill

本技能为网页与移动端休闲游戏的商业化变现实现、广告 SDK 对接规范与虚拟经济数值平衡指南。

---

## 1. H5 网页游戏广告 SDK 对接规范 (Ad Integration)

### 1.1 激励广告逻辑封装 (Rewarded Ad Wrapper)

```javascript
class AdManager {
  constructor() {
    this.isAdLoaded = false;
  }

  async showRewardedAd(placementName) {
    return new Promise((resolve) => {
      console.log(`[AdManager] Requesting Rewarded Ad for: ${placementName}`);
      
      // 接入第三方 H5 广告 SDK (如 Google H5 Ads / Poki / CrazyGames / 微信小游戏)
      if (window.adSDK) {
        window.adSDK.showRewarded({
          placement: placementName,
          onSuccess: () => resolve({ success: true, rewarded: true }),
          onFail: () => resolve({ success: false, rewarded: false })
        });
      } else {
        // 开发环境测试模拟
        const confirmed = confirm(`[开发测试] 模拟播放激励视频广告 (${placementName})。点击确定模拟观看完毕？`);
        resolve({ success: true, rewarded: confirmed });
      }
    });
  }
}

export const adManager = new AdManager();
```

---

## 2. 虚拟经济平衡与定价锚定 (Economy Balance)

1. **双代币体系 (Dual Currency System)**:
   - **软代币 (Soft Currency - 金币)**: 通过玩游戏关卡大量产出，用于基础升级、复活、基础装备购买。
   - **硬代币 (Hard Currency - 钻石/宝石)**: 主要通过内购充值或极少量成就产出，用于购买限定皮肤、高级通行证与抽奖。

2. **价格锚定 (Price Anchoring)**:
   - 展示三个充值档位：小额 ($0.99)、推荐中额 ($4.99 - 标注“最受欢迎/ 300% 收益”)、大额 ($19.99)。利用对比效应提高 $4.99 档位的购买概率。

3. **限时折扣与 FOMO 机制**:
   - 当玩家连续失败 2 次或突破历史新高时，弹出 15 分钟倒计时的“限时特别优惠礼包”。
