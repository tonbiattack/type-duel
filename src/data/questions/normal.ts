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
];
