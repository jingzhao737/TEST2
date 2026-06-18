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
let worksScrollTriggerChroma = null;
let worksScrollTriggerTitle = null;
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
    if (worksScrollTriggerChroma) worksScrollTriggerChroma.kill();
    if (worksScrollTriggerTitle) worksScrollTriggerTitle.kill();
    if (worksScrollTrigger2) worksScrollTrigger2.kill();

    const config = window.__motionDebuggerConfig?.worksTitle || {
      duration: 2.55,
      ease: 'power4.inOut',
      y: '100vh',
      delay: 0,
      triggerStart: 10
    };

    const chromaConfig = window.__motionDebuggerConfig?.chromaBlob || {
      duration: 0.4,
      ease: 'power1.inOut'
    };

    // Reset initial states
    gsap.set(cards, { opacity: 0, immediateRender: true });
    if (chromaWrapper) {
      gsap.set(chromaWrapper, {
        opacity: 0,
        scale: 0,
        xPercent: -50,
        yPercent: -50,
        transformOrigin: 'center center',
        immediateRender: true
      });
    }
    gsap.set(title, {
      y: config.y,
      opacity: 0,
      immediateRender: true,
      force3D: true,
    });

    let cardsAnimated = false;
    let titleAnimationCompleted = false;
    let sectionPinned = false;

    function checkAndTriggerCards() {
      if (sectionPinned && titleAnimationCompleted) {
        if (!cardsAnimated) {
          cardsAnimated = true;
          window.dispatchEvent(new CustomEvent('works-cinema-complete'));
        }
      }
    }

    // Timeline 1: Chroma blob scroll fade-in and scale expansion (Siri style)
    if (chromaWrapper) {
      worksScrollTriggerChroma = ScrollTrigger.create({
        trigger: section,
        start: 'top 95%',
        end: 'top 75%',
        scrub: 1.0,
        animation: gsap.to(chromaWrapper, {
          opacity: 1,
          scale: 1,
          ease: chromaConfig.ease
        })
      });
    }

    // Timeline 2: Title rises dynamically on time
    const tl = gsap.timeline({ paused: true });
    worksTitleTimeline = tl;
    window.__worksTitleTimeline = tl; // Expose

    tl.to(title, {
      y: 0,
      opacity: 1,
      duration: config.duration,
      ease: config.ease,
      onComplete() {
        titleAnimationCompleted = true;
        checkAndTriggerCards();
      }
    }, config.delay || 0);

    const triggerPercent = config.triggerStart !== undefined ? config.triggerStart : 25;

    // ScrollTrigger 1: Triggers the title rising animation when the section reaches triggerPercent of viewport
    worksScrollTriggerTitle = ScrollTrigger.create({
      trigger: section,
      start: `top ${triggerPercent}%`,
      onEnter() {
        tl.play();
      },
      onLeaveBack() {
        titleAnimationCompleted = false;
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
        sectionPinned = true;
        checkAndTriggerCards();
      },
      onLeaveBack() {
        sectionPinned = false;
        titleAnimationCompleted = false;
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
