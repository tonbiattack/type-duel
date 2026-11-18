/**
 * 問題データのスキーマ・バリデーションのテスト。
 *
 * 仕様書 §6 の要件（ID 一意・選択肢・解説・正答の存在）と、
 * 難易度ごとの問題数を検証する。
 */
import { describe, expect, it } from "vitest";
import {
  allQuestions,
  getQuestionById,
  getQuestionsForDifficulty,
  questionsByDifficulty,
} from "../src/data/questions";
import { countByDifficulty, validateQuestion, validateQuestionSet } from "../src/lib/validate";
import { DIFFICULTIES, DUEL_CHOICE_IDS, type Question } from "../src/types/question";

/** 仕様書 §9 が要求する難易度ごとの最低問題数。 */
const MINIMUM_PER_DIFFICULTY = 15;

/** テスト用の最小構成の問題。 */
function makeQuestion(overrides: Partial<Question> = {}): Question {
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

describe("問題集全体", () => {
  it("バリデーションエラーがない", () => {
    const issues = validateQuestionSet(allQuestions, MINIMUM_PER_DIFFICULTY);
    expect(issues.map((issue) => issue.message)).toEqual([]);
  });

  it("難易度ごとに 15 問以上ある", () => {
    const counts = countByDifficulty(allQuestions);
    for (const difficulty of DIFFICULTIES) {
      expect(counts[difficulty], `${difficulty} の問題数`).toBeGreaterThanOrEqual(
        MINIMUM_PER_DIFFICULTY,
      );
    }
  });

  it("10 問を重複なく抽選できるだけの問題数がある", () => {
    for (const difficulty of DIFFICULTIES) {
      expect(getQuestionsForDifficulty(difficulty).length).toBeGreaterThanOrEqual(10);
    }
  });

  it("問題 ID が全体で一意", () => {
    const ids = allQuestions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("全問が duel モード", () => {
    expect(allQuestions.every((question) => question.mode === "duel")).toBe(true);
  });

  it("全問に 2 択が設定されている", () => {
    for (const question of allQuestions) {
      expect(question.choices, question.id).toHaveLength(2);
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

  it("正解の二択が極端に偏っていない", () => {
    const assignable = allQuestions.filter(
      (question) => question.answer === DUEL_CHOICE_IDS.assignable,
    ).length;
    const ratio = assignable / allQuestions.length;
    expect(ratio).toBeGreaterThan(0.3);
    expect(ratio).toBeLessThan(0.7);
  });

  it("難易度別の問題集が全体と一致する", () => {
    const fromGroups = DIFFICULTIES.flatMap((difficulty) => questionsByDifficulty[difficulty]);
    expect(fromGroups).toHaveLength(allQuestions.length);
  });

  it("ID から問題を取得できる", () => {
    const first = allQuestions[0];
    expect(first).toBeDefined();
    if (first !== undefined) {
      expect(getQuestionById(first.id)).toBe(first);
    }
    expect(getQuestionById("存在しない-id")).toBeUndefined();
  });
});

describe("validateQuestion", () => {
  it("正しい問題はエラーなし", () => {
    expect(validateQuestion(makeQuestion(), 0)).toEqual([]);
  });

  it("id の重複形式を検出する", () => {
    const issues = validateQuestion(makeQuestion({ id: "Test_001" }), 0);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("空の id を検出する", () => {
    expect(validateQuestion(makeQuestion({ id: "" }), 0).length).toBeGreaterThan(0);
  });

  it("duel 以外のモードを検出する", () => {
    const issues = validateQuestion(makeQuestion({ mode: "infer" }), 0);
    expect(issues.some((issue) => issue.message.includes("mode"))).toBe(true);
  });

  it("不正な難易度を検出する", () => {
    const issues = validateQuestion(makeQuestion({ difficulty: "expert" as never }), 0);
    expect(issues.some((issue) => issue.message.includes("difficulty"))).toBe(true);
  });

  it("空の prompt を検出する", () => {
    expect(validateQuestion(makeQuestion({ prompt: "  " }), 0).length).toBeGreaterThan(0);
  });

  it("空の code を検出する", () => {
    expect(validateQuestion(makeQuestion({ code: "" }), 0).length).toBeGreaterThan(0);
  });

  it("空の explanation を検出する", () => {
    expect(validateQuestion(makeQuestion({ explanation: "" }), 0).length).toBeGreaterThan(0);
  });

  it("空の topic を検出する", () => {
    expect(validateQuestion(makeQuestion({ topic: [] }), 0).length).toBeGreaterThan(0);
  });

  it("選択肢が 1 つだけならエラー", () => {
    const issues = validateQuestion(
      makeQuestion({ choices: [{ id: DUEL_CHOICE_IDS.assignable, label: "代入できる" }] }),
      0,
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it("answer が choices にない場合を検出する", () => {
    const issues = validateQuestion(makeQuestion({ answer: "unknown-choice" }), 0);
    expect(issues.some((issue) => issue.message.includes("answer"))).toBe(true);
  });

  it("選択肢 ID の重複を検出する", () => {
    const issues = validateQuestion(
      makeQuestion({
        choices: [
          { id: DUEL_CHOICE_IDS.assignable, label: "A" },
          { id: DUEL_CHOICE_IDS.assignable, label: "B" },
        ],
      }),
      0,
    );
    expect(issues.some((issue) => issue.message.includes("重複"))).toBe(true);
  });

  it("空の選択肢ラベルを検出する", () => {
    const issues = validateQuestion(
      makeQuestion({
        choices: [
          { id: DUEL_CHOICE_IDS.assignable, label: "" },
          { id: DUEL_CHOICE_IDS.notAssignable, label: "代入できない" },
        ],
      }),
      0,
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it("範囲外の timeLimitSec を検出する", () => {
    expect(validateQuestion(makeQuestion({ timeLimitSec: 1 }), 0).length).toBeGreaterThan(0);
    expect(validateQuestion(makeQuestion({ timeLimitSec: 999 }), 0).length).toBeGreaterThan(0);
    expect(validateQuestion(makeQuestion({ timeLimitSec: 20 }), 0)).toEqual([]);
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
      makeQuestion({ id: "a-1", difficulty: "easy" }),
      makeQuestion({ id: "a-2", difficulty: "easy" }),
      makeQuestion({ id: "b-1", difficulty: "normal" }),
    ]);
    expect(counts).toEqual({ easy: 2, normal: 1, hard: 0 });
  });
});
