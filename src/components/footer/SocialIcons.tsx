import type { SocialNetwork } from "@/content/site";
import { socialLinks } from "@/content/site";

const names: Record<SocialNetwork, string> = {
  linkedin: "LinkedIn",
  x: "X",
  github: "GitHub",
  youtube: "YouTube",
};

/** 20 px glyphs drawn in currentColor, so one CSS colour change recolours them (white, coral on hover). */
const paths: Record<SocialNetwork, string> = {
  linkedin:
    "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-1.75 3.27-1.75 3.5 0 4.12 2.05 4.12 4.72v6.53h-4v-5.8c0-1.38-.03-3.15-1.92-3.15-1.92 0-2.21 1.5-2.21 3.05v5.9H9.5v-11Z",
  x: "M17.53 3H20.6l-6.7 7.66L21.8 21h-6.17l-4.83-6.32L5.27 21H2.2l7.17-8.2L1.8 3h6.33l4.37 5.78L17.53 3Zm-1.08 16.2h1.7L7.27 4.7H5.45l11 14.5Z",
  github:
    "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z",
  youtube:
    "M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2C2 8.75 2 12 2 12s0 3.25.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10 15V9l5.2 3L10 15Z",
};

/** Social profile links. Renders nothing until socialLinks in site.ts has real URLs. */
export function SocialIcons() {
  if (socialLinks.length === 0) return null;
  return (
    <ul className="mt-6 flex gap-2" aria-label="SmartxDreams on social media">
      {socialLinks.map(({ network, href }) => (
        <li key={network}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`SmartxDreams on ${names[network]} (opens in a new tab)`}
            className="inline-flex size-11 items-center justify-center rounded-full text-white transition-colors duration-250 hover:text-coral-400"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path d={paths[network]} fill="currentColor" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
