const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

  await page.goto("http://localhost:5173");
  await page.waitForTimeout(2500);

  // Scroll showcase into view
  await page.locator('.showcase').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/sc_state0.png" });

  // Check overall state
  const info = await page.evaluate(() => {
    const section = document.querySelector('.showcase');
    const grid = document.querySelector('.showcase-grid');
    const items = document.querySelectorAll('.showcase-item');
    const pager = document.querySelector('.showcase-global-ticker');
    const progressEl = document.querySelector('.showcase-global-progress');
    const st = section ? section.getBoundingClientRect() : null;
    const gt = grid ? grid.getBoundingClientRect() : null;

    return {
      sectionClasses: section?.className,
      gridClasses: grid?.className,
      sectionRect: st ? { top: st.top, left: st.left, width: st.width, height: st.height } : null,
      gridRect: gt ? { top: gt.top, left: gt.left, width: gt.width, height: gt.height } : null,
      hasPager: !!pager,
      hasProgress: !!progressEl,
      items: Array.from(items).map((item, idx) => {
        const r = item.getBoundingClientRect();
        const cs = window.getComputedStyle(item);
        return {
          idx,
          title: item.querySelector('.showcase-title')?.textContent?.trim(),
          top: r.top, left: r.left, width: r.width, height: r.height,
          position: cs.position,
          zIndex: cs.zIndex,
          clipPath: cs.clipPath,
          opacity: cs.opacity,
          transform: cs.transform,
        };
      })
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Slowly scroll through the showcase to see transitions
  for (let step = 1; step <= 4; step++) {
    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(700);
    await page.screenshot({ path: `C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/sc_state${step}.png` });
  }

  await browser.close();
  console.log("Done.");
})();
