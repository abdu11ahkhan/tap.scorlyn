const puppeteer = require("puppeteer");

const BASE = process.argv[2];
const PAGES = [
  ["/", "landing"],
  ["/templates", "templates"],
  ["/u/abd", "card"],
  ["/login", "login"],
  ["/faq", "faq"],
  ["/templates/bold/edit", "editor"],
];

// iPhone SE is the narrowest phone still in wide use — if it fits here it fits.
const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14", width: 390, height: 844 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });

  for (const vp of VIEWPORTS) {
    console.log(`\n--- ${vp.name} (${vp.width}px) ---`);
    const page = await browser.newPage();
    await page.setViewport({ ...vp, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

    for (const [path, label] of PAGES) {
      try {
        await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 90000 });
        await new Promise((r) => setTimeout(r, 1200));

        const report = await page.evaluate(() => {
          const doc = document.documentElement;
          const overflow = doc.scrollWidth - doc.clientWidth;

          // Which elements actually stick out past the viewport
          const offenders = [];
          document.querySelectorAll("*").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > window.innerWidth + 2) {
              const desc =
                el.tagName.toLowerCase() +
                (el.className && typeof el.className === "string"
                  ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
                  : "");
              offenders.push(`${desc} (+${Math.round(r.right - window.innerWidth)}px)`);
            }
          });

          // Tap targets below the 44px guideline
          let small = 0;
          document.querySelectorAll("a,button,input,select").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && r.height < 40) small++;
          });

          return {
            overflow,
            offenders: [...new Set(offenders)].slice(0, 4),
            small,
          };
        });

        console.log(
          `  ${label.padEnd(10)} overflow=${String(report.overflow).padStart(4)}px  ` +
            `smallTargets=${report.small}` +
            (report.offenders.length ? `\n      spills: ${report.offenders.join(", ")}` : "")
        );
      } catch (e) {
        console.log(`  ${label.padEnd(10)} FAILED: ${e.message.slice(0, 60)}`);
      }
    }
    await page.close();
  }

  await browser.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
