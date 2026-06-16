import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);
    
    const viewports = [
      { name: 'Desktop (1440x900)', width: 1440, height: 900 },
      { name: 'Mobile (375x667)', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      console.log(`\n--- Testing ${vp.name} ---`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);

      // Unscrolled State
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      let positions = await page.evaluate(() => {
        const logo = document.getElementById('navLogo');
        const spacer = document.getElementById('navLogoSpacer');
        const nav = document.getElementById('nav');
        return {
          logo: logo ? logo.getBoundingClientRect().toJSON() : null,
          spacer: spacer ? spacer.getBoundingClientRect().toJSON() : null,
          nav: nav ? nav.getBoundingClientRect().toJSON() : null,
          navClasses: nav ? nav.className : ''
        };
      });

      console.log('Unscrolled:');
      console.log(`  Navbar: Top=${positions.nav?.top}, Height=${positions.nav?.height}, Classes="${positions.navClasses}"`);
      console.log(`  Spacer: Top=${positions.spacer?.top}, Height=${positions.spacer?.height}, Left=${positions.spacer?.left}, Width=${positions.spacer?.width}`);
      console.log(`  Logo:   Top=${positions.logo?.top}, Height=${positions.logo?.height}, Left=${positions.logo?.left}, Width=${positions.logo?.width}`);
      console.log(`  Delta Y (Spacer - Logo): ${positions.spacer && positions.logo ? (positions.spacer.top - positions.logo.top) : 'N/A'}`);

      // Scrolled State
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);

      positions = await page.evaluate(() => {
        const logo = document.getElementById('navLogo');
        const spacer = document.getElementById('navLogoSpacer');
        const nav = document.getElementById('nav');
        return {
          logo: logo ? logo.getBoundingClientRect().toJSON() : null,
          spacer: spacer ? spacer.getBoundingClientRect().toJSON() : null,
          nav: nav ? nav.getBoundingClientRect().toJSON() : null,
          navClasses: nav ? nav.className : ''
        };
      });

      console.log('Scrolled:');
      console.log(`  Navbar: Top=${positions.nav?.top}, Height=${positions.nav?.height}, Classes="${positions.navClasses}"`);
      console.log(`  Spacer: Top=${positions.spacer?.top}, Height=${positions.spacer?.height}, Left=${positions.spacer?.left}, Width=${positions.spacer?.width}`);
      console.log(`  Logo:   Top=${positions.logo?.top}, Height=${positions.logo?.height}, Left=${positions.logo?.left}, Width=${positions.logo?.width}`);
      console.log(`  Delta Y (Spacer - Logo): ${positions.spacer && positions.logo ? (positions.spacer.top - positions.logo.top) : 'N/A'}`);
    }
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
})();
