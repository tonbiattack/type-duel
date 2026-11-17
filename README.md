# Type Duel

TypeScript の型を「読んで・予測して・判定する」短時間型パズルゲーム。

## コンセプト
- ブラウザだけで、インストールやログインなしですぐ遊べる
- 1問数秒〜数十秒。型の代入可否・推論結果・エラー原因を見抜く
- 正解後に短い理由を表示し、実務に役立つ型の理解を身につける
- キーボード操作、スマートフォン対応、GitHub Pages 公開

詳しい仕様は [docs/SPEC.md](docs/SPEC.md) を参照。

## 想定するモード
- **Duel（MVP）**: 型の代入可否を二択で判定
- **Infer**: 型推論の結果を選択
- **Detective**: 型エラーの原因を選択
- **Challenge（将来）**: `keyof`、Conditional Types、`infer` 等

## 開発方針
Vite + React + TypeScript を第一候補とする静的 SPA。バックエンド・ログインなし。
問題定義はデータ駆動とし、判定の正しさを TypeScript コンパイラのテストで担保する。

> 現在は仕様策定段階です。実装タスクは GitHub Issues を参照してください。
