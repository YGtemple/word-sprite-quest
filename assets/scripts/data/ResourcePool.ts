import { StorageManager } from '../core/StorageManager';

export type ResourceKind = 'coin' | 'material';
export interface ResourceBalance { coin: number; material: number; }

/**
 * CONTRACT §5 统一资源池。R9 红线：所有模式必须经此入账，禁止玩法私藏。
 *
 * 只有两个币种（货币 + 材料），刻意保持简单：
 *   - coin   来自关卡结算，用于道具
 *   - material 用于宠物皮肤 / 家园装饰
 *
 * grant / spend 都走 Math.floor 并校验边界，避免负数与 NaN 污染存档。
 */
export class ResourcePool {
  private balance: ResourceBalance = { coin: 0, material: 0 };

  constructor(private readonly storage: StorageManager) {}

  async init(): Promise<void> {
    this.balance = await this.storage.load('resource_pool', this.balance);
  }

  get snapshot(): Readonly<ResourceBalance> { return { ...this.balance }; }

  async grant(kind: ResourceKind, amount: number): Promise<ResourceBalance> {
    if (!Number.isFinite(amount) || amount <= 0) return this.snapshot;
    this.balance[kind] += Math.floor(amount);
    await this.persist();
    return this.snapshot;
  }

  /** 余额不足返回 false 且不动账。 */
  async spend(kind: ResourceKind, amount: number): Promise<boolean> {
    const cost = Math.max(0, Math.floor(amount));
    if (this.balance[kind] < cost) return false;
    this.balance[kind] -= cost;
    await this.persist();
    return true;
  }

  private persist(): Promise<void> {
    return this.storage.save('resource_pool', this.balance);
  }
}
