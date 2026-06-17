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

  const starsCanvas = document.getElementById('navStarsCanvas');
  const ctx = starsCanvas ? starsCanvas.getContext('2d') : null;
  const dpr = window.devicePixelRatio || 1;
  let stars = [];


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

  function fract(x) {
    return x - Math.floor(x);
  }

  function hash3(x, y) {
    let qx = fract(x * 443.897);
    let qy = fract(y * 441.423);
    let qz = fract(x * 437.195);
    
    let dotVal = qx * (qy + 19.19) + qy * (qz + 19.19) + qz * (qx + 19.19);
    qx += dotVal;
    qy += dotVal;
    qz += dotVal;
    
    return [
      fract((qx + qy) * qz),
      fract((qx + qx) * qy),
      fract((qy + qz) * qx)
    ];
  }

  function initNavStars() {
    stars = [];
    if (!navElement) return;
    
    const rect = navElement.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W === 0 || H === 0) return;
    
    const aspect = W / H;
    const pad = 2; // Pad cells to ensure stars near border are drawn
    
    // Rotation pivot in viewport UV (px = W * 0.75, py = H * 0.5)
    const pUvX = 0.75;
    const pUvY = 0.5;
    
    // Pivot in spaceUv space
    const p_space_x = (pUvX - 0.5) * aspect + 0.5;
    const p_space_y = pUvY;
    
    // Left-most point of nav bar in UV
    const vUvLeftX = rect.left / W;
    const vUvTopY = 1.0 - rect.top / H;
    
    // Distance from pivot to left-top of nav bar in spaceUv
    const dxLeft = (vUvLeftX - pUvX) * aspect;
    const dyTop = vUvTopY - pUvY;
    const R_space = Math.sqrt(dxLeft * dxLeft + dyTop * dyTop) + 0.5; // add 0.5 extra padding for safety
    
    // Bounding box in spaceUv space
    const spaceUv_min_x = p_space_x - R_space;
    const spaceUv_max_x = p_space_x + R_space;
    const spaceUv_min_y = p_space_y - R_space;
    const spaceUv_max_y = p_space_y + R_space;
    
    // We have two grid scales: 25.0 (main layer) and 60.0 (faint layer)
    const scales = [25.0, 60.0];
    
    scales.forEach(S => {
      const g_min_x = Math.floor(spaceUv_min_x * S) - pad;
      const g_max_x = Math.ceil(spaceUv_max_x * S) + pad;
      const g_min_y = Math.floor(spaceUv_min_y * S) - pad;
      const g_max_y = Math.ceil(spaceUv_max_y * S) + pad;
      
      for (let gx = g_min_x; gx <= g_max_x; gx++) {
        // Fast circular distance check to skip cells outside the rotation radius
        const cx = gx / S;
        const dx = cx - p_space_x;
        if (Math.abs(dx) > R_space + 0.1) continue;
        
        for (let gy = g_min_y; gy <= g_max_y; gy++) {
          const cy = gy / S;
          const dy = cy - p_space_y;
          if (dx * dx + dy * dy > R_space * R_space) continue;
          
          const r = hash3(gx, gy);
          if (r[2] >= 0.6) { // step(0.6, r.z)
            const offsetX = r[0] * 0.8 + 0.1;
            const offsetY = r[1] * 0.8 + 0.1;
            
            const spaceUvStarX = (gx + offsetX) / S;
            const spaceUvStarY = (gy + offsetY) / S;
            
            // Convert spaceUv back to vUv
            const vUvStarX = (spaceUvStarX - 0.5) / aspect + 0.5;
            const vUvStarY = spaceUvStarY;
            
            stars.push({
              vUvX: vUvStarX,
              vUvY: vUvStarY,
              scale: S,
              rx: r[0],
              ry: r[1],
              rz: r[2]
            });
          }
        }
      }
    });
  }

  function drawStars() {
    if (!starsCanvas || !ctx || !stars.length) return;
    
    const rect = navElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    ctx.clearRect(0, 0, w, h);
    
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W === 0 || H === 0) return;
    
    // Get time from global simulation, fallback to Date.now() / 1000
    const time = window.fluidSimulationTime !== undefined ? window.fluidSimulationTime : (Date.now() / 1000);
    
    const isLightMode = document.documentElement.classList.contains('light');
    
    // Choose composite operation based on theme
    ctx.globalCompositeOperation = isLightMode ? 'multiply' : 'screen';
    
    // Rotation pivot: middle-right of the viewport (representing the "empty parent object")
    const px = W * 0.75;
    const py = H * 0.5;
    
    // Rotation speed: reversed direction (0.03 rad/s)
    const rotationSpeed = 0.03;
    const theta = time * rotationSpeed;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      
      // 1. Calculate Twinkle (exact WebGL formula)
      const twinkle = 0.2 + 0.8 * Math.sin(time * (1.5 + star.rz) + star.rx * 20.0);
      
      // Scale factor: 1.0 for scale 25.0, 0.5 for scale 60.0 (boosted by 2.2x for bright, crisp glow)
      const scaleFactor = star.scale === 25.0 ? 2.2 : 1.1;
      
      // Calculate opacity
      const opacity = twinkle * scaleFactor;
      if (opacity <= 0.001) continue;
      
      // Star size calculation (exact WebGL formula)
      const size = 0.008 + star.rz * 0.025;
      const r = (size / star.scale) * H;
      
      // 2. Base screen position
      const baseScreenX = star.vUvX * W;
      const baseScreenY = (1.0 - star.vUvY) * H;
      
      // 3. Rotate coordinates around the pivot point px, py (rigid parent simulation)
      const dx = baseScreenX - px;
      const dy = baseScreenY - py;
      const rotX = px + dx * cos - dy * sin;
      const rotY = py + dx * sin + dy * cos;
      
      // 4. Set screenX/screenY to the rotated coordinates so the rest of drawing code uses it
      const screenX = rotX;
      const screenY = rotY;
      
      // 5. Crop check: skip stars that are far outside the navigation bar boundary
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      if (localX < -r || localX > w + r || localY < -r || localY > h + r) {
        continue;
      }
      
      // 6. Fetch local velocity from window.cpuFluid at the rotated coordinates
      let vx = 0, vy = 0;
      if (window.cpuFluid) {
        const rotUvX = rotX / W;
        const rotUvY = 1.0 - rotY / H;
        const vel = window.cpuFluid.getVelocity(rotUvX, rotUvY);
        vx = vel.x;
        vy = vel.y;
      }
      
      // Chromatic aberration offsets in pixels (aligned with WebGL shader factors)
      const dxR = vx * 0.015 * W;
      const dyR = -vy * 0.015 * H;
      
      const dxG = vx * 0.018 * W;
      const dyG = -vy * 0.018 * H;
      
      const dxB = vx * 0.021 * W;
      const dyB = -vy * 0.021 * H;
      
      // Retrieve the current accent color RGB values dynamically (fallback to default orange 232, 124, 80)
      const accentRgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '232, 124, 80';
      let rgbParts = accentRgb.split(',').map(x => parseInt(x.trim(), 10));
      if (rgbParts.length !== 3 || rgbParts.some(isNaN)) {
        rgbParts = [232, 124, 80];
      }
      const [targetR, targetG, targetB] = rgbParts;

      if (isLightMode) {
        // Light Mode: Subtractive Chromatic Aberration using multiply blend mode to form the custom accent color
        // Subtraction coefficients: (255 - target) / 255
        const coeffR = (255 - targetR) / 255;
        const coeffG = (255 - targetG) / 255;
        const coeffB = (255 - targetB) / 255;
        const baseA = opacity * 1.5;
        
        // 1. Red channel subtraction (Cyan color)
        const rx = screenX + dxR - rect.left;
        const ry = screenY + dyR - rect.top;
        if (rx >= -r && rx <= w + r && ry >= -r && ry <= h + r) {
          const gradR = ctx.createRadialGradient(rx, ry, 0, rx, ry, r);
          const a0 = Math.min(1.0, 2.5 * baseA * coeffR);
          const a25 = Math.min(1.0, 0.84 * baseA * coeffR);
          gradR.addColorStop(0, `rgba(0, 255, 255, ${a0})`);
          gradR.addColorStop(0.25, `rgba(0, 255, 255, ${a25})`);
          gradR.addColorStop(1, 'rgba(0, 255, 255, 0)');
          ctx.fillStyle = gradR;
          ctx.beginPath();
          ctx.arc(rx, ry, r, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 2. Green channel subtraction (Magenta color)
        const gx = screenX + dxG - rect.left;
        const gy = screenY + dyG - rect.top;
        if (gx >= -r && gx <= w + r && gy >= -r && gy <= h + r) {
          const gradG = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
          const a0 = Math.min(1.0, 2.5 * baseA * coeffG);
          const a25 = Math.min(1.0, 0.84 * baseA * coeffG);
          gradG.addColorStop(0, `rgba(255, 0, 255, ${a0})`);
          gradG.addColorStop(0.25, `rgba(255, 0, 255, ${a25})`);
          gradG.addColorStop(1, 'rgba(255, 0, 255, 0)');
          ctx.fillStyle = gradG;
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 3. Blue channel subtraction (Yellow color)
        const bx = screenX + dxB - rect.left;
        const by = screenY + dyB - rect.top;
        if (bx >= -r && bx <= w + r && by >= -r && by <= h + r) {
          const gradB = ctx.createRadialGradient(bx, by, 0, bx, by, r);
          const a0 = Math.min(1.0, 2.5 * baseA * coeffB);
          const a25 = Math.min(1.0, 0.84 * baseA * coeffB);
          gradB.addColorStop(0, `rgba(255, 255, 0, ${a0})`);
          gradB.addColorStop(0.25, `rgba(255, 255, 0, ${a25})`);
          gradB.addColorStop(1, 'rgba(255, 255, 0, 0)');
          ctx.fillStyle = gradB;
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Dark Mode: Additive Chromatic Aberration using screen blend mode to form the custom accent color
        // 1. Red channel glow (Red color scaled to targetR)
        const rx = screenX + dxR - rect.left;
        const ry = screenY + dyR - rect.top;
        if (rx >= -r && rx <= w + r && ry >= -r && ry <= h + r) {
          const gradR = ctx.createRadialGradient(rx, ry, 0, rx, ry, r);
          const a0 = Math.min(1.0, 2.5 * opacity);
          const a25 = Math.min(1.0, 0.84 * opacity);
          gradR.addColorStop(0, `rgba(${targetR}, 0, 0, ${a0})`);
          gradR.addColorStop(0.25, `rgba(${targetR}, 0, 0, ${a25})`);
          gradR.addColorStop(1, `rgba(${targetR}, 0, 0, 0)`);
          ctx.fillStyle = gradR;
          ctx.beginPath();
          ctx.arc(rx, ry, r, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 2. Green channel glow (Green color scaled to targetG)
        const gx = screenX + dxG - rect.left;
        const gy = screenY + dyG - rect.top;
        if (gx >= -r && gx <= w + r && gy >= -r && gy <= h + r) {
          const gradG = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
          const a0 = Math.min(1.0, 2.5 * opacity);
          const a25 = Math.min(1.0, 0.84 * opacity);
          gradG.addColorStop(0, `rgba(0, ${targetG}, 0, ${a0})`);
          gradG.addColorStop(0.25, `rgba(0, ${targetG}, 0, ${a25})`);
          gradG.addColorStop(1, `rgba(0, ${targetG}, 0, 0)`);
          ctx.fillStyle = gradG;
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 3. Blue channel glow (Blue color scaled to targetB)
        const bx = screenX + dxB - rect.left;
        const by = screenY + dyB - rect.top;
        if (bx >= -r && bx <= w + r && by >= -r && by <= h + r) {
          const gradB = ctx.createRadialGradient(bx, by, 0, bx, by, r);
          const a0 = Math.min(1.0, 2.5 * opacity);
          const a25 = Math.min(1.0, 0.84 * opacity);
          gradB.addColorStop(0, `rgba(0, 0, ${targetB}, ${a0})`);
          gradB.addColorStop(0.25, `rgba(0, 0, ${targetB}, ${a25})`);
          gradB.addColorStop(1, `rgba(0, 0, ${targetB}, 0)`);
          ctx.fillStyle = gradB;
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fill();
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
    
    const glowPath = document.getElementById('navInnerGlowPath');
    if (glowPath) {
      glowPath.setAttribute('d', getNavbarPath(w, h, 1.5)); // inset slightly for a centered inner glow
    }
    
    if (starsCanvas && ctx) {
      starsCanvas.width = w * dpr;
      starsCanvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }
    
    // Recalculate stars that fall within the new dimensions
    initNavStars();
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
    drawStars();
    requestAnimationFrame(pollResize);
  }
  requestAnimationFrame(pollResize);
})();
