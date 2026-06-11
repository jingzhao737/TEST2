;/* PREMIUM DYNAMIC CUSTOM CURSOR */
(function() {
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  if (!cursorDot || !cursorRing) return;

  let mouseX = 0, mouseY = 0;
  let cX = 0, cY = 0; // Dot coordinates
  let rX = 0, rY = 0; // Ring coordinates
  let lastMouseX = 0, lastMouseY = 0;
  let isHovered = false;

  // Track mouse coordinates
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  // Hide on mouseleave window, show on mouseenter
  document.addEventListener('mouseleave', function() {
    cursorDot.style.opacity = '0';
    cursorRing.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function() {
    cursorDot.style.opacity = '';
    cursorRing.style.opacity = '';
  });

  // Hover States (Event Delegation on Document for dynamic elements)
  const hoverSelector = 'a, button, .work-card, .footer-cta, .detail-close, .gal-item, .motion-slide, .nav-menu-btn, .theme-toggle, .logo-wrapper, [role="button"], .lightbox-nav, .lightbox-close';
  
  document.addEventListener('mouseover', function(e) {
    if (e.target.closest(hoverSelector)) {
      isHovered = true;
      cursorDot.classList.add('hovered');
      cursorRing.classList.add('hovered');
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (e.target.closest(hoverSelector)) {
      isHovered = false;
      cursorDot.classList.remove('hovered');
      cursorRing.classList.remove('hovered');
    }
  });

  // Animation Loop with dynamic velocity-based squash and stretch
  (function loop() {
    // 1. Smooth position interpolation (Lerp)
    cX += (mouseX - cX) * 0.25; // Snappier dot tracking
    cY += (mouseY - cY) * 0.25;
    
    rX += (mouseX - rX) * 0.12; // Responsive, liquid ring lag
    rY += (mouseY - rY) * 0.12;

    // 2. Calculate mouse velocity (speed & direction)
    const vx = mouseX - lastMouseX;
    const vy = mouseY - lastMouseY;
    const speed = Math.sqrt(vx * vx + vy * vy);
    
    // Save current mouse coordinates for next frame velocity calculation
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    // 3. Squash and Stretch Math
    // Clamp stretch to a max of 40% (0.4) to maintain layout harmony
    const stretch = Math.min(speed * 0.012, 0.4);
    
    // Find movement angle in degrees
    const angle = Math.atan2(vy, vx) * 180 / Math.PI;
    const rotateStr = speed > 1.5 ? ` rotate(${angle}deg)` : '';

    // 4. Hover states scale calculation
    const currentHoverScale = isHovered ? 2.0 : 1.0;
    
    // Apply transform matrices using GPU translate3d (avoids jitter and layout thrashing)
    cursorDot.style.transform = `translate3d(${cX}px, ${cY}px, 0) translate(-50%, -50%) ${isHovered ? 'scale(0)' : 'scale(1)'}`;
    
    // Apply stretch: scales in the direction of motion (X) and squashes in perpendicular (Y)
    const scaleX = (1 + stretch) * currentHoverScale;
    const scaleY = (1 - stretch) * currentHoverScale;
    cursorRing.style.transform = `translate3d(${rX}px, ${rY}px, 0) translate(-50%, -50%) ${rotateStr} scale(${scaleX}, ${scaleY})`;

    requestAnimationFrame(loop);
  })();
})();
