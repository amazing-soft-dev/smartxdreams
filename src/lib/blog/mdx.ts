import { evaluate } from "@mdx-js/mdx";
import type { MDXContent } from "mdx/types";
import * as runtime from "react/jsx-runtime";
import { rehypeHeadingIds } from "./headings";

/**
 * Compiles a post's MDX body (frontmatter already removed) into a React component.
 *
 * Runs only on the server, and only at build time: every post page is statically generated, so neither
 * the compiler nor the MDX source reaches the browser. A syntax error fails the build and names the file
 * and position.
 */
export async function compileMdx(source: string, file: string): Promise<MDXContent> {
  try {
    const { default: Content } = await evaluate(source, {
      Fragment: runtime.Fragment,
      jsx: runtime.jsx,
      jsxs: runtime.jsxs,
      development: false,
      // Section ids for the table of contents and for links to a section.
      rehypePlugins: [rehypeHeadingIds],
    });
    return Content;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not compile ${file}: ${reason}`);
  }
}
