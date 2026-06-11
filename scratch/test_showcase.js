const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

  console.log("Navigating to http://localhost:5173...");
  await page.goto("http://localhost:5173");
  await page.waitForTimeout(3000);

  // Scroll to showcase section to pin it
  const showcaseY = await page.evaluate(() => {
    const el = document.querySelector('.showcase');
    return el.getBoundingClientRect().top + window.scrollY;
  });
  console.log("Showcase section Y position:", showcaseY);

  await page.evaluate(pos => window.scrollTo(0, pos), showcaseY);
  await page.waitForTimeout(1000);

  // Position mouse at center of viewport
  await page.mouse.move(720, 450);

  // Take screenshot of Initial Card 1 State
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/showcase_scroll_0.png" });

  async function logCardStates(stepName) {
    const data = await page.evaluate(() => {
      const items = document.querySelectorAll('.showcase-item');
      const styles = Array.from(items).map((el, idx) => {
        const computed = window.getComputedStyle(el);
        return {
          idx,
          transform: el.style.transform,
          computedTransform: computed.transform,
          opacity: el.style.opacity,
          computedOpacity: computed.opacity,
          filter: el.style.filter,
          computedFilter: computed.filter,
          top: el.getBoundingClientRect().top
        };
      });
      return {
        scrollY: window.scrollY,
        styles
      };
    });

    console.log(`\n--- ${stepName} (scrollY: ${data.scrollY}px) ---`);
    for (const s of data.styles) {
      console.log(`  Card ${s.idx}:`);
      console.log(`    top: ${s.top}px`);
      console.log(`    opacity: inline="${s.opacity}", computed="${s.computedOpacity}"`);
      console.log(`    transform: inline="${s.transform}", computed="${s.computedTransform}"`);
      console.log(`    filter: inline="${s.filter}", computed="${s.computedFilter}"`);
    }
  }

  await logCardStates("Initial Card 1 State");

  // 1. Scroll down once -> Transition to Card 2
  console.log("\nScrolling wheel down (1 tick)...");
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(1200); // Wait for transition
  await logCardStates("Card 2 State (After 1 scroll down)");
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/showcase_scroll_1.png" });

  // 2. Scroll down once -> Transition to Card 3
  console.log("\nScrolling wheel down (2nd tick)...");
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(1200); // Wait for transition
  await logCardStates("Card 3 State (After 2 scrolls down)");
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/showcase_scroll_2.png" });

  // 3. Scroll up once -> Transition back to Card 2
  console.log("\nScrolling wheel up (1 tick)...");
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(1200); // Wait for transition
  await logCardStates("Card 2 State (After scrolling up)");
  await page.screenshot({ path: "C:/Users/jackchen/.gemini/antigravity/brain/9b5ba770-9209-4a3b-ab95-fcd04f6ecc9a/showcase_scroll_3.png" });

  await browser.close();
  console.log("Browser closed.");
})();
