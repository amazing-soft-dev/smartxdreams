import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/** Site links go through next/link (prefetching); other links open normally and send no referrer. */
function MdxLink({ href = "", children, ...rest }: ComponentPropsWithoutRef<"a">) {
  const className = "font-medium text-ink underline decoration-violet-500/50 underline-offset-4 hover:decoration-violet-500";
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  );
}

/**
 * How Markdown elements render inside a post. Posts start at h2: the post title is the page's only h1.
 * Spacing and sizes follow the site type scale.
 */
export const mdxComponents: MDXComponents = {
  h2: (props) => <h2 className="mt-12 scroll-mt-28 text-h4" {...props} />,
  h3: (props) => <h3 className="mt-8 scroll-mt-28 text-h6" {...props} />,
  p: (props) => <p className="mt-5 text-body-l text-ink/80" {...props} />,
  ul: (props) => <ul className="mt-5 flex list-disc flex-col gap-2 pl-6 text-body-l text-ink/80 marker:text-violet-500" {...props} />,
  ol: (props) => <ol className="mt-5 flex list-decimal flex-col gap-2 pl-6 text-body-l text-ink/80 marker:text-ink/50" {...props} />,
  li: (props) => <li className="pl-1" {...props} />,
  blockquote: (props) => <blockquote className="mt-6 border-l-2 border-violet-500 pl-5 text-body-l text-ink/75 italic" {...props} />,
  hr: () => <hr className="my-12 border-ink/10" />,
  strong: (props) => <strong className="font-semibold text-ink" {...props} />,
  code: (props) => <code className="rounded bg-canvas-200 px-1.5 py-0.5 font-mono text-[0.9em]" {...props} />,
  a: MdxLink,
};
