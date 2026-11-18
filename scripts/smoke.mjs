/**
 * 実ブラウザでの疎通確認スクリプト（開発時の手動検証用）。
 *
 * 使い方:
 *   1. `npm run build && npx vite preview --port 4173` を起動
 *   2. `node scripts/smoke.mjs`
 *
 * タイトル → 10 問プレイ → 結果画面までを実際の Chromium で操作し、
 * コンソールエラーが出ないことを確認する。
 */
import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL ?? "http://localhost:4173/type-duel/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});
page.on("pageerror", (error) => {
  consoleErrors.push(`pageerror: ${error.message}`);
});

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

try {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // タイトル画面
  const title = await page.locator("h1.title-logo").textContent();
  if (!title || !title.includes("Type")) {
    fail(`タイトルが表示されません: ${String(title)}`);
  }
  console.log(`OK: タイトル "${title?.trim()}"`);

  // Easy で開始
  await page.getByRole("button", { name: /Easy/ }).click();
  await page.waitForSelector(".code-block");
  console.log("OK: プレイ画面へ遷移");

  // 10 問をキーボードだけで完走
  for (let i = 0; i < 10; i += 1) {
    const progress = await page.locator(".play-progress strong").textContent();
    if (progress !== String(i + 1)) {
      fail(`${i + 1} 問目の進捗表示が "${String(progress)}" になっています`);
    }
    await page.keyboard.press("1");
    await page.waitForSelector(".explanation");
    await page.keyboard.press("Enter");
  }

  // 結果画面
  await page.waitForSelector(".screen-result", { timeout: 5000 });
  const score = await page.locator(".stat-score dd").textContent();
  const accuracy = await page.locator(".stat", { hasText: "正答率" }).locator("dd").textContent();
  const maxStreak = await page
    .locator(".stat", { hasText: "最大連続正解" })
    .locator("dd")
    .textContent();
  console.log(`OK: 結果画面 スコア=${score} 正答率=${accuracy} 最大連続=${maxStreak}`);

  // モバイル幅でも崩れないか
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "もう一度挑戦" }).click();
  await page.waitForSelector(".code-block");
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  });
  if (overflow) {
    fail("モバイル幅で横スクロールが発生しています");
  }
  console.log("OK: モバイル幅で横スクロールなし");

  if (consoleErrors.length > 0) {
    fail(`コンソールエラー: ${consoleErrors.join(" | ")}`);
  } else {
    console.log("OK: コンソールエラーなし");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
}
