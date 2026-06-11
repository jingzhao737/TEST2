const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', msg => { if (msg.type() !== 'warning') console.log(`[${msg.type()}] ${msg.text()}`); });

  await page.goto("http://localhost:5173");
  try {
    await page.waitForFunction(() => {
      const l = document.querySelector('#loader,.loader,.preloader');
      if (!l) return true;
      const s = window.getComputedStyle(l);
      return s.display === 'none' || s.opacity === '0' || s.visibility === 'hidden';
    }, { timeout: 12000 });
  } catch(e) { console.log('loader wait timed out'); }
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    const s = document.querySelector('.showcase');
    if (s) s.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/zfix0.png" });

  // Scroll 500px to trigger transition
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1400);

  // Query element at a position in the BOTTOM half (should be showcase, not stars)
  const postScrollInfo = await page.evaluate(() => {
    const section = document.querySelector('.showcase');
    const grid = document.querySelector('.showcase-grid');
    const cs = window.getComputedStyle(section);
    const gr = window.getComputedStyle(grid);

    // Get element at y=600 (bottom half of viewport) at x=720 (center)
    const elAt600 = document.elementFromPoint(720, 600);
    const elAt400 = document.elementFromPoint(720, 400);
    const elAt200 = document.elementFromPoint(720, 200);

    const getInfo = (el) => el ? {
      tag: el.tagName,
      id: el.id,
      cls: el.className.slice(0, 60),
      rect: (() => { const r = el.getBoundingClientRect(); return {t:r.top,b:r.bottom,h:r.height}; })(),
      zIndex: window.getComputedStyle(el).zIndex,
      position: window.getComputedStyle(el).position,
    } : null;

    return {
      sectionRect: (() => { const r = section.getBoundingClientRect(); return {t:r.top,b:r.bottom,h:r.height,l:r.left,w:r.width}; })(),
      sectionPosition: cs.position,
      sectionZIndex: cs.zIndex,
      gridX: gr.transform,
      gridRect: (() => { const r = grid.getBoundingClientRect(); return {t:r.top,b:r.bottom,h:r.height}; })(),
      elAt200: getInfo(elAt200),
      elAt400: getInfo(elAt400),
      elAt600: getInfo(elAt600),
    };
  });

  console.log('AFTER SCROLL:', JSON.stringify(postScrollInfo, null, 2));
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/zfix1.png" });

  await browser.close();
})();
