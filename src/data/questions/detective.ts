/**
 * Detective 問題集: 型エラーの原因を四択で見抜く。
 *
 * 各問の `expectedErrorCode` は TypeScript Compiler API が返す診断コードと
 * 完全に一致させる。`tests/questions.test.ts` が全問を検証する。
 */
import type { DetectiveQuestion } from "../../types/question";
import { detectiveQuestion } from "./shared";

export const detectiveQuestions: readonly DetectiveQuestion[] = [
  detectiveQuestion({
    id: "detective-null-to-string",
    difficulty: "easy",
    topic: ["null", "strictNullChecks"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string = null;`,
    expectedErrorCode: 2322,
    cause: "strictNullChecks が有効なため、null は string に代入できない",
    distractors: [
      "null は予約語なので変数に代入できない",
      "const で宣言した変数に null は使えない",
      "string 型は null を許容する設定になっていない",
    ],
    explanation:
      "`strictNullChecks` が有効だと `null` は `string` の部分型ではありません。`string | null` にするか、null チェックで絞り込みます。",
    fix: `const value: string | null = null;`,
  }),
  detectiveQuestion({
    id: "detective-excess-property",
    difficulty: "easy",
    topic: ["object", "excess property check"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { id: number };
const value: A = { id: 1, name: "x" };`,
    expectedErrorCode: 2353,
    cause: "オブジェクトリテラルの余剰プロパティ検査で name が拒否された",
    distractors: [
      "name プロパティの型が string ではなく number であるべき",
      "id プロパティが必須なのに省略されている",
      "型 A に name を追加する必要がある",
    ],
    explanation:
      "オブジェクトリテラルを直接代入すると余剰プロパティ検査が働きます。`A` にない `name` はエラーになります。変数経由なら検査されません。",
    fix: `type A = { id: number; name: string };
const value: A = { id: 1, name: "x" };`,
  }),
  detectiveQuestion({
    id: "detective-missing-property",
    difficulty: "easy",
    topic: ["object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { id: number; name: string };
const value: A = { id: 1 };`,
    expectedErrorCode: 2741,
    cause: "必須プロパティ name が不足している",
    distractors: [
      "id プロパティの型が number ではなく string であるべき",
      "余剰プロパティ id が指定されている",
      "型 A のプロパティがすべて省略可能である必要がある",
    ],
    explanation:
      "`A` は `name: string` を必須としていますが、オブジェクトリテラルに含まれていません。`name` を追加するか、`name?` にして省略可能にします。",
    fix: `type A = { id: number; name: string };
const value: A = { id: 1, name: "x" };`,
  }),
  detectiveQuestion({
    id: "detective-literal-mismatch",
    difficulty: "easy",
    topic: ["literal", "union"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: "a" = "b";`,
    expectedErrorCode: 2322,
    cause: `リテラル型 "b" は "a" に代入できない`,
    distractors: [
      `"a" は予約語なので型として使えない`,
      `"b" は string 型ではない`,
      "const ではリテラル型を指定できない",
    ],
    explanation:
      '`"a"` は `"a"` という値しか許さないリテラル型です。`"b"` は別の値なので代入できません。',
    fix: `const value: "a" = "a";`,
  }),
  detectiveQuestion({
    id: "detective-generic-inference",
    difficulty: "normal",
    topic: ["generic", "inference"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `function identity<T>(x: T): T {
  return x;
}
const value: number = identity("a");`,
    expectedErrorCode: 2322,
    cause: "T が string と推論され、戻り値 string を number に代入できない",
    distractors: [
      "ジェネリック関数は戻り値の型を指定できない",
      "identity の引数に文字列を渡せない",
      "T の型制約（extends）が不足している",
    ],
    explanation:
      '`identity("a")` から `T = string` と推論され、戻り値は `string` になります。`number` へは代入できません。',
    fix: `function identity<T>(x: T): T {
  return x;
}
const value: string = identity("a");`,
  }),
  detectiveQuestion({
    id: "detective-readonly-push",
    difficulty: "normal",
    topic: ["readonly", "array"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const arr: readonly string[] = ["a"];
arr.push("b");`,
    expectedErrorCode: 2339,
    cause: "readonly 配列には push メソッドが存在しない",
    distractors: [
      "配列の要素型が string ではなく number であるべき",
      "push の引数に文字列を渡せない",
      "const で宣言した配列は変更できない",
    ],
    explanation:
      "`readonly string[]` は読み取り専用なので、要素を追加する `push` を持ちません。変更したいなら `string[]` にします。",
    fix: `const arr: string[] = ["a"];
arr.push("b");`,
  }),
  detectiveQuestion({
    id: "detective-optional-access",
    difficulty: "normal",
    topic: ["optional", "object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { id?: number };
const value: number = {}.id;`,
    expectedErrorCode: 2339,
    cause: "空のオブジェクト型 {} に id プロパティが存在しない",
    distractors: [
      "id が省略可能なので number に代入できない",
      "オブジェクトリテラルに型注釈がない",
      "number 型は undefined を許容しない",
    ],
    explanation:
      "`{}` は `id` を持たないため、`{}.id` の時点でプロパティが存在せずエラーになります。`A` 型として宣言すれば `id` にアクセスできます。",
    fix: `type A = { id?: number };
const obj: A = {};
const value: number | undefined = obj.id;`,
  }),
  detectiveQuestion({
    id: "detective-string-to-number",
    difficulty: "easy",
    topic: ["primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: number = "abc";`,
    expectedErrorCode: 2322,
    cause: "string 型は number 型に代入できない",
    distractors: [
      "文字列リテラルは型注釈に使えない",
      "number 型は文字列を受け入れる設定になっていない",
      "const では型注釈を省略する必要がある",
    ],
    explanation:
      '`string` と `number` は互換性がありません。数値に変換するなら `Number("abc")` のように明示的に変換します。',
    fix: `const value: number = Number("abc");`,
  }),
  detectiveQuestion({
    id: "detective-interface-property-type",
    difficulty: "easy",
    topic: ["object", "interface"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `interface User {
  name: string;
}
const value: User = { name: 1 };`,
    expectedErrorCode: 2322,
    cause: "name に number を指定したが、string が要求されている",
    distractors: [
      "interface ではオブジェクトリテラルを代入できない",
      "User に name プロパティが定義されていない",
      "interface は型注釈として使えない",
    ],
    explanation:
      "`User.name` は `string` と定義されていますが、`1` は `number` です。プロパティの型が一致しないためエラーになります。",
    fix: `interface User {
  name: string;
}
const value: User = { name: "x" };`,
  }),
  detectiveQuestion({
    id: "detective-array-element-type",
    difficulty: "easy",
    topic: ["array"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: number[] = [1, "a"];`,
    expectedErrorCode: 2322,
    cause: "配列の要素に string が含まれているが、number[] が要求されている",
    distractors: [
      "配列リテラルに複数の型を混在させられない",
      "number[] は要素を 1 つしか持てない",
      "配列の要素数が型と一致していない",
    ],
    explanation:
      '`number[]` はすべての要素が `number` である必要があります。`"a"` が含まれるためエラーです。`(number | string)[]` にすれば通ります。',
    fix: `const value: (number | string)[] = [1, "a"];`,
  }),
  detectiveQuestion({
    id: "detective-missing-required-property",
    difficulty: "normal",
    topic: ["object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: { a: number } = {};`,
    expectedErrorCode: 2741,
    cause: "必須プロパティ a が不足している",
    distractors: [
      "空のオブジェクトリテラルは代入に使えない",
      "a プロパティの型が number ではなく undefined である",
      "オブジェクト型に型注釈を付けられない",
    ],
    explanation:
      "`{ a: number }` は `a` を必須としますが、`{}` には含まれていません。`a` を追加するか、`a?` にして省略可能にします。",
    fix: `const value: { a: number } = { a: 1 };`,
  }),
  detectiveQuestion({
    id: "detective-return-type-mismatch",
    difficulty: "normal",
    topic: ["function"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `function toText(x: number): string {
  return x;
}`,
    expectedErrorCode: 2322,
    cause: "戻り値の型が string と宣言されているが、number を返している",
    distractors: [
      "引数 x の型注釈が不足している",
      "関数の戻り値に型注釈を付けられない",
      "number 型を return できない",
    ],
    explanation:
      "戻り値の型注釈が `string` ですが、`return x` は `number` です。`String(x)` で変換するか、戻り値の型を `number` にします。",
    fix: `function toText(x: number): string {
  return String(x);
}`,
  }),
  detectiveQuestion({
    id: "detective-undefined-to-string",
    difficulty: "easy",
    topic: ["undefined", "strictNullChecks"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string = undefined;`,
    expectedErrorCode: 2322,
    cause: "strictNullChecks が有効なため、undefined は string に代入できない",
    distractors: [
      "undefined は予約語なので値として使えない",
      "string 型は undefined を許容する設定になっていない",
      "const で宣言した変数に undefined は使えない",
    ],
    explanation:
      "`strictNullChecks` が有効だと `undefined` は `string` の部分型ではありません。`string | undefined` にするか、初期値を与えます。",
    fix: `const value: string | undefined = undefined;`,
  }),
  detectiveQuestion({
    id: "detective-unknown-property-assign",
    difficulty: "normal",
    topic: ["object", "excess property check"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const obj = { a: 1 };
obj.b = 3;`,
    expectedErrorCode: 2339,
    cause: "obj の型に b プロパティが存在しない",
    distractors: [
      "const で宣言したオブジェクトは変更できない",
      "b プロパティの型が number ではない",
      "オブジェクトリテラルにプロパティを追加できない",
    ],
    explanation:
      "`obj` の型は `{ a: number }` と推論されており、`b` は存在しません。`const` は再代入を禁じますが、プロパティの変更自体は可能です。",
    fix: `const obj: { a: number; b?: number } = { a: 1 };
obj.b = 3;`,
  }),
  detectiveQuestion({
    id: "detective-tuple-length",
    difficulty: "normal",
    topic: ["tuple"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: [string, number] = ["a"];`,
    expectedErrorCode: 2322,
    cause: "タプルが 2 要素を要求しているが、1 要素しかない",
    distractors: [
      "タプルの要素型が string ではなく number であるべき",
      "配列リテラルをタプル型に代入できない",
      "タプルは 3 要素以上必要である",
    ],
    explanation:
      '`[string, number]` は 2 要素を要求しますが、`["a"]` は 1 要素です。要素を追加するか、配列型にします。',
    fix: `const value: [string, number] = ["a", 1];`,
  }),
  detectiveQuestion({
    id: "detective-readonly-property-assign",
    difficulty: "normal",
    topic: ["readonly"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { readonly a: number };
const value: A = { a: 1 };
value.a = 2;`,
    expectedErrorCode: 2540,
    cause: "readonly プロパティ a に再代入しようとしている",
    distractors: [
      "const で宣言した変数のプロパティは変更できない",
      "a プロパティの型が number ではない",
      "型 A に a プロパティが定義されていない",
    ],
    explanation:
      "`readonly a` は読み取り専用です。`const` は変数への再代入を禁じますが、`readonly` はプロパティの書き換えを禁じます。",
    fix: `type A = { a: number };
const value: A = { a: 1 };
value.a = 2;`,
  }),
  detectiveQuestion({
    id: "detective-union-literal-mismatch",
    difficulty: "normal",
    topic: ["union", "literal"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: "a" | "b" = "c";`,
    expectedErrorCode: 2322,
    cause: `リテラル型 "c" は union "a" | "b" に含まれていない`,
    distractors: [
      "union 型にリテラル型を代入できない",
      `"c" は string 型ではない`,
      "union 型は 2 つまでしか要素を持てない",
    ],
    explanation:
      '`"a" | "b"` は 2 つの値しか許しません。`"c"` はどちらでもないためエラーです。union に `"c"` を追加すれば通ります。',
    fix: `const value: "a" | "b" | "c" = "c";`,
  }),
  detectiveQuestion({
    id: "detective-object-to-string",
    difficulty: "normal",
    topic: ["object", "primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string = {};`,
    expectedErrorCode: 2322,
    cause: "オブジェクト型 {} は string 型に代入できない",
    distractors: [
      "空のオブジェクトリテラルは無効である",
      "string 型はオブジェクトを受け入れる設定になっていない",
      "const ではオブジェクトを宣言できない",
    ],
    explanation:
      "`{}` はオブジェクト型であり、`string` とは互換性がありません。文字列化するなら `String({})` や `JSON.stringify` を使います。",
    fix: `const value: string = String({});`,
  }),
  detectiveQuestion({
    id: "detective-void-return",
    difficulty: "hard",
    topic: ["function", "void"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `function log(): void {
  return 1;
}`,
    expectedErrorCode: 2322,
    cause: "戻り値の型が void なのに値を返している",
    distractors: [
      "void 型は関数の引数にしか使えない",
      "return 文は void 関数では書けない",
      "number 型を return できない",
    ],
    explanation:
      "`void` は値を返さないことを示します。`return 1;` のように値を返すとエラーです。値を返すなら戻り値の型を変えます。",
    fix: `function log(): number {
  return 1;
}`,
  }),
  detectiveQuestion({
    id: "detective-optional-property-type",
    difficulty: "hard",
    topic: ["optional", "object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a?: number };
const value: A = { a: "x" };`,
    expectedErrorCode: 2322,
    cause: "省略可能でも、指定する場合は number でなければならない",
    distractors: [
      "省略可能なプロパティには値を指定できない",
      "a プロパティが必須である必要がある",
      "string 型は省略可能プロパティに使えない",
    ],
    explanation:
      "`a?: number` は「`number` または未指定」を意味します。省略はできますが、指定するなら `number` でなければなりません。",
    fix: `type A = { a?: number };
const value: A = { a: 1 };`,
  }),
  detectiveQuestion({
    id: "detective-const-assertion-number",
    difficulty: "hard",
    topic: ["as const", "literal"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: number = "1" as const;`,
    expectedErrorCode: 2322,
    cause: `as const でリテラル型 "1" になり、number に代入できない`,
    distractors: [
      "as const はオブジェクトにしか使えない",
      "number 型に文字列を変換できない",
      "const と as const を同時に使えない",
    ],
    explanation:
      '`"1" as const` は文字列リテラル型 `"1"` です。`number` とは互換性がありません。数値にするなら `1` を使います。',
    fix: `const value: number = 1;`,
  }),
  detectiveQuestion({
    id: "detective-array-to-string",
    difficulty: "hard",
    topic: ["array", "primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string[] = "abc";`,
    expectedErrorCode: 2322,
    cause: "string 型は string[] に代入できない",
    distractors: [
      "文字列リテラルは配列に変換される",
      "string[] は要素を 1 つしか持てない",
      "const では配列型を指定できない",
    ],
    explanation:
      '`string` は単一の文字列、`string[]` は文字列の配列です。互換性がないためエラーになります。配列にするなら `["abc"]` です。',
    fix: `const value: string[] = ["abc"];`,
  }),
  detectiveQuestion({
    id: "detective-union-object-mismatch",
    difficulty: "hard",
    topic: ["union", "object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a: string } | { b: number };
const value: A = { a: 1 };`,
    expectedErrorCode: 2322,
    cause: "a に number を指定したが、union のどちらの型にも一致しない",
    distractors: [
      "union 型にオブジェクトリテラルを代入できない",
      "a プロパティが必須なのは 1 つ目の型だけである",
      "union のメンバーは 2 つまでしか持てない",
    ],
    explanation:
      "`A` は `{ a: string }` か `{ b: number }` のどちらかです。`{ a: 1 }` は `a` が `number` なので前者に一致せず、`b` もないため後者にも一致しません。",
    fix: `type A = { a: string } | { b: number };
const value: A = { a: "x" };`,
  }),
  detectiveQuestion({
    id: "detective-array-element-mismatch",
    difficulty: "hard",
    topic: ["array", "primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const arr = [1, 2];
const value: string[] = arr;`,
    expectedErrorCode: 2322,
    cause: "number[] は string[] に代入できない",
    distractors: [
      "配列リテラルに型注釈を付けられない",
      "string[] は要素を 2 つ以上持てない",
      "const で宣言した配列は再代入できない",
    ],
    explanation:
      "`arr` は `number[]` と推論されます。要素型が異なる `string[]` へは代入できません。",
    fix: `const arr = [1, 2];
const value: string[] = arr.map(String);`,
  }),
  detectiveQuestion({
    id: "detective-string-to-boolean",
    difficulty: "easy",
    topic: ["primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: boolean = "true";`,
    expectedErrorCode: 2322,
    cause: '文字列リテラル "true" は boolean 型に代入できない',
    distractors: [
      "boolean 型は文字列を受け入れる設定になっていない",
      "true は予約語なので文字列にできない",
      "const では boolean 型を指定できない",
    ],
    explanation:
      '`"true"` は文字列であり、`boolean` とは別の型です。真偽値にするなら `true`（クォートなし）を使います。',
    fix: `const value: boolean = true;`,
  }),
  detectiveQuestion({
    id: "detective-number-to-string",
    difficulty: "easy",
    topic: ["primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string = 1 + 1;`,
    expectedErrorCode: 2322,
    cause: "算術演算の結果は number なので string に代入できない",
    distractors: [
      "1 + 1 は定数式として評価されない",
      "string 型は数値を受け入れる設定になっていない",
      "const では式を代入できない",
    ],
    explanation:
      "`1 + 1` は `number` に推論されます。文字列にするなら `String(1 + 1)` やテンプレートリテラルを使います。",
    fix: `const value: string = String(1 + 1);`,
  }),
  detectiveQuestion({
    id: "detective-array-to-number",
    difficulty: "easy",
    topic: ["array", "primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: number = [1, 2];`,
    expectedErrorCode: 2322,
    cause: "配列型 number[] は number 型に代入できない",
    distractors: [
      "配列リテラルに複数の要素を書けない",
      "number 型は配列を受け入れる設定になっていない",
      "const では配列を宣言できない",
    ],
    explanation:
      "`[1, 2]` は `number[]` です。単一の `number` とは互換性がありません。要素を取り出すなら `[1, 2][0]` のようにします。",
    fix: `const value: number = [1, 2][0] ?? 0;`,
  }),
  detectiveQuestion({
    id: "detective-excess-property-alias",
    difficulty: "normal",
    topic: ["object", "excess property check"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a: number };
const value: A = { a: 1, b: 2 };`,
    expectedErrorCode: 2353,
    cause: "オブジェクトリテラルの余剰プロパティ検査で b が拒否された",
    distractors: [
      "b プロパティの型が number ではない",
      "a プロパティが必須なのに省略されている",
      "型 A に b を追加する必要がある",
    ],
    explanation:
      "オブジェクトリテラルを直接代入すると余剰プロパティ検査が働きます。`A` にない `b` はエラーです。",
    fix: `type A = { a: number; b: number };
const value: A = { a: 1, b: 2 };`,
  }),
  detectiveQuestion({
    id: "detective-boolean-to-string",
    difficulty: "easy",
    topic: ["primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string = true;`,
    expectedErrorCode: 2322,
    cause: "boolean 型は string 型に代入できない",
    distractors: [
      "true は予約語なので値として使えない",
      "string 型は真偽値を受け入れる設定になっていない",
      "const では真偽値を宣言できない",
    ],
    explanation:
      "`boolean` と `string` は互換性がありません。文字列にするなら `String(true)` を使います。",
    fix: `const value: string = String(true);`,
  }),
  detectiveQuestion({
    id: "detective-number-array-to-string-array",
    difficulty: "normal",
    topic: ["array"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string[] = [1];`,
    expectedErrorCode: 2322,
    cause: "要素が number なので string[] に代入できない",
    distractors: [
      "配列の要素数が 1 つしかない",
      "string[] は数値を要素に持てない設定になっている",
      "配列リテラルに型注釈を付けられない",
    ],
    explanation:
      "`[1]` は `number[]` です。`string[]` にするなら要素を文字列にする必要があります。",
    fix: `const value: string[] = ["1"];`,
  }),
  detectiveQuestion({
    id: "detective-object-property-type-mismatch",
    difficulty: "normal",
    topic: ["object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: { a: string } = { a: 1 };`,
    expectedErrorCode: 2322,
    cause: "a に number を指定したが、string が要求されている",
    distractors: [
      "オブジェクト型に型注釈を付けられない",
      "a プロパティが定義されていない",
      "number 型はオブジェクトのプロパティに使えない",
    ],
    explanation:
      "`a` は `string` と宣言されていますが、`1` は `number` です。プロパティの型が一致しないためエラーになります。",
    fix: `const value: { a: string } = { a: "1" };`,
  }),
  detectiveQuestion({
    id: "detective-null-to-number",
    difficulty: "easy",
    topic: ["null", "strictNullChecks"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: number = null;`,
    expectedErrorCode: 2322,
    cause: "strictNullChecks が有効なため、null は number に代入できない",
    distractors: [
      "null は number に自動変換される",
      "number 型は null を許容する設定になっていない",
      "const では null を宣言できない",
    ],
    explanation:
      "`strictNullChecks` が有効だと `null` は `number` の部分型ではありません。`number | null` にするか、null チェックで絞り込みます。",
    fix: `const value: number | null = null;`,
  }),
  detectiveQuestion({
    id: "detective-empty-array-to-string",
    difficulty: "normal",
    topic: ["array", "primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string = [];`,
    expectedErrorCode: 2322,
    cause: "空配列は never[] と推論され、string に代入できない",
    distractors: [
      "空の配列リテラルは無効である",
      "string 型は配列を受け入れる設定になっていない",
      "const では空配列を宣言できない",
    ],
    explanation:
      "`[]` は要素型を推論できないため `never[]` になります。`string` とは互換性がありません。",
    fix: `const value: string = "";`,
  }),
  detectiveQuestion({
    id: "detective-object-to-number",
    difficulty: "normal",
    topic: ["object", "primitive"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: number = {};`,
    expectedErrorCode: 2322,
    cause: "オブジェクト型 {} は number 型に代入できない",
    distractors: [
      "空のオブジェクトリテラルは無効である",
      "number 型はオブジェクトを受け入れる設定になっていない",
      "const ではオブジェクトを宣言できない",
    ],
    explanation:
      "`{}` はオブジェクト型であり、`number` とは互換性がありません。数値化するなら `Number({})` のように明示的に変換します。",
    fix: `const value: number = Number({});`,
  }),
  detectiveQuestion({
    id: "detective-missing-property-alias",
    difficulty: "normal",
    topic: ["object"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `type A = { a: number };
const value: A = {};`,
    expectedErrorCode: 2741,
    cause: "必須プロパティ a が不足している",
    distractors: [
      "空のオブジェクトリテラルは代入に使えない",
      "a プロパティの型が number ではなく undefined である",
      "型 A にプロパティを追加する必要がある",
    ],
    explanation:
      "`A` は `a` を必須としますが、`{}` には含まれていません。`a` を追加するか、`a?` にして省略可能にします。",
    fix: `type A = { a: number };
const value: A = { a: 1 };`,
  }),
  detectiveQuestion({
    id: "detective-empty-tuple",
    difficulty: "hard",
    topic: ["tuple"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: [number] = [];`,
    expectedErrorCode: 2322,
    cause: "タプルが 1 要素を要求しているが、0 要素しかない",
    distractors: [
      "空の配列リテラルはタプルに代入できない",
      "タプルの要素型が number ではなく string であるべき",
      "タプルは 2 要素以上必要である",
    ],
    explanation:
      "`[number]` は 1 要素を要求しますが、`[]` は 0 要素です。要素を追加するか、配列型にします。",
    fix: `const value: [number] = [1];`,
  }),
  detectiveQuestion({
    id: "detective-number-to-string-literal",
    difficulty: "hard",
    topic: ["primitive", "literal"],
    prompt: "このコードがコンパイルエラーになる原因は？",
    code: `const value: string = 0;`,
    expectedErrorCode: 2322,
    cause: "数値リテラル 0 は string 型に代入できない",
    distractors: [
      "0 は falsy なので型検査で無視される",
      "string 型は数値を受け入れる設定になっていない",
      "const では数値を宣言できない",
    ],
    explanation:
      "`0` は `number`（より正確にはリテラル型 `0`）であり、`string` とは互換性がありません。`String(0)` で変換します。",
    fix: `const value: string = String(0);`,
  }),
];
