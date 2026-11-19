import { expect, test, type Page } from "@playwright/test";

/**
 * A link click plays the panel transition (docs/motion-audit.md#page-transition): the panels cover the page
 * with the destination's name on them, the route changes underneath, the cover holds so the name can be
 * read, then the panels reveal the new page and focus moves to its h1. The main nav only shows on desktop.
 *
 * The transition is over in about 2.4 s and each phase lasts a few hundred milliseconds. On a busy machine
 * click() can return seconds after the click it made, so a test that then asks "is the cover up?" finds the
 * transition already finished. Instead a recorder in the page notes each phase the moment it happens, with
 * what the page looked like at that moment, and the tests assert on the record afterwards.
 */

type PhaseKind = "cover" | "closed" | "route" | "reveal" | "clear" | "focus";

/** One phase of a navigation, and the page as it was when the phase happened. */
type Phase = {
  kind: PhaseKind;
  /** performance.now() in the page. */
  at: number;
  path: string;
  /** The overlay is shown (data-state="active"). */
  active: boolean;
  /** <html> carries data-page-covered. */
  covered: boolean;
  /** Every panel is at rest across the viewport: the cover is closed. */
  inPlace: boolean;
  /** The name on the cover. */
  label: string;
};

/**
 * Installs the recorder before any of the page's own scripts run. It notes:
 * - cover: the overlay becomes active; closed: every panel's entrance has finished;
 * - route: the path changes (the App Router pushes its history entry when the new page commits);
 * - reveal: data-page-covered is removed, which is when the panels are sent off; clear: the overlay is
 *   no longer active;
 * - focus: focus lands on an h1.
 */
