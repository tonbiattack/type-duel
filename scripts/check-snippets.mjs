/**
 * 問題データ作成用: コード断片をまとめて型検査する（開発時のみ）。
 *
 * 使い方: node scripts/check-snippets.mjs <path-to-json>
 *   JSON: [["id", "code"], ...]
 *
 * 出力: id<TAB>診断コード<TAB>最初のメッセージ
 */
import { readFileSync } from "node:fs";
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
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(VIRTUAL_FILE);

  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName === VIRTUAL_FILE)
    .map((d) => ({
      code: d.code,
      message: ts.flattenDiagnosticMessageText(d.messageText, " "),
    }));

  const inferred = [];
  if (sourceFile !== undefined) {
    const visit = (node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        inferred.push({
          name: node.name.text,
          type: checker.typeToString(checker.getTypeAtLocation(node.name)),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return { diagnostics, inferred };
}

const path = process.argv[2];
if (path === undefined) {
  console.error("使い方: node scripts/check-snippets.mjs <path-to-json>");
  process.exit(1);
}

const cases = JSON.parse(readFileSync(path, "utf8"));

for (const [id, code] of cases) {
  const { diagnostics, inferred } = analyze(code);
  const codes = diagnostics.map((d) => `TS${d.code}`).join(",") || "(診断なし)";
  const message = diagnostics[0]?.message ?? "";
  const value = inferred.find((item) => item.name === "value");
  const valueType = value === undefined ? "" : ` value=${value.type}`;
  console.log(`${id}\t${codes}${valueType}\t${message}`);
}
