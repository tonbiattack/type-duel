/**
 * ゲームの設定値。
 *
 * 仕様書 §3・§5 の数値をここに集約し、調整を 1 か所で済ませる。
 * 数値はここだけを変えれば全体に反映される。
 */

/** 1 プレイの問題数（standard / review）。 */
export const QUESTIONS_PER_GAME = 10;

/** 既定の制限時間（秒）。問題データの `timeLimitSec` で上書きできる。 */
export const DEFAULT_TIME_LIMIT_SEC = 15;

/** 正解時の基本点。 */
export const BASE_SCORE = 100;

/** 正解時に残り秒数へ掛ける係数。 */
export const TIME_BONUS_PER_SEC = 5;

/** タイマーの更新間隔（ミリ秒）。 */
export const TIMER_TICK_MS = 100;

/** タイマー残量がこの割合を下回ったら警告表示にする。 */
export const TIMER_WARNING_RATIO = 0.3;

/** 回答後に「次へ」を押せるようになるまでの待ち時間（ミリ秒）。0 なら即時。 */
export const AUTO_ADVANCE_DELAY_MS = 0;

/* --------------------------------------------------------------------------
   タイムアタック
   -------------------------------------------------------------------------- */

/** タイムアタックの制限時間（ミリ秒）。 */
export const TIME_ATTACK_DURATION_MS = 60_000;

/** タイムアタックで正解したときの基本点。 */
export const TIME_ATTACK_BASE_SCORE = 100;

/** タイムアタックで連続正解 1 つあたりに加算する点。 */
export const TIME_ATTACK_STREAK_BONUS = 20;

/** タイムアタックで連続正解ボーナスが上限に達する回数。 */
export const TIME_ATTACK_STREAK_CAP = 5;

/** タイムアタックで不正解のときに引く点（0 未満にはしない）。 */
export const TIME_ATTACK_PENALTY = 50;

/** タイムアタックで回答後に次の問題へ切り替わるまでの表示時間（ミリ秒）。 */
export const TIME_ATTACK_FEEDBACK_MS = 450;

/**
 * タイムアタックで出題する問題の最大コード行数。
 *
 * 読むのに時間がかかる問題はテンポを壊すため除外する。
 */
export const TIME_ATTACK_MAX_CODE_LINES = 8;

/** タイムアタックで出題する問題の最大コード文字数。 */
export const TIME_ATTACK_MAX_CODE_CHARS = 220;

/* --------------------------------------------------------------------------
   復習
   -------------------------------------------------------------------------- */

/** 復習で 1 回に出す問題数の上限。 */
export const REVIEW_MAX_QUESTIONS = 10;

/** 復習で「苦手」とみなす誤答回数。 */
export const REVIEW_STRUGGLE_THRESHOLD = 1;

/** 直近この回数だけ正解していれば「克服済み」として復習から外す。 */
export const REVIEW_MASTERED_STREAK = 2;

/** 出題履歴として保持する問題 ID の数（未出題優先の抽選に使う）。 */
export const RECENT_HISTORY_LIMIT = 120;

/* --------------------------------------------------------------------------
   保存
   -------------------------------------------------------------------------- */

/** localStorage のキー接頭辞。 */
export const STORAGE_KEY_PREFIX = "type-duel:v1";

/** 保存データのスキーマバージョン。互換性が壊れたら上げる。 */
export const STORAGE_SCHEMA_VERSION = 1;
