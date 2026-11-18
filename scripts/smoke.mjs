/**
 * 実ブラウザでの疎通確認スクリプト（開発時の手動検証用）。
 *
 * 使い方:
 *   1. `npm run build && npx vite preview --port 4173` を起動
 *   2. `node scripts/smoke.mjs`
 *
 * 3 モードすべてで タイトル → 10 問プレイ → 結果画面 を実際の Chromium で操作し、
 * コンソールエラーとモバイル幅の横スクロールを検査する。
 */
import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_URL ?? "http://localhost:4173/type-duel/";
const QUESTIONS_PER_GAME = 10;

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

/** 1 モードを 10 問プレイして結果画面まで進む。 */
async function playMode(mode, difficulty = "easy") {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  const title = await page.locator("h1.title-logo").textContent();
  if (!title || !title.includes("Type")) {
    fail(`タイトルが表示されません: ${String(title)}`);
  }

  await page.locator(`article.mode-${mode} button[data-difficulty="${difficulty}"]`).click();
  await page.waitForSelector(".code-block");

  const choiceCount = await page.locator(".choice").count();
  const expectedChoices = mode === "duel" ? 2 : 4;
  if (choiceCount !== expectedChoices) {
    fail(`${mode}: 選択肢が ${choiceCount} 個です（期待: ${expectedChoices}）`);
  }

  for (let i = 0; i < QUESTIONS_PER_GAME; i += 1) {
    const progress = await page.locator(".play-progress strong").textContent();
    if (progress !== String(i + 1)) {
      fail(`${mode}: ${i + 1} 問目の進捗表示が "${String(progress)}" になっています`);
    }
    await page.keyboard.press("1");
    await page.waitForSelector(".explanation");
    await page.keyboard.press("Enter");
  }

  await page.waitForSelector(".screen-result", { timeout: 5000 });
  const score = await page.locator(".stat-score dd").textContent();
  const accuracy = await page.locator(".stat", { hasText: "正答率" }).locator("dd").textContent();
  console.log(`OK: ${mode} 完走 スコア=${score} 正答率=${accuracy}`);
}

try {
  for (const mode of ["duel", "infer", "detective"]) {
    await playMode(mode);
  }

  // モバイル幅でも崩れないか
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.locator('article.mode-infer button[data-difficulty="normal"]').click();
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
