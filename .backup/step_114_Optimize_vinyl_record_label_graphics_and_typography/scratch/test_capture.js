const { chromium } = require('playwright');
const fs = require('fs');

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

  const card = page.locator('.work-card').first();
  const box = await card.boundingBox();
  if (box) {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    console.log("Moving mouse to center of Card 1 to trigger hover...");
    await page.mouse.move(centerX, centerY);
    
    // Take 5 screenshots in rapid succession
    for (let i = 0; i < 8; i++) {
      console.log(`Taking screenshot ${i + 1}...`);
      await page.screenshot({ path: `C:/Users/jackchen/.gemini/antigravity/brain/b97e653b-10c3-464c-a52f-949e1ff66140/scratch/hover_step_${i + 1}.png` });
      await page.waitForTimeout(150);
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
