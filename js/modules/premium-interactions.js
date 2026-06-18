import gsap from 'gsap';

// Singleton Hover Preview
const isMobileDevice = ('ontouchstart' in window) || (window.innerWidth <= 1024);

if (!isMobileDevice) {
  // === DESKTOP HOVER PREVIEW (MOUSE FOLLOW) ===
  const workList = document.querySelector('.work-list');
  const cards = document.querySelectorAll('.work-card');
  const worksEl = document.querySelector('.works');
  console.log('Premium Interactions JS Initialized (Desktop 3D Projection).', !!workList, cards.length, !!worksEl);

  if (workList && cards.length > 0 && worksEl) {
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let isVisible = false;
    let activeCardIndex = -1;
    let activeTimeline = null;
    let orangeSwitchTimeline = null;

    // Animation state object driven by GSAP tweens for the staggered entrance & overshoot rebound
    const previewAnim = {
      imgScale: 0.5,
      imgZ: 0,
      imgOpacity: 0,
      orangeScale: 0.5,
      orangeZ: 0,
      orangeOpacity: 0
    };

    // LERP state variables for the 3D tilt angles to prevent sudden jumping/flattening
    let currentTiltX = 0;
    let currentTiltY = 0;
    let currentTiltZ = 0;

    // LERP state variables for the orange background layer 3D tilt angles
    let currentOrangeTiltX = 0;
    let currentOrangeTiltY = 0;
    let currentOrangeTiltZ = 0;

    // LERP state variables for the orange background layer
    let currentOrangeX = 0;
    let currentOrangeY = 0;

    const baseY = -34;
    const baseX = 17;
    const baseZ = 2;

    let targetWorkListY = baseY;
    let targetWorkListX = baseX;
    let targetWorkListZ = baseZ;

    let currentWorkListY = baseY;
    let currentWorkListX = baseX;
    let currentWorkListZ = baseZ;

    let mousePercentX = 0;
    let mousePercentY = 0;

    // Raw mouse coordinates updated by mousemove — RAF reads these
    let rawMouseX = -9999;
    let rawMouseY = -9999;
    let hoveredCardIndex = -1;

    // Singleton DOM
    const wrapper = document.createElement('div');
    wrapper.className = 'work-preview-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.transformStyle = 'preserve-3d';
    wrapper.style.zIndex = 'auto';

    const orangeLayer = document.createElement('div');
    orangeLayer.className = 'work-preview-orange-layer';
    orangeLayer.style.transformStyle = 'preserve-3d';
    orangeLayer.style.zIndex = 'auto';
    orangeLayer.style.opacity = '0';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'work-preview-img-container';
    imgContainer.style.transformStyle = 'preserve-3d';
    imgContainer.style.zIndex = 'auto';
    imgContainer.style.opacity = '0';

    wrapper.appendChild(orangeLayer);
    wrapper.appendChild(imgContainer);
    workList.appendChild(wrapper);

    // Initial State (only set autoAlpha on wrapper since children scale individually in RAF)
    gsap.set(wrapper, { autoAlpha: 0 });

    // Apply initial 3D tilt transform to workList so it aligns with starting coordinates on load
    workList.style.transform = `translateX(-40px) translateY(140px) rotateY(${baseY}deg) rotateX(${baseX}deg) rotateZ(${baseZ}deg)`;
    let isPreviewActive = false; // Track if the preview wrapper is physically faded in
    let activeImages = []; // Array to keep track of active image items in the stack

    function showPreviewDOM() {
      if (isPreviewActive) return;
      isPreviewActive = true;
      
      if (activeTimeline) activeTimeline.kill();
      if (orangeSwitchTimeline) orangeSwitchTimeline.kill();
      gsap.killTweensOf([wrapper, previewAnim]);
      
      // Instantly make the wrapper visible and set opacity to 1.0 to prevent 3D flattening
      gsap.set(wrapper, { autoAlpha: 1 });
      
      activeTimeline = gsap.timeline();
      
      // Awwwards-style premium liquid spring animation for the image container
      activeTimeline.to(previewAnim, {
        imgOpacity: 1,
        imgScale: 1.0,
        imgZ: 52, // Float 24px ABOVE the hovered card (Z=28px)
        duration: 0.8,
        ease: 'elastic.out(1.1, 0.55)' // Elegant, fluid overshoot and single gentle bounce-back
      }, 0);
      
      // The orange shadow block follows closely, creating a fluid wave/peel-off effect
      activeTimeline.to(previewAnim, {
        orangeOpacity: 1,
        orangeScale: 1.0,
        orangeZ: -25, // Float safely BEHIND all cards (Z=-25px, max tilt edge Z is -3px)
        duration: 0.7,
        ease: 'elastic.out(1.0, 0.6)'
      }, 0.08); // Staggered by 0.08s for a tight, high-end feel
    }

    function hidePreviewDOM() {
      if (!isPreviewActive) return;
      isPreviewActive = false;
      activeCardIndex = -1;
      
      if (activeTimeline) activeTimeline.kill();
      if (orangeSwitchTimeline) orangeSwitchTimeline.kill();
      gsap.killTweensOf([wrapper, previewAnim]);
      
      activeTimeline = gsap.timeline();
      
      // Fade out and shrink both layers together for a snappy close
      activeTimeline.to(previewAnim, {
        imgOpacity: 0,
        imgScale: 0.5,
        imgZ: 0,
        orangeOpacity: 0,
        orangeScale: 0.5,
        orangeZ: 0,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(wrapper, { autoAlpha: 0 });
          activeImages = [];
          imgContainer.innerHTML = '';
        }
      });
    }

    // Page-relative flat coordinates for the cards and sections (avoid layout reflows on scroll/RAF)
    let wPageRect = { left: 0, top: 0, width: 0, height: 0 };
    let pPageRect = { left: 0, top: 0, width: 0, height: 0 };
    let cardPageRects = [];

    function updateFlatPageCoordinates() {
      // Temporarily flatten the list to get 100% accurate flat client rects
      const oldTransform = workList.style.transform;
      workList.style.transform = 'none';

      const wRect = workList.getBoundingClientRect();
      const pRect = worksEl.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      wPageRect = {
        left: wRect.left + scrollX,
        top: wRect.top + scrollY,
        width: wRect.width,
        height: wRect.height
      };

      pPageRect = {
        left: pRect.left + scrollX,
        top: pRect.top + scrollY,
        width: pRect.width,
        height: pRect.height
      };

      cardPageRects = Array.from(cards).map(card => {
        const rect = card.getBoundingClientRect();
        return {
          left: rect.left + scrollX,
          right: rect.right + scrollX,
          top: rect.top + scrollY,
          bottom: rect.bottom + scrollY,
          width: rect.width,
          height: rect.height
        };
      });

      // Restore the 3D transform
      workList.style.transform = oldTransform;
    }

    // Expose globally so that works-entrance.js can trigger it once card flight animations complete
    window.__recalculateWorksCoordinates = updateFlatPageCoordinates;

    // Initialize flat page layout bounds
    updateFlatPageCoordinates();
    window.addEventListener('load', updateFlatPageCoordinates);
    window.addEventListener('resize', updateFlatPageCoordinates);

    function onListEnter(e) {
      if (window.__isRouteTransitioning || window.__isDetailClosing) return;
      isVisible = true;
      firstMove = true;
      
      // Wake up the hover loop if it was asleep
      if (!hoverLoopId) {
        hoverLoopId = requestAnimationFrame(animateHover);
      }

      if (e) {
        rawMouseX = e.clientX;
        rawMouseY = e.clientY;

        const previewWidth = 200;
        const previewHeight = 138;
        const offsetX = 30;
        const offsetY = 120; // Comfortable constant gap above the cursor

        // Page-relative mouse coordinates
        const pageMouseX = rawMouseX + window.scrollX;

        // Local flat X position inside work-list
        const localX = pageMouseX - wPageRect.left;

        if (window.innerWidth - rawMouseX < previewWidth + offsetX + 20) {
          targetX = localX - previewWidth - offsetX;
        } else {
          targetX = localX + offsetX;
        }

        // Keep targetY clamped relative to visible viewport bounds
        const clampedViewportY = gsap.utils.clamp(20, window.innerHeight - previewHeight - 35, rawMouseY - offsetY);
        const targetYFlat = clampedViewportY + window.scrollY - wPageRect.top;

        // Apply 3D perspective projection compensation to keep vertical visual gap perfectly uniform
        const xLocal = localX - wPageRect.width / 2;
        const yDesiredLocal = targetYFlat - wPageRect.height / 2;

        const cosX = 0.9563; // cos(17deg)
        const sinY = -0.5592; // sin(-34deg)
        const B = 0.2421; // sin(17deg) * cos(-34deg)
        const d = 1750;

        const A = d - sinY * xLocal;
        const yCompensatedLocal = (yDesiredLocal * A) / (cosX * d + yDesiredLocal * B);

        targetY = yCompensatedLocal + wPageRect.height / 2;
      }
    }

    function onListLeave() {
      isVisible = false;
      activeCardIndex = -1;
      hoveredCardIndex = -1;
      window.__hoveredCardIndex = -1; // Reset globally
      cards.forEach(c => {
        c.classList.remove('hovered');
        c.style.removeProperty('--card-mouse-x');
        c.style.removeProperty('--card-mouse-y');
      });
      // Reset tilt targets — list will LERP back to base angles
      targetWorkListY = baseY;
      targetWorkListX = baseX;
      targetWorkListZ = baseZ;
      mousePercentX = 0;
      mousePercentY = 0;
      
      hidePreviewDOM();
    }

    function onCardEnter(index) {
      if (window.__isRouteTransitioning || window.__isDetailClosing) return;
      const card = cards[index];
      cards.forEach((c, idx) => {
        if (idx !== index) c.classList.remove('hovered');
      });
      card.classList.add('hovered');

      const src = card.dataset.image;
      if (!src || index === activeCardIndex) return;

      // Trigger diving spring animation for the orange shadow block when switching cards
      if (isPreviewActive) {
        if (orangeSwitchTimeline) orangeSwitchTimeline.kill();
        gsap.killTweensOf(previewAnim, 'orangeZ');
        orangeSwitchTimeline = gsap.timeline()
          .to(previewAnim, {
            orangeZ: -45, // Dive down deep behind the glass card (Z=-45) to completely clear sinking cards
            duration: 0.16,
            ease: 'power2.in'
          })
          .to(previewAnim, {
            orangeZ: -25, // Spring back up to the active background depth (Z=-25)
            duration: 0.6,
            ease: 'elastic.out(1.0, 0.6)'
          });
      }

      activeCardIndex = index;
      hoveredCardIndex = index;
      window.__hoveredCardIndex = index;

      // ── Append new image to the stack ──
      const img = document.createElement('img');
      img.className = 'work-preview-image-item';
      img.src = src;

      // If this is the first image of the hover session (container is empty),
      // we disable the fadeInScale keyframe animation on the image itself.
      // The outer container wrapper is already doing the zoom/scale animation,
      // so this prevents redundant double-scale artifacts.
      if (imgContainer.children.length === 0) {
        img.style.animation = 'none';
        img.style.opacity = '1';
        img.style.transform = 'scale(1)';
      }

      const imgId = Math.random().toString(36).substring(2, 9);
      activeImages.push({
        id: imgId,
        el: img,
        src: src
      });
      imgContainer.appendChild(img);

      // Limit stack size to 5, shift the oldest out
      if (activeImages.length > 5) {
        const oldest = activeImages.shift();
        if (oldest && oldest.el) {
          oldest.el.remove();
        }
      }

      showPreviewDOM();
    }
    // Hook enter/leave on the work-list container instead of the entire padded section
    if (workList) {
      workList.addEventListener('mouseenter', onListEnter);
      workList.addEventListener('mouseleave', onListLeave);
    }

    window.addEventListener('mousemove', (e) => {
      rawMouseX = e.clientX;
      rawMouseY = e.clientY;

      const previewWidth = 200;
      const previewHeight = 138;
      const offsetX = 30;
      const offsetY = 120; // Comfortable constant gap above the cursor

      // Page-relative mouse coordinates
      const pageMouseX = rawMouseX + window.scrollX;

      // Local flat X position inside work-list
      const localX = pageMouseX - wPageRect.left;

      if (window.innerWidth - rawMouseX < previewWidth + offsetX + 20) {
        targetX = localX - previewWidth - offsetX;
      } else {
        targetX = localX + offsetX;
      }

      // Keep targetY clamped relative to visible viewport bounds
      const clampedViewportY = gsap.utils.clamp(20, window.innerHeight - previewHeight - 35, rawMouseY - offsetY);
      const targetYFlat = clampedViewportY + window.scrollY - wPageRect.top;

      // Apply 3D perspective projection compensation to keep vertical visual gap perfectly uniform
      const xLocal = localX - wPageRect.width / 2;
      const yDesiredLocal = targetYFlat - wPageRect.height / 2;

      const cosX = 0.9563; // cos(17deg)
      const sinY = -0.5592; // sin(-34deg)
      const B = 0.2421; // sin(17deg) * cos(-34deg)
      const d = 1750;

      const A = d - sinY * xLocal;
      const yCompensatedLocal = (yDesiredLocal * A) / (cosX * d + yDesiredLocal * B);

      targetY = yCompensatedLocal + wPageRect.height / 2;
    });

    // Helper functions for 3D projection hit-testing
    function isPointInQuad(px, py, p0, p1, p2, p3) {
      function crossProduct(ax, ay, bx, by, cx, cy) {
        return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      }
      const cp0 = crossProduct(p0.x, p0.y, p1.x, p1.y, px, py);
      const cp1 = crossProduct(p1.x, p1.y, p2.x, p2.y, px, py);
      const cp2 = crossProduct(p2.x, p2.y, p3.x, p3.y, px, py);
      const cp3 = crossProduct(p3.x, p3.y, p0.x, p0.y, px, py);
      return (cp0 >= 0 && cp1 >= 0 && cp2 >= 0 && cp3 >= 0) ||
             (cp0 <= 0 && cp1 <= 0 && cp2 <= 0 && cp3 <= 0);
    }

    // Precompute constant rotations and trigonometric functions for the 3D projection
    const radY = baseY * Math.PI / 180;
    const radX = baseX * Math.PI / 180;
    const radZ = baseZ * Math.PI / 180;

    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosZ = Math.cos(radZ);
    const sinZ = Math.sin(radZ);

    // RAF Animation Loop
    let curX1 = 0, curY1 = 0;
    let curX2 = 0, curY2 = 0;
    let firstMove = true;
    let hoverLoopId = null;

    function animateHover() {
      // ── STEP 1: Update 3D list tilt target from mouse position ──
      if (isVisible) {
        mousePercentX = (rawMouseX - window.innerWidth / 2) / (window.innerWidth / 2);
        mousePercentY = (rawMouseY - window.innerHeight / 2) / (window.innerHeight / 2);
        targetWorkListY = baseY + mousePercentX * 4;
        targetWorkListX = baseX + mousePercentY * 3;
        targetWorkListZ = baseZ + mousePercentX * 1.5;
      }

      // ── STEP 2: Apply LERP to list rotation ──
      const diffY = targetWorkListY - currentWorkListY;
      const diffX = targetWorkListX - currentWorkListX;
      const diffZ = targetWorkListZ - currentWorkListZ;
      if (Math.abs(diffY) > 0.001 || Math.abs(diffX) > 0.001 || Math.abs(diffZ) > 0.001) {
        currentWorkListY += diffY * 0.06;
        currentWorkListX += diffX * 0.06;
        currentWorkListZ += diffZ * 0.06;
        workList.style.transform = `translateX(-40px) translateY(140px) rotateY(${currentWorkListY}deg) rotateX(${currentWorkListX}deg) rotateZ(${currentWorkListZ}deg)`;
      }

      // ── STEP 3: Hit test page-relative coordinates against 3D projected rects ──
      if (isVisible && rawMouseX > -9000) {
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        // Viewport center of rotation and perspective origin flat
        const originX = wPageRect.left + wPageRect.width / 2 - scrollX;
        const originY = wPageRect.top + wPageRect.height / 2 - scrollY;
        const perspX = pPageRect.left + pPageRect.width / 2 - scrollX;
        const perspY = pPageRect.top + pPageRect.height / 2 - scrollY;

        const d = 1750;

        function projectPoint(pageX, pageY) {
          const vx = pageX - scrollX;
          const vy = pageY - scrollY;
          const x0 = vx - originX;
          const y0 = vy - originY;

          // Rotations using precomputed constants
          const x1 = x0 * cosZ - y0 * sinZ;
          const y1 = x0 * sinZ + y0 * cosZ;

          const y2 = y1 * cosX;
          const z2 = y1 * sinX;

          const x3 = x1 * cosY + z2 * sinY;
          const z3 = -x1 * sinY + z2 * cosY;

          // Perspective
          const dx = x3 + originX - perspX;
          const dy = y2 + originY - perspY;
          const dz = z3;

          const scale = d / (d - dz);
          return {
            x: dx * scale + perspX,
            y: dy * scale + perspY
          };
        }

        let newHoveredIndex = -1;
        for (let i = 0; i < cardPageRects.length; i++) {
          const r = cardPageRects[i];
          const p0 = projectPoint(r.left, r.top);
          const p1 = projectPoint(r.right, r.top);
          const p2 = projectPoint(r.right, r.bottom);
          const p3 = projectPoint(r.left, r.bottom);

          if (isPointInQuad(rawMouseX, rawMouseY, p0, p1, p2, p3)) {
            newHoveredIndex = i;
            break;
          }
        }

        if (newHoveredIndex !== hoveredCardIndex) {
          // Clear shine from old card
          if (hoveredCardIndex >= 0 && cards[hoveredCardIndex]) {
            cards[hoveredCardIndex].style.removeProperty('--card-mouse-x');
            cards[hoveredCardIndex].style.removeProperty('--card-mouse-y');
            cards[hoveredCardIndex].classList.remove('hovered');
          }
          hoveredCardIndex = newHoveredIndex;
          window.__hoveredCardIndex = newHoveredIndex; // Expose globally
          if (newHoveredIndex >= 0) {
            onCardEnter(newHoveredIndex);
          } else {
            cards.forEach(c => c.classList.remove('hovered'));
          }
        }

        // ── STEP 3b: Update shine CSS vars on hovered card ──
        if (hoveredCardIndex >= 0 && cards[hoveredCardIndex]) {
          const r = cardPageRects[hoveredCardIndex];
          const pageMouseX = rawMouseX + window.scrollX;
          const pageMouseY = rawMouseY + window.scrollY;
          const localX = ((pageMouseX - r.left) / r.width) * 100;
          const localY = ((pageMouseY - r.top) / r.height) * 100;
          cards[hoveredCardIndex].style.setProperty('--card-mouse-x', `${localX}%`);
          cards[hoveredCardIndex].style.setProperty('--card-mouse-y', `${localY}%`);
        }
      }

      // ── STEP 4: Animate preview thumbnail follow and scale ──
      if (isVisible || gsap.getProperty(wrapper, 'opacity') > 0.01) {
        if (firstMove) {
          const initOffset = (Math.abs(previewAnim.orangeZ) / 25) * 18;
          currentX = targetX;
          currentY = targetY;
          currentOrangeX = targetX + initOffset;
          currentOrangeY = targetY + initOffset;
          currentTiltX = 0;
          currentTiltY = 0;
          currentTiltZ = 0;
          currentOrangeTiltX = 0;
          currentOrangeTiltY = 0;
          currentOrangeTiltZ = 0;
          firstMove = false;
        }

        // 1. LERP image container (less delay: 0.055 LERP factor)
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        currentX += dx * 0.055;
        currentY += dy * 0.055;

        // 2. LERP orange layer (more delay: 0.035 LERP factor, dynamic offset proportional to orange layer elevation)
        const currentOffset = (Math.abs(previewAnim.orangeZ) / 25) * 18;
        const targetOrangeX = targetX + currentOffset;
        const targetOrangeY = targetY + currentOffset;
        const dxOrange = targetOrangeX - currentOrangeX;
        const dyOrange = targetOrangeY - currentOrangeY;
        currentOrangeX += dxOrange * 0.035;
        currentOrangeY += dyOrange * 0.035;

        // Clean stack images if hidden
        if (previewAnim.imgScale < 0.02 && hoveredCardIndex === -1 && activeImages.length > 0) {
          activeImages.forEach(img => img.el.remove());
          activeImages = [];
          imgContainer.innerHTML = '';
        }
        
        // Calculate target 3D tilts for image container (based on its dx/dy velocity)
        let targetTiltY = gsap.utils.clamp(-16, 16, dx * 0.06);
        let targetTiltX = gsap.utils.clamp(-16, 16, -dy * 0.06);
        let targetTiltZ = gsap.utils.clamp(-6, 6, dx * 0.02);

        // Smoothly LERP image tilts with faster response (0.08 LERP factor)
        currentTiltX += (targetTiltX - currentTiltX) * 0.08;
        currentTiltY += (targetTiltY - currentTiltY) * 0.08;
        currentTiltZ += (targetTiltZ - currentTiltZ) * 0.08;

        // Calculate target 3D tilts for orange layer (consistent with the image, based on dx/dy velocity)
        let targetOrangeTiltY = gsap.utils.clamp(-16, 16, dx * 0.06);
        let targetOrangeTiltX = gsap.utils.clamp(-16, 16, -dy * 0.06);
        let targetOrangeTiltZ = gsap.utils.clamp(-6, 6, dx * 0.02);

        // Smoothly LERP orange layer tilts with faster response (0.05 LERP factor)
        currentOrangeTiltX += (targetOrangeTiltX - currentOrangeTiltX) * 0.05;
        currentOrangeTiltY += (targetOrangeTiltY - currentOrangeTiltY) * 0.05;
        currentOrangeTiltZ += (targetOrangeTiltZ - currentOrangeTiltZ) * 0.05;

        // Apply transform and opacity to image container (on top, z-index: 2)
        gsap.set(imgContainer, {
          x: currentX,
          y: currentY,
          z: previewAnim.imgZ, // Dynamically driven by GSAP overshoot transition
          scale: previewAnim.imgScale,
          rotationY: currentTiltY,
          rotationX: currentTiltX,
          rotation: currentTiltZ,
          opacity: previewAnim.imgOpacity,
          force3D: true
        });

        // Apply transform and opacity to orange background shadow layer (underneath, z-index: 1)
        // Offset is driven by currentOrangeX/Y LERP coordinates
        gsap.set(orangeLayer, {
          x: currentOrangeX,
          y: currentOrangeY,
          z: previewAnim.orangeZ, // Dynamically driven by GSAP overshoot transition
          scale: previewAnim.orangeScale,
          rotationY: currentOrangeTiltY * 0.8, // Slightly less tilt for parallax depth
          rotationX: currentOrangeTiltX * 0.8,
          rotation: currentOrangeTiltZ * 0.8,
          opacity: previewAnim.orangeOpacity,
          force3D: true
        });
      } else {
        firstMove = true;
      }
      
      // Determine if we should keep running or sleep to save CPU resources
      const isAnimating = Math.abs(diffY) > 0.001 || Math.abs(diffX) > 0.001 || Math.abs(diffZ) > 0.001;
      const isVisibleOrFading = isVisible || gsap.getProperty(wrapper, 'opacity') > 0.01;
      if (isVisibleOrFading || isAnimating) {
        hoverLoopId = requestAnimationFrame(animateHover);
      } else {
        hoverLoopId = null;
      }
    }
    
     window.triggerPreviewPinchAnimation = function() {
      if (!isPreviewActive) return;

      if (orangeSwitchTimeline) orangeSwitchTimeline.kill();
      gsap.killTweensOf(previewAnim, 'imgZ,orangeZ');

      orangeSwitchTimeline = gsap.timeline()
        .to(previewAnim, {
          imgZ: 18,        // Squeeze down closer to the pressed card (normally Z=52px)
          orangeZ: -10,    // Pull up closer to the pressed card (normally Z=-25px)
          duration: 0.08,
          ease: 'power2.out'
        })
        .to(previewAnim, {
          imgZ: 52,        // Rebound back to 52px
          orangeZ: -25,    // Rebound back to -25px
          duration: 0.32,
          ease: 'back.out(2.5)' // snappy spring rebound overshoot matching the card
        });
    };

    // Start initial animation frame (will auto-sleep once settled)
    hoverLoopId = requestAnimationFrame(animateHover);
  }
} else {
  // === MOBILE SCROLL PREVIEW (SCROLL TILT & AUTO SWITCH) ===
  const workList = document.querySelector('.work-list');
  const cards = document.querySelectorAll('.work-card');
  console.log('Premium Interactions JS Initialized (Mobile Scroll).', !!workList, cards.length);

  if (workList && cards.length > 0) {
    let activeSrc = null;
    let isVisible = false;
    let isCurrentlyShowing = false;
    let isObservedIntersecting = false;

    const wrapper = document.createElement('div');
    wrapper.className = 'work-preview-wrapper mobile-preview';
    const curtain = document.createElement('div');
    curtain.className = 'work-preview-curtain mobile-curtain';
    const imgContainer = document.createElement('div');
    imgContainer.className = 'work-preview-img-container mobile-img-container';
    wrapper.appendChild(curtain);
    wrapper.appendChild(imgContainer);
    document.body.appendChild(wrapper);

    gsap.set(wrapper, { autoAlpha: 0, yPercent: -50, scale: 0.7, rotation: -8, x: 30, filter: 'blur(10px)' });
    gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' });
    gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' });

    function showMobilePreview() {
      if (isCurrentlyShowing) return;
      isCurrentlyShowing = true;
      isVisible = true;
      gsap.killTweensOf([wrapper, curtain, imgContainer]);
      gsap.to(wrapper, { autoAlpha: 1, scale: 1, rotation: 0, x: 0, filter: 'blur(0px)', duration: 0.6, ease: 'back.out(1.4)', overwrite: true });
      gsap.to(curtain, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.5, ease: 'power3.out', overwrite: true });
      gsap.to(imgContainer, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.5, ease: 'power3.out', delay: 0.08, overwrite: true });
      updateActiveImage();
    }

    function hideMobilePreview() {
      if (!isCurrentlyShowing) return;
      isCurrentlyShowing = false;
      gsap.killTweensOf([wrapper, curtain, imgContainer]);
      gsap.to(wrapper, { autoAlpha: 0, scale: 0.65, rotation: 8, x: 40, filter: 'blur(10px)', duration: 0.35, ease: 'power3.in', overwrite: true, onComplete: () => { isVisible = false; activeSrc = null; } });
      gsap.to(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', duration: 0.35, ease: 'power3.in', overwrite: true });
      gsap.to(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', duration: 0.35, ease: 'power3.in', overwrite: true });
    }

    function updateActiveImage() {
      let activeZoneY = window.innerHeight * 0.45;
      let closestCard = null;
      let minDistance = Infinity;
      cards.forEach(card => {
        let rect = card.getBoundingClientRect();
        let cardCenterY = rect.top + rect.height / 2;
        let distance = Math.abs(cardCenterY - activeZoneY);
        if (distance < minDistance) { minDistance = distance; closestCard = card; }
      });
      if (closestCard) {
        const src = closestCard.dataset.image;
        if (src && src !== activeSrc) {
          activeSrc = src;
          const newImg = document.createElement('img');
          newImg.className = 'work-preview-img';
          newImg.src = src;
          const hasExistingImg = imgContainer.querySelectorAll('.work-preview-img').length > 0;
          if (!hasExistingImg) {
            gsap.set(newImg, { clipPath: 'none', y: 0 });
            imgContainer.innerHTML = '';
            imgContainer.appendChild(newImg);
          } else {
            gsap.set(newImg, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 20 });
            imgContainer.appendChild(newImg);
            gsap.to(newImg, {
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto',
              onComplete: () => {
                const imgs = imgContainer.querySelectorAll('.work-preview-img');
                if (imgs.length > 1) { for (let i = 0; i < imgs.length - 1; i++) imgs[i].remove(); }
              }
            });
          }
        }
      }
    }

    const checkVisibility = () => {
      let firstCardRect = cards[0].getBoundingClientRect();
      let lastCardRect = cards[cards.length - 1].getBoundingClientRect();
      let activeZoneY = window.innerHeight * 0.50;
      let isWithinWorksRange = (firstCardRect.top <= activeZoneY) && (lastCardRect.bottom >= activeZoneY);
      if (isWithinWorksRange) { showMobilePreview(); } else { hideMobilePreview(); }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isObservedIntersecting = entry.isIntersecting;
        if (!isObservedIntersecting) { hideMobilePreview(); } else { checkVisibility(); }
      });
    }, { threshold: 0.01, rootMargin: '100px 0px 100px 0px' });

    observer.observe(workList);

    window.addEventListener('scroll', () => {
      if (!isObservedIntersecting) return;
      checkVisibility();
      if (!isCurrentlyShowing) return;
      updateActiveImage();
    }, { passive: true });
  }
}

// Ambient Spotlight Glow with LERP Physics
(function() {
  const glow = document.getElementById('ambientGlow');
  if (glow && !('ontouchstart' in window)) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isActive = false;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isActive) {
        isActive = true;
        glow.classList.add('visible');
        currentX = targetX;
        currentY = targetY;
      }
    });

    (function animateGlow() {
      if (isActive) {
        currentX += (targetX - currentX) * 0.045;
        currentY += (targetY - currentY) * 0.045;
        glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(animateGlow);
    })();
  }
})();
