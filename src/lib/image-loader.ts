import config from "./image-config.json";

type ImageLoaderArgs = { src: string; width: number; quality?: number };

const widths = [...config.widths].sort((a, b) => a - b);
const largest = widths.at(-1) ?? 0;

/**
 * Image loader for the static export (NEXT_OUTPUT=export), where there is no image optimizer.
 *
 * Photos under /images map to the WebP variant pre-built by `npm run images`, choosing the smallest
 * variant at least as wide as the requested width (or the largest one):
 *   /images/home/desk.jpg at 900 px -> /_img/home/desk-1024.webp
 *
 * Anything else (logos, icons, SVGs) is served as is. The width query keeps Next.js from warning
 * that the loader ignores the width; static hosts ignore it.
 */
export default function imageLoader({ src, width }: ImageLoaderArgs): string {
  const prefix = `${config.sourcePublicPath}/`;
  if (!src.startsWith(prefix)) {
    return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  }
  const relative = src.slice(prefix.length);
  const base = relative.replace(/\.[^./]+$/, "");
  const variant = widths.find((w) => w >= width) ?? largest;
  return `${config.outputPublicPath}/${base}-${variant}.webp`;
}
