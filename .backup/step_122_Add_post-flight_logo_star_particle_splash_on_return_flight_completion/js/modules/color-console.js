import gsap from 'gsap';

/* YYJZ COLOR PALETTE CONSOLE */
(function initColorConsole() {
  const logo = document.getElementById('navLogo');
  const staticLogo = document.getElementById('navLogoStatic');
  const consoleEl = document.getElementById('colorConsole');
  const closeBtn = document.getElementById('consoleCloseBtn');
  const resetBtn = document.getElementById('consoleResetBtn');
  const primaryPicker = document.getElementById('primaryPicker');
  const secondaryPicker = document.getElementById('secondaryPicker');
  const primaryBadge = document.getElementById('primaryBadge');
  const secondaryBadge = document.getElementById('secondaryBadge');
  const presetBtns = document.querySelectorAll('.preset-btn');

  if (!logo || !consoleEl) return;

  let _animating = false;

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
      gsap.set(consoleEl, { y: -12, scale: 0.97, opacity: 0 }); 
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
          
          _animating = false;

          // Trigger logo landing star splash after 0.2 seconds
          setTimeout(() => {
            if (typeof window.triggerLogoStarSplash === 'function') {
              const rect = logo.getBoundingClientRect();
              const clientX = rect.left + rect.width / 2;
              const clientY = rect.top + rect.height / 2;
              const x = clientX / window.innerWidth;
              const y = 1.0 - (clientY / window.innerHeight);
              window.triggerLogoStarSplash(x, y);
            }
          }, 200);
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
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power3.out'
      }, 0);

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
      const duration = window.__logoDuration !== undefined ? window.__logoDuration : 2.7;
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
          
          logo.style.removeProperty('transition');
          logo.classList.remove('no-transition');
          logo.classList.remove('console-active');
          consoleEl.style.transition = '';
          consoleEl.classList.remove('active');
          _animating = false;

          // Trigger logo landing star splash on return flight after 0.2 seconds
          setTimeout(() => {
            if (typeof window.triggerLogoStarSplash === 'function') {
              const targetEl = staticLogo || logo;
              const rect = targetEl.getBoundingClientRect();
              const clientX = rect.left + rect.width / 2;
              const clientY = rect.top + rect.height / 2;
              const x = clientX / window.innerWidth;
              const y = 1.0 - (clientY / window.innerHeight);
              window.triggerLogoStarSplash(x, y);
            }
          }, 200);
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
        y: -12,
        scale: 0.97,
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
    default: { primary: '#e87c50', secondary: '#faf2e3' },
    cyberpunk: { primary: '#ff007f', secondary: '#00f3ff' },
    forest: { primary: '#2d6a4f', secondary: '#d8f3dc' },
    ocean: { primary: '#0077b6', secondary: '#e0f2fe' },
    royal: { primary: '#7b2cbf', secondary: '#f3e5f5' }
  };

  // Apply colors to document and save to state
  function applyColors(primary, secondary, save = true) {
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

    if (save) {
      localStorage.setItem('customPrimary', primary);
      localStorage.setItem('customSecondary', secondary);
    }
  }

  // Load custom colors from storage on init
  function initLoad() {
    const savedPrimary = localStorage.getItem('customPrimary');
    const savedSecondary = localStorage.getItem('customSecondary');
    const savedPreset = localStorage.getItem('activePreset') || 'default';

    if (savedPrimary && savedSecondary) {
      applyColors(savedPrimary, savedSecondary, false);
      // Highlight correct preset button
      presetBtns.forEach(btn => {
        if (btn.dataset.preset === savedPreset) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    } else {
      // Revert to default or active preset
      const themeColors = presets[savedPreset];
      if (themeColors) {
        let sec = themeColors.secondary;
        if (savedPreset === 'default') {
          const isLight = document.documentElement.classList.contains('light');
          sec = isLight ? '#f5f0e8' : '#faf2e3';
        }
        applyColors(themeColors.primary, sec, false);
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
        applyColors(themeColors.primary, themeColors.secondary);
      }
    });
  });

  // Bind Custom color pickers
  primaryPicker.addEventListener('input', function(e) {
    // Remove active state from presets when custom values are selected
    presetBtns.forEach(b => b.classList.remove('active'));
    localStorage.removeItem('activePreset');
    applyColors(primaryPicker.value, secondaryPicker.value);
  });

  secondaryPicker.addEventListener('input', function(e) {
    presetBtns.forEach(b => b.classList.remove('active'));
    localStorage.removeItem('activePreset');
    applyColors(primaryPicker.value, secondaryPicker.value);
  });

  // Bind Reset button
  resetBtn.addEventListener('click', function(e) {
    e.preventDefault();
    presetBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-preset="default"]').classList.add('active');
    localStorage.setItem('activePreset', 'default');
    localStorage.removeItem('customPrimary');
    localStorage.removeItem('customSecondary');
    
    // Clear all inline overrides to restore CSS defaults
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-rgb');
    document.documentElement.style.removeProperty('--accent-glow');
    document.documentElement.style.removeProperty('--accent-soft');
    document.documentElement.style.removeProperty('--accent-hover');
    document.documentElement.style.removeProperty('--fg');
    document.documentElement.style.removeProperty('--fg-rgb');
    document.documentElement.style.removeProperty('--bg');
    document.documentElement.style.removeProperty('--crescent-color');
    
    // Reset canvas variables
    window.__accentRGB = undefined;
    window.__accentShadowRGB = undefined;

    // Trigger re-load
    initLoad();
  });

  // Hook into themeChanged event from theme.js to re-apply correctly
  window.addEventListener('themeChanged', function() {
    const savedPrimary = localStorage.getItem('customPrimary');
    const savedSecondary = localStorage.getItem('customSecondary');
    const activePreset = localStorage.getItem('activePreset') || 'default';
    
    if (savedPrimary && savedSecondary) {
      applyColors(savedPrimary, savedSecondary, false);
    } else {
      // Apply correct default or preset
      const themeColors = presets[activePreset];
      if (themeColors) {
        let sec = themeColors.secondary;
        if (activePreset === 'default') {
          const isLight = document.documentElement.classList.contains('light');
          sec = isLight ? '#f5f0e8' : '#faf2e3';
        }
        applyColors(themeColors.primary, sec, false);
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
    } else {
      if (canvasAnimId) {
        cancelAnimationFrame(canvasAnimId);
        canvasAnimId = null;
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
