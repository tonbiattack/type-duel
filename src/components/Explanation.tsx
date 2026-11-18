import type { QuestionResult } from "../lib/game";
import type { Question } from "../types/question";

type ExplanationProps = {
  question: Question;
  result: QuestionResult;
  isLast: boolean;
  onNext: () => void;
};

/**
 * 正誤と解説の表示。
 *
 * 色に頼らず「正解」「不正解」「時間切れ」を明示する。
 * 「次へ」ボタンは自動フォーカスし、Enter で進めるようにする。
 */
export function Explanation({
  question,
  result,
  isLast,
  onNext,
}: ExplanationProps): React.JSX.Element {
  const verdict = result.correct ? "正解" : result.timedOut ? "時間切れ" : "不正解";
  const verdictClass = result.correct ? "is-correct" : "is-wrong";

  return (
    <section
      className={`explanation ${verdictClass}`}
      aria-live="polite"
      aria-label="判定結果と解説"
    >
      <div className="explanation-head">
        <strong className={`verdict ${verdictClass}`}>{verdict}</strong>
        {result.correct ? (
          <span className="gained">+{result.score} 点</span>
        ) : (
          <span className="gained is-zero">+0 点</span>
        )}
      </div>
      <p className="explanation-text">{question.explanation}</p>
      <div className="explanation-actions">
        <button type="button" className="button button-primary" onClick={onNext} autoFocus>
          {isLast ? "結果を見る" : "次の問題へ"}
          <span className="button-hint" aria-hidden="true">
            Enter
          </span>
        </button>
      </div>
    </section>
  );
}
