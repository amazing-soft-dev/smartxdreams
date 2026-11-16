import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Centers content at the 1280 px content width with 20 / 40 px side gutters. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-[calc(var(--container-content)+5rem)] px-5 md:px-10", className)}>{children}</div>;
}
