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

    // Disable CSS transitions instantly to avoid race condition/jitter
    logo.style.setProperty('transition', 'none', 'important');
    logo.classList.add('no-transition');
    consoleEl.style.transition = 'none';

    // Target element to match positioning
    const anchorEl = staticLogo || logo;

    if (isOpening) {
      const placeholder = document.getElementById('consoleTitlePlaceholder');
      if (!placeholder) return;

      // 1. Measure positions
      const startRect = anchorEl.getBoundingClientRect();
      
      gsap.set(consoleEl, { y: 0, scale: 1 });
      const toRect = placeholder.getBoundingClientRect();
      gsap.set(consoleEl, { y: -12, scale: 0.97 }); // restore start state

      // 2. Setup initial animated outline logo state
      gsap.set(logo, {
        left: startRect.left,
        top: startRect.top,
        opacity: 1
      });
      logo.classList.add('console-active');

      consoleEl.classList.add('active');
      _animating = true;

      const maxBulge = window.innerWidth > 768 ? 36 : 28;
      const animState = { progress: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          logo.style.removeProperty('transition');
          logo.classList.remove('no-transition');
          consoleEl.style.transition = '';
          // Clear only temporary x/transform styles after landing
          gsap.set(logo, { clearProps: 'x,transform' });
          _animating = false;
        }
      });

      // Unified parametric tween: interpolates left/top/x based on eased virtual progress
      tl.to(animState, {
        progress: 1,
        duration: 2.2,
        ease: 'power4.inOut',
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
      const startRect = logo.getBoundingClientRect();
      const toRect = anchorEl.getBoundingClientRect();
      _animating = true;
      const maxBulge = window.innerWidth > 768 ? 36 : 28;
      const animState = { progress: 0 };

      // Ensure logo opacity is set to 1 before starting closing animation
      gsap.set(logo, { opacity: 1 });

      const tl = gsap.timeline({
        onComplete: () => {
          // Clear GSAP inline styles while transitions are still disabled to prevent snapping transitions
          gsap.set(logo, { clearProps: 'all' });
          gsap.set(consoleEl, { clearProps: 'all' });
          
          logo.style.removeProperty('transition');
          logo.classList.remove('no-transition');
          logo.classList.remove('console-active');
          consoleEl.style.transition = '';
          consoleEl.classList.remove('active');
          _animating = false;
        }
      });

      // Parametric return tween: keeps path geometric shape perfect
      tl.to(animState, {
        progress: 1,
        duration: 2.2,
        ease: 'power4.inOut',
        onUpdate: function() {
          const s = animState.progress;
          const currentLeft = gsap.utils.interpolate(startRect.left, toRect.left, s); // startRect is anchorEl rect (navbar)
          const currentTop = gsap.utils.interpolate(startRect.top, toRect.top, s);
          const xOffset = Math.sin(s * Math.PI) * maxBulge;
          gsap.set(logo, {
            left: currentLeft,
            top: currentTop,
            x: xOffset,
            opacity: 1
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

  // Initialize
  initLoad();
})();
