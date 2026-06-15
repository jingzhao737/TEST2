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
    let targetScale = 0.5;
    let currentScale = 0.5;
    let isVisible = false;
    let activeCardIndex = -1;

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

    // Decoupled preview-specific baseline variables and limits
    let previewBaseY = -34;
    let previewBaseX = 17;
    let previewBaseZ = 2;
    let clampYMax = 16;
    let clampXMax = 16;
    let clampZMax = 6;
    let forceVisible = true; // Lock preview visible by default for tuning


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

    const orangeLayer = document.createElement('div');
    orangeLayer.className = 'work-preview-orange-layer';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'work-preview-img-container';

    wrapper.appendChild(orangeLayer);
    wrapper.appendChild(imgContainer);
    document.body.appendChild(wrapper);

    // Initial State (only set autoAlpha on wrapper since children scale individually in RAF)
    gsap.set(wrapper, { autoAlpha: 0 });

    // Apply initial 3D tilt transform to workList so it aligns with starting coordinates on load
    workList.style.transform = `rotateY(${baseY}deg) rotateX(${baseX}deg) rotateZ(${baseZ}deg)`;
    let isPreviewActive = false; // Track if the preview wrapper is physically faded in
    let activeImages = []; // Array to keep track of active image items in the stack

    function showPreviewDOM() {
      if (isPreviewActive) return;
      isPreviewActive = true;
      targetScale = 1.0;
      gsap.killTweensOf(wrapper);
      gsap.to(wrapper, { autoAlpha: 1, duration: 0.3, ease: 'expo.out', overwrite: true });
    }

    function hidePreviewDOM() {
      if (!isPreviewActive) return;
      isPreviewActive = false;
      activeCardIndex = -1;
      targetScale = 0.5;
      gsap.killTweensOf(wrapper);
      gsap.to(wrapper, {
        autoAlpha: 0,
        duration: 0.3,
        ease: 'expo.out',
        overwrite: true,
        onComplete: () => {
          // Clear all images from the container once the preview is invisible
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

    // Initialize flat page layout bounds
    updateFlatPageCoordinates();
    window.addEventListener('load', updateFlatPageCoordinates);
    window.addEventListener('resize', updateFlatPageCoordinates);

    function onListEnter() {
      isVisible = true;
      firstMove = true;
      updateFlatPageCoordinates(); // Refresh coordinates when entering the list
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
      const card = cards[index];
      cards.forEach((c, idx) => {
        if (idx !== index) c.classList.remove('hovered');
      });
      card.classList.add('hovered');

      const src = card.dataset.image;
      if (!src || index === activeCardIndex) return;
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
      const offsetY = 110;

      if (window.innerWidth - rawMouseX < previewWidth + offsetX + 20) {
        targetX = rawMouseX - previewWidth - offsetX;
      } else {
        targetX = rawMouseX + offsetX;
      }
      targetY = gsap.utils.clamp(20, window.innerHeight - previewHeight - 20, rawMouseY - offsetY);
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

    // RAF Animation Loop
    let curX1 = 0, curY1 = 0;
    let curX2 = 0, curY2 = 0;
    let firstMove = true;

    (function animateHover() {
      if (forceVisible) {
        targetX = window.innerWidth * 0.65;
        targetY = window.innerHeight * 0.38;
      }

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
        workList.style.transform = `rotateY(${currentWorkListY}deg) rotateX(${currentWorkListX}deg) rotateZ(${currentWorkListZ}deg)`;
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

        // Rotations at the base tilt angles (makes hit-test static and prevents boundary jitter)
        const radY = baseY * Math.PI / 180;
        const radX = baseX * Math.PI / 180;
        const radZ = baseZ * Math.PI / 180;

        function projectPoint(pageX, pageY) {
          const vx = pageX - scrollX;
          const vy = pageY - scrollY;
          const x0 = vx - originX;
          const y0 = vy - originY;
          const z0 = 0;

          // Rotations
          const x1 = x0 * Math.cos(radZ) - y0 * Math.sin(radZ);
          const y1 = x0 * Math.sin(radZ) + y0 * Math.cos(radZ);

          const y2 = y1 * Math.cos(radX);
          const z2 = y1 * Math.sin(radX);

          const x3 = x1 * Math.cos(radY) + z2 * Math.sin(radY);
          const z3 = -x1 * Math.sin(radY) + z2 * Math.cos(radY);

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
          currentX = targetX;
          currentY = targetY;
          currentOrangeX = targetX + 12;
          currentOrangeY = targetY + 12;
          currentTiltX = previewBaseX;
          currentTiltY = previewBaseY;
          currentTiltZ = previewBaseZ;
          currentOrangeTiltX = previewBaseX;
          currentOrangeTiltY = previewBaseY;
          currentOrangeTiltZ = previewBaseZ;
          firstMove = false;
        }

        // 1. LERP image container (less delay: 0.055 LERP factor)
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        currentX += dx * 0.055;
        currentY += dy * 0.055;

        // 2. LERP orange layer (more delay: 0.035 LERP factor, target offset to bottom-right)
        const targetOrangeX = targetX + 12;
        const targetOrangeY = targetY + 12;
        const dxOrange = targetOrangeX - currentOrangeX;
        const dyOrange = targetOrangeY - currentOrangeY;
        currentOrangeX += dxOrange * 0.035;
        currentOrangeY += dyOrange * 0.035;

        currentScale += (targetScale - currentScale) * 0.07;

        if (currentScale < 0.02 && hoveredCardIndex === -1 && activeImages.length > 0) {
          activeImages.forEach(img => img.el.remove());
          activeImages = [];
          imgContainer.innerHTML = '';
        }
        
        // Calculate target 3D tilts for image container (based on its dx/dy velocity + base preview tilt)
        let targetTiltY = previewBaseY + gsap.utils.clamp(-clampYMax, clampYMax, dx * 0.06);
        let targetTiltX = previewBaseX + gsap.utils.clamp(-clampXMax, clampXMax, -dy * 0.06);
        let targetTiltZ = previewBaseZ + gsap.utils.clamp(-clampZMax, clampZMax, dx * 0.02);

        // Smoothly LERP image tilts with more delay (0.02 LERP factor)
        currentTiltX += (targetTiltX - currentTiltX) * 0.02;
        currentTiltY += (targetTiltY - currentTiltY) * 0.02;
        currentTiltZ += (targetTiltZ - currentTiltZ) * 0.02;

        // Calculate target 3D tilts for orange layer (consistent with the image, based on dx/dy velocity + base preview tilt)
        let targetOrangeTiltY = previewBaseY + gsap.utils.clamp(-clampYMax, clampYMax, dx * 0.06);
        let targetOrangeTiltX = previewBaseX + gsap.utils.clamp(-clampXMax, clampXMax, -dy * 0.06);
        let targetOrangeTiltZ = previewBaseZ + gsap.utils.clamp(-clampZMax, clampZMax, dx * 0.02);

        // Smoothly LERP orange layer tilts with even more delay (0.012 LERP factor)
        currentOrangeTiltX += (targetOrangeTiltX - currentOrangeTiltX) * 0.012;
        currentOrangeTiltY += (targetOrangeTiltY - currentOrangeTiltY) * 0.012;
        currentOrangeTiltZ += (targetOrangeTiltZ - currentOrangeTiltZ) * 0.012;

        // Apply transform to image container (on top, z-index: 2)
        gsap.set(imgContainer, {
          x: currentX,
          y: currentY,
          scale: currentScale,
          rotationY: currentTiltY,
          rotationX: currentTiltX,
          rotation: currentTiltZ,
          transformPerspective: 1000,
          force3D: true
        });

        // Apply transform to orange background shadow layer (underneath, z-index: 1)
        // Offset to the bottom-left is driven by currentOrangeX/Y LERP coordinates
        gsap.set(orangeLayer, {
          x: currentOrangeX,
          y: currentOrangeY,
          scale: currentScale,
          rotationY: currentOrangeTiltY * 0.8, // Slightly less tilt for parallax depth
          rotationX: currentOrangeTiltX * 0.8,
          rotation: currentOrangeTiltZ * 0.8,
          transformPerspective: 1000,
          force3D: true
        });
      } else {
        firstMove = true;
      }
      requestAnimationFrame(animateHover);
    })();

    // === TEMPORARY ANGLE ADJUSTER PANEL ===
    function createAdjusterPanel() {
      console.log('[3D PREVIEW ONLY ADJUSTER V3] Initializing decoupled panel.');

      // Inject CSS style to restore native cursor on adjuster panel and hide custom cursor when hovered
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        body .work-preview-adjuster-panel,
        body .work-preview-adjuster-panel * {
          cursor: auto !important;
        }
        .work-preview-adjuster-panel:hover ~ #cursorDot,
        .work-preview-adjuster-panel:hover ~ #cursorTrail1 {
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(styleEl);

      const panel = document.createElement('div');
      panel.className = 'work-preview-adjuster-panel';
      panel.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 99999;
        width: 320px;
        background: rgba(13, 13, 15, 0.92);
        border: 1px solid rgba(82, 196, 26, 0.35);
        border-radius: 12px;
        padding: 20px;
        color: #fff;
        font-family: 'Google Sans', sans-serif;
        font-size: 12px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        gap: 14px;
        user-select: none;
      `;

      const title = document.createElement('div');
      title.innerText = '3D PREVIEW ONLY ADJUSTER (V3)';
      title.style.cssText = 'font-weight: bold; letter-spacing: 0.1em; color: #52c41a; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;';
      panel.appendChild(title);

      const subtitle = document.createElement('div');
      subtitle.innerText = '⚠️ ONLY TUNES HOVER PREVIEW | CARD ROTATION IS STATIC';
      subtitle.style.cssText = 'font-size: 9px; color: rgba(255,255,255,0.5); font-weight: normal; margin-bottom: 8px; line-height: 1.2;';
      panel.appendChild(subtitle);

      const sliders = [
        { label: 'Preview Base Y Rotation (rotateY)', min: -90, max: 90, val: previewBaseY, step: 1, key: 'previewBaseY' },
        { label: 'Preview Base X Rotation (rotateX)', min: -90, max: 90, val: previewBaseX, step: 1, key: 'previewBaseX' },
        { label: 'Preview Base Z Rotation (rotateZ)', min: -90, max: 90, val: previewBaseZ, step: 1, key: 'previewBaseZ' },
        { label: 'Max Mouse Y-Tilt (X-rotation)', min: 0, max: 45, val: clampXMax, step: 1, key: 'clampXMax' },
        { label: 'Max Mouse X-Tilt (Y-rotation)', min: 0, max: 45, val: clampYMax, step: 1, key: 'clampYMax' },
        { label: 'Max Mouse Z-Tilt (Z-rotation)', min: 0, max: 30, val: clampZMax, step: 1, key: 'clampZMax' }
      ];

      const sliderInputs = {};

      sliders.forEach(s => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; color: rgba(255,255,255,0.7); font-size: 11px;';
        
        const labelEl = document.createElement('span');
        labelEl.innerText = s.label;
        const valEl = document.createElement('span');
        valEl.innerText = s.val;
        valEl.style.color = '#52c41a';
        
        header.appendChild(labelEl);
        header.appendChild(valEl);
        row.appendChild(header);

        const input = document.createElement('input');
        input.type = 'range';
        input.min = s.min;
        input.max = s.max;
        input.step = s.step;
        input.value = s.val;
        input.style.cssText = 'width: 100%; accent-color: #52c41a; background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; outline: none; border: none; cursor: pointer;';
        
        input.addEventListener('input', (e) => {
          const v = parseFloat(e.target.value);
          valEl.innerText = v;
          if (s.key === 'previewBaseX') previewBaseX = v;
          else if (s.key === 'previewBaseY') previewBaseY = v;
          else if (s.key === 'previewBaseZ') previewBaseZ = v;
          else if (s.key === 'clampXMax') clampXMax = v;
          else if (s.key === 'clampYMax') clampYMax = v;
          else if (s.key === 'clampZMax') clampZMax = v;
        });

        row.appendChild(input);
        panel.appendChild(row);
        sliderInputs[s.key] = input;
      });

      // Force Visible Toggle
      const forceRow = document.createElement('div');
      forceRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-top: 4px;';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = forceVisible;
      checkbox.style.cssText = 'accent-color: #52c41a; cursor: pointer;';
      checkbox.addEventListener('change', (e) => {
        forceVisible = e.target.checked;
        if (forceVisible) {
          isVisible = true;
          if (activeImages.length === 0 && cards.length > 0) {
            onCardEnter(0);
          }
          showPreviewDOM();
        } else {
          forceVisible = false;
          onListLeave();
        }
      });
      const forceLabel = document.createElement('label');
      forceLabel.innerText = 'Lock Preview Visible';
      forceLabel.style.cssText = 'cursor: pointer; font-size: 11px; color: rgba(255,255,255,0.8);';
      forceRow.appendChild(checkbox);
      forceRow.appendChild(forceLabel);
      panel.appendChild(forceRow);

      // Copy Button
      const copyBtn = document.createElement('button');
      copyBtn.innerText = 'COPY PARAMETERS';
      copyBtn.style.cssText = `
        background: #52c41a;
        border: none;
        border-radius: 6px;
        color: #000;
        font-weight: bold;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 8px;
        font-family: inherit;
        font-size: 11px;
        letter-spacing: 0.05em;
      `;
      copyBtn.addEventListener('mouseenter', () => copyBtn.style.background = '#73d13d');
      copyBtn.addEventListener('mouseleave', () => copyBtn.style.background = '#52c41a');
      copyBtn.addEventListener('click', () => {
        const config = {
          previewBaseX: previewBaseX,
          previewBaseY: previewBaseY,
          previewBaseZ: previewBaseZ,
          clampXMax: clampXMax,
          clampYMax: clampYMax,
          clampZMax: clampZMax
        };
        navigator.clipboard.writeText(JSON.stringify(config, null, 2)).then(() => {
          copyBtn.innerText = 'COPIED TO CLIPBOARD!';
          copyBtn.style.background = '#389e0d';
          copyBtn.style.color = '#fff';
          setTimeout(() => {
            copyBtn.innerText = 'COPY PARAMETERS';
            copyBtn.style.background = '#52c41a';
            copyBtn.style.color = '#000';
          }, 1500);
        });
      });
      panel.appendChild(copyBtn);

      document.body.appendChild(panel);
    }

    // Call panel creation and force show on startup
    setTimeout(() => {
      createAdjusterPanel();
      if (forceVisible) {
        isVisible = true;
        if (activeImages.length === 0 && cards.length > 0) {
          onCardEnter(0);
        }
        showPreviewDOM();
      }
    }, 100);
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
