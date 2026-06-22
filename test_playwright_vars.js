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
  await page.waitForTimeout(5000);

  const windowVars = await page.evaluate(() => {
    return {
      loaderFinished: window.loaderFinished,
      revealHeroTitleType: typeof window.revealHeroTitle,
      heroTimelineExists: !!window.heroTimeline,
      heroTimelineProgress: window.heroTimeline ? window.heroTimeline.progress() : null,
      heroTimelineIsActive: window.heroTimeline ? window.heroTimeline.isActive() : null
    };
  });

  console.log('Window Variables:', windowVars);
  await browser.close();
}

run().catch(console.error);