async function recordPhases(page: Page) {
  await page.addInitScript(() => {
    const phases: Phase[] = [];
    (window as unknown as { __phases: Phase[] }).__phases = phases;
    const overlay = () => document.querySelector<HTMLElement>("[data-page-transition]");
    const panels = () => [...document.querySelectorAll<HTMLElement>("[data-page-transition] [data-panel]")];
    const atRest = (panel: HTMLElement) => Math.abs(new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42) < 0.5;
    const note = (kind: PhaseKind) =>
      phases.push({
        kind,
        at: performance.now(),
        path: location.pathname,
        active: overlay()?.dataset.state === "active",
        covered: document.documentElement.hasAttribute("data-page-covered"),
        inPlace: panels().length > 0 && panels().every(atRest),
        label: document.querySelector("[data-transition-label]")?.textContent ?? "",
      });

    new MutationObserver((records) => {
      for (const { target, attributeName } of records) {
        if (attributeName === "data-page-covered" && target === document.documentElement) {
          if (!document.documentElement.hasAttribute(attributeName)) note("reveal");
        } else if (attributeName === "data-state" && target === overlay()) {
          if (overlay()?.dataset.state !== "active") {
            note("clear");
            continue;
          }
          note("cover");
          // The panels' entrance animations are created in the same task that shows the overlay.
          const entering = panels().flatMap((panel) => panel.getAnimations());
          void Promise.all(entering.map((animation) => animation.finished)).then(
            () => note("closed"),
            () => undefined,
          );
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-state", "data-page-covered"] });

    const pushState = history.pushState;
    history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      const from = location.pathname;
      pushState.apply(this, args);
      if (location.pathname !== from) note("route");
    };

    document.addEventListener(
      "focusin",
      (event) => {
        if (event.target instanceof Element && event.target.matches("h1")) note("focus");
      },
      true,
    );
  });
}

/**
 * Home, recorded, settled and hydrated. Settled, because the links' prefetches are then in: the route can
 * change as soon as the cover closes instead of waiting on the network (the transition reveals anyway after
 * 1.5 s). Hydrated, because a click before that is a plain document navigation with no transition: the App
 * Router writes its history entry when its first render commits, and history.state is null until then.
 *
 * Without Home's Earth scene: headless Chromium draws WebGL on the CPU, and with five copies of the page
 * open the scene kept the main thread busy enough that the new route rendered 0.5 to 1.4 s after the cover
 * closed, near the 1.5 s at which the transition stops waiting for it; without the scene, 0.14 to 0.25 s.
 * Two cores make useSceneSupport keep the still plate, as in earth.spec.ts.
 */
async function openHome(page: Page) {
  await recordPhases(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => history.state !== null);
}

/** The record, once it holds a `last` phase. */
async function phasesUntil(page: Page, last: PhaseKind): Promise<Phase[]> {
  await page.waitForFunction(
    (kind) => (window as unknown as { __phases?: Phase[] }).__phases?.some((phase) => phase.kind === kind) === true,
    last,
  );
  return page.evaluate(() => (window as unknown as { __phases: Phase[] }).__phases);
}

/** The one phase of this kind in the record. */
function only(phases: Phase[], kind: PhaseKind): Phase {
  const found = phases.filter((phase) => phase.kind === kind);
  expect(found, `"${kind}" phases recorded`).toHaveLength(1);
  return found[0]!;
}

const mainNavLink = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Main" }).getByRole("link", { name, exact: true });

test.describe("page transition", () => {
  test.skip(({ isMobile }) => isMobile, "the main nav is desktop-only; the mobile menu navigates instantly");
  // Loading Home until the network is idle and clicking a link each take seconds when every core is busy.
  // One at a time, so these three do not add to that load themselves: the transition waits 1.5 s for the
  // new route and then reveals whatever is there, and with eight copies of Home open at once the route took
  // longer than that in one run of fifteen, which the tests rightly report as a reveal before the route.
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  test("covers the page with the destination, then reveals it and focuses its title", async ({ page }) => {
    await openHome(page);
    await mainNavLink(page, "About").click();
    const phases = await phasesUntil(page, "clear");

    // Each phase once, in this order. (Focus moves in the task that lowers the overlay; it is checked below.)
    const order = phases.filter((phase) => phase.kind !== "focus").map((phase) => phase.kind);
    expect(order).toEqual(["cover", "closed", "route", "reveal", "clear"]);

    // Covering: the overlay is up, the page is marked covered and the name is the destination's.
    expect(only(phases, "cover")).toMatchObject({ path: "/", active: true, covered: true, label: "About" });
    expect(only(phases, "closed")).toMatchObject({ path: "/", active: true, covered: true, inPlace: true });
    // The route changes under the closed cover, and the cover is still closed afterwards (the hold).
    expect(only(phases, "route")).toMatchObject({ path: "/about", active: true, covered: true, inPlace: true });
    // The page is told it is in sight as the panels leave, not before, and it is the new page.
    expect(only(phases, "reveal")).toMatchObject({ path: "/about", active: true, covered: false, inPlace: true });
    expect(only(phases, "clear")).toMatchObject({ path: "/about", active: false, covered: false });

    // Revealed: focus went to the new page's title once the overlay was down, and the page is announced.
    expect(only(phases, "focus")).toMatchObject({ path: "/about", active: false, covered: false });
    await expect(page.locator("main h1")).toBeFocused();
    await expect(page.getByRole("status").filter({ hasText: "About page" })).toBeAttached();
  });

  test("holds the closed cover long enough to read the name", async ({ page }) => {
    await openHome(page);
    await mainNavLink(page, "Blog").click();
    const phases = await phasesUntil(page, "reveal");

    // From the moment every panel is in place to the moment they are sent off, still in place.
    const closed = only(phases, "closed");
    const reveal = only(phases, "reveal");
    expect(closed).toMatchObject({ inPlace: true, label: "Blog" });
    expect(reveal).toMatchObject({ inPlace: true });
    // 700 ms readable, then the name's exit (about 500 ms) before the panels move.
    expect(reveal.at - closed.at).toBeGreaterThanOrEqual(1_000);
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("navigates without the overlay but still focuses the new title", async ({ page }) => {
      await openHome(page);
      await mainNavLink(page, "Contact").click();
      const phases = await phasesUntil(page, "focus");

      // No cover at any moment, not only at the end: the route changes, then focus moves to the new title.
      expect(phases.map((phase) => phase.kind)).toEqual(["route", "focus"]);
      expect(only(phases, "focus")).toMatchObject({ path: "/contact", active: false, covered: false });
      await expect(page).toHaveURL(/\/contact$/);
      await expect(page.locator("main h1")).toBeFocused();
    });
  });
});
