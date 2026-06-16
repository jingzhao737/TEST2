const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}\n${err.stack}`);
  });

  try {
    console.log("Navigating to http://localhost:5173 ...");
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);

    console.log("Clicking the waveform canvas...");
    await page.click('#navWaveform');
    await page.waitForTimeout(1000);

    console.log("Attempting to drag/slide on the waveform canvas...");
    const canvas = await page.$('#navWaveform');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(1000);
    } else {
      console.log("Could not find canvas bounding box");
    }

    console.log("Done debugging!");
  } catch (e) {
    console.error("Execution error:", e);
  } finally {
    await browser.close();
  }
})();
