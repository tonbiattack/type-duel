/**
 * 問題データ作成用: 複数のコード断片の診断コードを一括表示する（開発時のみ）。
 *
 * 使い方: node scripts/diag-batch.mjs '<json array of [id, code]>'
 */
import ts from "typescript";

const COMPILER_OPTIONS = {
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

const VIRTUAL_FILE = "snippet.ts";

function analyze(code) {
  const host = ts.createCompilerHost(COMPILER_OPTIONS);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    if (fileName === VIRTUAL_FILE) {
      return ts.createSourceFile(fileName, code, languageVersion, true);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreate);
  };
  const originalFileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) => fileName === VIRTUAL_FILE || originalFileExists(fileName);
  const originalReadFile = host.readFile.bind(host);
  host.readFile = (fileName) => (fileName === VIRTUAL_FILE ? code : originalReadFile(fileName));

  const program = ts.createProgram([VIRTUAL_FILE], COMPILER_OPTIONS, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName === VIRTUAL_FILE)
    .map((diagnostic) => ({
      code: diagnostic.code,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
    }));
}

const cases = JSON.parse(process.argv[2] ?? "[]");

for (const [id, code] of cases) {
  const diagnostics = analyze(code);
  if (diagnostics.length === 0) {
    console.log(`${id}\t(診断なし)`);
  } else {
    console.log(
      `${id}\t${diagnostics.map((d) => `TS${d.code}`).join(",")}\t${diagnostics[0].message}`,
    );
  }
}
