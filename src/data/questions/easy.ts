/**
 * Easy 問題集: literal / primitive / union / array。
 *
 * 各問の `code` は「`const result: B = value;` が型検査を通るか」を問う。
 * 期待結果は `tests/questions.test.ts` が TypeScript Compiler API で検証する。
 */
import type { Question } from "../../types/question";
import { duelQuestion } from "./shared";

export const easyQuestions: readonly Question[] = [
  duelQuestion({
    id: "easy-literal-to-string",
    difficulty: "easy",
    topic: ["literal", "primitive"],
    prompt: "リテラル型の値を string 型へ代入できるか？",
    code: `type A = "hello" | "world";
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "リテラル型は string の部分型です。A の各要素が string に含まれるため、A → B の代入は通ります。",
  }),
  duelQuestion({
    id: "easy-string-to-literal",
    difficulty: "easy",
    topic: ["literal", "primitive"],
    prompt: "string 型の値をリテラル型へ代入できるか？",
    code: `type A = string;
type B = "hello";

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      'string は "hello" 以外の値も取り得るため、より狭いリテラル型へは代入できません。逆向き（リテラル → string）は通ります。',
  }),
  duelQuestion({
    id: "easy-number-literal-union-to-number",
    difficulty: "easy",
    topic: ["literal", "union", "primitive"],
    prompt: "数値リテラルの union を number 型へ代入できるか？",
    code: `type A = 1 | 2 | 3;
type B = number;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "1 | 2 | 3 の各リテラルは number の部分型です。union の全要素が代入可能なので A → B は通ります。",
  }),
  duelQuestion({
    id: "easy-number-to-number-literal-union",
    difficulty: "easy",
    topic: ["literal", "union", "primitive"],
    prompt: "number 型の値を数値リテラルの union へ代入できるか？",
    code: `type A = number;
type B = 1 | 2;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "number には 3 や 0.5 も含まれます。1 | 2 はその一部でしかないため、A → B は通りません。",
  }),
  duelQuestion({
    id: "easy-literal-to-wider-union",
    difficulty: "easy",
    topic: ["literal", "union"],
    prompt: "単一リテラルを、それを含む union へ代入できるか？",
    code: `type A = "a";
type B = "a" | "b";

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '"a" は union の構成要素そのものです。A の値はすべて B に含まれるため代入できます。',
  }),
  duelQuestion({
    id: "easy-union-to-member-literal",
    difficulty: "easy",
    topic: ["union", "literal"],
    prompt: "union 型の値を、その一要素だけの型へ代入できるか？",
    code: `type A = "a" | "b";
type B = "a";

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      'A は "b" も取り得ます。union 全体を一要素へ絞り込む代入はできないため、A → B は通りません。',
  }),
  duelQuestion({
    id: "easy-boolean-to-true",
    difficulty: "easy",
    topic: ["literal", "primitive"],
    prompt: "boolean 型の値を true リテラル型へ代入できるか？",
    code: `type A = boolean;
type B = true;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "boolean は true | false の union です。false の可能性を排除できないため、true だけの型へは代入できません。",
  }),
  duelQuestion({
    id: "easy-true-to-boolean",
    difficulty: "easy",
    topic: ["literal", "primitive"],
    prompt: "true リテラル型を boolean 型へ代入できるか？",
    code: `type A = true;
type B = boolean;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "true は boolean（= true | false）の部分型です。リテラルから広い型への代入は常に通ります。",
  }),
  duelQuestion({
    id: "easy-mutable-array-to-readonly",
    difficulty: "easy",
    topic: ["array", "readonly"],
    prompt: "書き換え可能な配列を readonly 配列へ代入できるか？",
    code: `type A = string[];
type B = readonly string[];

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "string[] は readonly string[] として扱えます。読み取り専用の約束を強める方向の代入は安全なので通ります。",
  }),
  duelQuestion({
    id: "easy-readonly-array-to-mutable",
    difficulty: "easy",
    topic: ["array", "readonly"],
    prompt: "readonly 配列を書き換え可能な配列へ代入できるか？",
    code: `type A = readonly string[];
type B = string[];

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "readonly string[] を string[] に入れると、読み取り専用の約束を破って書き換えられてしまいます。そのため代入できません。",
  }),
  duelQuestion({
    id: "easy-narrow-array-to-wide-array",
    difficulty: "easy",
    topic: ["array", "union"],
    prompt: "要素型が狭い配列を、要素型が広い配列へ代入できるか？",
    code: `type A = (string | number)[];
type B = (string | number | boolean)[];

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "配列は要素型に対して共変です。要素型が広がる方向（部分型 → 上位型）の代入は通ります。",
  }),
  duelQuestion({
    id: "easy-wide-array-to-narrow-array",
    difficulty: "easy",
    topic: ["array", "union"],
    prompt: "要素型が広い配列を、要素型が狭い配列へ代入できるか？",
    code: `type A = (string | number | boolean)[];
type B = (string | number)[];

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A には boolean 要素が入り得ます。B は boolean を受け取れないため、A → B の代入は通りません。",
  }),
  duelQuestion({
    id: "easy-literal-to-union-with-number",
    difficulty: "easy",
    topic: ["literal", "union"],
    prompt: "文字列リテラルを string | number へ代入できるか？",
    code: `type A = "hello";
type B = string | number;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      '"hello" は string の部分型で、string は union の構成要素です。A の値はすべて B に含まれます。',
  }),
  duelQuestion({
    id: "easy-union-to-string",
    difficulty: "easy",
    topic: ["union", "primitive"],
    prompt: "string | number を string 型へ代入できるか？",
    code: `type A = string | number;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A は number も取り得ます。union の一部だけを残す代入はできないため、A → B は通りません。",
  }),
  duelQuestion({
    id: "easy-numeric-literal-to-number",
    difficulty: "easy",
    topic: ["literal", "primitive"],
    prompt: "数値リテラル型を number 型へ代入できるか？",
    code: `type A = 42;
type B = number;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation: "42 は number の部分型です。リテラル型から基底の primitive 型への代入は通ります。",
  }),
  duelQuestion({
    id: "easy-number-to-numeric-literal",
    difficulty: "easy",
    topic: ["literal", "primitive"],
    prompt: "number 型を数値リテラル型へ代入できるか？",
    code: `type A = number;
type B = 42;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "number は 42 以外の値も取り得ます。リテラル型は number より狭いので、A → B は通りません。",
  }),
  duelQuestion({
    id: "easy-string-array-to-union-array",
    difficulty: "easy",
    topic: ["array", "union"],
    prompt: "string[] を (string | number)[] へ代入できるか？",
    code: `type A = string[];
type B = (string | number)[];

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "string は string | number の部分型です。配列の要素型が広がる方向なので、A → B は通ります。",
  }),
  duelQuestion({
    id: "easy-union-array-to-string-array",
    difficulty: "easy",
    topic: ["array", "union"],
    prompt: "(string | number)[] を string[] へ代入できるか？",
    code: `type A = (string | number)[];
type B = string[];

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "A には number 要素が入り得ます。string[] は number を受け取れないため、A → B は通りません。",
  }),
  duelQuestion({
    id: "easy-null-to-nullable-string",
    difficulty: "easy",
    topic: ["null", "union"],
    prompt: "null 型を string | null へ代入できるか？",
    code: `type A = null;
type B = string | null;

declare const value: A;
const result: B = value;`,
    assignable: true,
    explanation:
      "strictNullChecks が有効でも、null は union に明示的に含まれていれば代入できます。",
  }),
  duelQuestion({
    id: "easy-nullable-string-to-string",
    difficulty: "easy",
    topic: ["null", "union"],
    prompt: "string | null を string 型へ代入できるか？",
    code: `type A = string | null;
type B = string;

declare const value: A;
const result: B = value;`,
    assignable: false,
    explanation:
      "strictNullChecks が有効なため、null は string に代入できません。null チェックで絞り込む必要があります。",
  }),
];
