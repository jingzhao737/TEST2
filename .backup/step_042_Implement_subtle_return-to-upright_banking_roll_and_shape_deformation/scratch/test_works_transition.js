const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Track console logs and page errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    } else {
      console.log(`[BROWSER LOG] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.log(`[BROWSER CRASH] ${err.toString()}`));

  try {
    console.log("Navigating to http://localhost:5174/...");
    await page.goto('http://localhost:5174/', { waitUntil: 'load' });
    
    // Wait for the loader to disappear
    console.log("Waiting for loader to hide...");
    await page.waitForSelector('#loader', { state: 'hidden', timeout: 8000 });
    
    // Check if WebGL preview system is active
    const webglActive = await page.evaluate(() => {
      return !!(window.__worksWebGL && window.__worksWebGL.isActive);
    });
    console.log(`Works WebGL active state: ${webglActive}`);

    // Click on the first work card (flux)
    console.log("Clicking first card 'flux'...");
    await page.click('.work-card[data-work="flux"]');
    
    // Wait for the detail page to be open
    console.log("Waiting for detail page to open...");
    await page.waitForSelector('#workDetail.open', { timeout: 5000 });
    
    // Check elements opacity and classes
    const detailState = await page.evaluate(() => {
      const detail = document.getElementById('workDetail');
      const bg = document.getElementById('workDetailBg');
      const img = document.getElementById('detailHeroImg');
      
      // Also check works page elements are faded out
      const nav = document.getElementById('nav');
      const header = document.querySelector('.works-header');
      const card = document.querySelector('.work-card');
      
      return {
        detailOpen: detail.classList.contains('open'),
        detailDisplay: detail.style.display,
        bgOpacity: window.getComputedStyle(bg).opacity,
        imgOpacity: window.getComputedStyle(img).opacity,
        navOpacity: window.getComputedStyle(nav).opacity,
        headerOpacity: window.getComputedStyle(header).opacity,
        cardOpacity: window.getComputedStyle(card).opacity
      };
    });
    console.log("Detail opened state:", JSON.stringify(detailState, null, 2));

    // Close detail page
    console.log("Clicking close button...");
    await page.click('#detailClose');
    
    // Wait for details page to hide
    console.log("Waiting for detail page to hide...");
    await page.waitForSelector('#workDetail', { state: 'hidden', timeout: 5000 });
    
    // Verify detail closed state and works page elements restored
    const closedState = await page.evaluate(() => {
      const detail = document.getElementById('workDetail');
      const nav = document.getElementById('nav');
      const header = document.querySelector('.works-header');
      const card = document.querySelector('.work-card');
      
      return {
        detailOpen: detail.classList.contains('open'),
        detailDisplay: detail.style.display,
        navOpacity: window.getComputedStyle(nav).opacity,
        headerOpacity: window.getComputedStyle(header).opacity,
        cardOpacity: window.getComputedStyle(card).opacity
      };
    });
    console.log("Detail closed state:", JSON.stringify(closedState, null, 2));
    
  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    console.log("Closing browser...");
    await browser.close();
  }
})();
