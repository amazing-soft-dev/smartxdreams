import { describe, expect, it } from "vitest";
import { clientModules, importChain, importClosure } from "@/lib/testing/import-closure";

/**
 * The photo registry is for the server. A single import from a client component sends every photo's entry,
 * blur preview included, to the browser, along with the zod schema that validates them. Client components
 * take resolved photos as props and render <PhotoImage> instead.
 */
const REGISTRY = ["src/content/photos.ts", "src/content/photos.json"];

describe("client modules", () => {
  const modules = clientModules();

  it("are found, and their imports are followed", () => {
    // Without this, the checks below would also pass if nothing were walked.
    expect(modules.length).toBeGreaterThan(20);
    expect(modules).toContain("src/components/home/ProcessStepper.tsx");
    const stepper = importClosure("src/components/home/ProcessStepper.tsx");
    expect([...stepper.files.keys()]).toEqual(
      expect.arrayContaining(["src/components/ui/PhotoImage.tsx", "src/content/process.ts", "src/lib/cx.ts"]),
    );
    expect(stepper.packages.has("motion")).toBe(true);
    // The server-side Photo does reach the registry, so the walk would see it from a client module too.
    const photo = importClosure("src/components/ui/Photo.tsx");
    for (const file of REGISTRY) expect(photo.files.has(file)).toBe(true);
    expect(photo.packages.has("zod")).toBe(true);
  });

  it("never import the photo registry", () => {
    const reached = modules.flatMap((module) => {
      const closure = importClosure(module);
      return REGISTRY.filter((file) => closure.files.has(file)).map((file) => importChain(closure, file));
    });
    expect(reached).toEqual([]);
  });
});
