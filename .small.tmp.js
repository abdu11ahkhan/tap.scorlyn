const puppeteer = require("puppeteer");
(async () => {
  const b = await puppeteer.launch({ headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  await p.goto(process.argv[2], { waitUntil: "networkidle0", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 2000));
  const list = await p.evaluate(() => {
    const out = {};
    document.querySelectorAll("a,button,input,select").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.height < 40) {
        const k = `${el.tagName.toLowerCase()} h=${Math.round(r.height)} :: ${(typeof el.className === "string" ? el.className : "").slice(0, 55)}`;
        out[k] = (out[k] || 0) + 1;
      }
    });
    return out;
  });
  Object.entries(list).sort((a,b)=>b[1]-a[1]).slice(0,8).forEach(([k,v]) => console.log(`  ${v}x  ${k}`));
  await b.close();
})();
