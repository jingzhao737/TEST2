;// ═══════════ SOUND EFFECTS (Web Audio API Synthesizer) ═══════════
(function() {
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = window.__audioCtx || (window.__audioCtx = new AudioContextClass());
      }
    }
    return audioCtx;
  }

  // Synthesize a woodblock pop (Sine wave, pitch slide 400Hz -> 80Hz, 80ms decay, low-pass filter at 800Hz, volume 0.05)
  function playHoverSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    
    // Pitch slide 400Hz -> 80Hz over 80ms
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    // Filter (low-pass at 800Hz)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    // Gain / Volume envelope (80ms decay)
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Connections
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Play & Stop
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Synthesize a soft click (Triangle wave, pitch slide 200Hz -> 40Hz, 120ms decay, low-pass filter at 400Hz, volume 0.12)
  function playClickSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';

    // Pitch slide 200Hz -> 40Hz over 120ms
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    // Filter (low-pass at 400Hz)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    // Gain / Volume envelope (120ms decay)
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    // Connections
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Play & Stop
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Bind events after DOM is loaded
  function initEvents() {
    // Hover pop on nav/ui elements
    const hovers = document.querySelectorAll('.nav-links a, .theme-toggle, .hdr-ring, .nav-next-btn');
    hovers.forEach(el => {
      el.addEventListener('mouseenter', () => {
        playHoverSound();
      });
    });

    // Interactive element selector — clicking these uses the heavier click sound
    const interactiveSelector = 'a, button, [role="button"], .work-card, .footer-cta, .detail-close, .gal-item, .motion-slide, .nav-menu-btn, .theme-toggle, .logo-wrapper, .lightbox-nav, .lightbox-close, .nav-waveform, .nav-next-btn, .hdr-ring, .ice-container, .zoom-slider-track, .zoom-slider-knob, .back-to-top, .scroll-dot-marker, .theme-pull-wrapper, .motion-hero, .scroll-thumb, .scroll-bubble, #framesCanvas';

    // Global click — fires on EVERY click anywhere on the page
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target) return;
      // Check if clicking an interactive element (louder click) vs. blank area (lighter hover tone)
      const isInteractive = typeof target.closest === 'function' && target.closest(interactiveSelector);
      if (isInteractive) {
        playClickSound();
      } else {
        // Lighter, shorter "tap" sound for blank/non-interactive areas
        playHoverSound();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents);
  } else {
    initEvents();
  }

  window.__playHoverSound = playHoverSound;
  window.__playClickSound = playClickSound;
})();
