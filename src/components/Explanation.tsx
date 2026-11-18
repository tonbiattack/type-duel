import type { QuestionResult } from "../lib/game";
import type { Question } from "../types/question";
import { CodeBlock } from "./CodeBlock";
import { RichText } from "./RichText";
import { StepExplanation } from "./StepExplanation";

type ExplanationProps = {
  question: Question;
  result: QuestionResult;
  isLast: boolean;
  onNext: () => void;
  /** タイムアタックなど、解説を省いてテンポを優先するか。 */
  compact?: boolean;
};

/**
 * 正誤と解説の表示。
 *
 * 色に頼らず「正解」「不正解」「時間切れ」を明示する。
 * Detective では修正例、Infer では推論された型も併せて示す。
 * 段階解説がある問題では、評価の流れを 1 ステップずつ追える。
 *
 * 「次へ」ボタンは自動フォーカスし、Enter で進めるようにする。
 * 解説を読まずに進むことも妨げない。
 */
export function Explanation({
  question,
  result,
  isLast,
  onNext,
  compact = false,
}: ExplanationProps): React.JSX.Element {
  const verdict = result.correct ? "正解" : result.timedOut ? "時間切れ" : "不正解";
  const verdictClass = result.correct ? "is-correct" : "is-wrong";
  const hasSteps = question.explanationSteps !== undefined && question.explanationSteps.length > 0;

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

      {question.mode === "infer" ? (
        <p className="explanation-answer">
          推論される型: <code className="inline-code">{question.expectedType}</code>
        </p>
      ) : null}

      <p className="explanation-text">
        <RichText text={question.explanation} />
      </p>

      {hasSteps && !compact ? <StepExplanation steps={question.explanationSteps ?? []} /> : null}

      {question.mode === "detective" && question.fix !== undefined && !compact ? (
        <div className="explanation-fix">
          <p className="explanation-fix-label">修正例</p>
          <CodeBlock code={question.fix} label="修正例のコード" />
        </div>
      ) : null}

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
