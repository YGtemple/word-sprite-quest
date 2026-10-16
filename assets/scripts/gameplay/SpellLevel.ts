import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #5 拼写 · 字母拖拽拼写 | 30s/题，拼对 8 */
export class SpellLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    // 把单词打乱成字母牌，牌面只发字母不发含义（契约：禁止写死英文到 UI）
    const letters = (this.wordData?.word ?? '').split('');
    const shuffled = letters
      .map((c) => ({ c, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.c);
    this.node.emit('question-ready', {
      prompt: this.wordData?.meaning,
      letters: shuffled,
      answerLength: letters.length,
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
