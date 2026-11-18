/**
 * ローカル保存（localStorage）のテスト。
 *
 * 壊れたデータ・容量超過・localStorage 無効のいずれでも
 * 通常プレイを止めないことを重点的に検証する。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aggregateAnswerBreakdown,
  aggregateTopicStats,
  clearProgress,
  createEmptyProgress,
  getQuestionRecord,
  getStrugglingQuestionIds,
  isStorageAvailable,
  isStruggling,
  loadProgress,
  parseProgress,
  recordAnswer,
  recordRecentQuestions,
  recordTimeAttack,
  saveProgress,
  STORAGE_KEYS,
  type Progress,
} from "../src/lib/storage";
import { RECENT_HISTORY_LIMIT, STORAGE_SCHEMA_VERSION } from "../src/lib/config";

/** localStorage を空にする。 */
function resetStorage(): void {
  window.localStorage.clear();
}

/** 元の localStorage（差し替えからの復元用）。 */
const originalLocalStorage: Storage = window.localStorage;

/**
 * localStorage を、指定したメソッドだけ失敗する実装に差し替える。
 *
 * jsdom の Storage は Proxy なので `vi.spyOn` では差し替えられない。
 * プロパティごと置き換えて、例外時の挙動を検証する。
 */
function replaceLocalStorage(overrides: Partial<Storage>): void {
  const original = originalLocalStorage;
  const mock: Storage = {
    get length() {
      return original.length;
    },
    clear: () => original.clear(),
    getItem: (key: string) => original.getItem(key),
    key: (index: number) => original.key(index),
    removeItem: (key: string) => original.removeItem(key),
    setItem: (key: string, value: string) => original.setItem(key, value),
    ...overrides,
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: mock,
  });
}

/** 差し替えた localStorage を元に戻す。 */
function restoreLocalStorage(): void {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: originalLocalStorage,
  });
}

describe("parseProgress", () => {
  it("null なら空の進捗を返す", () => {
    expect(parseProgress(null)).toEqual(createEmptyProgress());
  });

  it("空文字なら空の進捗を返す", () => {
    expect(parseProgress("")).toEqual(createEmptyProgress());
  });

  it("壊れた JSON なら空の進捗を返す", () => {
    expect(parseProgress("{not json")).toEqual(createEmptyProgress());
  });

  it("JSON だがオブジェクトでなければ空の進捗を返す", () => {
    expect(parseProgress("123")).toEqual(createEmptyProgress());
    expect(parseProgress("null")).toEqual(createEmptyProgress());
    expect(parseProgress('"str"')).toEqual(createEmptyProgress());
  });

  it("スキーマバージョンが違えば読み捨てる", () => {
    const raw = JSON.stringify({ version: 999, questions: { a: { correct: 1 } } });
    expect(parseProgress(raw)).toEqual(createEmptyProgress());
  });

  it("妥当なデータを復元する", () => {
    const progress: Progress = {
      version: STORAGE_SCHEMA_VERSION,
      questions: {
        "q-1": { correct: 2, wrong: 1, streak: 1, lastAnsweredAt: 1000, lastDurationMs: 500 },
      },
      timeAttack: { bestScore: 700, bestCorrect: 5, bestStreak: 3, achievedAt: 2000 },
      recentQuestionIds: ["q-1"],
    };
    expect(parseProgress(JSON.stringify(progress))).toEqual(progress);
  });

  it("壊れた問題記録だけを捨てる", () => {
    const raw = JSON.stringify({
      version: STORAGE_SCHEMA_VERSION,
      questions: {
        good: { correct: 1, wrong: 0, streak: 1, lastAnsweredAt: 1, lastDurationMs: 1 },
        bad: { correct: "x" },
        alsoBad: null,
      },
      timeAttack: null,
      recentQuestionIds: [],
    });
    const parsed = parseProgress(raw);
    expect(Object.keys(parsed.questions)).toEqual(["good"]);
  });

  it("壊れたタイムアタック記録を捨てる", () => {
    const raw = JSON.stringify({
      version: STORAGE_SCHEMA_VERSION,
      questions: {},
      timeAttack: { bestScore: "x" },
      recentQuestionIds: [],
    });
    expect(parseProgress(raw).timeAttack).toBeNull();
  });

  it("recentQuestionIds の不正要素を捨てる", () => {
    const raw = JSON.stringify({
      version: STORAGE_SCHEMA_VERSION,
      questions: {},
      timeAttack: null,
      recentQuestionIds: ["a", 1, null, "", "b"],
    });
    expect(parseProgress(raw).recentQuestionIds).toEqual(["a", "b"]);
  });

  it("recentQuestionIds が配列でなければ空にする", () => {
    const raw = JSON.stringify({
      version: STORAGE_SCHEMA_VERSION,
      questions: {},
      timeAttack: null,
      recentQuestionIds: "nope",
    });
    expect(parseProgress(raw).recentQuestionIds).toEqual([]);
  });
});

