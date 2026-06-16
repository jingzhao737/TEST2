const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(6000); // Wait for loader and physics to settle

  const thumbs = await page.evaluate(() => {
    if (!window.__thumbs) return null;
    return window.__thumbs.map((t, i) => {
      return {
        idx: i,
        x: t.x,
        y: t.y,
        anchorX: t.anchorX,
        anchorY: t.anchorY,
        restX: t.restX,
        restY: t.restY,
        stringLen: t.stringLen
      };
    });
  });

  const canvasRect = await page.evaluate(() => {
    const el = document.getElementById('framesCanvas');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });

  const clipRects = await page.evaluate(() => {
    const clips = document.querySelectorAll('.latch-clip');
    return Array.from(clips).map((el, i) => {
      const r = el.getBoundingClientRect();
      return { idx: i, left: r.left, top: r.top, width: r.width, height: r.height };
    });
  });

  console.log('=== Thumbs Coordinates ===');
  console.log('Loader Finished:', await page.evaluate(() => window.loaderFinished));
  console.log(thumbs);
  console.log('Canvas Rect:', canvasRect);
  console.log('Clip Rects:', clipRects);

  await browser.close();
})();
