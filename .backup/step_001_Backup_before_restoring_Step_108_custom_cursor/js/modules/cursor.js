;/* PREMIUM DYNAMIC CUSTOM CURSOR — STEERING AIRPLANE */
(function() {
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  if (!cursorDot || !cursorRing) return;

  let mouseX = 0, mouseY = 0;
  let cX = 0, cY = 0; // Dot coordinates
  let rX = 0, rY = 0; // Ring coordinates
  
  let lastMouseX = 0, lastMouseY = 0;
  let isHovered = false;

  // Steering Physics: angle in degrees (-90 = pointing straight up)
  let currentAngle = -90;
  let targetAngle = -90;

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

    // 3. Arrow steering angle calculation (Shortest Path Lerp)
    // If mouse moves faster than 1.5 pixels per frame, calculate target heading direction.
    // Otherwise (stopped/static), target is -90 degrees (straight up).
    if (speed > 1.5) {
      targetAngle = Math.atan2(vy, vx) * 180 / Math.PI;
    } else {
      targetAngle = -90; // Align upright when stationary
    }

    // Shortest path interpolation (resolve wrapping at 180/-180 boundary)
    let diff = targetAngle - currentAngle;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    // Snappy steering response when flying, graceful deceleration when returning upright
    const angleEase = speed > 1.5 ? 0.22 : 0.07;
    currentAngle += diff * angleEase;

    // Our SVG points UP (which matches -90 degrees in math). 
    // To rotate it in the direction of motion, add 90 degrees offset.
    const arrowRotation = currentAngle + 90;

    // 4. Squash and Stretch Math (for Ring)
    // Clamp stretch to a max of 40% (0.4) to maintain layout harmony
    const stretch = Math.min(speed * 0.012, 0.4);

    // 5. Hover states scale calculation
    const currentHoverScale = isHovered ? 2.0 : 1.0;
    
    // Apply transforms using GPU translate3d (avoids jitter and layout thrashing)
    // Rotate the arrow SVG in the direction of motion
    cursorDot.style.transform = `translate3d(${cX}px, ${cY}px, 0) translate(-50%, -50%) rotate(${arrowRotation}deg) ${isHovered ? 'scale(0)' : 'scale(1)'}`;
    
    // Apply stretch to Ring: scales in the direction of motion (X) and squashes in perpendicular (Y)
    const scaleX = (1 + stretch) * currentHoverScale;
    const scaleY = (1 - stretch) * currentHoverScale;
    
    // Use movement angle or currentAngle to rotate the ring shape along speed vector
    const ringAngle = speed > 1.5 ? (Math.atan2(vy, vx) * 180 / Math.PI) : currentAngle;
    cursorRing.style.transform = `translate3d(${rX}px, ${rY}px, 0) translate(-50%, -50%) rotate(${ringAngle + 90}deg) scale(${scaleX}, ${scaleY})`;

    requestAnimationFrame(loop);
  })();
})();
