import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

if (window.innerWidth > 768) {
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
    setupWorksCinema();
  });
}

// ── WORKS: Big title rises from bottom, stays big, then cards fly in ──
function setupWorksCinema() {
  const section = document.querySelector('#work');
  if (!section) return;

  const title = section.querySelector('.works-big-title');
  if (!title) return;

  const chromaWrapper = section.querySelector('.works-chroma-wrapper');
  const cards = gsap.utils.toArray('.work-card');

  // Cards start hidden — works-entrance.js will reveal them
  gsap.set(cards, { opacity: 0, immediateRender: true });

  // Hide the chromatic blob wrapper initially
  if (chromaWrapper) {
    gsap.set(chromaWrapper, { opacity: 0, immediateRender: true });
  }

  // Title starts below viewport, opacity 0
  gsap.set(title, {
    y: '80vh',
    opacity: 0,
    immediateRender: true,
    force3D: true,
  });

  let cardsAnimated = false;

  // Timeline 1: Chroma blob fades in first, then title rises
  const tl = gsap.timeline({ paused: true });

  if (chromaWrapper) {
    tl.to(chromaWrapper, {
      opacity: 1,
      duration: 0.4,
      ease: 'power1.inOut',
    });
  }

  tl.to(title, {
    y: 0,
    opacity: 1,
    duration: 1.2,
    ease: 'cubic-bezier(0.95, 0, 0.05, 1)',
  }, '>0.25');

  // ScrollTrigger 1: Triggers the title rising animation when the section enters viewport
  ScrollTrigger.create({
    trigger: section,
    start: 'top 95%', // Starts when the section top enters the bottom 5% of viewport
    onEnter() {
      tl.play();
    },
    onLeaveBack() {
      tl.reverse();
    }
  });

  // ScrollTrigger 2: Pins the section at the top and triggers the cards fly-in
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=900', // Pin duration
    pin: true,
    pinSpacing: true,
    onEnter() {
      if (!cardsAnimated) {
        cardsAnimated = true;
        // Dispatch immediately on enter to let the cards fly in way earlier
        window.dispatchEvent(new CustomEvent('works-cinema-complete'));
      }
    },
    onLeaveBack() {
      if (cardsAnimated) {
        cardsAnimated = false;
        // Dispatch reset event so works-entrance.js resets internal flags and re-hides cards
        window.dispatchEvent(new CustomEvent('works-cinema-reset'));
      }
    },
  });
}
