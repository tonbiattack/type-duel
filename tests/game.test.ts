/**
 * ゲーム進行ロジックのテスト。
 *
 * 仕様書 §3・§5・§9 の受け入れ条件（二重回答防止・時間切れ・採点・重複なし）を
 * 純粋関数のレベルで検証する。
 */
import { describe, expect, it } from "vitest";
import {
  allQuestions,
  getQuestionsForDifficulty,
  getQuestionsForModeAndDifficulty,
} from "../src/data/questions";
import {
  answer,
  calculateScore,
  currentQuestion,
  formatAccuracy,
  isAnswered,
  isLastQuestion,
  next,
  pickRandom,
  startGame,
  summarize,
  tick,
  timeOut,
  togglePause,
  type GameState,
} from "../src/lib/game";
import { BASE_SCORE, QUESTIONS_PER_GAME, TIME_BONUS_PER_SEC } from "../src/lib/config";
import { DUEL_CHOICE_IDS } from "../src/types/question";

/** 常に 0 を返す乱数（抽選順を固定する）。 */
const zeroRandom = (): number => 0;

/** テスト用にゲームを開始する。 */
function startEasy(): GameState {
  return startGame({
    mode: "duel",
    difficulty: "easy",
    questions: getQuestionsForDifficulty("easy"),
    random: zeroRandom,
  });
}

/** 現在の問題の正解を選ぶ。 */
function answerCorrectly(state: GameState): GameState {
  return answer(state, currentQuestion(state).answer);
}

/** 現在の問題の不正解を選ぶ。 */
function answerIncorrectly(state: GameState): GameState {
  const question = currentQuestion(state);
  const wrong = question.choices.find((choice) => choice.id !== question.answer);
  if (wrong === undefined) {
    throw new Error("不正解の選択肢が見つかりません");
  }
  return answer(state, wrong.id);
}

