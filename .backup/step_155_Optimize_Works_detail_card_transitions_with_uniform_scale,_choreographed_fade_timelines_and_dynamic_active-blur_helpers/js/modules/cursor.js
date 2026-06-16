;/* PREMIUM DYNAMIC CUSTOM CURSOR — STEERING AIRPLANE WITH DELAYED ACCENT ECHO & 3D WARPING */
(function() {
  const cursorDot = document.getElementById('cursorDot');
  const cursorTrail1 = document.getElementById('cursorTrail1');
  if (!cursorDot || !cursorTrail1) return;

  const cursor3dContainer = cursorDot.querySelector('.cursor-3d-container');
  const trail3dContainer = cursorTrail1.querySelector('.cursor-3d-container');
  const cursorLayers = cursorDot.querySelectorAll('.cursor-3d-layer');

  // Force hide initially to override any browser-cached inline styles from previous sessions
  cursorDot.style.opacity = '0';
  cursorTrail1.style.opacity = '0';

  const initialX = window.innerWidth / 2;
  const initialY = window.innerHeight / 2;

  let mouseX = initialX, mouseY = initialY;
  let isFirstMove = true; // Snap initial mouse position to prevent warped flying/stretching on entry
  let cX = initialX, cY = initialY; // Main dot/triangle position
  let currentZSpacing = 1.0; // Dynamic Z-depth spacing between layers (1px default, expands on hover)
  let t1X = initialX, t1Y = initialY; // Trail 1 position
  
  let lastMouseX = initialX, lastMouseY = initialY;
  let fVx = 0, fVy = 0; // Filtered velocity components for smooth steering direction
  let lastCX = initialX, lastCY = initialY; // Track last cX, cY for LERP-smoothed velocity
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
  let snapOffsetX = 0;
  let snapOffsetY = 0;
  let snapStartTime = 0;
  let snapPullX = 0;
  let snapPullY = 0;
  let snapPullDist = 0;

  function setHoveredElement(el) {
    if (hoveredElement === el) return;
    if (hoveredElement) {
      hoveredElement.classList.remove('magnet-hover');
      hoveredElement.classList.remove('magnet-active');
      
      // Capture the visual offset relative to the physical mouse when releasing snap
      snapOffsetX = cX - mouseX;
      snapOffsetY = cY - mouseY;
    }
    hoveredElement = el;
    window.__hoveredElement = el; // Expose globally for diagnostics
    if (hoveredElement) {
      hoveredElement.classList.add('magnet-hover');
      if (isClicked) {
        hoveredElement.classList.add('magnet-active');
      }
      hoveredRect = hoveredElement.getBoundingClientRect();
      snapStartTime = Date.now(); // Record start time of snap
    } else {
      hoveredRect = null;
      snapStartTime = 0;
      snapPullX = 0;
      snapPullY = 0;
      snapPullDist = 0;
    }
  }

  const magnetSelector = 'a, button, [role="button"]:not(.work-card), .theme-toggle, .detail-close, .nav-menu-btn, .logo-wrapper, .lightbox-nav, .lightbox-close, .zoom-slider-knob, .back-to-top, .scroll-bubble';

  let magnetTargets = [];
  let lastUpdateTime = 0;

  // Helper to check if an element is actually visible to the user (including ancestors)
  function isElementVisible(el) {
    // 1. Overlay Snapping Hierarchy: if an overlay is open, only allow snapping inside it
    const lightbox = document.getElementById('galleryLightbox');
    if (lightbox && lightbox.classList.contains('open')) {
      if (!lightbox.contains(el)) return false;
    } else {
      const menuPanel = document.getElementById('menuPanel');
      if (menuPanel && menuPanel.classList.contains('open')) {
        if (!menuPanel.contains(el) && !el.classList.contains('nav-menu-btn')) return false;
      } else {
        const workDetail = document.getElementById('workDetail');
        if (workDetail && workDetail.classList.contains('open')) {
          if (!workDetail.contains(el)) return false;
        }
      }
    }

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
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const elements = document.querySelectorAll(magnetSelector);
    elements.forEach(el => {
      if (!isElementVisible(el) || el.closest('.color-console') || el.id === 'navLogo' || el.id === 'navLogoStatic' || el.classList.contains('nav-logo')) {
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      magnetTargets.push({
        el: el,
        pageLeft: rect.left + scrollX,
        pageRight: rect.right + scrollX,
        pageTop: rect.top + scrollY,
        pageBottom: rect.bottom + scrollY,
        width: rect.width,
        height: rect.height,
        isScrollBubble: el.classList.contains('scroll-bubble')
      });
    });
  }

  // Run initial coordinates cache
  updateMagnetTargets();

  // Expose updateMagnetTargets globally for instant updates on panel toggle
  window.__updateMagnetTargets = updateMagnetTargets;

  // Track mouse coordinates and dynamically update grab state based on hover target styles
  document.addEventListener('mousemove', function(e) {
    // Ignore synthetic/fake mousemove events at (0,0) when elements are toggled or hidden
    if (e.clientX === 0 && e.clientY === 0) {
      return;
    }
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
        if (!window.__isDetailClosing) {
          const hoveredInteractive = target.closest(hoverSelector);
          
          if (hoveredInteractive && !hoveredInteractive.closest('.color-console') && hoveredInteractive.id !== 'navLogo' && hoveredInteractive.id !== 'navLogoStatic' && !hoveredInteractive.classList.contains('nav-logo')) {
            const isMagnet = hoveredInteractive.matches(magnetSelector);
            if (isMagnet && isElementVisible(hoveredInteractive)) {
              closestTarget = hoveredInteractive;
            }
          } else {
            // Check if pointer is currently inside the scrollbar container
            const isInsideScrollbar = target.closest('#scrollBar') !== null;
            const isOverWorkCard = target.closest('.work-card') !== null || (window.__hoveredCardIndex !== undefined && window.__hoveredCardIndex >= 0);
            
            if (!isInsideScrollbar && !isOverWorkCard) {
              // If in empty space (and not inside the scrollbar), find the closest magnet target based on Euclidean distance to its bounding box
              let minDistance = Infinity;
              const maxSnapDistance = 30; // Only snap if pointer is within 30px of the target's boundary
              
              const scrollX = window.scrollX || window.pageXOffset || 0;
              const scrollY = window.scrollY || window.pageYOffset || 0;

              for (const targetItem of magnetTargets) {
                if (!isElementVisible(targetItem.el)) continue;

                const rectLeft = targetItem.pageLeft - scrollX;
                const rectRight = targetItem.pageRight - scrollX;
                const rectTop = targetItem.pageTop - scrollY;
                const rectBottom = targetItem.pageBottom - scrollY;

                const centerX = rectLeft + targetItem.width / 2;
                const centerY = rectTop + targetItem.height / 2;

                // Euclidean distance to axis-aligned bounding box
                const dx = Math.max(rectLeft - mouseX, 0, mouseX - rectRight);
                const dy = Math.max(rectTop - mouseY, 0, mouseY - rectBottom);
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Asymmetric snapping: Weaken snapping on the right side of scrollbar bubbles
                // (facing the screen edge and scroll track) so the mouse slips off easily.
                let localMaxSnapDistance = maxSnapDistance;
                if (targetItem.isScrollBubble && mouseX > centerX) {
                  localMaxSnapDistance = 2;
                }
                
                // Hysteresis: Give the currently hovered element a 15px distance discount 
                // so the cursor doesn't jitter back and forth between close neighbors.
                const hysteresisDiscount = (hoveredElement && targetItem.el === hoveredElement) ? 15 : 0;
                const effectiveDist = dist - hysteresisDiscount;
                
                if (dist < localMaxSnapDistance) {
                  if (effectiveDist < minDistance) {
                    minDistance = effectiveDist;
                    closestTarget = targetItem.el;
                  }
                }
              }
            }
          }
        }

        if (closestTarget) {
          setHoveredElement(closestTarget);
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
      // Ignore initial fake mousemove events at (0,0) when the mouse is actually outside
      if (e.clientX === 0 && e.clientY === 0) {
        return;
      }
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

  document.addEventListener('mouseenter', function(e) {
    // Ignore initial/fake events at (0,0)
    if (e.clientX === 0 && e.clientY === 0) return;

    mouseX = e.clientX;
    mouseY = e.clientY;
    cX = mouseX;
    cY = mouseY;
    t1X = mouseX;
    t1Y = mouseY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    lastCX = cX;
    lastCY = cY;
    isFirstMove = false;
    
    cursorDot.style.opacity = '1';
    cursorTrail1.style.opacity = '0.65';
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
    if (target && isElementVisible(target)) {
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
        if (!related || !isElementVisible(related)) {
          isHovered = false;
          cursorDot.classList.remove('hovered');
        }
      }
    }
  });

  // Intercept and redirect mouse events to the snapped element
  let mousedownTarget = null;
  let isRedirectingMousedown = false;
  document.addEventListener('mousedown', function(e) {
    mousedownTarget = e.target;
    if (isRedirectingMousedown) return;
    if (e.target.closest && (e.target.closest('.work-card') || (window.__hoveredCardIndex >= 0 && e.target.closest('.works')))) return; // Do not redirect clicks on works cards or inside works section when a card is hovered
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
    // Do not redirect mouseup while theme cord is being dragged
    if (window.__isDraggingTheme) return;
    if (e.target.closest && (e.target.closest('.work-card') || (window.__hoveredCardIndex >= 0 && e.target.closest('.works')))) return; // Do not redirect clicks on works cards or inside works section when a card is hovered
    if (hoveredElement && !hoveredElement.contains(e.target)) {
      // Only redirect if the gesture also started inside this hovered element
      if (!mousedownTarget || !hoveredElement.contains(mousedownTarget)) return;

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
    // Block ALL clicks while the theme cord is being dragged
    if (window.__isDraggingTheme) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (e.target.closest && (e.target.closest('.work-card') || (window.__hoveredCardIndex >= 0 && e.target.closest('.works')))) return; // Do not redirect clicks on works cards or inside works section when a card is hovered
    if (hoveredElement && !hoveredElement.contains(e.target)) {
      // Only redirect if the gesture also started inside this hovered element
      if (!mousedownTarget || !hoveredElement.contains(mousedownTarget)) return;

      e.preventDefault();
      e.stopPropagation();
      
      isRedirectingClick = true;
      hoveredElement.click();
      isRedirectingClick = false;
    }
  }, { capture: true });

  // Animation Loop
  (function loop() {
    // Calculate mouse velocity (speed & direction) early to use for snapping physics
    const vx = mouseX - lastMouseX;
    const vy = mouseY - lastMouseY;
    const speed = Math.sqrt(vx * vx + vy * vy);

    // 1. Position follow with LERP delay (Magnetic snap + normal lag physics)
    if (hoveredElement) {
      if (window.__isDetailClosing) {
        setHoveredElement(null);
      } else {
        // Dynamically query bounding rect on every frame to track moving/animating targets in real-time
        hoveredRect = hoveredElement.getBoundingClientRect();
        
        // If the element has become hidden (width/height is 0) or is no longer visible in DOM, release snap immediately
        if (hoveredRect.width === 0 || hoveredRect.height === 0 || !isElementVisible(hoveredElement)) {
          setHoveredElement(null);
        }
      }
    } else {
      // If not currently snapped, but we are in page transition, check distances in real-time
      // so we can snap immediately to the exit button as it slides under a stationary mouse
      if (window.__isRouteTransitioning && !window.__isDetailClosing) {
        let closestTarget = null;
        let minDistance = Infinity;
        const maxSnapDistance = 30;
        
        const scrollX = window.scrollX || window.pageXOffset || 0;
        const scrollY = window.scrollY || window.pageYOffset || 0;

        for (const targetItem of magnetTargets) {
          if (!isElementVisible(targetItem.el)) continue;
          
          const rectLeft = targetItem.pageLeft - scrollX;
          const rectRight = targetItem.pageRight - scrollX;
          const rectTop = targetItem.pageTop - scrollY;
          const rectBottom = targetItem.pageBottom - scrollY;

          const centerX = rectLeft + targetItem.width / 2;
          const centerY = rectTop + targetItem.height / 2;
          
          const dx = Math.max(rectLeft - mouseX, 0, mouseX - rectRight);
          const dy = Math.max(rectTop - mouseY, 0, mouseY - rectBottom);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let localMaxSnapDistance = maxSnapDistance;
          if (targetItem.isScrollBubble && mouseX > centerX) {
            localMaxSnapDistance = 2;
          }
          
          if (dist < localMaxSnapDistance) {
            if (dist < minDistance) {
              minDistance = dist;
              closestTarget = targetItem.el;
            }
          }
        }
        
        if (closestTarget) {
          setHoveredElement(closestTarget);
        }
      }
    }

    if (hoveredElement) {
      const btnCenterX = hoveredRect.left + hoveredRect.width / 2;
      const btnCenterY = hoveredRect.top + hoveredRect.height / 2;
      
      const timeSinceSnap = Date.now() - snapStartTime;
      const lockDuration = 250; // 250ms of complete lock to give instant snap feedback
      
      let targetX = btnCenterX;
      let targetY = btnCenterY;
      
      if (timeSinceSnap >= lockDuration) {
        // Calculate offset vector from button center to physical mouse position
        const mouseDx = mouseX - btnCenterX;
        const mouseDy = mouseY - btnCenterY;
        
        // Elastic rubber-band stretch: pulls custom cursor slightly towards mouse position
        // Scale the pull based on mouse movement speed so that it returns to center when stationary
        const speedScale = Math.min(speed * 0.15, 1.0);
        const pullFactor = 0.38 * speedScale; // Pull up to 38% towards physical mouse when moving fast
        const maxPull = 15; // Cap stretch at 15px max displacement so it stays within trigger area
        
        let pullX = mouseDx * pullFactor;
        let pullY = mouseDy * pullFactor;
        const pullDist = Math.sqrt(pullX * pullX + pullY * pullY);
        
        if (pullDist > maxPull) {
          pullX = (pullX / pullDist) * maxPull;
          pullY = (pullY / pullDist) * maxPull;
        }
        
        // LERP the snap pull components with a viscous factor (0.15) to add a smooth visual delay/rubber-band lag
        snapPullX += (pullX - snapPullX) * 0.15;
        snapPullY += (pullY - snapPullY) * 0.15;
        snapPullDist = Math.sqrt(snapPullX * snapPullX + snapPullY * snapPullY);
        
        targetX = btnCenterX + snapPullX;
        targetY = btnCenterY + snapPullY;
      } else {
        // Smoothly return snap pull back to 0 during the lock duration
        snapPullX += (0 - snapPullX) * 0.15;
        snapPullY += (0 - snapPullY) * 0.15;
        snapPullDist = Math.sqrt(snapPullX * snapPullX + snapPullY * snapPullY);
      }
      
      // Glides and snaps to the target coordinate (0.15 LERP) for responsive and soft magnetization
      cX += (targetX - cX) * 0.15;
      cY += (targetY - cY) * 0.15;
      
      // Track current snap offset relative to the physical mouse
      snapOffsetX = cX - mouseX;
      snapOffsetY = cY - mouseY;
    } else {
      // Release snap: decay the offset based on time and mouse movement
      // When mouse is stationary (speed = 0), decay = 1.0 (no decay, stays stationary)
      const decay = Math.exp(-speed * 0.08);
      snapOffsetX *= decay;
      snapOffsetY *= decay;
      
      if (Math.abs(snapOffsetX) < 0.05) snapOffsetX = 0;
      if (Math.abs(snapOffsetY) < 0.05) snapOffsetY = 0;
      
      const targetX = mouseX + snapOffsetX;
      const targetY = mouseY + snapOffsetY;
      
      // Main triangle follows mouse plus decaying offset with responsive LERP factor (0.15)
      cX += (targetX - cX) * 0.15;
      cY += (targetY - cY) * 0.15;
    }

    
    // Trail triangle follows main triangle with matching lag (0.11)
    t1X += (cX - t1X) * 0.11;
    t1Y += (cY - t1Y) * 0.11;

    // 2. Calculate mouse velocity (speed & direction) - already computed early in loop
    
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
    } else if (isClicked) {
      targetAngle = -90;
      lastActiveAngle = -90;
    } else {
      if (isArrowHovered) {
        // In works area: do not automatically return to upright, hold the last active angle
        targetAngle = lastActiveAngle;
      } else {
        // Outside works area: return to upright after 800ms hold delay
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

    const isReturningUpright = !isActuallyHovered && (targetAngle === -90 || (!isArrowHovered && Date.now() - lastMoveTime >= 800));
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
    
    // When hovered/snapped, tilt in the direction of the elastic pull
    let targetPitch = basePitch;
    let targetRoll = isReturningUpright 
      ? Math.max(-20, Math.min(20, diff * 0.6)) // Subtle and elegant roll (max 20 degrees) to prevent layer splitting
      : Math.max(-30, Math.min(30, diff * 1.5)) * Math.min(cursorSpeed / 6.0, 1.0); // Driven by LERP-smoothed cursorSpeed

    if (isActuallyHovered) {
      if (snapPullDist > 0) {
        // Roll: horizontal tilt from snapPullX (cap at 15px pull -> 18deg tilt)
        // Pitch: vertical tilt from snapPullY (cap at 15px pull -> 18deg tilt)
        targetRoll = (snapPullX / 15) * 18;
        targetPitch = -(snapPullY / 15) * 18;
      } else {
        targetPitch = 0;
        targetRoll = 0;
      }
    }
    
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
    // Also protect the snapping phase during active elastic snapping pulls
    if (cursorSpeed < 0.1 && speed < 0.1 && snapPullDist < 0.1) {
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
    let transform3dStr = `rotate(${arrowRotation}deg) rotateX(${currentPitch}deg) rotateY(${currentRoll}deg)`;
    let trailTransform3dStr = `rotate(${arrowRotation}deg) rotateX(${currentPitch}deg) rotateY(${currentRoll}deg)`;
    
    if (isActuallyHovered) {
      if (snapPullDist > 0.01) {
        const pullAngle = Math.atan2(snapPullY, snapPullX);
        const stretchAmt = (snapPullDist / 15) * 0.12;
        const squeezeAmt = (snapPullDist / 15) * 0.08;
        transform3dStr += ` scale(${currentScale}) rotate(${pullAngle}rad) scale(${1 + stretchAmt}, ${1 - squeezeAmt}) rotate(${-pullAngle}rad)`;
        trailTransform3dStr += ` scale(${currentTrailScale}) rotate(${pullAngle}rad) scale(${1 + stretchAmt}, ${1 - squeezeAmt}) rotate(${-pullAngle}rad)`;
      } else {
        transform3dStr += ` scale(${currentScale})`;
        trailTransform3dStr += ` scale(${currentTrailScale})`;
      }
    } else {
      const sX = currentScale * currentStretchX;
      const sY = currentScale * currentStretchY;
      const tsX = currentTrailScale * currentStretchX;
      const tsY = currentTrailScale * currentStretchY;
      transform3dStr += ` scale(${sX}, ${sY})`;
      trailTransform3dStr += ` scale(${tsX}, ${tsY})`;
    }

    if (cursor3dContainer) {
      cursor3dContainer.style.transform = transform3dStr;
    }
    if (trail3dContainer) {
      trail3dContainer.style.transform = trailTransform3dStr;
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
