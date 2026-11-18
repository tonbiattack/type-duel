import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlayScreen } from "./components/PlayScreen";
import { ResultScreen } from "./components/ResultScreen";
import { ReviewScreen } from "./components/ReviewScreen";
import { TitleScreen } from "./components/TitleScreen";
import {
  allQuestions,
  getQuestionsByIds,
  getQuestionsByTopic,
  getQuestionsForModeAndDifficulty,
} from "./data/questions";
import { TIME_ATTACK_FEEDBACK_MS, TIMER_TICK_MS } from "./lib/config";
import {
  answer as answerQuestion,
  next as nextQuestion,
  pickWithHistory,
  startGame,
  startReview,
  startTimeAttack,
  tick as tickGame,
  togglePause as togglePauseGame,
  type GameState,
} from "./lib/game";
import {
  aggregateTopicStats,
  clearProgress,
  getStrugglingQuestionIds,
  loadProgress,
  recordAnswer,
  recordRecentQuestions,
  recordTimeAttack,
  saveProgress,
  type Progress,
} from "./lib/storage";
import { buildTopicIndex } from "./lib/validate";
import type { Difficulty, GameMode } from "./types/question";

/** 画面遷移。 */
type Screen = "title" | "play" | "result" | "review";

/** 直前に選んだモードと難易度（リトライ用）。 */
type Selection = { mode: GameMode; difficulty: Difficulty };

/** 復習の対象。 */
type ReviewTarget = { kind: "all" } | { kind: "topic"; topic: string };

/**
 * アプリのルート。
 *
 * ゲーム状態を保持し、画面遷移・タイマー・キーボード操作を束ねる。
 * ロジック自体は `lib/game.ts` の純粋関数に置き、ここでは副作用だけを扱う。
 * 学習記録は localStorage に保存するが、失敗してもプレイは止めない。
 */
