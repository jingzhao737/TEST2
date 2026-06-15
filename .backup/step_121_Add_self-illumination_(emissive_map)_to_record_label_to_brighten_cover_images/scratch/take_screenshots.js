const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

  console.log("Navigating to http://localhost:5173...");
  await page.goto("http://localhost:5173");
  await page.waitForTimeout(3000);

  // Take screenshot of home page
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/scratch/cinematic_load.png" });

  // Scroll into showcase view
  console.log("Scrolling showcase into view...");
  const showcase = page.locator('.showcase');
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/scratch/cinematic_showcase.png" });

  // Scroll a bit more to see the transitions/items
  console.log("Scrolling down slightly...");
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/scratch/cinematic_scroll_1.png" });

  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/scratch/cinematic_scroll_2.png" });

  await browser.close();
  console.log("Screenshots captured successfully.");
})();
