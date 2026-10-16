import { Component } from 'cc';
import { BaseLevel } from './BaseLevel';

/** CONTRACT §10 #13 应用 · 语法选择 | 25s/题，答对 8
 * 用 WordData.grammar_tags 出题——这是冻结 14 键里专为语法玩法留的字段。
 */
export class GrammarLevel extends BaseLevel {
  protected begin(data: Parameters<BaseLevel['initLevel']>[0]): void {
    this.initLevel(data);
    this.startTimer();
    this.nextQuestion();
  }

  protected onQuestionStart(): void {
    this.getNextWord();
    this.node.emit('question-ready', {
      prompt: `${this.wordData?.word ?? ''} 的语法标注是什么？`,
      translation: this.wordData?.meaning,
      answerLength: (this.wordData?.grammar_tags ?? []).length,
      grammarTags: this.wordData?.grammar_tags ?? [],
    });
    this.node.emit('answer-input-enabled', true);
  }

  protected onAnswer(selected: any): void {
    const value = typeof selected === 'object' && selected !== null ? selected.value : selected;
    const tags = this.wordData?.grammar_tags ?? [];
    const correct = Array.isArray(value)
      ? value.length === tags.length && value.every((v) => tags.includes(v))
      : tags.includes(String(value));
    this.updateCombo(correct);
    if (correct) {
      this.correctCount++;
      this.playEffect('CORRECT');
      if (this.checkLevelComplete()) {
        this.grantResources(13);
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
