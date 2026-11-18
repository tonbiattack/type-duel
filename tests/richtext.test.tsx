/**
 * インラインコード描画（バッククォート）のテスト。
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RichText } from "../src/components/RichText";
import { parseRichText } from "../src/lib/richtext";

describe("parseRichText", () => {
  it("バッククォートがなければ通常テキスト 1 つ", () => {
    expect(parseRichText("こんにちは")).toEqual([{ kind: "text", value: "こんにちは" }]);
  });

  it("インラインコードを切り出す", () => {
    expect(parseRichText("`const value` の型は？")).toEqual([
      { kind: "code", value: "const value" },
      { kind: "text", value: " の型は？" },
    ]);
  });

  it("複数のインラインコードを扱う", () => {
    expect(parseRichText("`a` と `b`")).toEqual([
      { kind: "code", value: "a" },
      { kind: "text", value: " と " },
      { kind: "code", value: "b" },
    ]);
  });

  it("閉じられていないバッククォートは通常テキスト", () => {
    expect(parseRichText("`unclosed")).toEqual([{ kind: "text", value: "`unclosed" }]);
  });

  it("空文字列を扱える", () => {
    expect(parseRichText("")).toEqual([]);
  });

  it("空のインラインコードを扱える", () => {
    expect(parseRichText("``")).toEqual([]);
  });

  it("コードが先頭・末尾にあっても動く", () => {
    expect(parseRichText("`a`")).toEqual([{ kind: "code", value: "a" }]);
    expect(parseRichText("x `a`")).toEqual([
      { kind: "text", value: "x " },
      { kind: "code", value: "a" },
    ]);
  });
});

describe("RichText", () => {
  it("インラインコードを code 要素で描画する", () => {
    render(<RichText text="`const value` の型は？" />);
    const code = screen.getByText("const value");
    expect(code.tagName).toBe("CODE");
    expect(code).toHaveClass("inline-code");
  });

  it("通常テキストも描画する", () => {
    render(<RichText text="`a` の型" />);
    expect(screen.getByText(/の型/)).toBeInTheDocument();
  });

  it("バッククォートがなければそのまま表示する", () => {
    render(<RichText text="そのまま" />);
    expect(screen.getByText("そのまま")).toBeInTheDocument();
  });
});
