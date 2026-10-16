import { _decorator, Component } from 'cc';
import { GameManager } from '../core/GameManager';
import { GameHUD } from './GameHUD';

const { ccclass } = _decorator;

/**
 * Root bootstrap。挂载正式 GameHUD（T-07 交付）。
 * PlayTestHUD 保留在仓库里作为已验证的 MVP 脚手架。
 *
 * 职责只做装配与路由，不含业务逻辑：
 *   - startCampaign / startArcade 分别走 chapter 1 与 chapter 0
 *   - continueCampaign 线性扫 8 章 × 30 关找下一个 campaign 模式关卡
 *   - replay 记住上次位置
 */
@ccclass('AppBootstrap')
export class AppBootstrap extends Component {
  private manager: GameManager | null = null;
  private lastChapter = 1;
  private lastIndex = 1;

  async start(): Promise<void> {
    const manager = this.getComponent(GameManager) ?? this.addComponent(GameManager);
    if (!manager) {
      this.node.emit('app-error', 'Unable to initialize game manager');
      return;
    }
    this.manager = manager;

    if (!this.getComponent(GameHUD)) this.addComponent(GameHUD);

    try {
      await manager.start();
    } catch (error) {
      this.node.emit('app-error', error);
    }
  }

  startCampaign(): void {
    this.lastChapter = 1; this.lastIndex = 1;
    void this.manager?.startLevel(1, 1);
  }

  startArcade(): void {
    this.lastChapter = 0; this.lastIndex = 1;
    void this.manager?.startLevel(0, 1);
  }

  replay(): void {
    void this.manager?.startLevel(this.lastChapter, this.lastIndex);
  }

  canAdvanceCampaign(): boolean { return this.findNextCampaignLevel() !== null; }

  continueCampaign(): void {
    const next = this.findNextCampaignLevel();
    if (!next) { this.startCampaign(); return; }
    this.lastChapter = next.chapter;
    this.lastIndex = next.index;
    void this.manager?.startLevel(next.chapter, next.index);
  }

  submit(answer: unknown): void { this.manager?.submitAnswer(answer); }

  /** 线性扫描找下一个 campaign 关。arcade 关存在 chapter 0，会被跳过。 */
  private findNextCampaignLevel(): { chapter: number; index: number } | null {
    if (!this.manager) return null;
    for (let chapter = this.lastChapter; chapter <= 8; chapter++) {
      const start = chapter === this.lastChapter ? this.lastIndex + 1 : 1;
      for (let index = start; index <= 30; index++) {
        const level = this.manager.getLevel(chapter, index);
        if (level?.mode === 'campaign') return { chapter, index };
      }
    }
    return null;
  }
}
