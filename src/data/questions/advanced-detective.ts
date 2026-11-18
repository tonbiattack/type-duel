/**
 * Advanced 問題集（Detective）: 複合型のエラー原因を四択で見抜く。
 *
 * `expectedErrorCode` は TypeScript Compiler API が返す診断コードと
 * 完全に一致させる。修正例がエラーを含まないこともテストで検証する。
 */
import type { DetectiveQuestion } from "../../types/question";
import { detectiveQuestion } from "./shared";

export const advancedDetectiveQuestions: readonly DetectiveQuestion[] = [
  detectiveQuestion({
    id: "adv-detective-intersection-conflict",
    difficulty: "advanced",
    topic: ["intersection", "never"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a: 1 } & { a: 2 };
const value: A = { a: 1 };`,
    expectedErrorCode: 2322,
    cause: "交差により a が never になり、値を代入できない",
    distractors: [
      "交差型にはオブジェクトリテラルを代入できない",
      "a プロパティが必須なのに省略されている",
      "リテラル型 1 と 2 は union として扱われる",
    ],
    explanation:
      "`{ a: 1 } & { a: 2 }` は `a` が `1 & 2` = `never` になります。`never` に値を入れられないため、オブジェクトを作れません。",
    fix: `type A = { a: 1 | 2 };
const value: A = { a: 1 };`,
    explanationSteps: [
      {
        title: "プロパティの交差を取る",
        body: "`a` は `1 & 2` になります。互換性のないリテラル同士の交差は `never` です。",
        typeAfter: "{ a: never }",
      },
      {
        title: "代入を試みる",
        body: "`a: never` に `1` を入れられないため、`{ a: 1 }` は代入できません。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-never-conditional",
    difficulty: "advanced",
    topic: ["conditional", "never"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = never extends string ? true : false;
const value: A = false;`,
    expectedErrorCode: 2322,
    cause: "never を対象にした条件型は true に解決される",
    distractors: [
      "never は条件型の対象にできない",
      "false はリテラル型として使えない",
      "条件型の結果は常に boolean になる",
    ],
    explanation:
      "`never` は分配条件型で空の union として扱われますが、`never extends string` 自体は真と評価されます。A は `true` なので `false` は代入できません。",
    fix: `type A = never extends string ? true : false;
const value: A = true;`,
    explanationSteps: [
      {
        title: "never の扱いを確認する",
        body: "`never` はすべての型の部分型です。したがって `never extends string` は真です。",
      },
      {
        title: "条件型を解決する",
        body: "真の分岐が選ばれ、A は `true` になります。",
        typeAfter: "true",
      },
      {
        title: "代入を試みる",
        body: "`false` は `true` に代入できないためエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-template-literal-mismatch",
    difficulty: "advanced",
    topic: ["template literal", "union"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = \`a\${"b" | "c"}\`;
const value: A = "ad";`,
    expectedErrorCode: 2322,
    cause: `テンプレートリテラル型は "ab" | "ac" に展開され、"ad" を含まない`,
    distractors: [
      "テンプレートリテラル型には文字列を代入できない",
      `"ad" は string 型ではない`,
      "テンプレートリテラル型は 2 つまでしか展開できない",
    ],
    explanation:
      '`${...}` の union が展開され、A は `"ab" | "ac"` になります。`"ad"` はどちらでもないためエラーです。',
    fix: `type A = \`a\${"b" | "c"}\`;
const value: A = "ab";`,
    explanationSteps: [
      {
        title: "union を分配する",
        body: '`${...}` の union が展開され、A は `"ab" | "ac"` になります。',
        typeAfter: `"ab" | "ac"`,
      },
      {
        title: "代入を試みる",
        body: '`"ad"` は union に含まれないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-mapped-key-mismatch",
    difficulty: "advanced",
    topic: ["mapped types", "keyof"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { [K in "a" | "b"]: K };
const value: A = { a: "b", b: "a" };`,
    expectedErrorCode: 2322,
    cause: 'a には "a"、b には "b" が要求されるが、逆になっている',
    distractors: [
      "mapped type にはオブジェクトリテラルを代入できない",
      "a と b の両方が必須である",
      "K は string 型として扱われる",
    ],
    explanation:
      'mapped type の `K` は各キーのリテラル型です。`a` の値は `"a"`、`b` の値は `"b"` でなければなりません。',
    fix: `type A = { [K in "a" | "b"]: K };
const value: A = { a: "a", b: "b" };`,
    explanationSteps: [
      {
        title: "K を各キーで評価する",
        body: '`a` のとき K は `"a"`、`b` のとき K は `"b"` です。',
        typeAfter: `{ a: "a"; b: "b" }`,
      },
      {
        title: "代入を試みる",
        body: '`a: "b"` は `a: "a"` に代入できないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-exclude-mismatch",
    difficulty: "advanced",
    topic: ["conditional", "union", "utility"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = Exclude<"a" | "b", "a">;
const value: A = "a";`,
    expectedErrorCode: 2322,
    cause: `Exclude で "a" が除外され、A は "b" だけになる`,
    distractors: [
      `Exclude は "a" を残す`,
      `"a" は string 型ではない`,
      "Exclude の結果は常に never になる",
    ],
    explanation:
      '`Exclude<T, U>` は T から U に代入可能なメンバーを取り除きます。`"a"` が除かれ A は `"b"` です。',
    fix: `type A = Exclude<"a" | "b", "a">;
const value: A = "b";`,
    explanationSteps: [
      {
        title: "Exclude を評価する",
        body: '`"a"` は `"a"` に代入可能なので `never` になり、`"b"` だけが残ります。',
        typeAfter: `"b"`,
      },
      {
        title: "代入を試みる",
        body: '`"a"` は `"b"` に代入できないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-extract-mismatch",
    difficulty: "advanced",
    topic: ["conditional", "union", "utility"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = Extract<"a" | 1, string>;
const value: A = 1;`,
    expectedErrorCode: 2322,
    cause: 'Extract で string に含まれる "a" だけが残り、1 は除外される',
    distractors: [
      "Extract は数値型を残す",
      "1 はリテラル型として使えない",
      "Extract の結果は常に never になる",
    ],
    explanation:
      "`Extract<T, U>` は T のうち U に代入可能なメンバーだけを残します。`1` は string に代入できないため除外されます。",
    fix: `type A = Extract<"a" | 1, string>;
const value: A = "a";`,
    explanationSteps: [
      {
        title: "Extract を評価する",
        body: '`"a"` は string に代入可能なので残り、`1` は `never` になります。',
        typeAfter: `"a"`,
      },
      {
        title: "代入を試みる",
        body: '`1` は `"a"` に代入できないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-readonly-mapped",
    difficulty: "advanced",
    topic: ["mapped types", "readonly"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { readonly [K in "a"]: 1 };
const value: A = { a: 1 };
value.a = 1;`,
    expectedErrorCode: 2540,
    cause: "mapped type で readonly を付けたため a に再代入できない",
    distractors: [
      "const で宣言した変数のプロパティは変更できない",
      "a プロパティの型が number ではない",
      "mapped type には値を代入できない",
    ],
    explanation:
      "`readonly [K in ...]` は全プロパティを読み取り専用にします。`const` は変数への再代入を禁じますが、`readonly` はプロパティの書き換えを禁じます。",
    fix: `type A = { [K in "a"]: 1 };
const value: A = { a: 1 };
value.a = 1;`,
    explanationSteps: [
      {
        title: "readonly を付けて写像する",
        body: '`readonly [K in "a"]: 1` は `{ readonly a: 1 }` になります。',
        typeAfter: "{ readonly a: 1 }",
      },
      {
        title: "再代入を試みる",
        body: "readonly プロパティへの代入はエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-optional-access",
    difficulty: "advanced",
    topic: ["mapped types", "optional"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { [K in "a"]?: 1 };
const value: A = { a: 1 };
const other: number = value.a;`,
    expectedErrorCode: 2322,
    cause: "省略可能プロパティは undefined になり得るため number に代入できない",
    distractors: [
      "mapped type のプロパティにはアクセスできない",
      "a プロパティが必須である",
      "1 は number に代入できない",
    ],
    explanation:
      "`?` を付けたプロパティは `1 | undefined` になります。`number` へ代入するには undefined チェックが必要です。",
    fix: `type A = { [K in "a"]?: 1 };
const value: A = { a: 1 };
const other: number = value.a ?? 0;`,
    explanationSteps: [
      {
        title: "省略可能にする",
        body: '`[K in "a"]?: 1` は `{ a?: 1 }` になり、`a` の型は `1 | undefined` です。',
        typeAfter: "{ a?: 1 }",
      },
      {
        title: "代入を試みる",
        body: "`undefined` を含むため `number` へは代入できません。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-intersection-missing",
    difficulty: "advanced",
    topic: ["intersection", "object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a: 1 } & { b: 2 };
const value: A = { a: 1 };`,
    expectedErrorCode: 2322,
    cause: "交差型は両方のプロパティを要求するため b が不足している",
    distractors: [
      "交差型にはオブジェクトリテラルを代入できない",
      "a プロパティの型が number ではない",
      "交差型は union として扱われる",
    ],
    explanation:
      "`A & B` は両方の制約を同時に満たす必要があります。`b` が不足しているため代入できません。",
    fix: `type A = { a: 1 } & { b: 2 };
const value: A = { a: 1, b: 2 };`,
    explanationSteps: [
      {
        title: "交差型の要求を確認する",
        body: "`{ a: 1 } & { b: 2 }` は `a` と `b` の両方を要求します。",
        typeAfter: "{ a: 1; b: 2 }",
      },
      {
        title: "代入を試みる",
        body: "`b` がないためエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-infer-mismatch",
    difficulty: "advanced",
    topic: ["conditional", "infer"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a: 1 } extends { a: infer U } ? U : never;
const value: A = "x";`,
    expectedErrorCode: 2322,
    cause: 'infer で取り出した型は 1 なので "x" は代入できない',
    distractors: [
      "infer はオブジェクト型に使えない",
      "条件型の結果は常に never になる",
      "U は unknown として推論される",
    ],
    explanation:
      "`{ a: infer U }` はプロパティ `a` の型を U に束縛します。`{ a: 1 }` なら U は `1` です。",
    fix: `type A = { a: 1 } extends { a: infer U } ? U : never;
const value: A = 1;`,
    explanationSteps: [
      {
        title: "プロパティの型を束縛する",
        body: "`{ a: infer U }` により U は `1` になります。",
        typeAfter: "U = 1",
      },
      {
        title: "代入を試みる",
        body: '`"x"` は `1` に代入できないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-keyof-mismatch",
    difficulty: "advanced",
    topic: ["keyof", "object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = keyof { a: 1; b: 2 };
const value: A = "c";`,
    expectedErrorCode: 2322,
    cause: `keyof の結果は "a" | "b" なので "c" は含まれない`,
    distractors: [
      "keyof の結果は string になる",
      `"c" はリテラル型として使えない`,
      "keyof は値の型を返す",
    ],
    explanation: '`keyof` はプロパティ名の union を返します。`"a" | "b"` に `"c"` は含まれません。',
    fix: `type A = keyof { a: 1; b: 2 };
const value: A = "a";`,
    explanationSteps: [
      {
        title: "keyof を評価する",
        body: '`keyof { a: 1; b: 2 }` は `"a" | "b"` です。',
        typeAfter: `"a" | "b"`,
      },
      {
        title: "代入を試みる",
        body: '`"c"` は union に含まれないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-indexed-access-mismatch",
    difficulty: "advanced",
    topic: ["indexed access", "keyof"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a: 1; b: 2 }[keyof { a: 1; b: 2 }];
const value: A = 3;`,
    expectedErrorCode: 2322,
    cause: "indexed access の結果は 1 | 2 なので 3 は含まれない",
    distractors: [
      "indexed access はキーの union を返す",
      "3 はリテラル型として使えない",
      "keyof の結果は string になる",
    ],
    explanation: "`{ a: 1; b: 2 }[keyof ...]` は値の union `1 | 2` です。`3` は含まれません。",
    fix: `type A = { a: 1; b: 2 }[keyof { a: 1; b: 2 }];
const value: A = 1;`,
    explanationSteps: [
      {
        title: "keyof を評価する",
        body: '`keyof { a: 1; b: 2 }` は `"a" | "b"` です。',
        typeAfter: `"a" | "b"`,
      },
      {
        title: "indexed access を評価する",
        body: "各プロパティの値の union で `1 | 2` になります。",
        typeAfter: "1 | 2",
      },
      {
        title: "代入を試みる",
        body: "`3` は含まれないためエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-tuple-never-check",
    difficulty: "advanced",
    topic: ["conditional", "never", "tuple"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = [string] extends [never] ? true : false;
const value: A = true;`,
    expectedErrorCode: 2322,
    cause: "タプルで包むと分配されず、条件は偽と評価される",
    distractors: [
      "タプル型は条件型の対象にできない",
      "never はタプルに含められない",
      "true はリテラル型として使えない",
    ],
    explanation:
      "`[T]` のようにタプルで包むと分配が起きません。`[string]` は `[never]` の部分型ではないため条件は偽で、A は `false` です。",
    fix: `type A = [string] extends [never] ? true : false;
const value: A = false;`,
    explanationSteps: [
      {
        title: "分配を避ける",
        body: "`[T]` で包むと条件型の分配が起きません。",
      },
      {
        title: "条件を評価する",
        body: "`[string]` は `[never]` に代入できないので偽です。",
        typeAfter: "false",
      },
      {
        title: "代入を試みる",
        body: "`true` は `false` に代入できないためエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-unknown-conditional",
    difficulty: "advanced",
    topic: ["conditional", "unknown"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = unknown extends string ? true : false;
const value: A = true;`,
    expectedErrorCode: 2322,
    cause: "unknown は string の上位型なので条件は偽になる",
    distractors: [
      "unknown は条件型の対象にできない",
      "true はリテラル型として使えない",
      "unknown は string の部分型である",
    ],
    explanation:
      "`unknown` はすべての型の上位型です。`unknown extends string` は偽なので A は `false` になります。",
    fix: `type A = unknown extends string ? true : false;
const value: A = false;`,
    explanationSteps: [
      {
        title: "unknown の位置を確認する",
        body: "`unknown` は string より広い型なので、string へは代入できません。",
      },
      {
        title: "条件を評価する",
        body: "条件が偽なので A は `false` です。",
        typeAfter: "false",
      },
      {
        title: "代入を試みる",
        body: "`true` は `false` に代入できないためエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-nonnullable-mismatch",
    difficulty: "advanced",
    topic: ["conditional", "utility", "null"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = NonNullable<string | null>;
const value: A = null;`,
    expectedErrorCode: 2322,
    cause: "NonNullable で null が除外され、A は string になる",
    distractors: [
      "NonNullable は null を残す",
      "null はリテラル型として使えない",
      "NonNullable の結果は常に never になる",
    ],
    explanation:
      "`NonNullable<T>` は `null` と `undefined` を取り除きます。A は `string` なので `null` は代入できません。",
    fix: `type A = NonNullable<string | null>;
const value: A = "x";`,
    explanationSteps: [
      {
        title: "null を除外する",
        body: "`NonNullable<string | null>` は `string` になります。",
        typeAfter: "string",
      },
      {
        title: "代入を試みる",
        body: "`null` は `string` に代入できないためエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-return-type-mismatch",
    difficulty: "advanced",
    topic: ["conditional", "infer", "function"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = ReturnType<() => number>;
const value: A = "x";`,
    expectedErrorCode: 2322,
    cause: 'ReturnType で取り出した型は number なので "x" は代入できない',
    distractors: [
      "ReturnType は関数型に使えない",
      "ReturnType の結果は常に never になる",
      "number はリテラル型として使えない",
    ],
    explanation: '`ReturnType<() => number>` は `number` です。`"x"` は代入できません。',
    fix: `type A = ReturnType<() => number>;
const value: A = 1;`,
    explanationSteps: [
      {
        title: "戻り値型を取り出す",
        body: "`() => number` の戻り値は `number` です。",
        typeAfter: "number",
      },
      {
        title: "代入を試みる",
        body: '`"x"` は `number` に代入できないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-parameters-mismatch",
    difficulty: "advanced",
    topic: ["conditional", "infer", "tuple"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = Parameters<(a: string) => void>;
const value: A = [1];`,
    expectedErrorCode: 2322,
    cause: "Parameters の結果は [a: string] なので number 要素は代入できない",
    distractors: [
      "Parameters は関数型に使えない",
      "タプルには要素を 1 つしか入れられない",
      "Parameters の結果は常に never になる",
    ],
    explanation:
      "`Parameters<(a: string) => void>` は `[a: string]` です。`[1]` は要素型が合いません。",
    fix: `type A = Parameters<(a: string) => void>;
const value: A = ["x"];`,
    explanationSteps: [
      {
        title: "引数リストをタプルにする",
        body: "`(a: string) => void` の引数は `[a: string]` です。",
        typeAfter: "[a: string]",
      },
      {
        title: "代入を試みる",
        body: "`[1]` は `[a: string]` に代入できないためエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-awaited-mismatch",
    difficulty: "advanced",
    topic: ["conditional", "infer", "promise"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = Awaited<Promise<number>>;
const value: A = "x";`,
    expectedErrorCode: 2322,
    cause: "Awaited で Promise を剥がすと number になる",
    distractors: [
      "Awaited は Promise に使えない",
      "Awaited の結果は常に unknown になる",
      "number はリテラル型として使えない",
    ],
    explanation: '`Awaited<Promise<number>>` は `number` です。`"x"` は代入できません。',
    fix: `type A = Awaited<Promise<number>>;
const value: A = 1;`,
    explanationSteps: [
      {
        title: "Promise を剥がす",
        body: "`Awaited<Promise<number>>` は `number` になります。",
        typeAfter: "number",
      },
      {
        title: "代入を試みる",
        body: '`"x"` は `number` に代入できないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-record-infer-mismatch",
    difficulty: "advanced",
    topic: ["conditional", "infer", "object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a: 1 } extends Record<string, infer V> ? V : never;
const value: A = "x";`,
    expectedErrorCode: 2322,
    cause: 'infer で取り出した値の型は 1 なので "x" は代入できない',
    distractors: [
      "Record はオブジェクト型に使えない",
      "infer はインデックスシグネチャに使えない",
      "V は string として推論される",
    ],
    explanation:
      "`Record<string, infer V>` は全プロパティの値の型を V に束縛します。`{ a: 1 }` なら V は `1` です。",
    fix: `type A = { a: 1 } extends Record<string, infer V> ? V : never;
const value: A = 1;`,
    explanationSteps: [
      {
        title: "値の型を束縛する",
        body: "`{ a: 1 }` は `Record<string, V>` に一致し、V は `1` になります。",
        typeAfter: "V = 1",
      },
      {
        title: "代入を試みる",
        body: '`"x"` は `1` に代入できないためエラーです。',
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-required-missing",
    difficulty: "advanced",
    topic: ["mapped types", "optional", "utility"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = Required<{ a?: 1 }>;
const value: A = {};`,
    expectedErrorCode: 2741,
    cause: "Required で a が必須になったため省略できない",
    distractors: [
      "Required は省略可能プロパティを扱えない",
      "空のオブジェクトリテラルは代入に使えない",
      "a プロパティの型が number ではない",
    ],
    explanation:
      "`Required<T>` は全プロパティを必須にします。`a` を省略できないため `{}` は代入できません。",
    fix: `type A = Required<{ a?: 1 }>;
const value: A = { a: 1 };`,
    explanationSteps: [
      {
        title: "必須にする",
        body: "`Required<{ a?: 1 }>` は `{ a: 1 }` になります。",
        typeAfter: "{ a: 1 }",
      },
      {
        title: "代入を試みる",
        body: "`a` が必須なので `{}` はエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-readonly-utility",
    difficulty: "advanced",
    topic: ["readonly", "utility"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = Readonly<{ a: 1 }>;
const value: A = { a: 1 };
value.a = 1;`,
    expectedErrorCode: 2540,
    cause: "Readonly で全プロパティが読み取り専用になった",
    distractors: [
      "const で宣言した変数のプロパティは変更できない",
      "a プロパティの型が number ではない",
      "Readonly はオブジェクト型に使えない",
    ],
    explanation: "`Readonly<T>` は全プロパティを読み取り専用にします。`value.a = 1` はエラーです。",
    fix: `type A = { a: 1 };
const value: A = { a: 1 };
value.a = 1;`,
    explanationSteps: [
      {
        title: "readonly にする",
        body: "`Readonly<{ a: 1 }>` は `{ readonly a: 1 }` になります。",
        typeAfter: "{ readonly a: 1 }",
      },
      {
        title: "再代入を試みる",
        body: "readonly プロパティへの代入はエラーです。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-partial-access",
    difficulty: "advanced",
    topic: ["optional", "utility"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = Partial<{ a: 1 }>;
const value: A = {};
const other: number = value.a;`,
    expectedErrorCode: 2322,
    cause: "Partial で a が省略可能になり undefined を含む",
    distractors: [
      "Partial はプロパティを削除する",
      "空のオブジェクトリテラルは代入に使えない",
      "a プロパティの型が number ではない",
    ],
    explanation:
      "`Partial<T>` は全プロパティを省略可能にします。`value.a` は `1 | undefined` なので `number` へ代入できません。",
    fix: `type A = Partial<{ a: 1 }>;
const value: A = {};
const other: number = value.a ?? 0;`,
    explanationSteps: [
      {
        title: "省略可能にする",
        body: "`Partial<{ a: 1 }>` は `{ a?: 1 }` になります。",
        typeAfter: "{ a?: 1 }",
      },
      {
        title: "代入を試みる",
        body: "`value.a` は `1 | undefined` なので `number` へは代入できません。",
      },
    ],
  }),
  detectiveQuestion({
    id: "adv-detective-template-literal-missing",
    difficulty: "advanced",
    topic: ["template literal", "union"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = \`a\${"b" | "c"}\`;
const value: A = "a";`,
    expectedErrorCode: 2322,
    cause: `A は "ab" | "ac" に展開され、"a" 単体は含まれない`,
    distractors: [
      `"a" は string 型ではない`,
      "テンプレートリテラル型は 1 つしか展開できない",
      "テンプレートリテラル型には文字列を代入できない",
    ],
    explanation:
      '`${...}` の部分が必須なので、`"a"` だけでは型に一致しません。`"ab"` か `"ac"` が必要です。',
    fix: `type A = \`a\${"b" | "c"}\`;
const value: A = "ab";`,
    explanationSteps: [
      {
        title: "union を分配する",
        body: 'A は `"ab" | "ac"` に展開されます。',
        typeAfter: `"ab" | "ac"`,
      },
      {
        title: "代入を試みる",
        body: '`"a"` は `${...}` の部分が欠けているため一致しません。',
      },
    ],
  }),
];
