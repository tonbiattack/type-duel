/**
 * 問題データのスキーマ定義。
 *
 * 問題はデータファイル（`src/data/questions/*.ts`）にのみ記述し、
 * ロジック側はこの型に依存する。追加はデータ編集だけで完結させる。
 *
 * 3 つのモードで共通の土台（`QuestionBase`）を持ち、
 * モード固有の検証情報を判別可能な union で表現する。
 */

/** ゲームモード。 */
export type GameMode = "duel" | "infer" | "detective";

/** モードの一覧（表示順）。 */
export const GAME_MODES: readonly GameMode[] = ["duel", "infer", "detective"];

/** モードの表示名。 */
export const MODE_LABELS: Record<GameMode, string> = {
  duel: "Duel",
  infer: "Infer",
  detective: "Detective",
};

/** モードの一言説明（モード選択 UI 用）。 */
export const MODE_TAGLINES: Record<GameMode, string> = {
  duel: "型の代入可否を二択で判定",
  infer: "型推論の結果を四択で当てる",
  detective: "型エラーの原因を四択で見抜く",
};

/** モードの詳しい説明。 */
export const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  duel: "`const result: B = value;` が型検査を通るかを判定する。代入方向の理解が試される。",
  infer:
    "`const value = ...` から TypeScript が推論する型を当てる。リテラル・union・as const の挙動が鍵。",
  detective: "コンパイルエラーの原因を選ぶ。実務で出会う型エラーの読解力を鍛える。",
};

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

/** 選択肢。 */
export type Choice = {
  /** 問題内で一意な選択肢 ID。 */
  id: string;
  /** ボタンに表示するラベル。 */
  label: string;
};

/** 全モード共通の問題データ。 */
export type QuestionBase = {
  /** 永続的に一意な問題 ID。 */
  id: string;
  mode: GameMode;
  difficulty: Difficulty;
  /** トピックタグ（例: `["union", "literal"]`）。 */
  topic: string[];
  /** 問題文。 */
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

/**
 * Duel の問題。
 *
 * `code` は「`const result: B = value;` が型検査を通るか」を問う断片。
 * 期待結果は `tests/questions.test.ts` が TypeScript Compiler API で検証する。
 */
export type DuelQuestion = QuestionBase & {
  mode: "duel";
};

/**
 * Infer の問題。
 *
 * `code` 内の `const value = ...` から推論される型を四択で問う。
 * `expectedType` はコンパイラが返す型表記と一致することをテストで検証する。
 */
export type InferQuestion = QuestionBase & {
  mode: "infer";
  /** 推論される型の正規表記（`checker.typeToString` の出力）。 */
  expectedType: string;
};

/**
 * Detective の問題。
 *
 * `code` はコンパイルエラーになる断片。原因を四択で問う。
 * `expectedErrorCode` はコンパイラが返す診断コードと一致することをテストで検証する。
 */
export type DetectiveQuestion = QuestionBase & {
  mode: "detective";
  /** 期待する TypeScript の診断コード（例: 2322）。 */
  expectedErrorCode: number;
  /** 正解後に表示する修正例。 */
  fix?: string;
};

/** 1 問分のデータ（モード別の判別可能 union）。 */
export type Question = DuelQuestion | InferQuestion | DetectiveQuestion;

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

/** モードごとに必要な選択肢数。 */
export const CHOICE_COUNT_BY_MODE: Record<GameMode, number> = {
  duel: 2,
  infer: 4,
  detective: 4,
};
