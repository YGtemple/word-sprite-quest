/** CONTRACT v1.3 level schema. */
export type LevelType =
  | 'Match' | 'Listen' | 'Sort' | 'Memory'
  | 'Spell' | 'Puzzle' | 'Dictation' | 'Eliminate'
  | 'Antonym' | 'Synonym' | 'FillBlank'
  | 'Grammar' | 'Translate' | 'Order'
  | 'Ball' | 'Runner' | 'Idle';

export type GameMode = 'casual' | 'campaign' | 'bootcamp' | 'pvp' | 'arcade';
export type PropType = 'hint' | 'shuffle' | 'freeze' | 'hammer' | 'revive';

export interface ScoreRule {
  correctBase: number;
  comboBonus: number;
  timeBonus: number;
  wrongPenalty: number;
}

export interface LevelData {
  // v1 既有字段
  chapter: number;              // 1-8
  index: number;                // 关内序号 1-30
  gameplayType: LevelType;
  optionCount: number;          // 量化 3→6
  timeLimit: number;            // 量化 25→12s
  wordFreqBand: 'high' | 'mid' | 'low';
  isBoss: boolean;
  comboReq: number;             // 小Boss≥3 / 大Boss≥5
  winTarget: number;
  difficulty: number;           // 0-3

  // v1.1 新增
  actionIntensity: number;      // 0-3
  wordCount: number;
  withinLevelEscalation: boolean;   // 关内递进阶
  starThresholds: number[];
  scoreRule: ScoreRule;

  // v1.2 变更
  mode: GameMode;               // 5 档（v1.3 扩展）
  mixedTypes: LevelType[];      // 本关题型序列；Boss 关须 ≥2 种混合

  // v1.3 新增（元留存层）
  staminaCost?: number;         // 0 表示不消耗
  propRewards?: PropType[];
  allowAdRevive?: boolean;
}
