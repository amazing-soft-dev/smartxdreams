type JsonLdProps = {
  /** A schema.org object (or array of objects). Rendered as application/ld+json. */
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Structured data for search engines. "<" is escaped so content can never close the script tag.
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
