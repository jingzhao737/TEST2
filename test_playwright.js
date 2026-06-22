import { chromium } from 'playwright';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`PAGE CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`PAGE ERROR:`, err);
  });

  console.log('Navigating to http://localhost:8000 ...');
  await page.goto('http://localhost:8000');

  console.log('Waiting for 15 seconds...');
  await page.waitForTimeout(15000);

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'debug_local_v35.png' });
  console.log('Screenshot saved to debug_local_v35.png');

  await browser.close();
}

run().catch(console.error);
