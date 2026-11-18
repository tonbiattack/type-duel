/**
 * TypeScript 断片の軽量シンタックスハイライト。
 *
 * 外部ライブラリを足さずに、問題コードに現れる要素
 * （キーワード・型名・文字列リテラル・数値・記号）を着色する。
 * トークン化に失敗しても素のテキストとして表示できるよう、
 * 例外を投げない設計にしている。
 */

/** トークンの種類。CSS クラス名に対応する。 */
export type TokenKind =
  "keyword" | "type" | "string" | "number" | "punctuation" | "identifier" | "plain";

/** ハイライト結果の 1 トークン。 */
export type Token = {
  kind: TokenKind;
  value: string;
};

/** TypeScript の予約語・制御構文。 */
const KEYWORDS = new Set([
  "type",
  "const",
  "let",
  "var",
  "declare",
  "function",
  "return",
  "extends",
  "infer",
  "keyof",
  "readonly",
  "in",
  "as",
  "is",
  "interface",
  "class",
  "implements",
  "new",
  "typeof",
  "void",
  "null",
  "undefined",
  "true",
  "false",
  "this",
  "super",
  "import",
  "export",
  "from",
  "default",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "throw",
  "try",
  "catch",
  "finally",
  "async",
  "await",
  "yield",
  "enum",
  "namespace",
  "module",
  "abstract",
  "public",
  "private",
  "protected",
  "static",
  "override",
  "satisfies",
  "unique",
  "asserts",
]);

/** 組み込みの型名。 */
const BUILTIN_TYPES = new Set([
  "string",
  "number",
  "boolean",
  "symbol",
  "bigint",
  "object",
  "unknown",
  "never",
  "any",
  "Record",
  "Array",
  "ReadonlyArray",
  "Promise",
  "Partial",
  "Required",
  "Readonly",
  "Pick",
  "Omit",
  "Exclude",
  "Extract",
  "NonNullable",
  "Parameters",
  "ReturnType",
  "InstanceType",
  "Awaited",
  "Map",
  "Set",
  "Date",
  "Error",
]);

/** 識別子として扱う文字か。 */
function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

/** 識別子の継続文字か。 */
function isIdentifierPart(char: string): boolean {
  return /[A-Za-z0-9_$]/.test(char);
}

/**
 * コードをトークン列へ分割する。
 *
 * 文字列リテラル（`"` `'` `` ` ``）はテンプレートリテラル内の
 * `${...}` も含めて 1 トークンとして扱う。閉じられていない場合は
 * 残り全体を文字列トークンにする。
 */
export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  const push = (kind: TokenKind, value: string): void => {
    if (value.length === 0) {
      return;
    }
    const last = tokens[tokens.length - 1];
    if (last !== undefined && last.kind === kind) {
      tokens[tokens.length - 1] = { kind, value: last.value + value };
      return;
    }
    tokens.push({ kind, value });
  };

  while (index < code.length) {
    const char = code[index];
    if (char === undefined) {
      break;
    }

    // 空白・改行はそのまま保持する
    if (/\s/.test(char)) {
      let end = index;
      while (end < code.length && /\s/.test(code[end] ?? "")) {
        end += 1;
      }
      push("plain", code.slice(index, end));
      index = end;
      continue;
    }

    // 文字列リテラル
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let end = index + 1;
      let closed = false;
      while (end < code.length) {
        const current = code[end];
        if (current === "\\") {
          end += 2;
          continue;
        }
        if (current === quote) {
          end += 1;
          closed = true;
          break;
        }
        end += 1;
      }
      push("string", code.slice(index, closed ? end : code.length));
      index = closed ? end : code.length;
      continue;
    }

    // 数値リテラル
    if (/[0-9]/.test(char)) {
      let end = index;
      while (end < code.length && /[0-9._]/.test(code[end] ?? "")) {
        end += 1;
      }
      push("number", code.slice(index, end));
      index = end;
      continue;
    }

    // 識別子・キーワード
    if (isIdentifierStart(char)) {
      let end = index;
      while (end < code.length && isIdentifierPart(code[end] ?? "")) {
        end += 1;
      }
      const word = code.slice(index, end);
      if (KEYWORDS.has(word)) {
        push("keyword", word);
      } else if (BUILTIN_TYPES.has(word)) {
        push("type", word);
      } else {
        push("identifier", word);
      }
      index = end;
      continue;
    }

    // 記号
    push("punctuation", char);
    index += 1;
  }

  return tokens;
}
