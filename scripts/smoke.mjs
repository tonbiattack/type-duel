/**
 * 実ブラウザでの疎通確認スクリプト（開発時の手動検証用）。
 *
 * 使い方:
 *   1. `npm run build && npx vite preview --port 4173` を起動
 *   2. `node scripts/smoke.mjs`
 *
 * 3 モード × 3 遊びかたを実際の Chromium で操作し、
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

/** Advanced を 1 問だけ解いて段階解説を確認する。 */
async function checkAdvanced() {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const card = page.locator("article.mode-duel");
  await card.locator("details.mode-advanced summary").click();
  await card.locator('button[data-difficulty="advanced"]').click();
  await page.waitForSelector(".code-block");

  await page.keyboard.press("1");
  await page.waitForSelector(".explanation");

  const steps = await page.locator(".step").count();
  if (steps < 2) {
    fail(`Advanced の段階解説が ${steps} ステップです`);
  }
  await page.getByRole("button", { name: "まとめて表示" }).click();
  const open = await page.locator(".step.is-open").count();
  if (open !== steps) {
    fail(`まとめて表示で ${open} / ${steps} ステップしか開きません`);
  }
  console.log(`OK: Advanced 段階解説 ${steps} ステップ`);
}

/** タイムアタックを開始して自動送りを確認する。 */
async function checkTimeAttack() {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.locator(".format-timeattack").click();
  await page.waitForSelector(".code-block");

  const before = await page.locator(".code-block").textContent();
  await page.keyboard.press("1");
  await page.waitForFunction(
    (previous) => {
      const current = document.querySelector(".code-block")?.textContent;
      return current !== undefined && current !== previous;
    },
    before,
    { timeout: 5000 },
  );
  console.log("OK: タイムアタックの自動送り");
}

/** 復習画面が開けることを確認する。 */
async function checkReview() {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.locator(".format-review").click();
  await page.waitForSelector(".screen-review");
  const heading = await page.locator(".review-title").textContent();
  if (heading !== "復習") {
    fail(`復習画面の見出しが "${String(heading)}" です`);
  }
  console.log("OK: 復習画面");
}

try {
  for (const mode of ["duel", "infer", "detective"]) {
    await playMode(mode);
  }
  await checkAdvanced();
  await checkTimeAttack();
  await checkReview();

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
