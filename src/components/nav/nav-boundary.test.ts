import { describe, expect, it } from "vitest";
import { importChain, importClosure, isClientModule } from "@/lib/testing/import-closure";

/**
 * The root layout's client modules (the header and its menus, the page transition, the providers) are in
 * every page's JavaScript, with everything they import. The products' full copy and the team are not theirs
 * to import: the layout builds a short summary of each product on the server and passes that (NavProduct).
 */
const isFullContent = (file: string) => file.startsWith("src/content/products/") || file === "src/content/team.ts";

/** How each client module in the list reaches the full content, if it does. */
function reached(modules: string[]): string[] {
  return modules.flatMap((module) => {
    const closure = importClosure(module);
    return [...closure.files.keys()].filter(isFullContent).map((file) => importChain(closure, file));
  });
}

describe("the header's client modules", () => {
  const header = "src/components/nav/Header.tsx";

  it("are found, and their imports are followed", () => {
    // Without this, the checks below would also pass if nothing were walked.
    expect(isClientModule(header)).toBe(true);
    const files = [...importClosure(header).files.keys()];
    expect(files).toEqual(
      expect.arrayContaining([
        "src/components/nav/DesktopNav.tsx",
        "src/components/nav/MobileMenu.tsx",
        "src/components/nav/NavProducts.tsx",
        "src/components/nav/ProductsMenu.tsx",
        "src/components/product/ProductLogo.tsx",
        "src/content/site.ts",
      ]),
    );
    // The walk does see the full content where it is imported: the selectors are for the server.
    expect(reached(["src/content/selectors.ts"]).length).toBeGreaterThan(1);
  });

  it("do not import the products' full copy or the team", () => {
    expect(reached([header, "src/components/nav/NavProducts.tsx"])).toEqual([]);
  });
});

describe("the client modules the root layout renders", () => {
  it("do not import the products' full copy or the team, the page transition included", () => {
    // Where the server side of the layout stops: its client components.
    const modules = [...importClosure("src/app/layout.tsx", isClientModule).files.keys()].filter(isClientModule);
    expect(modules).toEqual(
      expect.arrayContaining(["src/components/nav/Header.tsx", "src/components/transition/TransitionProvider.tsx"]),
    );
    expect(reached(modules)).toEqual([]);
  });
});
