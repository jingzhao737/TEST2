const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  page.on('console', msg => console.log(`Console [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.error(`PageError: ${err}`));

  await page.goto("http://localhost:5174/");

  console.log("Waiting for loader...");
  await page.waitForFunction(() => window.loaderFinished === true, { timeout: 10000 });
  console.log("Loader finished!");

  // Let's scroll to showcase
  const showcase = page.locator('#showcase');
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Let's get CSS properties of #showcase and showcase items
  const showcaseInfo = await page.evaluate(() => {
    const sec = document.querySelector('#showcase');
    const grid = document.querySelector('.showcase-grid');
    const items = document.querySelectorAll('.showcase-item');
    const header = document.querySelector('.showcase-header');

    return {
      section: {
        id: sec.id,
        className: sec.className,
        style: sec.getAttribute('style'),
        rect: sec.getBoundingClientRect(),
        computedStyle: {
          position: getComputedStyle(sec).position,
          height: getComputedStyle(sec).height,
          marginTop: getComputedStyle(sec).marginTop,
          display: getComputedStyle(sec).display,
          overflow: getComputedStyle(sec).overflow,
        }
      },
      grid: {
        className: grid.className,
        style: grid.getAttribute('style'),
        rect: grid.getBoundingClientRect(),
        computedStyle: {
          width: getComputedStyle(grid).width,
          transform: getComputedStyle(grid).transform,
          display: getComputedStyle(grid).display,
        }
      },
      items: Array.from(items).map((item, idx) => ({
        index: idx,
        className: item.className,
        style: item.getAttribute('style'),
        rect: item.getBoundingClientRect(),
        opacity: getComputedStyle(item).opacity,
        visibility: getComputedStyle(item).visibility,
      })),
      header: header ? {
        className: header.className,
        rect: header.getBoundingClientRect(),
        opacity: getComputedStyle(header).opacity,
        visibility: getComputedStyle(header).visibility,
      } : null
    };
  });

  console.log("Showcase Info:", JSON.stringify(showcaseInfo, null, 2));

  // Let's scroll down further to see how grid transforms
  console.log("Scrolling by 600px...");
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);

  const showcaseInfo2 = await page.evaluate(() => {
    const sec = document.querySelector('#showcase');
    const grid = document.querySelector('.showcase-grid');
    const items = document.querySelectorAll('.showcase-item');
    return {
      scrollTriggerSpacer: sec.parentElement.className,
      sectionStyle: sec.getAttribute('style'),
      gridStyle: grid.getAttribute('style'),
      gridTransform: getComputedStyle(grid).transform,
      items: Array.from(items).map((item, idx) => ({
        index: idx,
        rect: item.getBoundingClientRect(),
        opacity: getComputedStyle(item).opacity,
      }))
    };
  });
  console.log("Showcase Info after scroll:", JSON.stringify(showcaseInfo2, null, 2));

  await browser.close();
})();
