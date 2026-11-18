/**
 * 問題データのスキーマ定義。
 *
 * 問題はデータファイル（`src/data/questions/*.ts`）にのみ記述し、
 * ロジック側はこの型に依存する。追加はデータ編集だけで完結させる。
 */

/** ゲームモード。MVP では `duel` のみ実装する。 */
export type GameMode = "duel" | "infer" | "detective";

/** 難易度。 */
export type Difficulty = "easy" | "normal" | "hard";

/** 難易度の一覧（表示順）。 */
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "normal", "hard"];

/** 難易度の表示名。 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};

/** 難易度の補足説明（タイトル画面用）。 */
export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: "literal / primitive / union / array",
  normal: "object / optional / readonly / unknown / never / tuple",
  hard: "generic / conditional / indexed access / keyof / mapped types",
};

/** 選択肢。Duel では「代入できる / できない」の 2 択を想定する。 */
export type Choice = {
  /** 問題内で一意な選択肢 ID。 */
  id: string;
  /** ボタンに表示するラベル。 */
  label: string;
};

/**
 * 1 問分のデータ。
 *
 * `code` は「`const result: B = value;` が型検査を通るか」を問う
 * TypeScript 断片で、`answer` はその期待結果に対応する選択肢 ID。
 * 期待結果は `tests/questions.test.ts` が TypeScript Compiler API で検証する。
 */
export type Question = {
  /** 永続的に一意な問題 ID。 */
  id: string;
  mode: GameMode;
  difficulty: Difficulty;
  /** トピックタグ（例: `["union", "literal"]`）。 */
  topic: string[];
  /** 問題文。代入方向を明示する。 */
  prompt: string;
  /** 判定対象の TypeScript コード。 */
  code: string;
  choices: Choice[];
  /** 正解の選択肢 ID。 */
  answer: string;
  /** 正誤確定後に表示する解説。 */
  explanation: string;
  /** 個別の制限時間（秒）。未指定なら既定値を使う。 */
  timeLimitSec?: number;
};

/** Duel の選択肢 ID。 */
export const DUEL_CHOICE_IDS = {
  assignable: "assignable",
  notAssignable: "notAssignable",
} as const;

/** Duel の標準選択肢。 */
export const DUEL_CHOICES: readonly Choice[] = [
  { id: DUEL_CHOICE_IDS.assignable, label: "代入できる" },
  { id: DUEL_CHOICE_IDS.notAssignable, label: "代入できない" },
];

/** Duel の正答を表す値。 */
export type DuelAnswer = (typeof DUEL_CHOICE_IDS)[keyof typeof DUEL_CHOICE_IDS];