export function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>("title");
  const [game, setGame] = useState<GameState | null>(null);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [lastSelection, setLastSelection] = useState<Selection>({
    mode: "duel",
    difficulty: "easy",
  });
  const [lastReviewTarget, setLastReviewTarget] = useState<ReviewTarget>({ kind: "all" });
  const [isNewBest, setIsNewBest] = useState(false);

  /** タイマーの経過時間計算用。 */
  const lastTickRef = useRef<number>(0);
  /** 保存をまとめるための最新の進捗（レンダー外でのみ更新する）。 */
  const progressRef = useRef(progress);

  // 進捗が変わったら ref を追従させる（レンダー中には書かない）。
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  /** トピック別の成績（苦手順）。 */
  const topicStats = useMemo(
    () => aggregateTopicStats(progress, buildTopicIndex(allQuestions)),
    [progress],
  );

  /** 復習できる問題数。 */
  const strugglingCount = useMemo(() => getStrugglingQuestionIds(progress).length, [progress]);

  /** 進捗を保存する（失敗しても続行）。 */
  const persist = useCallback((next: Progress) => {
    setProgress(next);
    saveProgress(next);
  }, []);

  /** 標準モードを開始する。 */
  const start = useCallback((mode: GameMode, difficulty: Difficulty) => {
    const pool = getQuestionsForModeAndDifficulty(mode, difficulty);
    const questions = pickWithHistory(pool, 10, progressRef.current.recentQuestionIds);
    setLastSelection({ mode, difficulty });
    setIsNewBest(false);
    setGame(startGame({ mode, difficulty, questions }));
    setScreen("play");
  }, []);

  /** タイムアタックを開始する。 */
  const startTimeAttackMode = useCallback(() => {
    const questions = pickWithHistory(allQuestions, 60, progressRef.current.recentQuestionIds);
    setIsNewBest(false);
    setGame(startTimeAttack({ questions }));
    setScreen("play");
  }, []);

  /** 復習を開始する。 */
  const startReviewMode = useCallback((target: ReviewTarget) => {
    const ids = getStrugglingQuestionIds(progressRef.current);
    const questions =
      target.kind === "topic"
        ? getQuestionsByTopic(target.topic).filter((question) => ids.includes(question.id))
        : getQuestionsByIds(ids);

    if (questions.length === 0) {
      return;
    }

    const mode = questions[0]?.mode ?? "duel";
    const difficulty = questions[0]?.difficulty ?? "easy";
    setLastReviewTarget(target);
    setIsNewBest(false);
    setGame(startReview({ mode, difficulty, questions }));
    setScreen("play");
  }, []);

  const retry = useCallback(() => {
    if (game?.format === "timeAttack") {
      startTimeAttackMode();
      return;
    }
    if (game?.format === "review") {
      startReviewMode(lastReviewTarget);
      return;
    }
    start(lastSelection.mode, lastSelection.difficulty);
  }, [game?.format, lastReviewTarget, lastSelection, start, startReviewMode, startTimeAttackMode]);

  const backToTitle = useCallback(() => {
    setGame(null);
    setScreen("title");
  }, []);

  const openReview = useCallback(() => {
    setScreen("review");
  }, []);

  const handleClearProgress = useCallback(() => {
    clearProgress();
    setProgress(loadProgress());
  }, []);

  /** 回答を確定し、学習記録を更新する。 */
  const handleAnswer = useCallback(
    (choiceId: string) => {
      setGame((current) => {
        if (current === null) {
          return current;
        }
        const answered = answerQuestion(current, choiceId);
        if (answered === current) {
          return current;
        }

        const result = answered.results[answered.results.length - 1];
        if (result !== undefined) {
          const next = recordAnswer(
            progressRef.current,
            result.questionId,
            result.correct,
            result.durationMs,
          );
          persist(next);
        }

        return answered;
      });
    },
    [persist],
  );

  /**
   * ゲーム終了時の後処理（記録の保存・画面遷移）。
   *
   * 最新の進捗を ref から読むため、依存を固定したまま呼べるよう
   * `useCallback` ではなく ref 経由で最新版を参照する。
   */
  const finishGameRef = useRef<(finished: GameState) => void>(() => {});

  useEffect(() => {
    finishGameRef.current = (finished: GameState) => {
      const base = recordRecentQuestions(
        progressRef.current,
        finished.questions.map((question) => question.id),
      );

      if (finished.format === "timeAttack") {
        const { progress: updated, isNewBest: newBest } = recordTimeAttack(base, {
          score: finished.score,
          correct: finished.results.filter((result) => result.correct).length,
          maxStreak: finished.maxStreak,
        });
        setIsNewBest(newBest);
        persist(updated);
      } else {
        persist(base);
      }

      setScreen("result");
    };
  }, [persist]);

  /** 安定した参照で終了処理を呼ぶ。 */
  const finishGame = useCallback((finished: GameState) => {
    finishGameRef.current(finished);
  }, []);

  /** 次の問題へ進む。 */
  const handleNext = useCallback(() => {
    setGame((current) => {
      if (current === null) {
        return current;
      }
      const advanced = nextQuestion(current);
      if (advanced.phase === "finished") {
        finishGame(advanced);
      }
      return advanced;
    });
  }, [finishGame]);
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
    screen === "play" && game !== null && game.phase !== "finished" && !game.paused;
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
      setGame((current) => {
        if (current === null) {
          return current;
        }
        const ticked = tickGame(current, delta);
        if (ticked.phase === "finished" && current.phase !== "finished") {
          finishGame(ticked);
        }
        return ticked;
      });
    }, TIMER_TICK_MS);

    return () => {
      window.clearInterval(id);
    };
  }, [timerActive, timerKey, finishGame]);

  // タイムアタック: 回答後は短いフィードバックだけ出して自動で次へ。
  const feedbackActive = screen === "play" && game?.phase === "feedback";

  useEffect(() => {
    if (!feedbackActive) {
      return;
    }

    const id = window.setTimeout(() => {
      setGame((current) => {
        if (current === null || current.phase !== "feedback") {
          return current;
        }
        const advanced = nextQuestion(current);
        if (advanced.phase === "finished") {
          finishGame(advanced);
        }
        return advanced;
      });
    }, TIME_ATTACK_FEEDBACK_MS);

    return () => {
      window.clearTimeout(id);
    };
  }, [feedbackActive, game?.results.length, finishGame]);

  // キーボード操作: 1〜4 で回答、Enter で次へ、Esc でポーズ。
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
        const digit = Number.parseInt(event.key, 10);
        if (Number.isInteger(digit) && digit >= 1 && digit <= question.choices.length) {
          const choice = question.choices[digit - 1];
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

  const footer = (
    <footer className="app-footer">
      <span>Type Duel — TypeScript 型判定パズル</span>
    </footer>
  );

  if (screen === "review") {
    return (
      <div className="app">
        <ReviewScreen
          progress={progress}
          topicStats={topicStats}
          strugglingCount={strugglingCount}
          onStartTopic={(topic) => startReviewMode({ kind: "topic", topic })}
          onStartAll={() => startReviewMode({ kind: "all" })}
          onBack={backToTitle}
          onClearProgress={handleClearProgress}
        />
        {footer}
      </div>
    );
  }

  if (screen === "title" || game === null) {
    return (
      <div className="app">
        <TitleScreen
          onStart={start}
          onStartTimeAttack={startTimeAttackMode}
          onOpenReview={openReview}
          reviewCount={strugglingCount}
          bestScore={progress.timeAttack?.bestScore ?? null}
        />
        {footer}
      </div>
    );
  }

  if (screen === "result") {
    const missedCount = game.results.filter((result) => !result.correct).length;
    return (
      <div className="app">
        <ResultScreen
          state={game}
          onRetry={retry}
          onBackToTitle={backToTitle}
          bestRecord={progress.timeAttack}
          isNewBest={isNewBest}
          canReviewMissed={missedCount > 0}
          onReviewMissed={() => startReviewMode({ kind: "all" })}
        />
        {footer}
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
      {footer}
    </div>
  );
}
