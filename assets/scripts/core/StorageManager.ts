import { PlatformAdapter } from './PlatformAdapter';

interface Envelope<T> { version: number; savedAt: number; data: T; }

/**
 * 带版本信封的本地存储。所有管理器共用。
 *
 * 两个设计点：
 *   1. 信封带 version 字段 —— 读取时版本不匹配直接回退 fallback，
 *      而不是拿旧结构当新结构用（silent schema drift）。
 *   2. assertKey() 白名单校验 key —— 只允许 [a-z0-9_.-]，
 *      挡掉注入与误用。
 *
 * 解析失败（JSON 损坏、平台异常）一律返回 fallback，绝不抛。
 */
export class StorageManager {
  constructor(private readonly namespace = 'word_spirit_v13') {}

  async save<T>(key: string, data: T, version = 1): Promise<void> {
    this.assertKey(key);
    const body: Envelope<T> = { version, savedAt: Date.now(), data };
    await PlatformAdapter.current.storage.setItem(
      `${this.namespace}:${key}`,
      JSON.stringify(body),
    );
  }

  async load<T>(key: string, fallback: T, version = 1): Promise<T> {
    this.assertKey(key);
    try {
      const raw = await PlatformAdapter.current.storage.getItem(`${this.namespace}:${key}`);
      if (!raw) return fallback;
      const body = JSON.parse(raw) as Partial<Envelope<T>>;
      return body.version === version && Object.prototype.hasOwnProperty.call(body, 'data')
        ? (body.data as T)
        : fallback;
    } catch {
      return fallback;
    }
  }

  async remove(key: string): Promise<void> {
    this.assertKey(key);
    await PlatformAdapter.current.storage.removeItem(`${this.namespace}:${key}`);
  }

  private assertKey(key: string): void {
    if (!/^[a-z0-9_.-]+$/i.test(key)) throw new Error(`Invalid storage key: ${key}`);
  }
}
