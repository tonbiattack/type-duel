/**
 * 問題データ記述用のヘルパー。
 *
 * 選択肢と正答の対応がずれないよう、`assignable` の真偽から
 * `choices` / `answer` を組み立てる。データファイルはこの関数だけを使う。
 */
import {
  DUEL_CHOICE_IDS,
  DUEL_CHOICES,
  type Difficulty,
  type Question,
} from "../../types/question";

/** `duelQuestion` に渡す入力。 */
export type DuelQuestionInput = {
  id: string;
  difficulty: Difficulty;
  topic: string[];
  /** 問題文。代入方向（A → B）を明示する。 */
  prompt: string;
  /** 判定対象の TypeScript コード。 */
  code: string;
  /** `const result: B = value;` が型検査を通るなら true。 */
  assignable: boolean;
  explanation: string;
  timeLimitSec?: number;
};

/** Duel の 1 問を組み立てる。 */
export function duelQuestion(input: DuelQuestionInput): Question {
  const question: Question = {
    id: input.id,
    mode: "duel",
    difficulty: input.difficulty,
    topic: input.topic,
    prompt: input.prompt,
    code: input.code,
    choices: DUEL_CHOICES.map((choice) => ({ ...choice })),
    answer: input.assignable ? DUEL_CHOICE_IDS.assignable : DUEL_CHOICE_IDS.notAssignable,
    explanation: input.explanation,
  };

  if (input.timeLimitSec !== undefined) {
    question.timeLimitSec = input.timeLimitSec;
  }

  return question;
}
