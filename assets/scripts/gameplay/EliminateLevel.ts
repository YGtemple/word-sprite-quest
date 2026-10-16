import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #8 拼写 · 单词消消乐 | 60s，拼出 ≥5
 *
 * 网格里随机字母，玩家按顺序点出目标单词。
 * 发 eliminate-progress 让 UI 显示消除进度。
 */
export class EliminateLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    this.node.emit('question-ready', {
      prompt: this.wordData?.meaning,
      answerLength: (this.wordData?.word ?? '').length,
    });
    this.node.emit('answer-input-enabled', true);
  }

  protected onAnswer(selected: any): void {
    const value = typeof selected === 'object' && selected !== null ? selected.value : selected;
    const correct = typeof value === 'string'
      && value.trim().toLowerCase() === (this.wordData?.word ?? '').toLowerCase();
    this.updateCombo(correct);
    if (correct) {
      this.correctCount++;
      this.playEffect('CORRECT');
      this.node.emit('eliminate-progress', { done: this.correctCount, total: this.winTarget });
      if (this.checkLevelComplete()) {
        this.grantResources(15);
        this.showResultPanel();
        return;
      }
    } else {
      this.playEffect('WRONG');
      this.node.emit('wrong-word', this.wordData);
    }
    this.onResult(correct);
  }

  protected onResult(_isCorrect: boolean): void {
    this.nextQuestion();
  }
}
