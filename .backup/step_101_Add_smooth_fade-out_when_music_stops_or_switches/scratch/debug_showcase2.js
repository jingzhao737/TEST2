const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("http://localhost:5174/");
  await page.waitForFunction(() => window.loaderFinished === true, { timeout: 10000 });

  const headingInfo = await page.evaluate(() => {
    const header = document.querySelector('#showcase .showcase-header');
    const heading = document.querySelector('#showcase .section-heading');
    const tag = document.querySelector('#showcase .section-tag');

    return {
      header: {
        className: header.className,
        rect: header.getBoundingClientRect(),
        computedStyle: {
          position: getComputedStyle(header).position,
          top: getComputedStyle(header).top,
          left: getComputedStyle(header).left,
          width: getComputedStyle(header).width,
          transform: getComputedStyle(header).transform,
          paddingLeft: getComputedStyle(header).paddingLeft,
        }
      },
      heading: {
        rect: heading.getBoundingClientRect(),
        computedStyle: {
          fontFamily: getComputedStyle(heading).fontFamily,
          fontSize: getComputedStyle(heading).fontSize,
          fontWeight: getComputedStyle(heading).fontWeight,
          visibility: getComputedStyle(heading).visibility,
          opacity: getComputedStyle(heading).opacity,
          color: getComputedStyle(heading).color,
        }
      },
      tag: {
        computedStyle: {
          fontFamily: getComputedStyle(tag).fontFamily,
          fontSize: getComputedStyle(tag).fontSize,
          visibility: getComputedStyle(tag).visibility,
        }
      }
    };
  });

  console.log("Heading Info:", JSON.stringify(headingInfo, null, 2));
  await browser.close();
})();
