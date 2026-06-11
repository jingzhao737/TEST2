const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const scratchDir = path.join('C:', 'Users', 'jackchen', '.gemini', 'antigravity', 'brain', 'b97e653b-10c3-464c-a52f-949e1ff66140', 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const runWithViewport = async (width, height, prefix) => {
    console.log(`\n--- Testing Viewport ${width}x${height} (${prefix}) ---`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });

    // Capture console logs and page errors
    page.on('console', msg => {
      const type = msg.type();
      const txt = msg.text();
      if (type === 'error' || type === 'warning' || txt.includes('[Works') || txt.includes('Premium')) {
        console.log(`[Browser Console - ${type}]: ${txt}`);
      }
    });
    page.on('pageerror', err => console.log(`[Browser Error]: ${err}`));

    await page.goto("http://localhost:5174/");

    // Wait for loader to finish
    await page.waitForFunction(() => window.loaderFinished === true, { timeout: 15000 });
    await page.waitForTimeout(1000);

    const sections = ['#home', '#work', '#ice', '#showcase', '#motion', '#poetry', '#about'];
    for (const sel of sections) {
      console.log(`Scrolling to ${sel}...`);
      const loc = page.locator(sel);
      if (await loc.count() > 0) {
        await loc.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
        
        // Take a screenshot of the section
        const filename = `${prefix}_${sel.replace('#', '')}.png`;
        await page.screenshot({ path: path.join(scratchDir, filename) });
        console.log(`Saved screenshot: ${filename}`);
      } else {
        console.log(`Section ${sel} not found!`);
      }
    }

    await browser.close();
  };

  try {
    // Test desktop layout
    await runWithViewport(1440, 900, 'desktop');

    // Test mobile layout
    await runWithViewport(375, 812, 'mobile');

    console.log("\nFinished taking screenshots of all sections!");
  } catch (err) {
    console.error("Error running validation: ", err);
  }
})();
