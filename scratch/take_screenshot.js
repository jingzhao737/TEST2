const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => console.log('PAGE ERROR:', exception));

  try {
    await page.goto('http://localhost:5173');
    console.log('Waiting for loader to be hidden...');
    await page.waitForSelector('#loader', { state: 'hidden', timeout: 15000 });
    console.log('Loader is hidden! Waiting another 4 seconds for physics to settle...');
    await page.waitForTimeout(4000);

    const data = await page.evaluate(() => {
      const thumbs = window.__thumbs ? window.__thumbs.map((t, i) => ({
        idx: i, 
        x: t.x, 
        y: t.y, 
        vx: t.vx,
        vy: t.vy,
        entering: t.entering,
        delayFrames: t.delayFrames,
        anchorX: t.anchorX, 
        anchorY: t.anchorY, 
        restX: t.restX, 
        restY: t.restY, 
        stringLen: t.stringLen
      })) : null;

      const canvas = document.getElementById('framesCanvas');
      const canvasRect = canvas ? canvas.getBoundingClientRect() : null;

      const clips = document.querySelectorAll('.latch-clip');
      const clipRects = Array.from(clips).map((el, i) => {
        const r = el.getBoundingClientRect();
        return { idx: i, left: r.left, top: r.top, width: r.width, height: r.height };
      });

      return {
        thumbs,
        canvasRect: canvasRect ? { left: canvasRect.left, top: canvasRect.top, width: canvasRect.width, height: canvasRect.height } : null,
        clipRects
      };
    });

    console.log('=== Live Page Coordinates ===');
    console.log('Thumbs:', data.thumbs);
    console.log('Canvas Rect:', data.canvasRect);
    console.log('Clip Rects:', data.clipRects);

  } catch (err) {
    console.log('Error during waiting:', err.message);
  }

  await page.screenshot({ path: 'scratch/homepage.png' });
  console.log('Screenshot saved to scratch/homepage.png');

  try {
    console.log('Clicking logo to open console for console-view screenshot...');
    await page.click('#navLogo');
    await page.waitForTimeout(1000); // Settle flip animation
    await page.screenshot({ path: 'scratch/adjuster_visible.png' });
    console.log('Console-view screenshot saved to scratch/adjuster_visible.png');
  } catch (err) {
    console.log('Error taking console-view screenshot:', err.message);
  }

  await browser.close();
})();


