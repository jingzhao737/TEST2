const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const scratchDir = path.join('C:', 'Users', 'jackchen', '.gemini', 'antigravity', 'brain', 'b97e653b-10c3-464c-a52f-949e1ff66140', 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log("Navigating to localhost:5174...");
  await page.goto("http://localhost:5174/");

  console.log("Waiting for loader...");
  await page.waitForFunction(() => window.loaderFinished === true, { timeout: 15000 });
  await page.waitForTimeout(1000);

  // We want to capture screenshots at different scroll offsets
  // Let's first find where #showcase is located
  const showcaseOffsetTop = await page.evaluate(() => {
    const el = document.querySelector('#showcase');
    return el ? el.offsetTop : null;
  });

  console.log(`Showcase offsetTop is: ${showcaseOffsetTop}`);

  if (showcaseOffsetTop === null) {
    console.error("Showcase section not found!");
    await browser.close();
    return;
  }

  // Take screenshots at offsetTop - 200, offsetTop, offsetTop + 400, offsetTop + 900, offsetTop + 1800
  const steps = [
    showcaseOffsetTop - 200,
    showcaseOffsetTop,
    showcaseOffsetTop + 450,
    showcaseOffsetTop + 900,
    showcaseOffsetTop + 1350,
    showcaseOffsetTop + 1800
  ];

  for (let i = 0; i < steps.length; i++) {
    const scrollY = steps[i];
    console.log(`\n--- Scrolling to scrollY = ${scrollY} (Step ${i+1}) ---`);
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(1000); // Wait for transition and physics LERP

    // Inspect the stickyZone and card
    const info = await page.evaluate(() => {
      const zone = document.querySelector('.showcase-right-sticky-zone');
      const card = document.querySelector('.showcase-sticky-preview-card');
      const img = document.querySelector('.showcase-sticky-preview-img');
      return {
        scrollY: window.scrollY,
        zone: zone ? {
          rect: zone.getBoundingClientRect(),
          display: getComputedStyle(zone).display,
          position: getComputedStyle(zone).position,
          visibility: getComputedStyle(zone).visibility,
          opacity: getComputedStyle(zone).opacity,
          zIndex: getComputedStyle(zone).zIndex
        } : null,
        card: card ? {
          rect: card.getBoundingClientRect(),
          visibility: getComputedStyle(card).visibility,
          opacity: getComputedStyle(card).opacity,
          transform: getComputedStyle(card).transform
        } : null,
        img: img ? {
          src: img.getAttribute('src'),
          opacity: getComputedStyle(img).opacity,
          clipPath: getComputedStyle(img).clipPath
        } : null
      };
    });

    console.log(`Info at scrollY=${scrollY}:`, JSON.stringify(info, null, 2));

    const filename = `showcase_scroll_${i+1}.png`;
    await page.screenshot({ path: path.join(scratchDir, filename) });
    console.log(`Saved screenshot: ${filename}`);
  }

  await browser.close();
  console.log("\nDone checking scroll steps!");
})();
