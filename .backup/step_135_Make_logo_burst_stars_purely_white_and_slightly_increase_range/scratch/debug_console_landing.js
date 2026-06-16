const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173');

  // Wait for loader to disappear
  await page.waitForTimeout(2000);

  // Measure start positions
  const startCoords = await page.evaluate(() => {
    const logo = document.getElementById('navLogo');
    const staticLogo = document.getElementById('navLogoStatic');
    const consoleEl = document.getElementById('colorConsole');
    const placeholder = document.getElementById('consoleTitlePlaceholder');
    return {
      logo: logo.getBoundingClientRect().toJSON(),
      staticLogo: staticLogo.getBoundingClientRect().toJSON(),
      consoleEl: consoleEl.getBoundingClientRect().toJSON(),
      placeholder: placeholder.getBoundingClientRect().toJSON()
    };
  });
  console.log("=== Initial Coordinates ===");
  console.log("Logo:", startCoords.logo);
  console.log("Placeholder:", startCoords.placeholder);

  console.log("Clicking staticLogo to open console...");
  await page.click('#navLogoStatic');

  // We check coords at multiple times:
  // 1s, 2s, 2.5s (during flight)
  // 2.7s (flight ends, onComplete runs)
  // 2.9s, 3.2s, 4.0s (after flight)
  const times = [1000, 2000, 2500, 2700, 2900, 3200, 4000];
  let lastTime = 0;
  for (const ms of times) {
    await page.waitForTimeout(ms - lastTime);
    lastTime = ms;
    
    const coords = await page.evaluate(() => {
      const logo = document.getElementById('navLogo');
      const placeholder = document.getElementById('consoleTitlePlaceholder');
      const consoleEl = document.getElementById('colorConsole');
      return {
        logo: logo.getBoundingClientRect().toJSON(),
        placeholder: placeholder.getBoundingClientRect().toJSON(),
        consoleEl: consoleEl.getBoundingClientRect().toJSON(),
        logoStyle: logo.style.cssText,
        consoleStyle: consoleEl.style.cssText
      };
    });
    console.log(`\n=== Coordinates at ${ms}ms ===`);
    console.log("Console Top:", coords.consoleEl.top, "Console Trans:", coords.consoleStyle);
    console.log("Logo Top:", coords.logo.top, "Logo Left:", coords.logo.left, "Logo Style:", coords.logoStyle);
    console.log("Placeholder Top:", coords.placeholder.top);
    console.log("Difference (Logo Top - Placeholder Top):", coords.logo.top - coords.placeholder.top);
  }

  await browser.close();
  console.log("\nFinished.");
})();
