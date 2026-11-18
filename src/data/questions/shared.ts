/**
 * 問題データ記述用のヘルパー。
 *
 * 選択肢と正答の対応がずれないよう、正解の選択肢 ID を明示的に受け取り、
 * 選択肢一覧に存在することを型と実行時の両方で担保する。
 *
 * 任意項目（段階解説・制限時間・タイムアタック可否）は
 * `exactOptionalPropertyTypes` に対応するため、指定時だけ代入する。
 */
import {
  DUEL_CHOICE_IDS,
  DUEL_CHOICES,
  type DetectiveQuestion,
  type Difficulty,
  type DuelQuestion,
  type ExplanationStep,
  type InferQuestion,
  type Question,
} from "../../types/question";

/** 全モード共通の任意項目。 */
type CommonOptionalInput = {
  /** 段階解説。指定すると 1 ステップずつ開ける UI が使える。 */
  explanationSteps?: readonly ExplanationStep[];
  /** 個別の制限時間（秒）。 */
  timeLimitSec?: number;
  /** タイムアタックで出題してよいか。 */
  timeAttackEligible?: boolean;
};

/** 任意項目を問題データへ反映する。 */
function applyOptional(question: Question, input: CommonOptionalInput): void {
  if (input.explanationSteps !== undefined) {
    question.explanationSteps = input.explanationSteps.map((step) => ({ ...step }));
  }
  if (input.timeLimitSec !== undefined) {
    question.timeLimitSec = input.timeLimitSec;
  }
  if (input.timeAttackEligible !== undefined) {
    question.timeAttackEligible = input.timeAttackEligible;
  }
}

/** Duel 問題の入力。 */
export type DuelQuestionInput = CommonOptionalInput & {
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
};

/** Duel の 1 問を組み立てる。 */
export function duelQuestion(input: DuelQuestionInput): DuelQuestion {
  const question: DuelQuestion = {
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

  applyOptional(question, input);
  return question;
}

/** Infer 問題の入力。 */
export type InferQuestionInput = CommonOptionalInput & {
  id: string;
  difficulty: Difficulty;
  topic: string[];
  prompt: string;
  /** `const value = ...` を含む TypeScript コード。 */
  code: string;
  /** コンパイラが返す型表記と完全に一致させる。 */
  expectedType: string;
  /** 誤答候補（正解を含めない）。3 つ指定する。 */
  distractors: readonly string[];
  explanation: string;
};

/**
 * Infer の 1 問を組み立てる。
 *
 * 選択肢は「正解 + 誤答 3 つ」をシャッフルして並べる。
 * 並び順は問題 ID から決定的に導くため、テストと実行で一致する。
 */
export function inferQuestion(input: InferQuestionInput): InferQuestion {
  const labels = [input.expectedType, ...input.distractors];
  const shuffled = deterministicShuffle(labels, input.id);

  const choices = shuffled.map((label, index) => ({
    id: `choice-${index + 1}`,
    label,
  }));

  const answerChoice = choices.find((choice) => choice.label === input.expectedType);
  if (answerChoice === undefined) {
    throw new Error(`[${input.id}] 正解の選択肢が見つかりません`);
  }

  const question: InferQuestion = {
    id: input.id,
    mode: "infer",
    difficulty: input.difficulty,
    topic: input.topic,
    prompt: input.prompt,
    code: input.code,
    choices,
    answer: answerChoice.id,
    expectedType: input.expectedType,
    explanation: input.explanation,
  };

  applyOptional(question, input);
  return question;
}

/** Detective 問題の入力。 */
export type DetectiveQuestionInput = CommonOptionalInput & {
  id: string;
  difficulty: Difficulty;
  topic: string[];
  prompt: string;
  /** コンパイルエラーになる TypeScript コード。 */
  code: string;
  /** コンパイラが返す診断コード。 */
  expectedErrorCode: number;
  /** 正解の原因（選択肢ラベル）。 */
  cause: string;
  /** 誤答候補（正解を含めない）。3 つ指定する。 */
  distractors: readonly string[];
  explanation: string;
  /** 修正例のコード。 */
  fix?: string;
};

/**
 * Detective の 1 問を組み立てる。
 *
 * 選択肢は「正解 + 誤答 3 つ」をシャッフルして並べる。
 */
export function detectiveQuestion(input: DetectiveQuestionInput): DetectiveQuestion {
  const labels = [input.cause, ...input.distractors];
  const shuffled = deterministicShuffle(labels, input.id);

  const choices = shuffled.map((label, index) => ({
    id: `choice-${index + 1}`,
    label,
  }));

  const answerChoice = choices.find((choice) => choice.label === input.cause);
  if (answerChoice === undefined) {
    throw new Error(`[${input.id}] 正解の選択肢が見つかりません`);
  }

  const question: DetectiveQuestion = {
    id: input.id,
    mode: "detective",
    difficulty: input.difficulty,
    topic: input.topic,
    prompt: input.prompt,
    code: input.code,
    choices,
    answer: answerChoice.id,
    expectedErrorCode: input.expectedErrorCode,
    explanation: input.explanation,
  };

  if (input.fix !== undefined) {
    question.fix = input.fix;
  }

  applyOptional(question, input);
  return question;
}

/**
 * 文字列から決定的な種を作り、配列をシャッフルする。
 *
 * `Math.random` を使わないため、同じ入力なら常に同じ並びになる。
 * これによりテストの再現性が保たれ、選択肢の並びも毎回変わらない。
 */
function deterministicShuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let i = result.length - 1; i > 0; i -= 1) {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    const j = Math.abs(hash) % (i + 1);
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }

  return result;
}

/** モードに応じた問題を組み立てる（型の網羅性チェック用）。 */
export function isQuestionOfMode<M extends Question["mode"]>(
  question: Question,
  mode: M,
): question is Extract<Question, { mode: M }> {
  return question.mode === mode;
}
