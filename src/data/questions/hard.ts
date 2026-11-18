/**
 * Hard 問題集: generic / conditional / indexed access / keyof / mapped types。
 *
 * 各問の `code` は「`const result: B = value;` が型検査を通るか」を問う。
 * 期待結果は `tests/questions.test.ts` が TypeScript Compiler API で検証する。
 */
import type { Question } from "../../types/question";
import { duelQuestion } from "./shared";

export const hardQuestions: readonly Question[] = [
  duelQuestion({
    id: "hard-keyof-to-string",
    difficulty: "hard",
    topic: ["keyof"],
    prompt: "keyof で得たリテラル union を string 型へ代入できるか？",
    code: `type A = keyof { a: number; b: string };
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'keyof { a: number; b: string } は "a" | "b" です。各要素は string の部分型なので、A → B は通ります。',
  }),
  duelQuestion({
    id: "hard-string-to-keyof",
    difficulty: "hard",
    topic: ["keyof"],
    prompt: "string 型を keyof の結果へ代入できるか？",
    code: `type A = string;
type B = keyof { a: number; b: string };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      'B は "a" | "b" という狭い union です。string はそれ以外の値も含むため、A → B は通りません。',
  }),
  duelQuestion({
    id: "hard-indexed-access-to-string",
    difficulty: "hard",
    topic: ["indexed access"],
    prompt: "indexed access で取り出した型を、その基底型へ代入できるか？",
    code: `type A = { id: number; name: string }["name"];
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '["name"] は name プロパティの型 string を取り出します。A と B は同じ string なので代入できます。',
  }),
  duelQuestion({
    id: "hard-indexed-access-union",
    difficulty: "hard",
    topic: ["indexed access", "keyof", "union"],
    prompt: "keyof を使った indexed access の union を、その union へ代入できるか？",
    code: `type Obj = { a: string; b: number };
type A = Obj[keyof Obj];
type B = string | number;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "Obj[keyof Obj] は string | number に展開されます。A と B は同一の union なので代入できます。",
  }),
  duelQuestion({
    id: "hard-indexed-access-narrower",
    difficulty: "hard",
    topic: ["indexed access", "keyof"],
    prompt: "indexed access の union を、その一要素へ代入できるか？",
    code: `type Obj = { a: string; b: number };
type A = Obj[keyof Obj];
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "Obj[keyof Obj] は string | number です。number の可能性を排除できないため、string だけの型へは代入できません。",
  }),
  duelQuestion({
    id: "hard-mapped-type-to-subset",
    difficulty: "hard",
    topic: ["mapped types"],
    prompt: "mapped type で作ったオブジェクトを、その一部の型へ代入できるか？",
    code: `type A = { [K in "a" | "b"]: number };
type B = { a: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "A は { a: number; b: number } に展開されます。B が要求する a: number を満たすため、余分な b があっても代入できます。",
  }),
  duelQuestion({
    id: "hard-mapped-type-missing-key",
    difficulty: "hard",
    topic: ["mapped types"],
    prompt: "mapped type で作ったオブジェクトを、より多いキーを要求する型へ代入できるか？",
    code: `type A = { [K in "a"]: number };
type B = { a: number; b: number };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A は { a: number } に展開され、b を持ちません。B は b: number を要求するため、A → B は通りません。",
  }),
  duelQuestion({
    id: "hard-mapped-type-optional-to-required",
    difficulty: "hard",
    topic: ["mapped types", "optional"],
    prompt: "mapped type で全プロパティを省略可能にした型を、必須の型へ代入できるか？",
    code: `type A = { [K in "a" | "b"]?: number };
type B = { a: number };

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A の a は省略可能なので undefined になり得ます。B は a: number を必須とするため、A → B は通りません。",
  }),
  duelQuestion({
    id: "hard-conditional-resolves-to-true",
    difficulty: "hard",
    topic: ["conditional"],
    prompt: "条件型が解決した true リテラルを、true 型へ代入できるか？",
    code: `type A = "a" extends string ? true : false;
type B = true;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '"a" は string の部分型なので条件型は true に解決されます。A と B は同じ true なので代入できます。',
  }),
  duelQuestion({
    id: "hard-conditional-resolves-to-false",
    difficulty: "hard",
    topic: ["conditional"],
    prompt: "条件型が解決した false リテラルを、true 型へ代入できるか？",
    code: `type A = string extends "a" ? true : false;
type B = true;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      'string は "a" より広いため条件型は false に解決されます。false を true へは代入できません。',
  }),
  duelQuestion({
    id: "hard-conditional-distributes-to-boolean",
    difficulty: "hard",
    topic: ["conditional", "union"],
    prompt: "union に分配された条件型の結果を boolean 型へ代入できるか？",
    code: `type A = ("a" | "b") extends "a" ? true : false;
type B = boolean;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '条件型は union に分配されます。"a" は true、"b" は false に解決されるため A は true | false、つまり boolean です。',
  }),
  duelQuestion({
    id: "hard-conditional-infer",
    difficulty: "hard",
    topic: ["conditional", "infer"],
    prompt: "infer で取り出した型を、その型へ代入できるか？",
    code: `type A = string extends infer U ? U : never;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "infer U は string を推論し、条件型は U（= string）に解決されます。A と B は同じ型なので代入できます。",
  }),
  duelQuestion({
    id: "hard-exclude-result",
    difficulty: "hard",
    topic: ["conditional", "union"],
    prompt: "Exclude で除外した結果を、残ったリテラル型へ代入できるか？",
    code: `type A = Exclude<"a" | "b" | "c", "a" | "b">;
type B = "c";

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'Exclude は union から指定したメンバーを取り除きます。"a" と "b" が除かれ、A は "c" になります。',
  }),
  duelQuestion({
    id: "hard-exclude-result-to-wider",
    difficulty: "hard",
    topic: ["conditional", "union"],
    prompt: "Exclude の結果を、除外前の union へ代入できるか？",
    code: `type A = Exclude<"a" | "b", "a">;
type B = "a" | "b";

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation: 'A は "b" です。"b" は "a" | "b" の部分型なので、A → B は通ります。',
  }),
  duelQuestion({
    id: "hard-nonnullable-result",
    difficulty: "hard",
    topic: ["conditional", "null"],
    prompt: "NonNullable の結果を string 型へ代入できるか？",
    code: `type A = NonNullable<string | null | undefined>;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "NonNullable は null と undefined を取り除きます。A は string になるため、B へ代入できます。",
  }),
  duelQuestion({
    id: "hard-return-type",
    difficulty: "hard",
    topic: ["conditional", "infer"],
    prompt: "ReturnType で取り出した戻り値型を、その型へ代入できるか？",
    code: `type A = ReturnType<() => string>;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "ReturnType は infer で戻り値型を取り出します。A は string なので、B へ代入できます。",
  }),
  duelQuestion({
    id: "hard-generic-identity-to-concrete",
    difficulty: "hard",
    topic: ["generic"],
    prompt: "ジェネリックな関数型を、具体的な引数・戻り値の関数型へ代入できるか？",
    code: `type A = <T>(x: T) => T;
type B = (x: string) => string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "ジェネリック関数は任意の型で使えるため、T を string に具体化すれば B として扱えます。A → B は通ります。",
  }),
  duelQuestion({
    id: "hard-concrete-to-generic-identity",
    difficulty: "hard",
    topic: ["generic"],
    prompt: "具体的な関数型を、ジェネリックな関数型へ代入できるか？",
    code: `type A = (x: string) => string;
type B = <T>(x: T) => T;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "B は任意の T で呼べる必要がありますが、A は string しか受け取れません。number で呼ばれる可能性を満たせないため通りません。",
  }),
  duelQuestion({
    id: "hard-function-parameter-contravariance",
    difficulty: "hard",
    topic: ["generic", "function"],
    prompt: "引数が広い関数を、引数が狭い関数型へ代入できるか？",
    code: `type A = (x: string) => void;
type B = (x: "a") => void;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'strictFunctionTypes では引数は反変的に検査されます。B の引数 "a" は A の引数 string に代入可能なので、A → B は通ります。',
  }),
  duelQuestion({
    id: "hard-function-parameter-contravariance-reverse",
    difficulty: "hard",
    topic: ["generic", "function"],
    prompt: "引数が狭い関数を、引数が広い関数型へ代入できるか？",
    code: `type A = (x: "a") => void;
type B = (x: string) => void;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      'B は string 全体で呼ばれ得ますが、A は "a" しか受け取れません。反変性により string → "a" が成り立たないため通りません。',
  }),
  duelQuestion({
    id: "hard-template-literal-to-string",
    difficulty: "hard",
    topic: ["template literal"],
    prompt: "テンプレートリテラル型を string 型へ代入できるか？",
    code: `type A = \`\${"a" | "b"}-x\`;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      'A は "a-x" | "b-x" に展開されます。各要素は string の部分型なので、A → B は通ります。',
  }),
  duelQuestion({
    id: "hard-string-to-template-literal",
    difficulty: "hard",
    topic: ["template literal"],
    prompt: "string 型をテンプレートリテラル型へ代入できるか？",
    code: `type A = string;
type B = \`\${string}-x\`;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      'B は "-x" で終わる文字列に限られます。string はその条件を満たさない値も含むため、A → B は通りません。',
  }),
  duelQuestion({
    id: "hard-mapped-type-readonly-to-mutable",
    difficulty: "hard",
    topic: ["mapped types", "readonly"],
    prompt: "mapped type で readonly にした型を、書き換え可能な型へ代入できるか？",
    code: `type A = { readonly [K in "a"]: number };
type B = { a: number };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "readonly 修飾子は代入互換性の判定に使われません。A は { readonly a: number } ですが、B へ代入できてしまいます。",
  }),
  duelQuestion({
    id: "hard-mapped-type-over-keyof",
    difficulty: "hard",
    topic: ["mapped types", "keyof"],
    prompt: "keyof を使った mapped type を、その一部の型へ代入できるか？",
    code: `type A = { [K in keyof { a: 1; b: 2 }]: boolean };
type B = { a: boolean };

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "A は { a: boolean; b: boolean } に展開されます。B が要求する a: boolean を満たすため、余分な b があっても代入できます。",
  }),
  duelQuestion({
    id: "hard-tuple-indexed-access",
    difficulty: "hard",
    topic: ["indexed access", "tuple"],
    prompt: "タプルの indexed access で取り出した型を、その型へ代入できるか？",
    code: `type A = [string, number][0];
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "[string, number][0] は 0 番目の要素型 string を取り出します。A と B は同じ型なので代入できます。",
  }),
  duelQuestion({
    id: "hard-keyof-index-signature",
    difficulty: "hard",
    topic: ["keyof"],
    prompt: "インデックスシグネチャの keyof を、string | number へ代入できるか？",
    code: `type A = keyof { [key: string]: number };
type B = string | number;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "文字列インデックスシグネチャの keyof は string | number になります（数値キーも文字列に変換されるため）。A と B は同じ型です。",
  }),
  duelQuestion({
    id: "hard-parameters-tuple",
    difficulty: "hard",
    topic: ["conditional", "infer", "tuple"],
    prompt: "Parameters で取り出したタプルを、同じ形のタプルへ代入できるか？",
    code: `type A = Parameters<(a: string) => void>;
type B = [a: string];

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "Parameters は引数リストをタプルとして取り出します。ラベル付きタプル [a: string] と [string] は互換なので代入できます。",
  }),
];
