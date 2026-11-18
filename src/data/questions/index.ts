/**
 * 問題集のエントリポイント。
 *
 * 問題を追加するときはモード・難易度別のファイルに
 * `duelQuestion(...)` / `inferQuestion(...)` / `detectiveQuestion(...)` を
 * 1 つ足すだけでよい。検証は `tests/questions.test.ts` が行う。
 */
import type { Difficulty, GameMode, Question } from "../../types/question";
import { advancedDetectiveQuestions } from "./advanced-detective";
import { advancedDuelQuestions } from "./advanced-duel";
import { advancedInferQuestions } from "./advanced-infer";
import { detectiveQuestions } from "./detective";
import { easyQuestions } from "./easy";
import { hardQuestions } from "./hard";
import { inferQuestions } from "./infer";
import { normalQuestions } from "./normal";

export {
  advancedDetectiveQuestions,
  advancedDuelQuestions,
  advancedInferQuestions,
  detectiveQuestions,
  easyQuestions,
  hardQuestions,
  inferQuestions,
  normalQuestions,
};

/** Duel の全問題（難易度順）。 */
export const duelQuestions: readonly Question[] = [
  ...easyQuestions,
  ...normalQuestions,
  ...hardQuestions,
  ...advancedDuelQuestions,
];

/** Infer の全問題。 */
export const allInferQuestions: readonly Question[] = [
  ...inferQuestions,
  ...advancedInferQuestions,
];

/** Detective の全問題。 */
export const allDetectiveQuestions: readonly Question[] = [
  ...detectiveQuestions,
  ...advancedDetectiveQuestions,
];

/** 全モードの全問題。 */
export const allQuestions: readonly Question[] = [
  ...duelQuestions,
  ...allInferQuestions,
  ...allDetectiveQuestions,
];

/** モードごとの問題集。 */
export const questionsByMode: Record<GameMode, readonly Question[]> = {
  duel: duelQuestions,
  infer: allInferQuestions,
  detective: allDetectiveQuestions,
};

/** 難易度ごとの Duel 問題集。 */
export const questionsByDifficulty: Record<Difficulty, readonly Question[]> = {
  easy: easyQuestions,
  normal: normalQuestions,
  hard: hardQuestions,
  advanced: advancedDuelQuestions,
};

/** モードを指定して問題を取得する。 */
export function getQuestionsForMode(mode: GameMode): readonly Question[] {
  return questionsByMode[mode];
}

/** モードと難易度を指定して問題を取得する。 */
export function getQuestionsForModeAndDifficulty(
  mode: GameMode,
  difficulty: Difficulty,
): readonly Question[] {
  return questionsByMode[mode].filter((question) => question.difficulty === difficulty);
}

/** 難易度を指定して Duel の問題を取得する（後方互換）。 */
export function getQuestionsForDifficulty(difficulty: Difficulty): readonly Question[] {
  return questionsByDifficulty[difficulty];
}

/** ID から問題を取得する（見つからなければ undefined）。 */
export function getQuestionById(id: string): Question | undefined {
  return allQuestions.find((question) => question.id === id);
}

/** ID の集合から問題を取得する（見つからない ID は無視する）。 */
export function getQuestionsByIds(ids: readonly string[]): Question[] {
  const byId = new Map(allQuestions.map((question) => [question.id, question]));
  return ids
    .map((id) => byId.get(id))
    .filter((question): question is Question => question !== undefined);
}

/** トピックを指定して問題を取得する。 */
export function getQuestionsByTopic(topic: string): readonly Question[] {
  return allQuestions.filter((question) => question.topic.includes(topic));
}

/** 全トピックの一覧（問題数が多い順）。 */
export function getAllTopics(): string[] {
  const counts = new Map<string, number>();
  for (const question of allQuestions) {
    for (const topic of question.topic) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([topic]) => topic);
}
