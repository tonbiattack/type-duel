import {
  DIFFICULTY_LABELS,
  FORMAT_LABELS,
  FORMAT_TAGLINES,
  GAME_MODES,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  MODE_TAGLINES,
  PRIMARY_DIFFICULTIES,
  type Difficulty,
  type GameMode,
} from "../types/question";
import { countByDifficulty, countByMode } from "../lib/validate";
import { allQuestions, getQuestionsForMode } from "../data/questions";
import { QUESTIONS_PER_GAME, TIME_ATTACK_DURATION_MS } from "../lib/config";
import { RichText } from "./RichText";

type TitleScreenProps = {
  onStart: (mode: GameMode, difficulty: Difficulty) => void;
  onStartTimeAttack: () => void;
  onOpenReview: () => void;
  /** 復習できる問題数（0 ならバッジを出さない）。 */
  reviewCount: number;
  /** タイムアタックのベストスコア（未プレイなら null）。 */
  bestScore: number | null;
};

/**
 * タイトル画面。
 *
 * 開始までのクリック数を最小化するため、難易度ボタンを押すと即座に始まる。
 * Advanced は上級者向けなので折りたたみ、初期表示を複雑にしない。
 */
export function TitleScreen({
  onStart,
  onStartTimeAttack,
  onOpenReview,
  reviewCount,
  bestScore,
}: TitleScreenProps): React.JSX.Element {
  const modeCounts = countByMode(allQuestions);

  return (
    <div className="screen screen-title">
      <header className="title-head">
        <h1 className="title-logo">
          Type <span className="title-logo-accent">Duel</span>
        </h1>
        <p className="title-tagline">
          TypeScript の型を読んで、一瞬で見抜く。
          <br />
          {QUESTIONS_PER_GAME} 問・1 問 15 秒の型パズル。
        </p>
      </header>

      <section className="format-section" aria-labelledby="format-heading">
        <h2 id="format-heading" className="section-heading">
          遊びかたを選ぶ
        </h2>
        <div className="format-list">
          <button
            type="button"
            className="format-card format-timeattack"
            onClick={onStartTimeAttack}
          >
            <span className="format-name">{FORMAT_LABELS.timeAttack}</span>
            <span className="format-tagline">{FORMAT_TAGLINES.timeAttack}</span>
            <span className="format-meta">
              {TIME_ATTACK_DURATION_MS / 1000} 秒
              {bestScore !== null ? ` ・ ベスト ${bestScore} 点` : ""}
            </span>
          </button>
          <button type="button" className="format-card format-review" onClick={onOpenReview}>
            <span className="format-name">{FORMAT_LABELS.review}</span>
            <span className="format-tagline">{FORMAT_TAGLINES.review}</span>
            <span className="format-meta">
              {reviewCount > 0 ? `${reviewCount} 問が復習待ち` : "学習記録から出題"}
            </span>
          </button>
        </div>
      </section>

      <section className="mode-section" aria-labelledby="mode-heading">
        <h2 id="mode-heading" className="section-heading">
          {FORMAT_LABELS.standard} — モードを選ぶ
        </h2>
        <div className="mode-list">
          {GAME_MODES.map((mode) => (
            <article
              key={mode}
              className={`mode-card mode-${mode}`}
              aria-labelledby={`mode-name-${mode}`}
            >
              <header className="mode-card-head">
                <h3 id={`mode-name-${mode}`} className="mode-name">
                  {MODE_LABELS[mode]}
                </h3>
                <span className="mode-count">{modeCounts[mode]} 問</span>
              </header>
              <p className="mode-tagline">{MODE_TAGLINES[mode]}</p>
              <p className="mode-description">
                <RichText text={MODE_DESCRIPTIONS[mode]} />
              </p>
              <div
                className="mode-difficulties"
                role="group"
                aria-label={`${MODE_LABELS[mode]} の難易度`}
              >
                {PRIMARY_DIFFICULTIES.map((difficulty) => (
                  <DifficultyButton
                    key={difficulty}
                    mode={mode}
                    difficulty={difficulty}
                    onStart={onStart}
                  />
                ))}
              </div>
              <details className="mode-advanced">
                <summary className="mode-advanced-summary">
                  Advanced（複合問題）
                  <span className="mode-advanced-count">{countFor(mode, "advanced")} 問</span>
                </summary>
                <div
                  className="mode-difficulties"
                  role="group"
                  aria-label={`${MODE_LABELS[mode]} の Advanced`}
                >
                  <DifficultyButton mode={mode} difficulty="advanced" onStart={onStart} />
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="how-to-play" aria-labelledby="howto-heading">
        <h2 id="howto-heading" className="section-heading">
          遊び方
        </h2>
        <ul className="howto-list">
          <li>
            <kbd>1</kbd>〜<kbd>4</kbd> キー、またはボタンのタップで回答
          </li>
          <li>
            <kbd>Enter</kbd> で次の問題へ
          </li>
          <li>
            <kbd>Esc</kbd> でポーズ
          </li>
          <li>正解は 100 点 + 残り秒数 × 5 点</li>
        </ul>
      </section>
    </div>
  );

  /** モードと難易度の問題数を返す。 */
  function countFor(mode: GameMode, difficulty: Difficulty): number {
    return countByDifficulty(
      getQuestionsForMode(mode).filter((question) => question.difficulty === difficulty),
    )[difficulty];
  }

  /** 難易度ボタン。 */
  function DifficultyButton({
    mode,
    difficulty,
    onStart: handleStart,
  }: {
    mode: GameMode;
    difficulty: Difficulty;
    onStart: (mode: GameMode, difficulty: Difficulty) => void;
  }): React.JSX.Element {
    const count = countFor(mode, difficulty);
    return (
      <button
        type="button"
        className={`difficulty-button difficulty-${difficulty}`}
        onClick={() => handleStart(mode, difficulty)}
        data-mode={mode}
        data-difficulty={difficulty}
        disabled={count === 0}
        aria-label={`${MODE_LABELS[mode]} ${DIFFICULTY_LABELS[difficulty]}（${count} 問）`}
      >
        <span className="difficulty-button-label">{DIFFICULTY_LABELS[difficulty]}</span>
        <span className="difficulty-button-count">{count} 問</span>
      </button>
    );
  }
}
