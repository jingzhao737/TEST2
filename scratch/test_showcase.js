const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

  console.log("Navigating to http://localhost:5173...");
  await page.goto("http://localhost:5173");
  await page.waitForTimeout(3000);

  // Check grid class list on load
  const gridClasses = await page.evaluate(() => document.querySelector('.showcase-grid').className);
  console.log("Grid classes on load:", gridClasses);

  // Scroll to showcase section
  const showcaseY = await page.evaluate(() => {
    const el = document.querySelector('.showcase');
    return el.getBoundingClientRect().top + window.scrollY;
  });
  console.log("Showcase section Y position:", showcaseY);

  // Take screenshot on load
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/showcase_load.png" });

  // Scroll in increments to trigger animations
  for (let i = 0; i < 5; i++) {
    const scrollPos = showcaseY + i * 300;
    await page.evaluate(pos => window.scrollTo(0, pos), scrollPos);
    await page.waitForTimeout(1000);

    // Log active styles of items
    const itemStyles = await page.evaluate(() => {
      const items = document.querySelectorAll('.showcase-item');
      return Array.from(items).map((el, idx) => {
        const computed = window.getComputedStyle(el);
        return {
          idx,
          transform: el.style.transform,
          computedTransform: computed.transform,
          opacity: el.style.opacity,
          computedOpacity: computed.opacity,
          filter: el.style.filter,
          computedFilter: computed.filter,
          top: el.getBoundingClientRect().top,
          visibility: computed.visibility,
          zIndex: computed.zIndex
        };
      });
    });

    console.log(`\n--- Scroll to ${scrollPos}px ---`);
    for (const s of itemStyles) {
      console.log(`  Card ${s.idx}:`);
      console.log(`    top: ${s.top}px`);
      console.log(`    opacity: inline="${s.opacity}", computed="${s.computedOpacity}"`);
      console.log(`    transform: inline="${s.transform}", computed="${s.computedTransform}"`);
      console.log(`    filter: inline="${s.filter}", computed="${s.computedFilter}"`);
      console.log(`    visibility: ${s.visibility}`);
      console.log(`    zIndex: ${s.zIndex}`);
    }

    await page.screenshot({ path: `C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/showcase_scroll_${i}.png` });
  }

  await browser.close();
  console.log("Browser closed.");
})();
