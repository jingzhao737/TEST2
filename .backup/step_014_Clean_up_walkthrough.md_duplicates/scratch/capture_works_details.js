const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
  page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

  try {
    console.log("Navigating to http://localhost:5174...");
    await page.goto("http://localhost:5174");
    
    console.log("Waiting for loader to hide...");
    await page.waitForSelector('#loader', { state: 'hidden', timeout: 8000 });

    console.log("Clicking first card 'flux'...");
    await page.click('.work-card[data-work="flux"]');
    
    console.log("Waiting for detail view to open and animate...");
    await page.waitForSelector('#workDetail.open', { timeout: 5000 });
    await page.waitForTimeout(1500); // Wait for animations to fully settle

    console.log("Taking screenshot of the opened details card...");
    await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/b97e653b-10c3-464c-a52f-949e1ff66140/scratch/works_details_opened.png" });
    console.log("Screenshot saved to works_details_opened.png");

  } catch (e) {
    console.error("Error running screenshot capture:", e);
  } finally {
    await browser.close();
  }
})();
