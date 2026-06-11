import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ══════════════════════════════════════════════════════════════
//  PREMIUM CINEMATIC SHOWCASE — Horizontal Panel Slide
//  Cards sit side-by-side in a wide flex track.
//  ScrollTrigger pins the section and scrubs the x-translate.
// ══════════════════════════════════════════════════════════════

function initShowcase() {
const items   = gsap.utils.toArray('.showcase-item');
const section = document.querySelector('.showcase');
const grid    = document.querySelector('.showcase-grid');

if (!items.length || !section || !grid) return;

const N        = items.length;
const VW       = window.innerWidth;
const VH       = window.innerHeight;
const isMobile = VW < 768;

// ── 1. Activate cinematic mode ──────────────────────────────
section.classList.add('is-cinematic');
grid.classList.add('is-cinematic');
// Setup header
const header = section.querySelector('.showcase-header');
if (header) {
  header.classList.add('is-cinematic');
  header.classList.remove('anim-up', 'anim-done');
  header.style.opacity = '1';
  header.style.transform = 'none';
}

// Remove stale morph elements from previous non-cinematic mode
section.querySelectorAll('.morph-bg-color,.morph-color-ring,.morph-indicator,.morph-dots')
  .forEach(el => el.remove());

// ── 2. Wipe scroll-reveal.js interference ───────────────────
// scroll-reveal.js adds .anim-up which sets opacity:0 / translateY.
// We must neutralise this BEFORE GSAP initialises.
items.forEach(item => {
  item.classList.remove('anim-up', 'anim-done');
  item.style.opacity  = '';
  item.style.transform = '';
});

// ── 3. Text: split into characters ──────────────────────────
const wrapChars = (el) => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = '';
  [...text].forEach(ch => {
    if (ch === ' ') {
      el.appendChild(document.createTextNode('\u00A0'));
    } else {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch;
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
    }
  });
  return el.querySelectorAll('.char');
};

// ── 4. Inject global UI ─────────────────────────────────────
// Film grain per card
items.forEach(item => {
  const g = document.createElement('div');
  g.className = 'showcase-grain';
  item.appendChild(g);
});

// Rolling digit pager (bottom-right, outside the grid, inside section)
const pager = document.createElement('div');
pager.className = 'showcase-global-ticker';
pager.innerHTML = `
  <div class="ticker-digit-wrap">
    <div class="ticker-digit-track">
      ${items.map((_, i) => `<div class="ticker-digit">${String(i + 1).padStart(2, '0')}</div>`).join('')}
    </div>
  </div>
  <div class="ticker-sep">/</div>
  <div class="ticker-total">${String(N).padStart(2, '0')}</div>
`;
section.appendChild(pager);
const tickerTrack = pager.querySelector('.ticker-digit-track');

// Vertical progress bar (left-center, desktop only)
let progressFill = null;
if (!isMobile) {
  const bar = document.createElement('div');
  bar.className = 'showcase-global-progress';
  bar.innerHTML = '<div class="showcase-global-progress-fill"></div>';
  section.appendChild(bar);
  progressFill = bar.querySelector('.showcase-global-progress-fill');
}

// ── 5. Lay out the horizontal track ─────────────────────────
// The grid becomes N × 100vw wide; items are flex children.
gsap.set(grid, {
  width: N * VW,
  x: 0,
});

// ── 6. Per-card initial states + char splitting ──────────────
const cardData = items.map((item, i) => {
  const bg    = item.querySelector('.showcase-bg');
  const title = item.querySelector('.showcase-title');
  const tag   = item.querySelector('.showcase-info .section-tag');
  const desc  = item.querySelector('.showcase-info p');
  const chars = title ? wrapChars(title) : [];

  if (i === 0) {
    if (bg) gsap.set(bg, { x: 0, scale: 1.0 });
    gsap.set(chars, { y: 0, opacity: 1 });
    if (tag)  gsap.set(tag,  { y: 0, opacity: 1 });
    if (desc) gsap.set(desc, { y: 0, opacity: 1 });
  } else {
    if (bg) gsap.set(bg, { x: 40, scale: 1.06 });
    gsap.set(chars, { y: 32, opacity: 0 });
    if (tag)  gsap.set(tag,  { y: 20, opacity: 0 });
    if (desc) gsap.set(desc, { y: 20, opacity: 0 });
  }

  return { item, bg, title, chars, tag, desc };
});

