const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });

  await page.goto(process.argv[2], { waitUntil: "networkidle0", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 2000));

  const out = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const rows = [];

    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      // scrollWidth beats getBoundingClientRect for content that overflows
      // its own box — a wide child inside a clipped parent still pushes the
      // document if any ancestor doesn't actually clip.
      const overflowsSelf = el.scrollWidth - el.clientWidth;
      if (r.width > vw + 2 || overflowsSelf > 2) {
        const cs = getComputedStyle(el);
        rows.push({
          tag: el.tagName.toLowerCase(),
          cls: (typeof el.className === "string" ? el.className : "").slice(0, 70),
          rectW: Math.round(r.width),
          scrollOver: overflowsSelf,
          overflowX: cs.overflowX,
          minW: cs.minWidth,
        });
      }
    });

    return {
      vw,
      docScroll: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
      rows: rows.slice(0, 14),
    };
  });

  console.log(`viewport=${out.vw} docScrollWidth=${out.docScroll} bodyScrollWidth=${out.bodyScroll}`);
  console.log("candidates:");
  for (const r of out.rows) {
    console.log(
      `  <${r.tag}> w=${r.rectW} selfOverflow=${r.scrollOver} overflowX=${r.overflowX} minWidth=${r.minW}\n      ${r.cls}`
    );
  }

  await browser.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
