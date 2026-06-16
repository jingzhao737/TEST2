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

  await page.evaluate(() => {
    const cards = document.querySelectorAll('.work-card');
    const card4 = cards[3]; // Card 4
    if (card4) {
      card4.addEventListener('mouseenter', (e) => {
        const rel = e.relatedTarget;
        const relStr = rel ? `${rel.tagName}.${rel.className}` : 'null';
        console.log(`[EVENT] Card 4 mouseenter, relatedTarget: ${relStr}`);
      });
      card4.addEventListener('mouseleave', (e) => {
        const rel = e.relatedTarget;
        const relStr = rel ? `${rel.tagName}.${rel.className}` : 'null';
        console.log(`[EVENT] Card 4 mouseleave, relatedTarget: ${relStr}`);
      });
    }
  });

  const cards = page.locator('.work-card');
  const card4 = cards.nth(3); // Card 4
  const box = await card4.boundingBox();
  if (box) {
    console.log(`Card 4 Bounding Box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    console.log("Moving mouse to center of Card 4...");
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(3000);
  } else {
    console.log("Card 4 box not found");
  }

  console.log("Done!");
  await browser.close();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
