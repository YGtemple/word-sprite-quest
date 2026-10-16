import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #2 认词 · 听音识词 | 20s/题，答对 8
 *
 * 只经 PlatformAdapter.current.audio 调 TTS，绝不直接碰 wx/tt（R7）。
 * 未配置时 Adapter 会 throw，本类捕获后 emit tts-error（契约：不得用 console 代替）。
 * 重播传 { action: 'replay' }，每题最多两次。
 */
export class ListenLevel extends BaseLevel {
  private replayCount = 0;

  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.replayCount = 0;
    this.getNextWord();
    void this.speak();
    this.node.emit('answer-input-enabled', true);
  }

  /** 重播入口：UI 通过 onAnswer({action:'replay'}) 触发。 */
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
      if (this.replayCount >= 2) return;   // 每题最多两次
      this.replayCount++;
      void this.speak();
      return;
    }

    const value = typeof selected === 'object' && selected !== null ? selected.value : selected;
    const correct = value === this.wordData?.word;
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
