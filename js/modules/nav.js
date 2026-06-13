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

  let starsData = [];
  let mouseX = -1000;
  let mouseY = -1000;
  let lastMouseX = -1000;
  let lastMouseY = -1000;
  let mouseVx = 0;
  let mouseVy = 0;
  let isMouseOver = false;

  navElement.addEventListener('mousemove', (e) => {
    const rect = navElement.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;
    
    if (isMouseOver && lastMouseX !== -1000) {
      mouseVx = currX - lastMouseX;
      mouseVy = currY - lastMouseY;
    } else {
      mouseVx = 0;
      mouseVy = 0;
    }
    
    mouseX = currX;
    mouseY = currY;
    lastMouseX = currX;
    lastMouseY = currY;
    isMouseOver = true;
  });

  navElement.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
    lastMouseX = -1000;
    lastMouseY = -1000;
    mouseVx = 0;
    mouseVy = 0;
    isMouseOver = false;
  });

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
    
    starsData = [];
    const numStars = 180; // Increased density to match background
    const maxWidth = 3000;
    const maxHeight = 56;
    
    for (let i = 0; i < numStars; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'nav-star');
      
      const cx = Math.random() * maxWidth;
      const cy = Math.random() * maxHeight;
      
      // Granularity alignment: 75% tiny background stars, 25% larger bright foreground stars
      const isSmall = Math.random() < 0.75;
      
      let r, minOpacity, maxOpacity, duration;
      if (isSmall) {
        r = 0.35 + Math.random() * 0.25; // 0.35px to 0.6px
        minOpacity = 0.08 + Math.random() * 0.12; // 0.08 to 0.20
        maxOpacity = 0.25 + Math.random() * 0.20; // 0.25 to 0.45
        duration = 3.5 + Math.random() * 3.5;
      } else {
        r = 0.75 + Math.random() * 0.65; // 0.75px to 1.4px
        minOpacity = 0.20 + Math.random() * 0.15; // 0.20 to 0.35
        maxOpacity = 0.65 + Math.random() * 0.30; // 0.65 to 0.95
        duration = 2.0 + Math.random() * 2.0;
      }
      
      circle.setAttribute('cx', cx.toFixed(1));
      circle.setAttribute('cy', cy.toFixed(1));
      circle.setAttribute('r', r.toFixed(2));
      
      const delay = Math.random() * -6;
      
      circle.style.setProperty('--duration', `${duration.toFixed(2)}s`);
      circle.style.setProperty('--delay', `${delay.toFixed(2)}s`);
      circle.style.setProperty('--min-opacity', minOpacity.toFixed(2));
      circle.style.setProperty('--max-opacity', maxOpacity.toFixed(2));
      
      starsGroup.appendChild(circle);
      
      starsData.push({
        el: circle,
        baseX: cx,
        baseY: cy,
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        isSmall: isSmall
      });
    }
  }

  function updateStarsPhysics() {
    if (!starsData.length) return;
    
    // Smoothly decay mouse velocity in each frame
    mouseVx *= 0.88;
    mouseVy *= 0.88;
    
    const repelRadius = 90;
    const dragFactor = 0.45; // drag force strength (mouse velocity)
    const repelFactor = 0.35; // outward push strength (pressure)
    const springStrength = 0.06; // spring back strength
    const friction = 0.84; // friction coefficient
    
    for (let i = 0; i < starsData.length; i++) {
      const star = starsData[i];
      
      let fx = 0;
      let fy = 0;
      
      if (isMouseOver) {
        const dx = star.x - mouseX;
        const dy = star.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < repelRadius && dist > 0.1) {
          const force = (repelRadius - dist) / repelRadius;
          const forceSq = force * force; // stronger close to cursor
          
          // 1. Radial repulsion (simulating fluid pressure splat)
          const angle = Math.atan2(dy, dx);
          const rx = Math.cos(angle) * forceSq * repelFactor;
          const ry = Math.sin(angle) * forceSq * repelFactor;
          
          // 2. Mouse velocity drag (simulating fluid velocity drag)
          const vx_drag = mouseVx * forceSq * dragFactor;
          const vy_drag = mouseVy * forceSq * dragFactor;
          
          // Small stars are lighter and react slightly more, large stars have more inertia
          const massFactor = star.isSmall ? 1.25 : 0.75;
          
          fx = (rx + vx_drag) * massFactor;
          fy = (ry + vy_drag) * massFactor;
        }
      }
      
      const ax = (star.baseX - star.x) * springStrength;
      const ay = (star.baseY - star.y) * springStrength;
      
      star.vx = (star.vx + fx + ax) * friction;
      star.vy = (star.vy + fy + ay) * friction;
      
      star.x += star.vx;
      star.y += star.vy;
      
      const dxFromBase = star.x - star.baseX;
      const dyFromBase = star.y - star.baseY;
      const distFromBase = Math.sqrt(dxFromBase * dxFromBase + dyFromBase * dyFromBase);
      
      if (Math.abs(star.vx) > 0.005 || Math.abs(star.vy) > 0.005 || distFromBase > 0.05) {
        star.el.setAttribute('cx', star.x.toFixed(1));
        star.el.setAttribute('cy', star.y.toFixed(1));
      } else {
        if (star.x !== star.baseX || star.y !== star.baseY) {
          star.x = star.baseX;
          star.y = star.baseY;
          star.vx = 0;
          star.vy = 0;
          star.el.setAttribute('cx', star.baseX.toFixed(1));
          star.el.setAttribute('cy', star.baseY.toFixed(1));
        }
      }
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
    updateStarsPhysics();
    requestAnimationFrame(pollResize);
  }
  requestAnimationFrame(pollResize);
})();
