const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  const navRect = await page.evaluate(() => {
    const el = document.getElementById('nav');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  });

  const logoRect = await page.evaluate(() => {
    const el = document.getElementById('navLogo');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });

  const canvasRect = await page.evaluate(() => {
    const el = document.getElementById('framesCanvas');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  });

  const webglCanvasRect = await page.evaluate(() => {
    const el = document.getElementById('webglCanvas');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  });

  const clipRects = await page.evaluate(() => {
    const clips = document.querySelectorAll('.latch-clip');
    return Array.from(clips).map((el, i) => {
      const r = el.getBoundingClientRect();
      return { idx: i, left: r.left, top: r.top, width: r.width, height: r.height };
    });
  });

  console.log('=== Element Coordinates ===');
  console.log('Nav Rect:', navRect);
  console.log('Logo Rect:', logoRect);
  console.log('2D Canvas Rect:', canvasRect);
  console.log('WebGL Canvas Rect:', webglCanvasRect);
  console.log('Clip Rects:', clipRects);

  await browser.close();
})();
