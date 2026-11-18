import { DIFFICULTY_LABELS, MODE_LABELS } from "../types/question";
import { averageAnswerMs, formatAccuracy, summarize, type GameState } from "../lib/game";
import type { TimeAttackRecord } from "../lib/storage";
import { RichText } from "./RichText";

type ResultScreenProps = {
  state: GameState;
  onRetry: () => void;
  onBackToTitle: () => void;
  /** タイムアタックのベスト記録（未プレイなら null）。 */
  bestRecord?: TimeAttackRecord | null;
  /** 今回のプレイで自己ベストを更新したか。 */
  isNewBest?: boolean;
  /** 間違えた問題を復習する。 */
  onReviewMissed?: () => void;
  /** 復習できる問題があるか。 */
  canReviewMissed?: boolean;
};

/**
 * 結果画面。
 *
 * 正答数・正答率・スコア・最大連続正解を表示し、再挑戦できる。
 * タイムアタックではベスト記録との比較も示す。
 * 間違えた問題があれば、そのまま復習へ進める。
 */
export function ResultScreen({
  state,
  onRetry,
  onBackToTitle,
  bestRecord = null,
  isNewBest = false,
  onReviewMissed,
  canReviewMissed = false,
}: ResultScreenProps): React.JSX.Element {
  const summary = summarize(state);
  const isTimeAttack = state.format === "timeAttack";
  const isReview = state.format === "review";
  const averageMs = averageAnswerMs(state);

  return (
    <div className="screen screen-result">
      <header className="result-head">
        <p className="result-difficulty">
          {isTimeAttack ? (
            <span className="result-mode result-mode-timeattack">タイムアタック</span>
          ) : isReview ? (
            <>
              <span className="result-mode result-mode-review">復習</span>
              <span className="result-difficulty-sep">/</span>
              <span className={`result-mode result-mode-${state.mode}`}>
                {MODE_LABELS[state.mode]}
              </span>
            </>
          ) : (
            <>
              <span className={`result-mode result-mode-${state.mode}`}>
                {MODE_LABELS[state.mode]}
              </span>
              <span className="result-difficulty-sep">/</span>
              {DIFFICULTY_LABELS[state.difficulty]}
            </>
          )}
        </p>
        <h1 className="result-title">結果</h1>
        {isNewBest ? <p className="result-newbest">自己ベスト更新！</p> : null}
      </header>

      <dl className="result-stats">
        <div className="stat stat-score">
          <dt>スコア</dt>
          <dd>{summary.score}</dd>
        </div>
        <div className="stat">
          <dt>{isTimeAttack ? "正解数" : "正答数"}</dt>
          <dd>
            {summary.correctCount}
            <span className="stat-unit"> / {summary.total}</span>
          </dd>
        </div>
        <div className="stat">
          <dt>正答率</dt>
          <dd>{formatAccuracy(summary.accuracy)}</dd>
        </div>
        <div className="stat">
          <dt>最大連続正解</dt>
          <dd>
            {summary.maxStreak}
            <span className="stat-unit"> 連続</span>
          </dd>
        </div>
        {isTimeAttack ? (
          <div className="stat">
            <dt>平均回答時間</dt>
            <dd>
              {(averageMs / 1000).toFixed(1)}
              <span className="stat-unit"> 秒</span>
            </dd>
          </div>
        ) : null}
      </dl>

      {isTimeAttack && bestRecord !== null ? (
        <section className="result-best" aria-labelledby="best-heading">
          <h2 id="best-heading" className="section-heading">
            自己ベスト
          </h2>
          <dl className="best-stats">
            <div>
              <dt>スコア</dt>
              <dd>{bestRecord.bestScore}</dd>
            </div>
            <div>
              <dt>正解数</dt>
              <dd>{bestRecord.bestCorrect}</dd>
            </div>
            <div>
              <dt>最大連続</dt>
              <dd>{bestRecord.bestStreak}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="result-review" aria-labelledby="review-heading">
        <h2 id="review-heading" className="section-heading">
          問題ごとの結果
        </h2>
        <ol className="review-list">
          {state.results.map((result, index) => {
            const question = state.questions[index];
            const verdict = result.correct ? "正解" : result.timedOut ? "時間切れ" : "不正解";
            return (
              <li
                key={`${result.questionId}-${index}`}
                className={`review-item ${result.correct ? "is-correct" : "is-wrong"}`}
              >
                <span className="review-index">{index + 1}</span>
                <span className="review-verdict">{verdict}</span>
                <span className="review-topic">{question?.topic.join(" / ") ?? ""}</span>
                <span className="review-score">{result.score} 点</span>
              </li>
            );
          })}
        </ol>
      </section>

      {isTimeAttack ? (
        <section className="result-explanations" aria-labelledby="explanations-heading">
          <h2 id="explanations-heading" className="section-heading">
            解説をまとめて確認
          </h2>
          <ul className="explanation-list">
            {state.results.map((result, index) => {
              const question = state.questions[index];
              if (question === undefined) {
                return null;
              }
              return (
                <li
                  key={`${result.questionId}-exp-${index}`}
                  className={`explanation-item ${result.correct ? "is-correct" : "is-wrong"}`}
                >
                  <div className="explanation-item-head">
                    <span className="review-index">{index + 1}</span>
                    <span className="review-verdict">
                      {result.correct ? "正解" : result.timedOut ? "時間切れ" : "不正解"}
                    </span>
                    <span className="review-topic">{question.topic.join(" / ")}</span>
                  </div>
                  <p className="explanation-item-text">
                    <RichText text={question.explanation} />
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="result-actions">
        <button type="button" className="button button-primary" onClick={onRetry} autoFocus>
          {isTimeAttack ? "もう一度挑戦" : isReview ? "もう一度復習" : "もう一度挑戦"}
        </button>
        {canReviewMissed && onReviewMissed !== undefined ? (
          <button type="button" className="button button-secondary" onClick={onReviewMissed}>
            間違えた問題を復習
          </button>
        ) : null}
        <button type="button" className="button button-ghost" onClick={onBackToTitle}>
          モードを選び直す
        </button>
      </div>
    </div>
  );
}
