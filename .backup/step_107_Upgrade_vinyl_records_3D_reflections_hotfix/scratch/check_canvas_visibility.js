const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000); // wait for loader

  const canvasInfo = await page.evaluate(() => {
    const canvas = document.getElementById('laserCanvas');
    if (!canvas) return { exists: false };
    const style = window.getComputedStyle(canvas);
    return {
      exists: true,
      tagName: canvas.tagName,
      opacity: style.opacity,
      display: style.display,
      visibility: style.visibility,
      zIndex: style.zIndex,
      position: style.position,
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      pointerEvents: style.pointerEvents,
      mixBlendMode: style.mixBlendMode
    };
  });

  console.log("Canvas Info:", JSON.stringify(canvasInfo, null, 2));

  await browser.close();
})();
