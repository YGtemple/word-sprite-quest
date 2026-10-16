import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #11 理解 · 选词填空 | 20s/题，答对 8
 * 用 example 挖空目标词，选项只发文本不发单词本身。
 */
export class FillBlankLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    const word = this.wordData?.word ?? '';
    // 把例句里的目标词替换为下划线空
    const sentence = (this.wordData?.example ?? '').replace(
      new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      '______',
    );
    this.node.emit('question-ready', {
      prompt: sentence,
      translation: this.wordData?.example_trans,
      answerLength: word.length,
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
      if (this.checkLevelComplete()) {
        this.grantResources(11);
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
