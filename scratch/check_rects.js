const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  page.on('console', msg => console.log('[Browser Console]', msg.text()));
  page.on('pageerror', err => console.log('[Browser PageError]', err.message));

  console.log("Navigating to http://localhost:5173/ ...");
  await page.goto("http://localhost:5173/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  console.log("Scrolling to #work...");
  const workSection = page.locator('#work');
  await workSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000); // wait for anims and pin

  console.log("Measuring bounding rects...");
  const rects = await page.evaluate(() => {
    const getRect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        selector,
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        centerX: r.left + r.width / 2,
        centerY: r.top + r.height / 2,
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        zIndex: style.zIndex,
        position: style.position,
        transform: style.transform
      };
    };
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      work: getRect("#work"),
      title: getRect(".works-big-title"),
      wrapper: getRect(".works-chroma-wrapper"),
      blob: getRect(".works-chroma-blob"),
      list: getRect(".work-list")
    };
  });

  console.log(JSON.stringify(rects, null, 2));

  console.log("Taking screenshot...");
  await page.screenshot({ path: 'scratch/works_layout.png' });

  await browser.close();
  console.log("Done.");
})();
