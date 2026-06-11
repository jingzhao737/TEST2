import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ✦ PREMIUM PARALLAX SHOWCASE + ORGANIC FLUID SHIMMER ✦

const isMobile = window.innerWidth < 768;

// Accent color pulled from CSS variable at runtime
function getAccent() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e87c50';
}

const items = document.querySelectorAll('.showcase-item[data-parallax]');

if (items.length > 0) {
  items.forEach(item => {
    const bg      = item.querySelector('.showcase-bg');

    // Create blurred background clone for hardware-accelerated opacity cross-fade
    const bgBlurred = bg.cloneNode(true);
    bgBlurred.classList.remove('showcase-bg');
    bgBlurred.classList.add('showcase-bg-blurred');
    bg.parentNode.insertBefore(bgBlurred, bg.nextSibling);

    const info    = item.querySelector('.showcase-info');
    const title   = item.querySelector('.showcase-title');

    if (!isMobile) {
      // Create highly optimized GSAP quickTo functions for 60fps+ hardware-accelerated rendering
      // Both crisp and blurred backgrounds move in perfect sync during 2D parallax hover
      const bgXTo    = gsap.quickTo([bg, bgBlurred], "x",         { duration: 0.9, ease: "power3.out" });
      const bgYTo    = gsap.quickTo([bg, bgBlurred], "y",         { duration: 0.9, ease: "power3.out" });
      const bgScXTo  = gsap.quickTo([bg, bgBlurred], "scaleX",    { duration: 0.8, ease: "power3.out" });
      const bgScYTo  = gsap.quickTo([bg, bgBlurred], "scaleY",    { duration: 0.8, ease: "power3.out" });
      const infoXTo  = gsap.quickTo(info, "x",         { duration: 1.2, ease: "power3.out" });
      const infoYTo  = gsap.quickTo(info, "y",         { duration: 1.2, ease: "power3.out" });

      // Dynamically add a premium light sheen (gloss) effect layer
      const sheen = document.createElement('div');
      sheen.className = 'showcase-sheen';
      item.appendChild(sheen);

      gsap.set(item, { transformPerspective: 1200, transformStyle: "preserve-3d" });
      gsap.set(info, { transformPerspective: 1200, transformStyle: "preserve-3d", z: 60 });

      // ✦ Organic fluid shimmer state ✦
      let tickerId   = null;
      let startTime  = 0;

      // Each card gets its own unique set of wave parameters so no two cards look alike
      const w = [
        { freq: 0.28 + Math.random() * 0.12, amp: 55 + Math.random() * 25, phase: Math.random() * Math.PI * 2 },
        { freq: 0.13 + Math.random() * 0.08, amp: 30 + Math.random() * 15, phase: Math.random() * Math.PI * 2 },
        { freq: 0.52 + Math.random() * 0.18, amp: 12 + Math.random() * 8,  phase: Math.random() * Math.PI * 2 },
      ];

      // Base drift — how fast the "river" flows across the gradient
      const drift = 14 + Math.random() * 8; // px/s (different per card)

      function startShimmer() {
        if (!title) return;
        startTime = performance.now();
        const accent = getAccent();
        
        // Initialize data-text for the pseudo-element bloom layer
        if (!title.dataset.text) title.dataset.text = title.textContent;
        title.classList.add('is-shimmering');

        // Enhanced ultra-bright gradient for a massive bloom effect
        const gradient = `linear-gradient(
          100deg,
          rgba(255,255,255,0.4) 0%,
          #ffffff 12%,
          #ffffff 18%,
          ${accent} 25%,
          rgba(255,255,255,0.7) 35%,
          #ffffff 45%,
          #ffffff 52%,
          ${accent} 62%,
          rgba(255,255,255,0.5) 75%,
          #ffffff 82%,
          #ffffff 88%,
          rgba(255,255,255,0.4) 100%
        )`;
        
        title.style.setProperty('--shimmer-gradient', gradient);
        let pos = Math.random() * 400;

        tickerId = gsap.ticker.add((time, deltaTime) => {
          const elapsed = (performance.now() - startTime) / 1000;
          const speedMod =
            1.0 +
            Math.sin(elapsed * w[0].freq * Math.PI * 2 + w[0].phase) * 0.5 +
            Math.sin(elapsed * w[1].freq * Math.PI * 2 + w[1].phase) * 0.25 +
            Math.sin(elapsed * w[2].freq * Math.PI * 2 + w[2].phase) * 0.1;

          pos = (pos + drift * Math.max(0.05, speedMod) * (deltaTime / 1000)) % 400;
          title.style.setProperty('--shimmer-pos', `${pos}%`);
        });
      }

      function stopShimmer() {
        if (tickerId !== null) {
          gsap.ticker.remove(tickerId);
          tickerId = null;
        }
        if (title) {
          title.classList.remove('is-shimmering');
          gsap.to({ pos: parseFloat(title.style.getPropertyValue('--shimmer-pos')) || 0 }, {
            pos: 0,
            duration: 0.6,
            ease: "power2.out",
            onUpdate: function() {
              title.style.setProperty('--shimmer-gradient', 'linear-gradient(100deg,#fff,#fff)');
              title.style.setProperty('--shimmer-pos', '0%');
            }
          });
        }
      }

      // ✦ Event listeners ✦
      item.addEventListener("mouseenter", () => {
        bgScXTo(1.08);
        bgScYTo(1.08);
        startShimmer();
      });

      item.addEventListener("mousemove", e => {
        const rect = item.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top)  / rect.height;

        // Update sheen position
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        item.style.setProperty('--sheen-x', `${mouseX}px`);
        item.style.setProperty('--sheen-y', `${mouseY}px`);

        bgXTo((relX - 0.5) * -40);
        bgYTo((relY - 0.5) * -40);
        infoXTo((relX - 0.5) * 25);
        infoYTo((relY - 0.5) * 25);
      });

      item.addEventListener("mouseleave", () => {
        bgXTo(0); bgYTo(0);
        bgScXTo(1); bgScYTo(1);
        infoXTo(0); infoYTo(0);
        stopShimmer();
      });
    }
  });
}

