/**
 * 問題データ作成用の調査ツール（開発時のみ）。
 *
 * コード断片を型検査して、推論結果の型や診断コードを表示する。
 * 問題を書くときに「コンパイラが実際に何を返すか」を確認するために使う。
 *
 * 使い方:
 *   node scripts/inspect.mjs infer 'const value = "hello";'
 *   node scripts/inspect.mjs diag 'const value: string = null;'
 *   node scripts/inspect.mjs file path/to/snippet.ts
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

/** コードを型検査する。 */
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
    .filter((diagnostic) => diagnostic.file?.fileName === VIRTUAL_FILE)
    .map((diagnostic) => ({
      code: diagnostic.code,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
    }));

  const inferred = [];
  if (sourceFile !== undefined) {
    const visit = (node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        const type = checker.getTypeAtLocation(node.name);
        inferred.push({
          name: node.name.text,
          type: checker.typeToString(type),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return { diagnostics, inferred };
}

const [command, ...rest] = process.argv.slice(2);

let code;
if (command === "file") {
  code = readFileSync(rest[0], "utf8");
} else {
  code = rest.join(" ");
}

if (code === undefined || code.trim().length === 0) {
  console.error("使い方: node scripts/inspect.mjs <infer|diag|file> <code|path>");
  process.exit(1);
}

const result = analyze(code);

if (command === "infer" || command === "file") {
  for (const item of result.inferred) {
    console.log(`${item.name}: ${item.type}`);
  }
}

if (command === "diag" || command === "file") {
  if (result.diagnostics.length === 0) {
    console.log("(診断なし)");
  } else {
    for (const diagnostic of result.diagnostics) {
      console.log(`TS${diagnostic.code}: ${diagnostic.message}`);
    }
  }
}
