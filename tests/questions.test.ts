/**
 * TypeScript Compiler API を使った問題データの正答検証。
 *
 * モードごとに検証する内容が異なる:
 * - Duel: `const result: B = value;` が型検査を通るか
 * - Infer: `const value = ...` から推論される型が `expectedType` と一致するか
 * - Detective: コードが `expectedErrorCode` の診断を出すか（修正例は通ること）
 *
 * 誤った正解データを入れるとこのテストが落ちる。
 * 検証設定は仕様書 §4 に従い固定する（`strict` / `strictNullChecks` / `noEmit`）。
 */
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  allQuestions,
  detectiveQuestions,
  duelQuestions,
  inferQuestions,
} from "../src/data/questions";
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
export type AnalysisResult = {
  /** 診断メッセージ（通った場合は空）。 */
  messages: string[];
  /** 診断コードの一覧。 */
  codes: number[];
  /** `const value = ...` から推論された型（存在しない場合は undefined）。 */
  inferredType: string | undefined;
};

/**
 * コード断片を型検査する。
 *
 * ファイルシステムに触れず、メモリ上のソースだけで完結させる。
 */
export function analyze(code: string): AnalysisResult {
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
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(VIRTUAL_FILE);

  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName === VIRTUAL_FILE);

  let inferredType: string | undefined;
  if (sourceFile !== undefined) {
    const visit = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "value"
      ) {
        inferredType = checker.typeToString(checker.getTypeAtLocation(node.name));
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return {
    messages: diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
    ),
    codes: diagnostics.map((diagnostic) => diagnostic.code),
    inferredType,
  };
}

/** 代入可否だけを返す（Duel 用）。 */
export function checkAssignability(code: string): { assignable: boolean; messages: string[] } {
  const result = analyze(code);
  return { assignable: result.codes.length === 0, messages: result.messages };
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

  it("推論された型を取得できる", () => {
    expect(analyze(`const value = "hello";`).inferredType).toBe(`"hello"`);
    expect(analyze(`let value = "hello";`).inferredType).toBe("string");
  });

  it("診断コードを取得できる", () => {
    expect(analyze(`const value: string = null;`).codes).toContain(2322);
  });
});

describe("Duel 問題の正答検証", () => {
  it("問題集が空でない", () => {
    expect(duelQuestions.length).toBeGreaterThan(0);
  });

  it.each(duelQuestions.map((question) => [question.id, question] as const))(
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

describe("Infer 問題の正答検証", () => {
  it("問題集が空でない", () => {
    expect(inferQuestions.length).toBeGreaterThan(0);
  });

  it.each(inferQuestions.map((question) => [question.id, question] as const))(
    "%s の expectedType がコンパイラの推論結果と一致する",
    (_id, question) => {
      const result = analyze(question.code);

      expect(
        result.inferredType,
        [
          `問題 ${question.id} の推論結果が一致しません。`,
          `期待: ${question.expectedType}`,
          `実際: ${String(result.inferredType)}`,
          `コード:\n${question.code}`,
        ].join("\n"),
      ).toBe(question.expectedType);

      // 正解の選択肢ラベルが expectedType と一致すること
      const answerChoice = question.choices.find((choice) => choice.id === question.answer);
      expect(answerChoice?.label, `${question.id} の正解ラベル`).toBe(question.expectedType);
    },
  );

  it("Infer の問題コードはコンパイルエラーを含まない", () => {
    for (const question of inferQuestions) {
      const result = analyze(question.code);
      expect(result.codes, `${question.id}: ${result.messages.join(" / ")}`).toEqual([]);
    }
  }, 30_000);
});

describe("Detective 問題の正答検証", () => {
  it("問題集が空でない", () => {
    expect(detectiveQuestions.length).toBeGreaterThan(0);
  });

  it.each(detectiveQuestions.map((question) => [question.id, question] as const))(
    "%s が expectedErrorCode の診断を出す",
    (_id, question) => {
      const result = analyze(question.code);

      expect(
        result.codes,
        [
          `問題 ${question.id} が期待する診断を出していません。`,
          `期待: TS${question.expectedErrorCode}`,
          `実際: ${result.codes.map((code) => `TS${code}`).join(", ") || "(診断なし)"}`,
          `メッセージ: ${result.messages.join(" / ")}`,
          `コード:\n${question.code}`,
        ].join("\n"),
      ).toContain(question.expectedErrorCode);
    },
  );

  it("修正例はコンパイルエラーを含まない", () => {
    const withFix = detectiveQuestions.filter((question) => question.fix !== undefined);
    expect(withFix.length).toBeGreaterThan(0);

    for (const question of withFix) {
      const fix = question.fix;
      if (fix === undefined) {
        continue;
      }
      const result = analyze(fix);
      expect(
        result.codes,
        `問題 ${question.id} の修正例がエラーを含みます: ${result.messages.join(" / ")}\n${fix}`,
      ).toEqual([]);
    }
  }, 30_000);

  it("エラーメッセージが正解の選択肢を直接漏らしていない", () => {
    // 診断メッセージに選択肢ラベルがそのまま含まれると、読むだけで答えが分かってしまう。
    for (const question of detectiveQuestions) {
      const result = analyze(question.code);
      const answerChoice = question.choices.find((choice) => choice.id === question.answer);
      if (answerChoice === undefined) {
        continue;
      }
      const message = result.messages.join(" ");
      expect(
        message.includes(answerChoice.label),
        `${question.id} のエラーメッセージが正解ラベル「${answerChoice.label}」を含んでいます`,
      ).toBe(false);
    }
  }, 30_000);
});

describe("全モード共通", () => {
  it("問題集が空でない", () => {
    expect(allQuestions.length).toBeGreaterThan(0);
  });

  it("全問のコードが空でない", () => {
    for (const question of allQuestions) {
      expect(question.code.trim().length, question.id).toBeGreaterThan(0);
    }
  });
});
