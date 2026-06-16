import gsap from 'gsap';

// ═══════════ CRESCENT TITLE — PREMIUM CINEMA REVEAL (GSAP GPU-accelerated) ═══════════

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

  const isMobile = window.innerWidth <= 768;

  // ── Split eyebrow into individual char spans (only on first call) ──────────
  let eyebrowChars = null;
  if (eyebrow) {
    if (!eyebrow.dataset.charSplit) {
      const raw = eyebrow.textContent;
      eyebrow.innerHTML = raw.split('').map(ch =>
        ch === ' '
          ? `<span class="eyebrow-char" style="display:inline-block;white-space:pre"> </span>`
          : `<span class="eyebrow-char" style="display:inline-block">${ch}</span>`
      ).join('');
      eyebrow.dataset.charSplit = '1';
    }
    eyebrowChars = eyebrow.querySelectorAll('.eyebrow-char');
  }

  // ── Timeline ───────────────────────────────────────────────────────────────
  const tl = gsap.timeline({
    defaults: { ease: 'power4.out', duration: 1.3 },
    repeat: -1,
    repeatDelay: 0
  });
  window.heroTimeline = tl;

  // ── ENTRANCE ───────────────────────────────────────────────────────────────

  // 1. Eyebrow: char-by-char stagger from below + parent DoF blur
  if (eyebrow && eyebrowChars && eyebrowChars.length > 0) {
    tl.set(eyebrow, { opacity: 1 }, 0);
    tl.fromTo(eyebrow,
      { filter: 'blur(12px)' },
      { filter: 'blur(0px)', duration: 1.3, ease: 'power2.out' },
      0.6
    );
    tl.fromTo(eyebrowChars,
      { opacity: 0, y: '110%' },
      {
        opacity: 1,
        y: '0%',
        duration: 0.75,
        ease: 'power4.out',
        stagger: { each: 0.022, from: 'start' }
      },
      0.6
    );
  }

  // 2. Big title: char-level stagger with deep DoF blur on parent
  const lines = document.querySelectorAll('.hero-title-line');
  lines.forEach((line, index) => {
    const isBold = line.querySelector('.word-bold') !== null;

    if (isBold) {
      const chars = line.querySelectorAll('.hero-char');
      if (chars.length === 0) return;
      const boldWords = line.querySelectorAll('.hero-title-word.word-bold');

      tl.set(boldWords, { opacity: 1, y: '0%' }, 0);
      tl.fromTo(boldWords,
        { filter: 'blur(16px)' },
        { filter: 'blur(0px)', duration: 1.6, ease: 'power2.out' },
        0.1 + (index * 0.1)
      );
      tl.fromTo(chars,
        { opacity: 0, y: '80%', scale: 0.94 },
        {
          y: '0%',
          scale: 1,
          opacity: 1,
          duration: 1.4,
          ease: 'power4.out',
          stagger: { each: 0.05, from: 'start' }
        },
        0.1 + (index * 0.1)
      );

    } else {
      const wordsInLine = line.querySelectorAll('.hero-title-word');
      if (wordsInLine.length === 0) return;
      tl.fromTo(wordsInLine,
        { opacity: 0, y: '75%', scale: 0.96, filter: 'blur(12px)' },
        {
          y: '0%',
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.5,
          ease: 'power4.out'
        },
        0.1 + (index * 0.1)
      );
    }
  });

  // 3. Tech divider line
  if (dividerLine) {
    tl.fromTo(dividerLine,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.75, ease: 'power3.out' },
      0.4
    );
  }

  // 4. Divider meta tags
  if (metas.length > 0) {
    tl.fromTo(metas,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out' },
      0.65
    );
  }

  // 5. Hero subtitle
  if (subtitle) {
    tl.fromTo(subtitle,
      { opacity: 0, y: 14, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out' },
      0.72
    );
  }

  // 6. Scroll hint
  if (scrollHint) {
    tl.fromTo(scrollHint,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
      1.0
    );
  }

  // ── HOLD ───────────────────────────────────────────────────────────────────
  tl.add('hold', '+=4.5');

  // ── EXIT ───────────────────────────────────────────────────────────────────

  // 1. Eyebrow exit: chars slide back up
  if (eyebrow && eyebrowChars && eyebrowChars.length > 0) {
    tl.fromTo(eyebrow,
      { filter: 'blur(0px)' },
      { filter: 'blur(10px)', duration: 0.45, ease: 'power2.in' },
      'hold+=0.04'
    );
    tl.to(eyebrowChars, {
      y: '-100%',
      opacity: 0,
      duration: 0.42,
      ease: 'power3.in',
      stagger: { each: 0.016, from: 'start' }
    }, 'hold+=0.04');
  }

  // 2. Title exit
  lines.forEach((line, index) => {
    const isBold = line.querySelector('.word-bold') !== null;

    if (isBold) {
      const chars = line.querySelectorAll('.hero-char');
      if (chars.length === 0) return;
      const boldWords = line.querySelectorAll('.hero-title-word.word-bold');

      tl.fromTo(boldWords,
        { filter: 'blur(0px)' },
        { filter: 'blur(14px)', duration: 0.55, ease: 'power2.in' },
        `hold+=${index * 0.03}`
      );
      tl.to(chars, {
        y: '-75%',
        scale: 0.96,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.in',
        stagger: { each: 0.028, from: 'start' }
      }, `hold+=${index * 0.03}`);

    } else {
      const wordsInLine = line.querySelectorAll('.hero-title-word');
      if (wordsInLine.length === 0) return;
      tl.to(wordsInLine, {
        y: '-65%',
        scale: 0.96,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 0.55,
        ease: 'power3.in'
      }, `hold+=${index * 0.03}`);
    }
  });

  if (dividerLine) tl.to(dividerLine, { scaleX: 0, opacity: 0, duration: 0.38, ease: 'power2.in' }, 'hold+=0.1');
  if (metas.length > 0) tl.to(metas, { opacity: 0, y: -5, duration: 0.32, ease: 'power2.in' }, 'hold+=0.06');
  if (subtitle) tl.to(subtitle, { opacity: 0, y: -14, filter: 'blur(4px)', duration: 0.4, ease: 'power2.in' }, 'hold+=0.14');
  if (scrollHint) tl.to(scrollHint, { opacity: 0, duration: 0.32, ease: 'power2.in' }, 'hold+=0.18');
};

// Handle race condition: if loader finished before this script was loaded
if (window.loaderFinished) {
  window.revealHeroTitle();
}
