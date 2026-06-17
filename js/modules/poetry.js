import gsap from 'gsap';

(function() {
  const content = document.getElementById('poetryContent');
  const section = document.getElementById('poetry');
  if (!content || !section) return;

  const lines = Array.from(content.querySelectorAll('.poetry-line'));
  if (!lines.length) return;

  const minimapBars = Array.from(section.querySelectorAll('.minimap-bar'));

  // Stagger reveal lines when entering viewport
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const stanzas = content.querySelectorAll('.poetry-stanza');
      stanzas.forEach((stanza, sIdx) => {
        const stanzaLines = stanza.querySelectorAll('.poetry-line');
        stanzaLines.forEach((line, lIdx) => {
          gsap.fromTo(line, 
            { opacity: 0, y: 16 }, 
            { 
              opacity: 0.15, // base dark state
              y: 0, 
              duration: 1.0, 
              ease: "power3.out",
              delay: sIdx * 0.2 + lIdx * 0.08,
              onComplete: () => {
                // Clear inline styles from initial reveal so our dynamic hover/scroll systems work cleanly
                line.style.transform = '';
              }
            }
          );
        });
      });
      obs.disconnect();
    }
  }, { threshold: 0.15 });
  obs.observe(section);

  // ✦ Proximity-based reactive lighting and magnetic shift ✦
  const state = lines.map(() => ({ activeFactor: 0, tx: 0 }));
  const targetFactor = lines.map(() => 0);
  const targetTX = lines.map(() => 0);

  const LERP_SPEED_ACTIVE = 0.12;
  const LERP_SPEED_RESET = 0.06;
  const THRESHOLD_Y = 90; // Proximity threshold in pixels
  let running = false;
  let mouseActive = false;
  let lastMouseY = 0;

  function updateSpotlight(clientY, isCenterSpotlight = false) {
    let effectiveY = clientY;

    if (isCenterSpotlight && lines.length > 0) {
      let minDist = Infinity;
      let bestY = clientY;
      lines.forEach((line) => {
        const rect = line.getBoundingClientRect();
        const lineCenterY = rect.top + rect.height / 2;
        const dy = Math.abs(clientY - lineCenterY);
        if (dy < minDist) {
          minDist = dy;
          bestY = lineCenterY;
        }
      });
      // Magnetically snap the virtual focal point to the nearest line
      effectiveY = bestY;
    }

    lines.forEach((line, i) => {
      const rect = line.getBoundingClientRect();
      const lineCenterY = rect.top + rect.height / 2;
      const dy = Math.abs(effectiveY - lineCenterY);

      if (dy < THRESHOLD_Y) {
        const t = 1 - dy / THRESHOLD_Y;
        let factor = t * t;

        if (isCenterSpotlight) {
          // Global envelope so lines still fade out as they leave the screen center
          const globalDy = Math.abs(clientY - lineCenterY);
          const globalT = Math.max(0, 1 - globalDy / 300);
          factor = factor * globalT;
        }

        targetFactor[i] = factor;
        // Limit horizontal shift on mobile/tablet to prevent text clipping or wrapping
        const maxShift = window.innerWidth < 768 ? 0 : 20;
        targetTX[i] = factor * maxShift;
      } else {
        targetFactor[i] = 0;
        targetTX[i] = 0;
      }
    });

    if (!running) {
      running = true;
      smoothLoop();
    }
  }

  function triggerViewportCenterSpotlight() {
    const secRect = section.getBoundingClientRect();
    const inViewport = (
      secRect.bottom >= 0 &&
      secRect.top <= window.innerHeight
    );
    if (inViewport) {
      updateSpotlight(window.innerHeight / 2, true);
    } else {
      resetTargets();
    }
  }

  function resetTargets() {
    for (let i = 0; i < lines.length; i++) {
      targetFactor[i] = 0;
      targetTX[i] = 0;
    }
    if (!running) {
      running = true;
      smoothLoop();
    }
  }

  // 1. Mousemove handler (desktop spotlight)
  window.addEventListener('mousemove', (e) => {
    const rect = content.getBoundingClientRect();
    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      mouseActive = true;
      lastMouseY = e.clientY;
      updateSpotlight(e.clientY, false);
    } else {
      if (mouseActive) {
        mouseActive = false;
        triggerViewportCenterSpotlight();
      }
    }
  });

  // 2. Mouseleave handler
  section.addEventListener('mouseleave', () => {
    mouseActive = false;
    triggerViewportCenterSpotlight();
  });

  // 3. Scroll handler (for both desktop and mobile scroll interaction)
  window.addEventListener('scroll', () => {
    const secRect = section.getBoundingClientRect();
    const inViewport = (
      secRect.bottom >= 0 &&
      secRect.top <= window.innerHeight
    );

    if (inViewport) {
      if (mouseActive) {
        // If mouse is hovering, evaluate based on last known cursor vertical position
        updateSpotlight(lastMouseY, false);
      } else {
        // Otherwise, spotlight falls back to the center of the viewport
        updateSpotlight(window.innerHeight / 2, true);
      }
    } else {
      resetTargets();
    }
  });

  // Initial center-spotlight check on page load / delay
  setTimeout(triggerViewportCenterSpotlight, 600);

  // Re-evaluate center-spotlight on resize/orientation change
  window.addEventListener('resize', triggerViewportCenterSpotlight);

  function smoothLoop() {
    let anyActive = false;
    const isLightMode = document.documentElement.classList.contains('light');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const s = state[i];
      const targetF = targetFactor[i];
      const targetX = targetTX[i];

      // Lerp state towards targets
      const spd = targetF > 0.01 ? LERP_SPEED_ACTIVE : LERP_SPEED_RESET;
      s.activeFactor += (targetF - s.activeFactor) * spd;
      s.tx += (targetX - s.tx) * LERP_SPEED_ACTIVE;

      if (s.activeFactor < 0.001 && targetF === 0) {
        s.activeFactor = 0;
        s.tx = 0;
      }

      // Sync minimap bar active state
      if (minimapBars[i]) {
        if (s.activeFactor > 0.15) {
          minimapBars[i].classList.add('active');
          minimapBars[i].style.transform = `scaleX(${(1 + s.activeFactor * 0.25).toFixed(3)})`;
        } else {
          minimapBars[i].classList.remove('active');
          minimapBars[i].style.transform = '';
        }
      }

      if (s.activeFactor === 0) {
        // Reset styles completely to rely on default stylesheet values
        line.style.opacity = '';
        line.style.color = '';
        line.style.textShadow = '';
        line.style.transform = '';
        continue;
      }

      anyActive = true;
      const f = s.activeFactor;

      // Calculate styles based on proximity factor
      // Base opacity: 0.15 (dark) or 0.18 (light). Max: 1.0 (illuminated)
      const baseOpacity = isLightMode ? 0.18 : 0.15;
      line.style.opacity = baseOpacity + f * (1.0 - baseOpacity);

      // Color transition: shift from base text color towards pure white (dark mode) or accent color (light mode)
      if (isLightMode) {
        // Light mode: shift to dark accent
        line.style.color = f > 0.6 ? 'var(--accent)' : '';
      } else {
        // Dark mode: shift from dim grey to bright white and accent when very close
        if (f > 0.8) {
          line.style.color = 'var(--accent)';
        } else if (f > 0.3) {
          line.style.color = '#ffffff';
        } else {
          line.style.color = '';
        }
      }

      // Emissive shadow glow (soft neon blur)
      if (f > 0.1) {
        const accentRgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '232, 124, 80';
        const glowColor = isLightMode ? 'rgba(155, 142, 126, ' + (f * 0.25).toFixed(2) + ')' : 'rgba(' + accentRgb + ', ' + (f * 0.45).toFixed(2) + ')';
        line.style.textShadow = '0 0 ' + (f * 16).toFixed(1) + 'px ' + glowColor;
      } else {
        line.style.textShadow = '';
      }

      // Magnetic Wave transform (Slide X, Scale up, Skew deformation)
      const scale = 1.0 + f * 0.025;
      const skew = -f * 1.5;
      line.style.transform = `translateX(${s.tx.toFixed(2)}px) scale(${scale.toFixed(3)}) skewX(${skew.toFixed(2)}deg)`;
    }

    if (anyActive) {
      requestAnimationFrame(smoothLoop);
    } else {
      running = false;
    }
  }
})();
