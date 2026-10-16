import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #14 应用 · 翻译闯关 | 40s/题，翻译 6
 * 英译中与中译英交替，限时偏长（翻译需要时间）。
 */
export class TranslateLevel extends BaseLevel {
  private toChinese = true;

  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.toChinese = true;
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    this.node.emit('question-ready', {
      prompt: this.toChinese ? this.wordData?.word : this.wordData?.meaning,
      direction: this.toChinese ? 'en2zh' : 'zh2en',
      translation: this.toChinese ? undefined : this.wordData?.word,
    });
    this.node.emit('answer-input-enabled', true);
  }

  protected onAnswer(selected: any): void {
    const value = (typeof selected === 'object' && selected !== null ? selected.value : selected);
    const expected = this.toChinese ? this.wordData?.meaning : this.wordData?.word;
    const correct = typeof value === 'string'
      && value.trim().toLowerCase() === (expected ?? '').toLowerCase();

    this.updateCombo(correct);
    if (correct) {
      this.correctCount++;
      this.playEffect('CORRECT');
      this.toChinese = !this.toChinese;   // 答对才切换方向
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
