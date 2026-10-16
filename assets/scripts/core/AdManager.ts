import { PlatformAdapter } from './PlatformAdapter';

export type AdPlacement = 'revive' | 'double_reward' | 'free_stamina';

/**
 * CONTRACT §11.3 广告门闸。所有玩法必须经此调广告，禁止直接调平台 API（R7）。
 *
 * 三层保护：
 *   1. pending 标志防连点（一次展示未结束不发起下一次）
 *   2. 3 秒冷却防刷（行业惯例下限）
 *   3. 询问 Adapter.canShow() 做平台侧二次确认
 */
export class AdManager {
  private pending = false;
  private lastShown = 0;

  constructor(private readonly now: () => number = Date.now) {}

  canShow(): boolean {
    return !this.pending
      && this.now() - this.lastShown >= 3000
      && PlatformAdapter.current.ad.canShow('rewarded');
  }

  /**
   * 展示激励视频。返回是否完整看完（决定是否发奖励）。
   * 异常一律吞掉返回 false —— 广告挂了不该打断主流程。
   */
  async showRewarded(_placement: AdPlacement, unitId = 'mock_rewarded'): Promise<boolean> {
    if (!this.canShow()) return false;
    this.pending = true;
    try {
      const done = await PlatformAdapter.current.ad.showRewarded(unitId);
      if (done) this.lastShown = this.now();
      return done;
    } catch {
      return false;
    } finally {
      this.pending = false;
    }
  }
}
