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
    defaults: { ease: 'power4.out', duration: 1.8 },
    repeat: -1,
    repeatDelay: 0
  });
  window.heroTimeline = tl;

  // ── ENTRANCE ───────────────────────────────────────────────────────────────

  // 1. Eyebrow: char-by-char stagger slide from below, parent DoF blur
  if (eyebrow && eyebrowChars && eyebrowChars.length > 0) {
    // Parent: visible immediately, cinematic blur resolves slowly
    tl.set(eyebrow, { opacity: 1 }, 0);
    tl.fromTo(eyebrow,
      { filter: 'blur(12px)' },
      { filter: 'blur(0px)', duration: 1.8, ease: 'power2.out' },
      0.85
    );
    // Each char slides up with stagger — identical feel to CRESCENT chars
    tl.fromTo(eyebrowChars,
      { opacity: 0, y: '110%' },
      {
        opacity: 1,
        y: '0%',
        duration: 1.1,
        ease: 'power4.out',
        stagger: { each: 0.028, from: 'start' }
      },
      0.85
    );
  }

  // 2. Big title: group by line, char-level stagger with deep DoF blur on parent
  const lines = document.querySelectorAll('.hero-title-line');
  lines.forEach((line, index) => {
    const isBold = line.querySelector('.word-bold') !== null;

    if (isBold) {
      const chars = line.querySelectorAll('.hero-char');
      if (chars.length === 0) return;
      const boldWords = line.querySelectorAll('.hero-title-word.word-bold');

      // Parent: visible immediately, deep cinema DoF blur resolves
      tl.set(boldWords, { opacity: 1, y: '0%' }, 0);
      tl.fromTo(boldWords,
        { filter: 'blur(16px)' },
        { filter: 'blur(0px)', duration: 2.2, ease: 'power2.out' },
        0.15 + (index * 0.12)
      );
      // Chars: clean vertical slide + subtle scale
      tl.fromTo(chars,
        { opacity: 0, y: '80%', scale: 0.94 },
        {
          y: '0%',
          scale: 1,
          opacity: 1,
          duration: 1.9,
          ease: 'power4.out',
          stagger: { each: 0.06, from: 'start' }
        },
        0.15 + (index * 0.12)
      );

    } else {
      // Outline words (VISUAL / LAB): unified slide + DoF blur
      const wordsInLine = line.querySelectorAll('.hero-title-word');
      if (wordsInLine.length === 0) return;
      tl.fromTo(wordsInLine,
        { opacity: 0, y: '75%', scale: 0.96, filter: 'blur(12px)' },
        {
          y: '0%',
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 2.0,
          ease: 'power4.out'
        },
        0.15 + (index * 0.12)
      );
    }
  });

  // 3. Tech divider line: elegant width reveal
  if (dividerLine) {
    tl.fromTo(dividerLine,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 1.0, ease: 'power3.out' },
      0.55
    );
  }

  // 4. Divider meta tags: gentle fade-slide
  if (metas.length > 0) {
    tl.fromTo(metas,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' },
      0.85
    );
  }

  // 5. Hero subtitle: soft float-in
  if (subtitle) {
    tl.fromTo(subtitle,
      { opacity: 0, y: 18, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' },
      0.95
    );
  }

  // 6. Scroll hint: delayed reveal
  if (scrollHint) {
    tl.fromTo(scrollHint,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' },
      1.3
    );
  }

  // ── HOLD ───────────────────────────────────────────────────────────────────
  tl.add('hold', '+=6.0');

  // ── EXIT ───────────────────────────────────────────────────────────────────

  // 1. Eyebrow exit: chars slide back up staggered, parent re-blurs
  if (eyebrow && eyebrowChars && eyebrowChars.length > 0) {
    tl.fromTo(eyebrow,
      { filter: 'blur(0px)' },
      { filter: 'blur(10px)', duration: 0.55, ease: 'power2.in' },
      'hold+=0.05'
    );
    tl.to(eyebrowChars, {
      y: '-100%',
      opacity: 0,
      duration: 0.5,
      ease: 'power3.in',
      stagger: { each: 0.02, from: 'start' }
    }, 'hold+=0.05');
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
        { filter: 'blur(14px)', duration: 0.7, ease: 'power2.in' },
        `hold+=${index * 0.04}`
      );
      tl.to(chars, {
        y: '-75%',
        scale: 0.96,
        opacity: 0,
        duration: 0.75,
        ease: 'power3.in',
        stagger: { each: 0.035, from: 'start' }
      }, `hold+=${index * 0.04}`);

    } else {
      const wordsInLine = line.querySelectorAll('.hero-title-word');
      if (wordsInLine.length === 0) return;
      tl.to(wordsInLine, {
        y: '-65%',
        scale: 0.96,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 0.7,
        ease: 'power3.in'
      }, `hold+=${index * 0.04}`);
    }
  });

  // Supporting elements exit
  if (dividerLine) tl.to(dividerLine, { scaleX: 0, opacity: 0, duration: 0.45, ease: 'power2.in' }, 'hold+=0.12');
  if (metas.length > 0) tl.to(metas, { opacity: 0, y: -5, duration: 0.4, ease: 'power2.in' }, 'hold+=0.08');
  if (subtitle) tl.to(subtitle, { opacity: 0, y: -16, filter: 'blur(4px)', duration: 0.5, ease: 'power2.in' }, 'hold+=0.18');
  if (scrollHint) tl.to(scrollHint, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 'hold+=0.22');
};

// Handle race condition: if loader finished before this script was loaded
if (window.loaderFinished) {
  window.revealHeroTitle();
}
