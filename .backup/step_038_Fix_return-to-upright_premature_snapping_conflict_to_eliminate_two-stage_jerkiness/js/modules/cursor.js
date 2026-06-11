;/* PREMIUM DYNAMIC CUSTOM CURSOR — STEERING AIRPLANE WITH DELAYED ACCENT ECHO & 3D WARPING */
(function() {
  const cursorDot = document.getElementById('cursorDot');
  const cursorTrail1 = document.getElementById('cursorTrail1');
  if (!cursorDot || !cursorTrail1) return;

  const cursor3dContainer = cursorDot.querySelector('.cursor-3d-container');
  const trail3dContainer = cursorTrail1.querySelector('.cursor-3d-container');
  const cursorLayers = cursorDot.querySelectorAll('.cursor-3d-layer');

  let mouseX = 0, mouseY = 0;
  let isFirstMove = true; // Snap initial mouse position to prevent warped flying/stretching on entry
  let cX = 0, cY = 0; // Main dot/triangle position
  let currentZSpacing = 1.0; // Dynamic Z-depth spacing between layers (1px default, expands on hover)
  let t1X = 0, t1Y = 0; // Trail 1 position
  
  let lastMouseX = 0, lastMouseY = 0;
  let lastCX = 0, lastCY = 0; // Track last cX, cY for LERP-smoothed velocity
  let isHovered = false;

  // Steering Physics: angle in degrees (-90 = pointing straight up)
  let currentAngle = -90;
  let targetAngle = -90;
  let lastActiveAngle = -90;
  let lastMoveTime = 0;

  // Scale Physics (Creamy LERP to swell smoothly like a soft 3D sticker)
  let currentScale = 0.67;
  let currentTrailScale = 0.67 * 0.6;

  // 3D & Deformation Physics
  let currentPitch = 0;
  let currentRoll = 0;
  let currentStretchX = 1;
  let currentStretchY = 1;

  // Track mouse coordinates
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (isFirstMove) {
      cX = mouseX;
      cY = mouseY;
      t1X = mouseX;
      t1Y = mouseY;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      lastCX = cX;
      lastCY = cY;
      isFirstMove = false;
      
      // Make visible ONLY after first snap to prevent coordinate jump
      cursorDot.style.opacity = '1';
      cursorTrail1.style.opacity = '0.65';
    }
  }, { passive: true });

  // Hide on mouseleave window, show on mouseenter
  document.addEventListener('mouseleave', function() {
    cursorDot.style.opacity = '0';
    cursorTrail1.style.opacity = '0';
    isFirstMove = true; // Reset first-move flag to snap position on next entry
  });

  // Hover States (Event Delegation on Document for dynamic elements)
  const hoverSelector = 'a, button, [role="button"], .work-card, .footer-cta, .detail-close, .gal-item, .motion-slide, .nav-menu-btn, .theme-toggle, .logo-wrapper, .lightbox-nav, .lightbox-close, .nav-waveform, .nav-next-btn, .hdr-ring, .ice-container, .zoom-slider-track, .zoom-slider-knob, .back-to-top, .scroll-dot-marker, .theme-pull-wrapper, .motion-hero, .scroll-thumb, .scroll-bubble';
  
  document.addEventListener('mouseover', function(e) {
    const target = e.target.closest(hoverSelector);
    if (target) {
      // Only trigger if entering from outside the target element itself
      if (!e.relatedTarget || !target.contains(e.relatedTarget)) {
        isHovered = true;
        cursorDot.classList.add('hovered');
      }
    }
  });

  document.addEventListener('mouseout', function(e) {
    const target = e.target.closest(hoverSelector);
    if (target) {
      // Only trigger if leaving to outside the target element itself
      if (!e.relatedTarget || !target.contains(e.relatedTarget)) {
        const related = e.relatedTarget ? e.relatedTarget.closest(hoverSelector) : null;
        if (!related) {
          isHovered = false;
          cursorDot.classList.remove('hovered');
        }
      }
    }
  });

  // Animation Loop
  (function loop() {
    // 1. Position follow with LERP delay
    // Main triangle follows mouse with significant delay (0.12)
    cX += (mouseX - cX) * 0.12;
    cY += (mouseY - cY) * 0.12;
    
    // Trail triangle follows main triangle with additional lag (0.08)
    t1X += (cX - t1X) * 0.08;
    t1Y += (cY - t1Y) * 0.08;

    // 2. Calculate mouse velocity (speed & direction)
    const vx = mouseX - lastMouseX;
    const vy = mouseY - lastMouseY;
    const speed = Math.sqrt(vx * vx + vy * vy);
    
    // Save current mouse coordinates for next frame velocity calculation
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    // Calculate cursor velocity (movement speed of the actual custom cursor on the screen)
    const cvx = cX - lastCX;
    const cvy = cY - lastCY;
    const cursorSpeed = Math.sqrt(cvx * cvx + cvy * cvy);
    
    // Save current cursor coordinates for next frame velocity calculation
    lastCX = cX;
    lastCY = cY;

    // 3. Arrow steering angle calculation (Shortest Path Lerp)
    // If mouse moves, calculate target heading direction instantly (no turning delay).
    // Otherwise, delay for 600ms before returning to upright (-90 degrees).
    if (speed > 1.5) {
      targetAngle = Math.atan2(vy, vx) * 180 / Math.PI;
      lastActiveAngle = targetAngle;
      lastMoveTime = Date.now();
    } else {
      if (Date.now() - lastMoveTime < 600) {
        targetAngle = lastActiveAngle;
      } else {
        // Smoothly ease targetAngle to -90 to prevent step-jump twitches
        let targetDiff = -90 - targetAngle;
        while (targetDiff < -180) targetDiff += 360;
        while (targetDiff > 180) targetDiff -= 360;
        if (Math.abs(targetDiff) < 1.0) {
          targetAngle = -90;
        } else {
          targetAngle += targetDiff * 0.15;
        }
      }
    }



    // Shortest path interpolation (resolve wrapping at 180/-180 boundary)
    let diff = targetAngle - currentAngle;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    // Gentle steering delay when flying, dynamic low-speed dampening to prevent angular flutter
    const isReturningUpright = (targetAngle === -90);
    let angleEase = 0.13;
    if (isReturningUpright) {
      angleEase = cursorSpeed < 0.5 ? 0.08 : 0.035; // Return upright faster if stationary to prevent static lean lag
    } else {
      if (speed < 6.0) {
        const clampedSpeed = Math.max(1.5, speed); // Clamp at 1.5 to prevent negative easing factors
        angleEase = 0.02 + ((clampedSpeed - 1.5) / 4.5) * 0.11; // Scales down smoothly at low speeds (0.02 to 0.13)
      }
    }
    currentAngle += diff * angleEase;

    // Our SVG points UP (which matches -90 degrees in math). 
    // To rotate it in the direction of motion, add 90 degrees offset.
    const arrowRotation = currentAngle + 90;

    // 4. Hover states scale calculation (using Creamy LERP for soft visual swell)
    const targetScale = isHovered ? 0.82 : 0.67; // Swell smoothly like a soft 3D sticker

    const targetTrailScale = isHovered ? 0 : 0.67 * 0.6;
    const targetZSpacing = isHovered ? 3.0 : 1.0; // Dynamic Z-depth spacing for 3D sticker thickness
    
    currentScale += (targetScale - currentScale) * 0.08; // Viscous, creamy LERP transition
    currentTrailScale += (targetTrailScale - currentTrailScale) * 0.15;

    // 5. 3D Aerodynamic Physics & Velocity Warp
    // Speed-based Pitch + Hover Dive: nose-dives (tilts tail back) 22 degrees on hover to look like it's diving into the button!
    const basePitch = isReturningUpright 
      ? Math.min(Math.abs(diff) * 0.35, 18) 
      : Math.min(cursorSpeed * 1.5, 30);
    const targetPitch = basePitch + (isHovered ? 22 : 0);
    
    // Turning-based Roll: banking left/right into sharp turns (rolls dynamically during the return-to-upright straightening turn)
    const targetRoll = isReturningUpright 
      ? Math.max(-30, Math.min(30, diff * 0.8)) // Driven smoothly by LERPing targetAngle
      : Math.max(-30, Math.min(30, diff * 1.5)) * Math.min(cursorSpeed / 6.0, 1.0); // Driven by LERP-smoothed cursorSpeed
    
    // Dynamic stretch/squish: stretch length (Y) and compress width (X) (retains organic deformation during return-to-upright)
    const targetStretchX = isReturningUpright 
      ? (1 - Math.min(Math.abs(diff) * 0.0025, 0.12)) // Driven smoothly by LERPing targetAngle
      : (1 - Math.min(cursorSpeed * 0.0015, 0.06)); // Organic squish driven by cursorSpeed (naturally capped and smoothed)
    const targetStretchY = isReturningUpright 
      ? (1 + Math.min(Math.abs(diff) * 0.004, 0.18)) // Driven smoothly by LERPing targetAngle
      : (1 + Math.min(cursorSpeed * 0.0025, 0.10)); // Organic stretch driven by cursorSpeed (naturally capped and smoothed)


    // Smooth physics LERP (faster response rate of 0.15)
    currentPitch += (targetPitch - currentPitch) * 0.15;
    currentRoll += (targetRoll - currentRoll) * 0.15;
    currentStretchX += (targetStretchX - currentStretchX) * 0.15;
    currentStretchY += (targetStretchY - currentStretchY) * 0.15;

    // Snapping logic to completely eliminate subpixel drift/residual tilt when the mouse stops moving (widened thresholds for immediate lock-in)
    if (cursorSpeed < 0.1 && speed < 0.1) {
      if (targetAngle === -90) {
        if (Math.abs(currentAngle - (-90)) < 4.0) currentAngle = -90;
        if (Math.abs(currentRoll) < 1.0) currentRoll = 0;
        if (Math.abs(currentPitch - (isHovered ? 22 : 0)) < 1.0) currentPitch = isHovered ? 22 : 0;
      }
      if (Math.abs(currentZSpacing - targetZSpacing) < 0.05) currentZSpacing = targetZSpacing;
      if (Math.abs(currentScale - targetScale) < 0.01) currentScale = targetScale;
    }


    // Apply translations using GPU translate3d (keeps hotspot exact and rounded to nearest pixel to prevent subpixel jitter)
    cursorDot.style.transform = `translate3d(${Math.round(cX)}px, ${Math.round(cY)}px, 0) translate(-50%, -10%)`;
    cursorTrail1.style.transform = `translate3d(${Math.round(t1X)}px, ${Math.round(t1Y)}px, 0) translate(-50%, -10%)`;

    // Dynamic Z-depth expansion LERP (spacing goes from 1px to 3.0px on hover, expanding 3D crystal thickness)
    currentZSpacing += (targetZSpacing - currentZSpacing) * 0.08; // Match the creamy scale LERP speed

    // Apply Z-translates on the 5 stacked 3D layers to create solid 3D extrusion thickness (no fanning/twist)
    if (cursorLayers) {
      cursorLayers.forEach((layer, idx) => {
        // idx goes from 0 (layer-back) to 4 (layer-front)
        // Layer Z offset = -(4 - idx) * currentZSpacing
        const zVal = -(4 - idx) * currentZSpacing;
        layer.style.transform = `translateZ(${zVal}px)`;
      });
    }

    // Apply 3D tilt, rotation, and dynamic scale warping on the child 3D containers (no spinRoll)
    if (cursor3dContainer) {
      cursor3dContainer.style.transform = `rotate(${arrowRotation}deg) rotateX(${currentPitch}deg) rotateY(${currentRoll}deg) scale(${currentScale * currentStretchX}, ${currentScale * currentStretchY})`;
    }
    if (trail3dContainer) {
      trail3dContainer.style.transform = `rotate(${arrowRotation}deg) rotateX(${currentPitch}deg) rotateY(${currentRoll}deg) scale(${currentTrailScale * currentStretchX}, ${currentTrailScale * currentStretchY})`;
    }

    requestAnimationFrame(loop);
  })();
})();
