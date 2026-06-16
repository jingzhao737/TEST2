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
    gainNode.connect(window.__masterGainNode || ctx.destination);
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
    gainNode.connect(window.__masterGainNode || ctx.destination);

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
    gainNode.connect(window.__masterGainNode || ctx.destination);

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

  // Synthesize a metallic forge clang sound (anvil strike with ring out)
  function playForgeClangSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    
    // An anvil strike sound can be modeled with:
    // 1. A short high-frequency noise transient (the hammer impact)
    // 2. Multiple sine/triangle wave harmonics that decay at different rates
    
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0, now);
    masterGain.gain.linearRampToValueAtTime(0.4, now + 0.005); // sharp attack
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8); // 1.8 seconds decay
    masterGain.connect(window.__masterGainNode || ctx.destination);

    // Hammer impact noise transient (high-passed noise)
    const bufferSize = ctx.sampleRate * 0.02; // 20ms burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(now);

    // Deep Bass Sub-boom Layer
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle'; // triangle has richer low end than sine
    // Pitch sweep: 90Hz -> 45Hz over 250ms
    bassOsc.frequency.setValueAtTime(90, now);
    bassOsc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    bassGain.gain.setValueAtTime(0.35, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // Decay over 1.2s

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + 1.3);

    // Inharmonic frequencies for metal ring (anvil modes)
    const frequencies = [220, 415, 620, 880, 1200, 1650, 2300];
    const decays = [1.5, 1.2, 0.9, 0.6, 0.4, 0.2, 0.1]; // higher frequencies decay faster
    const gains = [0.12, 0.10, 0.08, 0.06, 0.04, 0.02, 0.01];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      // Triangle for fundamental for warmer body, sine for pure harmonics
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(gains[idx], now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + decays[idx]);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + decays[idx] + 0.1);
    });
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
  window.__playForgeClangSound = playForgeClangSound;
})();