describe("pickRandom", () => {
  it("指定件数を返す", () => {
    expect(pickRandom([1, 2, 3, 4, 5], 3, zeroRandom)).toHaveLength(3);
  });

  it("重複なく抽選する", () => {
    const picked = pickRandom(allQuestions, QUESTIONS_PER_GAME, zeroRandom);
    const ids = picked.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("要素数より多く要求しても全体を返す", () => {
    expect(pickRandom([1, 2], 10, zeroRandom)).toHaveLength(2);
  });

  it("元配列を変更しない", () => {
    const source = [1, 2, 3, 4, 5];
    const copy = [...source];
    pickRandom(source, 3, zeroRandom);
    expect(source).toEqual(copy);
  });

  it("0 件を要求すると空配列を返す", () => {
    expect(pickRandom([1, 2, 3], 0, zeroRandom)).toEqual([]);
  });
});

describe("startGame", () => {
  it("10 問を抽選し、重複がない", () => {
    const state = startEasy();
    expect(state.questions).toHaveLength(QUESTIONS_PER_GAME);
    const ids = state.questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(QUESTIONS_PER_GAME);
  });

  it("初期状態は回答待ちで、スコア 0", () => {
    const state = startEasy();
    expect(state.phase).toBe("answering");
    expect(state.index).toBe(0);
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.maxStreak).toBe(0);
    expect(state.results).toEqual([]);
    expect(state.selectedChoiceId).toBeNull();
    expect(state.paused).toBe(false);
  });

  it("最初の問題の制限時間が設定される", () => {
    const state = startEasy();
    expect(state.remainingMs).toBe(state.timeLimitMs);
    expect(state.timeLimitMs).toBeGreaterThan(0);
  });

  it("問題集が空なら例外を投げる", () => {
    expect(() => startGame({ mode: "duel", difficulty: "easy", questions: [] })).toThrow();
  });
});

describe("calculateScore", () => {
  it("残り秒数 × 5 + 100 点になる", () => {
    expect(calculateScore(15_000)).toBe(BASE_SCORE + 15 * TIME_BONUS_PER_SEC);
    expect(calculateScore(10_000)).toBe(BASE_SCORE + 10 * TIME_BONUS_PER_SEC);
  });

  it("端数は切り捨てる", () => {
    expect(calculateScore(9_999)).toBe(BASE_SCORE + 9 * TIME_BONUS_PER_SEC);
    expect(calculateScore(999)).toBe(BASE_SCORE);
  });

  it("残り 0 でも基本点は入る", () => {
    expect(calculateScore(0)).toBe(BASE_SCORE);
  });

  it("負の残り時間は 0 として扱う", () => {
    expect(calculateScore(-5_000)).toBe(BASE_SCORE);
  });
});

describe("answer", () => {
  it("正解すると得点と連続正解が増える", () => {
    const state = startEasy();
    const answered = answerCorrectly(state);

    expect(answered.phase).toBe("revealed");
    expect(answered.results).toHaveLength(1);
    expect(answered.results[0]?.correct).toBe(true);
    expect(answered.score).toBeGreaterThan(0);
    expect(answered.streak).toBe(1);
    expect(answered.maxStreak).toBe(1);
  });

  it("不正解だと得点 0 で連続正解がリセットされる", () => {
    const state = answerCorrectly(startEasy());
    const advanced = next(state);
    const wrong = answerIncorrectly(advanced);

    expect(wrong.results[1]?.correct).toBe(false);
    expect(wrong.results[1]?.score).toBe(0);
    expect(wrong.streak).toBe(0);
    expect(wrong.maxStreak).toBe(1);
  });

  it("二重回答しても採点は一度だけ", () => {
    const state = startEasy();
    const first = answerCorrectly(state);
    const second = answer(first, DUEL_CHOICE_IDS.notAssignable);

    expect(second).toBe(first);
    expect(second.results).toHaveLength(1);
  });

  it("回答後は選択した選択肢が記録される", () => {
    const state = startEasy();
    const question = currentQuestion(state);
    const answered = answer(state, question.answer);
    expect(answered.selectedChoiceId).toBe(question.answer);
  });

  it("時間切れ状態での回答は不正解になる", () => {
    const state = { ...startEasy(), remainingMs: 0 };
    const answered = answer(state, currentQuestion(state).answer);

    expect(answered.results[0]?.correct).toBe(false);
    expect(answered.results[0]?.timedOut).toBe(true);
    expect(answered.results[0]?.selectedChoiceId).toBeNull();
    expect(answered.score).toBe(0);
  });

  it("終了後は回答を受け付けない", () => {
    const finished: GameState = { ...startEasy(), phase: "finished" };
    expect(answer(finished, DUEL_CHOICE_IDS.assignable)).toBe(finished);
  });
});

describe("timeOut", () => {
  it("時間切れとして不正解になる", () => {
    const state = timeOut(startEasy());
    expect(state.results[0]?.timedOut).toBe(true);
    expect(state.results[0]?.correct).toBe(false);
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
  });

  it("二重に時間切れ処理しても採点は一度だけ", () => {
    const once = timeOut(startEasy());
    expect(timeOut(once)).toBe(once);
    expect(once.results).toHaveLength(1);
  });
});

describe("tick", () => {
  it("残り時間を減らす", () => {
    const state = startEasy();
    const ticked = tick(state, 1_000);
    expect(ticked.remainingMs).toBe(state.remainingMs - 1_000);
    expect(ticked.phase).toBe("answering");
  });

  it("0 になったら時間切れで採点する", () => {
    const state = startEasy();
    const ticked = tick(state, state.remainingMs + 100);
    expect(ticked.phase).toBe("revealed");
    expect(ticked.results[0]?.timedOut).toBe(true);
  });

  it("ポーズ中は進まない", () => {
    const paused = togglePause(startEasy());
    expect(tick(paused, 1_000)).toBe(paused);
  });

  it("回答後は進まない", () => {
    const answered = answerCorrectly(startEasy());
    expect(tick(answered, 1_000)).toBe(answered);
  });

  it("負の経過時間では進まない", () => {
    const state = startEasy();
    expect(tick(state, -100)).toBe(state);
  });
});

describe("next", () => {
  it("次の問題へ進み、タイマーがリセットされる", () => {
    const state = answerCorrectly(startEasy());
    const advanced = next(state);

    expect(advanced.index).toBe(1);
    expect(advanced.phase).toBe("answering");
    expect(advanced.selectedChoiceId).toBeNull();
    expect(advanced.remainingMs).toBe(advanced.timeLimitMs);
  });

  it("未回答では進まない", () => {
    const state = startEasy();
    expect(next(state)).toBe(state);
  });

  it("最後の問題の後は結果画面へ移る", () => {
    let state = startEasy();
    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      expect(isLastQuestion(state)).toBe(i === QUESTIONS_PER_GAME - 1);
      state = next(answerCorrectly(state));
    }
    expect(state.phase).toBe("finished");
  });

  it("10 問を完走すると結果が 10 件になる", () => {
    let state = startEasy();
    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      state = next(answerCorrectly(state));
    }
    expect(state.results).toHaveLength(QUESTIONS_PER_GAME);
    expect(state.phase).toBe("finished");
  });
});

