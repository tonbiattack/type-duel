/**
 * ゲーム進行の純粋ロジック。
 *
 * React に依存させず、状態遷移をすべて純粋関数として実装する。
 * これにより「二重回答」「時間切れ」「最終問題」などの境界を
 * `tests/game.test.ts` で直接検証できる。
 *
 * 3 つのプレイ形式を同じ状態機械で扱う:
 * - `standard`: 10 問。1 問ごとの制限時間あり。回答後は解説を読んで次へ
 * - `timeAttack`: 60 秒。回答後は短いフィードバックだけ出して自動で次へ
 * - `review`: 最大 10 問。制限時間なし。解説を読み直せる
 */
import type { Difficulty, GameFormat, GameMode, Question } from "../types/question";
import {
  BASE_SCORE,
  DEFAULT_TIME_LIMIT_SEC,
  QUESTIONS_PER_GAME,
  REVIEW_MAX_QUESTIONS,
  TIME_ATTACK_BASE_SCORE,
  TIME_ATTACK_DURATION_MS,
  TIME_ATTACK_MAX_CODE_CHARS,
  TIME_ATTACK_MAX_CODE_LINES,
  TIME_ATTACK_PENALTY,
  TIME_ATTACK_STREAK_BONUS,
  TIME_ATTACK_STREAK_CAP,
  TIME_BONUS_PER_SEC,
} from "./config";

/** ゲームの進行フェーズ。 */
export type GamePhase = "answering" | "revealed" | "feedback" | "finished";

/** 1 問分の結果。 */
export type QuestionResult = {
  questionId: string;
  /** 選んだ選択肢 ID。時間切れなら null。 */
  selectedChoiceId: string | null;
  correct: boolean;
  /** 時間切れで終わったか。 */
  timedOut: boolean;
  /** この問題で得た点。 */
  score: number;
  /** 回答時点の残り時間（ミリ秒）。 */
  remainingMs: number;
  /** 回答にかかった時間（ミリ秒）。 */
  durationMs: number;
};

/** ゲーム全体の状態。 */
export type GameState = {
  format: GameFormat;
  mode: GameMode;
  difficulty: Difficulty;
  /** 出題順に並んだ問題。 */
  questions: readonly Question[];
  /** 現在の問題インデックス。 */
  index: number;
  phase: GamePhase;
  /**
   * 残り時間（ミリ秒）。
   *
   * `standard` / `review` では現在の問題の残り時間、
   * `timeAttack` ではプレイ全体の残り時間。
   */
  remainingMs: number;
  /** 制限時間の初期値（ミリ秒）。 */
  timeLimitMs: number;
  /** 制限時間を使うか（`review` では false）。 */
  timeLimitEnabled: boolean;
  /** これまでの結果（出題順）。 */
  results: readonly QuestionResult[];
  /** 現在の問題で選んだ選択肢（未回答なら null）。 */
  selectedChoiceId: string | null;
  /** 累計スコア。 */
  score: number;
  /** 現在の連続正解数。 */
  streak: number;
  /** これまでの最大連続正解数。 */
  maxStreak: number;
  /** ポーズ中か。 */
  paused: boolean;
};

/** ゲーム開始に必要な入力。 */
export type StartGameInput = {
  mode: GameMode;
  difficulty: Difficulty;
  questions: readonly Question[];
  /** 抽選に使う乱数（テストで固定するため注入可能）。 */
  random?: () => number;
};

/** タイムアタック開始に必要な入力。 */
export type StartTimeAttackInput = {
  questions: readonly Question[];
  random?: () => number;
};

/** 復習開始に必要な入力。 */
export type StartReviewInput = {
  mode: GameMode;
  difficulty: Difficulty;
  questions: readonly Question[];
  random?: () => number;
};

/** 問題の制限時間（ミリ秒）を返す。 */
export function getTimeLimitMs(question: Question): number {
  return (question.timeLimitSec ?? DEFAULT_TIME_LIMIT_SEC) * 1000;
}

