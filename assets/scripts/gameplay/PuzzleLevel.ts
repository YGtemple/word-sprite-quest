import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #6 拼写 · 单词拼图 | 25s/题，拼对 8 */
export class PuzzleLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    const word = this.wordData?.word ?? '';
    // 切成 2-3 字母的碎片块
    const chunks: string[] = [];
    const size = word.length > 8 ? 3 : 2;
    for (let i = 0; i < word.length; i += size) chunks.push(word.slice(i, i + size));

    const shuffled = chunks
      .map((c) => ({ c, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.c);

    this.node.emit('question-ready', {
      prompt: this.wordData?.meaning,
      chunks: shuffled,
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
        this.grantResources(12);
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
