/** CONTRACT v1.3 - frozen 14-key word schema. */
export type ExamLevel = 'middle' | 'high' | 'cet4' | 'cet6' | 'postgrad';
export interface WordData {
  id: number; word: string; phonetic: string; meaning: string; pos: string; category: string;
  synonyms: string[]; antonyms: string[]; example: string; example_trans: string;
  image_tag: string; grammar_tags: string[]; frequency_rank: number; examLevel: ExamLevel;
}

/**
 * R5 命名漂移防护：统一小写 + 下划线。
 * 生图与词库转换前必须 sanitize，否则空格/大写/符号会直接导致裂图。
 */
export function sanitizeImageTag(raw: string): string {
  return raw.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
