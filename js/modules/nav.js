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

  const gridCount = 80;
  const velocityGrid = [];
  for (let i = 0; i < gridCount; i++) {
    velocityGrid.push({ vx: 0, vy: 0 });
  }

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
    
    // 1. Splat velocity & pressure into the grid
    const rect = navElement.getBoundingClientRect();
    const navW = rect.width || 1200;
    
    if (isMouseOver && lastMouseX !== -1000) {
      const mouseCell = (mouseX / navW) * gridCount;
      const splatRadiusCells = 5; // spread force over 5 cells
      
      for (let i = 0; i < gridCount; i++) {
        const distCells = Math.abs(i - mouseCell);
        if (distCells < splatRadiusCells) {
          const force = (splatRadiusCells - distCells) / splatRadiusCells;
          const forceSq = force * force;
          
          // Inject velocity direction
          velocityGrid[i].vx += mouseVx * forceSq * 0.18;
          velocityGrid[i].vy += mouseVy * forceSq * 0.18;
          
          // Inject pressure push (away from cursor position)
          const cellWidth = 3000 / gridCount;
          const dx = (i - mouseCell) * cellWidth;
          const dxSign = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
          velocityGrid[i].vx += dxSign * forceSq * 0.45;
        }
      }
    }
    
    // 2. Diffuse and dissipate grid velocity
    const nextGrid = [];
    const dissipation = 0.94; // slow, beautiful fluid trails
    
    for (let i = 0; i < gridCount; i++) {
      const prev = velocityGrid[i === 0 ? 0 : i - 1];
      const next = velocityGrid[i === gridCount - 1 ? gridCount - 1 : i + 1];
      const curr = velocityGrid[i];
      
      // Diffusion formula: 70% current + 30% neighbors average
      const vx = (curr.vx * 0.7 + (prev.vx + next.vx) * 0.15) * dissipation;
      const vy = (curr.vy * 0.7 + (prev.vy + next.vy) * 0.15) * dissipation;
      
      nextGrid.push({ vx, vy });
    }
    
    // Copy back to velocityGrid
    for (let i = 0; i < gridCount; i++) {
      velocityGrid[i].vx = nextGrid[i].vx;
      velocityGrid[i].vy = nextGrid[i].vy;
    }
    
    // 3. Update stars position using interpolated grid velocities
    const dragFactor = 1.6; // multiplier for drag force on stars
    const springStrength = 0.05; // spring return strength
    const friction = 0.82; // damping friction
    const maxWidth = 3000;
    
    for (let i = 0; i < starsData.length; i++) {
      const star = starsData[i];
      
      // Interpolate velocity at star's coordinate
      const pct = star.baseX / maxWidth;
      const cellFloat = pct * (gridCount - 1);
      const cellIdx = Math.max(0, Math.min(gridCount - 2, Math.floor(cellFloat)));
      const t = cellFloat - cellIdx;
      
      const velA = velocityGrid[cellIdx];
      const velB = velocityGrid[cellIdx + 1];
      
      const fx = (velA.vx * (1 - t) + velB.vx * t) * dragFactor;
      const fy = (velA.vy * (1 - t) + velB.vy * t) * dragFactor;
      
      const massFactor = star.isSmall ? 1.3 : 0.75;
      
      const ax = (star.baseX - star.x) * springStrength;
      const ay = (star.baseY - star.y) * springStrength;
      
      // Update velocity
      star.vx = (star.vx + fx * massFactor + ax) * friction;
      star.vy = (star.vy + fy * massFactor + ay) * friction;
      
      // Update position
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
