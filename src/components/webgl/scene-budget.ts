/**
 * Lets several decorative WebGL scenes share the GPU: at most one draws at a time. Each scene reports when
 * it is on screen, with a priority; only the visible scene with the highest priority draws, and the others
 * hold their last frame (their static fallbacks sit underneath). The hero backdrop outranks the footer
 * smoke, so on a short page or a very tall screen where both are visible, only the hero animates.
 */
const visible = new Map<string, number>();

export function setSceneVisible(id: string, priority: number, isVisible: boolean): void {
  if (isVisible) visible.set(id, priority);
  else visible.delete(id);
}

/** True when this scene is the highest-priority visible scene. */
export function isTopScene(id: string): boolean {
  let top: string | null = null;
  let best = -Infinity;
  for (const [key, priority] of visible) {
    if (priority > best) {
      best = priority;
      top = key;
    }
  }
  return top === id;
}

/** Scene priorities. */
export const SCENE_PRIORITY = { earth: 3, astra: 2, smoke: 1 } as const;
