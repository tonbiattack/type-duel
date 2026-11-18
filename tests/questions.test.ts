/**
 * TypeScript Compiler API を使った問題データの正答検証。
 *
 * 各問題の `code` を仮想ファイルとして型検査し、
 * 「`const result: B = value;` が通るか」が `answer` と一致するかを確かめる。
 * 誤った正解データを入れるとこのテストが落ちる。
 *
 * 検証設定は仕様書 §4 に従い固定する（`strict` / `strictNullChecks` / `noEmit`）。
 */
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { allQuestions } from "../src/data/questions";
import { DUEL_CHOICE_IDS } from "../src/types/question";

/** 検証に使う固定コンパイラ設定。 */
const COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  strictNullChecks: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true,
  noUnusedLocals: false,
  noUnusedParameters: false,
  exactOptionalPropertyTypes: false,
  noUncheckedIndexedAccess: false,
  types: [],
};

/** 仮想ファイル名。 */
const VIRTUAL_FILE = "question.ts";

/** 型検査の結果。 */
export type AssignabilityResult = {
  /** 代入が通ったか。 */
  assignable: boolean;
  /** 診断メッセージ（通った場合は空）。 */
  messages: string[];
};

/**
 * コード断片を型検査し、代入可否を返す。
 *
 * ファイルシステムに触れず、メモリ上のソースだけで完結させる。
 */
export function checkAssignability(code: string): AssignabilityResult {
  const host = ts.createCompilerHost(COMPILER_OPTIONS);

  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (fileName === VIRTUAL_FILE) {
      return ts.createSourceFile(fileName, code, languageVersion, true);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };

  const originalFileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) => fileName === VIRTUAL_FILE || originalFileExists(fileName);

  const originalReadFile = host.readFile.bind(host);
  host.readFile = (fileName) => (fileName === VIRTUAL_FILE ? code : originalReadFile(fileName));

  const program = ts.createProgram([VIRTUAL_FILE], COMPILER_OPTIONS, host);
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName === VIRTUAL_FILE);

  return {
    assignable: diagnostics.length === 0,
    messages: diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
    ),
  };
}

describe("TypeScript Compiler API の検証基盤", () => {
  it("代入可能なコードを通す", () => {
    const result = checkAssignability(
      `type A = "hello" | "world";\ntype B = string;\ndeclare const value: A;\nconst result: B = value;`,
    );
    expect(result.assignable).toBe(true);
    expect(result.messages).toEqual([]);
  });

  it("代入不可能なコードを検出する", () => {
    const result = checkAssignability(
      `type A = string;\ntype B = "hello";\ndeclare const value: A;\nconst result: B = value;`,
    );
    expect(result.assignable).toBe(false);
    expect(result.messages.length).toBeGreaterThan(0);
  });

  it("any はどの型へも代入できる", () => {
    expect(
      checkAssignability(`declare const value: any;\nconst result: number = value;`).assignable,
    ).toBe(true);
  });

  it("never はどの型へも代入できる", () => {
    expect(
      checkAssignability(`declare const value: never;\nconst result: string = value;`).assignable,
    ).toBe(true);
  });

  it("unknown は具体的な型へ代入できない", () => {
    expect(
      checkAssignability(`declare const value: unknown;\nconst result: string = value;`).assignable,
    ).toBe(false);
  });

  it("strictNullChecks が有効（null は string に代入できない）", () => {
    expect(
      checkAssignability(`declare const value: null;\nconst result: string = value;`).assignable,
    ).toBe(false);
  });

  it("optional プロパティは必須プロパティへ代入できない", () => {
    expect(
      checkAssignability(
        `type A = { id: number; name?: string };\ntype B = { id: number; name: string };\ndeclare const value: A;\nconst result: B = value;`,
      ).assignable,
    ).toBe(false);
  });

  it("構造的部分型（余分なプロパティは許容）", () => {
    expect(
      checkAssignability(
        `type A = { id: number; name: string };\ntype B = { id: number };\ndeclare const value: A;\nconst result: B = value;`,
      ).assignable,
    ).toBe(true);
  });
});

describe("問題データの正答検証", () => {
  it("問題集が空でない", () => {
    expect(allQuestions.length).toBeGreaterThan(0);
  });

  it.each(allQuestions.map((question) => [question.id, question] as const))(
    "%s の answer がコンパイラの判定と一致する",
    (_id, question) => {
      const result = checkAssignability(question.code);
      const expectedAssignable = question.answer === DUEL_CHOICE_IDS.assignable;

      expect(
        result.assignable,
        [
          `問題 ${question.id} の期待値と実際の型検査結果が一致しません。`,
          `期待: ${expectedAssignable ? "代入できる" : "代入できない"}`,
          `実際: ${result.assignable ? "代入できる" : "代入できない"}`,
          result.messages.length > 0 ? `診断: ${result.messages.join(" / ")}` : "",
          `コード:\n${question.code}`,
        ]
          .filter((line) => line.length > 0)
          .join("\n"),
      ).toBe(expectedAssignable);
    },
  );
});
