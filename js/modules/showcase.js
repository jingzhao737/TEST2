import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function initShowcase() {
  const items = gsap.utils.toArray('.showcase-text-item');
  const section = document.querySelector('.showcase');
  const wrapper = document.querySelector('.showcase-layout-wrapper');

  if (!items.length || !section || !wrapper) return;

  const N = items.length;
  const isMobile = window.innerWidth <= 768;

  // ── 1. Clean up stale classes and structures ──────────────────
  section.classList.remove('is-cinematic');
  const header = section.querySelector('.showcase-header');
  if (header) {
    header.classList.remove('is-cinematic');
  }

  // ── 2. Inject global UI into sticky zone ──────────────────────
  const stickyZone = document.querySelector('.showcase-right-sticky-zone');
  if (stickyZone) {
    // Rolling digit pager
    const pager = document.createElement('div');
    pager.className = 'showcase-global-ticker';
    pager.innerHTML = `
      <div class="ticker-digit-wrap">
        <div class="ticker-digit-track">
          ${items.map((_, i) => `<div class="ticker-digit">${String(i + 1).padStart(2, '0')}</div>`).join('')}
        </div>
      </div>
      <div class="ticker-sep">/</div>
      <div class="ticker-total">${String(N).padStart(2, '0')}</div>
    `;
    stickyZone.appendChild(pager);

    // Vertical progress bar (desktop only)
    let progressFill = null;
    if (!isMobile) {
      const bar = document.createElement('div');
      bar.className = 'showcase-global-progress';
      bar.innerHTML = '<div class="showcase-global-progress-fill"></div>';
      stickyZone.appendChild(bar);
      progressFill = bar.querySelector('.showcase-global-progress-fill');
    }

    // ── 3. Image switching function with diagonal clip-path ──
    const imgContainer = document.querySelector('.showcase-sticky-preview-img-container');
    const curtain = document.querySelector('.showcase-sticky-preview-curtain');
    const tickerTrack = pager.querySelector('.ticker-digit-track');

    function changePreviewImage(idx, src) {
      if (!imgContainer || !curtain) return;

      const newImg = document.createElement('img');
      newImg.className = 'showcase-sticky-preview-img';
      newImg.src = src;

      const currentImgs = imgContainer.querySelectorAll('.showcase-sticky-preview-img');
      if (currentImgs.length === 0) {
        // First load: place image directly
        newImg.style.clipPath = 'none';
        imgContainer.appendChild(newImg);
      } else {
        // Slide transition: push new image on top and animate clip-path
        imgContainer.appendChild(newImg);

        // Reset positions
        gsap.set(newImg, {
          clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
          y: 40,
          scale: 1.06
        });
        gsap.set(curtain, {
          clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
          scale: 1.06
        });

        // Animate curtain
        gsap.to(curtain, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          scale: 1,
          duration: 0.5,
          ease: 'power3.out'
        });

        // Animate image
        gsap.to(newImg, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'expo.out',
          delay: 0.05,
          onComplete: () => {
            // Remove old image to clean DOM
            const imgsAfter = imgContainer.querySelectorAll('.showcase-sticky-preview-img');
            if (imgsAfter.length > 1) {
              for (let i = 0; i < imgsAfter.length - 1; i++) {
                imgsAfter[i].remove();
              }
            }
          }
        });
      }

      // Update pager
      if (tickerTrack) {
        gsap.to(tickerTrack, {
          y: -(idx * 1.2) + 'em',
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    }

    // ── 4. Setup ScrollTrigger for active card detection ─────────
    let activeIndex = -1;
    items.forEach((item, index) => {
      const src = item.dataset.image;
      ScrollTrigger.create({
        trigger: item,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive && activeIndex !== index) {
            activeIndex = index;
            changePreviewImage(index, src);
          }
        }
      });
    });

    // ── 5. Setup ScrollTrigger for velocity 3D deformation ─────
    const card = document.querySelector('.showcase-sticky-preview-card');
    
    let targetScrollRotX = 0;
    let currentScrollRotX = 0;
    
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        // Sync progress bar
        if (progressFill) {
          progressFill.style.height = `${self.progress * 100}%`;
        }

        // Calculate velocity-based tilt
        const velocity = self.getVelocity(); // pixels/sec
        const maxVel = 3000;
        const normVel = gsap.utils.clamp(-maxVel, maxVel, velocity);
        targetScrollRotX = -(normVel / maxVel) * 12; // max 12 deg tilt
      }
    });

    // ── 6. Setup Mouse Move 3D Parallax (Desktop only) ───────────
    let targetMouseX = 0, targetMouseY = 0;
    let currentMouseX = 0, currentMouseY = 0;

    if (!isMobile && card) {
      wrapper.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const dx = e.clientX - cardCenterX;
        const dy = e.clientY - cardCenterY;

        // Convert offset to rotation angle
        targetMouseY = (dx / (window.innerWidth / 2)) * 14;
        targetMouseX = -(dy / (window.innerHeight / 2)) * 14;
      });

      wrapper.addEventListener('mouseleave', () => {
        targetMouseX = 0;
        targetMouseY = 0;
      });
    }

    // ── 7. Unified Physics LERP Animation Loop ───────────────────
    function updateCardPhysics() {
      // Smooth LERP for mouse rotation
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Smooth LERP for scroll rotation
      currentScrollRotX += (targetScrollRotX - currentScrollRotX) * 0.08;

      // Decay scroll rotation target back to 0 when scroll stops
      targetScrollRotX *= 0.92;

      if (card) {
        gsap.set(card, {
          rotationX: currentMouseX + currentScrollRotX,
          rotationY: currentMouseY,
          skewY: currentScrollRotX * 0.12,
          scale: 1 - Math.abs(currentScrollRotX) * 0.004,
          overwrite: 'auto'
        });
      }

      requestAnimationFrame(updateCardPhysics);
    }
    
    // Start physics loop
    requestAnimationFrame(updateCardPhysics);
  }
}

// Initialize on load
initShowcase();
window.addEventListener('resize', () => {
  // Simple refresh of ScrollTriggers on window resize
  ScrollTrigger.refresh();
});
