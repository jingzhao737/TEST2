const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log(`[PAGE CONSOLE] ${msg.text()}`));
    page.on('pageerror', err => console.error(`[PAGE ERROR] ${err.toString()}`));

    console.log("Navigating to http://localhost:5173/ ...");
    await page.goto('http://localhost:5173/');
    
    // Wait for the loader to disappear
    console.log("Waiting for loader to dismiss...");
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 15000 });
    console.log("Loader dismissed. Waiting 2 seconds...");
    await page.waitForTimeout(2000);

    const layout = await page.evaluate(() => {
      const showcase = document.querySelector('#showcase');
      const motion = document.querySelector('#motion');
      return {
        showcaseTop: showcase.offsetTop,
        showcaseHeight: showcase.offsetHeight,
        motionTop: motion.offsetTop
      };
    });
    console.log("Layout details:", layout);

    // Pin scroll distance is showcaseHeight * 3.4
    const pinScrollDistance = layout.showcaseHeight * 3.4;
    console.log(`Calculated Pin Scroll Distance: ${pinScrollDistance}`);

    // Scroll to progress 0.65 (which is showcaseTop + pinScrollDistance * 0.65)
    const targetScroll = layout.showcaseTop + pinScrollDistance * 0.65;
    console.log(`Scrolling to progress 0.65 (scrollY: ${targetScroll}) ...`);
    await page.evaluate((top) => window.scrollTo(0, top), targetScroll);

    // Wait 4 seconds for ScrollTrigger snapping to complete
    console.log("Waiting 4 seconds for scroll snapping to complete...");
    await page.waitForTimeout(4000);

    const finalScroll = await page.evaluate(() => window.scrollY);
    console.log(`Final scrollY after snapping: ${finalScroll}`);

    // ScrollTrigger snap to 1.0 means we should land at showcaseTop + pinScrollDistance
    const expectedSnapScroll = layout.showcaseTop + pinScrollDistance;
    console.log(`Expected snap scrollY (progress 1.0): ${expectedSnapScroll}`);

    const difference = Math.abs(finalScroll - expectedSnapScroll);
    console.log(`Difference: ${difference}px`);

    if (difference < 50) {
      console.log("SUCCESS: Snapped perfectly to progress 1.0 (Motion section)!");
    } else {
      console.log("FAILURE: Did not snap to Motion section.");
    }

    await browser.close();
  } catch (e) {
    console.error("Test error:", e);
  }
})();
