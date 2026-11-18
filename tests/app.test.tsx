/**
 * UI の統合テスト。
 *
 * 仕様書 §9 の受け入れ条件のうち、ブラウザ操作に関わるものを検証する:
 * - キーボードだけで 10 問を完走できる
 * - 1 問につき一度だけ採点される（連打しても安全）
 * - 結果画面に正答率・スコア・最大連続正解が出る
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { QUESTIONS_PER_GAME } from "../src/lib/config";

/** タイトル画面から Easy でゲームを開始する。 */
async function startEasyGame(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const button = screen.getByRole("button", { name: /Easy/ });
  await user.click(button);
}

/** 現在の問題のコードを取得する。 */
function currentCode(): string {
  return screen.getByLabelText("判定する TypeScript コード").textContent ?? "";
}

describe("App", () => {
  beforeEach(() => {
    // タイマーはテストでは進めない（時間切れの検証は game.test.ts で行う）。
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("タイトル画面に難易度が 3 つ表示される", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Easy/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Normal/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hard/ })).toBeInTheDocument();
  });

  it("難易度を選ぶとプレイ画面に進む", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startEasyGame(user);

    expect(screen.getByLabelText("判定する TypeScript コード")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /代入できる/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /代入できない/ })).toBeInTheDocument();
  });

  it("回答すると解説と正誤が表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startEasyGame(user);

    await user.click(screen.getByRole("button", { name: /代入できる/ }));

    expect(screen.getByLabelText("判定結果と解説")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /次の問題へ|結果を見る/ })).toBeInTheDocument();
  });

  it("回答後に二重クリックしても採点は一度だけ", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startEasyGame(user);

    const assignable = screen.getByRole("button", { name: /代入できる/ });
    await user.click(assignable);
    // 回答後はボタンが無効化されている
    expect(assignable).toBeDisabled();

    const notAssignable = screen.getByRole("button", { name: /代入できない/ });
    expect(notAssignable).toBeDisabled();

    // 解説は 1 つだけ
    expect(screen.getAllByLabelText("判定結果と解説")).toHaveLength(1);
  });

  it("キーボードだけで 10 問を完走できる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startEasyGame(user);

    const seen = new Set<string>();

    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      const code = currentCode();
      expect(seen.has(code), `${i + 1} 問目が重複しています`).toBe(false);
      seen.add(code);

      // 1 キーで「代入できる」を選ぶ
      await user.keyboard("1");
      expect(screen.getByLabelText("判定結果と解説")).toBeInTheDocument();

      // Enter で次へ（最後は結果画面へ）
      await user.keyboard("{Enter}");
    }

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });

    expect(seen.size).toBe(QUESTIONS_PER_GAME);
  });

  it("結果画面に正答数・正答率・スコア・最大連続正解が表示される", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startEasyGame(user);

    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      await user.keyboard("1");
      await user.keyboard("{Enter}");
    }

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
    await startEasyGame(user);

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "ポーズ中" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "ポーズ中" })).not.toBeInTheDocument();
  });

  it("結果画面から再挑戦できる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startEasyGame(user);

    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      await user.keyboard("1");
      await user.keyboard("{Enter}");
    }

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "もう一度挑戦" }));
    expect(screen.getByLabelText("判定する TypeScript コード")).toBeInTheDocument();
  });

  it("結果画面から難易度選択に戻れる", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startEasyGame(user);

    for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
      await user.keyboard("1");
      await user.keyboard("{Enter}");
    }

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "結果" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "難易度を選び直す" }));
    expect(screen.getByRole("button", { name: /Easy/ })).toBeInTheDocument();
  });

  it("ポーズ中は回答できない", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await startEasyGame(user);

    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /代入できる/ })).toBeDisabled();
  });
});
