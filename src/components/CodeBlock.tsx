import { tokenize } from "../lib/highlight";

type CodeBlockProps = {
  code: string;
  /** スクリーンリーダー向けのラベル。 */
  label?: string;
};

/**
 * TypeScript コードの表示。
 *
 * ハイライトは装飾のみで、読み上げ用に元のコードを
 * `aria-label` として保持する。
 */
export function CodeBlock({
  code,
  label = "TypeScript コード",
}: CodeBlockProps): React.JSX.Element {
  const tokens = tokenize(code);

  return (
    <pre className="code-block" aria-label={label} tabIndex={0}>
      <code>
        {tokens.map((token, index) => (
          <span key={index} className={`tok tok-${token.kind}`}>
            {token.value}
          </span>
        ))}
      </code>
    </pre>
  );
}
