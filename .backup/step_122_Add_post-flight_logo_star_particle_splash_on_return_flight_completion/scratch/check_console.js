const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`BROWSER ERROR: ${err.message}`);
  });

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173');

  // Wait for loader to disappear
  await page.waitForTimeout(2000);

  console.log("Triggering mouse down at (200, 200)...");
  await page.mouse.move(200, 200);
  await page.mouse.down();
  
  // Check sparks
  let sparksCount = await page.evaluate(() => window.__sparks ? window.__sparks.length : -1);
  console.log(`Sparks count immediately after click: ${sparksCount}`);

  console.log("Moving mouse to (400, 400)...");
  await page.mouse.move(400, 400, { steps: 10 });

  // Check segments
  let segmentsCount = await page.evaluate(() => window.__segments ? window.__segments.length : -1);
  console.log(`Segments count during drag: ${segmentsCount}`);

  await page.mouse.up();
  await page.waitForTimeout(500);

  await browser.close();
  console.log("Check complete.");
})();
