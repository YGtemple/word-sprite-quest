import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #9 理解 · 反义词对战 | 10s/题，答对 10
 * 用 WordData.antonyms 出题，限时最短（10s），考验反应。
 */
export class AntonymLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    const antonym = this.wordData?.antonyms?.[0] ?? '';
    this.node.emit('question-ready', {
      prompt: `${this.wordData?.word ?? ''} 的反义词`,
      answer: antonym,
      answerLength: antonym.length,
    });
    this.node.emit('answer-input-enabled', true);
  }

  protected onAnswer(selected: any): void {
    const value = typeof selected === 'object' && selected !== null ? selected.value : selected;
    const correct = typeof value === 'string'
      && value.trim().toLowerCase() === (this.wordData?.antonyms?.[0] ?? '').toLowerCase();
    this.updateCombo(correct);
    if (correct) {
      this.correctCount++;
      this.playEffect('CORRECT');
      if (this.checkLevelComplete()) {
        this.grantResources(10);
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
