# Type Duel

TypeScript の型を「読んで・予測して・判定する」短時間型パズルゲーム。

**公開URL: https://tonbiattack.github.io/type-duel/**

## コンセプト
- ブラウザだけで、インストールやログインなしですぐ遊べる
- 1問数秒〜数十秒。型の代入可否・推論結果・エラー原因を見抜く
- 正解後に短い理由を表示し、実務に役立つ型の理解を身につける
- キーボード操作、スマートフォン対応、GitHub Pages 公開

詳しい仕様は [docs/SPEC.md](docs/SPEC.md) を参照。

## 遊び方
1. タイトル画面で難易度（Easy / Normal / Hard）を選ぶ
2. `const result: B = value;` が型検査を通るかを「代入できる / 代入できない」で答える
3. 正誤と解説を確認して次へ。10 問終わると結果が表示される

| 操作 | キー |
| --- | --- |
| 回答 | `1` / `2` |
| 次の問題へ | `Enter` |
| ポーズ / 再開 | `Esc` |

スマートフォンでは画面の二択ボタンをタップする。

### スコア
- 正解: 100 点 + 残り秒数 × 5 点（端数切り捨て）
- 不正解・時間切れ: 0 点（連続正解はリセット）
- 制限時間は 1 問 15 秒

## 想定するモード
- **Duel（MVP・実装済み）**: 型の代入可否を二択で判定
- **Infer**: 型推論の結果を選択
- **Detective**: 型エラーの原因を選択
- **Challenge（将来）**: `keyof`、Conditional Types、`infer` 等

## ローカル開発

### 必要なもの
- Node.js 22 以上（`vite` / `vitest` の要件）
- npm

### セットアップ
```bash
npm install
```

### 開発サーバ
```bash
npm run dev
```
`http://localhost:5173/` で開く。

### スクリプト一覧

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバを起動 |
| `npm run build` | 型チェック + 本番ビルド（`dist/` を出力） |
| `npm run preview` | ビルド成果物をプレビュー（`http://localhost:4173/type-duel/`） |
| `npm run typecheck` | TypeScript の型チェック |
| `npm run lint` | ESLint |
| `npm run format` | Prettier で整形 |
| `npm run format:check` | 整形されているか確認 |
| `npm run test` | Vitest（1 回実行） |
| `npm run test:watch` | Vitest（ウォッチ） |
| `npm run verify` | typecheck → lint → test → build をまとめて実行 |

### 実ブラウザでの疎通確認（任意）
```bash
npm run build
npx vite preview --port 4173
# 別ターミナルで
node scripts/smoke.mjs
```
タイトル → 10 問プレイ → 結果画面までを Chromium で操作し、
コンソールエラーとモバイル幅の横スクロールを検査する。

## 問題を追加する

問題はデータファイルにだけ記述する。ロジックの変更は不要。

1. `src/data/questions/easy.ts` / `normal.ts` / `hard.ts` のいずれかに `duelQuestion(...)` を追加する
2. `assignable: true` なら「代入できる」、`false` なら「代入できない」が正答になる
3. `npm run test` を実行する

`tests/questions.test.ts` が TypeScript Compiler API で全問を型検査し、
`answer` と実際の判定結果が一致するかを検証する。誤った正答を書くとテストが落ちる。

```ts
duelQuestion({
  id: "easy-literal-to-string",       // 永続的に一意な kebab-case ID
  difficulty: "easy",
  topic: ["literal", "primitive"],    // 1 つ以上
  prompt: "リテラル型の値を string 型へ代入できるか？",
  code: `type A = "hello" | "world";
type B = string;

declare const value: A;
const result: B = value;`,
  assignable: true,
  explanation: "リテラル型は string の部分型です。",
}),
```

### 検証の仕組み
- コンパイラ設定は `strict` / `strictNullChecks` / `noEmit` を固定（`tests/questions.test.ts`）
- TypeScript のバージョンは `package-lock.json` で固定。バージョン更新で判定が変わると CI が検知する
- スキーマ検証（`src/lib/validate.ts`）が重複 ID・選択肢・解説の欠落を検出する
- 難易度ごとに最低 15 問、正答の二択が偏っていないことをテストで確認する

## 技術構成
- Vite + React + TypeScript（静的 SPA）
- 状態管理はクライアント内のみ。外部 API・サーバー・DB なし
- テスト: Vitest + Testing Library + TypeScript Compiler API
- スタイル: プレーン CSS（ダークテーマ、`prefers-reduced-motion` / `prefers-contrast` 対応）
- ビルド: `npm run build`、`base: "/type-duel/"`

### ディレクトリ構成
```
src/
  App.tsx                 画面遷移・タイマー・キーボード操作
  components/             UI コンポーネント
  data/questions/         問題データ（easy / normal / hard）
  lib/
    game.ts               ゲーム進行の純粋ロジック
    validate.ts           問題データのバリデーション
    highlight.ts          軽量シンタックスハイライト
    config.ts             スコア・制限時間などの設定値
  types/question.ts       Question 型と難易度定義
tests/                    ユニット・統合テスト
```

## CI / デプロイ
- `.github/workflows/ci.yml`: `main` への push と PR で format / typecheck / lint / test / build を実行
- `.github/workflows/deploy.yml`: `main` への push で GitHub Pages へデプロイ

### GitHub Pages の初回設定
リポジトリの **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** に設定する。以降は `main` への push で自動デプロイされる。

## ライセンス
未設定。
