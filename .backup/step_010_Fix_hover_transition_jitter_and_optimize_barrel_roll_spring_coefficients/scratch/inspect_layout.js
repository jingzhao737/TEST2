const { chromium } = require('playwright');
const path = require('path');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Listen to console log messages
    page.on('console', msg => console.log(`[PAGE CONSOLE] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.toString()}`));

    console.log("Navigating to http://localhost:5173/ ...");
    await page.goto('http://localhost:5173/');
    
    // Wait for the loader to disappear
    console.log("Waiting for loader to dismiss...");
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 15000 });
    console.log("Loader dismissed. Waiting 2 more seconds for layout settlement...");
    await page.waitForTimeout(2000);

    // Get layout info
    const layout = await page.evaluate(() => {
      const getInfo = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          id: el.id,
          className: el.className,
          offsetTop: el.offsetTop,
          offsetHeight: el.offsetHeight,
          clientTop: rect.top + window.scrollY,
          clientBottom: rect.bottom + window.scrollY,
          styleMarginTop: el.style.marginTop,
          stylePaddingTop: el.style.paddingTop,
          computedMarginTop: window.getComputedStyle(el).marginTop,
          computedPaddingTop: window.getComputedStyle(el).paddingTop,
          computedPaddingBottom: window.getComputedStyle(el).paddingBottom,
        };
      };

      // Find all h-grid-dividers
      const dividers = Array.from(document.querySelectorAll('.h-grid-divider')).map((el, i) => {
        const rect = el.getBoundingClientRect();
        return {
          index: i,
          offsetTop: el.offsetTop,
          offsetHeight: el.offsetHeight,
          styleMarginTop: el.style.marginTop,
          computedMarginTop: window.getComputedStyle(el).marginTop,
        };
      });

      return {
        ice: getInfo('#ice'),
        showcase: getInfo('#showcase'),
        motion: getInfo('#motion'),
        dividers: dividers,
        bodyHeight: document.body.offsetHeight,
      };
    });

    console.log("Layout Info:", JSON.stringify(layout, null, 2));

    // Scroll to showcase to see the gap and take a screenshot
    console.log("Scrolling to #ice...");
    await page.evaluate(() => {
      const el = document.querySelector('#ice');
      if (el) el.scrollIntoView();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, 'ice_view.png') });
    console.log("Screenshot ice_view.png saved.");

    console.log("Scrolling down slightly towards showcase...");
    await page.evaluate(() => {
      window.scrollTo(0, document.querySelector('#ice').offsetTop + document.querySelector('#ice').offsetHeight / 2);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, 'gap_view.png') });
    console.log("Screenshot gap_view.png saved.");

    await browser.close();
  } catch (e) {
    console.error("Error running test:", e);
  }
})();
