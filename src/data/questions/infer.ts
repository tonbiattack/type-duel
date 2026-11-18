/**
 * Infer 問題集: 型推論の結果を四択で当てる。
 *
 * 各問の `expectedType` は TypeScript Compiler API の `typeToString` の出力と
 * 完全に一致させる。`tests/questions.test.ts` が全問を検証する。
 */
import type { InferQuestion } from "../../types/question";
import { inferQuestion } from "./shared";

export const inferQuestions: readonly InferQuestion[] = [
  inferQuestion({
    id: "infer-const-string-literal",
    difficulty: "easy",
    topic: ["literal", "const"],
    prompt: "`value` の型は？",
    code: `const value = "hello";`,
    expectedType: `"hello"`,
    distractors: ["string", "unknown", "any"],
    explanation:
      '`const` で宣言した変数は再代入できないため、TypeScript はリテラル型 `"hello"` として推論します。`let` なら `string` になります。',
  }),
  inferQuestion({
    id: "infer-let-string-widening",
    difficulty: "easy",
    topic: ["literal", "widening"],
    prompt: "`value` の型は？",
    code: `let value = "hello";`,
    expectedType: "string",
    distractors: [`"hello"`, "any", "unknown"],
    explanation:
      "`let` は再代入できるため、リテラル型ではなく広い `string` に推論されます。これをリテラル型の拡大（widening）と呼びます。",
  }),
  inferQuestion({
    id: "infer-const-number-literal",
    difficulty: "easy",
    topic: ["literal", "const"],
    prompt: "`value` の型は？",
    code: `const value = 42;`,
    expectedType: "42",
    distractors: ["number", "bigint", "unknown"],
    explanation: "`const` の数値もリテラル型 `42` になります。`number` ではありません。",
  }),
  inferQuestion({
    id: "infer-const-boolean-literal",
    difficulty: "easy",
    topic: ["literal", "const"],
    prompt: "`value` の型は？",
    code: `const value = true;`,
    expectedType: "true",
    distractors: ["boolean", "any", "unknown"],
    explanation:
      "`const` の真偽値はリテラル型 `true` です。`boolean` は `true | false` なので、より広い型になります。",
  }),
  inferQuestion({
    id: "infer-array-number",
    difficulty: "easy",
    topic: ["array"],
    prompt: "`value` の型は？",
    code: `const value = [1, 2, 3];`,
    expectedType: "number[]",
    distractors: ["[1, 2, 3]", "readonly number[]", "(number | string)[]"],
    explanation:
      "配列リテラルは要素型の配列に推論されます。`as const` を付けない限りタプルにはなりません。",
  }),
  inferQuestion({
    id: "infer-array-mixed",
    difficulty: "easy",
    topic: ["array", "union"],
    prompt: "`value` の型は？",
    code: `const value = [1, "a"];`,
    expectedType: "(string | number)[]",
    distractors: ["[number, string]", "(number | boolean)[]", "any[]"],
    explanation:
      "異なる型の要素を持つ配列は、要素型の union 配列に推論されます。タプルにするには `as const` が必要です。",
  }),
  inferQuestion({
    id: "infer-object-literal",
    difficulty: "easy",
    topic: ["object"],
    prompt: "`value` の型は？",
    code: `const value = { id: 1, name: "x" };`,
    expectedType: "{ id: number; name: string; }",
    distractors: [
      "{ id: 1; name: string; }",
      "{ readonly id: number; readonly name: string; }",
      "Record<string, unknown>",
    ],
    explanation:
      "オブジェクトリテラルのプロパティは、`as const` がなければ広い型（`number` / `string`）に推論されます。",
  }),
  inferQuestion({
    id: "infer-as-const-object",
    difficulty: "normal",
    topic: ["as const", "readonly"],
    prompt: "`value` の型は？",
    code: `const value = { id: 1 } as const;`,
    expectedType: "{ readonly id: 1; }",
    distractors: ["{ id: number; }", "{ id: 1; }", "{ readonly id: number; }"],
    explanation:
      "`as const` はプロパティを `readonly` にし、値もリテラル型のまま保ちます。両方そろって `{ readonly id: 1; }` になります。",
  }),
  inferQuestion({
    id: "infer-as-const-tuple",
    difficulty: "normal",
    topic: ["as const", "tuple"],
    prompt: "`value` の型は？",
    code: `const value = [1, "a"] as const;`,
    expectedType: `readonly [1, "a"]`,
    distractors: ["(string | number)[]", `[number, string]`, `readonly (string | number)[]`],
    explanation:
      "`as const` を配列に付けると、読み取り専用のタプル型になります。要素もリテラル型のまま保たれます。",
  }),
  inferQuestion({
    id: "infer-conditional-union",
    difficulty: "normal",
    topic: ["union", "conditional"],
    prompt: "`value` の型は？",
    code: `const value = Math.random() > 0.5 ? "a" : 1;`,
    expectedType: `"a" | 1`,
    distractors: ["string | number", "any", "unknown"],
    explanation:
      "三項演算子の結果は両方の型の union になります。`const` なので各枝のリテラル型が保たれます。",
  }),
  inferQuestion({
    id: "infer-null-literal",
    difficulty: "easy",
    topic: ["null"],
    prompt: "`value` の型は？",
    code: `const value = null;`,
    expectedType: "null",
    distractors: ["any", "undefined", "unknown"],
    explanation:
      "`strictNullChecks` が有効な場合、`null` は専用の `null` 型として推論されます。`any` にはなりません。",
  }),
  inferQuestion({
    id: "infer-undefined-literal",
    difficulty: "easy",
    topic: ["undefined"],
    prompt: "`value` の型は？",
    code: `const value = undefined;`,
    expectedType: "undefined",
    distractors: ["null", "any", "void"],
    explanation:
      "`undefined` は `undefined` 型として推論されます。`void` は関数の戻り値で使う別の型です。",
  }),
  inferQuestion({
    id: "infer-as-string-assertion",
    difficulty: "normal",
    topic: ["assertion", "widening"],
    prompt: "`value` の型は？",
    code: `const value = "a" as string;`,
    expectedType: "string",
    distractors: [`"a"`, "any", "unknown"],
    explanation:
      "`as string` で型を明示的に広げています。アサーションは推論結果を上書きするため、リテラル型ではなく `string` になります。",
  }),
  inferQuestion({
    id: "infer-as-const-array",
    difficulty: "normal",
    topic: ["as const", "tuple"],
    prompt: "`value` の型は？",
    code: `const value = ["a", "b"] as const;`,
    expectedType: `readonly ["a", "b"]`,
    distractors: [`string[]`, `["a", "b"]`, `readonly string[]`],
    explanation:
      "`as const` により読み取り専用タプルになります。要素がリテラル型で固定されるため、`string[]` より狭い型です。",
  }),
  inferQuestion({
    id: "infer-nested-object",
    difficulty: "normal",
    topic: ["object"],
    prompt: "`value` の型は？",
    code: `const value = { a: { b: 1 } };`,
    expectedType: "{ a: { b: number; }; }",
    distractors: ["{ a: { b: 1; }; }", "{ a: number; }", "{ a: { b: unknown; }; }"],
    explanation:
      "ネストしたオブジェクトも再帰的に推論されます。`as const` がないため、内側の `b` は `number` に広がります。",
  }),
  inferQuestion({
    id: "infer-arrow-function",
    difficulty: "normal",
    topic: ["function"],
    prompt: "`value` の型は？",
    code: `const value = (x: number) => x * 2;`,
    expectedType: "(x: number) => number",
    distractors: ["(x: number) => 2", "(x: number) => void", "Function"],
    explanation:
      "アロー関数は引数と戻り値の型を持つ関数型に推論されます。戻り値は `x * 2` の結果なので `number` です。",
  }),
  inferQuestion({
    id: "infer-map-result",
    difficulty: "normal",
    topic: ["array", "generic"],
    prompt: "`value` の型は？",
    code: `const value = [1, 2].map((n) => String(n));`,
    expectedType: "string[]",
    distractors: ["number[]", "(string | number)[]", "any[]"],
    explanation:
      "`map` はコールバックの戻り値型を要素型とする配列を返します。`String(n)` は `string` なので `string[]` です。",
  }),
  inferQuestion({
    id: "infer-indexed-access-value",
    difficulty: "normal",
    topic: ["indexed access"],
    prompt: "`value` の型は？",
    code: `const value = { a: 1 }["a"];`,
    expectedType: "number",
    distractors: ["1", "unknown", "any"],
    explanation:
      "オブジェクトリテラルから直接プロパティを取り出すと、プロパティの型が推論されます。`as const` がないため `1` ではなく `number` です。",
  }),
  inferQuestion({
    id: "infer-property-access",
    difficulty: "normal",
    topic: ["object", "indexed access"],
    prompt: "`value` の型は？",
    code: `const obj = { a: 1, b: "x" };
const value = obj.a;`,
    expectedType: "number",
    distractors: ["1", "string", "unknown"],
    explanation:
      "`obj.a` の型は `number` です。`obj` 自体は `const` ですが、プロパティの型は広い型のままなので `1` にはなりません。",
  }),
  inferQuestion({
    id: "infer-angle-bracket-const",
    difficulty: "hard",
    topic: ["as const", "tuple"],
    prompt: "`value` の型は？",
    code: `const value = <const>["a", "b"];`,
    expectedType: `readonly ["a", "b"]`,
    distractors: [`string[]`, `readonly string[]`, `["a", "b"]`],
    explanation:
      '`<const>` は `as const` と同じ意味の古い記法です。読み取り専用タプル `readonly ["a", "b"]` になります。',
  }),
  inferQuestion({
    id: "infer-mixed-three-types",
    difficulty: "normal",
    topic: ["array", "union"],
    prompt: "`value` の型は？",
    code: `const value = ["a", 1, true];`,
    expectedType: "(string | number | boolean)[]",
    distractors: ["(string | number)[]", "any[]", "[string, number, boolean]"],
    explanation:
      "3 種類の要素を持つ配列は、すべての要素型の union 配列になります。タプルにはなりません。",
  }),
  inferQuestion({
    id: "infer-nested-array-object",
    difficulty: "normal",
    topic: ["object", "array"],
    prompt: "`value` の型は？",
    code: `const value = { list: [1, 2] };`,
    expectedType: "{ list: number[]; }",
    distractors: ["{ list: [1, 2]; }", "{ list: readonly number[]; }", "{ list: (1 | 2)[]; }"],
    explanation:
      "プロパティの値が配列リテラルなので `number[]` に推論されます。`as const` がないためタプルではありません。",
  }),
  inferQuestion({
    id: "infer-string-length",
    difficulty: "normal",
    topic: ["indexed access", "primitive"],
    prompt: "`value` の型は？",
    code: `const value = "abc".length;`,
    expectedType: "number",
    distractors: ["3", "string", "unknown"],
    explanation:
      "`length` プロパティの型は `number` です。リテラル文字列でも長さは数値リテラル型にはなりません。",
  }),
  inferQuestion({
    id: "infer-set-generic",
    difficulty: "hard",
    topic: ["generic"],
    prompt: "`value` の型は？",
    code: `const value = new Set([1, 2]);`,
    expectedType: "Set<number>",
    distractors: ["Set<1 | 2>", "number[]", "Set<unknown>"],
    explanation:
      "`Set` のコンストラクタは要素型を推論します。配列が `number[]` なので `Set<number>` になります。",
  }),
  inferQuestion({
    id: "infer-map-generic",
    difficulty: "hard",
    topic: ["generic"],
    prompt: "`value` の型は？",
    code: `const value = new Map<string, number>();`,
    expectedType: "Map<string, number>",
    distractors: ["Map<string, unknown>", "Record<string, number>", "Map<any, any>"],
    explanation:
      "型引数を明示した `Map` はそのままの型になります。`Record` は別の型なので置き換えられません。",
  }),
  inferQuestion({
    id: "infer-promise-generic",
    difficulty: "hard",
    topic: ["generic", "promise"],
    prompt: "`value` の型は？",
    code: `const value = Promise.resolve(1);`,
    expectedType: "Promise<number>",
    distractors: ["Promise<1>", "number", "Promise<unknown>"],
    explanation:
      "`Promise.resolve` は引数の型を包んだ `Promise<T>` を返します。`1` は `number` に広がるため `Promise<number>` です。",
  }),
  inferQuestion({
    id: "infer-as-const-number-tuple",
    difficulty: "normal",
    topic: ["as const", "tuple"],
    prompt: "`value` の型は？",
    code: `const value = [1, 2] as const;`,
    expectedType: "readonly [1, 2]",
    distractors: ["number[]", "readonly number[]", "[1, 2]"],
    explanation:
      "`as const` により読み取り専用タプルになり、要素もリテラル型 `1` `2` で固定されます。",
  }),
  inferQuestion({
    id: "infer-satisfies",
    difficulty: "hard",
    topic: ["satisfies", "object"],
    prompt: "`value` の型は？",
    code: `const value = { a: 1 } satisfies Record<string, number>;`,
    expectedType: "{ a: number; }",
    distractors: ["Record<string, number>", "{ a: 1; }", "{ readonly a: 1; }"],
    explanation:
      "`satisfies` は型の適合を検査するだけで、推論結果を上書きしません。そのため `{ a: number; }` のままです。",
  }),
  inferQuestion({
    id: "infer-as-const-string",
    difficulty: "easy",
    topic: ["as const", "literal"],
    prompt: "`value` の型は？",
    code: `const value = "x" as const;`,
    expectedType: `"x"`,
    distractors: ["string", "any", "unknown"],
    explanation:
      '`as const` はリテラル型を固定します。`const` だけでも `"x"` になりますが、`as const` を付けるとより明示的です。',
  }),
  inferQuestion({
    id: "infer-number-arithmetic",
    difficulty: "easy",
    topic: ["primitive"],
    prompt: "`value` の型は？",
    code: `const value = 1 + 1;`,
    expectedType: "number",
    distractors: ["2", "string", "bigint"],
    explanation:
      "算術演算の結果は `number` に推論されます。`const` でも計算結果はリテラル型にならず、`2` にはなりません。",
  }),
  inferQuestion({
    id: "infer-boolean-array",
    difficulty: "easy",
    topic: ["array"],
    prompt: "`value` の型は？",
    code: `const value = [true, false];`,
    expectedType: "boolean[]",
    distractors: ["[true, false]", "true[]", "(true | false)[]"],
    explanation:
      "真偽値の配列は `boolean[]` に推論されます。`as const` を付けない限りタプルにはなりません。",
  }),
  inferQuestion({
    id: "infer-object-with-array-property",
    difficulty: "easy",
    topic: ["object", "array"],
    prompt: "`value` の型は？",
    code: `const value = { a: [1] };`,
    expectedType: "{ a: number[]; }",
    distractors: ["{ a: [1]; }", "{ a: number; }", "{ a: readonly number[]; }"],
    explanation:
      "プロパティの値が配列リテラルなので `number[]` に推論されます。`as const` がないためタプルではありません。",
  }),
  inferQuestion({
    id: "infer-string-method",
    difficulty: "easy",
    topic: ["primitive"],
    prompt: "`value` の型は？",
    code: `const value = "abc".toUpperCase();`,
    expectedType: "string",
    distractors: [`"ABC"`, "unknown", "any"],
    explanation:
      '`toUpperCase()` の戻り値は `string` です。実行時の値が `"ABC"` でも、型は `string` に推論されます。',
  }),
  inferQuestion({
    id: "infer-array-length",
    difficulty: "easy",
    topic: ["array"],
    prompt: "`value` の型は？",
    code: `const value = [1, 2].length;`,
    expectedType: "number",
    distractors: ["2", "string", "unknown"],
    explanation:
      "`length` プロパティの型は `number` です。要素数が 2 でも、リテラル型 `2` にはなりません。",
  }),
  inferQuestion({
    id: "infer-tuple-annotation",
    difficulty: "normal",
    topic: ["tuple"],
    prompt: "`value` の型は？",
    code: `const value = [1, 2] as [number, number];`,
    expectedType: "[number, number]",
    distractors: ["number[]", "readonly [number, number]", "[1, 2]"],
    explanation:
      "`as [number, number]` でタプル型を明示しています。`as const` と違い、要素はリテラル型にならず `readonly` でもありません。",
  }),
  inferQuestion({
    id: "infer-iife",
    difficulty: "normal",
    topic: ["function"],
    prompt: "`value` の型は？",
    code: `const value = (() => 1)();`,
    expectedType: "number",
    distractors: ["1", "() => number", "void"],
    explanation:
      "即時実行関数の戻り値は `number` です。`1` を返していますが、関数の戻り値型は広い `number` に推論されます。",
  }),
  inferQuestion({
    id: "infer-filter-result",
    difficulty: "normal",
    topic: ["array"],
    prompt: "`value` の型は？",
    code: `const value = [1, 2, 3].filter((n) => n > 1);`,
    expectedType: "number[]",
    distractors: ["boolean[]", "[2, 3]", "number"],
    explanation:
      "`filter` は元の配列と同じ要素型の配列を返します。条件を満たす要素だけが残りますが、型は `number[]` です。",
  }),
  inferQuestion({
    id: "infer-object-keys",
    difficulty: "normal",
    topic: ["object", "generic"],
    prompt: "`value` の型は？",
    code: `const value = Object.keys({ a: 1 });`,
    expectedType: "string[]",
    distractors: [`"a"[]`, "(keyof { a: number })[]", "unknown[]"],
    explanation:
      '`Object.keys` の戻り値は `string[]` です。キーが `"a"` だけでも、型は `string[]` に広がります。',
  }),
  inferQuestion({
    id: "infer-reduce-result",
    difficulty: "normal",
    topic: ["array", "generic"],
    prompt: "`value` の型は？",
    code: `const value = [1, 2].reduce((a, b) => a + b, 0);`,
    expectedType: "number",
    distractors: ["number[]", "3", "unknown"],
    explanation:
      "`reduce` の戻り値型は初期値とコールバックの戻り値から決まります。ここでは `number` です。",
  }),
  inferQuestion({
    id: "infer-satisfies-string",
    difficulty: "normal",
    topic: ["satisfies", "literal"],
    prompt: "`value` の型は？",
    code: `const value = "a" satisfies string;`,
    expectedType: `"a"`,
    distractors: ["string", "any", "unknown"],
    explanation:
      '`satisfies` は適合を検査するだけで推論結果を変えません。`const` のリテラル型 `"a"` が保たれます。',
  }),
  inferQuestion({
    id: "infer-angle-bracket-object",
    difficulty: "hard",
    topic: ["as const", "object"],
    prompt: "`value` の型は？",
    code: `const value = <const>{ a: 1 };`,
    expectedType: "{ readonly a: 1; }",
    distractors: ["{ a: number; }", "{ a: 1; }", "{ readonly a: number; }"],
    explanation:
      "`<const>` は `as const` と同じ意味です。プロパティが `readonly` になり、値もリテラル型で固定されます。",
  }),
  inferQuestion({
    id: "infer-map-double",
    difficulty: "hard",
    topic: ["array", "generic"],
    prompt: "`value` の型は？",
    code: `const value = [1, 2].map((n) => n * 2);`,
    expectedType: "number[]",
    distractors: ["[2, 4]", "number", "(1 | 2)[]"],
    explanation:
      "`map` はコールバックの戻り値型を要素型とする配列を返します。`n * 2` は `number` なので `number[]` です。",
  }),
];
