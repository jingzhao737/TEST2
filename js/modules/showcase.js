import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ✦ PREMIUM PARALLAX SHOWCASE + ORGANIC FLUID SHIMMER ✦

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

    // Create highly optimized GSAP quickTo functions for 60fps+ hardware-accelerated rendering
    // Both crisp and blurred backgrounds move in perfect sync during 3D parallax ho    const xTo      = gsap.quickTo(item, "rotationY", { duration: 0.8, ease: "power3.out" });
    const yTo      = gsap.quickTo(item, "rotationX", { duration: 0.8, ease: "power3.out" });
    const bgXTo    = gsap.quickTo([bg, bgBlurred], "x",         { duration: 0.9, ease: "power3.out" });
    const bgYTo    = gsap.quickTo([bg, bgBlurred], "y",         { duration: 0.9, ease: "power3.out" });
    const bgScXTo  = gsap.quickTo([bg, bgBlurred], "scaleX",    { duration: 0.8, ease: "power3.out" });
    const bgScYTo  = gsap.quickTo([bg, bgBlurred], "scaleY",    { duration: 0.8, ease: "power3.out" });
    const infoXTo  = gsap.quickTo(info, "x",         { duration: 1.2, ease: "power3.out" });
    const infoYTo  = gsap.quickTo(info, "y",         { duration: 1.2, ease: "power3.out" });

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
      bgXTo((relX - 0.5) * -60);
      bgYTo((relY - 0.5) * -60);
      infoXTo((relX - 0.5) * 40);
      infoYTo((relY - 0.5) * 40);
    });

    item.addEventListener("mouseleave", () => {
      bgXTo(0); bgYTo(0);
      bgScXTo(1); bgScYTo(1);
      infoXTo(0); infoYTo(0);
      stopShimmer();
    });
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
  
  if (grid) {
    grid.classList.add('is-stacked');
    grid.style.overflow = 'visible';
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

  // Card 1 starts at active (y:0), Cards 2 & 3 start completely below viewport (y: 100vh)
  gsap.set(showcaseItems[0], { zIndex: 1, y: 0, scale: 1, z: 0, rotationX: 0, filter: "blur(0px)", transformOrigin: "top center", opacity: 1 });
  gsap.set(showcaseItems[1], { zIndex: 2, y: "100vh", scale: 1, z: 0, rotationX: 0, filter: "blur(0px)", transformOrigin: "top center", opacity: 1 });
  gsap.set(showcaseItems[2], { zIndex: 3, y: "100vh", scale: 1, z: 0, rotationX: 0, filter: "blur(0px)", transformOrigin: "top center", opacity: 1 });

  // Query showcase's next sibling (the divider) and offset it by the pin distance so it scrolls over the stack at the end.
  const nextSibling = showcaseSection.nextElementSibling;
  if (nextSibling) {
    ScrollTrigger.addEventListener("refreshInit", () => {
      const showcaseHeight = showcaseSection.offsetHeight;
      const currentIsMobile = window.innerWidth < 768;
      const currentSpacerFactor = currentIsMobile ? 1.5 : 2.4;
      gsap.set(nextSibling, { marginTop: (showcaseHeight * currentSpacerFactor) + "px" });
    });
    // Set initial margin
    const showcaseHeight = showcaseSection.offsetHeight;
    const isMobile = window.innerWidth < 768;
    const spacerFactor = isMobile ? 1.5 : 2.4;
    gsap.set(nextSibling, { marginTop: (showcaseHeight * spacerFactor) + "px" });
  }

  // Unified cascading timeline
  const mainTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: showcaseSection,
      start: "top top",      // Pin the section when it hits the top of the viewport
      end: () => `+=${window.innerWidth < 768 ? 250 : 340}%`, // Scroll distance (shorter on mobile)
      pin: true,
      pinSpacing: false,     // Allow subsequent elements to scroll up immediately
      zIndex: 1,             // Lower z-index for pinned container so overlaying elements stack on top
      scrub: 1.0,            // Highly responsive scroll scrub
      snap: {
        snapTo: (value) => {
          console.log("[SHOWCASE SNAP] Input progress:", value);
          if (value < 0.58) {
            const snaps = [0, 0.25, 0.5];
            const target = snaps.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
            console.log("[SHOWCASE SNAP] Snapping to card progress:", target);
            return target;
          }
          console.log("[SHOWCASE SNAP] Snapping to Motion (1.0)");
          return 1.0; // Snap to Motion page!
        },
        duration: { min: 0.2, max: 0.6 },
        delay: 0.08,
        ease: "power2.out"
      },
      onUpdate: (self) => {
        // High performance visibility toggle using state-change tracking to avoid layout thrashing.
        // Hides showcase completely when next section enters (60% on mobile, 70% on desktop).
        // Restores visibility on up-scroll.
        const isMobile = window.innerWidth < 768;
        const threshold = isMobile ? 0.60 : 0.70;
        const isCovered = self.progress >= threshold;
        const currentVisibility = showcaseSection.style.visibility;
        const targetVisibility = isCovered ? "hidden" : "visible";
        if (currentVisibility !== targetVisibility) {
          gsap.set(showcaseSection, { 
            visibility: targetVisibility,
            opacity: isCovered ? 0 : 1,
            pointerEvents: isCovered ? "none" : "auto"
          });
        }
      }
    }
  });

  // Step 1: Card 2 slides up to front, Card 1 recedes (Duration: 0.6)
  mainTimeline.addLabel("step1")
    .to(showcaseItems[1], { y: "4vh", filter: "blur(0px)", ease: "power1.inOut", duration: 0.6 }, "step1")
    .to(showcaseItems[0], { 
      y: 0,
      scale: 0.93, 
      z: -100, 
      rotationX: 3, 
      filter: "blur(6px)",
      transformOrigin: "top center",
      ease: "power1.inOut",
      duration: 0.6
    }, "step1")
    .to(blurredBgs[0], { opacity: 1, ease: "power1.inOut", duration: 0.6 }, "step1")
    .to(overlays[0], { backgroundColor: "rgba(0,0,0,0.55)", ease: "power1.inOut", duration: 0.6 }, "step1")
    .to(infos[0], { opacity: 0.35, ease: "power1.inOut", duration: 0.6 }, "step1");

  // Step 2: Card 3 slides up to front, Card 2 recedes, Card 1 recedes deeper (Duration: 0.6)
  mainTimeline.addLabel("step2")
    .to(showcaseItems[2], { y: "8vh", filter: "blur(0px)", ease: "power1.inOut", duration: 0.6 }, "step2")
    .to(showcaseItems[1], { 
      y: "4vh",
      scale: 0.93, 
      z: -100, 
      rotationX: 3, 
      filter: "blur(6px)",
      transformOrigin: "top center",
      ease: "power1.inOut",
      duration: 0.6
    }, "step2")
    .to(blurredBgs[1], { opacity: 1, ease: "power1.inOut", duration: 0.6 }, "step2")
    .to(overlays[1], { backgroundColor: "rgba(0,0,0,0.55)", ease: "power1.inOut", duration: 0.6 }, "step2")
    .to(infos[1], { opacity: 0.35, ease: "power1.inOut", duration: 0.6 }, "step2")
    
    // Card 1 sinks deeper
    .to(showcaseItems[0], { 
      y: 0,
      scale: 0.86, 
      z: -200, 
      rotationX: 6, 
      filter: "blur(12px)",
      transformOrigin: "top center",
      ease: "power1.inOut",
      duration: 0.6
    }, "step2")
    .to(overlays[0], { backgroundColor: "rgba(0,0,0,0.75)", ease: "power1.inOut", duration: 0.6 }, "step2")
    .to(infos[0], { opacity: 0.15, ease: "power1.inOut", duration: 0.6 }, "step2");

  // Step 3: Damping / Retention zone (Stay pinned with a very subtle exit compression before leaving) (Duration: 0.4)
  mainTimeline.addLabel("step3")
    .to(showcaseHeader, {
      y: "-50px",
      opacity: 0,
      ease: "power1.inOut",
      duration: 0.4
    }, "step3")
    .to(showcaseItems[2], { 
      y: "-15vh",
      scale: 0.9, 
      opacity: 0,
      z: -30, 
      rotationX: 1, 
      filter: "blur(10px)",
      transformOrigin: "top center",
      ease: "power1.inOut",
      duration: 0.4
    }, "step3")
    .to(showcaseItems[1], { 
      y: "-20vh",
      scale: 0.85, 
      opacity: 0,
      z: -130, 
      rotationX: 4, 
      filter: "blur(14px)",
      transformOrigin: "top center",
      ease: "power1.inOut",
      duration: 0.4
    }, "step3")
    .to(showcaseItems[0], { 
      y: "-25vh",
      scale: 0.8, 
      opacity: 0,
      z: -230, 
      rotationX: 7, 
      filter: "blur(18px)",
      transformOrigin: "top center",
      ease: "power1.inOut",
      duration: 0.4
    }, "step3")
    .addLabel("exit")
    .to({}, { duration: 0.8 }) // Empty transition zone to hold the pinned transparent state before next section enters
    .addLabel("end");
}
