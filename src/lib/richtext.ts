/**
 * バッククォート区切りのインラインコードを解析する。
 *
 * 問題文・解説・モード説明は `const value` のようなコード片を
 * バッククォートで囲んで書く。描画側（`RichText`）がこの結果を使って
 * `<code>` 要素に変換する。
 */

/** バッククォートで分割した断片。 */
export type RichTextSegment = { kind: "text" | "code"; value: string };

/**
 * テキストを「通常テキスト」と「インラインコード」に分割する。
 *
 * 閉じられていないバッククォートは通常テキストとして扱う。
 */
export function parseRichText(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let index = 0;

  while (index < text.length) {
    const start = text.indexOf("`", index);
    if (start === -1) {
      segments.push({ kind: "text", value: text.slice(index) });
      break;
    }

    const end = text.indexOf("`", start + 1);
    if (end === -1) {
      // 閉じられていない場合は残り全体を通常テキストにする
      segments.push({ kind: "text", value: text.slice(index) });
      break;
    }

    if (start > index) {
      segments.push({ kind: "text", value: text.slice(index, start) });
    }
    segments.push({ kind: "code", value: text.slice(start + 1, end) });
    index = end + 1;
  }

  return segments.filter((segment) => segment.value.length > 0);
}
