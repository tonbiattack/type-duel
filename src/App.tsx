import { useCallback, useEffect, useRef, useState } from "react";
import { PlayScreen } from "./components/PlayScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TitleScreen } from "./components/TitleScreen";
import { getQuestionsForDifficulty } from "./data/questions";
import { TIMER_TICK_MS } from "./lib/config";
import {
  answer as answerQuestion,
  next as nextQuestion,
  startGame,
  tick as tickGame,
  togglePause as togglePauseGame,
  type GameState,
} from "./lib/game";
import type { Difficulty } from "./types/question";

/** 画面遷移。 */
type Screen = "title" | "play" | "result";

/**
 * アプリのルート。
 *
 * ゲーム状態を保持し、画面遷移・タイマー・キーボード操作を束ねる。
 * ロジック自体は `lib/game.ts` の純粋関数に置き、ここでは副作用だけを扱う。
 */
export function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>("title");
  const [game, setGame] = useState<GameState | null>(null);
  const [lastDifficulty, setLastDifficulty] = useState<Difficulty>("easy");

  /** タイマーの経過時間計算用。 */
  const lastTickRef = useRef<number>(0);

  const start = useCallback((difficulty: Difficulty) => {
    const questions = getQuestionsForDifficulty(difficulty);
    setLastDifficulty(difficulty);
    setGame(startGame({ difficulty, questions }));
    setScreen("play");
  }, []);

  const retry = useCallback(() => {
    start(lastDifficulty);
  }, [lastDifficulty, start]);

  const backToTitle = useCallback(() => {
    setGame(null);
    setScreen("title");
  }, []);

  const handleAnswer = useCallback((choiceId: string) => {
    setGame((current) => (current === null ? current : answerQuestion(current, choiceId)));
  }, []);

  const handleNext = useCallback(() => {
    setGame((current) => {
      if (current === null) {
        return current;
      }
      const advanced = nextQuestion(current);
      if (advanced.phase === "finished") {
        setScreen("result");
      }
      return advanced;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    setGame((current) => (current === null ? current : togglePauseGame(current)));
  }, []);

  const handleQuit = useCallback(() => {
    setGame(null);
    setScreen("title");
  }, []);

  // タイマー: 回答待ちのあいだだけ進める。
  // 依存は「動いているか」と「問題が変わったか」だけに絞る。
  const timerActive =
    screen === "play" && game !== null && game.phase === "answering" && !game.paused;
  const timerKey = game?.index ?? -1;

  useEffect(() => {
    if (!timerActive) {
      return;
    }

    lastTickRef.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setGame((current) => (current === null ? current : tickGame(current, delta)));
    }, TIMER_TICK_MS);

    return () => {
      window.clearInterval(id);
    };
  }, [timerActive, timerKey]);

  // キーボード操作: 1/2 で回答、Enter で次へ、Esc でポーズ。
  useEffect(() => {
    if (screen !== "play" || game === null) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      const isButton = target instanceof HTMLElement && target.tagName === "BUTTON";

      if (event.key === "Escape") {
        event.preventDefault();
        handleTogglePause();
        return;
      }

      if (game.phase === "answering" && !game.paused) {
        const question = game.questions[game.index];
        if (question === undefined) {
          return;
        }
        const choiceIndex = event.key === "1" ? 0 : event.key === "2" ? 1 : -1;
        if (choiceIndex >= 0) {
          const choice = question.choices[choiceIndex];
          if (choice !== undefined) {
            event.preventDefault();
            handleAnswer(choice.id);
          }
        }
        return;
      }

      if (game.phase === "revealed" && event.key === "Enter") {
        // ボタンにフォーカスがある場合はブラウザ既定のクリックに任せる。
        if (isButton) {
          return;
        }
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [screen, game, handleAnswer, handleNext, handleTogglePause]);

  if (screen === "title" || game === null) {
    return (
      <div className="app">
        <TitleScreen onStart={start} />
        <footer className="app-footer">
          <span>Type Duel — TypeScript 型判定パズル</span>
        </footer>
      </div>
    );
  }

  if (screen === "result") {
    return (
      <div className="app">
        <ResultScreen state={game} onRetry={retry} onBackToTitle={backToTitle} />
        <footer className="app-footer">
          <span>Type Duel — TypeScript 型判定パズル</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="app">
      <PlayScreen
        state={game}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onTogglePause={handleTogglePause}
        onQuit={handleQuit}
      />
      <footer className="app-footer">
        <span>Type Duel — TypeScript 型判定パズル</span>
      </footer>
    </div>
  );
}
