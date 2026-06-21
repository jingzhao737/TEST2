import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

if (window.innerWidth > 768) {
  // Wait for smooth-scroll proxy to be set up, then initialize
  window.addEventListener('load', () => {
    // Small delay to ensure smooth-scroll.js has set up the proxy
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      setupWorksCinema();
    });
  });
}

let worksScrollTriggerChroma = null;
let worksScrollTriggerNoise  = null;
let worksScrollTriggerTitle  = null;
let worksScrollTrigger2      = null;

// ── WORKS: Awwwards-grade cinematic entrance sequence ──
//
// Stage 1 (scroll-scrubbed): Chroma blob grows from nothing (Siri-style) as
//   section enters viewport. Long scroll window = slow, cinematic reveal.
// Stage 2 (scroll-scrubbed): While blob is visible, title rises from below —
//   scrubbed directly to scroll progress for perfect inertia feel.
// Stage 3 (pinned + timed): Section pins at top. Cards fly in once title lands.
//
function setupWorksCinema() {
  const section = document.querySelector('#work');
  if (!section) return;

  const title = section.querySelector('.works-big-title');
  if (!title) return;

  const chromaWrapper = section.querySelector('.works-chroma-wrapper');
  const cards = gsap.utils.toArray('.work-card');

  // Expose elements for debugger
  window.__worksTitleElement  = title;
  window.__worksChromaWrapper = chromaWrapper;
  window.__worksCards         = cards;

  function buildTimelineAndTriggers() {
    // Kill old instances
    if (worksScrollTriggerChroma) worksScrollTriggerChroma.kill();
    if (worksScrollTriggerNoise)  worksScrollTriggerNoise.kill();
    if (worksScrollTriggerTitle)  worksScrollTriggerTitle.kill();
    if (worksScrollTrigger2)      worksScrollTrigger2.kill();

    const config = window.__motionDebuggerConfig?.worksTitle || {
      duration:     2.55,
      ease:         'power4.inOut',
      y:            '100vh',
      delay:        0,
      triggerStart: 5
    };

    const chromaConfig = window.__motionDebuggerConfig?.chromaBlob || {
      duration: 0.4,
      ease:     'power1.inOut'
    };

    const scrollLen = window.__motionDebuggerConfig?.scrollLength || 900;

    // ── Reset initial states ────────────────────────────────────────────────
    gsap.set(cards, { opacity: 0, immediateRender: true });

    if (chromaWrapper) {
      gsap.set(chromaWrapper, {
        opacity:         0,
        scale:           0,
        xPercent:        -50,
        yPercent:        -50,
        transformOrigin: 'center center',
        immediateRender: true
      });
    }

    gsap.set(title, {
      y:              config.y,
      opacity:        0,
      immediateRender: true,
      force3D:        true,
    });

    // ── State flags ────────────────────────────────────────────────────────
    let cardsAnimated          = false;
    let titleAnimationCompleted = false;
    let sectionPinned          = false;

    function checkAndTriggerCards() {
      if (sectionPinned && titleAnimationCompleted && !cardsAnimated) {
        cardsAnimated = true;
        window.dispatchEvent(new CustomEvent('works-cinema-complete'));
      }
    }

    // ── Stage 1 & 2: Scroll-scrubbed chroma + title rise ──────────────────
    // Long scroll window (top 100% → top -50%) = very cinematic, slow reveal.
    // The `scrub: 1.8` adds its own inertia on top of the smooth scroll engine,
    // creating a layered "depth" feel exactly like Awwwards sites.

    if (chromaWrapper) {
      // Chroma appears first — long, generous scroll window
      worksScrollTriggerChroma = ScrollTrigger.create({
        trigger: section,
        start:   'top 110%',   // begins when section is just below the viewport bottom
        end:     'top 60%',    // reaches full size when section top is at 60% of viewport
        scrub:   1.8,          // 1.8s lag behind scroll = heavy, luxurious feel
        animation: gsap.fromTo(chromaWrapper,
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, ease: 'back.out(2)' } // Siri-style spring/elastic overshoot
        )
      });

      // Noise blob stays visible during the wait buffer — no extra trigger needed
    }

    // Title scrubbed-rise: starts after chroma is halfway, ends just before pinning
    worksScrollTriggerTitle = ScrollTrigger.create({
      trigger: section,
      start:   'top 35%',    // title begins rising much later, giving a long scroll gap
      end:     'top 5%',     // title fully landed just before section hits top
      scrub:   2.2,          // slightly heavier lag than chroma = depth parallax
      animation: gsap.fromTo(title,
        { y: config.y, opacity: 0 },
        {
          y:       0,
          opacity: 1,
          ease:    config.ease,
          onComplete() {
            titleAnimationCompleted = true;
            checkAndTriggerCards();
          }
        }
      ),
      onLeaveBack() {
        titleAnimationCompleted = false;
      }
    });

    // ── Stage 3: Pin + cards fly-in ───────────────────────────────────────
    // The section pins at the top of viewport. The title is now in position.
    // Cards fly in on a time-based tween (not scroll-scrubbed) for a dramatic,
    // gravity-defying entrance that doesn't depend on scroll speed.
    worksScrollTrigger2 = ScrollTrigger.create({
      trigger:    section,
      start:      'top top',
      end:        `+=${scrollLen}`,
      pin:        true,
      pinSpacing: true,
      onEnter() {
        sectionPinned = true;
        // Do not force titleAnimationCompleted = true here, let the scrubbed tween onComplete do it!
        checkAndTriggerCards();
      },
      onLeaveBack() {
        sectionPinned = false;
        titleAnimationCompleted = false;
        if (cardsAnimated) {
          cardsAnimated = false;
          window.dispatchEvent(new CustomEvent('works-cinema-reset'));
        }
      }
    });
  }

  // Initialize
  buildTimelineAndTriggers();

  // Expose rebuild for debugger hot-reload
  window.__rebuildWorksCinema = buildTimelineAndTriggers;
}
