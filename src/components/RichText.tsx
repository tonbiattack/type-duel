import { parseRichText } from "../lib/richtext";

type RichTextProps = {
  /** バッククォートを含みうるテキスト。 */
  text: string;
  /** 追加のクラス名。 */
  className?: string;
};

/**
 * バッククォート区切りのインラインコードを描画する。
 *
 * 問題文・解説・モード説明は `const value` のようなコード片を
 * バッククォートで囲んで書く。そのまま表示すると記号が目立つため、
 * `<code>` 要素に変換して読みやすくする。
 */
export function RichText({ text, className }: RichTextProps): React.JSX.Element {
  const segments = parseRichText(text);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.kind === "code" ? (
          <code key={index} className="inline-code">
            {segment.value}
          </code>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </span>
  );
}
