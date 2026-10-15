#!/usr/bin/env node
/**
 * ScorlynTap smoke tests: read-only checks against a running server.
 *
 *   npm run build && npm start          (in one terminal)
 *   npm run test:smoke                  (in another)
 *
 * Options:
 *   BASE_URL=http://localhost:3000      server to test (default)
 *   --update                            rewrite the screenshot baselines
 *   SMOKE_ALLOW_PROD=1                  allow BASE_URL to be the live site
 *
 * Every check is a GET of a public page or route. Nothing signs in, submits
 * a form, activates, claims or changes a card, and no real customer data is
 * used: profiles are rendered through /preview/card/<template> with the
 * built-in fictional demo personas. NFC states that need real card rows
 * (inactive, assigned, one-link) are covered by the unit tests instead
 * (tests/unit/nfc-route.test.ts, tests/unit/api-limits.test.ts).
 *
 * Screenshots: see tests/README.md for how baselines are made and approved.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const UPDATE = process.argv.includes("--update");
const BASELINE_DIR = path.join(ROOT, "tests/smoke/baseline");
const OUTPUT_DIR = path.join(ROOT, "tests/smoke/output");

/** Designs whose screenshots are compared: the ones customers use most, plus known edge cases. */
const SCREENSHOT_DESIGNS = [
  "minimal", "bold", "aurora", "sticker", "orbit", "split", // in use by real cards
  "lookbook", "tape", // cover photo pushes the name low
  "dock", // sizes itself off the viewport
  "arena", "strips", // known small-text / small-target designs
  "review", // no dock, own flow
];
/** Share of pixels allowed to differ before a screenshot fails. */
const MAX_DIFF_RATIO = 0.002;

if (/tap\.scorlyn\.com/.test(BASE) && process.env.SMOKE_ALLOW_PROD !== "1") {
  console.error(`Refusing to run against ${BASE}. These checks are read-only, but set SMOKE_ALLOW_PROD=1 to confirm.`);
  process.exit(2);
}

