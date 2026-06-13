import gsap from 'gsap';

// Singleton Hover Preview
const isMobileDevice = ('ontouchstart' in window) || (window.innerWidth <= 1024);

if (!isMobileDevice) {
  // === DESKTOP HOVER PREVIEW (MOUSE FOLLOW) ===
  const workList = document.querySelector('.work-list');
  const cards = document.querySelectorAll('.work-card');
  console.log('Premium Interactions JS Initialized (Desktop).', !!workList, cards.length);

  if (workList && cards.length > 0) {
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

    // Native hover state tracking and event bindings
    function onListEnter() {
      isVisible = true;
      firstMove = true;
    }

    function onListLeave() {
      isVisible = false;
      activeSrc = null;
      hoveredCardIndex = -1;
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
      if (window.__worksWebGL && window.__worksWebGL.isActive) {
        window.__worksWebGL.hidePreview();
      }
    }

    function onCardEnter(index) {
      const card = cards[index];
      cards.forEach((c, idx) => {
        if (idx !== index) c.classList.remove('hovered');
      });
      card.classList.add('hovered');
      const src = card.dataset.image;
      if (src && src !== activeSrc) {
        activeSrc = src;
        const rect = {
          left: curX2 || targetX,
          top: curY2 || targetY,
          width: 200,
          height: 138
        };
        if (window.__worksWebGL && window.__worksWebGL.isActive) {
          window.__worksWebGL.showPreview(src, rect);
        }
      }
    }

    // Set up native mouse listeners on the static works container
    const worksEl = document.querySelector('.works');
    if (worksEl) {
      worksEl.addEventListener('mouseenter', onListEnter);
      worksEl.addEventListener('mouseleave', onListLeave);
    }

    // Set up native mouse/pointer listeners on individual cards
    cards.forEach((card, index) => {
      card.addEventListener('pointerenter', () => {
        if (!isVisible) {
          onListEnter();
        }
        hoveredCardIndex = index;
        onCardEnter(index);
      });

      card.addEventListener('pointerleave', () => {
        card.classList.remove('hovered');
        card.style.removeProperty('--card-mouse-x');
        card.style.removeProperty('--card-mouse-y');
        
        setTimeout(() => {
          if (hoveredCardIndex === -1) {
            activeSrc = null;
            if (window.__worksWebGL && window.__worksWebGL.isActive) {
              window.__worksWebGL.hidePreview();
            }
          }
        }, 0);
        
        if (hoveredCardIndex === index) {
          hoveredCardIndex = -1;
        }
      });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const localX = ((e.clientX - rect.left) / rect.width) * 100;
        const localY = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--card-mouse-x', `${localX}%`);
        card.style.setProperty('--card-mouse-y', `${localY}%`);
      });
    });

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

    // RAF Animation Loop (Tilt and WebGL Follow only)
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

      // ── STEP 3: Animate preview thumbnail follow via WebGL ──
      if (isVisible && hoveredCardIndex >= 0) {
        if (firstMove) {
          curX2 = targetX; curY2 = targetY;
          firstMove = false;
        }

        let dx2 = targetX - curX2, dy2 = targetY - curY2;
        curX2 += dx2 * 0.06; curY2 += dy2 * 0.06;
        let tiltY2 = gsap.utils.clamp(-18, 18, dx2 * 0.06);
        let tiltX2 = gsap.utils.clamp(-18, 18, -dy2 * 0.06);
        let tiltZ2 = gsap.utils.clamp(-6, 6, dx2 * 0.018);

        if (window.__worksWebGL && window.__worksWebGL.isActive) {
          const rect = {
            left: curX2,
            top: curY2,
            width: 200,
            height: 138
          };
          window.__worksWebGL.updatePreviewRect(rect, tiltX2, tiltY2, tiltZ2);
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