/**
 * タイムアタックで出題してよい問題か。
 *
 * タイムアタックは「一瞬で判断する」テンポが命なので、以下を除外する。
 * - Advanced: 複数の型機能を追う必要があり、読解に時間がかかる
 * - コードが長い問題: 読むだけで時間を食う
 *
 * 明示指定（`timeAttackEligible`）があればそれを優先する。
 */
export function isTimeAttackEligible(question: Question): boolean {
  if (question.timeAttackEligible !== undefined) {
    return question.timeAttackEligible;
  }
  if (question.difficulty === "advanced") {
    return false;
  }
  const lines = question.code.split("\n").length;
  return lines <= TIME_ATTACK_MAX_CODE_LINES && question.code.length <= TIME_ATTACK_MAX_CODE_CHARS;
}

/** タイムアタック用の問題を抽選する。 */
export function pickTimeAttackQuestions(
  questions: readonly Question[],
  random: () => number = Math.random,
): Question[] {
  const eligible = questions.filter(isTimeAttackEligible);
  const pool = eligible.length > 0 ? eligible : questions;
  // 60 秒で解ける見込みより十分多い数を用意し、同一プレイ内の重複を避ける
  return pickRandom(pool, Math.min(pool.length, 60), random);
}

/**
 * 配列から重複なく `count` 件を抽選する（Fisher–Yates）。
 *
 * 元配列は変更しない。`count` が要素数より大きい場合は全体を返す。
 */
export function pickRandom<T>(
  items: readonly T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  const pool = [...items];
  const take = Math.min(Math.max(count, 0), pool.length);

  for (let i = 0; i < take; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    const a = pool[i];
    const b = pool[j];
    if (a !== undefined && b !== undefined) {
      pool[i] = b;
      pool[j] = a;
    }
  }

  return pool.slice(0, take);
}

/**
 * 直近出題した問題を避けて抽選する。
 *
 * 未出題の問題を優先し、足りなければ出題済みから補充する。
 * 問題数が十分あるときは、同じ問題が続けて出にくくなる。
 */
export function pickWithHistory<T extends { id: string }>(
  items: readonly T[],
  count: number,
  recentIds: readonly string[],
  random: () => number = Math.random,
): T[] {
  const recent = new Set(recentIds);
  const fresh = items.filter((item) => !recent.has(item.id));
  const used = items.filter((item) => recent.has(item.id));

  const pickedFresh = pickRandom(fresh, count, random);
  if (pickedFresh.length >= count) {
    return pickedFresh;
  }

  const remaining = count - pickedFresh.length;
  return [...pickedFresh, ...pickRandom(used, remaining, random)];
}

/** 標準モード（10 問）を開始する。 */
export function startGame(input: StartGameInput): GameState {
  const random = input.random ?? Math.random;
  const questions = pickRandom(input.questions, QUESTIONS_PER_GAME, random);
  const first = questions[0];

  if (first === undefined) {
    throw new Error("問題集が空です。ゲームを開始できません。");
  }

  return {
    format: "standard",
    mode: input.mode,
    difficulty: input.difficulty,
    questions,
    index: 0,
    phase: "answering",
    remainingMs: getTimeLimitMs(first),
    timeLimitMs: getTimeLimitMs(first),
    timeLimitEnabled: true,
    results: [],
    selectedChoiceId: null,
    score: 0,
    streak: 0,
    maxStreak: 0,
    paused: false,
  };
}

/** タイムアタック（60 秒）を開始する。 */
export function startTimeAttack(input: StartTimeAttackInput): GameState {
  const random = input.random ?? Math.random;
  const questions = pickTimeAttackQuestions(input.questions, random);
  const first = questions[0];

  if (first === undefined) {
    throw new Error("タイムアタックに出題できる問題がありません。");
  }

  return {
    format: "timeAttack",
    mode: first.mode,
    difficulty: first.difficulty,
    questions,
    index: 0,
    phase: "answering",
    remainingMs: TIME_ATTACK_DURATION_MS,
    timeLimitMs: TIME_ATTACK_DURATION_MS,
    timeLimitEnabled: true,
    results: [],
    selectedChoiceId: null,
    score: 0,
    streak: 0,
    maxStreak: 0,
    paused: false,
  };
}

