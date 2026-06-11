const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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

  // Scroll to showcase section
  console.log("Scrolling to #showcase...");
  const showcase = page.locator('#showcase');
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Take screenshot of initial showcase view
  await page.screenshot({ path: path.join(scratchDir, 'v_showcase_start.png') });
  console.log("Captured v_showcase_start.png");

  // Get showcase bounding rect and item Y values
  const showcaseBox = await showcase.boundingBox();
  const startY = showcaseBox.y;
  console.log(`Showcase start absolute Y: ${startY}`);

  // Test scrolling down in increments, recording card transformations and loaded images
  for (let i = 1; i <= 6; i++) {
    const scrollY = startY + i * 250;
    // Perform scroll with velocity simulation by jumping to the target scroll
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(200); // Wait slightly for velocity physics to capture in progress

    // Get current preview status: rotation, scale, image src
    const previewStatus = await page.evaluate(() => {
      const card = document.querySelector('.showcase-sticky-preview-card');
      const img = document.querySelector('.showcase-sticky-preview-img');
      const ticker = document.querySelector('.showcase-global-ticker');
      
      const cardStyle = card ? card.getAttribute('style') : null;
      const imgCount = document.querySelectorAll('.showcase-sticky-preview-img').length;
      const activeImgSrc = img ? img.getAttribute('src') : 'none';
      const tickerHtml = ticker ? ticker.innerHTML : '';
      const cardRect = card ? card.getBoundingClientRect() : null;

      return {
        scrollY: window.scrollY,
        cardStyle,
        imgCount,
        activeImgSrc,
        cardRectY: cardRect ? cardRect.top : 0
      };
    });

    console.log(`scrollY: ${previewStatus.scrollY} | imgCount: ${previewStatus.imgCount} | activeImgSrc: ${previewStatus.activeImgSrc.split('/').pop()} | cardStyle: ${previewStatus.cardStyle} | cardRectY: ${previewStatus.cardRectY.toFixed(1)}`);
    
    // Capture screenshot at each stage
    await page.screenshot({ path: path.join(scratchDir, `v_showcase_scroll_${i}.png`) });
  }

  await browser.close();
  console.log("Done verification!");
})();
