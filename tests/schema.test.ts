/**
 * 問題データのスキーマ・バリデーションのテスト。
 *
 * 仕様書 §6 の要件（ID 一意・選択肢・解説・正答の存在）と、
 * モード・難易度ごとの問題数を検証する。
 */
import { describe, expect, it } from "vitest";
import {
  allQuestions,
  detectiveQuestions,
  duelQuestions,
  getQuestionById,
  getQuestionsForDifficulty,
  getQuestionsForMode,
  getQuestionsForModeAndDifficulty,
  inferQuestions,
  questionsByDifficulty,
  questionsByMode,
} from "../src/data/questions";
import {
  countByDifficulty,
  countByMode,
  validateQuestion,
  validateQuestionSet,
} from "../src/lib/validate";
import {
  CHOICE_COUNT_BY_MODE,
  DIFFICULTIES,
  DUEL_CHOICE_IDS,
  GAME_MODES,
  type DetectiveQuestion,
  type DuelQuestion,
  type InferQuestion,
  type Question,
} from "../src/types/question";

/** 仕様書 §9 が要求する難易度ごとの最低問題数。 */
const MINIMUM_PER_DIFFICULTY = 15;

/** テスト用の Duel 問題。 */
function makeDuelQuestion(overrides: Partial<DuelQuestion> = {}): DuelQuestion {
  return {
    id: "test-001",
    mode: "duel",
    difficulty: "easy",
    topic: ["literal"],
    prompt: "テスト問題",
    code: "type A = string;\ntype B = string;\ndeclare const value: A;\nconst result: B = value;",
    choices: [
      { id: DUEL_CHOICE_IDS.assignable, label: "代入できる" },
      { id: DUEL_CHOICE_IDS.notAssignable, label: "代入できない" },
    ],
    answer: DUEL_CHOICE_IDS.assignable,
    explanation: "テスト解説",
    ...overrides,
  };
}

/** テスト用の Infer 問題。 */
function makeInferQuestion(overrides: Partial<InferQuestion> = {}): InferQuestion {
  return {
    id: "test-infer-001",
    mode: "infer",
    difficulty: "easy",
    topic: ["literal"],
    prompt: "value の型は？",
    code: `const value = "hello";`,
    choices: [
      { id: "choice-1", label: `"hello"` },
      { id: "choice-2", label: "string" },
      { id: "choice-3", label: "any" },
      { id: "choice-4", label: "unknown" },
    ],
    answer: "choice-1",
    expectedType: `"hello"`,
    explanation: "テスト解説",
    ...overrides,
  };
}

/** テスト用の Detective 問題。 */
function makeDetectiveQuestion(overrides: Partial<DetectiveQuestion> = {}): DetectiveQuestion {
  return {
    id: "test-detective-001",
    mode: "detective",
    difficulty: "easy",
    topic: ["null"],
    prompt: "エラーの原因は？",
    code: `const value: string = null;`,
    choices: [
      { id: "choice-1", label: "null は string に代入できない" },
      { id: "choice-2", label: "null は予約語である" },
      { id: "choice-3", label: "string は null を許容する" },
      { id: "choice-4", label: "const では null を使えない" },
    ],
    answer: "choice-1",
    expectedErrorCode: 2322,
    explanation: "テスト解説",
    ...overrides,
  };
}

/** テスト用の汎用問題（Duel）。 */
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return makeDuelQuestion(overrides as Partial<DuelQuestion>);
}

