import { useMemo, useState } from "react";
import type { Progress, TopicStats } from "../lib/storage";
import { formatAccuracy } from "../lib/game";

type ReviewScreenProps = {
  progress: Progress;
  /** トピック別の成績（苦手順）。 */
  topicStats: readonly TopicStats[];
  /** 復習対象の問題数（全体）。 */
  strugglingCount: number;
  /** トピックを指定して復習を開始する。 */
  onStartTopic: (topic: string) => void;
  /** 苦手問題をまとめて復習する。 */
  onStartAll: () => void;
  onBack: () => void;
  /** 学習記録を消す。 */
  onClearProgress: () => void;
};

/**
 * 復習画面。
 *
 * 間違えた問題をトピック別に解き直せる。
 * 苦手な分野がひと目で分かり、そこだけを選んで復習できる。
 */
export function ReviewScreen({
  progress,
  topicStats,
  strugglingCount,
  onStartTopic,
  onStartAll,
  onBack,
  onClearProgress,
}: ReviewScreenProps): React.JSX.Element {
  const [confirmClear, setConfirmClear] = useState(false);

  const answeredCount = useMemo(() => Object.keys(progress.questions).length, [progress.questions]);

  const weakTopics = topicStats.filter((stats) => stats.wrong > 0);

  return (
    <div className="screen screen-review">
      <header className="review-head">
        <h1 className="review-title">復習</h1>
        <p className="review-lead">
          間違えた問題をトピック別に解き直せます。制限時間はありません。
        </p>
      </header>

      <section className="review-summary" aria-labelledby="review-summary-heading">
        <h2 id="review-summary-heading" className="section-heading">
          学習状況
        </h2>
        <dl className="review-summary-stats">
          <div>
            <dt>回答した問題</dt>
            <dd>{answeredCount}</dd>
          </div>
          <div>
            <dt>復習できる問題</dt>
            <dd>{strugglingCount}</dd>
          </div>
          <div>
            <dt>記録したトピック</dt>
            <dd>{topicStats.length}</dd>
          </div>
        </dl>
      </section>

      {strugglingCount > 0 ? (
        <div className="review-primary">
          <button type="button" className="button button-primary" onClick={onStartAll}>
            苦手な問題をまとめて復習（{strugglingCount} 問）
          </button>
        </div>
      ) : (
        <p className="review-empty">
          {answeredCount === 0
            ? "まだ学習記録がありません。まずは 10 問チャレンジかタイムアタックで遊んでみてください。"
            : "復習が必要な問題はありません。よくできています。"}
        </p>
      )}

      {weakTopics.length > 0 ? (
        <section className="review-topics" aria-labelledby="review-topics-heading">
          <h2 id="review-topics-heading" className="section-heading">
            トピック別（苦手な順）
          </h2>
          <ul className="topic-list">
            {weakTopics.map((stats) => (
              <li key={stats.topic} className="topic-item">
                <div className="topic-info">
                  <span className="topic-name">{stats.topic}</span>
                  <span className="topic-detail">
                    正答率 {formatAccuracy(stats.accuracy)}（{stats.correct} /{" "}
                    {stats.correct + stats.wrong}）
                  </span>
                </div>
                <div className="topic-bar" aria-hidden="true">
                  <div className="topic-bar-fill" style={{ width: `${stats.accuracy * 100}%` }} />
                </div>
                <button
                  type="button"
                  className="button button-ghost button-small"
                  onClick={() => onStartTopic(stats.topic)}
                >
                  このトピックを復習
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="review-actions">
        <button type="button" className="button button-ghost" onClick={onBack}>
          戻る
        </button>
        {answeredCount > 0 ? (
          confirmClear ? (
            <div className="review-confirm" role="group" aria-label="学習記録の削除確認">
              <span className="review-confirm-text">学習記録を削除しますか？</span>
              <button
                type="button"
                className="button button-danger button-small"
                onClick={() => {
                  onClearProgress();
                  setConfirmClear(false);
                }}
              >
                削除する
              </button>
              <button
                type="button"
                className="button button-ghost button-small"
                onClick={() => setConfirmClear(false)}
              >
                やめる
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button button-ghost button-small"
              onClick={() => setConfirmClear(true)}
            >
              学習記録を消す
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
