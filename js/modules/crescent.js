import gsap from 'gsap';

// ═══════════ CRESCENT TITLE AWWWARDS REVEAL (GSAP & GPU-accelerated) ═══════════

// Reveal function for Loader to trigger on load complete
window.revealHeroTitle = function() {
  if (window.heroTimeline) {
    window.heroTimeline.kill();
  }
  const words = document.querySelectorAll('.hero-title-word');
  const dividerLine = document.querySelector('.divider-line');
  const metas = document.querySelectorAll('.divider-meta');
  const eyebrow = document.querySelector('.hero-eyebrow');
  const subtitle = document.querySelector('.hero-subtitle');
  const scrollHint = document.querySelector('.scroll-hint');

  if (words.length === 0) return;

  const tl = gsap.timeline({
    defaults: { ease: 'expo.out', duration: 1.6 },
    repeat: -1, // Infinite loop
    repeatDelay: 0 // ZERO delay between cycles for a snappy, seamless conveyor belt feel
  });
  window.heroTimeline = tl;

  // === ENTRANCE ===

  // 1. Premium letter-spacing assembly + blur focus-pull eyebrow entrance animation (reveals later as a crowning accent)
  if (eyebrow) {
    const isMobile = window.innerWidth <= 768;
    tl.fromTo(eyebrow, 
      { 
        opacity: 0, 
        y: 15,
        letterSpacing: '1.2em', // Starts wide
        filter: 'blur(8px)'     // Starts blurry
      }, 
      { 
        opacity: 1, 
        y: 0,
        letterSpacing: isMobile ? '0.22em' : '0.28em', // Resolves to CSS default
        filter: 'blur(0px)',                           // Resolves to sharp
        duration: 1.6, 
        ease: 'power2.out' 
      }, 
      0.9 // Delayed entrance to let the title start resolving first
    );
  }

  // 2. Line-mask reveal big title words, grouping by line so CRES and CENT move perfectly together
  const lines = document.querySelectorAll('.hero-title-line');
  lines.forEach((line, index) => {
    const isBold = line.querySelector('.word-bold') !== null;
    const isMobile = window.innerWidth <= 768;
    
    if (isBold) {
      const chars = line.querySelectorAll('.hero-char');
      if (chars.length === 0) return;
      
      const boldWords = line.querySelectorAll('.hero-title-word.word-bold');
      
      // 1. Set the parent words' opacity/layout properties instantly, but initialize blur to 8px
      tl.set(boldWords, { opacity: 1, y: '0%', skewY: 0 }, 0);
      
      // 2. Animate the parent words' blur filter (safe on mobile/Safari since they are not flex-items themselves)
      // Uses power2.out (quadratic ease) instead of steep expo.out to let the focus-pull linger and resolve gradually
      tl.fromTo(boldWords,
        { filter: 'blur(8px)' },
        { filter: 'blur(0px)', duration: 1.8, ease: 'power2.out' },
        0.2 + (index * 0.15)
      );
      
      // 3. Animate the individual characters staggering in (without individual blurs to avoid Safari layout bug)
      tl.fromTo(chars, 
        { opacity: 0, y: '102%', skewY: 8 }, 
        {
          y: '0%',
          skewY: 0,
          opacity: 1,
          duration: 1.5, // Majestic but smooth character slide-up
          ease: 'expo.out',
          stagger: 0.07 // Elegant cascade 8 letters one-by-one with 0.07s delay on both PC and Mobile
        }, 
        0.2 + (index * 0.15)
      );
    } else {
      const wordsInLine = line.querySelectorAll('.hero-title-word');
      if (wordsInLine.length === 0) return;
      
      tl.fromTo(wordsInLine, 
        { opacity: 0, y: '102%', skewY: 8, filter: 'blur(8px)' }, 
        {
          y: '0%',
          skewY: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 2.0,
          ease: 'expo.out'
        }, 
        0.2 + (index * 0.15)
      );
    }
  });

  // 3. Extend tech divider line from center (scaleX 0 -> 1) with skew sync
  if (dividerLine) {
    tl.fromTo(dividerLine, 
      { scaleX: 0, skewY: 6 }, 
      { scaleX: 1, skewY: 0, duration: 1.1, ease: 'power3.out' }, 
      0.55
    );
  }

  // 4. Fade in divider meta tags with skew sync
  if (metas.length > 0) {
    tl.fromTo(metas, 
      { opacity: 0, skewY: 6 }, 
      { opacity: 1, skewY: 0, stagger: 0.1, duration: 0.8, ease: 'power2.out' }, 
      0.85
    );
  }

  // 5. Smoothly reveal hero subtitle with synchronized skew
  if (subtitle) {
    tl.fromTo(subtitle, 
      { opacity: 0, y: 20, skewY: 6 }, 
      { opacity: 1, y: 0, skewY: 0, duration: 1.0 }, 
      0.9
    );
  }

  // 6. Smoothly reveal bottom scroll indicator hint
  if (scrollHint) {
    tl.fromTo(scrollHint, 
      { opacity: 0, y: 10 }, 
      { opacity: 1, y: 0, duration: 1.0 }, 
      1.2
    );
  }

  // === HOLD ===
  // Hold the resident state for 6 seconds
  tl.add("hold", "+=6.0");

  // Slide UP and out smoothly, grouped by line
  lines.forEach((line, index) => {
    const isBold = line.querySelector('.word-bold') !== null;
    const isMobile = window.innerWidth <= 768;
    
    if (isBold) {
      const chars = line.querySelectorAll('.hero-char');
      if (chars.length === 0) return;
      
      const boldWords = line.querySelectorAll('.hero-title-word.word-bold');
      
      // 1. Animate parent words to blur on exit starting explicitly from blur(0px) to prevent interpolation snapping
      tl.fromTo(boldWords, 
        { filter: 'blur(0px)' },
        {
          filter: 'blur(8px)',
          duration: 0.8,
          ease: 'expo.in'
        }, 
        `hold+=${index * 0.05}`
      );
      
      // 2. Animate individual characters sliding up/out staggered
      tl.to(chars, {
        y: '-102%',
        skewY: -8,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.in',
        stagger: 0.04 // Uniform stagger out on both PC and Mobile
      }, `hold+=${index * 0.05}`);
    } else {
      const wordsInLine = line.querySelectorAll('.hero-title-word');
      if (wordsInLine.length === 0) return;
      
      tl.to(wordsInLine, {
        y: '-102%',
        skewY: -8,
        opacity: 0,
        filter: 'blur(8px)',
        duration: 0.8,
        ease: 'expo.in'
      }, `hold+=${index * 0.05}`);
    }
  });

  if (eyebrow) {
    tl.to(eyebrow, { 
      opacity: 0, 
      y: -15, 
      letterSpacing: '0.8em', // Spread out on exit
      filter: 'blur(6px)',    // Dissolve into blur
      duration: 0.6, 
      ease: 'power2.in' 
    }, "hold+=0.1");
  }
  if (dividerLine) tl.to(dividerLine, { scaleX: 0, duration: 0.5, ease: 'power2.in' }, "hold+=0.15");
  if (metas.length > 0) tl.to(metas, { opacity: 0, duration: 0.4, ease: 'power2.in' }, "hold+=0.1");
  if (subtitle) tl.to(subtitle, { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' }, "hold+=0.2");
  if (scrollHint) tl.to(scrollHint, { opacity: 0, duration: 0.5, ease: 'power2.in' }, "hold+=0.25");
};

// Handle race condition: if loader finished before this script was loaded, reveal immediately
if (window.loaderFinished) {
  window.revealHeroTitle();
}
