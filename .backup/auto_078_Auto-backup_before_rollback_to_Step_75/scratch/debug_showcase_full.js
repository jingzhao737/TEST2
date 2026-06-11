const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("http://localhost:5174/");
  await page.waitForFunction(() => window.loaderFinished === true, { timeout: 10000 });

  console.log("Scrolling to #showcase...");
  const showcase = page.locator('#showcase');
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Scroll down a bit to activate the first/second item
  console.log("Scrolling scrollY to 4200px...");
  await page.evaluate(() => window.scrollTo(0, 4200));
  await page.waitForTimeout(1000);

  const debugInfo = await page.evaluate(() => {
    const sec = document.querySelector('#showcase');
    const wrapper = document.querySelector('.showcase-layout-wrapper');
    const leftTrack = document.querySelector('.showcase-left-text-track');
    const stickyZone = document.querySelector('.showcase-right-sticky-zone');
    const previewWrapper = document.querySelector('.showcase-sticky-preview-wrapper');
    const card = document.querySelector('.showcase-sticky-preview-card');
    const imgs = document.querySelectorAll('.showcase-sticky-preview-img');
    const textItems = document.querySelectorAll('.showcase-text-item');

    return {
      scrollY: window.scrollY,
      sec: sec ? {
        className: sec.className,
        rect: sec.getBoundingClientRect(),
        style: sec.getAttribute('style'),
        computedStyle: {
          display: getComputedStyle(sec).display,
          position: getComputedStyle(sec).position,
          overflow: getComputedStyle(sec).overflow,
        }
      } : null,
      wrapper: wrapper ? {
        rect: wrapper.getBoundingClientRect(),
        computedStyle: {
          display: getComputedStyle(wrapper).display,
          position: getComputedStyle(wrapper).position,
          height: getComputedStyle(wrapper).height,
        }
      } : null,
      leftTrack: leftTrack ? {
        rect: leftTrack.getBoundingClientRect(),
      } : null,
      stickyZone: stickyZone ? {
        rect: stickyZone.getBoundingClientRect(),
        computedStyle: {
          display: getComputedStyle(stickyZone).display,
          position: getComputedStyle(stickyZone).position,
          top: getComputedStyle(stickyZone).top,
          height: getComputedStyle(stickyZone).height,
          zIndex: getComputedStyle(stickyZone).zIndex,
          visibility: getComputedStyle(stickyZone).visibility,
          opacity: getComputedStyle(stickyZone).opacity,
        }
      } : null,
      previewWrapper: previewWrapper ? {
        rect: previewWrapper.getBoundingClientRect(),
        computedStyle: {
          display: getComputedStyle(previewWrapper).display,
          visibility: getComputedStyle(previewWrapper).visibility,
          opacity: getComputedStyle(previewWrapper).opacity,
        }
      } : null,
      card: card ? {
        rect: card.getBoundingClientRect(),
        computedStyle: {
          display: getComputedStyle(card).display,
          visibility: getComputedStyle(card).visibility,
          opacity: getComputedStyle(card).opacity,
          transform: getComputedStyle(card).transform,
        }
      } : null,
      imgs: Array.from(imgs).map(img => ({
        src: img.getAttribute('src'),
        rect: img.getBoundingClientRect(),
        opacity: getComputedStyle(img).opacity,
        clipPath: getComputedStyle(img).clipPath,
      })),
      textItems: Array.from(textItems).map((el, i) => ({
        index: i,
        rect: el.getBoundingClientRect(),
        opacity: getComputedStyle(el).opacity,
      }))
    };
  });

  console.log("Detailed Debug Info:", JSON.stringify(debugInfo, null, 2));

  await browser.close();
})();
