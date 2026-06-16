const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000); // wait for loader

  // Move mouse to trigger custom cursor snapping
  await page.mouse.move(300, 300);
  await page.waitForTimeout(100);

  // Check cursor opacity and position
  const cursorInfo = await page.evaluate(() => {
    const cursor = document.getElementById('cursorDot');
    if (!cursor) return { exists: false };
    const style = window.getComputedStyle(cursor);
    return {
      exists: true,
      opacity: style.opacity,
      display: style.display,
      transform: style.transform,
      width: style.width,
      height: style.height
    };
  });

  console.log("Cursor Dot Info:", JSON.stringify(cursorInfo, null, 2));

  await browser.close();
})();
