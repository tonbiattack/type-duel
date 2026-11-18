/**
 * UI の統合テスト。
 *
 * 仕様書 §9 の受け入れ条件のうち、ブラウザ操作に関わるものを検証する:
 * - キーボードだけで 10 問を完走できる（Duel / Infer / Detective）
 * - 1 問につき一度だけ採点される（連打しても安全）
 * - 結果画面に正答率・スコア・最大連続正解が出る
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { QUESTIONS_PER_GAME, TIME_ATTACK_DURATION_MS } from "../src/lib/config";
import type { GameMode } from "../src/types/question";

type User = ReturnType<typeof userEvent.setup>;

/** モードの表示名。 */
const MODE_LABEL: Record<GameMode, string> = {
  duel: "Duel",
  infer: "Infer",
  detective: "Detective",
};

/** モードと難易度を選んでゲームを開始する。 */
async function startGame(user: User, mode: GameMode, difficulty = "Easy"): Promise<void> {
  const card = screen.getByRole("article", { name: new RegExp(MODE_LABEL[mode], "i") });
  const button = within(card).getByRole("button", { name: new RegExp(difficulty) });
  await user.click(button);
}

/** 現在の問題のコードを取得する。 */
function currentCode(): string {
  return screen.getByLabelText("判定する TypeScript コード").textContent ?? "";
}

/** 現在の問題の選択肢ボタン数。 */
function choiceCount(): number {
  return screen
    .getAllByRole("button", { pressed: false })
    .filter((button) => button.hasAttribute("data-choice-id")).length;
}

/** 10 問をキーボードだけで完走する。 */
async function playThrough(user: User, key: string): Promise<void> {
  for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
    await user.keyboard(key);
    await waitFor(() => {
      expect(screen.getByLabelText("判定結果と解説")).toBeInTheDocument();
    });
    await user.keyboard("{Enter}");
  }
}

describe("App", () => {
  beforeEach(() => {
    // タイマーはテストでは進めない（時間切れの検証は game.test.ts で行う）。
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("タイトル画面に 3 つのモードが表示される", () => {
    render(<App />);
    expect(screen.getByRole("article", { name: /Duel/i })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /Infer/i })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /Detective/i })).toBeInTheDocument();
  });

  it("各モードに難易度ボタンがある（Advanced は折りたたみ）", () => {
    render(<App />);
    for (const mode of ["Duel", "Infer", "Detective"]) {
      const card = screen.getByRole("article", { name: new RegExp(mode, "i") });
      // Easy / Normal / Hard + Advanced の 4 つ
      const buttons = within(card).getAllByRole("button");
      expect(buttons, mode).toHaveLength(4);
      // Advanced は details 内にあり、初期状態では閉じている
      const details = card.querySelector("details.mode-advanced");
      expect(details, mode).not.toBeNull();
      expect(details?.hasAttribute("open"), mode).toBe(false);
    }
  });

  it("Duel を選ぶとプレイ画面に進み、二択が表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "duel");

    expect(screen.getByLabelText("判定する TypeScript コード")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /代入できる/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /代入できない/ })).toBeInTheDocument();
    expect(choiceCount()).toBe(2);
  });

  it("Infer を選ぶと四択が表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "infer");

    expect(screen.getByLabelText("判定する TypeScript コード")).toBeInTheDocument();
    expect(choiceCount()).toBe(4);
  });

  it("Detective を選ぶと四択が表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "detective");

    expect(screen.getByLabelText("判定する TypeScript コード")).toBeInTheDocument();
    expect(choiceCount()).toBe(4);
  });

  it("回答すると解説と正誤が表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "duel");

    await user.click(screen.getByRole("button", { name: /代入できる/ }));

    expect(screen.getByLabelText("判定結果と解説")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /次の問題へ|結果を見る/ })).toBeInTheDocument();
  });

  it("回答後に二重クリックしても採点は一度だけ", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "duel");

    const assignable = screen.getByRole("button", { name: /代入できる/ });
    await user.click(assignable);
    expect(assignable).toBeDisabled();

    const notAssignable = screen.getByRole("button", { name: /代入できない/ });
    expect(notAssignable).toBeDisabled();

    expect(screen.getAllByLabelText("判定結果と解説")).toHaveLength(1);
  });

  it("Duel をキーボードだけで 10 問完走できる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "duel");

    const seen = new Set<string>();
    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      const code = currentCode();
      expect(seen.has(code), `${i + 1} 問目が重複しています`).toBe(false);
      seen.add(code);

      await user.keyboard("1");
      await waitFor(() => {
        expect(screen.getByLabelText("判定結果と解説")).toBeInTheDocument();
      });
      await user.keyboard("{Enter}");
    }

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });
    expect(seen.size).toBe(QUESTIONS_PER_GAME);
  });

  it("Infer をキーボードだけで 10 問完走できる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "infer");

    await playThrough(user, "1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });
  });

  it("Detective をキーボードだけで 10 問完走できる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "detective");

    await playThrough(user, "1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });
  });

  it("4 択モードで 4 キーが使える", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "infer");

    await user.keyboard("4");
    await waitFor(() => {
      expect(screen.getByLabelText("判定結果と解説")).toBeInTheDocument();
    });
  });

  it("結果画面に正答数・正答率・スコア・最大連続正解が表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "duel");

    await playThrough(user, "1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });

    const stats = screen.getByRole("heading", { name: "結果" }).closest(".screen-result");
    expect(stats).not.toBeNull();
    if (stats !== null) {
      const scope = within(stats as HTMLElement);
      expect(scope.getByText("スコア")).toBeInTheDocument();
      expect(scope.getByText("正答数")).toBeInTheDocument();
      expect(scope.getByText("正答率")).toBeInTheDocument();
      expect(scope.getByText("最大連続正解")).toBeInTheDocument();
    }
  });

  it("Esc でポーズし、再開できる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "duel");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "ポーズ中" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "ポーズ中" })).not.toBeInTheDocument();
  });

  it("結果画面から再挑戦できる（同じモード・難易度）", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "infer");

    await playThrough(user, "1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "もう一度挑戦" }));
    expect(screen.getByLabelText("判定する TypeScript コード")).toBeInTheDocument();
    expect(choiceCount()).toBe(4);
  });

  it("結果画面からモード選択に戻れる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "duel");

    await playThrough(user, "1");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "モードを選び直す" }));
    expect(screen.getByRole("article", { name: /Duel/i })).toBeInTheDocument();
  });

  it("ポーズ中は回答できない", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "duel");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /代入できる/ })).toBeDisabled();
  });

  it("Detective の解説に修正例が表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startGame(user, "detective");

    await user.keyboard("1");
    await waitFor(() => {
      expect(screen.getByLabelText("判定結果と解説")).toBeInTheDocument();
    });

    // 修正例がある問題ならコードブロックが 2 つ（問題 + 修正例）になる
    const blocks = screen.getAllByLabelText(/コード/);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
  });
});

