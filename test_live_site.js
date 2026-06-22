import { chromium } from 'playwright';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`LIVE CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`LIVE PAGE ERROR:`, err);
  });

  page.on('requestfailed', request => {
    console.log(`LIVE REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Navigating to https://jingzhao737.github.io/TEST2/ ...');
  try {
    await page.goto('https://jingzhao737.github.io/TEST2/', { waitUntil: 'load', timeout: 15000 });
  } catch (err) {
    console.log('Navigation error/timeout:', err.message);
  }

  console.log('Waiting for 8 seconds...');
  await page.waitForTimeout(8000);

  console.log('Taking screenshot of live site...');
  await page.screenshot({ path: 'debug_live.png' });
  console.log('Screenshot saved to debug_live.png');

  const visibleState = await page.evaluate(() => {
    const loader = document.getElementById('loader');
    const home = document.getElementById('home');
    return {
      loaderDisplay: loader ? loader.style.display : 'null',
      loaderOpacity: loader ? window.getComputedStyle(loader).opacity : 'null',
      homeOpacity: home ? window.getComputedStyle(home).opacity : 'null',
      bodyBgColor: window.getComputedStyle(document.body).backgroundColor
    };
  });
  console.log('Live Visible State:', visibleState);

  await browser.close();
}

run().catch(console.error);
