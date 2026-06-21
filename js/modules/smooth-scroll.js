/**
 * smooth-scroll.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Awwwards-grade inertial scrolling — native scroll approach.
 *
 * Technique: Lerped scrollTo proxy
 *   • Intercepts wheel/touch events and accumulates a `targetY`.
 *   • Each RAF tick exponentially lerps `smoothY` toward `targetY`.
 *   • Calls `window.scrollTo({ top: smoothY, behavior: 'instant' })` each frame.
 *   • Registers a `ScrollTrigger.scrollerProxy` so ALL ScrollTrigger instances
 *     read `smoothY` instead of native scroll — giving every animation the
 *     same inertia without any DOM restructuring.
 *
 * Why this approach:
 *   • Zero DOM changes — no wrapper divs, no position:fixed breakage.
 *   • Works seamlessly with existing IntersectionObserver, nav, hash-router.
 *   • The `scrub` value on each ScrollTrigger stacks on top → layered depth.
 *
 * Desktop only (pointer:fine && width > 768). Touch/mobile uses native scroll.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const isFinePointer = window.matchMedia('(pointer:fine)').matches;
const isDesktop     = window.innerWidth > 768;

if (isFinePointer && isDesktop) {
  initSmoothScroll();
} else {
  window.__smoothScroll = {
    getY:     () => window.scrollY,
    scrollTo: (y) => window.scrollTo({ top: y, behavior: 'smooth' })
  };
}

function initSmoothScroll() {
  // ── Config ────────────────────────────────────────────────────────────────
  // lerp factor: 0.08 = very silky/heavy (Locomotive style)
  //              0.12 = snappy but still smooth (GSAP ScrollSmoother default)
  const LERP        = 0.09;
  const SNAP_THRESH = 0.05; // px — settle threshold

  // ── State ─────────────────────────────────────────────────────────────────
  let smoothY  = window.scrollY;
  let targetY  = window.scrollY;
  let maxY     = 0;
  let rafId    = null;
  let enabled  = true;

  function getMaxY() {
    return Math.max(0, document.body.scrollHeight - window.innerHeight);
  }
  maxY = getMaxY();

  // ── Prevent native scroll — we drive it manually ──────────────────────────
  // Lock native scroll on html/body so the browser doesn't jump
  const styleEl = document.createElement('style');
  styleEl.id = 'smooth-scroll-styles';
  styleEl.textContent = `html { overflow: hidden !important; }`;
  document.head.appendChild(styleEl);

  // Create a tall sentinel div that sets the scrollable height correctly.
  // This is essential: we need the page to be the right "height" so that
  // ScrollTrigger pin spacers and calculations are correct.
  // We DON'T actually scroll this — we just keep the body tall.
  document.documentElement.style.overflow = 'hidden';

  // Re-enable overflow on body so content paints correctly
  document.body.style.overflow = 'hidden';
  document.body.style.height   = '100vh';

  // Create a phantom scroller that holds page height for ST calculations
  const phantom = document.createElement('div');
  phantom.id = 'smooth-scroll-phantom';
  phantom.style.cssText = 'position:fixed;top:0;left:0;width:1px;pointer-events:none;opacity:0;z-index:-1';
  document.body.appendChild(phantom);

  // ── Content translation ───────────────────────────────────────────────────
  // We translate the main content layer instead of scrolling the window.
  // To avoid breaking position:fixed elements (which are fixed to viewport
  // in modern browsers even inside a transform), we create ONE wrapper div
  // for all non-fixed body content and translate that.

  // Collect all body children that are NOT position:fixed
  // We detect fixed elements by computed style.
  const contentWrapper = document.createElement('div');
  contentWrapper.id = 'smooth-content-layer';
  contentWrapper.style.cssText = [
    'will-change: transform',
    'position: relative',
    'z-index: 1',
  ].join(';');

  // Move all body children into contentWrapper, EXCEPT those that are fixed
  // or that we explicitly want to keep outside (overlays, cursors etc.)
  const fixedSelectors = [
    '.cursor-dot', '.cursor-circle',
    '.scroll-bar',
    '.nav',
    '.page-transition',
    '.color-transition-overlay',
    '.gallery-lightbox',
    '.motion-debugger', '.motion-debugger-panel',
    '#motionDebuggerBtn',
    '.color-console',
    '.back-to-top',
    '.work-preview', '.work-preview-wrapper', '.work-preview-orange-layer',
    '#laserCanvas',
    '.stars-canvas',
  ];

  // We'll just move ALL body children into the wrapper and rely on
  // CSS position:fixed to break out of the transform parent correctly.
  // Modern browsers (Chrome 80+, FF 80+, Safari 14+) handle this correctly
  // UNLESS the parent has a filter/opacity/mix-blend-mode — which ours doesn't.
  const children = Array.from(document.body.children);
  children.forEach(child => {
    if (child.id !== 'smooth-content-layer' && child.id !== 'smooth-scroll-phantom') {
      contentWrapper.appendChild(child);
    }
  });
  document.body.appendChild(contentWrapper);

  // Redefine scroll values to point to smoothY so window.scrollY and scrollTop work naturally
  try {
    Object.defineProperty(window, 'scrollY', {
      get() { return smoothY; },
      configurable: true
    });
    Object.defineProperty(window, 'pageYOffset', {
      get() { return smoothY; },
      configurable: true
    });
  } catch (e) {
    console.error("Failed to override window.scrollY", e);
  }

  try {
    Object.defineProperty(document.documentElement, 'scrollTop', {
      get() { return smoothY; },
      set(v) { 
        targetY = smoothY = Math.max(0, Math.min(maxY, v));
        contentWrapper.style.transform = `translateY(${-smoothY}px)`;
        ScrollTrigger.update();
        window.dispatchEvent(new Event('scroll'));
      },
      configurable: true
    });
    Object.defineProperty(document.body, 'scrollTop', {
      get() { return smoothY; },
      set(v) { 
        targetY = smoothY = Math.max(0, Math.min(maxY, v));
        contentWrapper.style.transform = `translateY(${-smoothY}px)`;
        ScrollTrigger.update();
        window.dispatchEvent(new Event('scroll'));
      },
      configurable: true
    });
  } catch (e) {
    console.error("Failed to override scrollTop", e);
  }

  // ── RAF loop ──────────────────────────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    const delta = targetY - smoothY;

    if (Math.abs(delta) < SNAP_THRESH) {
      smoothY = targetY;
      isScrolling = false;
      rafId = null;
    } else {
      smoothY = lerp(smoothY, targetY, LERP);
      rafId = requestAnimationFrame(tick);
    }

    // Apply translation to the content layer
    contentWrapper.style.transform = `translateY(${-smoothY}px)`;

    // Update ScrollTrigger with the new "scroll" position
    ScrollTrigger.update();

    // Dispatch scroll event so all window scroll listeners update
    window.dispatchEvent(new Event('scroll'));
  }

  let isScrolling = false;
  function startRaf() {
    isScrolling = true;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // ── Wheel handler ─────────────────────────────────────────────────────────
  window.addEventListener('wheel', (e) => {
    if (!enabled) return;
    e.preventDefault();

    let d = e.deltaY;
    if (e.deltaMode === 1) d *= 40;
    if (e.deltaMode === 2) d *= window.innerHeight;

    targetY = Math.max(0, Math.min(maxY, targetY + d));
    startRaf();
  }, { passive: false });

  // ── Touch ─────────────────────────────────────────────────────────────────
  let ty0 = 0, tyn = 0;
  window.addEventListener('touchstart', e => { ty0 = tyn = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (!enabled) return;
    e.preventDefault();
    const d = tyn - e.touches[0].clientY;
    tyn = e.touches[0].clientY;
    targetY = Math.max(0, Math.min(maxY, targetY + d * 1.5));
    startRaf();
  }, { passive: false });
  window.addEventListener('touchend', () => {
    const vel = (tyn - ty0) * -3;
    targetY = Math.max(0, Math.min(maxY, targetY + vel));
    startRaf();
  }, { passive: true });

  // ── Keyboard ──────────────────────────────────────────────────────────────
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const step = window.innerHeight * 0.14;
    const page = window.innerHeight * 0.88;
    const map  = { ArrowDown: step, ArrowUp: -step, PageDown: page, PageUp: -page,
                   End: maxY - targetY, Home: -targetY };
    if (e.key in map) {
      e.preventDefault();
      targetY = Math.max(0, Math.min(maxY, targetY + map[e.key]));
      startRaf();
    }
  });

  // ── Resize ────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    maxY = getMaxY();
    targetY = Math.min(targetY, maxY);
    ScrollTrigger.refresh();
  });

  // ── window.scrollTo override ──────────────────────────────────────────────
  window.scrollTo = (opts, yArg) => {
    let dest;
    if (typeof opts === 'object' && opts !== null) {
      dest = opts.top ?? opts.y ?? 0;
      if (opts.behavior === 'instant') {
        smoothY = targetY = Math.max(0, Math.min(maxY, dest));
        contentWrapper.style.transform = `translateY(${-smoothY}px)`;
        ScrollTrigger.update();
        window.dispatchEvent(new Event('scroll'));
        return;
      }
    } else {
      dest = (typeof opts === 'number') ? opts : 0;
    }
    targetY = Math.max(0, Math.min(maxY, dest));
    startRaf();
  };

  // ── ScrollTrigger proxy ───────────────────────────────────────────────────
  // This is the core API: all ScrollTriggers read `smoothY` so they inherit
  // the inertia of our lerp engine.
  ScrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop(value) {
      if (arguments.length) {
        targetY = smoothY = Math.max(0, Math.min(maxY, value));
        contentWrapper.style.transform = `translateY(${-smoothY}px)`;
      }
      return smoothY;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    // 'transform' pinType means ScrollTrigger uses translateY to pin elements
    // instead of position:fixed — avoids stacking context issues with our wrapper
    pinType: 'transform'
  });

  ScrollTrigger.addEventListener('refresh', () => { maxY = getMaxY(); });
  ScrollTrigger.defaults({ scroller: document.documentElement });

  // ── Public API ────────────────────────────────────────────────────────────
  window.__smoothScroll = {
    active:     true,
    isFinePointer,
    isDesktop,
    getY:       () => smoothY,
    getTargetY: () => targetY,
    scrollTo(dest, instant = false) {
      targetY = Math.max(0, Math.min(maxY, dest));
      if (instant) {
        smoothY = targetY;
        contentWrapper.style.transform = `translateY(${-smoothY}px)`;
        ScrollTrigger.update();
        window.dispatchEvent(new Event('scroll'));
      } else {
        startRaf();
      }
    },
    pause()  { enabled = false; },
    resume() { enabled = true;  },
  };

  // Kick off first frame
  startRaf();
  setTimeout(() => { maxY = getMaxY(); ScrollTrigger.refresh(); }, 300);

  console.log(`[SmoothScroll] 🎬 Inertial engine active. LERP=${LERP}, maxY=${maxY}px`);
}
