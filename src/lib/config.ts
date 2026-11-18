/**
 * ゲームの設定値。
 *
 * 仕様書 §3・§5 の数値をここに集約し、調整を 1 か所で済ませる。
 */

/** 1 プレイの問題数。 */
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
