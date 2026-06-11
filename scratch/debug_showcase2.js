const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() !== 'warning') console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
  });
  page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

  await page.goto("http://localhost:5173");

  // Wait for loader to finish (watch for loader to have display:none or opacity:0)
  try {
    await page.waitForFunction(() => {
      const loader = document.querySelector('#loader, .loader, .preloader, [class*="loader"]');
      if (!loader) return true;
      const s = window.getComputedStyle(loader);
      return s.display === 'none' || s.opacity === '0' || s.visibility === 'hidden';
    }, { timeout: 15000 });
  } catch(e) {
    console.log('Loader wait timed out, continuing...');
  }
  await page.waitForTimeout(1500);

  // Scroll to showcase section
  await page.evaluate(() => {
    const showcase = document.querySelector('.showcase');
    if (showcase) showcase.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(800);

  // Screenshot: First card
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/fix_state0.png" });

  // Check state
  const state0 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.showcase-item')).map((item, idx) => {
      const cs = window.getComputedStyle(item);
      const bg = item.querySelector('.showcase-bg');
      const bgCs = bg ? window.getComputedStyle(bg) : null;
      return {
        idx,
        zIndex: cs.zIndex,
        clipPath: cs.clipPath,
        bgImage: bg ? bg.style.backgroundImage : null,
        bgScale: bgCs ? bgCs.transform : null,
      };
    });
  });
  console.log('State 0:', JSON.stringify(state0, null, 2));

  // Scroll through showcase - need to scroll enough to trigger transitions
  // Showcase pin = (N-1) * vh = 2 * 900 = 1800px
  // Each transition triggers at 40% of segment = 0.4 * 900 = 360px
  
  // Go to transition 1 (40% into first segment = 360px)
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1200); // Wait for animation to complete
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/fix_state1.png" });
  console.log('After scroll 500px (should trigger card 1):');
  const state1 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.showcase-item')).map((item, idx) => {
      const cs = window.getComputedStyle(item);
      return { idx, zIndex: cs.zIndex, clipPath: cs.clipPath };
    });
  });
  console.log(JSON.stringify(state1, null, 2));

  // Go past first transition fully
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/fix_state2.png" });

  // Go to transition 2
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/fix_state3.png" });
  console.log('After scroll 1500px (should trigger card 2):');
  const state3 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.showcase-item')).map((item, idx) => {
      const cs = window.getComputedStyle(item);
      return { idx, zIndex: cs.zIndex, clipPath: cs.clipPath };
    });
  });
  console.log(JSON.stringify(state3, null, 2));

  // Final state
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/fix_state4.png" });

  await browser.close();
  console.log('Done.');
})();
