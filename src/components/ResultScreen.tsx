import { DIFFICULTY_LABELS } from "../types/question";
import { formatAccuracy, summarize, type GameState } from "../lib/game";

type ResultScreenProps = {
  state: GameState;
  onRetry: () => void;
  onBackToTitle: () => void;
};

/**
 * 結果画面。
 *
 * 正答数・正答率・スコア・最大連続正解を表示し、再挑戦できる。
 */
export function ResultScreen({
  state,
  onRetry,
  onBackToTitle,
}: ResultScreenProps): React.JSX.Element {
  const summary = summarize(state);

  return (
    <div className="screen screen-result">
      <header className="result-head">
        <p className="result-difficulty">{DIFFICULTY_LABELS[state.difficulty]}</p>
        <h1 className="result-title">結果</h1>
      </header>

      <dl className="result-stats">
        <div className="stat stat-score">
          <dt>スコア</dt>
          <dd>{summary.score}</dd>
        </div>
        <div className="stat">
          <dt>正答数</dt>
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
      </dl>

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

      <div className="result-actions">
        <button type="button" className="button button-primary" onClick={onRetry} autoFocus>
          もう一度挑戦
        </button>
        <button type="button" className="button button-ghost" onClick={onBackToTitle}>
          難易度を選び直す
        </button>
      </div>
    </div>
  );
}
