import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const cards = gsap.utils.toArray('.work-card');
  const section = document.querySelector('.works');
  if (!cards.length || !section) return;

  const cardData = [];

  // Measure static coordinates relative to the document
  function measureCards() {
    // Save current scroll to restore later (so we can measure clean positions)
    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

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

    // Re-hide cards after measurement so they don't flash in their static layout
    cards.forEach(card => {
      gsap.set(card, { opacity: 0 });
    });
  }

  // Initial measurement
  measureCards();

  // Recalculate coordinates on window resize
  window.addEventListener('resize', () => {
    measureCards();
  });

  // Create GSAP ScrollTrigger timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#work',
      start: 'top 85%', // Plays when the top of `#work` enters 85% of viewport height
      toggleActions: 'play none none none' // Play once and stay revealed
    }
  });

  // Setup flight parameters for each card
  cards.forEach((card, idx) => {
    const animState = { progress: 0 };

    tl.to(animState, {
      progress: 1,
      duration: 1.3,
      ease: 'power3.out',
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
      }
    }, idx * 0.16); // Stagger cards by 0.16s
  });
});
