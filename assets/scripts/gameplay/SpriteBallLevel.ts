import { _decorator } from 'cc';
import { BaseLevel, EffectType } from './BaseLevel';

const { ccclass } = _decorator;

/**
 * Arcade #16 精灵弹球（物理打砖块）。CONTRACT §4.1：娱乐 95%+，单词仅作皮肤/主题，不考记忆。
 *
 * 场景物理引擎上报 hit / lost / skill 三种事件，本类只做状态机转发，
 * 不参与物理计算——物理在场景节点里跑。
 *
 * 关键标记 wordSkinOnly: true 发在 ball-round-ready 里，
 * 告诉 UI「这一关砖块印的单词只是装饰，不要当答案渲染」。
 */
@ccclass('SpriteBallLevel')
export class SpriteBallLevel extends BaseLevel {
  protected onQuestionStart(): void {
    this.winTarget = Math.max(1, this.winTarget);
    this.node.emit('ball-round-ready', {
      brickCount: 18 + this.levelData.difficulty * 6,
      actionIntensity: this.levelData.actionIntensity,
      wordSkinOnly: true,
    });
    this.node.emit('answer-input-enabled', true);
    this.startTimer();
  }

  protected onAnswer(selected: any): void {
    if (selected?.action === 'hit' || selected?.action === 'skill') { this.onResult(true); return; }
    if (selected?.action === 'lost' || selected?.action === 'quit') { this.onResult(false); }
  }

  protected onResult(correct: boolean): void {
    if (correct) {
      this.updateCombo(true);
      this.correctCount++;
      this.addScore(this.levelData.scoreRule.correctBase + this.combo * this.levelData.scoreRule.comboBonus);
      this.playEffect(EffectType.CORRECT);

      this.node.emit('ball-brick-cleared', {
        combo: this.combo,
        skill: correct && this.combo % 10 === 0,   // 每 10 连击触发一次技能特效
      });

      if (this.checkLevelComplete()) {
        this.grantResources(Math.max(25, this.score / 8));   // §5 入账统一 ResourcePool
        this.showResultPanel();
      }
    } else {
      this.updateCombo(false);
      this.playEffect(EffectType.WRONG);

      // §11.3 复活入口：canRevive 由关卡配置 allowAdRevive 决定
      this.node.emit('ball-round-failed', {
        canRevive: this.levelData.allowAdRevive === true,
      });
      this.showResultPanel();
    }
  }
}
