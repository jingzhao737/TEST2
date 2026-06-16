const { chromium } = require('playwright');

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 }
  });

  page.on('console', msg => console.log(`BROWSER [log]: ${msg.text()}`));

  console.log("Navigating to http://localhost:5174...");
  await page.goto("http://localhost:5174");

  await page.evaluate(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  });

  await page.waitForTimeout(2000);

  console.log("Scrolling to works...");
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  const cards = page.locator('.work-card');
  const card1 = cards.nth(0);
  const box = await card1.boundingBox();
  if (box) {
    const centerX = box.x + box.width / 2;
    const hoverY = box.y + box.height - 2; // 2px inside the bottom boundary

    console.log(`Card 1 bottom hover: x=${centerX}, y=${hoverY}`);
    await page.mouse.move(centerX, hoverY);

    await page.evaluate((coords) => {
      let count = 0;
      const interval = setInterval(() => {
        const hitEl = document.elementFromPoint(coords.x, coords.y);
        const card = hitEl ? hitEl.closest('.work-card') : null;
        const cardClass = card ? card.className : 'null';
        const hitElTagClass = hitEl ? `${hitEl.tagName}.${hitEl.className}` : 'null';
        
        // Let's get Card 1's actual class list from DOM
        const actualCard1 = document.querySelectorAll('.work-card')[0];
        const card1Classes = actualCard1 ? actualCard1.className : 'null';

        console.log(`[EDGE_MONITOR] hitEl: ${hitElTagClass} | closest card: ${cardClass} | Card 1 Classes: [${card1Classes}]`);
        count++;
        if (count >= 20) clearInterval(interval);
      }, 100);
    }, { x: centerX, y: hoverY });

    await page.waitForTimeout(2200);
  } else {
    console.log("Card 1 box not found");
  }

  await browser.close();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
