/**
 * ローカル保存（localStorage）の読み書き。
 *
 * 保存するのは「学習の記録」だけ:
 * - 問題ごとの正誤履歴（復習の出題に使う）
 * - タイムアタックのベスト記録
 * - 直近出題した問題 ID（未出題優先の抽選に使う）
 *
 * 壊れたデータ・容量超過・localStorage 無効のいずれでも
 * **通常プレイを止めない**ことを最優先にする。読み込みは常に
 * 既定値へフォールバックし、書き込み失敗は握りつぶす。
 */
import { RECENT_HISTORY_LIMIT, STORAGE_KEY_PREFIX, STORAGE_SCHEMA_VERSION } from "./config";
import type { Difficulty, GameMode } from "../types/question";

/** 1 問分の学習記録。 */
export type QuestionRecord = {
  /** 正解した回数。 */
  correct: number;
  /** 不正解だった回数。 */
  wrong: number;
  /** 直近の連続正解数（誤答でリセット）。 */
  streak: number;
  /** 最後に回答した時刻（epoch ms）。 */
  lastAnsweredAt: number;
  /** 直近の回答にかかった時間（ミリ秒）。 */
  lastDurationMs: number;
};

/** タイムアタックのベスト記録。 */
export type TimeAttackRecord = {
  /** 最高スコア。 */
  bestScore: number;
  /** 最高正解数。 */
  bestCorrect: number;
  /** 最高連続正解数。 */
  bestStreak: number;
  /** 記録した時刻（epoch ms）。 */
  achievedAt: number;
};

/** 保存データ全体。 */
export type Progress = {
  version: number;
  /** 問題 ID → 学習記録。 */
  questions: Record<string, QuestionRecord>;
  /** タイムアタックのベスト記録（未プレイなら null）。 */
  timeAttack: TimeAttackRecord | null;
  /** 直近出題した問題 ID（新しい順）。 */
  recentQuestionIds: string[];
};

/** 保存キー。 */
export const STORAGE_KEYS = {
  progress: `${STORAGE_KEY_PREFIX}:progress`,
} as const;

/** 空の進捗データ。 */
export function createEmptyProgress(): Progress {
  return {
    version: STORAGE_SCHEMA_VERSION,
    questions: {},
    timeAttack: null,
    recentQuestionIds: [],
  };
}

/** localStorage が使えるか（プライベートモード等で例外になる環境がある）。 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || window.localStorage === undefined) {
      return false;
    }
    const probe = `${STORAGE_KEY_PREFIX}:probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** 値が有限の非負整数か。 */
function isNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** 1 件分の学習記録として妥当か。 */
function parseQuestionRecord(value: unknown): QuestionRecord | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    !isNonNegativeInt(record.correct) ||
    !isNonNegativeInt(record.wrong) ||
    !isNonNegativeInt(record.streak) ||
    !isNonNegativeInt(record.lastAnsweredAt) ||
    !isNonNegativeInt(record.lastDurationMs)
  ) {
    return null;
  }
  return {
    correct: record.correct,
    wrong: record.wrong,
    streak: record.streak,
    lastAnsweredAt: record.lastAnsweredAt,
    lastDurationMs: record.lastDurationMs,
  };
}

/** タイムアタック記録として妥当か。 */
function parseTimeAttackRecord(value: unknown): TimeAttackRecord | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    !isNonNegativeInt(record.bestScore) ||
    !isNonNegativeInt(record.bestCorrect) ||
    !isNonNegativeInt(record.bestStreak) ||
    !isNonNegativeInt(record.achievedAt)
  ) {
    return null;
  }
  return {
    bestScore: record.bestScore,
    bestCorrect: record.bestCorrect,
    bestStreak: record.bestStreak,
    achievedAt: record.achievedAt,
  };
}

/**
 * 保存データを検証して復元する。
 *
 * 壊れている項目は捨て、残った妥当な項目だけを使う。
 * 全体が壊れていれば空の進捗を返す。
 */
