import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';
import { WordData } from '../data/WordData';

/** CONTRACT §10 #1 认词 · 单词释义匹配 | 15s/题，答对 10 */
export class MatchLevel extends BaseLevel {
  private options: WordData[] = [];

  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.node.on('question-ready', () => {}, this);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    this.node.emit('request-options', {
      word: this.wordData,
      count: this.levelData?.optionCount ?? 4,
      field: 'meaning',
      callback: (options: WordData[]) => {
        this.options = options ?? [];
        this.node.emit('question-ready', {
          prompt: this.wordData?.word,
          options: this.options.map((o) => o.meaning),
        });
        this.node.emit('answer-input-enabled', true);
      },
    });
  }

  protected onAnswer(selected: any): void {
    const value = typeof selected === 'object' && selected !== null ? selected.value : selected;
    const correct = value === this.wordData?.meaning;
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
