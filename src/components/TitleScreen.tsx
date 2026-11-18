import {
  DIFFICULTIES,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_LABELS,
  type Difficulty,
} from "../types/question";
import { countByDifficulty } from "../lib/validate";
import { allQuestions } from "../data/questions";
import { QUESTIONS_PER_GAME } from "../lib/config";

type TitleScreenProps = {
  onStart: (difficulty: Difficulty) => void;
};

/**
 * タイトル画面。
 *
 * 開始までのクリック数を最小化するため、難易度ボタンを押すと即座に始まる。
 */
export function TitleScreen({ onStart }: TitleScreenProps): React.JSX.Element {
  const counts = countByDifficulty(allQuestions);

  return (
    <div className="screen screen-title">
      <header className="title-head">
        <h1 className="title-logo">
          Type <span className="title-logo-accent">Duel</span>
        </h1>
        <p className="title-tagline">
          TypeScript の型を読んで、代入できるか一瞬で見抜く。
          <br />
          {QUESTIONS_PER_GAME} 問・1 問 15 秒の型パズル。
        </p>
      </header>

      <section className="difficulty-picker" aria-labelledby="difficulty-heading">
        <h2 id="difficulty-heading" className="section-heading">
          難易度を選ぶ
        </h2>
        <div className="difficulty-list">
          {DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              className={`difficulty-card difficulty-${difficulty}`}
              onClick={() => onStart(difficulty)}
              data-difficulty={difficulty}
            >
              <span className="difficulty-name">{DIFFICULTY_LABELS[difficulty]}</span>
              <span className="difficulty-desc">{DIFFICULTY_DESCRIPTIONS[difficulty]}</span>
              <span className="difficulty-count">{counts[difficulty]} 問収録</span>
            </button>
          ))}
        </div>
      </section>

      <section className="how-to-play" aria-labelledby="howto-heading">
        <h2 id="howto-heading" className="section-heading">
          遊び方
        </h2>
        <ul className="howto-list">
          <li>
            <kbd>1</kbd> / <kbd>2</kbd> キー、またはボタンのタップで回答
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
