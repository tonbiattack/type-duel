/**
 * ゲーム進行の純粋ロジック。
 *
 * React に依存させず、状態遷移をすべて純粋関数として実装する。
 * これにより「二重回答」「時間切れ」「最終問題」などの境界を
 * `tests/game.test.ts` で直接検証できる。
 */
import type { Difficulty, GameMode, Question } from "../types/question";
import {
  BASE_SCORE,
  DEFAULT_TIME_LIMIT_SEC,
  QUESTIONS_PER_GAME,
  TIME_BONUS_PER_SEC,
} from "./config";

/** ゲームの進行フェーズ。 */
export type GamePhase = "answering" | "revealed" | "finished";

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
};

/** ゲーム全体の状態。 */
export type GameState = {
  mode: GameMode;
  difficulty: Difficulty;
  /** 出題順に並んだ問題。 */
  questions: readonly Question[];
  /** 現在の問題インデックス。 */
  index: number;
  phase: GamePhase;
  /** 現在の問題の残り時間（ミリ秒）。 */
  remainingMs: number;
  /** 現在の問題の制限時間（ミリ秒）。 */
  timeLimitMs: number;
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

/** 問題の制限時間（ミリ秒）を返す。 */
export function getTimeLimitMs(question: Question): number {
  return (question.timeLimitSec ?? DEFAULT_TIME_LIMIT_SEC) * 1000;
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
 * ゲームを開始する。
 *
 * 同一プレイ内で問題が重複しないよう、抽選は `pickRandom` に任せる。
 */
export function startGame(input: StartGameInput): GameState {
  const random = input.random ?? Math.random;
  const questions = pickRandom(input.questions, QUESTIONS_PER_GAME, random);
  const first = questions[0];

  if (first === undefined) {
    throw new Error("問題集が空です。ゲームを開始できません。");
  }

  return {
    mode: input.mode,
    difficulty: input.difficulty,
    questions,
    index: 0,
    phase: "answering",
    remainingMs: getTimeLimitMs(first),
    timeLimitMs: getTimeLimitMs(first),
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
 * 正解時の得点を計算する。
 *
 * 仕様書 §5: 100 点 + 残り秒数 × 5 点（端数切り捨て）。
 */
export function calculateScore(remainingMs: number): number {
  const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
  return BASE_SCORE + remainingSec * TIME_BONUS_PER_SEC;
}

/**
 * 回答を確定する。
 *
 * すでに採点済み、または終了済みなら状態を変えずに返す（二重回答防止）。
 * 時間切れ（`remainingMs <= 0`）の場合は選択を無視して不正解にする。
 */
export function answer(state: GameState, choiceId: string | null): GameState {
  if (state.phase !== "answering") {
    return state;
  }

  const question = currentQuestion(state);
  const timedOut = state.remainingMs <= 0;
  const correct = !timedOut && choiceId !== null && choiceId === question.answer;
  const gained = correct ? calculateScore(state.remainingMs) : 0;
  const nextStreak = correct ? state.streak + 1 : 0;

  const result: QuestionResult = {
    questionId: question.id,
    selectedChoiceId: timedOut ? null : choiceId,
    correct,
    timedOut,
    score: gained,
    remainingMs: Math.max(0, state.remainingMs),
  };

  return {
    ...state,
    phase: "revealed",
    selectedChoiceId: timedOut ? null : choiceId,
    results: [...state.results, result],
    score: state.score + gained,
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
 * 回答待ちのときだけ残り時間を減らし、0 になったら時間切れとして採点する。
 * ポーズ中は進めない。
 */
export function tick(state: GameState, deltaMs: number): GameState {
  if (state.phase !== "answering" || state.paused || deltaMs <= 0) {
    return state;
  }

  const remainingMs = state.remainingMs - deltaMs;
  if (remainingMs <= 0) {
    return timeOut({ ...state, remainingMs: 0 });
  }

  return { ...state, remainingMs };
}

/**
 * 次の問題へ進む。最後の問題なら結果画面へ移る。
 *
 * 未回答のまま呼ばれた場合は何もしない（誤操作防止）。
 */
export function next(state: GameState): GameState {
  if (state.phase !== "revealed") {
    return state;
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
