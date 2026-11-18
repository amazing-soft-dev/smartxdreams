"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { closestPath } from "@/lib/closest-path";

/**
 * "Did you mean …?" for a mistyped address: the closest real page to the URL that 404ed, if any is close
 * enough to be a typo (/prodcts/acorns -> /products/acorn). Works in the static export too, because it runs
 * in the browser on the 404 page.
 */
export function DidYouMean({ paths }: { paths: string[] }) {
  const pathname = usePathname();
  const suggestion = pathname ? closestPath(pathname, paths) : undefined;
  if (!suggestion) return null;
  return (
    <p className="mt-6 text-body-l text-white/80">
      Did you mean{" "}
      <Link href={suggestion} className="font-medium text-violet-300 underline underline-offset-4">
        {suggestion}
      </Link>
      ?
    </p>
  );
}
