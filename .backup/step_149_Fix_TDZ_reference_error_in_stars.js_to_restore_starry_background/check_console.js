const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    } else {
      console.log(`BROWSER LOG: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`BROWSER PAGEERROR: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 5000 });
    // Wait a bit to let the animation start
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Error loading page:', e.message);
  }

  await browser.close();
})();
