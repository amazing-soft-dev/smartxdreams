/**
 * Which product the visitor is pointing at or focused on, if any. A tiny module-level store, so the
 * three.js scene can read it every frame without React re-renders, and any element can drive it by
 * carrying data-product="<slug>" (see useProductHighlight).
 */
let active: string | null = null;
const listeners = new Set<(slug: string | null) => void>();

export function getActiveProduct(): string | null {
  return active;
}

export function setActiveProduct(slug: string | null): void {
  if (slug === active) return;
  active = slug;
  for (const listener of listeners) listener(slug);
}

export function subscribeActiveProduct(listener: (slug: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
