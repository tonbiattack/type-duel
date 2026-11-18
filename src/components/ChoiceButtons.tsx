import type { Choice } from "../types/question";

type ChoiceButtonsProps = {
  choices: readonly Choice[];
  /** 選択済みの選択肢 ID。 */
  selectedChoiceId: string | null;
  /** 正解の選択肢 ID（解説表示中のみ渡す）。 */
  answerId: string | null;
  /** 回答受付中か。 */
  disabled: boolean;
  onSelect: (choiceId: string) => void;
};

/**
 * 回答ボタン。
 *
 * 2 択（Duel）と 4 択（Infer / Detective）の両方を扱う。
 * 回答後は全ボタンを無効化して二重送信を防ぐ。
 * 正誤は色だけでなく「正解」「不正解」のテキストでも示す。
 */
export function ChoiceButtons({
  choices,
  selectedChoiceId,
  answerId,
  disabled,
  onSelect,
}: ChoiceButtonsProps): React.JSX.Element {
  const revealed = answerId !== null;
  const isCompact = choices.length > 2;

  return (
    <div
      className={`choices${isCompact ? " choices-compact" : ""}`}
      role="group"
      aria-label="回答を選ぶ"
    >
      {choices.map((choice, index) => {
        const isSelected = selectedChoiceId === choice.id;
        const isAnswer = answerId === choice.id;
        const isWrongPick = revealed && isSelected && !isAnswer;

        const classes = ["choice"];
        if (isAnswer) {
          classes.push("is-correct");
        }
        if (isWrongPick) {
          classes.push("is-wrong");
        }
        if (isSelected) {
          classes.push("is-selected");
        }

        return (
          <button
            key={choice.id}
            type="button"
            className={classes.join(" ")}
            onClick={() => onSelect(choice.id)}
            disabled={disabled}
            aria-pressed={isSelected}
            data-choice-id={choice.id}
          >
            <span className="choice-key" aria-hidden="true">
              {index + 1}
            </span>
            <span className="choice-label">{choice.label}</span>
            {isAnswer ? <span className="choice-badge">正解</span> : null}
            {isWrongPick ? <span className="choice-badge">不正解</span> : null}
          </button>
        );
      })}
    </div>
  );
}
