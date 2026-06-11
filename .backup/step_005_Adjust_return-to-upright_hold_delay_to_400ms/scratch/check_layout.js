const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("http://localhost:5174/");
  await page.waitForFunction(() => window.loaderFinished === true, { timeout: 10000 });

  const showcase = page.locator('#showcase');
  const box = await showcase.boundingBox();
  const startY = box.y;
  console.log(`Showcase initial absolute Y: ${startY}`);

  // We scroll from startY - 200 to startY + 2000 in steps of 200px
  for (let scrollY = Math.max(0, startY - 200); scrollY <= startY + 2000; scrollY += 200) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(100);

    const layout = await page.evaluate(() => {
      const sec = document.querySelector('#showcase');
      const parent = sec.parentElement;
      const grid = document.querySelector('.showcase-grid');
      const item = document.querySelector('.showcase-item');
      
      const secRect = sec.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      return {
        scrollY: window.scrollY,
        parentClass: parent.className,
        secTop: secRect.top,
        secBottom: secRect.bottom,
        secHeight: secRect.height,
        secStyle: sec.getAttribute('style'),
        secComputedMarginTop: getComputedStyle(sec).marginTop,
        parentTop: parentRect.top,
        parentBottom: parentRect.bottom,
        parentHeight: parentRect.height,
        gridLeft: gridRect.left,
        gridWidth: gridRect.width,
        itemOpacity: getComputedStyle(item).opacity,
      };
    });

    console.log(`scrollY: ${layout.scrollY} | secStyle: ${layout.secStyle ? layout.secStyle.substring(0, 50) + '...' : 'null'} | secTop: ${layout.secTop.toFixed(1)} | parentTop: ${layout.parentTop.toFixed(1)} | itemOpacity: ${layout.itemOpacity}`);
  }

  await browser.close();
})();