// ── 7. Build scrubbed GSAP timeline ─────────────────────────
// BUFFER = time units reserved at each end for fade-in / fade-out.
// Total timeline duration = BUFFER + (N-1) + BUFFER.
// Total pin scroll distance = TL_DURATION × VH.
const SCRUB      = isMobile ? 0.35 : 0.5;
const BUFFER     = 0.45;                              // ~40% VH of "breathing room"
const TL_DUR     = BUFFER + (N - 1) + BUFFER;         // 2.9 for 3 cards
const PIN_END    = `+=${TL_DUR * VH}`;

// Card 0 starts slightly scaled and faded for a smooth entrance
const c0 = cardData[0];
if (c0) {
  if (c0.bg) gsap.set(c0.bg, { scale: 1.15 });
  gsap.set(c0.item, { opacity: 0 }); // Hidden initially to fade in during buffer
}

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: section,
    start: 'top top',
    end: PIN_END,
    pin: true,
    anticipatePin: 0,     // disabled — avoids premature pin jump
    scrub: SCRUB,
    onUpdate: (self) => {
      // Normalise progress to the SLIDE zone (BUFFER … BUFFER + N-1)
      const slideProgress = Math.max(0, Math.min(1,
        (self.progress * TL_DUR - BUFFER) / (N - 1)
      ));
      const raw    = slideProgress * (N - 1);
      const active = Math.round(raw);
      const digitH = 1.2;
      gsap.to(tickerTrack, {
        y: -(active * digitH) + 'em',
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      if (progressFill) {
        gsap.to(progressFill, {
          height: `${slideProgress * 100}%`,
          duration: 0.1,
          ease: 'none',
          overwrite: 'auto',
        });
      }
    },
  },
});

// ── 7a. Entry transition: Fade in & scale down Card 0 ─────────
if (c0) {
  tl.to(c0.item, { opacity: 1, duration: BUFFER, ease: 'power2.out' }, 0);
  if (c0.bg) tl.to(c0.bg, { scale: 1.0, duration: BUFFER, ease: 'power2.out' }, 0);
}

// ── 7b. Main horizontal slide (starts AFTER buffer) ───────────
tl.to(grid, {
  x: -(N - 1) * VW,
  ease: 'none',
  duration: N - 1,
}, BUFFER);

// ── 7c. Exit transition: Fade out the entire grid ─────────────
tl.to(grid, {
  opacity: 0,
  ease: 'power2.in',
  duration: BUFFER,
}, BUFFER + (N - 1));

// ── 7d. Per-card parallax + text animations ──────────────────
// All timeline positions are offset by BUFFER so they fall inside
// the horizontal slide zone, not the fade buffers.
cardData.forEach(({ bg, chars, tag, desc }, i) => {
  // BG parallax: moves slower than the card — creates depth.
  if (bg) {
    const startX = i === 0 ? 0   : 50;
    const endX   =           -50;
    tl.fromTo(bg,
      { x: startX },
      { x: endX, ease: 'none', duration: 1 },
      BUFFER + (i === 0 ? 0 : i - 1)
    );
  }

  // Each card's text entrance calculation
  // Card 0 text enters during the initial BUFFER (entry zone).
  // Other cards' text enters 55% of the way into the previous horizontal segment.
  const enter = i === 0 ? (BUFFER * 0.3) : (BUFFER + i - 0.55);

  if (chars.length) {
    tl.fromTo(chars,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.022, duration: 0.50, ease: 'power3.out' },
      enter
    );
  }
  if (tag) {
    tl.fromTo(tag,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, ease: 'power3.out' },
      enter - 0.05
    );
  }
  if (desc) {
    tl.fromTo(desc,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, ease: 'power3.out' },
      enter + 0.10
    );
  }
});

// ── 8. Ambient mouse parallax (desktop only) ─────────────────
if (!isMobile) {
  window.addEventListener('mousemove', (e) => {
    // Determine which card is currently in frame based on grid x
    const gridX    = gsap.getProperty(grid, 'x');
    const activeIdx = Math.round(-gridX / VW);
    const card      = cardData[Math.max(0, Math.min(activeIdx, N - 1))];
    if (!card) return;

    const rx = (e.clientX / VW - 0.5);
    const ry = (e.clientY / VH - 0.5);

    if (card.bg) {
      gsap.to(card.bg, {
        x: `+=${-rx * 18}`,
        y: `+=${-ry * 12}`,
        duration: 1.8,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    if (card.desc) {
      gsap.to(card.desc, {
        x: rx * 10,
        y: ry * 6,
        duration: 2.0,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  });
}
} // end initShowcase

initShowcase();
