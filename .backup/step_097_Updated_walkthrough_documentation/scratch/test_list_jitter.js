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
    const workList = document.querySelector('.work-list');
    workList.addEventListener('mouseenter', () => console.log('[EVENT] workList mouseenter'));
    workList.addEventListener('mouseleave', () => console.log('[EVENT] workList mouseleave'));
  });

  const workList = page.locator('.work-list');
  const box = await workList.boundingBox();
  if (box) {
    console.log(`workList Bounding Box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    
    // Hover near the left edge of the workList
    console.log("Hovering near left edge of workList...");
    await page.mouse.move(box.x + 5, box.y + box.height / 2);
    await page.waitForTimeout(2000);

    // Hover near the right edge of the workList
    console.log("Hovering near right edge of workList...");
    await page.mouse.move(box.x + box.width - 5, box.y + box.height / 2);
    await page.waitForTimeout(2000);
  } else {
    console.log("workList box not found");
  }

  console.log("Done!");
  await browser.close();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
