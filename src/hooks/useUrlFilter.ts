"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Keeps a filter value in the URL query (?audience=seniors), so filtered views can be shared and the
 * back button works. Unknown values fall back to the default. Setting the default removes the param.
 *
 * Components using this hook read search params, so render them inside a <Suspense> boundary for the
 * static export.
 */
export function useUrlFilter(param: string, allowed: readonly string[], defaultValue: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get(param);
  const value = raw !== null && allowed.includes(raw) ? raw : defaultValue;

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === defaultValue) params.delete(param);
      else params.set(param, next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [defaultValue, param, pathname, router, searchParams],
  );

  return [value, setValue] as const;
}
