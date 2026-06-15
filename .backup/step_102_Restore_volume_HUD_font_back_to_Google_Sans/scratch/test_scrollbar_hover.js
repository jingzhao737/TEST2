const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`Console [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.log(`PageError: ${err}`));

  console.log("Navigating to http://localhost:5174/ ...");
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(1000);
  
  console.log("Scrolling down to reveal scrollbar...");
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(500);
  
  console.log("Clicking first work card to open details...");
  const firstCard = page.locator('.work-card').first();
  await firstCard.click();
  await page.waitForTimeout(1500);
  
  console.log("Locating scroll-bubble...");
  const scrollBubble = page.locator('.scroll-bubble').first();
  const count = await scrollBubble.count();
  if (count > 0) {
    console.log("Hovering over scroll-bubble...");
    await scrollBubble.hover();
    await page.waitForTimeout(1000);
  } else {
    console.log("No scroll-bubble found!");
  }
  
  await browser.close();
})();
