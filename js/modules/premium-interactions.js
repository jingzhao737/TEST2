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
    let isVisible = false;
    let activeSrc = null;

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

    const curtain = document.createElement('div');
    curtain.className = 'work-preview-curtain';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'work-preview-img-container';

    // Two persistent image layers for smooth crossfade between cards
    const imgLayerA = document.createElement('img');
    imgLayerA.className = 'work-preview-img';
    const imgLayerB = document.createElement('img');
    imgLayerB.className = 'work-preview-img';
    gsap.set(imgLayerB, { opacity: 0 });

    imgContainer.appendChild(imgLayerA);
    imgContainer.appendChild(imgLayerB);
    wrapper.appendChild(curtain);
    wrapper.appendChild(imgContainer);
    document.body.appendChild(wrapper);

    // Track which layer is currently visible vs incoming
    let currentLayer = imgLayerA;
    let nextLayer = imgLayerB;

    // Initial State
    gsap.set(wrapper, { autoAlpha: 0 });
    gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
    gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 14, x: 16, rotationX: -15 });

    // Apply initial 3D tilt transform to workList so it aligns with starting coordinates on load
    workList.style.transform = `rotateY(${baseY}deg) rotateX(${baseX}deg) rotateZ(${baseZ}deg)`;

    let isPreviewActive = false; // Track if the preview wrapper is physically faded in

    function showPreviewDOM() {
      gsap.killTweensOf([curtain, imgContainer]);
      gsap.to(curtain, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', y: 0, rotationX: 0, duration: 0.6, ease: 'expo.out', overwrite: true });
      gsap.to(imgContainer, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', y: 0, x: 0, rotationX: 0, duration: 0.6, ease: 'expo.out', delay: 0.15, overwrite: true });

      if (isPreviewActive) return;
      isPreviewActive = true;
      gsap.killTweensOf(wrapper);
      gsap.to(wrapper, { autoAlpha: 1, duration: 0.15, overwrite: true });
    }

    function hidePreviewDOM() {
      if (!isPreviewActive) return;
      isPreviewActive = false;
      activeSrc = null;
      gsap.killTweensOf([wrapper, curtain, imgContainer, imgLayerA, imgLayerB]);
      gsap.to(wrapper, { autoAlpha: 0, duration: 0.2, delay: 0.1, overwrite: true, onComplete: () => {
        gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
        gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 14, x: 16, rotationX: -15 });
        // Reset both layers for next entrance
        imgLayerA.src = ''; imgLayerB.src = '';
        gsap.set(imgLayerA, { opacity: 1 });
        gsap.set(imgLayerB, { opacity: 0 });
        currentLayer = imgLayerA;
        nextLayer = imgLayerB;
      }});
      gsap.to(curtain, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', y: -30, rotationX: 15, duration: 0.5, ease: 'expo.out', overwrite: true });
      gsap.to(imgContainer, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', y: -46, x: 16, rotationX: 15, duration: 0.5, ease: 'expo.out', delay: 0.05, overwrite: true });
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
      activeSrc = null;
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
      if (!src || src === activeSrc) return;
      activeSrc = src;

      if (!isPreviewActive) {
        // ── First show: entrance clip-path animation ──
        currentLayer.src = src;
        gsap.set(currentLayer, { opacity: 1 });
        gsap.set(nextLayer, { opacity: 0 });

        gsap.killTweensOf([curtain, imgContainer]);
        gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
        gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 14, x: 16, rotationX: -15 });
        showPreviewDOM();
      } else {
        // ── Already visible: smooth crossfade to next image ──
        nextLayer.src = src;
        gsap.killTweensOf([currentLayer, nextLayer]);
        gsap.to(nextLayer, { opacity: 1, duration: 0.28, ease: 'power2.inOut', overwrite: true });
        gsap.to(currentLayer, { opacity: 0, duration: 0.28, ease: 'power2.inOut', overwrite: true, onComplete: () => {
          currentLayer.src = '';
        }});
        // Swap layer references
        [currentLayer, nextLayer] = [nextLayer, currentLayer];
      }
    }

    // Hook section enter/leave on the works container
    if (worksEl) {
      worksEl.addEventListener('mouseenter', onListEnter);
      worksEl.addEventListener('mouseleave', onListLeave);
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

      // ── STEP 4: Animate preview thumbnail follow (Curtain + Image Container dual-layer lag) ──
      if (isVisible || gsap.getProperty(wrapper, 'opacity') > 0.01) {
        if (firstMove) {
          curX1 = targetX; curY1 = targetY;
          curX2 = targetX; curY2 = targetY;
          firstMove = false;
        }

        let dx1 = targetX - curX1, dy1 = targetY - curY1;
        curX1 += dx1 * 0.04; curY1 += dy1 * 0.04;
        let tiltY1 = gsap.utils.clamp(-15, 15, dx1 * 0.05);
        let tiltX1 = gsap.utils.clamp(-15, 15, -dy1 * 0.05);
        let tiltZ1 = gsap.utils.clamp(-5, 5, dx1 * 0.015);

        let dx2 = targetX - curX2, dy2 = targetY - curY2;
        curX2 += dx2 * 0.06; curY2 += dy2 * 0.06;
        let tiltY2 = gsap.utils.clamp(-18, 18, dx2 * 0.06);
        let tiltX2 = gsap.utils.clamp(-18, 18, -dy2 * 0.06);
        let tiltZ2 = gsap.utils.clamp(-6, 6, dx2 * 0.018);

        if (isVisible) {
          gsap.set(curtain, { left: curX1, top: curY1, transformPerspective: 1000, rotationY: tiltY1, rotationX: tiltX1, rotation: tiltZ1 });
          gsap.set(imgContainer, { left: curX2, top: curY2, transformPerspective: 1000, rotationY: tiltY2, rotationX: tiltX2, rotation: tiltZ2 });
        } else {
          gsap.set(curtain, { left: curX1, top: curY1 });
          gsap.set(imgContainer, { left: curX2, top: curY2 });
        }
      } else {
        firstMove = true;
      }

      requestAnimationFrame(animateHover);
    })();
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
