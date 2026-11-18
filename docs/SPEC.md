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
- Advanced 難易度：複数の型機能が絡み合う複合問題（各モード 10 問以上）
- 段階解説：型の評価順序を 1 ステップずつ追える（任意項目）
- 60 秒タイムアタック：回答後は自動で次へ、自己ベストをローカル保存
- 復習モード：間違えた問題をトピック別に解き直す（制限時間なし）
- 問題 300 問以上（36 トピック）

### 拡張（未実装）
- エンドレスモード
- 問題のさらなる拡充

## 3. ゲームフロー
1. タイトル画面 → 遊びかた（10問チャレンジ / タイムアタック / 復習）を選ぶ
2. 10問チャレンジではモード（Duel / Infer / Detective）と難易度を選ぶ
3. 開始と同時に 10 問を抽出（同一セット内に重複なし、直近出題を優先的に避ける）
4. 問題文・TSコード・制限時間（初期 15 秒、調整可能）・進捗を表示
5. プレイヤーが回答、またはタイムアウト
6. 正誤・短い理由を表示。次へ進む（自動送りは初期オフ）
7. 10 問終了後、正答数・正答率・スコア・最大連続正解を表示 → 再挑戦

### タイムアタックのフロー
1. 60 秒のタイマーで開始
2. 回答すると正誤だけを短く表示し、自動で次の問題へ（Enter 不要）
3. 60 秒経過で即終了
4. 結果画面でスコア・正解数・正答率・最大連続・平均回答時間・自己ベストを表示
5. 解説は結果画面からまとめて確認できる

### 復習のフロー
1. 復習画面で学習状況とトピック別の苦手度を確認
2. 「苦手な問題をまとめて復習」またはトピックを選んで開始
3. 制限時間なしで解き、解説・修正例を読み直せる
4. 2 回連続正解すると「克服済み」として復習対象から外れる

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
### 10問チャレンジ / 復習
- 正解: 100 点 + 残り秒数 × 5 点（端数は切り捨て）
- 不正解/時間切れ: 0 点、コンボリセット
- 連続正解は表示のみ（スコア乗算なし）

### 60秒タイムアタック
- 正解: 100 点 + 連続正解 × 20 点（最大 5 連続まで加算）
- 不正解: -50 点（スコアは 0 未満にならない）
- 自己ベスト（スコア・正解数・最大連続）を localStorage に保存

### 難易度
- Easy: literal, primitive, union, array
- Normal: object, optional, readonly, unknown, never, tuple
- Hard: generic, conditional, indexed access, `keyof`, mapped types
- Advanced: 複数の型機能が絡み合う複合問題
  - 分配条件型 × union × never
  - generic constraints × inference × keyof / indexed access
  - mapped types × optional / readonly 修飾子
  - template literal types × union
  - intersection × never
  - unknown / any / never の境界ケース
- Advanced は上級者向けなので、タイトル画面では折りたたむ（初期選択を複雑にしない）
- 難問は `timeLimitSec` で個別に制限時間を設定できる
※難易度区分は調整可能なデータ設定とする

### タイムアタックの出題対象
テンポを守るため、以下は自動で除外する。
- Advanced 難易度
- コードが 8 行 / 220 文字を超える問題
- `timeAttackEligible` で個別に制御可能

## 6. 問題データモデル（例）
```ts
type ExplanationStep = {
  title: string;      // ステップの見出し
  body: string;       // 何がどう変わるか
  typeAfter?: string; // このステップ後の型
};

type QuestionBase = {
  id: string;
  mode: "duel" | "infer" | "detective";
  difficulty: "easy" | "normal" | "hard" | "advanced";
  topic: string[];
  prompt: string;
  code: string;
  choices: { id: string; label: string }[];
  answer: string; // choice id
  explanation: string;
  explanationSteps?: ExplanationStep[]; // 段階解説（任意）
  timeLimitSec?: number;
  timeAttackEligible?: boolean;
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
段階解説は任意項目で、短い `explanation` だけでも問題は成立する。

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
- 学習記録は localStorage に保存（壊れたデータ・容量超過でもプレイを止めない）
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

### Advanced 難易度
- [x] 全問が固定 TypeScript バージョンの Compiler API 検証に通る
- [x] Duel / Infer / Detective それぞれ 10 問以上の Advanced を出せる
- [x] 合計 30 問以上ある
- [x] 難易度を上げてもコードの可読性を確保する（無意味な長文化を避ける）
- [x] コンパイラ依存の表記差・実装依存・答え漏れをチェックする

### 問題拡充
- [x] 設問総数が 300 問以上
- [x] 全問の検証が CI で通る
- [x] 同一プレイ内の重複ゼロ、複数プレイ間は未出題優先
- [x] モード × 難易度の内訳とトピック分布を集計できる
- [x] トピックの偏りが極端でない（最多トピックが全体の 30% 未満）

### 60秒タイムアタック
- [x] 60 秒で自動終了し、直ちに再挑戦できる
- [x] 回答後に Enter 不要で自動的に次問へ進む
- [x] キーボードとスマホの双方でテンポ良く回答できる
- [x] 既存 10 問モードの挙動を壊さない
- [x] タイマー・連打・境界値のテストがある
- [x] 連続正解数・正答率・回答数・ベスト記録を表示（ローカル保存）
- [x] 正解後の解説は結果画面からまとめて確認できる

### 復習
- [x] 問題 ID・トピック単位で正誤と回答時間をローカル保存
- [x] 間違えた問題だけを解く復習モードがある
- [x] トピック別に出題できる
- [x] 復習では時間制限をオフにできる
- [x] 苦手問題の解消判定（2 連続正解で克服）がある
- [x] localStorage 消去・破損時も通常プレイに影響しない
- [x] 既存の 10 問モードを維持する

### 段階解説
- [x] 問題データに任意の解説ステップを定義できる
- [x] 1 ステップずつ開く UI と「まとめて表示」がある
- [x] 既存の短い解説も維持する
- [x] 解説を読まずに次問へ進める
- [x] タイムアタックのテンポに干渉しない
- [x] Advanced / Hard の 20 問以上に段階解説を付与

## 10. 開発順序
基盤/UI → 問題スキーマ・検証 → Duel ループ → 問題拡充 → テスト/操作性 → Pages 公開 → 新モード → Advanced・タイムアタック・復習。
