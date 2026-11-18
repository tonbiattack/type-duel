import { useState } from "react";
import type { ExplanationStep } from "../types/question";
import { RichText } from "./RichText";

type StepExplanationProps = {
  /** 段階解説のステップ。 */
  steps: readonly ExplanationStep[];
  /** まとめて表示で初期化するか。 */
  initiallyExpanded?: boolean;
};

/**
 * 段階解説。
 *
 * 複合型の問題は「どの順番で型が評価されるか」を追えないと納得できない。
 * 1 ステップずつ開けるようにし、読む量を選べるようにする。
 *
 * 解説を読まずに次へ進めることを妨げない（開閉は任意）。
 */
export function StepExplanation({
  steps,
  initiallyExpanded = false,
}: StepExplanationProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [openCount, setOpenCount] = useState(initiallyExpanded ? steps.length : 0);

  if (steps.length === 0) {
    return <></>;
  }

  const allOpen = openCount >= steps.length;

  const handleToggleAll = (): void => {
    if (allOpen) {
      setOpenCount(0);
      setExpanded(false);
    } else {
      setOpenCount(steps.length);
      setExpanded(true);
    }
  };

  const handleOpenNext = (): void => {
    setOpenCount((current) => Math.min(current + 1, steps.length));
    setExpanded(true);
  };

  return (
    <section className="steps" aria-label="型の評価ステップ">
      <div className="steps-head">
        <p className="steps-label">型の評価ステップ</p>
        <div className="steps-actions">
          {openCount < steps.length ? (
            <button
              type="button"
              className="button button-ghost button-small"
              onClick={handleOpenNext}
            >
              次のステップを開く
            </button>
          ) : null}
          <button
            type="button"
            className="button button-ghost button-small"
            onClick={handleToggleAll}
          >
            {allOpen ? "閉じる" : "まとめて表示"}
          </button>
        </div>
      </div>

      <ol className="steps-list">
        {steps.map((step, index) => {
          const isOpen = expanded && index < openCount;
          return (
            <li key={index} className={`step${isOpen ? " is-open" : ""}`}>
              <button
                type="button"
                className="step-head"
                onClick={() => {
                  setExpanded(true);
                  setOpenCount((current) => (index < current ? index : index + 1));
                }}
                aria-expanded={isOpen}
              >
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="step-title">
                  <RichText text={step.title} />
                </span>
                <span className="step-chevron" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <div className="step-body">
                  <p className="step-text">
                    <RichText text={step.body} />
                  </p>
                  {step.typeAfter !== undefined ? (
                    <p className="step-type">
                      <span className="step-type-label">この時点の型</span>
                      <code className="inline-code">{step.typeAfter}</code>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