describe("loadProgress / saveProgress / clearProgress", () => {
  beforeEach(() => {
    resetStorage();
  });

  afterEach(() => {
    restoreLocalStorage();
    resetStorage();
    vi.restoreAllMocks();
  });

  it("保存した進捗を読み込める", () => {
    const progress = recordAnswer(createEmptyProgress(), "q-1", true, 1200, 1000);
    expect(saveProgress(progress)).toBe(true);
    expect(loadProgress()).toEqual(progress);
  });

  it("未保存なら空の進捗を返す", () => {
    expect(loadProgress()).toEqual(createEmptyProgress());
  });

  it("壊れたデータでも例外を投げず空の進捗を返す", () => {
    window.localStorage.setItem(STORAGE_KEYS.progress, "{{{");
    expect(() => loadProgress()).not.toThrow();
    expect(loadProgress()).toEqual(createEmptyProgress());
  });

  it("保存に失敗しても例外を投げない", () => {
    replaceLocalStorage({
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(() => saveProgress(createEmptyProgress())).not.toThrow();
    expect(saveProgress(createEmptyProgress())).toBe(false);
  });

  it("読み込みに失敗しても例外を投げない", () => {
    replaceLocalStorage({
      getItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(() => loadProgress()).not.toThrow();
    expect(loadProgress()).toEqual(createEmptyProgress());
  });

  it("進捗を消せる", () => {
    saveProgress(recordAnswer(createEmptyProgress(), "q-1", true, 100, 1));
    expect(clearProgress()).toBe(true);
    expect(loadProgress()).toEqual(createEmptyProgress());
  });

  it("削除に失敗しても例外を投げない", () => {
    replaceLocalStorage({
      removeItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(() => clearProgress()).not.toThrow();
    expect(clearProgress()).toBe(false);
  });
});

describe("isStorageAvailable", () => {
  afterEach(() => {
    restoreLocalStorage();
  });

  it("使える環境では true", () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it("setItem が例外なら false", () => {
    replaceLocalStorage({
      setItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(isStorageAvailable()).toBe(false);
  });
});

describe("recordAnswer", () => {
  it("正解を記録する", () => {
    const progress = recordAnswer(createEmptyProgress(), "q-1", true, 1500, 1000);
    expect(progress.questions["q-1"]).toEqual({
      correct: 1,
      wrong: 0,
      streak: 1,
      lastAnsweredAt: 1000,
      lastDurationMs: 1500,
    });
  });

  it("不正解を記録し、連続正解をリセットする", () => {
    let progress = recordAnswer(createEmptyProgress(), "q-1", true, 100, 1);
    progress = recordAnswer(progress, "q-1", true, 100, 2);
    progress = recordAnswer(progress, "q-1", false, 100, 3);

    expect(progress.questions["q-1"]).toMatchObject({ correct: 2, wrong: 1, streak: 0 });
  });

  it("元の進捗を変更しない", () => {
    const original = createEmptyProgress();
    recordAnswer(original, "q-1", true, 100, 1);
    expect(original.questions).toEqual({});
  });

  it("負の回答時間を 0 に丸める", () => {
    const progress = recordAnswer(createEmptyProgress(), "q-1", true, -500, 1);
    expect(progress.questions["q-1"]?.lastDurationMs).toBe(0);
  });
});

describe("recordRecentQuestions", () => {
  it("新しい順に記録する", () => {
    const progress = recordRecentQuestions(createEmptyProgress(), ["a", "b"]);
    expect(progress.recentQuestionIds).toEqual(["a", "b"]);
  });

  it("重複を除く", () => {
    let progress = recordRecentQuestions(createEmptyProgress(), ["a", "b"]);
    progress = recordRecentQuestions(progress, ["b", "c"]);
    expect(progress.recentQuestionIds).toEqual(["b", "c", "a"]);
  });

  it("上限を超えない", () => {
    const many = Array.from({ length: RECENT_HISTORY_LIMIT + 50 }, (_, i) => `q-${i}`);
    const progress = recordRecentQuestions(createEmptyProgress(), many);
    expect(progress.recentQuestionIds).toHaveLength(RECENT_HISTORY_LIMIT);
  });
});

describe("recordTimeAttack", () => {
  it("初回は自己ベストになる", () => {
    const { progress, isNewBest } = recordTimeAttack(
      createEmptyProgress(),
      { score: 500, correct: 4, maxStreak: 2 },
      1000,
    );
    expect(isNewBest).toBe(true);
    expect(progress.timeAttack).toEqual({
      bestScore: 500,
      bestCorrect: 4,
      bestStreak: 2,
      achievedAt: 1000,
    });
  });

  it("スコアが上回れば更新する", () => {
    const first = recordTimeAttack(
      createEmptyProgress(),
      { score: 500, correct: 4, maxStreak: 2 },
      1000,
    );
    const second = recordTimeAttack(first.progress, { score: 800, correct: 6, maxStreak: 4 }, 2000);
    expect(second.isNewBest).toBe(true);
    expect(second.progress.timeAttack?.bestScore).toBe(800);
  });

  it("スコアが同じ以下なら更新しない", () => {
    const first = recordTimeAttack(
      createEmptyProgress(),
      { score: 500, correct: 4, maxStreak: 2 },
      1000,
    );
    const second = recordTimeAttack(first.progress, { score: 500, correct: 5, maxStreak: 3 }, 2000);
    expect(second.isNewBest).toBe(false);
    expect(second.progress).toBe(first.progress);
  });
});

describe("getStrugglingQuestionIds / isStruggling", () => {
  it("誤答があり未克服の問題を返す", () => {
    let progress = recordAnswer(createEmptyProgress(), "q-1", false, 100, 1);
    progress = recordAnswer(progress, "q-2", true, 100, 2);

    expect(getStrugglingQuestionIds(progress)).toEqual(["q-1"]);
    expect(isStruggling(progress, "q-1")).toBe(true);
    expect(isStruggling(progress, "q-2")).toBe(false);
  });

  it("2 回連続正解で克服扱いになる", () => {
    let progress = recordAnswer(createEmptyProgress(), "q-1", false, 100, 1);
    progress = recordAnswer(progress, "q-1", true, 100, 2);
    expect(isStruggling(progress, "q-1")).toBe(true);

    progress = recordAnswer(progress, "q-1", true, 100, 3);
    expect(isStruggling(progress, "q-1")).toBe(false);
    expect(getStrugglingQuestionIds(progress)).toEqual([]);
  });

  it("誤答が多い順に並べる", () => {
    let progress = createEmptyProgress();
    progress = recordAnswer(progress, "few", false, 100, 1);
    progress = recordAnswer(progress, "many", false, 100, 2);
    progress = recordAnswer(progress, "many", false, 100, 3);

    expect(getStrugglingQuestionIds(progress)).toEqual(["many", "few"]);
  });

  it("記録がない問題は false", () => {
    expect(isStruggling(createEmptyProgress(), "unknown")).toBe(false);
  });
});

describe("aggregateTopicStats", () => {
  it("トピック別に集計し、苦手順に並べる", () => {
    let progress = createEmptyProgress();
    progress = recordAnswer(progress, "q-1", false, 100, 1);
    progress = recordAnswer(progress, "q-2", true, 100, 2);

    const topics = new Map<string, readonly string[]>([
      ["q-1", ["union"]],
      ["q-2", ["union", "literal"]],
    ]);

    const stats = aggregateTopicStats(progress, topics);
    const union = stats.find((item) => item.topic === "union");
    expect(union).toMatchObject({ correct: 1, wrong: 1, accuracy: 0.5 });

    const literal = stats.find((item) => item.topic === "literal");
    expect(literal).toMatchObject({ correct: 1, wrong: 0, accuracy: 1 });
  });

  it("トピックが分からない問題は無視する", () => {
    const progress = recordAnswer(createEmptyProgress(), "q-1", true, 100, 1);
    expect(aggregateTopicStats(progress, new Map())).toEqual([]);
  });

  it("回答がなければ空", () => {
    expect(aggregateTopicStats(createEmptyProgress(), new Map())).toEqual([]);
  });
});

describe("aggregateAnswerBreakdown", () => {
  it("モード・難易度別に集計する", () => {
    let progress = createEmptyProgress();
    progress = recordAnswer(progress, "q-1", true, 100, 1);
    progress = recordAnswer(progress, "q-2", false, 100, 2);

    const meta = new Map([
      ["q-1", { mode: "duel" as const, difficulty: "easy" as const }],
      ["q-2", { mode: "duel" as const, difficulty: "easy" as const }],
    ]);

    expect(aggregateAnswerBreakdown(progress, meta)).toEqual([
      { mode: "duel", difficulty: "easy", correct: 1, wrong: 1 },
    ]);
  });
});

describe("getQuestionRecord", () => {
  it("記録を取得できる", () => {
    const progress = recordAnswer(createEmptyProgress(), "q-1", true, 100, 1);
    expect(getQuestionRecord(progress, "q-1")?.correct).toBe(1);
    expect(getQuestionRecord(progress, "unknown")).toBeUndefined();
  });
});
