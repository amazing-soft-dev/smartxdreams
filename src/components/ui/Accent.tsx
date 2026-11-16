import { Fragment } from "react";

type AccentProps = {
  /** Text where *starred words* are the accent, e.g. "Every job, *one search*." */
  text: string;
  /** Surface the text sits on. Accents are violet-500 on light (4.62:1) and violet-300 on dark (7.56:1). */
  tone?: "light" | "dark";
};

const ACCENT = /\*([^*]+)\*/g;

/**
 * Renders a heading string with accent words. Copy marks them with asterisks, so content stays plain
 * text in src/content while headings get the brand colour on the accent words only.
 */
export function Accent({ text, tone = "light" }: AccentProps) {
  const parts = text.split(ACCENT);
  const color = tone === "dark" ? "text-violet-300" : "text-violet-500";
  return (
    <>
      {parts.map((part, i) =>
        // split() with a capture group puts the captured accents at odd indexes.
        i % 2 === 1 ? (
          <span key={i} className={color}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** The heading text without accent markers, for metadata and aria labels. */
export function plainText(text: string): string {
  return text.replace(ACCENT, "$1");
}