export function parseProgress(raw: string | null): Progress {
  if (raw === null || raw.trim().length === 0) {
    return createEmptyProgress();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return createEmptyProgress();
  }

  if (typeof parsed !== "object" || parsed === null) {
    return createEmptyProgress();
  }

  const data = parsed as Record<string, unknown>;
  const progress = createEmptyProgress();

  // スキーマバージョンが違う場合は読み捨てる（互換性より安全側に倒す）
  if (data.version !== STORAGE_SCHEMA_VERSION) {
    return progress;
  }

  if (typeof data.questions === "object" && data.questions !== null) {
    for (const [id, value] of Object.entries(data.questions as Record<string, unknown>)) {
      const record = parseQuestionRecord(value);
      if (record !== null) {
        progress.questions[id] = record;
      }
    }
  }

  progress.timeAttack = parseTimeAttackRecord(data.timeAttack);

  if (Array.isArray(data.recentQuestionIds)) {
    progress.recentQuestionIds = data.recentQuestionIds
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .slice(0, RECENT_HISTORY_LIMIT);
  }

  return progress;
}

/** 進捗を読み込む。失敗時は空の進捗を返す。 */
export function loadProgress(): Progress {
  try {
    if (typeof window === "undefined" || window.localStorage === undefined) {
      return createEmptyProgress();
    }
    return parseProgress(window.localStorage.getItem(STORAGE_KEYS.progress));
  } catch {
    return createEmptyProgress();
  }
}

/** 進捗を保存する。失敗しても例外を投げない。 */
export function saveProgress(progress: Progress): boolean {
  try {
    if (typeof window === "undefined" || window.localStorage === undefined) {
      return false;
    }
    window.localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
    return true;
  } catch {
    // 容量超過・プライベートモードなど。プレイは続行させる。
    return false;
  }
}

/** 進捗を消す。失敗しても例外を投げない。 */
export function clearProgress(): boolean {
  try {
    if (typeof window === "undefined" || window.localStorage === undefined) {
      return false;
    }
    window.localStorage.removeItem(STORAGE_KEYS.progress);
    return true;
  } catch {
    return false;
  }
}

/**
 * 1 問の回答を記録する（新しい進捗を返す。保存はしない）。
 *
 * 純粋関数にして、呼び出し側が保存タイミングを決められるようにする。
 */
export function recordAnswer(
  progress: Progress,
  questionId: string,
  correct: boolean,
  durationMs: number,
  now: number = Date.now(),
): Progress {
  const previous = progress.questions[questionId];
  const record: QuestionRecord = {
    correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
    wrong: (previous?.wrong ?? 0) + (correct ? 0 : 1),
    streak: correct ? (previous?.streak ?? 0) + 1 : 0,
    lastAnsweredAt: now,
    lastDurationMs: Math.max(0, Math.round(durationMs)),
  };

  return {
    ...progress,
    questions: { ...progress.questions, [questionId]: record },
  };
}

/** 直近出題した問題 ID を記録する（新しい順・上限あり）。 */
export function recordRecentQuestions(
  progress: Progress,
  questionIds: readonly string[],
): Progress {
  const merged = [...questionIds, ...progress.recentQuestionIds];
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const id of merged) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    deduped.push(id);
    if (deduped.length >= RECENT_HISTORY_LIMIT) {
      break;
    }
  }

  return { ...progress, recentQuestionIds: deduped };
}

/**
 * タイムアタックの記録を更新する。
 *
 * スコアが自己ベストを上回ったときだけ更新する。
 */
export function recordTimeAttack(
  progress: Progress,
  result: { score: number; correct: number; maxStreak: number },
  now: number = Date.now(),
): { progress: Progress; isNewBest: boolean } {
  const previous = progress.timeAttack;
  const isNewBest = previous === null || result.score > previous.bestScore;

  if (!isNewBest) {
    return { progress, isNewBest: false };
  }

  return {
    progress: {
      ...progress,
      timeAttack: {
        bestScore: result.score,
        bestCorrect: result.correct,
        bestStreak: result.maxStreak,
        achievedAt: now,
      },
    },
    isNewBest: true,
  };
}

