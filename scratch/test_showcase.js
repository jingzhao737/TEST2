const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const scratchDir = path.join(__dirname, '..', 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  page.on('console', msg => console.log(`Console [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.error(`PageError: ${err}`));

  console.log("Navigating to http://localhost:5174/ ...");
  await page.goto("http://localhost:5174/");

  console.log("Waiting for loaderFinished...");
  await page.waitForFunction(() => window.loaderFinished === true, { timeout: 10000 });
  console.log("Loader finished!");

  // Take screenshot of home
  await page.screenshot({ path: path.join(scratchDir, 'home.png') });
  console.log("Captured home.png");

  // Scroll to showcase section
  console.log("Scrolling to #showcase...");
  const showcase = page.locator('#showcase');
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(scratchDir, 'showcase_scrolled.png') });
  console.log("Captured showcase_scrolled.png");

  // Incremental scroll to trigger ScrollTrigger pinning
  const box = await showcase.boundingBox();
  if (box) {
    const startY = box.y;
    console.log(`Showcase y position: ${startY}`);
    for (let i = 1; i <= 6; i++) {
      const scrollY = startY + i * 200;
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(scratchDir, `showcase_scroll_${i}.png`) });
      console.log(`Captured showcase_scroll_${i}.png at scrollY=${scrollY}`);
    }
  }

  await browser.close();
  console.log("Done!");
})();
