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

  // Create GSAP ScrollTrigger timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#work',
      start: 'top 85%', // Plays when the top of `#work` enters 85% of viewport height
      toggleActions: 'play none none none', // Play once and stay revealed
      onEnter: () => {
        // Sync the works-header reveal with the card entrance animation.
        // In the 3D desktop layout the header may be below the IntersectionObserver
        // threshold when the ScrollTrigger fires (due to the 240px top padding),
        // causing anim-done to be added late and the header to "flash" into position
        // only after the fly-in finishes. Triggering it here eliminates the race.
        const header = document.querySelector('.works-header');
        if (header) header.classList.add('anim-done');
      }
    },
    onStart: () => {
      animationStarted = true;
    },
    onComplete: () => {
      animationCompleted = true;
      window.removeEventListener('load', measureCards);
      window.removeEventListener('resize', measureCards);

      // Recalculate coordinates for premium-interactions once all cards land
      if (typeof window.__recalculateWorksCoordinates === 'function') {
        window.__recalculateWorksCoordinates();
      }
    }
  });

  // Setup flight parameters for each card
  cards.forEach((card, idx) => {
    const animState = { progress: 0 };

    tl.to(animState, {
      progress: 1,
      duration: 1.6,
      ease: 'elastic.out(1, 0.75)',
      onStart: () => {
        // Ensure card is visible at start of tween
        gsap.set(card, { opacity: 0.01 });
      },
      onUpdate: () => {
        const data = cardData[idx];
        if (!data) return;

        const p = animState.progress;

        // Dynamic starting offset relative to current scroll position
        const startX = window.scrollX - data.pageLeft - data.width * 2.0;
        const startY = window.scrollY - data.pageTop - data.height * 2.0;

        // Direction vector from start to destination (0, 0)
        const dx = -startX;
        const dy = -startY;
        const dist = Math.hypot(dx, dy) || 1;

        // Perpendicular vector for the curve (bulge) direction
        // Bending downwards and leftwards for a nice sweeping arc
        const px = -dy / dist;
        const py = dx / dist;

        // Exaggerated curve distance
        const maxBulge = window.innerWidth > 768 ? 320 : 120;

        // Calculate current offsets
        const baseX = gsap.utils.interpolate(startX, 0, p);
        const baseY = gsap.utils.interpolate(startY, 0, p);
        const bulge = Math.sin(p * Math.PI) * maxBulge;

        const currentX = baseX + px * bulge;
        const currentY = baseY + py * bulge;

        // Interpolate scale, rotation, blur, and opacity
        const scale = gsap.utils.interpolate(4.5, 1.0, p);
        const rotate = gsap.utils.interpolate(-60, 0, p);
        const opacity = gsap.utils.interpolate(0, 1, p);
        const blur = gsap.utils.interpolate(15, 0, p);

        gsap.set(card, {
          x: currentX,
          y: currentY,
          scale: scale,
          rotation: rotate,
          opacity: opacity,
          filter: `blur(${blur}px)`,
          pointerEvents: p > 0.82 ? 'auto' : 'none' // Enable clicks/hover near completion
        });
      },
      onComplete: () => {
        // Clear GSAP inline styles to hand over styling back to CSS (hover effects, etc.)
        gsap.set(card, { clearProps: 'all' });

        // Recalculate coordinates for premium-interactions
        if (typeof window.__recalculateWorksCoordinates === 'function') {
          window.__recalculateWorksCoordinates();
        }
      }
    }, idx * 0.16); // Stagger cards by 0.16s
  });
}
