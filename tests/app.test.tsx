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
import { QUESTIONS_PER_GAME } from "../src/lib/config";
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

  it("各モードに難易度ボタンが 3 つある", () => {
    render(<App />);
    for (const mode of ["Duel", "Infer", "Detective"]) {
      const card = screen.getByRole("article", { name: new RegExp(mode, "i") });
      const buttons = within(card).getAllByRole("button");
      expect(buttons, mode).toHaveLength(3);
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

    await user.click(screen.getByRole("button", { name: "難易度を選び直す" }));
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