/** Template ids straight from the source, so a new design is covered automatically. */
function templateIds() {
  const src = readFileSync(path.join(ROOT, "src/lib/card.ts"), "utf8");
  const start = src.indexOf("export const CARD_TEMPLATES");
  const end = src.indexOf("] as const;", start);
  const ids = [...src.slice(start, end).matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

async function http(pathname, { redirect = "manual" } = {}) {
  return fetch(BASE + pathname, { redirect });
}

async function main() {
  try {
    await fetch(BASE, { method: "HEAD" });
  } catch {
    console.error(`No server at ${BASE}. Start one first: npm run build && npm start`);
    process.exit(2);
  }
  console.log(`Smoke tests against ${BASE}${UPDATE ? " (updating baselines)" : ""}\n`);

  // ---------------------------------------------------------------- routes
  console.log("Routes");
  const routeChecks = [
    ["unknown profile is a 404", "/u/zz-smoke-no-such-person", 404],
    ["unknown template preview is a 404", "/preview/card/zz-no-such-design", 404],
    ["malformed activation code is a 404", "/activate/not!a!code", 404],
    ["unknown activation code is a 404", "/activate/zzzz2345", 404],
    ["vCard for an unknown profile is a 404", "/api/vcard/zz-smoke-no-such-person", 404],
    ["inactive-card page renders", "/card/inactive", 200],
    ["not-set-up page renders", "/card/not-set-up", 200],
    ["unknown card-state page is a 404", "/card/zz-nope", 404],
    ["homepage renders", "/", 200],
    ["templates gallery renders", "/templates", 200],
  ];
  for (const [name, p, want] of routeChecks) {
    const r = await http(p);
    record(name, r.status === want, `GET ${p} → ${r.status}`);
  }
  for (const src of ["", "?src=nfc", "?src=qr"]) {
    const r = await http(`/api/nfc/zzzz2345${src}`);
    const loc = r.headers.get("location") ?? "";
    record(
      `unknown card code${src || " (untagged)"} → not-set-up page`,
      r.status >= 300 && r.status < 400 && new URL(loc, BASE).pathname === "/card/not-set-up" && !new URL(loc, BASE).search,
      `${r.status} → ${loc}`
    );
  }

  // ------------------------------------------------------------- templates
  const ids = templateIds();
  console.log(`\nTemplates (${ids.length} from src/lib/card.ts)`);
  const browser = await puppeteer.launch();
  try {
    for (const id of ids) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      const problems = [];
      page.on("pageerror", (e) => problems.push(`script error: ${e.message.slice(0, 120)}`));
      page.on("response", (res) => {
        if (res.status() >= 500) problems.push(`${res.status()} from ${res.url().replace(BASE, "")}`);
      });
      const resp = await page.goto(`${BASE}/preview/card/${id}?raw=1`, { waitUntil: "networkidle2", timeout: 90000 }).catch((e) => {
        problems.push(`navigation: ${e.message}`);
        return null;
      });
      if (resp && resp.status() !== 200) problems.push(`status ${resp.status()}`);
      const m = await page
        .evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          text: document.body.innerText.trim().length,
          links: document.querySelectorAll("a[href]").length,
        }))
        .catch(() => ({ overflow: 0, text: 0, links: 0 }));
      if (m.overflow > 0) problems.push(`horizontal overflow ${m.overflow}px`);
      if (m.text < 40) problems.push("page is nearly empty");
      if (m.links < 1) problems.push("no links rendered");
      record(`design "${id}" renders at 390px`, problems.length === 0, problems.join("; "));
      await page.close();
    }

    // ----------------------------------------------------------- screenshots
    console.log(`\nScreenshots (390×844, ${SCREENSHOT_DESIGNS.length} designs)`);
    mkdirSync(BASELINE_DIR, { recursive: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const compare = await browser.newPage();
    for (const id of SCREENSHOT_DESIGNS) {
      if (!ids.includes(id)) {
        record(`screenshot "${id}"`, false, "design no longer exists — update SCREENSHOT_DESIGNS");
        continue;
      }
      const shot = await screenshot(browser, id);
      const basePath = path.join(BASELINE_DIR, `${id}.png`);
      if (UPDATE) {
        writeFileSync(basePath, shot);
        record(`screenshot "${id}"`, true, "baseline updated");
        continue;
      }
      if (!existsSync(basePath)) {
        // Never pass silently: a missing baseline means nothing was compared.
        writeFileSync(path.join(OUTPUT_DIR, `${id}.actual.png`), shot);
        record(`screenshot "${id}"`, false, "no baseline — check tests/smoke/output/, then run npm run test:smoke:update");
        continue;
      }
      const { ratio, diffPng } = await diffImages(compare, readFileSync(basePath), shot);
      const ok = ratio <= MAX_DIFF_RATIO;
      if (!ok) {
        writeFileSync(path.join(OUTPUT_DIR, `${id}.actual.png`), shot);
        writeFileSync(path.join(OUTPUT_DIR, `${id}.diff.png`), diffPng);
      }
      record(`screenshot "${id}"`, ok, `${(ratio * 100).toFixed(3)}% of pixels differ${ok ? "" : " — see tests/smoke/output/"}`);
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
  process.exit(failed.length ? 1 : 0);
}

/** A stable screenshot: reduced motion, every animation settled. */
async function screenshot(browser, id) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${BASE}/preview/card/${id}?raw=1`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const a of document.getAnimations()) {
      const t = a.effect?.getComputedTiming?.();
      if (t && t.iterations === Infinity) {
        a.pause();
        a.currentTime = 0;
      } else {
        a.finish();
      }
    }
    document.documentElement.style.caretColor = "transparent";
  });
  await new Promise((r) => setTimeout(r, 300));
  const png = await page.screenshot({ type: "png" });
  await page.close();
  return Buffer.from(png);
}

/** Pixel comparison inside the browser, so no image library is needed. */
async function diffImages(page, a, b) {
  const out = await page.evaluate(
    async (aUrl, bUrl) => {
      const load = (src) =>
        new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = src;
        });
      const [ia, ib] = await Promise.all([load(aUrl), load(bUrl)]);
      const w = Math.max(ia.width, ib.width);
      const h = Math.max(ia.height, ib.height);
      const draw = (img) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, w, h).data;
      };
      const da = draw(ia);
      const db = draw(ib);
      const diff = document.createElement("canvas");
      diff.width = w;
      diff.height = h;
      const dctx = diff.getContext("2d");
      const dd = dctx.createImageData(w, h);
      let bad = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
        const off = d > 48; // ignore anti-aliasing noise
        if (off) bad++;
        dd.data[i] = off ? 255 : da[i] * 0.3;
        dd.data[i + 1] = off ? 0 : da[i + 1] * 0.3;
        dd.data[i + 2] = off ? 0 : da[i + 2] * 0.3;
        dd.data[i + 3] = 255;
      }
      dctx.putImageData(dd, 0, 0);
      return { ratio: bad / (w * h), diff: diff.toDataURL("image/png") };
    },
    `data:image/png;base64,${a.toString("base64")}`,
    `data:image/png;base64,${b.toString("base64")}`
  );
  return { ratio: out.ratio, diffPng: Buffer.from(out.diff.split(",")[1], "base64") };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
