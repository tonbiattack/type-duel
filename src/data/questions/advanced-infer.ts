/**
 * Advanced 問題集（Infer）: 複合型の推論結果を四択で当てる。
 *
 * `expectedType` は TypeScript Compiler API の `typeToString` の出力と
 * 完全に一致させる。`tests/questions.test.ts` が全問を検証する。
 */
import type { InferQuestion } from "../../types/question";
import { inferQuestion } from "./shared";

export const advancedInferQuestions: readonly InferQuestion[] = [
  inferQuestion({
    id: "adv-infer-distributive-array",
    difficulty: "advanced",
    topic: ["conditional", "distributive", "array"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { [K in "a" | "b"]: K };`,
    expectedType: `{ a: "a"; b: "b"; }`,
    distractors: [
      `{ a: string; b: string; }`,
      `{ a: "a" | "b"; b: "a" | "b"; }`,
      `{ a: never; b: never; }`,
    ],
    explanation:
      'mapped type の `K` は各キーのリテラル型です。`a` のとき K は `"a"`、`b` のとき K は `"b"` になります。',
    explanationSteps: [
      {
        title: "mapped type の読み方",
        body: "`{ [K in Keys]: V }` は、Keys の各メンバーをキーにしたオブジェクト型を作ります。",
      },
      {
        title: "K を各キーで評価する",
        body: '`K in "a" | "b"` はキーごとに K を具体化します。',
        typeAfter: `{ a: "a"; b: "b" }`,
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-mapped-optional",
    difficulty: "advanced",
    topic: ["mapped types", "optional"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { [K in "a" | "b"]?: K };`,
    expectedType: `{ a?: "a" | undefined; b?: "b" | undefined; }`,
    distractors: [`{ a?: "a"; b?: "b"; }`, `{ a: "a"; b: "b"; }`, `{ a?: string; b?: string; }`],
    explanation:
      "`?` を付けると各プロパティが省略可能になります。`strictNullChecks` が有効なので、型には `undefined` が明示的に含まれます。",
    explanationSteps: [
      {
        title: "省略可能にする",
        body: "`[K in ...]?: K` により各プロパティが省略可能になります。",
        typeAfter: `{ a?: "a"; b?: "b" }`,
      },
      {
        title: "undefined を加える",
        body: "`strictNullChecks` が有効なため、省略可能プロパティの型は `T | undefined` として表記されます。",
        typeAfter: `{ a?: "a" | undefined; b?: "b" | undefined; }`,
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-mapped-readonly",
    difficulty: "advanced",
    topic: ["mapped types", "readonly"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { readonly [K in "a"]: 1 };`,
    expectedType: "{ readonly a: 1; }",
    distractors: ["{ a: 1; }", "{ readonly a: number; }", "{ a: readonly 1; }"],
    explanation:
      "mapped type に `readonly` を付けると全プロパティが読み取り専用になります。値は `1` のままです。",
    explanationSteps: [
      {
        title: "mapped type の読み方",
        body: "`readonly [K in Keys]: V` は、各キーに readonly 修飾子を付けたオブジェクト型を作ります。",
      },
      {
        title: "readonly を付けて写像する",
        body: '`readonly [K in "a"]: 1` により `{ readonly a: 1 }` になります。',
        typeAfter: "{ readonly a: 1 }",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-mapped-remove-readonly",
    difficulty: "advanced",
    topic: ["mapped types", "readonly"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { -readonly [K in keyof { readonly a: 1 }]: 1 };`,
    expectedType: "{ a: 1; }",
    distractors: ["{ readonly a: 1; }", "{ a: number; }", "{ readonly a: number; }"],
    explanation:
      "`-readonly` は readonly 修飾子を取り除きます。元が `{ readonly a: 1 }` でも、結果は `{ a: 1 }` です。",
    explanationSteps: [
      {
        title: "keyof を評価する",
        body: '`keyof { readonly a: 1 }` は `"a"` です。',
        typeAfter: `"a"`,
      },
      {
        title: "修飾子を外す",
        body: "`-readonly` により readonly が外れ、`{ a: 1 }` になります。",
        typeAfter: "{ a: 1 }",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-intersection-object",
    difficulty: "advanced",
    topic: ["intersection", "object"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { a: 1 } & { b: 2 };`,
    expectedType: "{ a: 1; } & { b: 2; }",
    distractors: ["{ a: 1; b: 2; }", "never", "{ a: 1 | 2; }"],
    explanation:
      "交差型は `typeToString` では `&` のまま表示されます。構造としては両方のプロパティを持ちますが、表記は合成されません。",
    explanationSteps: [
      {
        title: "交差型の意味",
        body: "`A & B` は A と B の両方の制約を同時に満たす型です。",
      },
      {
        title: "交差型の表記",
        body: "`A & B` は評価しても `&` の形で保持されます。プロパティが自動で 1 つのオブジェクトに合成されるわけではありません。",
        typeAfter: "{ a: 1; } & { b: 2; }",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-intersection-conflict",
    difficulty: "advanced",
    topic: ["intersection", "never"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { a: 1 } & { a: 2 };`,
    expectedType: "never",
    distractors: ["{ a: 1; }", "{ a: 2; }", "{ a: 1 & 2; }"],
    explanation:
      "同じプロパティに互換性のないリテラル型を交差させると、そのプロパティは `never` になります。オブジェクト全体が `never` に潰れます。",
    explanationSteps: [
      {
        title: "プロパティの交差を取る",
        body: "`a` は `1 & 2` になります。互換性のないリテラル同士の交差は `never` です。",
        typeAfter: "{ a: never }",
      },
      {
        title: "オブジェクト全体を評価する",
        body: "必須プロパティが `never` のオブジェクト型は、値を作れないため `never` に潰れます。",
        typeAfter: "never",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-exclude",
    difficulty: "advanced",
    topic: ["conditional", "union", "utility"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as Exclude<"a" | "b" | "c", "a">;`,
    expectedType: `"b" | "c"`,
    distractors: [`"a" | "b" | "c"`, `"a"`, "never"],
    explanation:
      '`Exclude<T, U>` は T から U に代入可能なメンバーを取り除きます。`"a"` が除かれ `"b" | "c"` が残ります。',
    explanationSteps: [
      {
        title: "分配条件型として評価する",
        body: "`Exclude<T, U> = T extends U ? never : T` です。各メンバーが個別に判定されます。",
      },
      {
        title: "各メンバーを判定する",
        body: '`"a"` は `"a"` に代入可能なので `never`、`"b"` と `"c"` は残ります。',
        typeAfter: `never | "b" | "c"`,
      },
      {
        title: "never を畳む",
        body: 'union から `never` が消え、`"b" | "c"` になります。',
        typeAfter: `"b" | "c"`,
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-extract",
    difficulty: "advanced",
    topic: ["conditional", "union", "utility"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as Extract<"a" | 1 | true, string>;`,
    expectedType: `"a"`,
    distractors: [`"a" | 1 | true`, "string", "never"],
    explanation:
      '`Extract<T, U>` は T のうち U に代入可能なメンバーだけを残します。string に含まれるのは `"a"` だけです。',
    explanationSteps: [
      {
        title: "各メンバーを判定する",
        body: '`"a"` は string に代入可能、`1` と `true` は不可です。',
        typeAfter: `"a" | never | never`,
      },
      {
        title: "never を畳む",
        body: '残るのは `"a"` だけです。',
        typeAfter: `"a"`,
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-infer-union",
    difficulty: "advanced",
    topic: ["conditional", "infer", "union"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as ("a" | "b") extends infer U ? U : never;`,
    expectedType: `"a" | "b"`,
    distractors: ["never", "unknown", `"a"`],
    explanation:
      '`infer U` は条件型の対象をそのまま束縛します。`("a" | "b") extends infer U` は常に真で、U は `"a" | "b"` になります。',
    explanationSteps: [
      {
        title: "infer の束縛を読む",
        body: "`infer U` は「その位置の型を U として取り出す」構文です。ここでは対象全体が束縛されます。",
        typeAfter: `U = "a" | "b"`,
      },
      {
        title: "真の分岐を返す",
        body: "条件は常に真なので、結果は U そのものです。",
        typeAfter: `"a" | "b"`,
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-infer-property",
    difficulty: "advanced",
    topic: ["conditional", "infer", "object"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { a: 1 } extends { a: infer U } ? U : never;`,
    expectedType: "1",
    distractors: ["{ a: 1; }", "number", "never"],
    explanation:
      "`{ a: infer U }` はプロパティ `a` の型を U として取り出します。`{ a: 1 }` の `a` は `1` なので U は `1` です。",
    explanationSteps: [
      {
        title: "プロパティの型を束縛する",
        body: "`{ a: infer U }` は `a` の型を U に束縛します。",
        typeAfter: "U = 1",
      },
      {
        title: "真の分岐を返す",
        body: "`{ a: 1 }` は `{ a: infer U }` に一致するので、結果は U です。",
        typeAfter: "1",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-variadic-tuple",
    difficulty: "advanced",
    topic: ["conditional", "infer", "tuple"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as [1, 2] extends [infer H, ...infer R] ? [H, R] : never;`,
    expectedType: "[1, [2]]",
    distractors: ["[1, 2]", "[1, 2, 3]", "never"],
    explanation:
      "`infer H` が先頭要素 `1`、`...infer R` が残りのタプル `[2]` を束縛します。結果は `[H, R]` なので `[1, [2]]` です。",
    explanationSteps: [
      {
        title: "先頭と残りを分解する",
        body: "`[infer H, ...infer R]` は先頭を H、残りをタプル R として束縛します。",
        typeAfter: "H = 1, R = [2]",
      },
      {
        title: "結果を組み立てる",
        body: "`[H, R]` は `[1, [2]]` になります。R 自体がタプルなのでネストします。",
        typeAfter: "[1, [2]]",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-promise-unwrap",
    difficulty: "advanced",
    topic: ["conditional", "infer", "generic"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as Promise<string> extends Promise<infer U> ? U : never;`,
    expectedType: "string",
    distractors: ["Promise<string>", "unknown", "never"],
    explanation:
      "`Promise<infer U>` は Promise の型引数を U として取り出します。`Promise<string>` なら U は `string` です。",
    explanationSteps: [
      {
        title: "型引数を束縛する",
        body: "`Promise<infer U>` は Promise の型引数を U に束縛します。",
        typeAfter: "U = string",
      },
      {
        title: "真の分岐を返す",
        body: "一致するので結果は U です。",
        typeAfter: "string",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-template-literal",
    difficulty: "advanced",
    topic: ["template literal", "union"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as \`a\${"b" | "c"}\`;`,
    expectedType: `"ab" | "ac"`,
    distractors: ["string", `"a" | "b" | "c"`, `"abc"`],
    explanation:
      'テンプレートリテラル型は `${...}` の union を分配して展開します。`a` + `"b"` と `a` + `"c"` で `"ab" | "ac"` です。',
    explanationSteps: [
      {
        title: "テンプレートリテラル型の読み方",
        body: "`` `a${T}` `` は `a` で始まり T が続く文字列型を表します。",
      },
      {
        title: "union を分配する",
        body: "`${...}` に union を入れると、各メンバーで文字列が組み立てられます。",
        typeAfter: `"ab" | "ac"`,
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-keyof-object",
    difficulty: "advanced",
    topic: ["keyof", "object"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as keyof { a: 1; b: 2 };`,
    expectedType: `"a" | "b"`,
    distractors: ["1 | 2", "string", `"a"`],
    explanation:
      "`keyof` はプロパティ名の union を返します。値の型（`1 | 2`）ではない点に注意してください。",
    explanationSteps: [
      {
        title: "keyof の意味",
        body: "`keyof T` は T のプロパティ名を union として取り出します。",
      },
      {
        title: "keyof を評価する",
        body: "`keyof` はオブジェクト型のキーを union として返します。",
        typeAfter: `"a" | "b"`,
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-indexed-access-values",
    difficulty: "advanced",
    topic: ["indexed access", "keyof"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { a: 1; b: 2 }[keyof { a: 1; b: 2 }];`,
    expectedType: "1 | 2",
    distractors: [`"a" | "b"`, "{ a: 1; b: 2; }", "never"],
    explanation:
      "`keyof` でキーの union を作り、それを indexed access に渡すと値の union が得られます。",
    explanationSteps: [
      {
        title: "keyof を評価する",
        body: '`keyof { a: 1; b: 2 }` は `"a" | "b"` です。',
        typeAfter: `"a" | "b"`,
      },
      {
        title: "indexed access を評価する",
        body: '`{ a: 1; b: 2 }["a" | "b"]` は各プロパティの値の union です。',
        typeAfter: "1 | 2",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-never-conditional",
    difficulty: "advanced",
    topic: ["conditional", "never"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as never extends string ? true : false;`,
    expectedType: "true",
    distractors: ["false", "boolean", "never"],
    explanation:
      "`never` は分配条件型で空の union として扱われます。分配するメンバーがないため結果は `never` ですが、`typeToString` では条件型の解決結果として `true` が表示されます。",
    explanationSteps: [
      {
        title: "never の分配",
        body: "`never` は「値が存在しない」型です。分配条件型では空の union として扱われます。",
      },
      {
        title: "条件型の解決",
        body: "分配対象がないため、条件型は `never` に解決されます。ただし本問は `never extends string` を直接評価するため `true` が得られます。",
        typeAfter: "true",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-any-conditional",
    difficulty: "advanced",
    topic: ["conditional", "any"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as any extends string ? true : false;`,
    expectedType: "boolean",
    distractors: ["true", "false", "any"],
    explanation:
      "`any` を条件型に使うと、真と偽の両方の分岐が結果に含まれます。`true | false` = `boolean` になります。",
    explanationSteps: [
      {
        title: "any の特殊な扱い",
        body: "`any` は条件型で「どちらにもなり得る」ため、両方の分岐が結果に含まれます。",
      },
      {
        title: "両方の分岐を union する",
        body: "`true` と `false` が union され `boolean` になります。",
        typeAfter: "boolean",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-unknown-conditional",
    difficulty: "advanced",
    topic: ["conditional", "unknown"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as unknown extends string ? true : false;`,
    expectedType: "false",
    distractors: ["true", "boolean", "unknown"],
    explanation:
      "`unknown` は string の上位型なので `unknown extends string` は偽です。結果は `false` になります。",
    explanationSteps: [
      {
        title: "unknown の位置を確認する",
        body: "`unknown` はすべての型の上位型です。string より広いので条件は成立しません。",
      },
      {
        title: "偽の分岐を返す",
        body: "条件が偽なので `false` になります。",
        typeAfter: "false",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-tuple-never-check",
    difficulty: "advanced",
    topic: ["conditional", "never", "tuple"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as [string] extends [never] ? true : false;`,
    expectedType: "false",
    distractors: ["true", "boolean", "never"],
    explanation:
      "タプルで包むと分配が起きません。`[string]` は `[never]` の部分型ではないため、条件は偽で `false` になります。",
    explanationSteps: [
      {
        title: "分配を避ける",
        body: "`[T]` のようにタプルで包むと、条件型の分配が起きません。",
      },
      {
        title: "条件を評価する",
        body: "`[string]` は `[never]` に代入できないので偽です。",
        typeAfter: "false",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-nonnullable",
    difficulty: "advanced",
    topic: ["conditional", "utility", "null"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as NonNullable<string | null | undefined>;`,
    expectedType: "string",
    distractors: ["string | null", "string | null | undefined", "never"],
    explanation:
      "`NonNullable<T>` は T から `null` と `undefined` を取り除きます。残るのは `string` です。",
    explanationSteps: [
      {
        title: "NonNullable の意味",
        body: "`NonNullable<T>` は T から `null` と `undefined` を取り除いた型です。",
      },
      {
        title: "null と undefined を除く",
        body: "`NonNullable<T> = T & {}` 相当で、`null` と `undefined` が除外されます。",
        typeAfter: "string",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-return-type-nested",
    difficulty: "advanced",
    topic: ["conditional", "infer", "function"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as ReturnType<() => () => number>;`,
    expectedType: "() => number",
    distractors: ["number", "() => () => number", "never"],
    explanation:
      "`ReturnType` は関数の戻り値型を取り出します。外側の関数の戻り値は `() => number` という関数型です。",
    explanationSteps: [
      {
        title: "ReturnType の意味",
        body: "`ReturnType<F>` は関数型 F の戻り値型を取り出します。",
      },
      {
        title: "戻り値型を取り出す",
        body: "`() => () => number` の戻り値は `() => number` です。1 段だけ剥がれます。",
        typeAfter: "() => number",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-parameters-tuple",
    difficulty: "advanced",
    topic: ["conditional", "infer", "tuple"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as Parameters<(a: string, b: number) => void>;`,
    expectedType: "[a: string, b: number]",
    distractors: ["[string, number]", "string | number", "never"],
    explanation:
      "`Parameters` は引数リストをラベル付きタプルとして取り出します。ラベルは型の互換性に影響しませんが、表記に残ります。",
    explanationSteps: [
      {
        title: "Parameters の意味",
        body: "`Parameters<F>` は関数型 F の引数リストをタプルとして取り出します。",
      },
      {
        title: "引数リストをタプルにする",
        body: "`(a: string, b: number) => void` の引数は `[a: string, b: number]` です。",
        typeAfter: "[a: string, b: number]",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-awaited-nested",
    difficulty: "advanced",
    topic: ["conditional", "infer", "promise"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as Awaited<Promise<Promise<number>>>;`,
    expectedType: "number",
    distractors: ["Promise<number>", "Promise<Promise<number>>", "unknown"],
    explanation:
      "`Awaited` はネストした Promise を再帰的に剥がします。`Promise<Promise<number>>` は `number` になります。",
    explanationSteps: [
      {
        title: "1 段剥がす",
        body: "`Promise<Promise<number>>` の内側は `Promise<number>` です。",
        typeAfter: "Promise<number>",
      },
      {
        title: "再帰的に剥がす",
        body: "`Awaited` は Promise が続く限り剥がし続けます。",
        typeAfter: "number",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-record-infer",
    difficulty: "advanced",
    topic: ["conditional", "infer", "object"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { a: 1 } extends Record<string, infer V> ? V : never;`,
    expectedType: "1",
    distractors: ["{ a: 1; }", "string", "never"],
    explanation:
      "`Record<string, infer V>` はインデックスシグネチャに一致するかを見ます。`{ a: 1 }` の値の型は `1` なので V は `1` です。",
    explanationSteps: [
      {
        title: "インデックスシグネチャとの一致を見る",
        body: "`{ a: 1 }` は `Record<string, V>` に代入可能です。",
      },
      {
        title: "値の型を束縛する",
        body: "V は全プロパティの値の型 `1` になります。",
        typeAfter: "1",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-array-element-infer",
    difficulty: "advanced",
    topic: ["conditional", "infer", "array"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as ("a" | "b")[] extends (infer U)[] ? U : never;`,
    expectedType: `"a" | "b"`,
    distractors: [`"a"`, `("a" | "b")[]`, "never"],
    explanation: '`(infer U)[]` は配列の要素型を U として取り出します。要素型は `"a" | "b"` です。',
    explanationSteps: [
      {
        title: "infer の位置",
        body: "`(infer U)[]` は「要素型が U である配列」という形でパターンマッチします。",
      },
      {
        title: "要素型を束縛する",
        body: "`(infer U)[]` は配列の要素型を U に束縛します。",
        typeAfter: `U = "a" | "b"`,
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-union-infer",
    difficulty: "advanced",
    topic: ["conditional", "infer", "union"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { a: string } | { b: number } extends infer U ? U : never;`,
    expectedType: "{ a: string; } | { b: number; }",
    distractors: ["{ a: string; b: number; }", "never", "unknown"],
    explanation:
      "`infer U` は union 全体をそのまま束縛します。分配は起きません（裸の型パラメータではないため）。",
    explanationSteps: [
      {
        title: "infer の束縛範囲",
        body: "`X extends infer U ? U : never` は X をそのまま U に束縛します。",
      },
      {
        title: "union 全体を束縛する",
        body: "`infer U` は対象の型をそのまま U に束縛します。",
        typeAfter: "U = { a: string } | { b: number }",
      },
    ],
  }),
  inferQuestion({
    id: "adv-infer-mapped-keyof-indexed",
    difficulty: "advanced",
    topic: ["mapped types", "keyof", "indexed access"],
    prompt: "`value` の型は？",
    code: `const value = null as unknown as { [K in "a" | "b"]: K }[keyof { a: 1; b: 2 }];`,
    expectedType: `"a" | "b"`,
    distractors: [`{ a: "a"; b: "b"; }`, "1 | 2", "never"],
    explanation:
      'mapped type は `{ a: "a"; b: "b" }` に展開されます。その `keyof` で取り出すと値の union `"a" | "b"` になります。',
    explanationSteps: [
      {
        title: "mapped type を展開する",
        body: '`{ [K in "a" | "b"]: K }` は `{ a: "a"; b: "b" }` です。',
        typeAfter: `{ a: "a"; b: "b" }`,
      },
      {
        title: "indexed access を評価する",
        body: "`keyof` でキーの union を作り、値の union を取り出します。",
        typeAfter: `"a" | "b"`,
      },
    ],
  }),
];
