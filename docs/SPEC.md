# Type Duel 仕様書（v0.2）

## 1. 目的・差別化
TypeScript の型を短時間で読み、型の代入可否・推論結果・エラー原因を判断するブラウザゲーム。
長い型実装を要求する従来の Type Challenges とは異なり、**瞬間的な判断 + 明快な解説 + 繰り返し遊べるテンポ**を重視する。
想定ユーザーは TS 初学者〜実務経験者。PC/スマートフォンで単独プレイ。

## 2. スコープ
### MVP（実装済み）
- Duel モード：与えられた TypeScript 断片に対して「代入できる / できない」を二択判定
- 各問の制限時間、スコア、連続正解、最終結果、リトライ
- 正誤確定後、簡潔な理由と補足説明を表示
- 難易度 Easy/Normal/Hard、初期問題集（各 15 問以上）
- 問題をシャッフルし、同一プレイ内で重複させない
- キーボード操作 + モバイルタップ、レスポンシブ、アクセシビリティ
- ビルド成果物を GitHub Pages に公開。ログイン/API/DB なし

### 拡張（実装済み）
- Infer：型推論結果を四択から選ぶ（`typeof`, `as const`, union など）
- Detective：型エラーの原因を四択で選ぶ
- モード選択 UI（タイトル画面でモード × 難易度を選ぶ）

### 拡張（未実装）
- Advanced：Generics, `keyof`, mapped types, conditional types, `infer`, template literal types
- タイムアタック/エンドレス/復習、問題拡充、ローカル記録

## 3. ゲームフロー
1. タイトル画面 → モード（Duel / Infer / Detective）と難易度を選ぶ
2. 開始と同時に 10 問を抽出（同一セット内に重複なし）
3. 問題文・TSコード・制限時間（初期 15 秒、調整可能）・進捗を表示
4. プレイヤーが回答、またはタイムアウト
5. 正誤・短い理由を表示。次へ進む（自動送りは初期オフ）
6. 10 問終了後、正答数・正答率・スコア・最大連続正解を表示 → 再挑戦

## 4. 判定仕様
### Duel
「`const target: B = valueOfTypeA` が型検査で通るか？」を問い、**AからBへの代入方向を常に明示**する。
- 正答は個々の問題データの `answer` に保持
- 原則、CI上で TypeScript のコンパイラ API により問題の正答を検証する
- `strict: true`, `strictNullChecks: true`, `noEmit: true` など共通設定を固定
- `any`, `never`, `unknown`, オブジェクト構造的型付け、optional、union/intersection などは検証用テストを用意
- TS バージョンを lockfile に固定し、将来のバージョン変更で結果が変わる場合は検知
- `as` による型アサーションを「代入可能」の抜け道として扱わない
- ユーザー入力コードの評価・実行は MVP では行わない

### Infer
「`const value = ...` から TypeScript が推論する型は何か？」を四択で問う。
- 正答は `expectedType` に `checker.typeToString` の出力と完全一致する形で保持
- CI で全問の推論結果をコンパイラと突き合わせる
- 誤答候補は「よくある勘違い」を誘う型（`string` と `"hello"`、`number[]` と `[1, 2]` など）
- 選択肢の並びは問題 ID から決定的に導き、テストと実行で一致させる

### Detective
「このコードがコンパイルエラーになる原因は何か？」を四択で問う。
- 正答は `expectedErrorCode`（診断コード）で検証する
- 修正例（`fix`）を併記し、そのコードがエラーを含まないことも CI で検証する
- エラーメッセージが正解の選択肢を直接漏らしていないことをテストで確認する
- null/undefined, union, excess property check, generics などを扱う

## 5. スコア・難易度
- 正解: 100 点 + 残り秒数 × 5 点（端数は切り捨て）
- 不正解/時間切れ: 0 点、コンボリセット
- 連続正解は表示のみ（MVPではスコア乗算なし）
- Easy: literal, primitive, union, array
- Normal: object, optional, readonly, unknown, never, tuple
- Hard: generic, conditional, indexed access, `keyof`, mapped types
※難易度区分は調整可能なデータ設定とする

## 6. 問題データモデル（例）
```ts
type QuestionBase = {
  id: string;
  mode: "duel" | "infer" | "detective";
  difficulty: "easy" | "normal" | "hard";
  topic: string[];
  prompt: string;
  code: string;
  choices: { id: string; label: string }[];
  answer: string; // choice id
  explanation: string;
  timeLimitSec?: number;
};

// モード固有の検証情報を持つ判別可能 union
type DuelQuestion = QuestionBase & { mode: "duel" };
type InferQuestion = QuestionBase & { mode: "infer"; expectedType: string };
type DetectiveQuestion = QuestionBase & {
  mode: "detective";
  expectedErrorCode: number;
  fix?: string;
};
type Question = DuelQuestion | InferQuestion | DetectiveQuestion;
```
問題 ID は永続的に一意、全選択肢に正答が存在し、回答は唯一。問題集を編集しやすい TS/JSON のデータファイルに分離する。
選択肢数はモードごとに固定する（Duel は 2、Infer / Detective は 4）。

### 具体例
```ts
type A = "hello" | "world";
type B = string;
declare const value: A;
const result: B = value;
```
正解: 代入できる。`A` の各リテラル型は `string` の部分型だから。

## 7. UI・操作
- 開始までのクリック数を最小化し、問題中に不要なモーダルを挟まない
- コードのシンタックスハイライト、十分な文字サイズ、タイマーの色・数値表示
- `1`〜`4` キーで選択、Enter で次へ、Esc でポーズ（ゲーム中のみ）
- 回答後に同じ問題への二重送信を防止
- モバイルは大きい回答ボタン。タップ誤爆防止
- 色だけで正誤を示さず、明示的な「正解/不正解」表示
- `prefers-reduced-motion` 配慮、キーボードフォーカスの可視化
- プレイ中のページリロードで初期状態に戻ってよい（MVP）

## 8. 技術構成
- Vite + React + TypeScript（静的SPA）
- 問題・ゲーム状態はクライアント内で管理。外部APIやサーバー不要
- 検証: Vitest + TypeScript Compiler API（問題セットの正答検証）
- UI: CSS / 自前の軽量ハイライト。大規模ゲームエンジンは不要
- ビルド: `npm run build`; CIで `typecheck`, `lint`, `test`, `build`
- GitHub Pages: `https://tonbiattack.github.io/type-duel/`; Vite `base: "/type-duel/"`
- GitHub Actions で `main` の変更をビルド・デプロイ
- 解析、ランキング、アカウント、サーバー側保存は対象外

## 9. 受け入れ条件
### MVP（Duel）
- [x] PC/スマートフォンのブラウザで10問プレイを完走できる
- [x] 1問につき一度だけ採点される（時間切れや連打も安全）
- [x] 難易度別に最低15問、同一回で重複なし
- [x] 問題の正答と解説が一致し、検証テストがCIで成功する
- [x] キーボードだけでゲームを進行できる
- [x] 結果画面に正答率・スコア・最大連続正解を表示
- [x] Pages の公開URLから直接読み込んで遊べる
- [x] ブラウザのコンソールに重大なエラーがない

### 拡張（Infer / Detective）
- [x] Duel と独立に10問遊べる
- [x] 正解・解説・スコアが機能する
- [x] 推論結果・診断コードがコンパイラの出力と一致する
- [x] モード選択 UI から開始できる
- [x] 難易度別に10問以上、同一回で重複なし

## 10. 開発順序
基盤/UI → 問題スキーマ・検証 → Duel ループ → 問題拡充 → テスト/操作性 → Pages 公開 → 新モード。
