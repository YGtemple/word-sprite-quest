import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #10 理解 · 近义词连连看 | 45s，全部配对
 * 两列分别是单词与其 synonyms，玩家连线。发 pair-progress。
 */
export class SynonymLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    this.node.emit('question-ready', {
      prompt: '连线匹配近义词',
      pairs: this.wordData?.synonyms ?? [],
    });
    this.node.emit('answer-input-enabled', true);
  }

  protected onAnswer(selected: any): void {
    if (!selected || typeof selected !== 'object') return;
    const left = String(selected.left ?? '').toLowerCase();
    const right = String(selected.right ?? '').toLowerCase();
    const correct = left === right || (this.wordData?.synonyms ?? []).some(
      (s) => s.toLowerCase() === right || s.toLowerCase() === left,
    );
    this.updateCombo(correct);
    if (correct) {
      this.correctCount++;
      this.node.emit('pair-progress', { done: this.correctCount, total: this.winTarget });
      if (this.checkLevelComplete()) {
        this.grantResources(12);
        this.showResultPanel();
        return;
      }
    } else {
      this.playEffect('WRONG');
    }
    this.onResult(correct);
  }

  protected onResult(_isCorrect: boolean): void {
    // 连线段内持续，不逐题推进
  }
}
