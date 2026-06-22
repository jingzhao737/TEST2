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

  await page.goto('http://localhost:8000');

  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(500);
    const progress = await page.evaluate(() => {
      const numEl = document.getElementById('loaderNumber');
      const loaderEl = document.getElementById('loader');
      return {
        text: numEl ? numEl.innerText : 'null',
        loaderDisplay: loaderEl ? loaderEl.style.display : 'null',
        loaderFinished: window.loaderFinished
      };
    });
    console.log(`Step ${i}:`, progress);
  }

  await browser.close();
}

run().catch(console.error);
