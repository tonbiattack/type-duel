/**
 * Normal 問題集: object / optional / readonly / unknown / never / tuple。
 *
 * 各問の `code` は「`const result: B = value;` が型検査を通るか」を問う。
 * 期待結果は `tests/questions.test.ts` が TypeScript Compiler API で検証する。
 */
import type { Question } from "../../types/question";
import { duelQuestion } from "./shared";

export const normalQuestions: readonly Question[] = [
  duelQuestion({
    id: "normal-object-extra-property",
    difficulty: "normal",
    topic: ["object"],
    prompt: "プロパティが多いオブジェクト型を、少ない型へ代入できるか？",
    code: `type A = { id: number; name: string };
type B = { id: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "TypeScript は構造的部分型です。B が要求する id を A が持っているため、余分な name があっても代入できます（変数経由なので余剰プロパティ検査も働きません）。",
  }),
  duelQuestion({
    id: "normal-object-missing-property",
    difficulty: "normal",
    topic: ["object"],
    prompt: "プロパティが足りないオブジェクト型を、要求の多い型へ代入できるか？",
    code: `type A = { id: number };
type B = { id: number; name: string };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "B は name を要求しますが A にはありません。構造的部分型では必要なプロパティが揃っている必要があるため、A → B は通りません。",
  }),
  duelQuestion({
    id: "normal-optional-to-required",
    difficulty: "normal",
    topic: ["object", "optional"],
    prompt: "省略可能なプロパティを持つ型を、必須プロパティの型へ代入できるか？",
    code: `type A = { id: number; name?: string };
type B = { id: number; name: string };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A の name は省略可能なので undefined になり得ます。B は name: string を必須とするため、A → B は通りません。",
  }),
  duelQuestion({
    id: "normal-required-to-optional",
    difficulty: "normal",
    topic: ["object", "optional"],
    prompt: "必須プロパティを持つ型を、省略可能プロパティの型へ代入できるか？",
    code: `type A = { id: number; name: string };
type B = { id: number; name?: string };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "必須の name: string は name?: string（string | undefined）に含まれます。省略可能にする方向の代入は通ります。",
  }),
  duelQuestion({
    id: "normal-readonly-to-mutable-property",
    difficulty: "normal",
    topic: ["object", "readonly"],
    prompt: "readonly プロパティを持つ型を、書き換え可能な型へ代入できるか？",
    code: `type A = { readonly id: number };
type B = { id: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "TypeScript はプロパティの readonly 修飾子を代入互換性の判定に使いません。読み取り専用 → 書き換え可能の代入も通ってしまいます（既知の緩さ）。",
  }),
  duelQuestion({
    id: "normal-mutable-to-readonly-property",
    difficulty: "normal",
    topic: ["object", "readonly"],
    prompt: "書き換え可能なプロパティを持つ型を、readonly の型へ代入できるか？",
    code: `type A = { id: number };
type B = { readonly id: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "readonly は「読み取り専用として扱う」約束を強めるだけなので、書き換え可能な型から readonly への代入は通ります。",
  }),
  duelQuestion({
    id: "normal-unknown-to-string",
    difficulty: "normal",
    topic: ["unknown"],
    prompt: "unknown 型の値を string 型へ代入できるか？",
    code: `type A = unknown;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "unknown は「何が入るか分からない」型なので、具体的な型へは代入できません。型ガードやアサーションで絞り込む必要があります。",
  }),
  duelQuestion({
    id: "normal-string-to-unknown",
    difficulty: "normal",
    topic: ["unknown"],
    prompt: "string 型の値を unknown 型へ代入できるか？",
    code: `type A = string;
type B = unknown;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "unknown はすべての型の上位型です。どんな値も unknown へは代入できます（取り出すときに絞り込みが必要）。",
  }),
  duelQuestion({
    id: "normal-never-to-string",
    difficulty: "normal",
    topic: ["never"],
    prompt: "never 型の値を string 型へ代入できるか？",
    code: `type A = never;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "never は「値が存在しない」型で、すべての型の部分型です。到達しないコードなので、どの型へも代入できます。",
  }),
  duelQuestion({
    id: "normal-string-to-never",
    difficulty: "normal",
    topic: ["never"],
    prompt: "string 型の値を never 型へ代入できるか？",
    code: `type A = string;
type B = never;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "never は値を持たない型なので、string の値を受け取れません。never へ代入できるのは never だけです。",
  }),
  duelQuestion({
    id: "normal-tuple-to-array",
    difficulty: "normal",
    topic: ["tuple", "array"],
    prompt: "タプル型を配列型へ代入できるか？",
    code: `type A = [string, number];
type B = (string | number)[];

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "タプルは要素型の union 配列として扱えます。[string, number] の各要素は string | number に含まれるため通ります。",
  }),
  duelQuestion({
    id: "normal-array-to-tuple",
    difficulty: "normal",
    topic: ["tuple", "array"],
    prompt: "配列型をタプル型へ代入できるか？",
    code: `type A = (string | number)[];
type B = [string, number];

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "配列は長さも要素の並びも保証しません。タプルは「1 番目が string、2 番目が number」を要求するため、A → B は通りません。",
  }),
  duelQuestion({
    id: "normal-tuple-wider-to-narrower",
    difficulty: "normal",
    topic: ["tuple"],
    prompt: "要素型が広いタプルを、要素型が狭いタプルへ代入できるか？",
    code: `type A = [string | number, string | number];
type B = [string, number];

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A の 0 番目は number も取り得ます。B は 0 番目に string を要求するため、要素ごとの代入互換性が満たされず通りません。",
  }),
  duelQuestion({
    id: "normal-tuple-narrower-to-wider",
    difficulty: "normal",
    topic: ["tuple"],
    prompt: "要素型が狭いタプルを、要素型が広いタプルへ代入できるか？",
    code: `type A = [string, number];
type B = [string | number, string | number];

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation: "各要素が対応する位置の型の部分型になっているため、タプル同士の代入は通ります。",
  }),
  duelQuestion({
    id: "normal-object-union-to-object",
    difficulty: "normal",
    topic: ["object", "union"],
    prompt: "プロパティが異なる union を、片方の型へ代入できるか？",
    code: `type A = { kind: "a"; value: string } | { kind: "b"; count: number };
type B = { kind: "a"; value: string };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      'A には kind: "b" のメンバーも含まれます。union 全体を片方のメンバー型へ代入することはできないため、A → B は通りません。',
  }),
  duelQuestion({
    id: "normal-object-to-object-union",
    difficulty: "normal",
    topic: ["object", "union"],
    prompt: "オブジェクト型を、それを含む union へ代入できるか？",
    code: `type A = { kind: "a"; value: string };
type B = { kind: "a"; value: string } | { kind: "b"; count: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "A は union のメンバーそのものです。union のいずれかに一致すれば代入できるため通ります。",
  }),
  duelQuestion({
    id: "normal-nullable-object-property",
    difficulty: "normal",
    topic: ["object", "null", "optional"],
    prompt: "null 許容プロパティを持つ型を、非 null の型へ代入できるか？",
    code: `type A = { id: number | null };
type B = { id: number };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A の id は null になり得ます。B は id: number を要求するため、プロパティ単位で代入互換性が満たされず通りません。",
  }),
  duelQuestion({
    id: "normal-any-to-string",
    difficulty: "normal",
    topic: ["any"],
    prompt: "any 型の値を string 型へ代入できるか？",
    code: `type A = any;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "any は型検査を無効化する特殊な型で、どの型へも代入できます。ただし型安全性は失われるため実務では避けます。",
  }),
  duelQuestion({
    id: "normal-string-to-any",
    difficulty: "normal",
    topic: ["any"],
    prompt: "string 型の値を any 型へ代入できるか？",
    code: `type A = string;
type B = any;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "any はどの型からも代入を受け付けます。unknown と違い、any は取り出すときにも検査されません。",
  }),
  duelQuestion({
    id: "normal-unknown-to-any",
    difficulty: "normal",
    topic: ["unknown", "any"],
    prompt: "unknown 型の値を any 型へ代入できるか？",
    code: `type A = unknown;
type B = any;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "any は代入先として何でも受け取ります。unknown → any は通りますが、unknown → string は通りません。",
  }),
  duelQuestion({
    id: "normal-empty-object-to-object",
    difficulty: "normal",
    topic: ["object"],
    prompt: "空のオブジェクト型を、プロパティを持つ型へ代入できるか？",
    code: `type A = Record<string, never>;
type B = { id: number };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "Record<string, never> は id プロパティを持ちません。B が要求する id: number を満たせないため、A → B は通りません。",
  }),
  duelQuestion({
    id: "normal-object-missing-third-property",
    difficulty: "normal",
    topic: ["object"],
    prompt: "プロパティが足りないオブジェクト型を、要求の多い型へ代入できるか？",
    code: `type A = { a: number; b: string };
type B = { a: number; b: string; c: boolean };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "B は `c` を要求しますが A にはありません。構造的部分型では必要なプロパティが揃っている必要があります。",
  }),
  duelQuestion({
    id: "normal-optional-explicit-undefined",
    difficulty: "normal",
    topic: ["optional", "undefined"],
    prompt: "省略可能プロパティを、undefined を明示した省略可能プロパティへ代入できるか？",
    code: `type A = { a?: number };
type B = { a?: number | undefined };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`a?: number` は `number | undefined` を含みます。`a?: number | undefined` と実質同じなので代入できます。",
  }),
  duelQuestion({
    id: "normal-undefined-to-optional",
    difficulty: "normal",
    topic: ["optional", "undefined"],
    prompt: "undefined を含むプロパティを、省略可能プロパティへ代入できるか？",
    code: `type A = { a: number | undefined };
type B = { a?: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`a?: number` は `number | undefined` を受け取れます。必須か省略可能かの違いはありますが、型としては互換です。",
  }),
  duelQuestion({
    id: "normal-readonly-array-alias",
    difficulty: "normal",
    topic: ["readonly", "array"],
    prompt: "readonly 配列の糖衣構文を、ReadonlyArray へ代入できるか？",
    code: `type A = readonly string[];
type B = ReadonlyArray<string>;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`readonly string[]` と `ReadonlyArray<string>` は同じ型の別表記です。相互に代入できます。",
  }),
  duelQuestion({
    id: "normal-index-signature-to-object",
    difficulty: "normal",
    topic: ["object", "index signature"],
    prompt: "インデックスシグネチャの型を、具体的なプロパティの型へ代入できるか？",
    code: `type A = { [key: string]: number };
type B = { a: number };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "インデックスシグネチャは「任意のキーがある」ことを示すだけで、`a` が存在する保証はありません。そのため B へは代入できません。",
  }),
  duelQuestion({
    id: "normal-object-to-index-signature",
    difficulty: "normal",
    topic: ["object", "index signature"],
    prompt: "具体的なプロパティを持つ型を、インデックスシグネチャの型へ代入できるか？",
    code: `type A = { a: number };
type B = { [key: string]: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`{ a: number }` は「すべてのプロパティが number」という条件を満たします。インデックスシグネチャへ代入できます。",
  }),
  duelQuestion({
    id: "normal-tuple-shorter-to-longer",
    difficulty: "normal",
    topic: ["tuple"],
    prompt: "要素数が少ないタプルを、要素数が多いタプルへ代入できるか？",
    code: `type A = [string, number];
type B = [string, number, boolean];

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "B は 3 要素を要求しますが A は 2 要素です。タプルは長さも型の一部なので代入できません。",
  }),
  duelQuestion({
    id: "normal-tuple-longer-to-shorter",
    difficulty: "normal",
    topic: ["tuple"],
    prompt: "要素数が多いタプルを、要素数が少ないタプルへ代入できるか？",
    code: `type A = [string, number, boolean];
type B = [string, number];

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation: "タプルは長さが型の一部です。3 要素のタプルを 2 要素のタプルへは代入できません。",
  }),
  duelQuestion({
    id: "normal-union-to-wider-union",
    difficulty: "normal",
    topic: ["union"],
    prompt: "union を、メンバーを追加した union へ代入できるか？",
    code: `type A = { a: string } | { b: number };
type B = { a: string } | { b: number } | { c: boolean };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation: "A の各メンバーが B に含まれています。union を広げる方向の代入は通ります。",
  }),
  duelQuestion({
    id: "normal-wider-union-to-union",
    difficulty: "normal",
    topic: ["union"],
    prompt: "メンバーが多い union を、メンバーが少ない union へ代入できるか？",
    code: `type A = { a: string } | { b: number } | { c: boolean };
type B = { a: string } | { b: number };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A には `{ c: boolean }` が含まれます。B はそれを受け取れないため、A → B は通りません。",
  }),
  duelQuestion({
    id: "normal-function-return-widening",
    difficulty: "normal",
    topic: ["function"],
    prompt: "戻り値が狭い関数を、戻り値が広い関数型へ代入できるか？",
    code: `type A = () => string;
type B = () => string | number;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "戻り値は共変です。`string` は `string | number` の部分型なので、A → B は通ります。",
  }),
  duelQuestion({
    id: "normal-function-return-narrowing",
    difficulty: "normal",
    topic: ["function"],
    prompt: "戻り値が広い関数を、戻り値が狭い関数型へ代入できるか？",
    code: `type A = () => string | number;
type B = () => string;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A は `number` を返す可能性があります。B は `string` だけを期待するため、A → B は通りません。",
  }),
  duelQuestion({
    id: "normal-intersection-to-member",
    difficulty: "normal",
    topic: ["intersection", "object"],
    prompt: "交差型を、その一方の型へ代入できるか？",
    code: `type A = { a: number } & { b: string };
type B = { a: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "交差型は両方のプロパティを持ちます。`{ a: number }` が要求する `a` を満たすため代入できます。",
  }),
  duelQuestion({
    id: "normal-member-to-intersection",
    difficulty: "normal",
    topic: ["intersection", "object"],
    prompt: "一方の型だけを、交差型へ代入できるか？",
    code: `type A = { a: number };
type B = { a: number } & { b: string };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "B は `b` も要求しますが A にはありません。交差型へ代入するには両方の制約を満たす必要があります。",
  }),
  duelQuestion({
    id: "normal-record-to-index-signature",
    difficulty: "normal",
    topic: ["object", "utility"],
    prompt: "Record で作った型を、インデックスシグネチャの型へ代入できるか？",
    code: `type A = Record<string, number>;
type B = { [key: string]: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "`Record<string, number>` は `{ [key: string]: number }` の別表記です。相互に代入できます。",
  }),
  duelQuestion({
    id: "normal-nullable-to-wider-nullable",
    difficulty: "normal",
    topic: ["null", "union"],
    prompt: "null を含む型を、undefined も含む型へ代入できるか？",
    code: `type A = { a: number } | null;
type B = { a: number } | null | undefined;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation: "A の各メンバーが B に含まれています。union を広げる方向なので代入できます。",
  }),
  duelQuestion({
    id: "normal-wider-nullable-to-narrower",
    difficulty: "normal",
    topic: ["null", "union"],
    prompt: "undefined を含む型を、null だけを含む型へ代入できるか？",
    code: `type A = { a: number } | null | undefined;
type B = { a: number } | null;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A には `undefined` が含まれます。B はそれを受け取れないため、A → B は通りません。",
  }),
  duelQuestion({
    id: "normal-readonly-to-readonly",
    difficulty: "normal",
    topic: ["readonly", "object"],
    prompt: "readonly プロパティ同士の代入は通るか？",
    code: `type A = { readonly a: number };
type B = { readonly a: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation: "同じ型なので当然代入できます。readonly 同士でも問題ありません。",
  }),
  duelQuestion({
    id: "normal-mutable-to-readonly-object",
    difficulty: "normal",
    topic: ["readonly", "object"],
    prompt: "書き換え可能なプロパティを、readonly プロパティへ代入できるか？",
    code: `type A = { a: number };
type B = { readonly a: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "readonly は「読み取り専用として扱う」約束を強めるだけです。書き換え可能 → readonly の代入は通ります。",
  }),
];