describe("問題集全体", () => {
  it("バリデーションエラーがない", () => {
    const issues = validateQuestionSet(allQuestions, MINIMUM_PER_DIFFICULTY);
    expect(issues.map((issue) => issue.message)).toEqual([]);
  });

  it("Duel は難易度ごとに 15 問以上ある", () => {
    const counts = countByDifficulty(duelQuestions);
    for (const difficulty of DIFFICULTIES) {
      expect(counts[difficulty], `${difficulty} の問題数`).toBeGreaterThanOrEqual(
        MINIMUM_PER_DIFFICULTY,
      );
    }
  });

  it("全モードが 10 問を重複なく抽選できる問題数を持つ", () => {
    for (const mode of GAME_MODES) {
      expect(getQuestionsForMode(mode).length, mode).toBeGreaterThanOrEqual(10);
    }
  });

  it("Infer と Detective は難易度ごとに 5 問以上ある", () => {
    for (const mode of ["infer", "detective"] as const) {
      const counts = countByDifficulty(getQuestionsForMode(mode));
      for (const difficulty of DIFFICULTIES) {
        expect(counts[difficulty], `${mode} / ${difficulty}`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("問題 ID が全体で一意", () => {
    const ids = allQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("全問の選択肢数がモードの規定と一致する", () => {
    for (const question of allQuestions) {
      expect(question.choices, question.id).toHaveLength(CHOICE_COUNT_BY_MODE[question.mode]);
    }
  });

  it("全問の answer が choices に含まれる", () => {
    for (const question of allQuestions) {
      const ids = question.choices.map((choice) => choice.id);
      expect(ids, question.id).toContain(question.answer);
    }
  });

  it("全問に解説とトピックがある", () => {
    for (const question of allQuestions) {
      expect(question.explanation.trim().length, question.id).toBeGreaterThan(0);
      expect(question.topic.length, question.id).toBeGreaterThan(0);
    }
  });

  it("Duel の正解の二択が極端に偏っていない", () => {
    const assignable = duelQuestions.filter(
      (question) => question.answer === DUEL_CHOICE_IDS.assignable,
    ).length;
    const ratio = assignable / duelQuestions.length;
    expect(ratio).toBeGreaterThan(0.3);
    expect(ratio).toBeLessThan(0.7);
  });

  it("Infer / Detective の正解位置が偏っていない", () => {
    for (const mode of ["infer", "detective"] as const) {
      const positions = getQuestionsForMode(mode).map((question) =>
        question.choices.findIndex((choice) => choice.id === question.answer),
      );
      const counts = new Map<number, number>();
      for (const position of positions) {
        counts.set(position, (counts.get(position) ?? 0) + 1);
      }
      // 4 択のうち少なくとも 3 つの位置に正解が散っていること
      expect(
        counts.size,
        `${mode} の正解位置: ${[...counts.keys()].join(",")}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("難易度別の問題集が Duel 全体と一致する", () => {
    const fromGroups = DIFFICULTIES.flatMap((difficulty) => questionsByDifficulty[difficulty]);
    expect(fromGroups).toHaveLength(duelQuestions.length);
  });

  it("モード別の問題集が全体と一致する", () => {
    const fromGroups = GAME_MODES.flatMap((mode) => questionsByMode[mode]);
    expect(fromGroups).toHaveLength(allQuestions.length);
  });

  it("モードと難易度の絞り込みが機能する", () => {
    const filtered = getQuestionsForModeAndDifficulty("infer", "easy");
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((question) => question.mode === "infer")).toBe(true);
    expect(filtered.every((question) => question.difficulty === "easy")).toBe(true);
  });

  it("ID から問題を取得できる", () => {
    const first = allQuestions[0];
    expect(first).toBeDefined();
    if (first !== undefined) {
      expect(getQuestionById(first.id)).toBe(first);
    }
    expect(getQuestionById("存在しない-id")).toBeUndefined();
  });

  it("Infer 問題には expectedType がある", () => {
    for (const question of inferQuestions) {
      expect(question.expectedType.length, question.id).toBeGreaterThan(0);
    }
  });

  it("Detective 問題には expectedErrorCode がある", () => {
    for (const question of detectiveQuestions) {
      expect(Number.isInteger(question.expectedErrorCode), question.id).toBe(true);
      expect(question.expectedErrorCode, question.id).toBeGreaterThan(0);
    }
  });

  it("Detective 問題の多くに修正例がある", () => {
    const withFix = detectiveQuestions.filter((question) => question.fix !== undefined);
    expect(withFix.length / detectiveQuestions.length).toBeGreaterThan(0.8);
  });
});

describe("validateQuestion", () => {
  it("正しい Duel 問題はエラーなし", () => {
    expect(validateQuestion(makeDuelQuestion(), 0)).toEqual([]);
  });

  it("正しい Infer 問題はエラーなし", () => {
    expect(validateQuestion(makeInferQuestion(), 0)).toEqual([]);
  });

  it("正しい Detective 問題はエラーなし", () => {
    expect(validateQuestion(makeDetectiveQuestion(), 0)).toEqual([]);
  });

  it("id の重複形式を検出する", () => {
    const issues = validateQuestion(makeDuelQuestion({ id: "Test_001" }), 0);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("空の id を検出する", () => {
    expect(validateQuestion(makeDuelQuestion({ id: "" }), 0).length).toBeGreaterThan(0);
  });

  it("不正なモードを検出する", () => {
    const issues = validateQuestion(makeDuelQuestion({ mode: "unknown" as never }), 0);
    expect(issues.some((issue) => issue.message.includes("mode"))).toBe(true);
  });

  it("不正な難易度を検出する", () => {
    const issues = validateQuestion(makeDuelQuestion({ difficulty: "expert" as never }), 0);
    expect(issues.some((issue) => issue.message.includes("difficulty"))).toBe(true);
  });

  it("空の prompt を検出する", () => {
    expect(validateQuestion(makeDuelQuestion({ prompt: "  " }), 0).length).toBeGreaterThan(0);
  });

  it("空の code を検出する", () => {
    expect(validateQuestion(makeDuelQuestion({ code: "" }), 0).length).toBeGreaterThan(0);
  });

  it("空の explanation を検出する", () => {
    expect(validateQuestion(makeDuelQuestion({ explanation: "" }), 0).length).toBeGreaterThan(0);
  });

  it("空の topic を検出する", () => {
    expect(validateQuestion(makeDuelQuestion({ topic: [] }), 0).length).toBeGreaterThan(0);
  });

  it("Duel の選択肢が 1 つだけならエラー", () => {
    const issues = validateQuestion(
      makeDuelQuestion({ choices: [{ id: DUEL_CHOICE_IDS.assignable, label: "代入できる" }] }),
      0,
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it("Infer の選択肢が 3 つならエラー", () => {
    const issues = validateQuestion(
      makeInferQuestion({
        choices: [
          { id: "choice-1", label: `"hello"` },
          { id: "choice-2", label: "string" },
          { id: "choice-3", label: "any" },
        ],
      }),
      0,
    );
    expect(issues.some((issue) => issue.message.includes("4"))).toBe(true);
  });

  it("answer が choices にない場合を検出する", () => {
    const issues = validateQuestion(makeDuelQuestion({ answer: "unknown-choice" }), 0);
    expect(issues.some((issue) => issue.message.includes("answer"))).toBe(true);
  });

  it("選択肢 ID の重複を検出する", () => {
    const issues = validateQuestion(
      makeDuelQuestion({
        choices: [
          { id: DUEL_CHOICE_IDS.assignable, label: "A" },
          { id: DUEL_CHOICE_IDS.assignable, label: "B" },
        ],
      }),
      0,
    );
    expect(issues.some((issue) => issue.message.includes("重複"))).toBe(true);
  });

  it("選択肢ラベルの重複を検出する", () => {
    const issues = validateQuestion(
      makeInferQuestion({
        choices: [
          { id: "choice-1", label: "string" },
          { id: "choice-2", label: "string" },
          { id: "choice-3", label: "any" },
          { id: "choice-4", label: "unknown" },
        ],
      }),
      0,
    );
    expect(issues.some((issue) => issue.message.includes("label"))).toBe(true);
  });

  it("空の選択肢ラベルを検出する", () => {
    const issues = validateQuestion(
      makeDuelQuestion({
        choices: [
          { id: DUEL_CHOICE_IDS.assignable, label: "" },
          { id: DUEL_CHOICE_IDS.notAssignable, label: "代入できない" },
        ],
      }),
      0,
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it("Infer の expectedType 欠落を検出する", () => {
    const issues = validateQuestion(makeInferQuestion({ expectedType: "" }), 0);
    expect(issues.some((issue) => issue.message.includes("expectedType"))).toBe(true);
  });

  it("Detective の expectedErrorCode 欠落を検出する", () => {
    const issues = validateQuestion(makeDetectiveQuestion({ expectedErrorCode: 0 }), 0);
    expect(issues.some((issue) => issue.message.includes("expectedErrorCode"))).toBe(true);
  });

  it("Detective の空の fix を検出する", () => {
    const issues = validateQuestion(makeDetectiveQuestion({ fix: "  " }), 0);
    expect(issues.some((issue) => issue.message.includes("fix"))).toBe(true);
  });

  it("範囲外の timeLimitSec を検出する", () => {
    expect(validateQuestion(makeDuelQuestion({ timeLimitSec: 1 }), 0).length).toBeGreaterThan(0);
    expect(validateQuestion(makeDuelQuestion({ timeLimitSec: 999 }), 0).length).toBeGreaterThan(0);
    expect(validateQuestion(makeDuelQuestion({ timeLimitSec: 20 }), 0)).toEqual([]);
  });
});

describe("validateQuestionSet", () => {
  it("ID の重複を検出する", () => {
    const issues = validateQuestionSet([makeQuestion(), makeQuestion()]);
    expect(issues.some((issue) => issue.message.includes("重複"))).toBe(true);
  });

  it("難易度ごとの最低問題数を検証する", () => {
    const issues = validateQuestionSet([makeQuestion()], 15);
    expect(issues.some((issue) => issue.message.includes("最低"))).toBe(true);
  });

  it("最低問題数を指定しなければ件数エラーは出ない", () => {
    expect(validateQuestionSet([makeQuestion()])).toEqual([]);
  });
});

describe("countByDifficulty", () => {
  it("難易度ごとに数える", () => {
    const counts = countByDifficulty([
      makeDuelQuestion({ id: "a-1", difficulty: "easy" }),
      makeDuelQuestion({ id: "a-2", difficulty: "easy" }),
      makeDuelQuestion({ id: "b-1", difficulty: "normal" }),
    ]);
    expect(counts).toEqual({ easy: 2, normal: 1, hard: 0 });
  });
});

describe("countByMode", () => {
  it("モードごとに数える", () => {
    const counts = countByMode([
      makeDuelQuestion({ id: "a-1" }),
      makeInferQuestion({ id: "b-1" }),
      makeInferQuestion({ id: "b-2" }),
      makeDetectiveQuestion({ id: "c-1" }),
    ]);
    expect(counts).toEqual({ duel: 1, infer: 2, detective: 1 });
  });
});

describe("getQuestionsForDifficulty", () => {
  it("Duel の問題を難易度で絞り込む", () => {
    const easy = getQuestionsForDifficulty("easy");
    expect(easy.length).toBeGreaterThan(0);
    expect(easy.every((question) => question.difficulty === "easy")).toBe(true);
  });
});
