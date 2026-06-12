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
  let fVx = 0, fVy = 0; // Filtered velocity components for smooth steering direction
  let lastCX = 0, lastCY = 0; // Track last cX, cY for LERP-smoothed velocity
  let isHovered = false;
  let isClicked = false;
  let isGrabState = false;

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
  let currentTranslateY = -10; // Smoothly slide hotspot center between triangle tip (-10%) and circle center (-50%)

  // Hover Selector definition
  const hoverSelector = 'a, button, [role="button"]:not(.work-card), .footer-cta, .detail-close, .gal-item, .motion-slide, .nav-menu-btn, .theme-toggle, .logo-wrapper, .lightbox-nav, .lightbox-close, .nav-waveform, .nav-next-btn, .hdr-ring, .ice-container, .zoom-slider-track, .zoom-slider-knob, .back-to-top, .scroll-dot-marker, .theme-pull-wrapper, .motion-hero, .scroll-thumb, .scroll-bubble';

  // Magnetic snap variables
  let hoveredElement = null;
  let hoveredRect = null;
  let isArrowHovered = false;
  let lastIsArrowHovered = false;
  let arrowHoverStartTime = 0;

  function setHoveredElement(el) {
    if (hoveredElement === el) return;
    if (hoveredElement) {
      hoveredElement.classList.remove('magnet-hover');
      hoveredElement.classList.remove('magnet-active');
    }
    hoveredElement = el;
    if (hoveredElement) {
      hoveredElement.classList.add('magnet-hover');
      if (isClicked) {
        hoveredElement.classList.add('magnet-active');
      }
      hoveredRect = hoveredElement.getBoundingClientRect();
    } else {
      hoveredRect = null;
    }
  }

  const magnetSelector = 'a, button, [role="button"]:not(.work-card), .theme-toggle, .detail-close, .nav-menu-btn, .logo-wrapper, .lightbox-nav, .lightbox-close, .zoom-slider-knob, .back-to-top, .scroll-bubble';

  let magnetTargets = [];
  let lastUpdateTime = 0;

  // Helper to check if an element is actually visible to the user (including ancestors)
  function isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }
    
    let parent = el;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0' ||
        parseFloat(style.opacity) === 0
      ) {
        return false;
      }
      
      // Explicitly check container open states
      if (parent.id === 'menuPanel' && !parent.classList.contains('open')) {
        return false;
      }
      if (parent.id === 'workDetail' && !parent.classList.contains('open')) {
        return false;
      }
      
      parent = parent.parentElement;
    }
    return true;
  }

  function updateMagnetTargets() {
    magnetTargets = [];
    const elements = document.querySelectorAll(magnetSelector);
    elements.forEach(el => {
      if (!isElementVisible(el)) {
        return;
      }
      const rect = el.getBoundingClientRect();
      magnetTargets.push({
        element: el,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2
      });
    });
  }

  // Run initial coordinates cache
  updateMagnetTargets();

  // Expose updateMagnetTargets globally for instant updates on panel toggle
  window.__updateMagnetTargets = updateMagnetTargets;

  // Track mouse coordinates and dynamically update grab state based on hover target styles
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isFirstMove) {
      const target = e.target;
      if (target) {
        isArrowHovered = target.closest('.work-card') !== null;
        // Throttled update of magnet coordinates (runs every 250ms) to capture dynamic close buttons/lightbox arrows
        const now = Date.now();
        if (now - lastUpdateTime > 250) {
          updateMagnetTargets();
          lastUpdateTime = now;
        }

        // Find the closest magnet target, prioritizing direct hover on interactive elements
        let closestTarget = null;
        const hoveredInteractive = target.closest(hoverSelector);
        
        if (hoveredInteractive) {
          const isMagnet = hoveredInteractive.matches(magnetSelector);
          if (isMagnet) {
            closestTarget = magnetTargets.find(mt => mt.element === hoveredInteractive);
            if (!closestTarget) {
              const rect = hoveredInteractive.getBoundingClientRect();
              closestTarget = {
                element: hoveredInteractive,
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2
              };
            }
          }
        } else {
          // Check if pointer is currently inside the scrollbar container
          const isInsideScrollbar = target.closest('#scrollBar') !== null;
          
          if (!isInsideScrollbar) {
            // If in empty space (and not inside the scrollbar), find the closest magnet target based on Euclidean distance to its bounding box
            let minDistance = Infinity;
            const maxSnapDistance = 30; // Only snap if pointer is within 30px of the target's boundary
            
            for (const mt of magnetTargets) {
              // Euclidean distance to axis-aligned bounding box
              const dx = Math.max(mt.left - mouseX, 0, mouseX - mt.right);
              const dy = Math.max(mt.top - mouseY, 0, mouseY - mt.bottom);
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              // Asymmetric snapping: Weaken snapping on the right side of scrollbar bubbles
              // (facing the screen edge and scroll track) so the mouse slips off easily.
              let localMaxSnapDistance = maxSnapDistance;
              if (mt.element.classList.contains('scroll-bubble') && mouseX > mt.centerX) {
                localMaxSnapDistance = 2;
              }
              
              // Hysteresis: Give the currently hovered element a 15px distance discount 
              // so the cursor doesn't jitter back and forth between close neighbors.
              const hysteresisDiscount = (hoveredElement && mt.element === hoveredElement) ? 15 : 0;
              const effectiveDist = dist - hysteresisDiscount;
              
              if (dist < localMaxSnapDistance) {
                if (effectiveDist < minDistance) {
                  minDistance = effectiveDist;
                  closestTarget = mt;
                }
              }
            }
          }
        }

        if (closestTarget) {
          setHoveredElement(closestTarget.element);
        } else {
          setHoveredElement(null);
        }

        // Dynamic detection of grabbable elements and inline cursor styles (e.g. #framesCanvas records)
        const isGrab = target.closest('.motion-hero, .motion-slide, .scroll-thumb, .scroll-bar, .zoom-slider-knob, .zoom-slider-track, .theme-pull-wrapper, .theme-toggle') || 
                       (target.closest('#framesCanvas') && (target.style.cursor === 'grab' || target.style.cursor === 'grabbing'));
        if (isGrab) {
          if (!isGrabState) {
            isGrabState = true;
            cursorDot.classList.add('grab-state');
            cursorTrail1.classList.add('grab-state');
          }
        } else {
          if (isGrabState && !isClicked) {
            isGrabState = false;
            cursorDot.classList.remove('grab-state');
            cursorTrail1.classList.remove('grab-state');
          }
        }
      }
    }

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

  // Update bounding rect on scroll/resize
  window.addEventListener('resize', updateMagnetTargets, { passive: true });
  window.addEventListener('scroll', function() {
    updateMagnetTargets();
    if (hoveredElement) {
      hoveredRect = hoveredElement.getBoundingClientRect();
    }
  }, { passive: true });

  // Hide on mouseleave window, show on mouseenter
  document.addEventListener('mouseleave', function(e) {
    // Check if the coordinates are actually outside the viewport boundaries (threshold to prevent false triggers)
    const threshold = 2; // px
    if (
      e.clientX > threshold && 
      e.clientY > threshold && 
      e.clientX < window.innerWidth - threshold && 
      e.clientY < window.innerHeight - threshold
    ) {
      // Ignore false mouseleave events (e.g. over scrollbars or elements near window edges)
      return;
    }
     cursorDot.style.opacity = '0';
    cursorTrail1.style.opacity = '0';
    isFirstMove = true; // Reset first-move flag to snap position on next entry
    isClicked = false;  // Reset click state
    isGrabState = false; // Reset grab state
    isArrowHovered = false; // Reset arrow hover state
    setHoveredElement(null); // Clear magnet target
    cursorDot.classList.remove('grab-state');
    cursorTrail1.classList.remove('grab-state');
  });

  // Click States
  document.addEventListener('mousedown', function(e) {
    isClicked = true;
    if (hoveredElement) {
      hoveredElement.classList.add('magnet-active');
    }
    
    // Lock grab state during active dragging
    const target = e.target.closest(hoverSelector) || e.target;
    const isGrab = target.closest('.motion-hero, .motion-slide, .scroll-thumb, .scroll-bar, .zoom-slider-knob, .zoom-slider-track, .theme-pull-wrapper, .theme-toggle') || 
                   (target.closest('#framesCanvas') && (target.style.cursor === 'grab' || target.style.cursor === 'grabbing'));
    if (isGrab) {
      isGrabState = true;
      cursorDot.classList.add('grab-state');
      cursorTrail1.classList.add('grab-state');
    }
  });

  document.addEventListener('mouseup', function(e) {
    isClicked = false;
    if (hoveredElement) {
      hoveredElement.classList.remove('magnet-active');
    }
    
    // Check if we are still hovering over a grabbable element after release
    const target = e.target;
    if (target) {
      const isGrab = target.closest('.motion-hero, .motion-slide, .scroll-thumb, .scroll-bar, .zoom-slider-knob, .zoom-slider-track, .theme-pull-wrapper, .theme-toggle') || 
                     (target.closest('#framesCanvas') && (target.style.cursor === 'grab' || target.style.cursor === 'grabbing'));
      if (!isGrab) {
        isGrabState = false;
        cursorDot.classList.remove('grab-state');
        cursorTrail1.classList.remove('grab-state');
      }
    }
  });

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

  // Intercept and redirect mouse events to the snapped element
  let isRedirectingMousedown = false;
  document.addEventListener('mousedown', function(e) {
    if (isRedirectingMousedown) return;
    if (hoveredElement && !hoveredElement.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      
      isRedirectingMousedown = true;
      const newEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: e.detail,
        screenX: e.screenX,
        screenY: e.screenY,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        button: e.button,
        buttons: e.buttons,
        relatedTarget: e.relatedTarget
      });
      hoveredElement.dispatchEvent(newEvent);
      isRedirectingMousedown = false;
    }
  }, { capture: true });

  let isRedirectingMouseup = false;
  document.addEventListener('mouseup', function(e) {
    if (isRedirectingMouseup) return;
    if (hoveredElement && !hoveredElement.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      
      isRedirectingMouseup = true;
      const newEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: e.detail,
        screenX: e.screenX,
        screenY: e.screenY,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        button: e.button,
        buttons: e.buttons,
        relatedTarget: e.relatedTarget
      });
      hoveredElement.dispatchEvent(newEvent);
      isRedirectingMouseup = false;
    }
  }, { capture: true });

  let isRedirectingClick = false;
  document.addEventListener('click', function(e) {
    if (isRedirectingClick) return;
    if (hoveredElement && !hoveredElement.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      
      isRedirectingClick = true;
      hoveredElement.click();
      isRedirectingClick = false;
    }
  }, { capture: true });

  // Animation Loop
  (function loop() {
    // 1. Position follow with LERP delay (Magnetic snap + normal lag physics)
    if (hoveredElement && hoveredRect) {
      const btnCenterX = hoveredRect.left + hoveredRect.width / 2;
      const btnCenterY = hoveredRect.top + hoveredRect.height / 2;
      
      // Snaps exactly to the center of the button (100% magnetic lock)
      const targetX = btnCenterX;
      const targetY = btnCenterY;
      
      // Glides and snaps to the button center slightly slower (0.15 LERP) for responsive and soft magnetization
      cX += (targetX - cX) * 0.15;
      cY += (targetY - cY) * 0.15;
    } else {
      // Main triangle follows mouse with responsive LERP factor (0.15)
      cX += (mouseX - cX) * 0.15;
      cY += (mouseY - cY) * 0.15;
    }

    
    // Trail triangle follows main triangle with matching lag (0.11)
    t1X += (cX - t1X) * 0.11;
    t1Y += (cY - t1Y) * 0.11;

    // 2. Calculate mouse velocity (speed & direction)
    const vx = mouseX - lastMouseX;
    const vy = mouseY - lastMouseY;
    const speed = Math.sqrt(vx * vx + vy * vy);
    
    // Smooth the velocity components only for steering angle calculation to filter high-frequency noise
    fVx += (vx - fVx) * 0.25;
    fVy += (vy - fVy) * 0.25;
    const fSpeed = Math.sqrt(fVx * fVx + fVy * fVy);
    
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

    const isActuallyHovered = isHovered || (hoveredElement !== null);

    // 3. Arrow steering angle calculation (Shortest Path Lerp)
    // If mouse moves, calculate target heading direction instantly (no turning delay).
    // Otherwise, delay for 800ms before returning to upright (-90 degrees).
    if (isGrabState) {
      targetAngle = -90; // Symmetrical circle points straight up
    } else if (fSpeed > 1.6) {
      targetAngle = Math.atan2(fVy, fVx) * 180 / Math.PI;
      lastActiveAngle = targetAngle;
      lastMoveTime = Date.now();
    } else {
      if (Date.now() - lastMoveTime < 800) {
        targetAngle = lastActiveAngle;
      } else {
        // Smoothly ease targetAngle to -90 to prevent step-jump twitches
        let targetDiff = -90 - targetAngle;
        while (targetDiff < -180) targetDiff += 360;
        while (targetDiff > 180) targetDiff -= 360;
        if (Math.abs(targetDiff) < 1.0) {
          targetAngle = -90;
        } else {
          targetAngle += targetDiff * 0.08; // Gentle transition of targetAngle
        }
      }
    }

    // Shortest path interpolation (resolve wrapping at 180/-180 boundary)
    let diff = targetAngle - currentAngle;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    // Gentle steering delay when flying, dynamic low-speed dampening to prevent angular flutter
    if (isActuallyHovered) {
      cursorDot.classList.add('hovered');
      cursorTrail1.classList.add('hovered');
    } else {
      cursorDot.classList.remove('hovered');
      cursorTrail1.classList.remove('hovered');
    }

    const isReturningUpright = !isActuallyHovered && (targetAngle === -90 || Date.now() - lastMoveTime >= 800);
    let angleEase = 0.13;
    if (isReturningUpright) {
      angleEase = 0.06; // Smooth and responsive return-to-upright glide
    } else {
      if (fSpeed < 6.0) {
        const clampedSpeed = Math.max(1.6, fSpeed); // Clamp at 1.6 to prevent negative easing factors
        angleEase = 0.02 + ((clampedSpeed - 1.6) / 4.4) * 0.11; // Scales down smoothly at low speeds (0.02 to 0.13)
      }
    }
    currentAngle += diff * angleEase;

    // Our SVG points UP (which matches -90 degrees in math). 
    // To rotate it in the direction of motion, add 90 degrees offset.
    const arrowRotation = currentAngle + 90;

    // Detect transition of isArrowHovered from false to true to trigger anticipation squash
    if (isArrowHovered && !lastIsArrowHovered) {
      arrowHoverStartTime = Date.now();
    }
    lastIsArrowHovered = isArrowHovered;

    // 4. Hover & Click states scale calculation (using Creamy LERP for soft visual swell)
    let targetScale = isActuallyHovered ? 0.82 : 0.67;
    let targetZSpacing = isActuallyHovered ? 1.8 : 0.8; // Compact Z-depth spacing to keep layers merged as solid 3D sticker
    
    let isAnticipating = false;
    if (isArrowHovered) {
      const elapsed = Date.now() - arrowHoverStartTime;
      if (elapsed < 180) {
        isAnticipating = true;
        targetScale = 0.46; // Squash down before popping up
        targetZSpacing = 0.3; // Flatten layers during compression
      } else {
        targetScale = 0.96; // Pop up larger
        targetZSpacing = 1.8;
      }
    }
    
    // Symmetrical circle fills more box area, but scaled up to 0.85 by user request for a larger grab state circle
    if (isGrabState && !isClicked) {
      targetScale = 0.85;
      targetZSpacing = 1.6;
    }
    
    if (isClicked) {
      if (isGrabState) {
        targetScale = 0.48; // Circle shrinks down to a tight, tiny 3D ball on active drag/grabbing
        targetZSpacing = 0.25; // Tightly flattened 3D layers
      } else {
        targetScale = isActuallyHovered ? 0.62 : (isArrowHovered ? 0.72 : 0.52); // Press down scale compression
        targetZSpacing = isActuallyHovered ? 0.6 : (isArrowHovered ? 0.6 : 0.3);  // Compress 3D layers closer to screen
      }
    }
    
    const targetTrailScale = isHovered ? 0 : (isClicked ? (isArrowHovered ? 0.96 * 0.4 : 0.67 * 0.4) : (isArrowHovered ? (isAnticipating ? 0.46 * 0.6 : 0.96 * 0.6) : 0.67 * 0.6));
    
    // Choose dynamic LERP easing factor to make click/release feel tactile and snappy
    let scaleEase = 0.08; // Normal creamy hover LERP
    if (isClicked) {
      scaleEase = 0.20; // Fast responsive press
    } else if (isAnticipating) {
      scaleEase = 0.13; // Smooth compression shrink! (slower, gentler squish)
    } else if (currentScale < targetScale) {
      scaleEase = isArrowHovered ? 0.09 : 0.16; // Smooth, organic recovery/pop-up growth for arrow, snappy for circle
    }
    
    currentScale += (targetScale - currentScale) * scaleEase;
    currentTrailScale += (targetTrailScale - currentTrailScale) * 0.15;

    // 5. 3D Aerodynamic Physics & Velocity Warp
    // Speed-based Pitch + Hover Dive: nose-dives (tilts tail back) 22 degrees on hover to look like it's diving into the button!
    const basePitch = isReturningUpright 
      ? Math.min(Math.abs(diff) * 0.25, 12) 
      : Math.min(cursorSpeed * 1.5, 30);
    const targetPitch = isActuallyHovered ? 0 : basePitch;
    
    // Turning-based Roll: banking left/right into sharp turns (rolls dynamically during the return-to-upright straightening turn)
    const targetRoll = isActuallyHovered 
      ? 0 
      : (isReturningUpright 
          ? Math.max(-20, Math.min(20, diff * 0.6)) // Subtle and elegant roll (max 20 degrees) to prevent layer splitting
          : Math.max(-30, Math.min(30, diff * 1.5)) * Math.min(cursorSpeed / 6.0, 1.0)); // Driven by LERP-smoothed cursorSpeed
    
    // Dynamic stretch/squish: stretch length (Y) and compress width (X) (retains organic deformation during return-to-upright)
    const targetStretchX = isReturningUpright 
      ? (1 - Math.min(Math.abs(diff) * 0.0035, 0.18)) // Dynamic squish (max 18%)
      : (1 - Math.min(cursorSpeed * 0.0015, 0.06)); // Organic squish driven by cursorSpeed (naturally capped and smoothed)
    const targetStretchY = isReturningUpright 
      ? (1 + Math.min(Math.abs(diff) * 0.0055, 0.26)) // Dynamic stretch (max 26%)
      : (1 + Math.min(cursorSpeed * 0.0025, 0.10)); // Organic stretch driven by cursorSpeed (naturally capped and smoothed)

    // Smooth physics LERP (faster response rate of 0.15)
    currentPitch += (targetPitch - currentPitch) * 0.15;
    currentRoll += (targetRoll - currentRoll) * 0.15;
    currentStretchX += (targetStretchX - currentStretchX) * 0.15;
    currentStretchY += (targetStretchY - currentStretchY) * 0.15;

    // Snapping logic to completely eliminate subpixel drift/residual tilt when the mouse stops moving (locks smoothly when close to target)
    if (cursorSpeed < 0.1 && speed < 0.1) {
      if (isActuallyHovered) {
        // For circular shape, lock tilt and stretch immediately to prevent elliptical distortion,
        // but let rotation angle snap only when it has smoothly eased close to -90 (prevents chrome flow flashing)
        if (Math.abs(currentAngle - (-90)) < 1.0) currentAngle = -90;
        currentRoll = 0;
        currentPitch = 0; // Flat perfect circle!
        currentStretchX = 1;
        currentStretchY = 1;
        currentTranslateY = -50; // Instantly lock vertical center
      } else {
        if (targetAngle === -90) {
          // Narrower threshold for angle snap to prevent a visible jump
          if (Math.abs(currentAngle - (-90)) < 0.5) currentAngle = -90;
          // Let 3D roll, pitch, and velocity stretch/squish LERP naturally, snapping only when imperceptible
          if (Math.abs(currentRoll) < 0.1) currentRoll = 0;
          if (Math.abs(currentPitch) < 0.1) currentPitch = 0;
          if (Math.abs(currentStretchX - 1) < 0.005) currentStretchX = 1;
          if (Math.abs(currentStretchY - 1) < 0.005) currentStretchY = 1;
        }
      }
      if (Math.abs(currentZSpacing - targetZSpacing) < 0.05) currentZSpacing = targetZSpacing;
      if (Math.abs(currentScale - targetScale) < 0.01) currentScale = targetScale;
    }




    // LERP translateY to smoothly shift center point when morphing between triangle (top center tip) and circle (geometric center)
    const targetTranslateY = (isGrabState || isActuallyHovered) ? -50 : -10;
    currentTranslateY += (targetTranslateY - currentTranslateY) * 0.15; // Smoothly slide center point (matches coordinates LERP speed)

    // Apply translations using GPU translate3d (keeps hotspot exact and rounded to nearest pixel to prevent subpixel jitter)
    cursorDot.style.transform = `translate3d(${Math.round(cX)}px, ${Math.round(cY)}px, 0) translate(-50%, ${currentTranslateY}%)`;
    cursorTrail1.style.transform = `translate3d(${Math.round(t1X)}px, ${Math.round(t1Y)}px, 0) translate(-50%, ${currentTranslateY}%)`;

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
      const sX = isActuallyHovered ? currentScale : (currentScale * currentStretchX);
      const sY = isActuallyHovered ? currentScale : (currentScale * currentStretchY);
      cursor3dContainer.style.transform = `rotate(${arrowRotation}deg) rotateX(${currentPitch}deg) rotateY(${currentRoll}deg) scale(${sX}, ${sY})`;
    }
    if (trail3dContainer) {
      const sX = isActuallyHovered ? currentTrailScale : (currentTrailScale * currentStretchX);
      const sY = isActuallyHovered ? currentTrailScale : (currentTrailScale * currentStretchY);
      trail3dContainer.style.transform = `rotate(${arrowRotation}deg) rotateX(${currentPitch}deg) rotateY(${currentRoll}deg) scale(${sX}, ${sY})`;
    }

    // Expose coordinates and hovered element globally for particle effect alignment
    window.__customCursor = {
      x: cX,
      y: cY,
      hoveredElement: hoveredElement
    };

    requestAnimationFrame(loop);
  })();
})();