/** 問題の学習記録を取得する（なければ undefined）。 */
export function getQuestionRecord(
  progress: Progress,
  questionId: string,
): QuestionRecord | undefined {
  return progress.questions[questionId];
}

/** 誤答があり、まだ克服していない問題か。 */
export function isStruggling(progress: Progress, questionId: string): boolean {
  const record = progress.questions[questionId];
  if (record === undefined) {
    return false;
  }
  return record.wrong > 0 && record.streak < 2;
}

/** 復習対象の問題 ID を、誤答の多い順に返す。 */
export function getStrugglingQuestionIds(progress: Progress): string[] {
  return Object.entries(progress.questions)
    .filter(([, record]) => record.wrong > 0 && record.streak < 2)
    .sort((a, b) => {
      // 誤答が多い順 → 直近に間違えた順
      const wrongDiff = b[1].wrong - a[1].wrong;
      if (wrongDiff !== 0) {
        return wrongDiff;
      }
      return b[1].lastAnsweredAt - a[1].lastAnsweredAt;
    })
    .map(([id]) => id);
}

/** トピック別の成績。 */
export type TopicStats = {
  topic: string;
  correct: number;
  wrong: number;
  /** 正答率（0〜1）。回答がなければ 0。 */
  accuracy: number;
};

/**
 * トピック別の成績を集計する。
 *
 * @param progress 学習記録
 * @param topicByQuestionId 問題 ID → トピックの対応
 */
export function aggregateTopicStats(
  progress: Progress,
  topicByQuestionId: ReadonlyMap<string, readonly string[]>,
): TopicStats[] {
  const totals = new Map<string, { correct: number; wrong: number }>();

  for (const [questionId, record] of Object.entries(progress.questions)) {
    const topics = topicByQuestionId.get(questionId);
    if (topics === undefined) {
      continue;
    }
    for (const topic of topics) {
      const current = totals.get(topic) ?? { correct: 0, wrong: 0 };
      current.correct += record.correct;
      current.wrong += record.wrong;
      totals.set(topic, current);
    }
  }

  return [...totals.entries()]
    .map(([topic, { correct, wrong }]) => {
      const total = correct + wrong;
      return {
        topic,
        correct,
        wrong,
        accuracy: total === 0 ? 0 : correct / total,
      };
    })
    .sort((a, b) => {
      // 苦手な順（正答率が低い順）→ 回答数が多い順
      const accuracyDiff = a.accuracy - b.accuracy;
      if (accuracyDiff !== 0) {
        return accuracyDiff;
      }
      return b.correct + b.wrong - (a.correct + a.wrong);
    });
}

/** モード・難易度別の回答数を集計する（開発時の分布確認用）。 */
export type AnswerBreakdown = {
  mode: GameMode;
  difficulty: Difficulty;
  correct: number;
  wrong: number;
};

/**
 * モード・難易度別の回答数を集計する。
 *
 * @param progress 学習記録
 * @param metaByQuestionId 問題 ID → モード・難易度の対応
 */
export function aggregateAnswerBreakdown(
  progress: Progress,
  metaByQuestionId: ReadonlyMap<string, { mode: GameMode; difficulty: Difficulty }>,
): AnswerBreakdown[] {
  const totals = new Map<string, AnswerBreakdown>();

  for (const [questionId, record] of Object.entries(progress.questions)) {
    const meta = metaByQuestionId.get(questionId);
    if (meta === undefined) {
      continue;
    }
    const key = `${meta.mode}:${meta.difficulty}`;
    const current = totals.get(key) ?? {
      mode: meta.mode,
      difficulty: meta.difficulty,
      correct: 0,
      wrong: 0,
    };
    current.correct += record.correct;
    current.wrong += record.wrong;
    totals.set(key, current);
  }

  return [...totals.values()];
}
