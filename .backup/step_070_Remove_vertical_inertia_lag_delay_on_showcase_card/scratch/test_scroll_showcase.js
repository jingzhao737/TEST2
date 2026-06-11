const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log(`[PAGE CONSOLE] ${msg.text()}`));
    page.on('pageerror', err => console.error(`[PAGE ERROR] ${err.toString()}`));

    console.log("Navigating to local dev server http://localhost:5173/ ...");
    await page.goto('http://localhost:5173/');
    
    // Wait for the loader to disappear
    console.log("Waiting for loader to dismiss...");
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 15000 });
    console.log("Loader dismissed. Waiting 2 seconds...");
    await page.waitForTimeout(2000);

    // Get offset of showcase
    const showcaseOffsetTop = await page.evaluate(() => {
      return document.querySelector('#showcase').offsetTop;
    });
    console.log(`Showcase Section starts at scrollY: ${showcaseOffsetTop}`);

    // Scroll to showcase start
    console.log("Scrolling directly to #showcase...");
    await page.evaluate((top) => window.scrollTo(0, top), showcaseOffsetTop);
    await page.waitForTimeout(1000);
    let currentScroll = await page.evaluate(() => window.scrollY);
    console.log(`Current scrollY: ${currentScroll}`);

    // Scroll down inside showcase pin range
    console.log("Scrolling down inside pinned showcase region in 10 increments...");
    for (let i = 1; i <= 10; i++) {
      const targetScroll = showcaseOffsetTop + i * 200;
      await page.evaluate((top) => window.scrollTo(0, top), targetScroll);
      await page.waitForTimeout(100);
    }
    
    currentScroll = await page.evaluate(() => window.scrollY);
    console.log(`Current scrollY after card scrolls: ${currentScroll}`);

    // Scroll further down to reach motion section
    const motionOffsetTop = await page.evaluate(() => {
      return document.querySelector('#motion').offsetTop;
    });
    console.log(`Motion Section starts at scrollY: ${motionOffsetTop}`);

    console.log("Scrolling down to #motion...");
    await page.evaluate((top) => window.scrollTo(0, top), motionOffsetTop);
    await page.waitForTimeout(1000);

    currentScroll = await page.evaluate(() => window.scrollY);
    console.log(`Current scrollY after scrolling to motion: ${currentScroll}`);

    if (Math.abs(currentScroll - motionOffsetTop) < 10) {
      console.log("SUCCESS: Successfully scrolled past Showcase and reached Motion section without getting stuck!");
    } else {
      console.log("FAILURE: Page failed to scroll or got stuck before reaching Motion.");
    }

    await browser.close();
  } catch (e) {
    console.error("Test error:", e);
  }
})();
