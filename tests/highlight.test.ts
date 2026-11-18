/**
 * シンタックスハイライトのトークン化テスト。
 */
import { describe, expect, it } from "vitest";
import { tokenize } from "../src/lib/highlight";

/** トークン列を文字列に戻す（元コードと一致するか確認するため）。 */
function join(tokens: ReturnType<typeof tokenize>): string {
  return tokens.map((token) => token.value).join("");
}

describe("tokenize", () => {
  it("元のコードをそのまま復元できる", () => {
    const code = `type A = "hello" | "world";\ndeclare const value: A;\nconst result: string = value;`;
    expect(join(tokenize(code))).toBe(code);
  });

  it("キーワードを識別する", () => {
    const tokens = tokenize("type A = string;");
    expect(tokens.some((token) => token.kind === "keyword" && token.value === "type")).toBe(true);
  });

  it("組み込み型を識別する", () => {
    const tokens = tokenize("type A = string;");
    expect(tokens.some((token) => token.kind === "type" && token.value === "string")).toBe(true);
  });

  it("文字列リテラルを識別する", () => {
    const tokens = tokenize(`type A = "hello";`);
    expect(tokens.some((token) => token.kind === "string" && token.value === `"hello"`)).toBe(true);
  });

  it("数値リテラルを識別する", () => {
    const tokens = tokenize("type A = 42;");
    expect(tokens.some((token) => token.kind === "number" && token.value === "42")).toBe(true);
  });

  it("テンプレートリテラルを 1 トークンとして扱う", () => {
    const code = "type A = `${string}-x`;";
    const tokens = tokenize(code);
    expect(tokens.some((token) => token.kind === "string" && token.value === "`${string}-x`")).toBe(
      true,
    );
    expect(join(tokens)).toBe(code);
  });

  it("閉じられていない文字列でも例外を投げない", () => {
    expect(() => tokenize(`type A = "unterminated`)).not.toThrow();
    expect(join(tokenize(`type A = "unterminated`))).toBe(`type A = "unterminated`);
  });

  it("空文字列を扱える", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("改行とインデントを保持する", () => {
    const code = "type A = string;\n  type B = number;";
    expect(join(tokenize(code))).toBe(code);
  });

  it("エスケープされた引用符を扱える", () => {
    const code = `type A = "a\\"b";`;
    expect(join(tokenize(code))).toBe(code);
  });

  it("記号を punctuation として扱う", () => {
    const tokens = tokenize("|");
    expect(tokens).toEqual([{ kind: "punctuation", value: "|" }]);
  });

  it("識別子を識別する", () => {
    const tokens = tokenize("value");
    expect(tokens).toEqual([{ kind: "identifier", value: "value" }]);
  });
});
