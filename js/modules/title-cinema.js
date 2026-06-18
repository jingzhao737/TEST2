import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

if (window.innerWidth > 768) {
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
    setupWorksCinema();
  });
}

let worksTitleTimeline = null;
let worksScrollTrigger1 = null;
let worksScrollTrigger2 = null;

// ── WORKS: Big title rises from bottom, stays big, then cards fly in ──
function setupWorksCinema() {
  const section = document.querySelector('#work');
  if (!section) return;

  const title = section.querySelector('.works-big-title');
  if (!title) return;

  const chromaWrapper = section.querySelector('.works-chroma-wrapper');
  const cards = gsap.utils.toArray('.work-card');

  // Expose elements for debugger
  window.__worksTitleElement = title;
  window.__worksChromaWrapper = chromaWrapper;
  window.__worksCards = cards;

  function buildTimelineAndTriggers() {
    // Kill old ones if exist
    if (worksTitleTimeline) worksTitleTimeline.kill();
    if (worksScrollTrigger1) worksScrollTrigger1.kill();
    if (worksScrollTrigger2) worksScrollTrigger2.kill();

    const config = window.__motionDebuggerConfig?.worksTitle || {
      duration: 2.55,
      ease: 'power4.inOut',
      y: '100vh',
      delay: 0
    };

    const chromaConfig = window.__motionDebuggerConfig?.chromaBlob || {
      duration: 0.4,
      ease: 'power1.inOut'
    };

    // Reset initial states
    gsap.set(cards, { opacity: 0, immediateRender: true });
    if (chromaWrapper) {
      gsap.set(chromaWrapper, { opacity: 0, immediateRender: true });
    }
    gsap.set(title, {
      y: config.y,
      opacity: 0,
      immediateRender: true,
      force3D: true,
    });

    let cardsAnimated = false;

    // Timeline 1: Chroma blob fades in first, then title rises
    const tl = gsap.timeline({ paused: true });
    worksTitleTimeline = tl;
    window.__worksTitleTimeline = tl; // Expose

    if (chromaWrapper) {
      tl.to(chromaWrapper, {
        opacity: 1,
        duration: chromaConfig.duration,
        ease: chromaConfig.ease,
      });
    }

    tl.to(title, {
      y: 0,
      opacity: 1,
      duration: config.duration,
      ease: config.ease,
    }, `>${config.delay}`);

    // ScrollTrigger 1: Triggers the title rising animation when the section enters viewport
    worksScrollTrigger1 = ScrollTrigger.create({
      trigger: section,
      start: 'top 50%', // Starts when the section top reaches the middle of viewport
      onEnter() {
        tl.play();
      },
      onLeaveBack() {
        tl.reverse();
      }
    });

    // ScrollTrigger 2: Pins the section at the top and triggers the cards fly-in
    worksScrollTrigger2 = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${window.__motionDebuggerConfig?.scrollLength || 900}`, // Pin duration
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

  // Initialize
  buildTimelineAndTriggers();

  // Expose build function globally for debugger
  window.__rebuildWorksCinema = buildTimelineAndTriggers;
}
