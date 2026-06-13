;// ═══════════ NAVIGATION ═══════════
let nav = document.getElementById('nav'), navLinks = document.querySelectorAll('.nav-links a');
let pageTransition = document.getElementById('pageTransition'), workDetail = document.getElementById('workDetail');

new IntersectionObserver(function(entries) {
  entries.forEach(function(e) { if (e.isIntersecting) nav.classList.remove('scrolled'); else nav.classList.add('scrolled'); });
}, { threshold: [0, 0.1] }).observe(document.getElementById('home'));

['home', 'work', 'showcase', 'motion', 'poetry', 'about'].forEach(function(id) {
  let el = document.getElementById(id); if (!el) return;
  new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      navLinks.forEach(function(a) { a.classList.remove('active'); });
      let link = document.querySelector('.nav-links a[data-link="' + id + '"]');
      if (link) link.classList.add('active');
    }
  }, { threshold: 0.3, rootMargin: '-20% 0px -60% 0px' }).observe(el);
});

document.querySelectorAll('a[data-link]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    let target = document.getElementById(a.dataset.link); if (!target) return;
    pageTransition.classList.add('active'); setTimeout(function() { pageTransition.classList.remove('active'); }, 1000);
    let top = a.dataset.link === 'home' ? 0 : target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: top, behavior: 'smooth' });
    if (workDetail.classList.contains('open') && window.closeDetail) window.closeDetail();
  });
});

// --- Custom Tabbed Shape Drawing for Nav Bar ---
(function() {
  const navElement = document.getElementById('nav');
  const navClipPath = document.getElementById('navClipPath');
  const navBorderPath = document.getElementById('navBorderPath');
  
  if (!navElement || !navClipPath || !navBorderPath) return;

  function getNavbarPath(w, h, inset = 0) {
    const tabH = 24;
    const tabW = 16;
    const rMain = 12;
    const rConcave = 4;
    const center = h / 2;
    
    const tTop = center - tabH / 2;
    const tBottom = center + tabH / 2;
    const cTop = tTop - rConcave;
    const cBottom = tBottom + rConcave;
    
    // Apply inset
    const x0 = inset;
    const y0 = inset;
    const xW = w - inset;
    const yH = h - inset;
    
    return `M ${tabW + rMain} ${y0}
            L ${xW - (rMain + tabW)} ${y0}
            A ${rMain} ${rMain} 0 0 1 ${xW - tabW} ${y0 + rMain}
            L ${xW - tabW} ${y0 + cTop}
            A ${rConcave} ${rConcave} 0 0 0 ${xW - tabW + rConcave} ${y0 + tTop}
            A ${tabH / 2} ${tabH / 2} 0 0 1 ${xW - tabW + rConcave} ${y0 + tBottom}
            A ${rConcave} ${rConcave} 0 0 0 ${xW - tabW} ${y0 + cBottom}
            L ${xW - tabW} ${yH - rMain}
            A ${rMain} ${rMain} 0 0 1 ${xW - tabW - rMain} ${yH}
            L ${x0 + tabW + rMain} ${yH}
            A ${rMain} ${rMain} 0 0 1 ${x0 + tabW} ${yH - rMain}
            L ${x0 + tabW} ${y0 + cBottom}
            A ${rConcave} ${rConcave} 0 0 0 ${x0 + tabW - rConcave} ${y0 + tBottom}
            A ${tabH / 2} ${tabH / 2} 0 0 1 ${x0 + tabW - rConcave} ${y0 + tTop}
            A ${rConcave} ${rConcave} 0 0 0 ${x0 + tabW} ${y0 + cTop}
            L ${x0 + tabW} ${y0 + rMain}
            A ${rMain} ${rMain} 0 0 1 ${x0 + tabW + rMain} ${y0}
            Z`;
  }

  function initNavStars() {
    const borderSvg = document.querySelector('.nav-border-svg');
    if (!borderSvg) return;
    
    let starsGroup = document.getElementById('navStarsGroup');
    if (!starsGroup) {
      starsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      starsGroup.setAttribute('id', 'navStarsGroup');
      borderSvg.insertBefore(starsGroup, borderSvg.firstChild);
    } else {
      starsGroup.innerHTML = '';
    }
    
    const numStars = 80;
    const maxWidth = 3000;
    const maxHeight = 56;
    
    for (let i = 0; i < numStars; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'nav-star');
      
      const cx = Math.random() * maxWidth;
      const cy = Math.random() * maxHeight;
      const r = 0.4 + Math.random() * 0.7; // radius between 0.4px and 1.1px
      
      circle.setAttribute('cx', cx.toFixed(1));
      circle.setAttribute('cy', cy.toFixed(1));
      circle.setAttribute('r', r.toFixed(2));
      
      const duration = 2.5 + Math.random() * 3.5;
      const delay = Math.random() * -6;
      const minOpacity = 0.15 + Math.random() * 0.2;
      const maxOpacity = 0.6 + Math.random() * 0.4;
      
      circle.style.setProperty('--duration', `${duration.toFixed(2)}s`);
      circle.style.setProperty('--delay', `${delay.toFixed(2)}s`);
      circle.style.setProperty('--min-opacity', minOpacity.toFixed(2));
      circle.style.setProperty('--max-opacity', maxOpacity.toFixed(2));
      
      starsGroup.appendChild(circle);
    }
  }

  function updateNavbarGeometry() {
    const rect = navElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    // Generate paths
    const clipD = getNavbarPath(w, h, 0);
    const borderD = getNavbarPath(w, h, 0.5); // inset by 0.5px to keep stroke within bounds
    
    navClipPath.setAttribute('d', clipD);
    navBorderPath.setAttribute('d', borderD);
  }

  // Update on resize, load, and DOMContentLoaded
  window.addEventListener('resize', updateNavbarGeometry);
  window.addEventListener('load', () => {
    updateNavbarGeometry();
    initNavStars();
  });
  document.addEventListener('DOMContentLoaded', () => {
    updateNavbarGeometry();
    initNavStars();
  });
  
  // Initial run
  updateNavbarGeometry();
  initNavStars();
  
  // Periodic poll to ensure alignment during animations / scroll transitions
  let lastW = 0, lastH = 0;
  function pollResize() {
    const rect = navElement.getBoundingClientRect();
    if (rect.width !== lastW || rect.height !== lastH) {
      lastW = rect.width;
      lastH = rect.height;
      updateNavbarGeometry();
    }
    requestAnimationFrame(pollResize);
  }
  requestAnimationFrame(pollResize);
})();
