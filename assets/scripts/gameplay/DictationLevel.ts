import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #7 拼写 · 听音拼写 | 30s/题，拼对 6
 *
 * Listen + Spell 的组合：先 TTS 播单词，再手写拼出。
 */
export class DictationLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    void this.speak();
    this.node.emit('question-ready', {
      prompt: '听音拼写',
      answerLength: (this.wordData?.word ?? '').length,
    });
    this.node.emit('answer-input-enabled', true);
  }

  private async speak(): Promise<void> {
    try {
      const audio = (globalThis as any).__platform?.audio;
      if (!audio) throw new Error('audio not configured');
      await audio.playTTS(this.wordData?.word ?? '');
    } catch (err) {
      this.node.emit('tts-error', err instanceof Error ? err.message : String(err));
    }
  }

  protected onAnswer(selected: any): void {
    if (selected && typeof selected === 'object' && selected.action === 'replay') {
      void this.speak();
      return;
    }
    const value = typeof selected === 'object' && selected !== null ? selected.value : selected;
    const correct = typeof value === 'string'
      && value.trim().toLowerCase() === (this.wordData?.word ?? '').toLowerCase();
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
