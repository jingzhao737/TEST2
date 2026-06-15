const { chromium } = require('playwright');

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 }
  });

  page.on('console', msg => console.log(`BROWSER [log]: ${msg.text()}`));
  page.on('pageerror', err => console.log(`BROWSER [error]: ${err.toString()}`));

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
  const card1 = cards.nth(0); // Card 1 (flux)
  const box = await card1.boundingBox();
  if (box) {
    console.log(`Card 1 Bounding Box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    console.log("Moving mouse to center of Card 1...");
    await page.mouse.move(centerX, centerY);

    // Run active monitoring in the page
    await page.evaluate((coords) => {
      let count = 0;
      const interval = setInterval(() => {
        const hitEl = document.elementFromPoint(coords.x, coords.y);
        const card = hitEl ? hitEl.closest('.work-card') : null;
        const cardClass = card ? card.className : 'null';
        const hitElTagClass = hitEl ? `${hitEl.tagName}.${hitEl.className}` : 'null';
        console.log(`[MONITOR] hitEl: ${hitElTagClass}, closest card: ${cardClass}`);
        count++;
        if (count >= 30) clearInterval(interval);
      }, 100);
    }, { x: centerX, y: centerY });

    await page.waitForTimeout(3200);
  } else {
    console.log("Card 1 box not found");
  }

  console.log("Done!");
  await browser.close();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