describe("togglePause", () => {
  it("ポーズと再開を切り替える", () => {
    const state = startEasy();
    const paused = togglePause(state);
    expect(paused.paused).toBe(true);
    expect(togglePause(paused).paused).toBe(false);
  });

  it("終了後はポーズできない", () => {
    const finished: GameState = { ...startEasy(), phase: "finished" };
    expect(togglePause(finished)).toBe(finished);
  });
});

describe("summarize", () => {
  it("全問正解なら正答率 100%", () => {
    let state = startEasy();
    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      state = next(answerCorrectly(state));
    }
    const summary = summarize(state);

    expect(summary.total).toBe(QUESTIONS_PER_GAME);
    expect(summary.correctCount).toBe(QUESTIONS_PER_GAME);
    expect(summary.accuracy).toBe(1);
    expect(summary.maxStreak).toBe(QUESTIONS_PER_GAME);
    expect(summary.score).toBeGreaterThan(0);
  });

  it("全問不正解なら正答率 0%", () => {
    let state = startEasy();
    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      state = next(answerIncorrectly(state));
    }
    const summary = summarize(state);

    expect(summary.correctCount).toBe(0);
    expect(summary.accuracy).toBe(0);
    expect(summary.score).toBe(0);
    expect(summary.maxStreak).toBe(0);
  });

  it("未回答なら正答率 0", () => {
    expect(summarize(startEasy()).accuracy).toBe(0);
  });
});

describe("formatAccuracy", () => {
  it("小数を切り捨ててパーセント表記にする", () => {
    expect(formatAccuracy(1)).toBe("100%");
    expect(formatAccuracy(0.666)).toBe("66%");
    expect(formatAccuracy(0)).toBe("0%");
  });
});

describe("isAnswered", () => {
  it("回答待ちのときだけ false", () => {
    const state = startEasy();
    expect(isAnswered(state)).toBe(false);
    expect(isAnswered(answerCorrectly(state))).toBe(true);
    expect(isAnswered({ ...state, phase: "finished" })).toBe(true);
  });
});

describe("currentQuestion", () => {
  it("現在の問題を返す", () => {
    const state = startEasy();
    expect(currentQuestion(state)).toBe(state.questions[0]);
  });
});

describe("モード別のゲーム進行", () => {
  it("Infer モードで 10 問を完走できる", () => {
    let state = startGame({
      mode: "infer",
      difficulty: "easy",
      questions: getQuestionsForModeAndDifficulty("infer", "easy"),
      random: zeroRandom,
    });

    expect(state.mode).toBe("infer");
    expect(state.questions).toHaveLength(QUESTIONS_PER_GAME);

    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      state = next(answerCorrectly(state));
    }

    expect(state.phase).toBe("finished");
    expect(state.results).toHaveLength(QUESTIONS_PER_GAME);
    expect(summarize(state).correctCount).toBe(QUESTIONS_PER_GAME);
  });

  it("Detective モードで 10 問を完走できる", () => {
    let state = startGame({
      mode: "detective",
      difficulty: "easy",
      questions: getQuestionsForModeAndDifficulty("detective", "easy"),
      random: zeroRandom,
    });

    expect(state.mode).toBe("detective");

    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      state = next(answerCorrectly(state));
    }

    expect(state.phase).toBe("finished");
    expect(summarize(state).correctCount).toBe(QUESTIONS_PER_GAME);
  });

  it("4 択モードでも二重回答は採点されない", () => {
    const state = startGame({
      mode: "infer",
      difficulty: "easy",
      questions: getQuestionsForModeAndDifficulty("infer", "easy"),
      random: zeroRandom,
    });

    const first = answerCorrectly(state);
    const second = answer(first, "choice-1");
    expect(second).toBe(first);
    expect(second.results).toHaveLength(1);
  });

  it("モードが状態に保持される", () => {
    for (const mode of ["duel", "infer", "detective"] as const) {
      const state = startGame({
        mode,
        difficulty: "easy",
        questions: getQuestionsForModeAndDifficulty(mode, "easy"),
        random: zeroRandom,
      });
      expect(state.mode).toBe(mode);
      expect(state.questions.every((question) => question.mode === mode)).toBe(true);
    }
  });

  it("4 択モードの選択肢は 4 つ", () => {
    for (const mode of ["infer", "detective"] as const) {
      const state = startGame({
        mode,
        difficulty: "easy",
        questions: getQuestionsForModeAndDifficulty(mode, "easy"),
        random: zeroRandom,
      });
      expect(currentQuestion(state).choices).toHaveLength(4);
    }
  });
});
