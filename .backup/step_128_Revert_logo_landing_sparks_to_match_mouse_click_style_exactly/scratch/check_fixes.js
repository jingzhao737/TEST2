const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2500); // wait for loader

  // Test 1: Check CSS user-select
  const userSelect = await page.evaluate(() => {
    return window.getComputedStyle(document.body).userSelect;
  });
  console.log(`CSS user-select on body: ${userSelect}`);

  // Test 2: Check laserCanvas blend mode
  const blendMode = await page.evaluate(() => {
    const c = document.getElementById('laserCanvas');
    if (!c) return 'canvas not found!';
    return window.getComputedStyle(c).mixBlendMode;
  });
  console.log(`laserCanvas mixBlendMode: ${blendMode}`);

  // Test 3: Click on hero area (away from records) and check sparks
  await page.mouse.move(300, 500); // hero area, below records
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.up();

  const sparksAfterHeroClick = await page.evaluate(() => window.__sparks ? window.__sparks.length : -1);
  console.log(`Sparks after clicking hero area: ${sparksAfterHeroClick}`);

  // Test 4: Check if click event still fires (for sound effects)
  const clickFired = await page.evaluate(() => {
    return new Promise(resolve => {
      let fired = false;
      document.addEventListener('click', () => { fired = true; }, { once: true });
      // Simulate a click
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      setTimeout(() => resolve(fired), 50);
    });
  });
  console.log(`click event fires: ${clickFired}`);

  // Test 5: Check framesCanvas cursor style (should be '' when not on record)
  const canvasCursor = await page.evaluate(() => {
    const c = document.getElementById('framesCanvas');
    return c ? c.style.cursor : 'canvas not found';
  });
  console.log(`framesCanvas cursor (should be ''): "${canvasCursor}"`);

  console.log("\n--- Console logs ---");
  logs.forEach(l => console.log(l));

  await browser.close();
  console.log("Check complete.");
})();
