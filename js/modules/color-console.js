import gsap from 'gsap';

/* YYJZ COLOR PALETTE CONSOLE */
(function initColorConsole() {
  const logo = document.getElementById('navLogo');
  const staticLogo = document.getElementById('navLogoStatic');
  const consoleEl = document.getElementById('colorConsole');
  const closeBtn = document.getElementById('consoleCloseBtn');
  const resetBtn = document.getElementById('consoleResetBtn');
  const copyColorBtn = document.getElementById('consoleCopyColorBtn');
  const primaryPicker = document.getElementById('primaryPicker');
  const secondaryPicker = document.getElementById('secondaryPicker');
  const primaryBadge = document.getElementById('primaryBadge');
  const secondaryBadge = document.getElementById('secondaryBadge');
  const presetBtns = document.querySelectorAll('.preset-btn');

  if (!logo || !consoleEl) return;

  let _animating = false;

  // --- Console Stars Background (Synchronized with Nav Bar Stars) ---
  const consoleStarsCanvas = document.getElementById('consoleStarsCanvas');
  const consoleCtx = consoleStarsCanvas ? consoleStarsCanvas.getContext('2d') : null;
  const consoleDpr = window.devicePixelRatio || 1;
  let consoleStars = [];
  let consoleStarsAnimId = null;

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

  function initConsoleStars() {
    consoleStars = [];
    if (!consoleEl) return;
    
    const rect = consoleEl.getBoundingClientRect();
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
    
    // Find the furthest distance from pivot to any of the 4 corners of the console card in spaceUv
    const corners = [
      { x: rect.left / W, y: 1.0 - rect.top / H },
      { x: rect.right / W, y: 1.0 - rect.top / H },
      { x: rect.left / W, y: 1.0 - rect.bottom / H },
      { x: rect.right / W, y: 1.0 - rect.bottom / H }
    ];
    
    let maxD2 = 0;
    corners.forEach(c => {
      const sx = (c.x - 0.5) * aspect + 0.5;
      const sy = c.y;
      const dx = sx - p_space_x;
      const dy = sy - p_space_y;
      const d2 = dx * dx + dy * dy;
      if (d2 > maxD2) {
        maxD2 = d2;
      }
    });
    
    const R_space = Math.sqrt(maxD2) + 0.5; // add 0.5 extra padding for safety
    
    // Bounding box in spaceUv space
    const spaceUv_min_x = p_space_x - R_space;
    const spaceUv_max_x = p_space_x + R_space;
    const spaceUv_min_y = p_space_y - R_space;
    const spaceUv_max_y = p_space_y + R_space;
    
    // Two grid scales: 25.0 (main layer) and 60.0 (faint layer)
    const scales = [25.0, 60.0];
    
    scales.forEach(S => {
      const g_min_x = Math.floor(spaceUv_min_x * S) - pad;
      const g_max_x = Math.ceil(spaceUv_max_x * S) + pad;
      const g_min_y = Math.floor(spaceUv_min_y * S) - pad;
      const g_max_y = Math.ceil(spaceUv_max_y * S) + pad;
      
      for (let gx = g_min_x; gx <= g_max_x; gx++) {
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
            
            consoleStars.push({
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

  function drawConsoleStars() {
    if (!consoleStarsCanvas || !consoleCtx || !consoleStars.length) return;
    
    // We must only animate when the console is open to conserve CPU.
    if (!consoleEl.classList.contains('active')) return;
    
    const rect = consoleEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    consoleCtx.clearRect(0, 0, w, h);
    
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W === 0 || H === 0) return;
    
    // Get time from global simulation, fallback to Date.now() / 1000
    const time = window.fluidSimulationTime !== undefined ? window.fluidSimulationTime : (Date.now() / 1000);
    
    const isLightMode = document.documentElement.classList.contains('light');
    
    // Choose composite operation based on theme
    consoleCtx.globalCompositeOperation = isLightMode ? 'multiply' : 'screen';
    
    // Rotation pivot: middle-right of the viewport
    const px = W * 0.75;
    const py = H * 0.5;
    
    // Rotation speed: reversed direction (0.03 rad/s)
    const rotationSpeed = 0.03;
    const theta = time * rotationSpeed;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    
    for (let i = 0; i < consoleStars.length; i++) {
      const star = consoleStars[i];
      
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
      
      // 3. Rotate coordinates around the pivot point px, py
      const dx = baseScreenX - px;
      const dy = baseScreenY - py;
      const rotX = px + dx * cos - dy * sin;
      const rotY = py + dx * sin + dy * cos;
      
      // 4. Set screenX/screenY to the rotated coordinates
      const screenX = rotX;
      const screenY = rotY;
      
      // 5. Crop check: skip stars that are far outside the console boundary
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
        // Light Mode: Subtractive Chromatic Aberration
        const coeffR = (255 - targetR) / 255;
        const coeffG = (255 - targetG) / 255;
        const coeffB = (255 - targetB) / 255;
        const baseA = opacity * 1.5;
        
        // 1. Red channel subtraction (Cyan color)
        const rx = screenX + dxR - rect.left;
        const ry = screenY + dyR - rect.top;
        if (rx >= -r && rx <= w + r && ry >= -r && ry <= h + r) {
          const gradR = consoleCtx.createRadialGradient(rx, ry, 0, rx, ry, r);
          const a0 = Math.min(1.0, 2.5 * baseA * coeffR);
          const a25 = Math.min(1.0, 0.84 * baseA * coeffR);
          gradR.addColorStop(0, `rgba(0, 255, 255, ${a0})`);
          gradR.addColorStop(0.25, `rgba(0, 255, 255, ${a25})`);
          gradR.addColorStop(1, 'rgba(0, 255, 255, 0)');
          consoleCtx.fillStyle = gradR;
          consoleCtx.beginPath();
          consoleCtx.arc(rx, ry, r, 0, Math.PI * 2);
          consoleCtx.fill();
        }
        
        // 2. Green channel subtraction (Magenta color)
        const gx = screenX + dxG - rect.left;
        const gy = screenY + dyG - rect.top;
        if (gx >= -r && gx <= w + r && gy >= -r && gy <= h + r) {
          const gradG = consoleCtx.createRadialGradient(gx, gy, 0, gx, gy, r);
          const a0 = Math.min(1.0, 2.5 * baseA * coeffG);
          const a25 = Math.min(1.0, 0.84 * baseA * coeffG);
          gradG.addColorStop(0, `rgba(255, 0, 255, ${a0})`);
          gradG.addColorStop(0.25, `rgba(255, 0, 255, ${a25})`);
          gradG.addColorStop(1, 'rgba(255, 0, 255, 0)');
          consoleCtx.fillStyle = gradG;
          consoleCtx.beginPath();
          consoleCtx.arc(gx, gy, r, 0, Math.PI * 2);
          consoleCtx.fill();
        }
        
        // 3. Blue channel subtraction (Yellow color)
        const bx = screenX + dxB - rect.left;
        const by = screenY + dyB - rect.top;
        if (bx >= -r && bx <= w + r && by >= -r && by <= h + r) {
          const gradB = consoleCtx.createRadialGradient(bx, by, 0, bx, by, r);
          const a0 = Math.min(1.0, 2.5 * baseA * coeffB);
          const a25 = Math.min(1.0, 0.84 * baseA * coeffB);
          gradB.addColorStop(0, `rgba(255, 255, 0, ${a0})`);
          gradB.addColorStop(0.25, `rgba(255, 255, 0, ${a25})`);
          gradB.addColorStop(1, 'rgba(255, 255, 0, 0)');
          consoleCtx.fillStyle = gradB;
          consoleCtx.beginPath();
          consoleCtx.arc(bx, by, r, 0, Math.PI * 2);
          consoleCtx.fill();
        }
      } else {
        // Dark Mode: Additive Chromatic Aberration
        // 1. Red channel glow
        const rx = screenX + dxR - rect.left;
        const ry = screenY + dyR - rect.top;
        if (rx >= -r && rx <= w + r && ry >= -r && ry <= h + r) {
          const gradR = consoleCtx.createRadialGradient(rx, ry, 0, rx, ry, r);
          const a0 = Math.min(1.0, 2.5 * opacity);
          const a25 = Math.min(1.0, 0.84 * opacity);
          gradR.addColorStop(0, `rgba(${targetR}, 0, 0, ${a0})`);
          gradR.addColorStop(0.25, `rgba(${targetR}, 0, 0, ${a25})`);
          gradR.addColorStop(1, `rgba(${targetR}, 0, 0, 0)`);
          consoleCtx.fillStyle = gradR;
          consoleCtx.beginPath();
          consoleCtx.arc(rx, ry, r, 0, Math.PI * 2);
          consoleCtx.fill();
        }
        
        // 2. Green channel glow
        const gx = screenX + dxG - rect.left;
        const gy = screenY + dyG - rect.top;
        if (gx >= -r && gx <= w + r && gy >= -r && gy <= h + r) {
          const gradG = consoleCtx.createRadialGradient(gx, gy, 0, gx, gy, r);
          const a0 = Math.min(1.0, 2.5 * opacity);
          const a25 = Math.min(1.0, 0.84 * opacity);
          gradG.addColorStop(0, `rgba(0, ${targetG}, 0, ${a0})`);
          gradG.addColorStop(0.25, `rgba(0, ${targetG}, 0, ${a25})`);
          gradG.addColorStop(1, `rgba(0, ${targetG}, 0, 0)`);
          consoleCtx.fillStyle = gradG;
          consoleCtx.beginPath();
          consoleCtx.arc(gx, gy, r, 0, Math.PI * 2);
          consoleCtx.fill();
        }
        
        // 3. Blue channel glow
        const bx = screenX + dxB - rect.left;
        const by = screenY + dyB - rect.top;
        if (bx >= -r && bx <= w + r && by >= -r && by <= h + r) {
          const gradB = consoleCtx.createRadialGradient(bx, by, 0, bx, by, r);
          const a0 = Math.min(1.0, 2.5 * opacity);
          const a25 = Math.min(1.0, 0.84 * opacity);
          gradB.addColorStop(0, `rgba(0, 0, ${targetB}, ${a0})`);
          gradB.addColorStop(0.25, `rgba(0, 0, ${targetB}, ${a25})`);
          gradB.addColorStop(1, `rgba(0, 0, ${targetB}, 0)`);
          consoleCtx.fillStyle = gradB;
          consoleCtx.beginPath();
          consoleCtx.arc(bx, by, r, 0, Math.PI * 2);
          consoleCtx.fill();
        }
      }
    }
  }

  function updateConsoleGeometry() {
    if (!consoleEl || !consoleStarsCanvas) return;
    const rect = consoleEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    consoleStarsCanvas.width = w * consoleDpr;
    consoleStarsCanvas.height = h * consoleDpr;
    consoleCtx.scale(consoleDpr, consoleDpr);
    
    initConsoleStars();
  }

  function animateConsoleStars() {
    if (!consoleEl.classList.contains('active')) {
      consoleStarsAnimId = null;
      return;
    }
    drawConsoleStars();
    consoleStarsAnimId = requestAnimationFrame(animateConsoleStars);
  }

  window.addEventListener('resize', () => {
    if (consoleEl.classList.contains('active')) {
      updateConsoleGeometry();
    }
  });

  function toggleConsole(active) {
    if (_animating) return;
    const isOpening = active !== undefined ? active : !consoleEl.classList.contains('active');

    // 1. Disable CSS transitions instantly to avoid race condition/jitter
    logo.style.setProperty('transition', 'none', 'important');
    logo.classList.add('no-transition');
    consoleEl.style.transition = 'none';

    // Target element to match positioning
    const anchorEl = staticLogo || logo;

    if (isOpening) {
      const placeholder = document.getElementById('consoleTitlePlaceholder');
      if (!placeholder) return;

      // Measure starting position in navbar
      if (staticLogo) {
        staticLogo.style.transform = 'none';
        staticLogo.offsetHeight; // Force reflow
      }
      const startRect = anchorEl.getBoundingClientRect();
      if (staticLogo) {
        staticLogo.style.transform = ''; // Restore
      }
      
      // Add active class and measure target position under layout-active conditions
      consoleEl.classList.add('active');
      gsap.set(consoleEl, { y: 0, scale: 1 });
      
      // Temporarily append logo to placeholder to get its exact final layout coordinates
      placeholder.appendChild(logo);
      logo.style.setProperty('transition', 'none', 'important');
      logo.classList.add('console-active');
      logo.offsetHeight; // Force reflow
      
      const targetRect = logo.getBoundingClientRect();
      
      // Detach and put it back to body for flight
      document.body.appendChild(logo);
      logo.offsetHeight; // Force reflow
      
      const toRect = {
        left: targetRect.left,
        top: targetRect.top,
        width: targetRect.width,
        height: targetRect.height
      };
      
      // Setup consoleEl starting animation state inline (reversing the y:0 scale:1 set above)
      gsap.set(consoleEl, { x: -30, y: -20, scale: 0.93, opacity: 0 }); 
      
      // Select internal elements for staggered entry
      const consoleHeader = consoleEl.querySelector('.color-console-header');
      const consoleSections = consoleEl.querySelectorAll('.console-section');
      const consoleActions = consoleEl.querySelector('.console-actions-row');
      gsap.set([consoleHeader, ...consoleSections, consoleActions], { y: 15, opacity: 0 });
      
      consoleEl.offsetHeight; // Force reflow
 
      // Setup initial animated outline logo state
      gsap.set(logo, {
        left: startRect.left,
        top: startRect.top,
        opacity: 0
      });
      logo.classList.add('console-active');
      logo.offsetHeight; // Force reflow
 
      _animating = true;
 
      const maxBulge = window.__logoBulge !== undefined ? window.__logoBulge : (window.innerWidth > 768 ? 36 : 28);
      const duration = window.__logoDuration !== undefined ? window.__logoDuration : 2.7;
      const ease = window.__logoEase !== undefined ? window.__logoEase : 'power4.inOut';
      const animState = { progress: 0 };
 
      // Force browser reflow to apply the transition removal and initial position immediately
      logo.offsetHeight;
 
      const tl = gsap.timeline({
        onComplete: () => {
          // DOM Handover: append logo to placeholder inside console header
          placeholder.appendChild(logo);
          // Clear GSAP inline styles to let CSS take over positioning
          gsap.set(logo, { clearProps: 'all' });
          
          // Recalculate console stars geometry at final stable size/position
          updateConsoleGeometry();
          
          _animating = false;

          // Trigger logo landing star splash immediately upon landing
          const rect = logo.getBoundingClientRect();
          const clientX = rect.left + rect.width / 2;
          const clientY = rect.top + rect.height / 2;

          if (typeof window.triggerLogoStarSplash === 'function') {
            const x = clientX / window.innerWidth;
            const y = 1.0 - (clientY / window.innerHeight);
            window.triggerLogoStarSplash(x, y);
          }
          if (typeof window.triggerForgeBurst === 'function') {
            window.triggerForgeBurst(clientX, clientY);
          }
        }
      });
 
      // Smoothly fade out the solid logo in the navbar
      if (staticLogo) {
        gsap.to(staticLogo, { opacity: 0, duration: 0.4, ease: 'power2.out' });
      }
 
      // Smoothly fade in the outline logo at the start of flight
      tl.to(logo, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
 
      // Unified parametric tween: interpolates left/top/x based on eased virtual progress
      tl.to(animState, {
        progress: 1,
        duration: duration,
        ease: ease,
        onUpdate: function() {
          const s = animState.progress;
          const currentLeft = gsap.utils.interpolate(startRect.left, toRect.left, s);
          const currentTop = gsap.utils.interpolate(startRect.top, toRect.top, s);
          const xOffset = Math.sin(s * Math.PI) * maxBulge;
          gsap.set(logo, {
            left: currentLeft,
            top: currentTop,
            x: xOffset
          });
        }
      }, 0);

      tl.to(consoleEl, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.4,
        ease: 'power4.out'
      }, 0.8);

      tl.to([consoleHeader, ...consoleSections, consoleActions], {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12
      }, 1.2);

    } else {
      // --- CLOSING ---
      // Temporarily clear transforms to get unscaled rects
      logo.style.transform = 'none';
      if (staticLogo) {
        staticLogo.style.transform = 'none';
      }
      logo.offsetHeight; // Force reflow
      
      const startRect = logo.getBoundingClientRect();
      const toRect = anchorEl.getBoundingClientRect();
      
      // DOM Handover: move logo back to body for flight
      document.body.appendChild(logo);
      
      // Re-apply starting position inline so it doesn't jump
      gsap.set(logo, {
        left: startRect.left,
        top: startRect.top,
        x: 0,
        opacity: 1
      });
      logo.offsetHeight; // Force reflow
      
      logo.style.transform = ''; // Restore
      if (staticLogo) {
        staticLogo.style.transform = ''; // Restore
      }
      
      _animating = true;
      const maxBulge = window.__logoBulge !== undefined ? window.__logoBulge : (window.innerWidth > 768 ? 36 : 28);
      const duration = (window.__logoDuration !== undefined ? window.__logoDuration : 2.7) * 0.5;
      const ease = window.__logoEase !== undefined ? window.__logoEase : 'power4.inOut';
      const animState = { progress: 0 };

      // Ensure logo is visible at the start of closing animation
      gsap.set(logo, { opacity: 1 });
      logo.offsetHeight; // Force reflow

      const tl = gsap.timeline({
        onComplete: () => {
          // Clear GSAP inline styles while transitions are still disabled to prevent snapping transitions
          gsap.set(logo, { clearProps: 'all' });
          gsap.set(consoleEl, { clearProps: 'all' });
          if (staticLogo) {
            gsap.set(staticLogo, { clearProps: 'opacity' });
          }
          
          // Clear internal elements inline styles as well
          const consoleHeader = consoleEl.querySelector('.color-console-header');
          const consoleSections = consoleEl.querySelectorAll('.console-section');
          const consoleActions = consoleEl.querySelector('.console-actions-row');
          gsap.set([consoleHeader, ...consoleSections, consoleActions], { clearProps: 'all' });

          logo.style.removeProperty('transition');
          logo.classList.remove('no-transition');
          logo.classList.remove('console-active');
          consoleEl.style.transition = '';
          consoleEl.classList.remove('active');
          _animating = false;
        }
      });

      // Smoothly fade the solid logo back in as outline approaches the navbar
      if (staticLogo) {
        gsap.to(staticLogo, { opacity: 1, duration: 0.5, ease: 'power2.inOut', delay: duration - 0.5 });
      }

      // Smoothly fade out outline logo as it lands to morph back into solid logo
      tl.to(logo, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, duration - 0.4);

      // Parametric return tween: keeps path geometric shape perfect
      tl.to(animState, {
        progress: 1,
        duration: duration,
        ease: ease,
        onUpdate: function() {
          const s = animState.progress;
          const currentLeft = gsap.utils.interpolate(startRect.left, toRect.left, s); // startRect is anchorEl rect (navbar)
          const currentTop = gsap.utils.interpolate(startRect.top, toRect.top, s);
          const xOffset = Math.sin(s * Math.PI) * maxBulge;
          gsap.set(logo, {
            left: currentLeft,
            top: currentTop,
            x: xOffset
          });
        }
      }, 0);

      tl.to(consoleEl, {
        opacity: 0,
        x: -30,
        y: -20,
        scale: 0.93,
        duration: 0.5,
        ease: 'power3.in'
      }, 0);
    }
  }

  // Toggle console
  if (staticLogo) {
    staticLogo.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleConsole();
    });
  }

  logo.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleConsole();
  });

  closeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleConsole(false);
  });

  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (consoleEl.classList.contains('active') && !consoleEl.contains(e.target) && e.target !== logo && e.target !== staticLogo) {
      toggleConsole(false);
    }
  });

  // Prevent console clicks from bubbling up and closing it
  consoleEl.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  // Helper: Hex to RGB
  function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    return `${r},${g},${b}`;
  }

  // Helper: Get lighter hover color
  function getHoverColor(hex, factor = 0.2) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    r = Math.min(255, Math.round(r + (255 - r) * factor));
    g = Math.min(255, Math.round(g + (255 - g) * factor));
    b = Math.min(255, Math.round(b + (255 - b) * factor));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Helper: Get darker shadow color
  function getDarkerRGB(rgbStr, factor = 0.6) {
    let parts = rgbStr.split(',').map(x => parseInt(x.trim(), 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
      let r = Math.round(parts[0] * factor);
      let g = Math.round(parts[1] * factor);
      let b = Math.round(parts[2] * factor);
      return `${r},${g},${b}`;
    }
    return '145,65,35';
  }

  // Preset definitions
  const presets = {
    default: { primary: '#D6FF3E', secondary: '#1756FD' },
    cyberpunk: { primary: '#ff007f', secondary: '#00f3ff' },
    forest: { primary: '#52ffc5', secondary: '#ff4747' },
    ocean: { primary: '#1f5be5', secondary: '#e12323' },
    royal: { primary: '#965AFA', secondary: '#AFEF02' }
  };

  // Helper: Parses any color (hex or rgb/rgba) into {r, g, b}
  function parseToRgbObj(colorStr) {
    colorStr = colorStr.trim();
    if (colorStr.startsWith('rgb')) {
      const match = colorStr.match(/\d+/g);
      if (match && match.length >= 3) {
        return {
          r: parseInt(match[0], 10),
          g: parseInt(match[1], 10),
          b: parseInt(match[2], 10)
        };
      }
    }
    let hex = colorStr;
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    return { r, g, b };
  }

  // Helper: RGB Object to Hex
  function rgbObjToHex({ r, g, b }) {
    const clamp = x => Math.max(0, Math.min(255, Math.round(x)));
    return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
  }

  // Helper: Get current computed primary and secondary RGB colors
  function getCurrentColors() {
    const isLight = document.documentElement.classList.contains('light');
    const currentAccentStr = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e87c50';
    let currentSecondaryStr = '';
    if (isLight) {
      currentSecondaryStr = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f5f0e8';
    } else {
      currentSecondaryStr = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#faf2e3';
    }
    return {
      primary: parseToRgbObj(currentAccentStr),
      secondary: parseToRgbObj(currentSecondaryStr)
    };
  }

  // Direct CSS styling updates
  function updateStyles(primary, secondary) {
    const isLight = document.documentElement.classList.contains('light');
    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);

    // Apply primary variables
    document.documentElement.style.setProperty('--accent', primary);
    document.documentElement.style.setProperty('--accent-rgb', primaryRgb);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${primaryRgb}, 0.11)`);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${primaryRgb}, 0.04)`);
    document.documentElement.style.setProperty('--accent-hover', getHoverColor(primary));

    // Canvas rope updates
    window.__accentRGB = primaryRgb;
    window.__accentShadowRGB = getDarkerRGB(primaryRgb);

    // Apply secondary variables based on dark/light theme
    if (isLight) {
      document.documentElement.style.setProperty('--bg', secondary);
      document.documentElement.style.removeProperty('--fg');
      document.documentElement.style.removeProperty('--fg-rgb');
      document.documentElement.style.setProperty('--crescent-color', 'var(--fg)');
    } else {
      document.documentElement.style.setProperty('--fg', secondary);
      document.documentElement.style.setProperty('--fg-rgb', secondaryRgb);
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.setProperty('--crescent-color', secondary);
    }

    // Sync input pickers and preview badges
    primaryPicker.value = primary;
    secondaryPicker.value = secondary;
    primaryBadge.style.backgroundColor = primary;
    secondaryBadge.style.backgroundColor = secondary;
  }

  // Apply colors to document with optional GSAP transition animation and save to state
  let colorTween = null;
  let transitionTimeline = null;
  function applyColors(primary, secondary, save = true, animateOrEvent = true) {
    if (save) {
      localStorage.setItem('customPrimary', primary);
      localStorage.setItem('customSecondary', secondary);
    }

    if (colorTween) colorTween.kill();
    if (transitionTimeline) transitionTimeline.kill();

    const animate = !!animateOrEvent;

    if (animate) {
      const overlay = document.getElementById('colorTransitionOverlay');
      const secPath = overlay ? overlay.querySelector('.secondary-path') : null;
      const priPath = overlay ? overlay.querySelector('.primary-path') : null;

      if (overlay && secPath && priPath) {
        // Set target colors using style.fill to override stylesheet declarations completely
        secPath.style.fill = secondary;
        priPath.style.fill = primary;

        // Reset starting position (bottom flat flat)
        secPath.setAttribute('d', 'M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z');
        priPath.setAttribute('d', 'M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z');
        overlay.style.display = 'block';

        // Animate overlay blocks using liquid morphing paths
        transitionTimeline = gsap.timeline({
          onComplete: () => {
            overlay.style.display = 'none';
            // Reset paths for next transition
            secPath.setAttribute('d', 'M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z');
            priPath.setAttribute('d', 'M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z');
          }
        });

        const secWave = { left: 100, ctrl: 100, right: 100 };
        const priWave = { left: 100, ctrl: 100, right: 100 };
        const secReveal = { left: 100, ctrl: 100, right: 100 };
        const priReveal = { left: 100, ctrl: 100, right: 100 };

        // 1. Secondary wave rises from bottom to top
        transitionTimeline.to(secWave, {
          left: 0,
          right: 0,
          ctrl: -25, // shoots above top for curved stretch
          duration: 0.7,
          ease: 'power3.inOut',
          onUpdate: () => {
            secPath.setAttribute('d', `M 0 ${secWave.left} Q 50 ${secWave.ctrl} 100 ${secWave.right} L 100 100 L 0 100 Z`);
          }
        }, 0);

        // 2. Primary wave rises from bottom to top (staggered for liquid layers)
        transitionTimeline.to(priWave, {
          left: 0,
          right: 0,
          ctrl: -25,
          duration: 0.7,
          ease: 'power3.inOut',
          onUpdate: () => {
            priPath.setAttribute('d', `M 0 ${priWave.left} Q 50 ${priWave.ctrl} 100 ${priWave.right} L 100 100 L 0 100 Z`);
          }
        }, 0.12);

        // 3. Midway: Apply colors instantly under the cover of the liquid (at t = 0.82s when priPath is fully covered)
        transitionTimeline.call(() => {
          updateStyles(primary, secondary);
        }, null, 0.82);

        // 4. Secondary wave pulls up to reveal
        transitionTimeline.to(secReveal, {
          left: 0,
          right: 0,
          ctrl: -25, // center pulls up faster creating an arch
          duration: 0.7,
          ease: 'power3.inOut',
          onUpdate: () => {
            secPath.setAttribute('d', `M 0 0 L 100 0 L 100 ${secReveal.right} Q 50 ${secReveal.ctrl} 0 ${secReveal.left} Z`);
          }
        }, 0.85);

        // 5. Primary wave pulls up to reveal (staggered)
        transitionTimeline.to(priReveal, {
          left: 0,
          right: 0,
          ctrl: -25,
          duration: 0.7,
          ease: 'power3.inOut',
          onUpdate: () => {
            priPath.setAttribute('d', `M 0 0 L 100 0 L 100 ${priReveal.right} Q 50 ${priReveal.ctrl} 0 ${priReveal.left} Z`);
          }
        }, 0.97);
      } else {
        // Fallback to smooth numeric fade
        const current = getCurrentColors();
        const targetP = parseToRgbObj(primary);
        const targetS = parseToRgbObj(secondary);

        const tweenState = {
          pr: current.primary.r, pg: current.primary.g, pb: current.primary.b,
          sr: current.secondary.r, sg: current.secondary.g, sb: current.secondary.b
        };

        colorTween = gsap.to(tweenState, {
          pr: targetP.r, pg: targetP.g, pb: targetP.b,
          sr: targetS.r, sg: targetS.g, sb: targetS.b,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => {
            const pColor = rgbObjToHex({ r: tweenState.pr, g: tweenState.pg, b: tweenState.pb });
            const sColor = rgbObjToHex({ r: tweenState.sr, g: tweenState.sg, b: tweenState.sb });
            updateStyles(pColor, sColor);
          }
        });
      }
    } else {
      updateStyles(primary, secondary);
    }
  }

  // Load custom colors from storage on init
  function initLoad() {
    const savedPrimary = localStorage.getItem('customPrimary');
    const savedSecondary = localStorage.getItem('customSecondary');
    const savedPreset = localStorage.getItem('activePreset') || 'default';

    if (savedPrimary && savedSecondary) {
      applyColors(savedPrimary, savedSecondary, false, false);
      // Highlight correct preset button
      presetBtns.forEach(btn => {
        if (btn.dataset.preset === savedPreset) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    } else {
      // Revert to default or active preset
      const themeColors = presets[savedPreset];
      if (themeColors) {
        applyColors(themeColors.primary, themeColors.secondary, false, false);
        presetBtns.forEach(btn => {
          if (btn.dataset.preset === savedPreset) btn.classList.add('active');
          else btn.classList.remove('active');
        });
      }
    }
  }

  // Bind Preset buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const presetKey = btn.dataset.preset;
      const themeColors = presets[presetKey];
      if (themeColors) {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        localStorage.setItem('activePreset', presetKey);
        applyColors(themeColors.primary, themeColors.secondary, true, e);
      }
    });
  });

  // Bind Custom color pickers
  primaryPicker.addEventListener('input', function(e) {
    // Remove active state from presets when custom values are selected
    presetBtns.forEach(b => b.classList.remove('active'));
    localStorage.setItem('activePreset', 'custom');
    applyColors(primaryPicker.value, secondaryPicker.value, true, false);
  });

  secondaryPicker.addEventListener('input', function(e) {
    presetBtns.forEach(b => b.classList.remove('active'));
    localStorage.setItem('activePreset', 'custom');
    applyColors(primaryPicker.value, secondaryPicker.value, true, false);
  });

  // Bind Copy Color button
  if (copyColorBtn) {
    copyColorBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const primaryColor = primaryPicker.value;
      const secondaryColor = secondaryPicker.value;
      const textToCopy = `Primary: ${primaryColor}\nSecondary: ${secondaryColor}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyColorBtn.textContent;
        copyColorBtn.textContent = 'COPIED!';
        copyColorBtn.style.borderColor = 'var(--accent)';
        copyColorBtn.style.color = 'var(--accent)';
        setTimeout(() => {
          copyColorBtn.textContent = originalText;
          copyColorBtn.style.borderColor = '';
          copyColorBtn.style.color = '';
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy colors: ', err);
      });
    });
  }

  // Bind Reset button
  resetBtn.addEventListener('click', function(e) {
    e.preventDefault();
    presetBtns.forEach(b => b.classList.remove('active'));
    localStorage.setItem('activePreset', 'custom');
    
    // Explicitly apply and save the original brand default colors (Primary: #e87c50, Secondary: #faf2e3)
    applyColors('#e87c50', '#faf2e3', true, e);
  });

  // Hook into themeChanged event from theme.js to re-apply correctly
  window.addEventListener('themeChanged', function() {
    const savedPrimary = localStorage.getItem('customPrimary');
    const savedSecondary = localStorage.getItem('customSecondary');
    const activePreset = localStorage.getItem('activePreset') || 'default';
    
    if (savedPrimary && savedSecondary) {
      applyColors(savedPrimary, savedSecondary, false, false);
    } else {
      // Apply correct default or preset
      const themeColors = presets[activePreset];
      if (themeColors) {
        applyColors(themeColors.primary, themeColors.secondary, false, false);
      }
    }
  });

  // --- TRAJECTORY DEBUGGER IMPLEMENTATION ---
  const toggleDebugBtn = document.getElementById('toggleDebugBtn');
  const debugArrow = document.getElementById('debugArrow');
  const debugCollapseContent = document.getElementById('debugCollapseContent');
  const debugDuration = document.getElementById('debugDuration');
  const debugBulge = document.getElementById('debugBulge');
  const debugEase = document.getElementById('debugEase');
  const valDuration = document.getElementById('valDuration');
  const valBulge = document.getElementById('valBulge');
  const debugTestBtn = document.getElementById('debugTestBtn');
  const debugCopyBtn = document.getElementById('debugCopyBtn');
  const debugPathCanvas = document.getElementById('debugPathCanvas');

  if (debugDuration && debugBulge && debugEase) {
    // Initialize global configuration variables
    window.__logoDuration = parseFloat(debugDuration.value);
    window.__logoBulge = parseInt(debugBulge.value);
    window.__logoEase = debugEase.value;
  }

  // Toggle debug panel visibility
  if (toggleDebugBtn && debugCollapseContent && debugArrow) {
    let debugCollapsed = false;
    toggleDebugBtn.addEventListener('click', () => {
      debugCollapsed = !debugCollapsed;
      debugCollapseContent.style.display = debugCollapsed ? 'none' : 'block';
      debugArrow.style.transform = debugCollapsed ? 'rotate(0deg)' : 'rotate(90deg)';
    });
  }

  // Evaluate Easing values mathematically
  function getEasedS(s) {
    const easeName = debugEase ? debugEase.value : 'power4.inOut';
    if (easeName === 'none') return s;
    if (easeName.startsWith('back.inOut')) {
      const match = easeName.match(/\(([^)]+)\)/);
      const overshoot = match ? parseFloat(match[1]) : 1.70158;
      const c1 = overshoot;
      const c2 = c1 * 1.525;
      if (s < 0.5) {
        return (Math.pow(2 * s, 2) * ((c2 + 1) * 2 * s - c2)) / 2;
      } else {
        return (Math.pow(2 * s - 2, 2) * ((c2 + 1) * (2 * s - 2) + c2) + 2) / 2;
      }
    }
    if (easeName === 'power4.inOut') {
      return s < 0.5 ? 8 * s * s * s * s : 1 - Math.pow(-2 * s + 2, 4) / 2;
    }
    if (easeName === 'power3.inOut') {
      return s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2;
    }
    if (easeName === 'power2.inOut') {
      return s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2;
    }
    if (easeName === 'expo.inOut') {
      return s === 0 ? 0 : s === 1 ? 1 : s < 0.5 ? Math.pow(2, 20 * s - 10) / 2 : (2 - Math.pow(2, -20 * s + 10)) / 2;
    }
    if (easeName === 'sine.inOut') {
      return -(Math.cos(Math.PI * s) - 1) / 2;
    }
    if (easeName === 'circ.inOut') {
      return s < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * s, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * s + 2, 2)) + 1) / 2;
    }
    return s;
  }

  // Draw background grid, straight path and trajectory arc on canvas
  function drawDebugCurve() {
    if (!debugPathCanvas) return;
    const ctx = debugPathCanvas.getContext('2d');
    const w = debugPathCanvas.width;
    const h = debugPathCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const padX = 40;
    const padY = 20;

    const startX = padX;
    const startY = padY;
    const endX = w - padX;
    const endY = h - padY;

    const bulge = debugBulge ? parseInt(debugBulge.value) : 36;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw straight line path (dashed)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw start/end nodes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath(); ctx.arc(startX, startY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(endX, endY, 4, 0, Math.PI * 2); ctx.fill();

    // Draw trajectory path
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e87c50';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const s = getEasedS(t);
      const x = startX + s * (endX - startX) + Math.sin(s * Math.PI) * (bulge * 0.8);
      const y = startY + s * (endY - startY);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw node labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '8px monospace';
    ctx.fillText('NAVBAR', startX - 25, startY + 12);
    ctx.fillText('CONSOLE', endX - 10, endY - 8);
  }

  // Live updates
  function updateDebugConfig() {
    if (!debugDuration || !debugBulge || !debugEase) return;
    const dur = parseFloat(debugDuration.value);
    const bulge = parseInt(debugBulge.value);
    const ease = debugEase.value;

    valDuration.textContent = dur.toFixed(1);
    valBulge.textContent = bulge;

    window.__logoDuration = dur;
    window.__logoBulge = bulge;
    window.__logoEase = ease;
  }

  if (debugDuration && debugBulge && debugEase) {
    debugDuration.addEventListener('input', updateDebugConfig);
    debugBulge.addEventListener('input', updateDebugConfig);
    debugEase.addEventListener('change', updateDebugConfig);
  }

  // Animation Loop for the preview dot on the canvas
  let canvasAnimId = null;
  let canvasProgress = 0;
  let lastTime = performance.now();

  function animateCanvasDot() {
    if (!debugPathCanvas) return;
    drawDebugCurve();

    const ctx = debugPathCanvas.getContext('2d');
    const w = debugPathCanvas.width;
    const h = debugPathCanvas.height;

    const padX = 40;
    const padY = 20;

    const startX = padX;
    const startY = padY;
    const endX = w - padX;
    const endY = h - padY;

    const dur = debugDuration ? parseFloat(debugDuration.value) : 2.2;
    const bulge = debugBulge ? parseInt(debugBulge.value) : 36;

    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    canvasProgress += dt / dur;
    if (canvasProgress > 1) {
      canvasProgress = 0;
    }

    const s = getEasedS(canvasProgress);
    const dotX = startX + s * (endX - startX) + Math.sin(s * Math.PI) * (bulge * 0.8);
    const dotY = startY + s * (endY - startY);

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e87c50';

    // Draw glowing dot
    ctx.shadowBlur = 12;
    ctx.shadowColor = accentColor;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    canvasAnimId = requestAnimationFrame(animateCanvasDot);
  }

  // MutationObserver to trigger canvas animation loop
  const observer = new MutationObserver(() => {
    if (consoleEl.classList.contains('active')) {
      canvasProgress = 0;
      lastTime = performance.now();
      if (canvasAnimId) cancelAnimationFrame(canvasAnimId);
      canvasAnimId = requestAnimationFrame(animateCanvasDot);
      
      // Console Stars
      updateConsoleGeometry();
      if (consoleStarsAnimId) cancelAnimationFrame(consoleStarsAnimId);
      consoleStarsAnimId = requestAnimationFrame(animateConsoleStars);
    } else {
      if (canvasAnimId) {
        cancelAnimationFrame(canvasAnimId);
        canvasAnimId = null;
      }
      
      // Console Stars
      if (consoleStarsAnimId) {
        cancelAnimationFrame(consoleStarsAnimId);
        consoleStarsAnimId = null;
      }
    }
  });
  observer.observe(consoleEl, { attributes: true, attributeFilter: ['class'] });

  // Test Path (screen flight preview)
  if (debugTestBtn) {
    debugTestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const fromLogo = staticLogo || logo;
      if (!fromLogo) return;

      const fromRect = fromLogo.getBoundingClientRect();
      const activeLogo = document.getElementById('navLogo');
      const toRect = activeLogo ? activeLogo.getBoundingClientRect() : {
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height
      };

      const existing = document.getElementById('trajectoryDebugGhost');
      if (existing) existing.remove();

      const ghost = document.createElement('div');
      ghost.id = 'trajectoryDebugGhost';
      ghost.className = 'nav-logo';
      ghost.style.position = 'fixed';
      ghost.style.zIndex = '99999';
      ghost.style.pointerEvents = 'none';
      ghost.style.fontFamily = "'Climate Crisis', sans-serif";
      ghost.style.fontSize = '1.3rem';
      ghost.style.fontWeight = '700';
      ghost.style.color = 'transparent';
      ghost.style.webkitTextStroke = '0.4px var(--fg)';
      ghost.style.left = '0px';
      ghost.style.top = '0px';
      ghost.textContent = 'YYJZ';

      gsap.set(ghost, {
        x: fromRect.left,
        y: fromRect.top,
        opacity: 0.8
      });
      document.body.appendChild(ghost);

      const dur = window.__logoDuration;
      const bulge = window.__logoBulge;
      const ease = window.__logoEase;
      const animState = { progress: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(ghost, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            onComplete: () => ghost.remove()
          });
        }
      });

      tl.to(animState, {
        progress: 1,
        duration: dur,
        ease: ease,
        onUpdate: () => {
          const s = animState.progress;
          const currentLeft = gsap.utils.interpolate(fromRect.left, toRect.left, s);
          const currentTop = gsap.utils.interpolate(fromRect.top, toRect.top, s);
          const xOffset = Math.sin(s * Math.PI) * bulge;
          gsap.set(ghost, {
            x: currentLeft,
            y: currentTop,
            xPercent: 0,
            yPercent: 0,
            transform: `translate(${xOffset}px, 0px)`
          });
        }
      }, 0);
    });
  }

  // Copy Config
  if (debugCopyBtn) {
    debugCopyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const configStr = `{ duration: ${window.__logoDuration.toFixed(1)}, maxBulge: ${window.__logoBulge}, ease: '${window.__logoEase}' }`;
      navigator.clipboard.writeText(configStr).then(() => {
        const originalText = debugCopyBtn.textContent;
        debugCopyBtn.textContent = 'Copied!';
        debugCopyBtn.style.background = 'rgba(0, 200, 100, 0.2)';
        setTimeout(() => {
          debugCopyBtn.textContent = originalText;
          debugCopyBtn.style.background = '';
        }, 1500);
      }).catch(err => {
        alert('Failed to copy config: ' + err);
      });
    });
  }

  // Initialize
  initLoad();
})();
