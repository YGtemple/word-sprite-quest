import { Component, Node } from 'cc';
import { LevelData, LevelType } from '../data/LevelData';
import { BaseLevel } from '../gameplay/BaseLevel';
import { MatchLevel } from '../gameplay/MatchLevel';
import { ListenLevel } from '../gameplay/ListenLevel';
import { SortLevel } from '../gameplay/SortLevel';
import { MemoryLevel } from '../gameplay/MemoryLevel';
import { SpriteBallLevel } from '../gameplay/SpriteBallLevel';
import { SpellLevel } from '../gameplay/SpellLevel';
import { PuzzleLevel } from '../gameplay/PuzzleLevel';
import { DictationLevel } from '../gameplay/DictationLevel';
import { EliminateLevel } from '../gameplay/EliminateLevel';
import { AntonymLevel } from '../gameplay/AntonymLevel';
import { SynonymLevel } from '../gameplay/SynonymLevel';
import { FillBlankLevel } from '../gameplay/FillBlankLevel';
import { GrammarLevel } from '../gameplay/GrammarLevel';
import { TranslateLevel } from '../gameplay/TranslateLevel';
import { OrderLevel } from '../gameplay/OrderLevel';
import { RunnerLevel } from '../gameplay/RunnerLevel';
import { IdleLevel } from '../gameplay/IdleLevel';

type Ctor = new () => BaseLevel;

/**
 * CONTRACT §7 玩法注册表：LevelType ↔ <X>Level.ts 一一对应。
 * 17 个条目，命名漂移即 P0（R5）。
 */
const registry: Record<LevelType, Ctor> = {
  Match: MatchLevel, Listen: ListenLevel, Sort: SortLevel, Memory: MemoryLevel,
  Spell: SpellLevel, Puzzle: PuzzleLevel, Dictation: DictationLevel, Eliminate: EliminateLevel,
  Antonym: AntonymLevel, Synonym: SynonymLevel, FillBlank: FillBlankLevel,
  Grammar: GrammarLevel, Translate: TranslateLevel, Order: OrderLevel,
  Ball: SpriteBallLevel, Runner: RunnerLevel, Idle: IdleLevel,
};

export class LevelManager {
  private current: BaseLevel | null = null;
  private currentData: LevelData | null = null;
  private wave = 0;

  constructor(private readonly host: Node) {}

  start(data: LevelData): BaseLevel {
    this.dispose();
    this.currentData = data;
    this.wave = 0;
    return this.mount(this.typeForWave(data));
  }

  submitAnswer(answer: unknown): void {
    if (!this.current) return;
    (this.current as unknown as { onAnswer: (value: unknown) => void }).onAnswer(answer);
  }

  /** Boss 波次推进。isBoss 且还有下一波时才挂新玩法，否则返回 null。 */
  advanceBossWave(): BaseLevel | null {
    if (!this.currentData?.isBoss) return null;
    this.wave++;
    if (this.wave >= this.currentData.mixedTypes.length) return null;
    this.dispose();
    return this.mount(this.typeForWave(this.currentData));
  }

  get active(): BaseLevel | null { return this.current; }
  get activeLevel(): LevelData | null { return this.currentData; }

  dispose(): void {
    if (this.current) {
      this.current.node.off('show-result', this.onResult, this);
      this.current.node.destroy();
      this.current = null;
    }
  }

  private mount(type: LevelType): BaseLevel {
    const ctor = registry[type];
    const levelNode = new Node('LevelRuntime');
    this.host.addChild(levelNode);
    const component = levelNode.addComponent(ctor);
    this.current = component;
    this.bridge(levelNode);
    component.node.on('show-result', this.onResult, this);
    component.begin(this.currentData as LevelData);
    this.host.emit('level-started', this.currentData, type, this.wave);
    return component;
  }

  /**
   * 事件桥：把关卡节点的运行事件转发到 host（GameRoot），供 HUD / WordProvider 监听。
   * 关卡事件原本发在动态子节点上、不向上冒泡，外部监听不到。仅转发、不改语义；
   * request-next-word / request-options 的回调型载荷原样透传（须同步兑现）。
   *
   * ⚠ 该桥为补齐 Codex 交付缺口所加（其 PlayTestHUD 监听根节点 question-ready，
   *   但 LevelManager 未转发）。
   */
  private static BRIDGE_EVENTS = [
    'request-next-word', 'request-options', 'request-memory-deck',
    'question-ready', 'answer-input-enabled', 'hud-update', 'show-result',
    'play-effect', 'escalation', 'wrong-word', 'gameplay-data-error',
    'level-reward', 'memory-board-ready', 'memory-pair-result',
    'eliminate-progress', 'pair-progress', 'ball-round-ready',
    'ball-brick-cleared', 'ball-round-failed', 'tts-error',
  ];

  private bridge(levelNode: Node): void {
    for (const ev of LevelManager.BRIDGE_EVENTS) {
      levelNode.on(ev, (...args: any[]) => { (this.host as any).emit(ev, ...args); });
    }
  }

  private typeForWave(data: LevelData): LevelType {
    return data.mixedTypes[this.wave] ?? data.gameplayType;
  }

  private onResult(payload: { isWin: boolean }): void {
    this.host.emit('level-finished', {
      ...payload,
      level: this.currentData,
      wave: this.wave,
      isFinalWave: !this.currentData?.isBoss
        || this.wave >= this.currentData.mixedTypes.length - 1,
    });
  }
}
