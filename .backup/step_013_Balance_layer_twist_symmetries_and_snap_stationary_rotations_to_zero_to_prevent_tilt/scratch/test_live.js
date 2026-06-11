const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.toString()}`));
    console.log("Navigating to live site...");
    await page.goto('https://jingzhao737.github.io/TEST2/');
    await page.waitForTimeout(3000);
    console.log("Done checking.");
    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
