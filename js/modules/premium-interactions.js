import gsap from 'gsap';

// Singleton Hover Preview
const isMobileDevice = ('ontouchstart' in window) || (window.innerWidth <= 768);

if (!isMobileDevice) {
  // === DESKTOP HOVER PREVIEW (MOUSE FOLLOW) ===
  const workList = document.querySelector('.work-list');
  const cards = document.querySelectorAll('.work-card');
  console.log('Premium Interactions JS Initialized (Desktop).', !!workList, cards.length);
  
  if (workList && cards.length > 0) {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    let isVisible = false;
    let activeSrc = null;

    // Singleton DOM
    const wrapper = document.createElement('div');
    wrapper.className = 'work-preview-wrapper';
    
    const curtain = document.createElement('div');
    curtain.className = 'work-preview-curtain';
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'work-preview-img-container';
    
    wrapper.appendChild(curtain);
    wrapper.appendChild(imgContainer);
    document.body.appendChild(wrapper);
    
    // Initial State
    gsap.set(wrapper, { autoAlpha: 0 });
    gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
    gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 14, x: 16, rotationX: -15 }); 
    
    // List Enter
    workList.addEventListener('mouseenter', () => {
      isVisible = true;
      firstMove = true;
      
      gsap.killTweensOf([wrapper, curtain, imgContainer]);
      
      gsap.to(wrapper, { autoAlpha: 1, duration: 0.15, overwrite: true });
      gsap.to(curtain, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', y: 0, rotationX: 0, duration: 0.6, ease: 'expo.out', overwrite: true });
      gsap.to(imgContainer, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', y: -16, x: 16, rotationX: 0, duration: 0.6, ease: 'expo.out', delay: 0.15, overwrite: true });
    });
    
    // List Leave
    workList.addEventListener('mouseleave', () => {
      isVisible = false;
      activeSrc = null;
      
      gsap.killTweensOf([wrapper, curtain, imgContainer]);
      
      gsap.to(wrapper, { autoAlpha: 0, duration: 0.2, delay: 0.4, overwrite: true, onComplete: () => {
        gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
        gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 14, x: 16, rotationX: -15 });
        imgContainer.innerHTML = '';
      }});
      gsap.to(curtain, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', y: -30, rotationX: 15, duration: 0.5, ease: 'expo.out', overwrite: true });
      gsap.to(imgContainer, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', y: -46, x: 16, rotationX: 15, duration: 0.5, ease: 'expo.out', delay: 0.1, overwrite: true });
    });
    
    // Mouse Move (Bind to window so it keeps tracking during exit animation)
    window.addEventListener('mousemove', (e) => {
      const previewWidth = 200;
      const previewHeight = 138;
      const offsetX = 30;
      const offsetY = 110; // Shift the preview upward so it is positioned more towards the top-right of the cursor

      // Handle horizontal position with edge detection
      if (window.innerWidth - e.clientX < previewWidth + offsetX + 20) {
        // If not enough space on the right, show on the left
        targetX = e.clientX - previewWidth - offsetX;
      } else {
        // Otherwise show on the right
        targetX = e.clientX + offsetX;
      }

      // Handle vertical position with viewport boundary clamping
      targetY = gsap.utils.clamp(20, window.innerHeight - previewHeight - 20, e.clientY - offsetY);
    });
    
    // RAF Animation Loop
    let curX1 = 0, curY1 = 0;
    let curX2 = 0, curY2 = 0;
    let firstMove = true;
    
    (function animateHover() {
      if (isVisible || gsap.getProperty(wrapper, "opacity") > 0.01) {
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
          gsap.set(curtain, { 
            left: curX1, top: curY1, 
            transformPerspective: 1000, 
            rotationY: tiltY1, 
            rotationX: tiltX1, 
            rotation: tiltZ1 
          });
          gsap.set(imgContainer, { 
            left: curX2, top: curY2, 
            transformPerspective: 1000, 
            rotationY: tiltY2, 
            rotationX: tiltX2, 
            rotation: tiltZ2 
          });
        } else {
          // During exit animation, only track position, let GSAP handle the rotations and clipPath
          gsap.set(curtain, { left: curX1, top: curY1 });
          gsap.set(imgContainer, { left: curX2, top: curY2 });
        }
      } else {
        firstMove = true;
      }
      requestAnimationFrame(animateHover);
    })();
    
    // Card Hover
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        const src = card.dataset.image;
        if (src && src !== activeSrc) {
          activeSrc = src;
          const newImg = document.createElement('img');
          newImg.className = 'work-preview-img';
          newImg.src = src;
          
          const hasExistingImg = imgContainer.querySelectorAll('.work-preview-img').length > 0;
          
          if (!hasExistingImg) {
            // First time entry: image starts fully visible, container handles the transition mask
            gsap.set(newImg, { clipPath: 'none', y: 0, rotationX: 0 });
            imgContainer.appendChild(newImg);
          } else {
            // Card switching: transition the new image to cover the old one
            gsap.set(newImg, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
            imgContainer.appendChild(newImg);
            
            gsap.to(newImg, {
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              y: 0,
              rotationX: 0,
              duration: 0.6,
              ease: 'expo.out',
              overwrite: 'auto',
              onComplete: () => {
                const imgs = imgContainer.querySelectorAll('.work-preview-img');
                if (imgs.length > 1) {
                  for (let i = 0; i < imgs.length - 1; i++) {
                    imgs[i].remove();
                  }
                }
              }
            });
          }
        }
      });
    });
  }
} else {
  // === MOBILE SCROLL PREVIEW (SCROLL TILT & AUTO SWITCH) ===
  const workList = document.querySelector('.work-list');
  const cards = document.querySelectorAll('.work-card');
  console.log('Premium Interactions JS Initialized (Mobile Scroll).', !!workList, cards.length);
  
  if (workList && cards.length > 0) {
    let activeSrc = null;
    let isVisible = false;
    
    // Create Mobile DOM
    const wrapper = document.createElement('div');
    wrapper.className = 'work-preview-wrapper mobile-preview';
    
    const curtain = document.createElement('div');
    curtain.className = 'work-preview-curtain mobile-curtain';
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'work-preview-img-container mobile-img-container';
    
    wrapper.appendChild(curtain);
    wrapper.appendChild(imgContainer);
    document.body.appendChild(wrapper);
    
    // Initial State
    gsap.set(wrapper, { autoAlpha: 0 });
    gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' });
    gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' });
    
    // Intersection Observer to show/hide the floating mobile preview container
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible = true;
          gsap.killTweensOf([wrapper, curtain, imgContainer]);
          gsap.to(wrapper, { autoAlpha: 1, duration: 0.3, overwrite: true });
          gsap.to(curtain, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.5, ease: 'power2.out', overwrite: true });
          gsap.to(imgContainer, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.5, ease: 'power2.out', delay: 0.1, overwrite: true });
        } else {
          isVisible = false;
          activeSrc = null;
          gsap.killTweensOf([wrapper, curtain, imgContainer]);
          gsap.to(wrapper, { autoAlpha: 0, duration: 0.3, overwrite: true });
          gsap.to(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', duration: 0.4, ease: 'power2.in', overwrite: true });
          gsap.to(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', duration: 0.4, ease: 'power2.in', overwrite: true });
        }
      });
    }, { threshold: 0.05, rootMargin: '-10% 0px -10% 0px' });
    
    observer.observe(workList);
    
    // Scroll tracking for active card and velocity-based deformation
    let lastScrollY = window.scrollY;
    let scrollVel = 0;
    let currentVel = 0;
    
    window.addEventListener('scroll', () => {
      let curScrollY = window.scrollY;
      scrollVel = curScrollY - lastScrollY;
      lastScrollY = curScrollY;
      
      if (!isVisible) return;
      
      // Find the card closest to the active zone (45% viewport height)
      let activeZoneY = window.innerHeight * 0.45;
      let closestCard = null;
      let minDistance = Infinity;
      
      cards.forEach(card => {
        let rect = card.getBoundingClientRect();
        let cardCenterY = rect.top + rect.height / 2;
        let distance = Math.abs(cardCenterY - activeZoneY);
        if (distance < minDistance) {
          minDistance = distance;
          closestCard = card;
        }
      });
      
      // Update image if card changes
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
            imgContainer.appendChild(newImg);
          } else {
            // Premium sliding clip-path switch animation
            gsap.set(newImg, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 20 });
            imgContainer.appendChild(newImg);
            
            gsap.to(newImg, {
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              y: 0,
              duration: 0.5,
              ease: 'power3.out',
              overwrite: 'auto',
              onComplete: () => {
                const imgs = imgContainer.querySelectorAll('.work-preview-img');
                if (imgs.length > 1) {
                  for (let i = 0; i < imgs.length - 1; i++) {
                    imgs[i].remove();
                  }
                }
              }
            });
          }
        }
      }
    }, { passive: true });
    
    // Animation loop for scroll deformation (squash & stretch + tilt)
    (function animateMobilePreview() {
      if (isVisible || gsap.getProperty(wrapper, "opacity") > 0.01) {
        currentVel += (scrollVel - currentVel) * 0.08; // Lerp velocity
        scrollVel *= 0.88; // Decay velocity
        
        // Deformations: rotationX (tilt), skewY, and scaleY (stretch)
        let tiltX = gsap.utils.clamp(-25, 25, currentVel * 0.18);
        let skewY = gsap.utils.clamp(-10, 10, currentVel * 0.04);
        let scaleY = 1 + gsap.utils.clamp(0, 0.2, Math.abs(currentVel) * 0.003);
        let scaleX = 1 - gsap.utils.clamp(0, 0.08, Math.abs(currentVel) * 0.001); // Squash X slightly to preserve volume
        
        gsap.set(curtain, {
          transformPerspective: 800,
          rotationX: tiltX,
          skewY: skewY,
          scaleY: scaleY,
          scaleX: scaleX
        });
        
        gsap.set(imgContainer, {
          transformPerspective: 800,
          rotationX: tiltX,
          skewY: skewY,
          scaleY: scaleY,
          scaleX: scaleX
        });
      }
      
      requestAnimationFrame(animateMobilePreview);
    })();
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
        // Organic LERP delay factor
        currentX += (targetX - currentX) * 0.045;
        currentY += (targetY - currentY) * 0.045;
        glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(animateGlow);
    })();
  }
})();
