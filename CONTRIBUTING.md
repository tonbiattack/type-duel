# コントリビュートガイド

Type Duel への関心ありがとうございます。Issue・Pull Request を歓迎します。

## 開発の流れ

1. リポジトリを fork する
2. 作業ブランチを切る（`feat/add-hard-questions` など）
3. 変更を加える
4. `npm run verify` が通ることを確認する
5. Pull Request を作成する

```bash
git clone https://github.com/<your-name>/type-duel.git
cd type-duel
npm install
git switch -c feat/your-change
```

## 送る前のチェック

```bash
npm run verify   # typecheck → lint → test → build
```

個別に実行する場合:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

整形は `npm run format` で自動修正できます。

## 問題を追加する場合

問題の追加は**データファイルの編集だけで完結**します。ロジックの変更は不要です。

| モード    | ファイル                                   | ヘルパー            |
| --------- | ------------------------------------------ | ------------------- |
| Duel      | `src/data/questions/{easy,normal,hard}.ts` | `duelQuestion`      |
| Infer     | `src/data/questions/infer.ts`              | `inferQuestion`     |
| Detective | `src/data/questions/detective.ts`          | `detectiveQuestion` |

### 守ってほしいこと

- **ID は永続的に一意**な kebab-case（例: `easy-literal-to-string`）
- **解説は「なぜそうなるか」を書く** — 正解の言い換えだけにしない
- **トピックタグを 1 つ以上**付ける
- **正解位置が偏らないようにする** — 追加後に `npm run test` で偏りを検査します

### 正答の検証について

`tests/questions.test.ts` が TypeScript Compiler API で全問を検証します。

| モード    | 検証内容                                                            |
| --------- | ------------------------------------------------------------------- |
| Duel      | `const result: B = value;` の型検査結果が `assignable` と一致するか |
| Infer     | `checker.typeToString` の出力が `expectedType` と完全一致するか     |
| Detective | 期待する診断コードが出るか、修正例がエラーを含まないか              |

コンパイラが実際に何を返すかは、次のコマンドで確認できます。

```bash
node scripts/inspect.mjs infer 'const value = "hello";'
# => value: "hello"

node scripts/inspect.mjs diag 'const value: string = null;'
# => TS2322: Type 'null' is not assignable to type 'string'.
```

### コンパイラ設定は固定です

問題の正答は `strict` / `strictNullChecks` / `noEmit` を固定した設定で判定します。
TypeScript のバージョンは `package-lock.json` で固定しており、更新で判定結果が変わると
CI が検知します。バージョンを上げる場合は、全問の検証が通ることを確認してください。

## コードを変更する場合

### 設計方針

- **ゲーム進行は純粋関数で** — `src/lib/game.ts` に状態遷移を集約し、React に依存させません。境界条件を UI を介さずテストできます。
- **問題データはスキーマで守る** — モード別の判別可能 union と実行時バリデーションの二段構えです。
- **選択肢と正答をずらさない** — ヘルパー関数が正解の選択肢 ID を解決します。

### テスト

- ロジックの変更にはテストを添えてください
- バグ修正は、まず失敗するテストを書いてから直すと確実です
- UI の変更は `tests/app.test.tsx` の統合テストで確認できます

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/ja/) に近い形式を使っています。

```
feat: Infer モードを追加
fix: 時間切れ時に二重採点される問題を修正
docs: README にスクリーンショットを追加
test: Detective の修正例検証を追加
chore: 依存関係を更新
```

## Pull Request

以下を含めてください。

- **何を変えたか** と **なぜ変えたか**
- 関連する Issue 番号（`Closes #12`）
- 確認した内容（`npm run verify` の結果など）
- UI の変更なら、可能であればスクリーンショット

レビューでは以下を見ます。

- 正答データがコンパイラの挙動と一致しているか
- 解説が技術的に正確か
- キーボード操作とモバイル表示が壊れていないか
- アクセシビリティ（色だけに依存しない、フォーカス可視化）が保たれているか

## 行動規範

お互いを尊重してください。技術的な指摘は歓迎ですが、人ではなくコードに向けてください。

## ライセンス

コントリビュートされた内容は [MIT License](LICENSE) の下で公開されることに同意したものとみなします。
