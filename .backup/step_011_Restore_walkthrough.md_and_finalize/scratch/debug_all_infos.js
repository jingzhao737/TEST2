const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:5173");
  await page.waitForTimeout(2000);
  
  await page.locator('.showcase').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Wheel to card 2 (index 2)
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 150);
  await page.waitForTimeout(1000);
  await page.mouse.wheel(0, 150);
  await page.waitForTimeout(1000);

  const infosData = await page.evaluate(() => {
    const infos = document.querySelectorAll('.showcase-info');
    return Array.from(infos).map((el, idx) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const parentStyle = window.getComputedStyle(el.parentElement);
      return {
        idx,
        text: el.innerText.replace(/\n/g, ' | '),
        opacity: style.opacity,
        visibility: style.visibility,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        parentOpacity: parentStyle.opacity,
        parentVisibility: parentStyle.visibility,
        parentZIndex: parentStyle.zIndex
      };
    });
  });

  console.log("All Showcase Infos:", JSON.stringify(infosData, null, 2));
  await browser.close();
})();
