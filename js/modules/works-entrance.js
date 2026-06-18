import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const cards = gsap.utils.toArray('.work-card');
const section = document.querySelector('.works');

if (cards.length && section) {
  const cardData = [];
  let animationStarted = false;
  let animationCompleted = false;

  // Measure static coordinates relative to the document
  function measureCards() {
    if (animationCompleted) return;

    // Save current scroll to restore later (so we can measure clean positions)
    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

    // Save current transform/opacity/filter inline values to restore after measurement
    const originalStyles = cards.map(card => ({
      transform: card.style.transform,
      opacity: card.style.opacity,
      filter: card.style.filter
    }));

    // Temporarily clear inline GSAP transform/opacity styles to read natural layout
    cards.forEach(card => {
      gsap.set(card, { clearProps: 'transform,opacity,filter' });
    });

    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      cardData[idx] = {
        element: card,
        pageLeft: rect.left + currentScrollX,
        pageTop: rect.top + currentScrollY,
        width: rect.width,
        height: rect.height
      };
    });

    // Restore original styles
    cards.forEach((card, idx) => {
      const styles = originalStyles[idx];
      gsap.set(card, {
        transform: styles.transform,
        opacity: styles.opacity,
        filter: styles.filter
      });
    });

    // Re-hide cards after measurement ONLY if the animation hasn't started yet
    if (!animationStarted) {
      cards.forEach(card => {
        gsap.set(card, { opacity: 0 });
      });
    }
  }

  // Initial measurement
  measureCards();

  // Re-measure on window load and window resize
  window.addEventListener('load', measureCards);
  window.addEventListener('resize', measureCards);

  function startEntranceAnimation() {
    if (animationStarted) return;
    animationStarted = true;

    // Re-measure at the moment of trigger (since layout is final now)
    measureCards();

    const tl = gsap.timeline({
      onComplete: () => {
        animationCompleted = true;
        window.removeEventListener('load',   measureCards);
        window.removeEventListener('resize', measureCards);

        // Clear inline GSAP styles — hand back to CSS (hover effects, 3D transform, etc.)
        cards.forEach(card => gsap.set(card, { clearProps: 'all' }));

        if (typeof window.__recalculateWorksCoordinates === 'function') {
          window.__recalculateWorksCoordinates();
        }
      }
    });

    cards.forEach((card, idx) => {
      const animState = { progress: 0 };

      tl.to(animState, {
        progress: 1,
        duration: 1.6,
        ease: 'elastic.out(1, 0.75)',

        onStart() {
          gsap.set(card, { opacity: 0.01 });
        },

        onUpdate() {
          const data = cardData[idx];
          if (!data) return;

          const p = animState.progress;

          // Dynamic starting offset from off-screen
          const startX = window.scrollX - data.pageLeft - data.width  * 2.0;
          const startY = window.scrollY - data.pageTop  - data.height * 2.0;

          // Arc: perpendicular vector for sweeping curve
          const dx   = -startX;
          const dy   = -startY;
          const dist = Math.hypot(dx, dy) || 1;
          const px   = -dy / dist;
          const py   =  dx / dist;

          const maxBulge = window.innerWidth > 768 ? 320 : 120;

          const baseX = gsap.utils.interpolate(startX, 0, p);
          const baseY = gsap.utils.interpolate(startY, 0, p);
          const bulge = Math.sin(p * Math.PI) * maxBulge;

          gsap.set(card, {
            x:            baseX + px * bulge,
            y:            baseY + py * bulge,
            scale:        gsap.utils.interpolate(4.5, 1.0, p),
            rotation:     gsap.utils.interpolate(-60, 0, p),
            opacity:      gsap.utils.interpolate(0, 1, p),
            filter:       `blur(${gsap.utils.interpolate(15, 0, p)}px)`,
            pointerEvents: p > 0.82 ? 'auto' : 'none',
          });
        },

        onComplete() {
          gsap.set(card, { clearProps: 'all' });
          if (typeof window.__recalculateWorksCoordinates === 'function') {
            window.__recalculateWorksCoordinates();
          }
        },
      }, idx * 0.16); // stagger cards
    });
  }

  // ── Trigger setup: Event-driven on desktop, ScrollTrigger-driven on mobile ──
  if (window.innerWidth > 768) {
    window.addEventListener('works-cinema-complete', startEntranceAnimation);
    window.addEventListener('works-cinema-reset', () => {
      animationStarted = false;
      animationCompleted = false;
      gsap.killTweensOf(cards);
      cards.forEach(card => gsap.set(card, { clearProps: 'all', opacity: 0 }));
    });
  } else {
    // Mobile fallback: trigger immediately on scroll
    ScrollTrigger.create({
      trigger: '#work',
      start: 'top 85%',
      toggleActions: 'play none none none',
      onEnter: startEntranceAnimation
    });
  }
}
