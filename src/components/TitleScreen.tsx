import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  GAME_MODES,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  MODE_TAGLINES,
  type Difficulty,
  type GameMode,
} from "../types/question";
import { countByDifficulty, countByMode } from "../lib/validate";
import { allQuestions, getQuestionsForMode } from "../data/questions";
import { QUESTIONS_PER_GAME } from "../lib/config";
import { RichText } from "./RichText";

type TitleScreenProps = {
  onStart: (mode: GameMode, difficulty: Difficulty) => void;
};

/**
 * タイトル画面。
 *
 * モードを選び、そのまま難易度ボタンを押すと開始する。
 * 開始までのクリック数を最小化するため、確認ダイアログは挟まない。
 */
export function TitleScreen({ onStart }: TitleScreenProps): React.JSX.Element {
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

      <section className="mode-section" aria-labelledby="mode-heading">
        <h2 id="mode-heading" className="section-heading">
          モードを選ぶ
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
                {DIFFICULTIES.map((difficulty) => {
                  const count = countByDifficulty(
                    getQuestionsForMode(mode).filter(
                      (question) => question.difficulty === difficulty,
                    ),
                  )[difficulty];
                  return (
                    <button
                      key={difficulty}
                      type="button"
                      className={`difficulty-button difficulty-${difficulty}`}
                      onClick={() => onStart(mode, difficulty)}
                      data-mode={mode}
                      data-difficulty={difficulty}
                      disabled={count === 0}
                    >
                      <span className="difficulty-button-label">
                        {DIFFICULTY_LABELS[difficulty]}
                      </span>
                      <span className="difficulty-button-count">{count} 問</span>
                    </button>
                  );
                })}
              </div>
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
}
