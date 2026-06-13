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

  const sensors = page.locator('.card-sensor');
  const count = await sensors.count();
  console.log(`Found ${count} sensors.`);
  
  if (count > 0) {
    const sensor4 = sensors.nth(3); // Sensor 4
    const box1 = await sensor4.boundingBox();
    if (box1) {
      console.log(`Initial Sensor 4 Box: x=${box1.x.toFixed(2)}, y=${box1.y.toFixed(2)}, w=${box1.width.toFixed(2)}, h=${box1.height.toFixed(2)}`);
      const centerX = box1.x + box1.width / 2;
      const centerY = box1.y + box1.height / 2;

      await page.evaluate((coords) => {
        const { cx, cy } = coords;
        const sensors = document.querySelectorAll('.card-sensor');
        const sensor4 = sensors[3];
        if (sensor4) {
          sensor4.addEventListener('mouseenter', () => {
            const el = document.elementFromPoint(cx, cy);
            const elStr = el ? `${el.tagName}.${el.className} (id: ${el.id})` : 'null';
            console.log(`[EVENT] Sensor 4 mouseenter, elementFromPoint: ${elStr}`);
          });
          sensor4.addEventListener('mouseleave', () => {
            const el = document.elementFromPoint(cx, cy);
            const elStr = el ? `${el.tagName}.${el.className} (id: ${el.id})` : 'null';
            console.log(`[EVENT] Sensor 4 mouseleave, elementFromPoint: ${elStr}`);
          });
        }
      }, { cx: centerX, cy: centerY });

      console.log(`Moving mouse to center of Sensor 4: x=${centerX}, y=${centerY}`);
      await page.mouse.move(centerX, centerY);

      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(100);
        const elStr = await page.evaluate((coords) => {
          const { cx, cy } = coords;
          const el = document.elementFromPoint(cx, cy);
          return el ? `${el.tagName}.${el.className} (id: ${el.id})` : 'null';
        }, { cx: centerX, cy: centerY });

        const cardClassList = await page.evaluate(() => {
          const cards = document.querySelectorAll('.work-card');
          const card4 = cards[3];
          return card4 ? Array.from(card4.classList).join(' ') : 'null';
        });

        console.log(`Step ${i + 1}: Element under cursor: ${elStr} | Card 4 ClassList: [${cardClassList}]`);
      }
    } else {
      console.log("Sensor 4 box not found");
    }
  } else {
    console.log("No sensors found");
  }

  await browser.close();
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