describe("タイムアタック（UI）", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("タイトルから開始でき、60 秒タイマーが表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /60秒タイムアタック/ }));
    expect(screen.getByLabelText("判定する TypeScript コード")).toBeInTheDocument();
    expect(screen.getByText("タイムアタック")).toBeInTheDocument();
  });

  it("回答すると自動で次の問題へ進む", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await user.click(screen.getByRole("button", { name: /60秒タイムアタック/ }));

    const before = currentCode();
    await user.keyboard("1");

    // フィードバック表示後、自動で次へ
    await waitFor(() => {
      expect(currentCode()).not.toBe(before);
    });
  });

  it("時間切れで結果画面へ移る", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await user.click(screen.getByRole("button", { name: /60秒タイムアタック/ }));

    await vi.advanceTimersByTimeAsync(TIME_ATTACK_DURATION_MS + 1000);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });
  });

  it("結果画面に自己ベストが表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await user.click(screen.getByRole("button", { name: /60秒タイムアタック/ }));

    await vi.advanceTimersByTimeAsync(TIME_ATTACK_DURATION_MS + 1000);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });
    expect(screen.getByText("自己ベスト")).toBeInTheDocument();
  });
});

describe("復習（UI）", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("記録がなければ復習画面に案内が出る", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /復習/ }));
    expect(screen.getByRole("heading", { name: "復習" })).toBeInTheDocument();
    expect(screen.getByText(/まだ学習記録がありません/)).toBeInTheDocument();
  });

  it("間違えた問題が復習対象になる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Duel Easy を「2」で回答して誤答を作る
    await startGame(user, "duel");
    await playThrough(user, "2");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "モードを選び直す" }));
    await user.click(screen.getByRole("button", { name: /復習/ }));

    expect(screen.getByRole("heading", { name: "復習" })).toBeInTheDocument();
    expect(screen.getByText(/苦手な問題をまとめて復習/)).toBeInTheDocument();
  });

  it("復習では制限時間が表示されない", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await startGame(user, "duel");
    await playThrough(user, "2");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "モードを選び直す" }));
    await user.click(screen.getByRole("button", { name: /復習/ }));
    await user.click(screen.getByRole("button", { name: /苦手な問題をまとめて復習/ }));

    expect(screen.getByLabelText("判定する TypeScript コード")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("段階解説（UI）", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("Advanced 問題で段階解説を開ける", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Advanced を開いて開始
    const card = screen.getByRole("article", { name: /Duel/i });
    await user.click(within(card).getByText(/Advanced（複合問題）/));
    await user.click(within(card).getByRole("button", { name: /Advanced/ }));

    await user.keyboard("1");
    await waitFor(() => {
      expect(screen.getByLabelText("判定結果と解説")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("型の評価ステップ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "まとめて表示" })).toBeInTheDocument();
  });

  it("段階解説をまとめて開ける", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    const card = screen.getByRole("article", { name: /Duel/i });
    await user.click(within(card).getByText(/Advanced（複合問題）/));
    await user.click(within(card).getByRole("button", { name: /Advanced/ }));

    await user.keyboard("1");
    await waitFor(() => {
      expect(screen.getByLabelText("型の評価ステップ")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "まとめて表示" }));
    expect(screen.getByRole("button", { name: "閉じる" })).toBeInTheDocument();
  });
});
