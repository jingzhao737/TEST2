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

  console.log('Waiting for 15 seconds for page load to fully finish...');
  await page.waitForTimeout(15000);

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'debug_after_load.png' });
  console.log('Screenshot saved to debug_after_load.png');

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
  console.log('Visible State:', visibleState);

  await browser.close();
}

run().catch(console.error);
