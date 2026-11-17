// typescript-eslint 8 cannot load TypeScript 7.0: that release has no JavaScript API.
// The project compiler stays typescript@7.0.2. This points the nested typescript-eslint
// install at @typescript/typescript6 so ESLint can parse with the 6.0 API.
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "node_modules", "@typescript", "typescript6");

if (!existsSync(path.join(source, "package.json"))) {
  console.error("link-eslint-typescript: @typescript/typescript6 is not installed");
  process.exit(1);
}

const hosts = [
  path.join(root, "node_modules", "eslint-config-next", "node_modules", "typescript-eslint"),
  path.join(root, "node_modules", "typescript-eslint"),
  path.join(root, "node_modules", "ts-api-utils"),
].filter((dir) => existsSync(path.join(dir, "package.json")));

if (hosts.length === 0) {
  console.error("link-eslint-typescript: typescript-eslint is not installed");
  process.exit(1);
}

const type = process.platform === "win32" ? "junction" : "dir";

for (const host of hosts) {
  const modules = path.join(host, "node_modules");
  const link = path.join(modules, "typescript");
  mkdirSync(modules, { recursive: true });
  if (existsSync(link)) rmSync(link, { recursive: true, force: true });
  symlinkSync(source, link, type);
}

for (const host of hosts) {
  const linked = path.join(host, "node_modules", "typescript", "package.json");
  if (!existsSync(linked)) {
    console.error(`link-eslint-typescript: ${linked} is not usable`);
    process.exit(1);
  }
}

// @typescript/typescript6 depends on @typescript/old, whose tsc bin is TypeScript 6.
// npm links that bin over typescript@7's tsc. Point the shims back at 7.0.2.
const binDir = path.join(root, "node_modules", ".bin");
for (const name of ["tsc", "tsc.cmd", "tsc.ps1"]) {
  const file = path.join(binDir, name);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  const retargeted = text.replaceAll("@typescript/old/bin/tsc", "typescript/bin/tsc").replaceAll(
    "@typescript\\old\\bin\\tsc",
    "typescript\\bin\\tsc",
  );
  if (retargeted !== text) writeFileSync(file, retargeted);
}
