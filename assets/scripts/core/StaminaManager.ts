import { StorageManager } from './StorageManager';

export type StaminaGrantSource =
  | 'login' | 'ad' | 'levelup' | 'pet' | 'streak' | 'friend';

interface State {
  current: number;
  lastAt: number;
  firstSeenAt: number;
  grants: Record<string, string>;
}

export interface StartDecision {
  allowed: boolean;
  freeAdRequired: boolean;
  newcomerProtection: boolean;
  current: number;
}

/**
 * CONTRACT §11.1 体力系统 — R10 宽松红线实现。
 *
 * 红线原文要求：
 *   ① 自然恢复速率远高于行业（≈每 2-3 分钟回 1 点）
 *   ② 多免费获取渠道（每日登录/看广告/升级/宠物互动/连续闯关/好友赠送）
 *   ③ 0 体力兜底：体力=0 时须提供"看广告免费玩一局"通道，永不硬阻塞
 *   ④ 新手前 7 日近乎无限体力
 *   ⑤ 禁止"体力不足即锁死入口、必须付费才能继续"
 *
 * 这里把五条全部落到代码里，而不是只写进文档。
 */
export class StaminaManager {
  private state: State;
  readonly max = 40;
  /** R10①：150 秒 = 2.5 分钟回 1 点（行业常见 5-10 分钟） */
  readonly restoreMs = 150000;

  constructor(
    private readonly storage: StorageManager,
    private readonly now: () => number = Date.now,
  ) {
    const at = this.now();
    this.state = { current: 40, lastAt: at, firstSeenAt: at, grants: {} };
  }

  async init(): Promise<void> {
    this.state = await this.storage.load('stamina', this.state);
    this.restore();
  }

  get current(): number { this.restore(); return this.state.current; }

  canStart(cost = 0): StartDecision {
    this.restore();
    const newcomer = this.now() - this.state.firstSeenAt < 7 * 86400000;

    // R10④ 新手 7 日近乎无限：直接放行且不扣
    if (newcomer || cost <= 0 || this.state.current >= cost) {
      return {
        allowed: true,
        freeAdRequired: false,
        newcomerProtection: newcomer,
        current: this.state.current,
      };
    }

    // R10③ 0 体力兜底：不锁死，返回 freeAdRequired 让上层给"看广告免费玩一局"
    return {
      allowed: false,
      freeAdRequired: true,
      newcomerProtection: false,
      current: this.state.current,
    };
  }

  /**
   * 扣体力。不足时若 adFallback=true 则改为允许（不扣），交给上层弹激励视频。
   * 注意返回的 allowed=true 表示"可以开始"，freeAdRequired 表示"要先看广告"。
   */
  async consume(cost = 0, adFallback = false): Promise<StartDecision> {
    const d = this.canStart(cost);
    if (d.allowed) {
      if (!d.newcomerProtection && cost > 0) this.state.current -= cost;
      await this.persist();
      return { ...d, current: this.state.current };
    }
    if (adFallback) {
      return { allowed: true, freeAdRequired: true, newcomerProtection: false, current: this.state.current };
    }
    return d;
  }

  /**
   * R10② 多免费渠道。login / ad / friend 三个来源按天去重
   * （同一来源同一天只发一次），levelup / pet / streak 不限次。
   */
  async grant(source: StaminaGrantSource, amount: number, dayKey: string): Promise<number> {
    this.restore();
    const key = `${source}:${dayKey}`;
    if (['login', 'ad', 'friend'].includes(source) && this.state.grants[key]) return this.current;
    this.state.grants[key] = '1';
    this.state.current = Math.min(this.max, this.state.current + Math.max(0, Math.floor(amount)));
    await this.persist();
    return this.current;
  }

  /** 离线也回体力：按 restoreMs 整点数补齐，lastAt 只前进整数倍，不会丢零头。 */
  private restore(): void {
    const now = this.now();
    const ticks = Math.floor((now - this.state.lastAt) / this.restoreMs);
    if (ticks > 0) {
      this.state.current = Math.min(this.max, this.state.current + ticks);
      this.state.lastAt += ticks * this.restoreMs;
    }
  }

  private persist(): Promise<void> { return this.storage.save('stamina', this.state); }
}
