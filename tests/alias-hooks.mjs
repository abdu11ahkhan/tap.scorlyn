// Module-resolution hooks for the unit tests (registered by tests/register.mjs).
//
// Node 24 runs .ts files natively by stripping types, but it doesn't know the
// project's "@/..." path alias (tsconfig "paths") and, being ESM, it won't
// guess file extensions. This maps "@/x" to src/x and tries .ts/.tsx/index.ts
// for extension-less imports inside src/ and tests/. No dependencies needed.
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const TRIES = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx"];

function find(base) {
  for (const t of TRIES) {
    const p = base + t;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  // Next ships "next/server" etc. as CommonJS files without an exports map,
  // so plain ESM resolution needs the extension spelled out.
  if (/^next\/[a-z-]+$/.test(specifier)) return next(`${specifier}.js`, context);
  let base = null;
  if (specifier.startsWith("@/")) {
    base = path.join(SRC, specifier.slice(2));
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const parent = fileURLToPath(context.parentURL);
    if (parent.startsWith(SRC) || parent.startsWith(path.join(ROOT, "tests"))) {
      base = path.resolve(path.dirname(parent), specifier);
    }
  }
  if (base) {
    const hit = find(base);
    if (hit) return next(pathToFileURL(hit).href, context);
  }
  return next(specifier, context);
}
