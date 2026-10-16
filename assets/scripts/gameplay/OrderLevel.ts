import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #15 应用 · 句子排序 | 45s/题，排序 6
 * 打乱例句词序，玩家重排。发 emit escalation 触发关内递进阶。
 */
export class OrderLevel extends BaseLevel {
  private answered = 0;

  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.answered = 0;
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    const words = (this.wordData?.example ?? '').split(/\s+/).filter(Boolean);
    const shuffled = words
      .map((w) => ({ w, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.w);

    // CONTRACT §4.2 关内递进阶：每 3 题提高难度
    if (this.levelData?.withinLevelEscalation && this.answered > 0 && this.answered % 3 === 0) {
      this.node.emit('escalation', { answered: this.answered });
      this.timeLimit = Math.max(8, Math.floor(this.timeLimit * 0.9));
    }

    this.node.emit('question-ready', {
      prompt: '把打乱的单词排成正确句子',
      translation: this.wordData?.example_trans,
      words: shuffled,
      original: this.wordData?.example,
    });
    this.node.emit('answer-input-enabled', true);
  }

  protected onAnswer(selected: any): void {
    const value = typeof selected === 'object' && selected !== null ? selected.value : selected;
    const expected = (this.wordData?.example ?? '').trim().toLowerCase();
    const correct = typeof value === 'string' && value.trim().toLowerCase() === expected;

    this.answered++;
    this.updateCombo(correct);
    if (correct) {
      this.correctCount++;
      this.playEffect('CORRECT');
      if (this.checkLevelComplete()) {
        this.grantResources(14);
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
