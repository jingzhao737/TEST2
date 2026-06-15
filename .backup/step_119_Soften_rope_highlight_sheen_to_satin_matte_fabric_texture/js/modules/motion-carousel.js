import gsap from 'gsap';

// ═══════════ STACKED CARD DECK — zero-latency drag + spring snap ═══════════
(function() {
  const hero  = document.getElementById('motionHero');
  const track = document.getElementById('motionTrack');
  if (!track || !hero) return;

  const slides = Array.from(track.querySelectorAll('.motion-slide'));
  const videos = slides.map(s => s.querySelector('video'));
  const total  = slides.length;
  let current  = 0;
  let isAnimating = false;

  // ── Dots ───────────────────────────────────────────────────────────────────
  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'motion-dots';
  const dots = slides.map((_, i) => {
    const d = document.createElement('div');
    d.className = 'motion-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i, 0));
    dotsWrap.appendChild(d);
    return d;
  });
  hero.appendChild(dotsWrap);

  // ── Stack geometry ─────────────────────────────────────────────────────────
  function lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  function getContinuousState(offset) {
    let abs = Math.abs(offset);
    if (abs > 2) abs = 2; // clamp
    const sign = offset < 0 ? -1 : 1;
    
    if (abs <= 1) {
      const t = abs;
      return {
        xPercent: lerp(0, sign * 65, t),
        scale: lerp(1, 0.85, t),
        rotY: lerp(0, sign * -25, t),
        opacity: lerp(1, 0.5, t),
        blur: lerp(0, 8, t), // True DSLR depth of field blur
        z: t < 0.5 ? 10 : 5
      };
    } else {
      const t = abs - 1;
      return {
        xPercent: lerp(sign * 65, sign * 100, t),
        scale: lerp(0.85, 0.7, t),
        rotY: lerp(sign * -25, sign * -40, t),
        opacity: lerp(0.5, 0, t),
        blur: lerp(8, 14, t),
        z: t < 0.5 ? 5 : 1
      };
    }
  }

  function getState(offset) {
    return getContinuousState(offset); // Fallback for discrete calls
  }

  function toProps(st) {
    return { 
      xPercent: st.xPercent, scale: st.scale, rotationY: st.rotY, opacity: st.opacity, 
      zIndex: st.z, filter: `blur(${st.blur}px)`, x: 0, yPercent: 0 
    };
  }

  function getOffset(i) {
    let raw = (i - current + total) % total;
    return raw > total / 2 ? raw - total : raw;
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function initLayout() {
    gsap.set(track, { perspective: 1600, transformStyle: "preserve-3d" });
    slides.forEach((slide, i) => {
      gsap.set(slide, { transformStyle: "preserve-3d", willChange: "transform, opacity, filter" });
      const off = getOffset(i);
      slide.classList.toggle('is-active', off === 0);
      gsap.set(slide, toProps(getState(off)));
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  // ── Transition ─────────────────────────────────────────────────────────────
  function goTo(newIdx, dir) {
    newIdx = ((newIdx % total) + total) % total;
    if (newIdx === current) return;
    
    // We don't kill tweens anymore because we use overwrite:'auto' which is much smoother
    
    const exitIdx = current;
    current = newIdx;
    if (dir === 0) dir = newIdx > exitIdx ? 1 : -1;

    const tl = gsap.timeline({
      onComplete: () => {
        const off = getOffset(exitIdx);
        gsap.set(slides[exitIdx], toProps(getState(off)));
        slides[exitIdx].classList.toggle('is-active', off === 0);
      }
    });

    // Exit card sweeps out completely with heavy, premium cubic ease
    tl.to(slides[exitIdx], {
      xPercent: dir < 0 ? 100 : -100,
      rotationY: dir < 0 ? -40 : 40,
      scale: 0.8,
      opacity: 0,
      filter: 'blur(12px)',
      duration: 0.9,
      ease: 'power3.out'
    }, 0);

    // Remaining cards glide dynamically with buttery smooth power3.out (cubic) ease
    slides.forEach((slide, i) => {
      if (i === exitIdx) return;
      const off = getOffset(i);
      const st  = getState(off);
      slide.classList.toggle('is-active', off === 0);
      tl.to(slide, { ...toProps(st), duration: 1.2, ease: 'power3.out' }, 0);
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    playCurrent();
  }

  function next() { goTo((current + 1) % total, 1); }
  function prev() { goTo((current - 1 + total) % total, -1); }

  // ── Video ──────────────────────────────────────────────────────────────────
  function playCurrent() {
    videos.forEach((v, i) => {
      if (i === current) { v.currentTime = 0; v.play().catch(() => {}); }
      else { v.pause(); v.currentTime = 0; }
    });
  }
  videos.forEach(v => v.addEventListener('ended', next));

  // ── Drag — Physics Engine: Inertia + Rubber Band + Spring Snap ──────────────
  let dragStart = null, dragX = 0, isDragging = false;
  let dragStartY = 0;
  let directionLocked = false; // true once we know it's horizontal
  let isVerticalScroll = false; // true if user is scrolling vertically
  const DRAG_WIDTH = window.innerWidth * 0.40;

  // ── Velocity sampling: rolling window of last 6 frames ──
  const VEL_WINDOW = 6;
  let velSamples = [];
  let lastMx = 0;
  let lastMoveTime = 0;

  function sampleVelocity(mx) {
    const now = performance.now();
    const dt = now - lastMoveTime;
    if (dt > 0) {
      velSamples.push({ v: (mx - lastMx) / Math.max(dt, 4), t: now });
      if (velSamples.length > VEL_WINDOW) velSamples.shift();
    }
    lastMx = mx;
    lastMoveTime = now;
  }

  function getSmoothedVelocity() {
    const now = performance.now();
    // Only use samples from last 120ms
    const recent = velSamples.filter(s => now - s.t < 120);
    if (recent.length === 0) return 0;
    // Weighted average: more recent = higher weight
    let sum = 0, wSum = 0;
    recent.forEach((s, i) => {
      const w = (i + 1); // linear weight
      sum += s.v * w;
      wSum += w;
    });
    return sum / wSum;
  }

  // ── Rubber band: exponential resistance past a threshold ──
  function rubberBand(dx) {
    const sign = dx < 0 ? -1 : 1;
    const abs = Math.abs(dx);
    const threshold = DRAG_WIDTH * 0.6;
    if (abs <= threshold) return dx;
    // Logarithmic decay past threshold — pull harder = diminishing return
    const overshoot = abs - threshold;
    const damped = threshold + overshoot * 0.35 / (1 + overshoot / (DRAG_WIDTH * 0.8));
    return sign * damped;
  }

  // ── Drag tilt: subtle rotateY based on drag velocity ──
  function getDragTilt(velPx) {
    // Max ±4 degrees of tilt proportional to velocity
    return Math.max(-4, Math.min(4, velPx * 0.25));
  }

  function onDown(e) {
    const mx = e.clientX ?? e.touches?.[0]?.clientX;
    const my = e.clientY ?? e.touches?.[0]?.clientY;
    if (mx == null || my == null) return;
    dragStart = mx;
    dragX = 0;
    dragStartY = my;
    isDragging = true;
    directionLocked = false;
    isVerticalScroll = false;
    velSamples = [];
    lastMx = mx;
    lastMoveTime = performance.now();

    // Kill any ongoing momentum animations
    slides.forEach(s => gsap.killTweensOf(s));

    hero.classList.add('dragging');

    // Subtle "pickup" scale on active card
    gsap.to(slides[current], {
      scale: 0.975,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }

  function onMove(e) {
    if (!isDragging) return;
    const mx = e.clientX ?? e.touches?.[0]?.clientX;
    const my = e.clientY ?? e.touches?.[0]?.clientY;
    if (mx == null || my == null) return;

    const rawDx = mx - dragStart;
    const dy = my - dragStartY;

    // Direction lock: decide once after 8px of movement
    if (!directionLocked && (Math.abs(rawDx) > 8 || Math.abs(dy) > 8)) {
      directionLocked = true;
      isVerticalScroll = Math.abs(dy) > Math.abs(rawDx) * 1.2;
    }

    // If vertical scroll, bail out
    if (isVerticalScroll) return;

    if (e.cancelable) e.preventDefault();

    // Capture instantaneous velocity BEFORE sampling updates lastMx
    const instantVel = mx - lastMx;
    sampleVelocity(mx);

    // Apply rubber band resistance
    dragX = rubberBand(rawDx);

    const dragTilt = getDragTilt(instantVel);

    slides.forEach((slide, i) => {
      const baseOff = getOffset(i);
      const continuousOff = baseOff + (dragX / DRAG_WIDTH);
      const st = getContinuousState(continuousOff);

      // Add drag tilt only to the active card for tactile feedback
      const extraTilt = (i === current) ? dragTilt : dragTilt * 0.3;

      gsap.to(slide, {
        ...toProps(st),
        rotationY: st.rotY + extraTilt,
        scale: (i === current) ? st.scale * 0.975 : st.scale,
        duration: 0.38,  // Viscous damping — oil-in-water tracking feel
        ease: 'power3.out',
        overwrite: 'auto'
      });
    });
  }

  function onUp() {
    if (!isDragging) return;
    isDragging = false;
    hero.classList.remove('dragging');

    const progress = dragX / DRAG_WIDTH;
    // Use smoothed velocity (px/ms) converted to a usable threshold
    const vel = getSmoothedVelocity();
    const flickThreshold = 0.45; // px/ms — needs a deliberate brisk flick

    const shouldGoNext = progress < -0.2 || vel < -flickThreshold;
    const shouldGoPrev = progress > 0.2 || vel > flickThreshold;

    if (shouldGoNext) {
      // Momentum-boosted transition: faster flick = faster animation
      const flickSpeed = Math.abs(vel);
      const baseDur = 1.5;
      const momentumDur = Math.max(0.9, baseDur - flickSpeed * 0.4);
      goToWithMomentum((current + 1) % total, 1, momentumDur);
    } else if (shouldGoPrev) {
      const flickSpeed = Math.abs(vel);
      const baseDur = 1.3;
      const momentumDur = Math.max(0.7, baseDur - flickSpeed * 0.5);
      goToWithMomentum((current - 1 + total) % total, -1, momentumDur);
    } else {
      // Spring snap-back with overshoot
      slides.forEach((slide, i) => {
        const off = getOffset(i);
        gsap.to(slide, {
          ...toProps(getState(off)),
          duration: 1.4,
          ease: 'elastic.out(0.6, 0.5)',
          overwrite: 'auto'
        });
      });
    }
    dragStart = null; dragX = 0;
    velSamples = [];
  }

  // ── Momentum-aware goTo: respects flick energy ──
  function goToWithMomentum(newIdx, dir, duration) {
    newIdx = ((newIdx % total) + total) % total;
    if (newIdx === current) return;

    const exitIdx = current;
    current = newIdx;
    if (dir === 0) dir = newIdx > exitIdx ? 1 : -1;

    const tl = gsap.timeline({
      onComplete: () => {
        const off = getOffset(exitIdx);
        gsap.set(slides[exitIdx], toProps(getState(off)));
        slides[exitIdx].classList.toggle('is-active', off === 0);
      }
    });

    // Exit card sweeps out — duration adapts to flick energy
    tl.to(slides[exitIdx], {
      xPercent: dir < 0 ? 100 : -100,
      rotationY: dir < 0 ? -40 : 40,
      scale: 0.78,
      opacity: 0,
      filter: 'blur(14px)',
      duration: duration,
      ease: 'power4.out'
    }, 0);

    // Remaining cards settle with slight overshoot for spring feel
    slides.forEach((slide, i) => {
      if (i === exitIdx) return;
      const off = getOffset(i);
      const st = getState(off);
      slide.classList.toggle('is-active', off === 0);
      tl.to(slide, {
        ...toProps(st),
        duration: duration * 1.5,
        ease: 'power4.out',
        overwrite: 'auto'
      }, 0);
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    playCurrent();
  }

  hero.addEventListener('mousedown',  onDown);
  hero.addEventListener('mousemove',  onMove);
  hero.addEventListener('mouseup',    onUp);
  hero.addEventListener('mouseleave', onUp);
  hero.addEventListener('touchstart', onDown, { passive: true });
  hero.addEventListener('touchmove',  onMove, { passive: false });
  hero.addEventListener('touchend',   onUp);

  document.addEventListener('keydown', e => {
    if (document.getElementById('workDetail')?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // ── Boot ───────────────────────────────────────────────────────────────────
  initLayout();

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) videos[current].play().catch(() => {});
    else videos.forEach(v => v.pause());
  }, { threshold: 0.3 }).observe(track);
  // ── Timecode dynamic HUD HUD updater ──────────────────────────────────────────
  const timecodeEl = document.getElementById('motionTimecode');
  if (timecodeEl) {
    function updateTimecode() {
      const activeVideo = videos[current];
      if (activeVideo) {
        const t = activeVideo.currentTime;
        const mins = Math.floor(t / 60);
        const secs = Math.floor(t % 60);
        const frames = Math.floor((t % 1) * 24);
        timecodeEl.textContent = `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
      }
      requestAnimationFrame(updateTimecode);
    }
    requestAnimationFrame(updateTimecode);
  }

})();


// ─── MENU PANEL ──────────────────────────────────────────────────────────────
(function() {
  const btn      = document.getElementById('navMenuBtn');
  const panel    = document.getElementById('menuPanel');
  const nav      = document.getElementById('nav');
  const closeBtn = document.getElementById('menuPanelClose');
  const cursorDot  = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const pageTransition = document.getElementById('pageTransition');
  if (!btn || !panel) return;

  function openMenu() {
    btn.classList.add('open');
    panel.classList.add('open');
    if (nav) nav.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    const sb = document.getElementById('scrollBar');
    if (sb) sb.style.display = 'none';
    if (window.__updateMagnetTargets) window.__updateMagnetTargets();
  }

  function closeMenu() {
    btn.classList.remove('open');
    panel.classList.remove('open');
    if (nav) nav.classList.remove('menu-open');
    document.body.style.overflow = '';
    const sb = document.getElementById('scrollBar');
    if (sb) sb.style.display = '';
    if (window.__updateMagnetTargets) window.__updateMagnetTargets();
  }

  btn.addEventListener('click', () => {
    panel.classList.contains('open') ? closeMenu() : openMenu();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
  });

  panel.querySelectorAll('.menu-nav-link[data-link]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.link);
      if (!target) return;
      closeMenu();
      if (pageTransition) {
        pageTransition.classList.add('active');
        setTimeout(() => pageTransition.classList.remove('active'), 1000);
      }
      const top = link.dataset.link === 'home'
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      const wd = document.getElementById('workDetail');
      if (wd?.classList.contains('open')) document.getElementById('detailClose')?.click();
    });
  });
})();
