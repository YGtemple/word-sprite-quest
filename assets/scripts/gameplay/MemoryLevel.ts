import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #4 认词 · 记忆翻牌 | 60s，12→16→20 张
 *
 * 走 request-memory-deck 拿牌，翻牌传 { first, second } 给数据层判配对。
 * 牌面只发数据不发文字（契约：禁止把英文单词写死到 UI 节点）。
 */
export class MemoryLevel extends BaseLevel {
  private first: unknown = null;

  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.first = null;
    const cardCount = this.levelData?.difficulty >= 2 ? 20 : (this.levelData?.difficulty >= 1 ? 16 : 12);
    this.node.emit('request-memory-deck', {
      cardCount,
      callback: (cards: unknown[]) => {
        this.node.emit('memory-board-ready', { cards });
        this.node.emit('answer-input-enabled', true);
      },
    });
  }

  protected onAnswer(selected: any): void {
    if (!selected || typeof selected !== 'object') return;

    // 第一次翻牌：记下等第二次
    if (this.first === null) {
      this.first = selected.first;
      return;
    }

    // 第二次翻牌：传 { first, second } 给数据层
    const pair = { first: this.first, second: selected.second };
    this.node.emit('memory-pair-result', pair);
    this.first = null;
  }

  /** 数据层判配对后回调这里（UI → node.emit('memory-pair-resolved')）。 */
  onPairResolved(matched: boolean): void {
    this.updateCombo(matched);
    if (matched) {
      this.correctCount++;
      this.playEffect('CORRECT');
      if (this.checkLevelComplete()) {
        this.grantResources(15);
        this.showResultPanel();
      }
    } else {
      this.playEffect('WRONG');
    }
  }

  protected onResult(_isCorrect: boolean): void {
    // 翻牌关不逐题推进，牌局在关内持续到 winTarget 或超时
  }
}
