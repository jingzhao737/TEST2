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
  await page.waitForTimeout(2000);

  console.log("Scrolling showcase into view...");
  const showcase = page.locator('.showcase');
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Check positions of all showcase items
  const positions = await page.evaluate(() => {
    const items = document.querySelectorAll('.showcase-item');
    return Array.from(items).map((item, idx) => {
      const rect = item.getBoundingClientRect();
      const style = window.getComputedStyle(item);
      return {
        index: idx,
        title: item.querySelector('.showcase-title')?.textContent,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        position: style.position,
        zIndex: style.zIndex,
        clipPath: style.clipPath,
        opacity: style.opacity,
        display: style.display
      };
    });
  });

  console.log("Showcase items positions:");
  console.log(JSON.stringify(positions, null, 2));

  // Let's scroll a bit and check again
  console.log("Scrolling down by 600px...");
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(1000);

  const positions2 = await page.evaluate(() => {
    const items = document.querySelectorAll('.showcase-item');
    return Array.from(items).map((item, idx) => {
      const rect = item.getBoundingClientRect();
      return {
        index: idx,
        title: item.querySelector('.showcase-title')?.textContent,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    });
  });

  console.log("Showcase items positions after scroll:");
  console.log(JSON.stringify(positions2, null, 2));

  await browser.close();
})();
