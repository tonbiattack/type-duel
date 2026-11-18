/**
 * 問題データのバリデーション。
 *
 * データファイルの記述ミス（重複 ID・選択肢の欠落・解説の欠落など）を
 * 実行時とテストの両方から検出する。問題を追加したら
 * `tests/questions.test.ts` が自動的に検証する。
 */
import {
  CHOICE_COUNT_BY_MODE,
  DIFFICULTIES,
  DUEL_CHOICE_IDS,
  GAME_MODES,
  type Difficulty,
  type GameMode,
  type Question,
} from "../types/question";

/** バリデーション結果の 1 件。 */
export type ValidationIssue = {
  /** 問題 ID（特定できた場合）。 */
  questionId?: string;
  /** 人が読むための説明。 */
  message: string;
};

/** 1 問あたりの制限時間の許容範囲（秒）。 */
export const TIME_LIMIT_RANGE = { min: 3, max: 120 } as const;

/** 問題 ID の書式。`easy-001` のような難易度プレフィックス付きを推奨する。 */
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 選択肢 ID の書式。 */
const CHOICE_ID_PATTERN = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * 1 問を検証する。
 *
 * @param question 検証対象
 * @param index 配列内の位置（エラーメッセージ用）
 */
export function validateQuestion(question: Question, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = isNonEmptyString(question.id) ? question.id : undefined;
  const where = id ?? `index ${index}`;

  const push = (message: string): void => {
    issues.push(
      id === undefined
        ? { message: `[${where}] ${message}` }
        : { questionId: id, message: `[${where}] ${message}` },
    );
  };

  if (!isNonEmptyString(question.id)) {
    push("id が空です");
  } else if (!ID_PATTERN.test(question.id)) {
    push(`id "${question.id}" は kebab-case（英小文字・数字・ハイフン）にしてください`);
  }

  if (!GAME_MODES.includes(question.mode)) {
    push(`mode が不正です（実際: ${String(question.mode)}）`);
  }

  if (!DIFFICULTIES.includes(question.difficulty)) {
    push(`difficulty が不正です（実際: ${String(question.difficulty)}）`);
  }

  if (!Array.isArray(question.topic) || question.topic.length === 0) {
    push("topic を 1 つ以上指定してください");
  } else if (question.topic.some((tag) => !isNonEmptyString(tag))) {
    push("topic に空の要素があります");
  }

  if (!isNonEmptyString(question.prompt)) {
    push("prompt が空です");
  }

  if (!isNonEmptyString(question.code)) {
    push("code が空です");
  }

  if (!isNonEmptyString(question.explanation)) {
    push("explanation が空です");
  }

  // モードごとの選択肢数
  const expectedChoiceCount = CHOICE_COUNT_BY_MODE[question.mode] ?? 2;

  if (!Array.isArray(question.choices) || question.choices.length !== expectedChoiceCount) {
    push(
      `choices は ${question.mode} では ${expectedChoiceCount} 個必要です（実際: ${
        Array.isArray(question.choices) ? question.choices.length : 0
      }）`,
    );
  } else {
    const seen = new Set<string>();
    for (const choice of question.choices) {
      if (!isNonEmptyString(choice.id)) {
        push("choices に空の id があります");
        continue;
      }
      if (!CHOICE_ID_PATTERN.test(choice.id)) {
        push(`choice id "${choice.id}" の書式が不正です`);
      }
      if (seen.has(choice.id)) {
        push(`choice id "${choice.id}" が重複しています`);
      }
      seen.add(choice.id);
      if (!isNonEmptyString(choice.label)) {
        push(`choice "${choice.id}" の label が空です`);
      }
    }

    if (!isNonEmptyString(question.answer)) {
      push("answer が空です");
    } else if (!seen.has(question.answer)) {
      push(`answer "${question.answer}" が choices に存在しません`);
    }

    // 選択肢ラベルの重複は「正解が一意でない」ことを意味する
    const labels = question.choices.map((choice) => choice.label.trim());
    if (new Set(labels).size !== labels.length) {
      push("choices の label が重複しています（正解が一意になりません）");
    }
  }

  // モード固有の検証
  if (question.mode === "infer") {
    if (!isNonEmptyString(question.expectedType)) {
      push("infer モードでは expectedType が必要です");
    }
  }

  if (question.mode === "detective") {
    if (!Number.isInteger(question.expectedErrorCode) || question.expectedErrorCode <= 0) {
      push("detective モードでは expectedErrorCode（正の整数）が必要です");
    }
    if (question.fix !== undefined && !isNonEmptyString(question.fix)) {
      push("fix を指定する場合は空にできません");
    }
  }

  if (question.timeLimitSec !== undefined) {
    const limit = question.timeLimitSec;
    if (!Number.isInteger(limit) || limit < TIME_LIMIT_RANGE.min || limit > TIME_LIMIT_RANGE.max) {
      push(
        `timeLimitSec は ${TIME_LIMIT_RANGE.min}〜${TIME_LIMIT_RANGE.max} の整数にしてください（実際: ${String(limit)}）`,
      );
    }
  }

  return issues;
}

/**
 * 問題集全体を検証する。
 *
 * 個々の問題に加え、ID の重複と難易度ごとの問題数を確認する。
 *
 * @param questions 検証対象の問題集
 * @param minimumPerDifficulty 難易度ごとに要求する最低問題数
 */
export function validateQuestionSet(
  questions: readonly Question[],
  minimumPerDifficulty = 0,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Map<string, number>();

  questions.forEach((question, index) => {
    issues.push(...validateQuestion(question, index));

    if (isNonEmptyString(question.id)) {
      const previous = seenIds.get(question.id);
      if (previous !== undefined) {
        issues.push({
          questionId: question.id,
          message: `[${question.id}] id が index ${previous} と重複しています`,
        });
      } else {
        seenIds.set(question.id, index);
      }
    }
  });

  if (minimumPerDifficulty > 0) {
    const counts = countByDifficulty(questions);
    for (const difficulty of DIFFICULTIES) {
      const count = counts[difficulty];
      if (count < minimumPerDifficulty) {
        issues.push({
          message: `${difficulty} の問題数が ${count} 問です（最低 ${minimumPerDifficulty} 問必要）`,
        });
      }
    }
  }

  return issues;
}

/** 難易度ごとの問題数を数える。 */
export function countByDifficulty(questions: readonly Question[]): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = { easy: 0, normal: 0, hard: 0 };
  for (const question of questions) {
    if (DIFFICULTIES.includes(question.difficulty)) {
      counts[question.difficulty] += 1;
    }
  }
  return counts;
}

/** モードごとの問題数を数える。 */
export function countByMode(questions: readonly Question[]): Record<GameMode, number> {
  const counts: Record<GameMode, number> = { duel: 0, infer: 0, detective: 0 };
  for (const question of questions) {
    if (GAME_MODES.includes(question.mode)) {
      counts[question.mode] += 1;
    }
  }
  return counts;
}

/** Duel の正答が「代入できる」かどうか。 */
export function isAssignableAnswer(question: Question): boolean {
  return question.answer === DUEL_CHOICE_IDS.assignable;
}
