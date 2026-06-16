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

  // Scroll to showcase
  await page.evaluate(() => {
    const s = document.querySelector('.showcase');
    if (s) s.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(600);

  // Query heights + widths of all key elements
  const dims = await page.evaluate(() => {
    const section = document.querySelector('.showcase');
    const grid = document.querySelector('.showcase-grid');
    const items = document.querySelectorAll('.showcase-item');

    const getInfo = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        w: r.width, h: r.height,
        top: r.top, left: r.left,
        position: cs.position,
        display: cs.display,
        height: cs.height,
        minHeight: cs.minHeight,
        width: cs.width,
        flexDirection: cs.flexDirection,
        alignItems: cs.alignItems,
        overflow: cs.overflow,
        transform: cs.transform,
      };
    };

    return {
      section: getInfo(section),
      grid: getInfo(grid),
      items: Array.from(items).map((item, i) => ({
        idx: i,
        ...getInfo(item),
        bg: getInfo(item.querySelector('.showcase-bg')),
        info: getInfo(item.querySelector('.showcase-info')),
      })),
    };
  });

  console.log('=== LAYOUT DEBUG ===');
  console.log('section:', JSON.stringify(dims.section, null, 2));
  console.log('grid:', JSON.stringify(dims.grid, null, 2));
  dims.items.forEach(item => {
    console.log(`item[${item.idx}]: w=${item.w} h=${item.h} top=${item.top} position=${item.position} height_css="${item.height}" minHeight="${item.minHeight}"`);
    if (item.bg) console.log(`  bg: w=${item.bg.w} h=${item.bg.h} top=${item.bg.top}`);
  });

  await browser.close();
})();
