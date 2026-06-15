const { chromium } = require('playwright');

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 }
  });

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

  const card = page.locator('.work-card').first();
  const box1 = await card.boundingBox();
  if (box1) {
    const centerX = box1.x + box1.width / 2;
    const centerY = box1.y + box1.height / 2;

    console.log(`Initial Card 1 Box: x=${box1.x.toFixed(4)}, y=${box1.y.toFixed(4)}, w=${box1.width.toFixed(4)}, h=${box1.height.toFixed(4)}`);
    console.log("Moving mouse to center of Card 1 to trigger hover...");
    await page.mouse.move(centerX, centerY);

    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      const box = await card.boundingBox();
      if (box) {
        console.log(`Step ${i + 1} Card 1 Box: x=${box.x.toFixed(4)}, y=${box.y.toFixed(4)}, w=${box.width.toFixed(4)}, h=${box.height.toFixed(4)}`);
      } else {
        console.log(`Step ${i + 1}: Card not found!`);
      }
    }
  } else {
    console.log("Card bounding box not found");
  }

  console.log("Done!");
  await browser.close();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