/** 復習を開始する（制限時間なし）。 */
export function startReview(input: StartReviewInput): GameState {
  const random = input.random ?? Math.random;
  const questions = pickRandom(input.questions, REVIEW_MAX_QUESTIONS, random);
  const first = questions[0];

  if (first === undefined) {
    throw new Error("復習する問題がありません。");
  }

  return {
    format: "review",
    mode: input.mode,
    difficulty: input.difficulty,
    questions,
    index: 0,
    phase: "answering",
    remainingMs: 0,
    timeLimitMs: 0,
    timeLimitEnabled: false,
    results: [],
    selectedChoiceId: null,
    score: 0,
    streak: 0,
    maxStreak: 0,
    paused: false,
  };
}

/** 現在の問題を返す（終了後は最後の問題）。 */
export function currentQuestion(state: GameState): Question {
  const question = state.questions[state.index] ?? state.questions[state.questions.length - 1];
  if (question === undefined) {
    throw new Error("問題が存在しません。");
  }
  return question;
}

/** 現在の問題が最後かどうか。 */
export function isLastQuestion(state: GameState): boolean {
  return state.index >= state.questions.length - 1;
}

/** 回答済み（採点済み）かどうか。 */
export function isAnswered(state: GameState): boolean {
  return state.phase !== "answering";
}

/**
 * 標準モードの得点を計算する。
 *
 * 仕様書 §5: 100 点 + 残り秒数 × 5 点（端数切り捨て）。
 */
export function calculateScore(remainingMs: number): number {
  const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
  return BASE_SCORE + remainingSec * TIME_BONUS_PER_SEC;
}

/**
 * タイムアタックの得点を計算する。
 *
 * 正解: 基本点 + 連続正解ボーナス（上限あり）
 * 不正解: ペナルティ（0 未満にはしない）
 */
export function calculateTimeAttackScore(correct: boolean, streakBefore: number): number {
  if (!correct) {
    return -TIME_ATTACK_PENALTY;
  }
  const bonus = Math.min(streakBefore, TIME_ATTACK_STREAK_CAP) * TIME_ATTACK_STREAK_BONUS;
  return TIME_ATTACK_BASE_SCORE + bonus;
}

/**
 * 回答を確定する。
 *
 * すでに採点済み、または終了済みなら状態を変えずに返す（二重回答防止）。
 * 時間切れ（`remainingMs <= 0`）の場合は選択を無視して不正解にする。
 *
 * タイムアタックでは採点後に `feedback` フェーズへ移り、
 * 呼び出し側が `next` を呼ぶと次の問題へ進む。
 */
export function answer(state: GameState, choiceId: string | null): GameState {
  if (state.phase !== "answering") {
    return state;
  }

  const question = currentQuestion(state);
  const timedOut = state.timeLimitEnabled && state.remainingMs <= 0;
  const correct = !timedOut && choiceId !== null && choiceId === question.answer;
  const nextStreak = correct ? state.streak + 1 : 0;

  const gained =
    state.format === "timeAttack"
      ? calculateTimeAttackScore(correct, state.streak)
      : correct
        ? calculateScore(state.remainingMs)
        : 0;

  const durationMs =
    state.format === "timeAttack"
      ? TIME_ATTACK_DURATION_MS - state.remainingMs
      : state.timeLimitEnabled
        ? state.timeLimitMs - state.remainingMs
        : 0;

  const result: QuestionResult = {
    questionId: question.id,
    selectedChoiceId: timedOut ? null : choiceId,
    correct,
    timedOut,
    score: gained,
    remainingMs: Math.max(0, state.remainingMs),
    durationMs: Math.max(0, durationMs),
  };

  return {
    ...state,
    phase: state.format === "timeAttack" ? "feedback" : "revealed",
    selectedChoiceId: timedOut ? null : choiceId,
    results: [...state.results, result],
    score: Math.max(0, state.score + gained),
    streak: nextStreak,
    maxStreak: Math.max(state.maxStreak, nextStreak),
    paused: false,
  };
}

/**
 * 時間切れとして採点する。
 *
 * すでに採点済みなら状態を変えない。
 */
