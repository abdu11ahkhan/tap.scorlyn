const puppeteer = require("puppeteer");

/**
 * Reproduce the Safari failure.
 *
 * Safari throws on Storage access in two real situations:
 *   - Private Browsing on older versions (QuotaExceededError on setItem)
 *   - "Block all cookies" / cross-site restrictions (SecurityError on *any*
 *     access, including reads)
 * Chrome never does this, which is why it only shows up on Safari.
 */
const BREAK_STORAGE = `
  const boom = () => { throw new DOMException("The operation is insecure.", "SecurityError"); };
  for (const key of ["localStorage", "sessionStorage"]) {
    Object.defineProperty(window, key, {
      configurable: true,
      get: boom,
    });
  }
`;

(async () => {
  const url = process.argv[2];
  const browser = await puppeteer.launch({ headless: "new" });

  for (const broken of [false, true]) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    if (broken) await page.evaluateOnNewDocument(BREAK_STORAGE);

    await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
    await new Promise((r) => setTimeout(r, 2500));

    const visibleText = await page.evaluate(() =>
      (document.body.innerText || "").trim().length
    );
    const hasName = await page.evaluate(() =>
      document.body.innerText.includes("abdullah")
    );

    console.log(
      `storage ${broken ? "THROWS (Safari private)" : "works (Chrome)"}: ` +
        `visibleChars=${visibleText} cardRendered=${hasName} ` +
        `errors=${errors.length ? JSON.stringify(errors.slice(0, 2)) : "none"}`
    );
    await page.close();
  }

  await browser.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
