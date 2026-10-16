/** CONTRACT v1 anchor copy. Common behavior stays in the base class. */
import { Component } from 'cc';
import { LevelData } from '../data/LevelData';
import { WordData } from '../data/WordData';

export enum EffectType {
  CORRECT = 'CORRECT',
  WRONG = 'WRONG',
  COMBO = 'COMBO',
  SUPER_COMBO = 'SUPER_COMBO',
  LEVEL_UP = 'LEVEL_UP',
}

/**
 * 18 种玩法的统一基类。
 *
 * 职责边界：只管计时、连击、过关判定、HUD 事件广播与生命周期清理。
 * 不发文字（契约：禁止把英文单词写死到 UI 节点），只 emit 数据。
 */
export abstract class BaseLevel extends Component {
  protected levelData!: LevelData;
  protected wordData!: WordData;
  protected combo = 0;
  protected maxCombo = 0;
  protected correctCount = 0;
  protected timeLimit = 0;
  protected timeRemaining = 0;
  protected winTarget = 0;
  private tickCallback: (() => void) | null = null;

  // ---------- 子类必须实现的三个钩子 ----------
  protected abstract onQuestionStart(): void;
  protected abstract onAnswer(selected: any): void;
  protected abstract onResult(isCorrect: boolean): void;

  // ---------- 计时器 ----------
  protected startTimer(): void {
    this.stopTimer();
    this.timeRemaining = this.timeLimit;
    this.tickCallback = () => this.tickTimer();
    this.schedule(this.tickCallback, 1);
    this.updateHUD();
  }

  protected stopTimer(): void {
    if (this.tickCallback) {
      this.unschedule(this.tickCallback);
      this.tickCallback = null;
    }
  }

  private tickTimer(): void {
    this.timeRemaining = Math.max(0, this.timeRemaining - 1);
    this.updateHUD();
    if (this.timeRemaining === 0) {
      this.stopTimer();
      this.onResult(false);
    }
  }

  // ---------- 连击与里程碑 ----------
  protected updateCombo(correct: boolean): void {
    this.combo = correct ? this.combo + 1 : 0;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.checkComboMilestone();
  }

  protected checkComboMilestone(): void {
    if (this.combo === 5)  this.playEffect(EffectType.COMBO);
    if (this.combo === 10) this.playEffect(EffectType.SUPER_COMBO);
  }

  protected playEffect(type: EffectType): void {
    this.node.emit('play-effect', type);
  }

  // ---------- HUD：emit 数据，不碰 UI 节点 ----------
  protected updateHUD(): void {
    this.node.emit('hud-update', {
      combo: this.combo,
      maxCombo: this.maxCombo,
      correctCount: this.correctCount,
      timeRemaining: this.timeRemaining,
      timeLimit: this.timeLimit,
    });
  }

  protected nextQuestion(): void {
    this.onQuestionStart();
  }

  protected checkLevelComplete(): boolean {
    return this.correctCount >= this.winTarget;
  }

  protected showResultPanel(): void {
    this.stopTimer();
    this.node.emit('show-result', {
      isWin: this.checkLevelComplete(),
      correctCount: this.correctCount,
      maxCombo: this.maxCombo,
    });
  }

  // ---------- 关卡初始化 ----------
  protected initLevel(data: LevelData): void {
    this.levelData = data;
    this.timeLimit = data.timeLimit;
    this.winTarget = data.winTarget;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.timeRemaining = data.timeLimit;
    this.wordData = null as unknown as WordData;
  }

  // ---------- 向数据层要下一个词（须同步回调） ----------
  protected getNextWord(): void {
    this.node.emit('request-next-word', (word: WordData | null) => {
      this.wordData = word as WordData;
    });
  }

  /**
   * 结算钩子。所有模式必须经此入账统一 ResourcePool（CONTRACT §9 R9），
   * 禁止玩法私自另存资源。
   */
  protected grantResources(amount: number): void {
    this.node.emit('level-reward', { amount, mode: this.levelData?.mode });
  }

  // ---------- 生命周期：反注册计时器 + 摘除全部监听 ----------
  // 契约代码质量红线第②条就是"计时器清理"。
  // Cocos 里忘了反注册 = 内存泄漏 + 野回调。
  onDestroy(): void {
    this.stopTimer();
    this.unscheduleAllCallbacks();
    this.node.targetOff(this);
  }
}
