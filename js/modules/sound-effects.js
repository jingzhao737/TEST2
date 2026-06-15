;// ═══════════ SOUND EFFECTS (Web Audio API Synthesizer) ═══════════
(function() {
  let audioCtx = null;
  let cardClickBuffer = null;
  
  // Download the audio file immediately on load
  const arrayBufferPromise = fetch('sound/sound1/click1.mp3')
    .then(r => r.arrayBuffer())
    .catch(e => console.error('Failed to fetch card click sound:', e));

  function decodeCardSound() {
    const ctx = getAudioContext();
    if (!ctx || cardClickBuffer) return;
    if (arrayBufferPromise) {
      arrayBufferPromise
        .then(ab => {
          if (ab) return ctx.decodeAudioData(ab);
        })
        .then(buffer => {
          if (buffer) cardClickBuffer = buffer;
        })
        .catch(e => console.error('Error decoding card click sound:', e));
    }
  }

  function playCardClickSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    if (!cardClickBuffer) {
      // Fallback if not decoded yet
      playClickSound();
      return;
    }

    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = cardClickBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.5, now); // Set custom card click volume

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(now);
  }

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = window.__audioCtx || (window.__audioCtx = new AudioContextClass());
        decodeCardSound(); // Decode downloaded buffer as soon as context is created
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

    // Global mousedown — fires instantly on press (not on release like 'click')
    document.addEventListener('mousedown', (e) => {
      const target = e.target;
      if (!target) return;

      // Check if clicking a works card
      const isWorkCard = typeof target.closest === 'function' && target.closest('.work-card');
      if (isWorkCard) {
        playCardClickSound();
        return;
      }

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

  // Auto-resume global AudioContext on user interactions to prevent browser autoplay suspensions
  function resumeGlobalContext() {
    const ctx = window.__audioCtx;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function(e) { console.warn('Failed to resume AudioContext:', e); });
    }
  }
  window.addEventListener('mousedown', resumeGlobalContext, { passive: true });
  window.addEventListener('touchstart', resumeGlobalContext, { passive: true });
  window.addEventListener('keydown', resumeGlobalContext, { passive: true });

  window.__playHoverSound = playHoverSound;
  window.__playClickSound = playClickSound;
})();
