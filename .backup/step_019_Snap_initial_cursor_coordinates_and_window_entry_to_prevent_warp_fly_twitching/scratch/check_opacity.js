import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);
  
  const results = await page.evaluate(() => {
    const selectors = [
      '#work .section-tag',
      '#work .section-heading',
      '#work .works-count',
      '#ice .section-tag',
      '#ice .section-heading',
      '#showcase .section-tag',
      '#showcase .section-heading',
      '#motion .section-tag',
      '#motion .section-heading',
      '#poetry .poetry-sidebar .section-tag',
      '#poetry .poetry-title-vertical span',
      '#about .about-large .section-tag'
    ];
    
    const info = [];
    selectors.forEach(sel => {
      const els = document.querySelectorAll(sel);
      els.forEach((el, idx) => {
        const style = window.getComputedStyle(el);
        const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
        const grandParentStyle = el.parentElement?.parentElement ? window.getComputedStyle(el.parentElement.parentElement) : null;
        
        const rect = el.getBoundingClientRect();
        info.push({
          selector: sel,
          index: idx,
          text: el.innerText || el.textContent,
          rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          },
          computedOpacity: style.opacity,
          computedVisibility: style.visibility,
          parentOpacity: parentStyle ? parentStyle.opacity : null,
          parentClass: el.parentElement ? el.parentElement.className : null,
          grandParentOpacity: grandParentStyle ? grandParentStyle.opacity : null,
          grandParentClass: el.parentElement?.parentElement ? el.parentElement.parentElement.className : null
        });
      });
    });
    return info;
  });
  
  console.log(`Total elements queried: ${results.length}`);
  results.forEach(res => {
    console.log(`\nSelector: ${res.selector} (Index ${res.index})`);
    console.log(`  Text: ${JSON.stringify(res.text)}`);
    console.log(`  Rect: ${JSON.stringify(res.rect)}`);
    console.log(`  Computed Opacity: ${res.computedOpacity} | Visibility: ${res.computedVisibility}`);
    console.log(`  Parent Class: ${res.parentClass} | Parent Opacity: ${res.parentOpacity}`);
    console.log(`  Grandparent Class: ${res.grandParentClass} | Grandparent Opacity: ${res.grandParentOpacity}`);
  });
  
  await browser.close();
}

run().catch(console.error);
