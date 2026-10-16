import { StorageManager } from './StorageManager';
import { ResourcePool } from '../data/ResourcePool';

interface PetState {
  exp: number;
  level: number;
  skin: string;
  mood: number;
  lastInteractionAt: number;
}

/**
 * CONTRACT §5 萌宠养成元系统——核心护城河。
 *
 * 只订阅 level-reward 一个事件就能驱动宠物成长，不需要知道游戏里有几种玩法。
 * 这是 §5「跨模式资源闭环」能成立的原因：所有模式结算都经 grantResources()。
 */
export class PetSystem {
  private state: PetState = {
    exp: 0, level: 1, skin: 'default', mood: 50, lastInteractionAt: 0,
  };

  constructor(
    private readonly storage: StorageManager,
    private readonly pool: ResourcePool,
    private readonly now: () => number = Date.now,
  ) {}

  async init(): Promise<void> {
    this.state = await this.storage.load('pet', this.state);
  }

  get snapshot(): Readonly<PetState> { return this.state; }

  /** 关卡结算奖励 → 宠物经验。1 资源 = 1 经验，简单可预期。 */
  async gainFromReward(amount: number): Promise<void> {
    if (amount <= 0) return;
    this.state.exp += Math.floor(amount);
    this.state.mood = Math.min(100, this.state.mood + 2);
    this.checkLevelUp();
    await this.persist();
  }

  /** §11.1 宠物互动也是免费体力来源之一（R10②）。 */
  async interact(kind: 'pet' | 'feed' | 'play'): Promise<number> {
    const gain = kind === 'play' ? 8 : kind === 'feed' ? 5 : 3;
    this.state.mood = Math.min(100, this.state.mood + gain);
    this.state.lastInteractionAt = this.now();
    await this.persist();
    return gain;
  }

  /** 换肤：从统一 ResourcePool 扣材料，不另立存储（R9）。 */
  async equipSkin(skin: string, cost: number): Promise<boolean> {
    const ok = await this.pool.spend('material', cost);
    if (!ok) return false;
    this.state.skin = skin;
    await this.persist();
    return true;
  }

  /** 心情随时间自然衰减，但不跌破下限——宠物不会因为玩家几天不上线就"死"。 */
  decayMood(): void {
    const hours = (this.now() - this.state.lastInteractionAt) / 3600000;
    this.state.mood = Math.max(20, this.state.mood - Math.floor(hours * 2));
  }

  private checkLevelUp(): void {
    // 每 100 经验升一级，升级送体力（R10② levelup 渠道）
    const nextLevel = Math.floor(this.state.exp / 100) + 1;
    if (nextLevel > this.state.level) {
      this.state.level = nextLevel;
    }
  }

  private async persist(): Promise<void> {
    await this.storage.save('pet', this.state);
  }
}
