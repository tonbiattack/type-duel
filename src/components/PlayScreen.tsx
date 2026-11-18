import { DIFFICULTY_LABELS } from "../types/question";
import { currentQuestion, isAnswered, isLastQuestion, type GameState } from "../lib/game";
import { ChoiceButtons } from "./ChoiceButtons";
import { CodeBlock } from "./CodeBlock";
import { Explanation } from "./Explanation";
import { Timer } from "./Timer";

type PlayScreenProps = {
  state: GameState;
  onAnswer: (choiceId: string) => void;
  onNext: () => void;
  onTogglePause: () => void;
  onQuit: () => void;
};

/**
 * プレイ画面。
 *
 * 問題文・コード・タイマー・進捗・二択ボタンを 1 画面に収める。
 * 回答後は解説を差し込み、同じ問題への再回答を防ぐ。
 */
export function PlayScreen({
  state,
  onAnswer,
  onNext,
  onTogglePause,
  onQuit,
}: PlayScreenProps): React.JSX.Element {
  const question = currentQuestion(state);
  const answered = isAnswered(state);
  const result = state.results[state.results.length - 1];
  const showExplanation = state.phase === "revealed" && result !== undefined;

  return (
    <div className="screen screen-play">
      <header className="play-head">
        <div className="play-meta">
          <span className="play-difficulty">{DIFFICULTY_LABELS[state.difficulty]}</span>
          <span
            className="play-progress"
            aria-label={`${state.index + 1} 問目 / 全 ${state.questions.length} 問`}
          >
            <strong>{state.index + 1}</strong>
            <span className="play-progress-sep">/</span>
            {state.questions.length}
          </span>
        </div>
        <div className="play-score">
          <span className="play-score-label">スコア</span>
          <strong className="play-score-value">{state.score}</strong>
          {state.streak > 1 ? <span className="play-streak">{state.streak} 連続正解中</span> : null}
        </div>
        <div className="play-controls">
          <button
            type="button"
            className="button button-ghost button-small"
            onClick={onTogglePause}
            aria-pressed={state.paused}
          >
            {state.paused ? "再開" : "ポーズ"}
            <span className="button-hint" aria-hidden="true">
              Esc
            </span>
          </button>
          <button type="button" className="button button-ghost button-small" onClick={onQuit}>
            やめる
          </button>
        </div>
      </header>

      <Timer
        remainingMs={state.remainingMs}
        timeLimitMs={state.timeLimitMs}
        paused={state.paused}
      />

      <main className="play-main">
        <p className="question-prompt">{question.prompt}</p>
        <CodeBlock code={question.code} label="判定する TypeScript コード" />

        <ChoiceButtons
          choices={question.choices}
          selectedChoiceId={state.selectedChoiceId}
          answerId={showExplanation ? question.answer : null}
          disabled={answered || state.paused}
          onSelect={onAnswer}
        />

        {showExplanation ? (
          <Explanation
            question={question}
            result={result}
            isLast={isLastQuestion(state)}
            onNext={onNext}
          />
        ) : (
          <p className="play-hint">
            <kbd>1</kbd> 代入できる / <kbd>2</kbd> 代入できない
          </p>
        )}
      </main>

      {state.paused ? (
        <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="ポーズ中">
          <div className="pause-card">
            <h2 className="pause-title">ポーズ中</h2>
            <p className="pause-text">タイマーは止まっています。</p>
            <button
              type="button"
              className="button button-primary"
              onClick={onTogglePause}
              autoFocus
            >
              再開する
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