export function timeOut(state: GameState): GameState {
  if (state.phase !== "answering") {
    return state;
  }
  return answer({ ...state, remainingMs: 0 }, null);
}

/**
 * タイマーを進める。
 *
 * - `standard`: 回答待ちのときだけ減らし、0 で時間切れ採点
 * - `timeAttack`: 回答待ち・フィードバック中も減らし、0 で終了
 * - `review`: 制限時間なしなので何もしない
 *
 * ポーズ中は進めない。
 */
export function tick(state: GameState, deltaMs: number): GameState {
  if (state.paused || deltaMs <= 0 || !state.timeLimitEnabled) {
    return state;
  }

  if (state.phase === "finished") {
    return state;
  }

  // 標準モードは回答待ち以外では止める
  if (state.format !== "timeAttack" && state.phase !== "answering") {
    return state;
  }

  const remainingMs = state.remainingMs - deltaMs;

  if (remainingMs <= 0) {
    if (state.format === "timeAttack") {
      // タイムアタックは時間切れで即終了（未回答の問題は採点しない）
      return { ...state, remainingMs: 0, phase: "finished", paused: false };
    }
    return timeOut({ ...state, remainingMs: 0 });
  }

  return { ...state, remainingMs };
}

/**
 * 次の問題へ進む。最後の問題なら結果画面へ移る。
 *
 * 未回答のまま呼ばれた場合は何もしない（誤操作防止）。
 * タイムアタックでは `feedback` フェーズから呼ぶ。
 */
export function next(state: GameState): GameState {
  if (state.phase !== "revealed" && state.phase !== "feedback") {
    return state;
  }

  // タイムアタックは時間切れまで続ける
  if (state.format === "timeAttack") {
    if (state.remainingMs <= 0) {
      return { ...state, phase: "finished", paused: false };
    }
    const nextIndex = state.index + 1;
    const question = state.questions[nextIndex];
    if (question === undefined) {
      return { ...state, phase: "finished", paused: false };
    }
    return {
      ...state,
      index: nextIndex,
      phase: "answering",
      selectedChoiceId: null,
      paused: false,
    };
  }

  if (isLastQuestion(state)) {
    return { ...state, phase: "finished", paused: false };
  }

  const nextIndex = state.index + 1;
  const question = state.questions[nextIndex];
  if (question === undefined) {
    return { ...state, phase: "finished", paused: false };
  }

  return {
    ...state,
    index: nextIndex,
    phase: "answering",
    remainingMs: getTimeLimitMs(question),
    timeLimitMs: getTimeLimitMs(question),
    selectedChoiceId: null,
    paused: false,
  };
}

/** ポーズを切り替える。ゲーム中（回答待ち・解説表示）のみ有効。 */
export function togglePause(state: GameState): GameState {
  if (state.phase === "finished") {
    return state;
  }
  return { ...state, paused: !state.paused };
}

/** 集計結果。 */
export type GameSummary = {
  total: number;
  correctCount: number;
  /** 正答率（0〜1）。問題数 0 のときは 0。 */
  accuracy: number;
  score: number;
  maxStreak: number;
};

/** 結果画面用の集計を返す。 */
export function summarize(state: GameState): GameSummary {
  const total = state.results.length;
  const correctCount = state.results.filter((result) => result.correct).length;

  return {
    total,
    correctCount,
    accuracy: total === 0 ? 0 : correctCount / total,
    score: state.score,
    maxStreak: state.maxStreak,
  };
}

/** 正答率をパーセント表記にする（小数切り捨て）。 */
export function formatAccuracy(accuracy: number): string {
  return `${Math.floor(accuracy * 100)}%`;
}

/** 平均回答時間（ミリ秒）。回答がなければ 0。 */
export function averageAnswerMs(state: GameState): number {
  if (state.results.length === 0) {
    return 0;
  }
  const total = state.results.reduce((sum, result) => sum + result.durationMs, 0);
  return Math.round(total / state.results.length);
}

/** 間違えた問題の ID を返す（復習の導線に使う）。 */
export function missedQuestionIds(state: GameState): string[] {
  return state.results.filter((result) => !result.correct).map((result) => result.questionId);
}
