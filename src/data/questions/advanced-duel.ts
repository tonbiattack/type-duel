/**
 * Advanced 問題集（Duel）: 複数の型機能が絡み合う複合問題。
 *
 * 単にコードを長くするのではなく、型の評価順序を追わないと
 * 結論が出ない組み合わせを扱う。各問に段階解説を付け、
 * 「どの順番で型が評価されるか」を追えるようにする。
 *
 * 期待結果は `tests/questions.test.ts` が TypeScript Compiler API で検証する。
 */
import type { DuelQuestion } from "../../types/question";
import { duelQuestion } from "./shared";

export const advancedDuelQuestions: readonly DuelQuestion[] = [
  duelQuestion({
    id: "adv-duel-distributive-union-all-string",
    difficulty: "advanced",
    topic: ["conditional", "distributive", "union"],
    prompt: "分配条件型の結果を true 型へ代入できるか？",
    code: `type IsString<T> = T extends string ? true : false;
type A = IsString<"a" | "b">;
type B = true;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '条件型は union に分配されます。"a" も "b" も string の部分型なので、両方 true に解決され、A は true になります。',
    explanationSteps: [
      {
        title: "条件型を分配する",
        body: '`IsString<"a" | "b">` は union に分配され、`IsString<"a"> | IsString<"b">` になります。',
        typeAfter: `IsString<"a"> | IsString<"b">`,
      },
      {
        title: "各メンバーを評価する",
        body: '`"a" extends string` も `"b" extends string` も真なので、それぞれ `true` に解決されます。',
        typeAfter: "true | true",
      },
      {
        title: "union を畳む",
        body: "`true | true` は `true` に畳まれます。A は `true` なので B へ代入できます。",
        typeAfter: "true",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-distributive-union-mixed",
    difficulty: "advanced",
    topic: ["conditional", "distributive", "union"],
    prompt: "分配条件型の結果を true 型へ代入できるか？",
    code: `type IsString<T> = T extends string ? true : false;
type A = IsString<"a" | 1>;
type B = true;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      '分配すると `IsString<"a"> | IsString<1>`、つまり `true | false` = boolean になります。boolean は true に代入できません。',
    explanationSteps: [
      {
        title: "条件型を分配する",
        body: '`IsString<"a" | 1>` は `IsString<"a"> | IsString<1>` に分配されます。',
        typeAfter: `IsString<"a"> | IsString<1>`,
      },
      {
        title: "各メンバーを評価する",
        body: '`"a"` は string なので `true`、`1` は string ではないので `false` になります。',
        typeAfter: "true | false",
      },
      {
        title: "union を畳む",
        body: "`true | false` は `boolean` です。B は `true` だけを要求するため代入できません。",
        typeAfter: "boolean",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-distributive-array-union",
    difficulty: "advanced",
    topic: ["conditional", "distributive", "array"],
    prompt: "分配条件型で作った配列 union を、要素 union の配列へ代入できるか？",
    code: `type Distribute<T> = T extends unknown ? T[] : never;
type A = Distribute<"a" | "b">;
type B = "a"[] | "b"[];

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation: '分配により A は `"a"[] | "b"[]` になります。B と同一の型なので代入できます。',
    explanationSteps: [
      {
        title: "分配する",
        body: '`Distribute<"a" | "b">` は `Distribute<"a"> | Distribute<"b">` になります。',
        typeAfter: `Distribute<"a"> | Distribute<"b">`,
      },
      {
        title: "各メンバーを評価する",
        body: '`T extends unknown` は常に真なので、それぞれ `"a"[]` と `"b"[]` になります。',
        typeAfter: `"a"[] | "b"[]`,
      },
      {
        title: "B と比較する",
        body: "A と B は同じ union なので代入できます。",
        typeAfter: `"a"[] | "b"[]`,
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-distributive-array-to-element-union",
    difficulty: "advanced",
    topic: ["conditional", "distributive", "array"],
    prompt: "配列 union を、要素 union の配列へ代入できるか？",
    code: `type Distribute<T> = T extends unknown ? T[] : never;
type A = Distribute<"a" | "b">;
type B = ("a" | "b")[];

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'A は `"a"[] | "b"[]`、B は `("a" | "b")[]` です。各メンバーは B の部分型なので、union 全体として代入できます。',
    explanationSteps: [
      {
        title: "A を展開する",
        body: '分配により A は `"a"[] | "b"[]` です。',
        typeAfter: `"a"[] | "b"[]`,
      },
      {
        title: "各メンバーが B に含まれるか見る",
        body: '`"a"[]` も `"b"[]` も `("a" | "b")[]` の部分型です。',
        typeAfter: `"a"[] | "b"[] ⊂ ("a" | "b")[]`,
      },
      {
        title: "union 全体で判定する",
        body: "すべてのメンバーが B に代入可能なので、A → B は通ります。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-keyof-to-union",
    difficulty: "advanced",
    topic: ["keyof", "generic"],
    prompt: "ジェネリック経由の keyof を、リテラル union へ代入できるか？",
    code: `type Keys<T> = keyof T;
type A = Keys<{ a: 1; b: 2 }>;
type B = "a" | "b";

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '`Keys<{ a: 1; b: 2 }>` は `keyof { a: 1; b: 2 }`、つまり `"a" | "b"` です。B と同一なので代入できます。',
    explanationSteps: [
      {
        title: "型引数を当てはめる",
        body: "`Keys<T>` の T に `{ a: 1; b: 2 }` を入れると `keyof { a: 1; b: 2 }` になります。",
        typeAfter: "keyof { a: 1; b: 2 }",
      },
      {
        title: "keyof を評価する",
        body: '`keyof` はプロパティ名の union を返すので `"a" | "b"` です。',
        typeAfter: `"a" | "b"`,
      },
      {
        title: "B と比較する",
        body: "A と B は同じ union なので代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-indexed-access-values",
    difficulty: "advanced",
    topic: ["indexed access", "keyof", "generic"],
    prompt: "keyof を使った indexed access の結果を、値の union へ代入できるか？",
    code: `type Values<T> = T[keyof T];
type A = Values<{ a: 1; b: 2 }>;
type B = 1 | 2;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`T[keyof T]` は全プロパティの値の union です。`{ a: 1; b: 2 }` なら `1 | 2` になり、B と一致します。",
    explanationSteps: [
      {
        title: "keyof を評価する",
        body: '`keyof { a: 1; b: 2 }` は `"a" | "b"` です。',
        typeAfter: `"a" | "b"`,
      },
      {
        title: "indexed access を評価する",
        body: '`{ a: 1; b: 2 }["a" | "b"]` は各プロパティの値の union になります。',
        typeAfter: "1 | 2",
      },
      {
        title: "B と比較する",
        body: "A と B は同じ union なので代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-mapped-remove-readonly",
    difficulty: "advanced",
    topic: ["mapped types", "readonly"],
    prompt: "readonly を外す mapped type の結果を、書き換え可能な型へ代入できるか？",
    code: `type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type A = Mutable<{ readonly a: 1 }>;
type B = { a: 1 };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`-readonly` は readonly 修飾子を取り除きます。A は `{ a: 1 }` になり、B と一致します。",
    explanationSteps: [
      {
        title: "keyof を評価する",
        body: '`keyof { readonly a: 1 }` は `"a"` です。',
        typeAfter: `"a"`,
      },
      {
        title: "修飾子を外して写像する",
        body: '`-readonly` により readonly が外れ、`{ a: T["a"] }` になります。',
        typeAfter: "{ a: 1 }",
      },
      {
        title: "B と比較する",
        body: "A と B は同じ型なので代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-mapped-optional",
    difficulty: "advanced",
    topic: ["mapped types", "optional"],
    prompt: "全プロパティを省略可能にする mapped type の結果を、省略可能な型へ代入できるか？",
    code: `type Optional<T> = { [K in keyof T]?: T[K] };
type A = Optional<{ a: 1 }>;
type B = { a?: 1 };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`?` を付けた mapped type は全プロパティを省略可能にします。A は `{ a?: 1 }` になり、B と一致します。",
    explanationSteps: [
      {
        title: "keyof を評価する",
        body: '`keyof { a: 1 }` は `"a"` です。',
        typeAfter: `"a"`,
      },
      {
        title: "省略可能にして写像する",
        body: "`[K in keyof T]?: T[K]` により `{ a?: 1 }` になります。",
        typeAfter: "{ a?: 1 }",
      },
      {
        title: "B と比較する",
        body: "A と B は同じ型なので代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-template-literal-union",
    difficulty: "advanced",
    topic: ["template literal", "union"],
    prompt: "テンプレートリテラル型の展開結果を、リテラル union へ代入できるか？",
    code: `type A = \`a\${"b" | "c"}\`;
type B = "ab" | "ac";

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'テンプレートリテラル型は union を分配して展開します。`a` + `"b"` と `a` + `"c"` で `"ab" | "ac"` になります。',
    explanationSteps: [
      {
        title: "union を分配する",
        body: "テンプレートリテラル型の `${...}` に union を入れると、各メンバーで展開されます。",
        typeAfter: `"ab" | "ac"`,
      },
      {
        title: "B と比較する",
        body: "A と B は同じ union なので代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-template-literal-to-string",
    difficulty: "advanced",
    topic: ["template literal", "primitive"],
    prompt: "テンプレートリテラル型の展開結果を string 型へ代入できるか？",
    code: `type A = \`a\${"b" | "c"}\`;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'A は `"ab" | "ac"` に展開されます。各要素は string の部分型なので、string へ代入できます。',
    explanationSteps: [
      {
        title: "union を分配する",
        body: '`${...}` の union が展開され、A は `"ab" | "ac"` になります。',
        typeAfter: `"ab" | "ac"`,
      },
      {
        title: "string との関係を見る",
        body: "文字列リテラル型は string の部分型です。",
        typeAfter: `"ab" | "ac" ⊂ string`,
      },
      {
        title: "代入可否を判定する",
        body: "すべてのメンバーが string に含まれるので、A → B は通ります。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-never-conditional",
    difficulty: "advanced",
    topic: ["conditional", "never"],
    prompt: "never を条件型の対象にした結果を、true 型へ代入できるか？",
    code: `type A = never extends string ? true : false;
type B = true;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`never` は分配すると空の union になります。分配条件型の結果も `never` になり、never はすべての型の部分型なので true へ代入できます。",
    explanationSteps: [
      {
        title: "分配の対象を確認する",
        body: "`never` は「値が存在しない」型です。分配条件型では空の union として扱われます。",
        typeAfter: "never",
      },
      {
        title: "条件型を評価する",
        body: "分配するメンバーがないため、結果は `never` になります。",
        typeAfter: "never",
      },
      {
        title: "never の代入可否",
        body: "`never` はすべての型の部分型なので、`true` へ代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-tuple-never-check",
    difficulty: "advanced",
    topic: ["conditional", "never", "tuple"],
    prompt: "タプルで包んだ never 判定の結果を、false 型へ代入できるか？",
    code: `type A = [string] extends [never] ? true : false;
type B = false;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`[string]` は `[never]` の部分型ではありません。タプルで包むと分配が起きないため、条件は偽と評価され A は false になります。",
    explanationSteps: [
      {
        title: "分配を避ける理由",
        body: "裸の型パラメータだと分配されますが、`[T]` のようにタプルで包むと分配されません。",
        typeAfter: "[string] extends [never]",
      },
      {
        title: "条件を評価する",
        body: "`[string]` は `[never]` に代入できないため、条件は偽です。",
        typeAfter: "false",
      },
      {
        title: "B と比較する",
        body: "A は `false` なので B へ代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-unknown-conditional",
    difficulty: "advanced",
    topic: ["conditional", "unknown"],
    prompt: "unknown を条件型の対象にした結果を、false 型へ代入できるか？",
    code: `type A = unknown extends string ? true : false;
type B = false;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`unknown` は string の上位型なので `unknown extends string` は偽です。A は false になり、B へ代入できます。",
    explanationSteps: [
      {
        title: "unknown の位置を確認する",
        body: "`unknown` はすべての型の上位型です。string より広い型なので条件は成立しません。",
      },
      {
        title: "条件を評価する",
        body: "`unknown extends string` は偽なので A は `false` です。",
        typeAfter: "false",
      },
      {
        title: "B と比較する",
        body: "A は `false` なので B へ代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-any-conditional",
    difficulty: "advanced",
    topic: ["conditional", "any"],
    prompt: "any を条件型の対象にした結果を、boolean 型へ代入できるか？",
    code: `type A = any extends string ? true : false;
type B = boolean;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`any` を条件型に使うと、真と偽の両方の結果が union されます。A は `true | false` = boolean になり、B へ代入できます。",
    explanationSteps: [
      {
        title: "any の特殊な扱い",
        body: "`any` は条件型で「どちらにもなり得る」ため、両方の分岐が結果に含まれます。",
      },
      {
        title: "両方の分岐を union する",
        body: "真の分岐 `true` と偽の分岐 `false` が union されます。",
        typeAfter: "true | false",
      },
      {
        title: "boolean と比較する",
        body: "`true | false` は `boolean` なので B へ代入できます。",
        typeAfter: "boolean",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-intersection-object",
    difficulty: "advanced",
    topic: ["intersection", "object"],
    prompt: "交差型を、プロパティを合成した型へ代入できるか？",
    code: `type A = { a: 1 } & { b: 2 };
type B = { a: 1; b: 2 };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "交差型 `A & B` は両方のプロパティを持つ型として扱われます。`{ a: 1; b: 2 }` と互換なので代入できます。",
    explanationSteps: [
      {
        title: "交差型を読む",
        body: "`{ a: 1 } & { b: 2 }` は両方の制約を同時に満たす型です。",
        typeAfter: "{ a: 1 } & { b: 2 }",
      },
      {
        title: "プロパティを合成する",
        body: "構造としては `{ a: 1; b: 2 }` と同じプロパティ集合になります。",
        typeAfter: "{ a: 1; b: 2 }",
      },
      {
        title: "B と比較する",
        body: "A は B の部分型なので代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-intersection-conflict",
    difficulty: "advanced",
    topic: ["intersection", "never"],
    prompt: "矛盾するプロパティを持つ交差型を、never プロパティの型へ代入できるか？",
    code: `type A = { a: 1 } & { a: 2 };
type B = { a: never };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "同じプロパティに互換性のない型を交差させると、そのプロパティは `never` になります。A は `{ a: never }` と同義なので B へ代入できます。",
    explanationSteps: [
      {
        title: "プロパティの交差を取る",
        body: "`a` は `1 & 2` になります。互換性のないリテラル同士の交差は `never` です。",
        typeAfter: "{ a: never }",
      },
      {
        title: "B と比較する",
        body: "A は `{ a: never }` と同義なので B へ代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-exclude-union",
    difficulty: "advanced",
    topic: ["conditional", "union", "utility"],
    prompt: "Exclude で除外した結果を、残りの union へ代入できるか？",
    code: `type A = Exclude<"a" | "b" | "c", "a">;
type B = "b" | "c";

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '`Exclude<T, U>` は T から U に代入可能なメンバーを取り除きます。`"a"` が除かれ、A は `"b" | "c"` になります。',
    explanationSteps: [
      {
        title: "Exclude の定義を思い出す",
        body: "`Exclude<T, U> = T extends U ? never : T` です。分配条件型で実装されています。",
      },
      {
        title: "各メンバーを評価する",
        body: '`"a"` は `"a"` に代入可能なので `never`、`"b"` と `"c"` は残ります。',
        typeAfter: `never | "b" | "c"`,
      },
      {
        title: "never を畳む",
        body: 'union の `never` は消えるので A は `"b" | "c"` です。',
        typeAfter: `"b" | "c"`,
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-extract-union",
    difficulty: "advanced",
    topic: ["conditional", "union", "utility"],
    prompt: "Extract で抽出した結果を、抽出されたリテラル型へ代入できるか？",
    code: `type A = Extract<"a" | 1 | true, string>;
type B = "a";

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '`Extract<T, U>` は T のうち U に代入可能なメンバーだけを残します。string に含まれるのは `"a"` だけなので A は `"a"` です。',
    explanationSteps: [
      {
        title: "Extract の定義を思い出す",
        body: "`Extract<T, U> = T extends U ? T : never` です。",
      },
      {
        title: "各メンバーを評価する",
        body: '`"a"` は string に代入可能なので残り、`1` と `true` は `never` になります。',
        typeAfter: `"a" | never | never`,
      },
      {
        title: "never を畳む",
        body: 'A は `"a"` になり、B へ代入できます。',
        typeAfter: `"a"`,
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-mapped-key-value",
    difficulty: "advanced",
    topic: ["mapped types", "keyof"],
    prompt: "キーを値に持つ mapped type を、リテラル型のプロパティへ代入できるか？",
    code: `type A = { [K in "a" | "b"]: K };
type B = { a: "a"; b: "b" };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'mapped type の `K` は各キーのリテラル型です。A は `{ a: "a"; b: "b" }` になり、B と一致します。',
    explanationSteps: [
      {
        title: "K を各キーで評価する",
        body: '`K in "a" | "b"` により、`a` のとき K は `"a"`、`b` のとき K は `"b"` です。',
        typeAfter: `{ a: "a"; b: "b" }`,
      },
      {
        title: "B と比較する",
        body: "A と B は同じ型なので代入できます。",
      },
    ],
  }),
  duelQuestion({
    id: "adv-duel-mapped-key-to-string",
    difficulty: "advanced",
    topic: ["mapped types", "keyof"],
    prompt: "キーを値に持つ mapped type を、string プロパティの型へ代入できるか？",
    code: `type A = { [K in "a" | "b"]: K };
type B = { a: string; b: string };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'A は `{ a: "a"; b: "b" }` です。各プロパティは string の部分型なので、string を要求する B へ代入できます。',
    explanationSteps: [
      {
        title: "A を展開する",
        body: '`K` が各キーのリテラル型になるので `{ a: "a"; b: "b" }` です。',
        typeAfter: `{ a: "a"; b: "b" }`,
      },
      {
        title: "プロパティごとに比較する",
        body: '`"a"` も `"b"` も string の部分型です。',
        typeAfter: `{ a: "a"; b: "b" } ⊂ { a: string; b: string }`,
      },
      {
        title: "代入可否を判定する",
        body: "すべてのプロパティが互換なので A → B は通ります。",
      },
    ],
  }),
];
