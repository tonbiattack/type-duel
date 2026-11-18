import { TIMER_WARNING_RATIO } from "../lib/config";

type TimerProps = {
  remainingMs: number;
  timeLimitMs: number;
  paused: boolean;
};

/**
 * 残り時間の表示。
 *
 * 数値（秒）とバーの両方で示し、色だけに依存しない。
 * 残量が少なくなると `is-warning` を付けて強調する。
 */
export function Timer({ remainingMs, timeLimitMs, paused }: TimerProps): React.JSX.Element {
  const ratio = timeLimitMs <= 0 ? 0 : Math.max(0, Math.min(1, remainingMs / timeLimitMs));
  const seconds = Math.max(0, remainingMs / 1000);
  const isWarning = ratio <= TIMER_WARNING_RATIO;

  return (
    <div className={`timer${isWarning ? " is-warning" : ""}${paused ? " is-paused" : ""}`}>
      <div className="timer-head">
        <span className="timer-label">残り時間</span>
        <span className="timer-value" aria-live="off">
          {seconds.toFixed(1)}
          <span className="timer-unit">秒</span>
        </span>
      </div>
      <div
        className="timer-bar"
        role="progressbar"
        aria-label="残り時間"
        aria-valuemin={0}
        aria-valuemax={Math.round(timeLimitMs / 1000)}
        aria-valuenow={Math.ceil(seconds)}
        aria-valuetext={`${seconds.toFixed(1)} 秒`}
      >
        <div className="timer-bar-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
