import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`PAGE CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`PAGE ERROR:`, err);
  });

  page.on('request', request => {
    console.log(`REQ: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`RES: ${response.status()} ${response.url()}`);
  });

  page.on('requestfailed', request => {
    console.log(`REQ FAIL: ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Navigating to http://localhost:8000 ...');
  await page.goto('http://localhost:8000');

  console.log('Waiting for 8 seconds...');
  await page.waitForTimeout(8000);

  const state = await page.evaluate(() => {
    return {
      loaderFinished: window.loaderFinished,
      revealHeroTitleType: typeof window.revealHeroTitle,
    };
  });
  console.log('Final State:', state);

  await browser.close();
}

run().catch(console.error);