// ══════════════════════════════════════════
//  STACKED DEPTH DECK EFFECT (HIGH PERFORMANCE CASCADING STACK)
// ══════════════════════════════════════════
if (items.length > 0) {
  const showcaseItems = gsap.utils.toArray('.showcase-item');
  const showcaseSection = document.querySelector('.showcase');
  const showcaseHeader = showcaseSection.querySelector('.showcase-header');
  const grid = document.querySelector('.showcase-grid');

  // Lock container height on mobile load to prevent address-bar scrolling jitter
  if (isMobile && showcaseSection) {
    showcaseSection.style.height = `${window.innerHeight}px`;
  }

  // ═══════════════ UNIFIED PINNED STACKED DECK EFFECT ═══════════════
  if (grid) {
    grid.classList.add('is-stacked');
    grid.style.overflow = 'visible';
    gsap.set(grid, { perspective: 2000, transformStyle: "preserve-3d" });
  }

  // Pre-query overlays and blurred backgrounds for unified timeline
  const overlays = [];
  const blurredBgs = [];
  const infos = [];
  
  showcaseItems.forEach(item => {
    overlays.push(item.querySelector('.showcase-overlay'));
    blurredBgs.push(item.querySelector('.showcase-bg-blurred'));
    infos.push(item.querySelector('.showcase-info'));
  });

  // Set initial absolute positioning and opacity states to bypass GSAP initial value locks
  gsap.set(showcaseHeader, { opacity: 1, y: 0 });
  gsap.set(infos, { opacity: 1 });

  // Card 1 starts at active (y:0), Cards 2 & 3 start completely below viewport with 3D orientation
  gsap.set(showcaseItems[0], { zIndex: 1, y: 0, scale: 1, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, filter: "blur(0px)", transformOrigin: "top center", opacity: 1 });
  gsap.set(showcaseItems[1], { zIndex: 2, y: "100vh", scale: 1.05, z: 100, rotationX: -22, rotationY: 0, rotationZ: -4, filter: "blur(4px)", transformOrigin: "top center", opacity: 1 });
  gsap.set(showcaseItems[2], { zIndex: 3, y: "100vh", scale: 1.05, z: 100, rotationX: -22, rotationY: 0, rotationZ: 4, filter: "blur(4px)", transformOrigin: "top center", opacity: 1 });

  // Determine configuration parameters based on device
  const scrollDistance = "+=1000";
  const holdDuration = isMobile ? 0.01 : 0.04;

  // Unified cascading timeline & Scroll-jacking state
  let mainTimeline;
  let activeIndex = 0;
  let isAnimatingScroll = false;
  let lastScrollTime = 0;
  const cooldown = 600; // ms cooldown between scroll events
  let ignoreScrollCallbacks = false;

  // Create a standalone paused timeline
  mainTimeline = gsap.timeline({ paused: true });

  // Create ScrollTrigger to handle pinning and entering/leaving state
  ScrollTrigger.create({
    id: "showcasePin",
    trigger: showcaseSection,
    start: "top top",      // Pin the section when it hits the top of the viewport
    end: () => scrollDistance,   // Short scroll trigger space for snappy exit
    pin: true,
    pinSpacing: true,      // Let GSAP handle padding-bottom spacing natively
    zIndex: 1,             // Lower z-index for pinned container so overlaying elements stack on top
    onRefresh: (self) => {
      const currentScroll = window.scrollY;
      if (currentScroll >= self.start && currentScroll <= self.end) {
        ignoreScrollCallbacks = true;
        console.log(`[Showcase] onRefresh: inside trigger, ignoreScrollCallbacks=${ignoreScrollCallbacks}, scrollY=${currentScroll}`);
      }
    },
    onEnter: () => {
      if (ignoreScrollCallbacks) return;
      ignoreScrollCallbacks = true;
      activeIndex = 0;
      console.log(`[Showcase] onEnter: activeIndex=${activeIndex}, scrollY=${window.scrollY}`);
      gsap.killTweensOf(mainTimeline);
      gsap.to(mainTimeline, { time: 0, duration: 0.4, ease: "power2.out" });
      const self = ScrollTrigger.getById("showcasePin");
      if (self) {
        window.scrollTo({ top: self.start, behavior: 'instant' });
      }
    },
    onEnterBack: () => {
      if (ignoreScrollCallbacks) return;
      ignoreScrollCallbacks = true;
      activeIndex = 2;
      console.log(`[Showcase] onEnterBack: activeIndex=${activeIndex}, scrollY=${window.scrollY}`);
      gsap.killTweensOf(mainTimeline);
      gsap.to(mainTimeline, { time: 1.2, duration: 0.4, ease: "power2.out" });
      const self = ScrollTrigger.getById("showcasePin");
      if (self) {
        window.scrollTo({ top: self.start, behavior: 'instant' });
      }
    },
    onLeave: () => {
      const st = ScrollTrigger.getById("showcasePin");
      if (st && (window.scrollY > st.end + 20)) {
        ignoreScrollCallbacks = false;
      }
      console.log(`[Showcase] onLeave: ignoreScrollCallbacks=${ignoreScrollCallbacks}, scrollY=${window.scrollY}`);
    },
    onLeaveBack: () => {
      const st = ScrollTrigger.getById("showcasePin");
      if (st && (window.scrollY < st.start - 20)) {
        ignoreScrollCallbacks = false;
      }
      console.log(`[Showcase] onLeaveBack: ignoreScrollCallbacks=${ignoreScrollCallbacks}, scrollY=${window.scrollY}`);
    }
  });

  // Scroll listener to reset flag when far away
  window.addEventListener('scroll', () => {
    const st = ScrollTrigger.getById("showcasePin");
    if (!st) return;
    const currentScroll = window.scrollY;
    if (currentScroll < st.start - 50 || currentScroll > st.end + 50) {
      if (ignoreScrollCallbacks) {
        ignoreScrollCallbacks = false;
        console.log(`[Showcase] scroll reset ignoreScrollCallbacks=false, scrollY=${currentScroll}`);
      }
    }
  });

  // Step 1: Card 2 slides up to front, Card 1 recedes (Duration: 0.6)
  mainTimeline.addLabel("card1")
    .to(showcaseItems[1], { y: "4vh", scale: 1.0, rotationX: 0, rotationZ: 0, z: 0, filter: "blur(0px)", ease: "power2.inOut", duration: 0.6 }, "card1")
    .to(showcaseItems[0], { 
      y: 0,
      scale: 0.91, 
      z: -120, 
      rotationX: 8, 
      rotationZ: 0,
      filter: "blur(6px)",
      transformOrigin: "top center",
      ease: "power2.inOut",
      duration: 0.6
    }, "card1")
    .to(blurredBgs[0], { opacity: 1, ease: "power2.inOut", duration: 0.6 }, "card1")
    .to(overlays[0], { backgroundColor: "rgba(0,0,0,0.55)", ease: "power2.inOut", duration: 0.6 }, "card1")
    .to(infos[0], { opacity: 0.35, ease: "power2.inOut", duration: 0.6 }, "card1");

  // Step 2: Card 3 slides up to front, Card 2 recedes, Card 1 recedes deeper (Duration: 0.6)
  mainTimeline.addLabel("card2")
    .to(showcaseItems[2], { y: "8vh", scale: 1.0, rotationX: 0, rotationZ: 0, z: 0, filter: "blur(0px)", ease: "power2.inOut", duration: 0.6 }, "card2")
    .to(showcaseItems[1], { 
      y: "4vh",
      scale: 0.91, 
      z: -120, 
      rotationX: 8, 
      rotationZ: 0,
      filter: "blur(6px)",
      transformOrigin: "top center",
      ease: "power2.inOut",
      duration: 0.6
    }, "card2")
    .to(blurredBgs[1], { opacity: 1, ease: "power2.inOut", duration: 0.6 }, "card2")
    .to(overlays[1], { backgroundColor: "rgba(0,0,0,0.55)", ease: "power2.inOut", duration: 0.6 }, "card2")
    .to(infos[1], { opacity: 0.35, ease: "power2.inOut", duration: 0.6 }, "card2")
    
    // Card 1 sinks deeper
    .to(showcaseItems[0], { 
      y: 0,
      scale: 0.83, 
      z: -240, 
      rotationX: 16, 
      rotationZ: 0,
      filter: "blur(12px)",
      transformOrigin: "top center",
      ease: "power2.inOut",
      duration: 0.6
    }, "card2")
    .to(overlays[0], { backgroundColor: "rgba(0,0,0,0.75)", ease: "power2.inOut", duration: 0.6 }, "card2")
    .to(infos[0], { opacity: 0.15, ease: "power2.inOut", duration: 0.6 }, "card2")
    
    // Small hold duration so the final stacked state is visible before unpinning
    .addLabel("card3")
    .to({}, { duration: holdDuration }, "card3");

  // ── Scroll-jacking Implementation: One scroll = One card ──
  function handleScrollAction(direction) {
    ignoreScrollCallbacks = true;
    const now = Date.now();
    if (now - lastScrollTime < cooldown) return false;
    
    let targetIndex = activeIndex;
    if (direction > 0) {
      if (activeIndex < 2) {
        targetIndex = activeIndex + 1;
      } else {
        return false; // already at card 3, let scroll down naturally
      }
    } else {
      if (activeIndex > 0) {
        targetIndex = activeIndex - 1;
      } else {
        return false; // already at card 1, let scroll up naturally
      }
    }

    lastScrollTime = now;
    isAnimatingScroll = true;
    activeIndex = targetIndex; // Update immediately to prevent race conditions during animation!

    const targetTime = targetIndex === 0 ? 0 : (targetIndex === 1 ? 0.6 : 1.2);
    console.log(`[Showcase] handleScrollAction: direction=${direction}, transition to ${activeIndex} (targetTime=${targetTime})`);

    gsap.killTweensOf(mainTimeline);
    gsap.to(mainTimeline, {
      time: targetTime,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => {
        isAnimatingScroll = false;
        console.log(`[Showcase] Transition complete: activeIndex=${activeIndex}`);
      }
    });

    return true;
  }

  // Wheel listener with active check
  window.addEventListener('wheel', (e) => {
    const st = ScrollTrigger.getById("showcasePin");
    if (!st) return;

    // Don't intercept if work detail page is open
    const detailEl = document.getElementById('workDetail');
    if (detailEl && detailEl.classList.contains('open')) return;

    const currentScroll = window.scrollY;
    const isInRange = currentScroll >= st.start - 5 && currentScroll <= st.end + 5;
    
    console.log(`[Showcase] wheel event: deltaY=${e.deltaY}, isInRange=${isInRange}, activeIndex=${activeIndex}, scrollY=${currentScroll}, st.start=${st.start}, st.end=${st.end}`);

    if (!isInRange) return;

    const direction = e.deltaY;
    if (direction === 0) return;

    if (isAnimatingScroll) {
      console.log(`[Showcase] wheel ignored: isAnimatingScroll=true`);
      e.preventDefault();
      return;
    }

    const isDown = direction > 0;
    if (isDown && activeIndex === 2) {
      console.log(`[Showcase] wheel boundary: scroll down to next section`);
      const nextSection = document.querySelector('#motion');
      if (nextSection) {
        const nextY = nextSection.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: nextY, behavior: 'smooth' });
      }
      ignoreScrollCallbacks = false;
      return;
    }
    if (!isDown && activeIndex === 0) {
      console.log(`[Showcase] wheel boundary: scroll up to prev section`);
      const prevSection = document.querySelector('#ice');
      if (prevSection) {
        const prevY = prevSection.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: prevY, behavior: 'smooth' });
      }
      ignoreScrollCallbacks = false;
      return;
    }

    e.preventDefault();
    handleScrollAction(isDown ? 1 : -1);
  }, { passive: false });

  // Touch swipe listeners for mobile
  let touchStartY = 0;
  let hasFlippedInCurrentTouch = false;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      hasFlippedInCurrentTouch = false;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const st = ScrollTrigger.getById("showcasePin");
    if (!st) return;

    // Don't intercept if work detail page is open
    const detailEl = document.getElementById('workDetail');
    if (detailEl && detailEl.classList.contains('open')) return;

    const currentScroll = window.scrollY;
    const isInRange = currentScroll >= st.start - 5 && currentScroll <= st.end + 5;
    if (!isInRange) return;

    if (isAnimatingScroll) {
      e.preventDefault();
      return;
    }

    if (e.touches.length > 0) {
      const touchCurrentY = e.touches[0].clientY;
      const diffY = touchStartY - touchCurrentY; // positive = swipe up = scroll down
      const isDown = diffY > 0;
      
      if (isDown && activeIndex === 2) {
        const nextSection = document.querySelector('#motion');
        if (nextSection) {
          const nextY = nextSection.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: nextY, behavior: 'smooth' });
        }
        ignoreScrollCallbacks = false;
        return;
      }
      if (!isDown && activeIndex === 0) {
        const prevSection = document.querySelector('#ice');
        if (prevSection) {
          const prevY = prevSection.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: prevY, behavior: 'smooth' });
        }
        ignoreScrollCallbacks = false;
        return;
      }

      e.preventDefault();

      if (!hasFlippedInCurrentTouch && Math.abs(diffY) > 40) {
        hasFlippedInCurrentTouch = true;
        handleScrollAction(isDown ? 1 : -1);
      }
    }
  }, { passive: false });

  // Keydown listener for keyboard scrolling
  const keysToPrevent = [32, 33, 34, 35, 36, 38, 40];
  window.addEventListener('keydown', (e) => {
    const st = ScrollTrigger.getById("showcasePin");
    if (!st) return;

    // Don't intercept if work detail page is open
    const detailEl = document.getElementById('workDetail');
    if (detailEl && detailEl.classList.contains('open')) return;

    const currentScroll = window.scrollY;
    const isInRange = currentScroll >= st.start - 5 && currentScroll <= st.end + 5;
    if (!isInRange) return;

    if (keysToPrevent.includes(e.keyCode)) {
      const isDown = [32, 34, 35, 40].includes(e.keyCode);
      
      if (isDown && activeIndex === 2) {
        const nextSection = document.querySelector('#motion');
        if (nextSection) {
          const nextY = nextSection.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: nextY, behavior: 'smooth' });
        }
        ignoreScrollCallbacks = false;
        return;
      }
      if (!isDown && activeIndex === 0) {
        const prevSection = document.querySelector('#ice');
        if (prevSection) {
          const prevY = prevSection.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: prevY, behavior: 'smooth' });
        }
        ignoreScrollCallbacks = false;
        return;
      }

      e.preventDefault();

      if (isAnimatingScroll) return;

      handleScrollAction(isDown ? 1 : -1);
    }
  });
}
