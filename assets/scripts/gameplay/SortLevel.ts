import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #3 认词 · 单词分类 | 15s/题，分类 10 */
export class SortLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    this.node.emit('request-options', {
      word: this.wordData,
      count: 4,
      field: 'category',
      callback: (categories: string[]) => {
        this.node.emit('question-ready', {
          prompt: this.wordData?.word,
          buckets: categories ?? [],
        });
        this.node.emit('answer-input-enabled', true);
      },
    });
  }

  protected onAnswer(selected: any): void {
    const value = typeof selected === 'object' && selected !== null ? selected.value : selected;
    const correct = value === this.wordData?.category;
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
