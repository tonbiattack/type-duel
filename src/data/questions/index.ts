/**
 * 問題集のエントリポイント。
 *
 * 問題を追加するときはモード・難易度別のファイルに
 * `duelQuestion(...)` / `inferQuestion(...)` / `detectiveQuestion(...)` を
 * 1 つ足すだけでよい。検証は `tests/questions.test.ts` が行う。
 */
import type { Difficulty, GameMode, Question } from "../../types/question";
import { detectiveQuestions } from "./detective";
import { easyQuestions } from "./easy";
import { hardQuestions } from "./hard";
import { inferQuestions } from "./infer";
import { normalQuestions } from "./normal";

export { detectiveQuestions, inferQuestions };
export { easyQuestions, hardQuestions, normalQuestions };

/** Duel の全問題（難易度順）。 */
export const duelQuestions: readonly Question[] = [
  ...easyQuestions,
  ...normalQuestions,
  ...hardQuestions,
];

/** 全モードの全問題。 */
export const allQuestions: readonly Question[] = [
  ...duelQuestions,
  ...inferQuestions,
  ...detectiveQuestions,
];

/** モードごとの問題集。 */
export const questionsByMode: Record<GameMode, readonly Question[]> = {
  duel: duelQuestions,
  infer: inferQuestions,
  detective: detectiveQuestions,
};

/** 難易度ごとの Duel 問題集。 */
export const questionsByDifficulty: Record<Difficulty, readonly Question[]> = {
  easy: easyQuestions,
  normal: normalQuestions,
  hard: hardQuestions,
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
