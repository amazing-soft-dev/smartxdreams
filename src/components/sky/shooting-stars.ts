/**
 * Shooting stars for StarfieldSky, after the Framer "Starfield" component. One imperative rAF loop moves them
 * and adds and removes their SVG nodes, so React never renders per frame. Positions are in percent of the
 * sky's width and height, as the reference draws them.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

export const SHOOTING_STAR = {
  /** Frequency f, per second: a new one every 1000/f to 3000/f ms. */
  frequency: 0.6,
  /** Start position, in percent. */
  startX: { min: 0, max: 100 },
  startY: { min: 0, max: 30 },
  /** Heading in radians (y down): 0.7π to 0.95π, down and to the left. */
  angle: { min: 0.7 * Math.PI, max: 0.95 * Math.PI },
  /** Percent per 16 ms frame. */
  speed: 0.5,
  /** Trail length, in percent. */
  trail: 8,
  color: "#FFF7C2",
  opacity: 0.2,
  /** Trail stroke width and head radius, in px. */
  lineWidth: 2,
  headRadius: 2.5,
  /** Gaussian blur, in px (CSS blur(0.5px)). */
  blur: 0.5,
  /** Removed once the head leaves this range on either axis, in percent. */
  bounds: { min: -10, max: 110 },
} as const;

/** Longest frame step the loop takes, so a stalled tab does not teleport the shooting stars. */
const MAX_STEP_MS = 100;

export type ShootingStar = { x: number; y: number; dx: number; dy: number };

/** Milliseconds until the next shooting star: 1000/f to 3000/f. */
export function nextSpawnDelay(random: () => number): number {
  return (1000 + random() * 2000) / SHOOTING_STAR.frequency;
}

export function spawnShootingStar(random: () => number): ShootingStar {
  const between = (range: { min: number; max: number }) => range.min + random() * (range.max - range.min);
  const angle = between(SHOOTING_STAR.angle);
  return { x: between(SHOOTING_STAR.startX), y: between(SHOOTING_STAR.startY), dx: Math.cos(angle), dy: Math.sin(angle) };
}

/** Moves a shooting star by `dt` ms at 0.5 % per 16 ms. */
export function stepShootingStar(star: ShootingStar, dt: number): void {
  const distance = (SHOOTING_STAR.speed * dt) / 16;
  star.x += star.dx * distance;
  star.y += star.dy * distance;
}

export function isGone(star: ShootingStar): boolean {
  const { min, max } = SHOOTING_STAR.bounds;
  return star.x < min || star.x > max || star.y < min || star.y > max;
}

export type ShootingStarLoop = { start(): void; stop(): void; dispose(): void };

type Live = { star: ShootingStar; node: SVGGElement; line: SVGLineElement; head: SVGCircleElement };

const pct = (value: number) => `${value.toFixed(3)}%`;

/**
 * Runs shooting stars inside `layer`. Starts stopped; call start() when the sky is on screen and the tab is
 * visible and stop() otherwise. Time only advances while running, so pausing never builds up a burst.
 * dispose() stops the loop and removes every node it added.
 */
export function createShootingStarLoop(
  layer: SVGGElement,
  { filter, random = Math.random }: { filter?: string; random?: () => number } = {},
): ShootingStarLoop {
  const live: Live[] = [];
  let untilSpawn = nextSpawnDelay(random);
  let frame = 0;
  let last: number | null = null;

  const add = () => {
    const node = document.createElementNS(SVG_NS, "g");
    node.setAttribute("opacity", String(SHOOTING_STAR.opacity));
    if (filter) node.setAttribute("filter", filter);
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("stroke", SHOOTING_STAR.color);
    line.setAttribute("stroke-width", String(SHOOTING_STAR.lineWidth));
    line.setAttribute("stroke-linecap", "round");
    const head = document.createElementNS(SVG_NS, "circle");
    head.setAttribute("r", String(SHOOTING_STAR.headRadius));
    head.setAttribute("fill", SHOOTING_STAR.color);
    node.append(line, head);
    layer.append(node);
    live.push({ star: spawnShootingStar(random), node, line, head });
  };

  const draw = ({ star, line, head }: Live) => {
    line.setAttribute("x1", pct(star.x));
    line.setAttribute("y1", pct(star.y));
    line.setAttribute("x2", pct(star.x - star.dx * SHOOTING_STAR.trail));
    line.setAttribute("y2", pct(star.y - star.dy * SHOOTING_STAR.trail));
    head.setAttribute("cx", pct(star.x));
    head.setAttribute("cy", pct(star.y));
  };

  const tick = (now: number) => {
    const dt = last === null ? 0 : Math.min(MAX_STEP_MS, now - last);
    last = now;
    untilSpawn -= dt;
    if (untilSpawn <= 0) {
      add();
      untilSpawn = nextSpawnDelay(random);
    }
    for (let k = live.length - 1; k >= 0; k--) {
      const entry = live[k]!;
      stepShootingStar(entry.star, dt);
      if (isGone(entry.star)) {
        entry.node.remove();
        live.splice(k, 1);
      } else {
        draw(entry);
      }
    }
    frame = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = null;
  };

  let disposed = false;
  return {
    start() {
      if (!frame && !disposed) frame = requestAnimationFrame(tick);
    },
    stop,
    dispose() {
      disposed = true;
      stop();
      for (const entry of live) entry.node.remove();
      live.length = 0;
    },
  };
}
