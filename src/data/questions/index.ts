/**
 * 問題集のエントリポイント。
 *
 * 問題を追加するときは難易度別ファイル（`easy.ts` / `normal.ts` / `hard.ts`）に
 * `duelQuestion(...)` を 1 つ足すだけでよい。検証は `tests/questions.test.ts` が行う。
 */
import type { Difficulty, Question } from "../../types/question";
import { easyQuestions } from "./easy";
import { hardQuestions } from "./hard";
import { normalQuestions } from "./normal";

/** 全問題（難易度順）。 */
export const allQuestions: readonly Question[] = [
  ...easyQuestions,
  ...normalQuestions,
  ...hardQuestions,
];

/** 難易度ごとの問題集。 */
export const questionsByDifficulty: Record<Difficulty, readonly Question[]> = {
  easy: easyQuestions,
  normal: normalQuestions,
  hard: hardQuestions,
};

/** 難易度を指定して問題を取得する。 */
export function getQuestionsForDifficulty(difficulty: Difficulty): readonly Question[] {
  return questionsByDifficulty[difficulty];
}

/** ID から問題を取得する（見つからなければ undefined）。 */
export function getQuestionById(id: string): Question | undefined {
  return allQuestions.find((question) => question.id === id);
}
