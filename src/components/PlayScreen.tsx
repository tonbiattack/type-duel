import { DIFFICULTY_LABELS, MODE_LABELS } from "../types/question";
import { currentQuestion, isAnswered, isLastQuestion, type GameState } from "../lib/game";
import { ChoiceButtons } from "./ChoiceButtons";
import { CodeBlock } from "./CodeBlock";
import { Explanation } from "./Explanation";
import { RichText } from "./RichText";
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
 * 問題文・コード・タイマー・進捗・回答ボタンを 1 画面に収める。
 * 回答後は解説を差し込み、同じ問題への再回答を防ぐ。
 *
 * タイムアタックでは解説を出さず、正誤だけを短く示して自動で次へ進む
 * （テンポを止めないため。解説は結果画面からまとめて確認できる）。
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
  const isTimeAttack = state.format === "timeAttack";
  const showExplanation = state.phase === "revealed" && result !== undefined;
  const showFeedback = state.phase === "feedback" && result !== undefined;
  const choiceCount = question.choices.length;

  return (
    <div className={`screen screen-play${isTimeAttack ? " is-time-attack" : ""}`}>
      <header className="play-head">
        <div className="play-meta">
          <span className={`play-mode play-mode-${state.mode}`}>{MODE_LABELS[state.mode]}</span>
          {isTimeAttack ? (
            <span className="play-mode play-mode-timeattack">タイムアタック</span>
          ) : (
            <span className="play-difficulty">{DIFFICULTY_LABELS[state.difficulty]}</span>
          )}
          <span
            className="play-progress"
            aria-label={
              isTimeAttack
                ? `${state.results.length} 問回答済み`
                : `${state.index + 1} 問目 / 全 ${state.questions.length} 問`
            }
          >
            {isTimeAttack ? (
              <>
                <strong>{state.results.length}</strong>
                <span className="play-progress-sep">問</span>
              </>
            ) : (
              <>
                <strong>{state.index + 1}</strong>
                <span className="play-progress-sep">/</span>
                {state.questions.length}
              </>
            )}
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
        label="残り時間"
        hidden={!state.timeLimitEnabled}
      />

      <main className="play-main">
        <p className="question-prompt">
          <RichText text={question.prompt} />
        </p>
        <CodeBlock code={question.code} label="判定する TypeScript コード" />

        <ChoiceButtons
          choices={question.choices}
          selectedChoiceId={state.selectedChoiceId}
          answerId={showExplanation ? question.answer : null}
          disabled={answered || state.paused}
          onSelect={onAnswer}
        />

        {showFeedback && result !== undefined ? (
          <p
            className={`play-feedback ${result.correct ? "is-correct" : "is-wrong"}`}
            aria-live="polite"
          >
            {result.correct ? "正解" : result.timedOut ? "時間切れ" : "不正解"}
            {result.correct ? <span className="play-feedback-score">+{result.score}</span> : null}
          </p>
        ) : null}

        {showExplanation && result !== undefined ? (
          <Explanation
            question={question}
            result={result}
            isLast={isLastQuestion(state)}
            onNext={onNext}
          />
        ) : null}

        {!answered ? (
          <p className="play-hint">
            {choiceCount === 2 ? (
              <>
                <kbd>1</kbd> 代入できる / <kbd>2</kbd> 代入できない
              </>
            ) : (
              <>
                <kbd>1</kbd>〜<kbd>{choiceCount}</kbd> キーで回答
              </>
            )}
          </p>
        ) : null}
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
