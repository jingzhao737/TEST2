const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  await page.goto("http://localhost:5173");
  await page.waitForTimeout(3000);

  const showcaseY = await page.evaluate(() => {
    const el = document.querySelector('.showcase');
    return el.getBoundingClientRect().top + window.scrollY;
  });

  for (let i = 0; i < 5; i++) {
    const scrollPos = showcaseY + i * 300;
    await page.evaluate(pos => window.scrollTo(0, pos), scrollPos);
    await page.waitForTimeout(500);

    const positions = await page.evaluate(() => {
      const showcase = document.querySelector('.showcase');
      const next = showcase.nextElementSibling;
      const card3 = document.querySelectorAll('.showcase-item')[2];
      return {
        showcaseTop: showcase.getBoundingClientRect().top,
        nextTop: next ? next.getBoundingClientRect().top : null,
        nextClassName: next ? next.className : null,
        card3Top: card3 ? card3.getBoundingClientRect().top : null
      };
    });

    console.log(`Scroll: ${scrollPos}px | Showcase Top: ${positions.showcaseTop}px | Next Top: ${positions.nextTop}px (${positions.nextClassName}) | Card 3 Top: ${positions.card3Top}px`);
  }

  await browser.close();
})();
