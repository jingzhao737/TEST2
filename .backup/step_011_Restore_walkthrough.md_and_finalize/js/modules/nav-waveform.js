;// ═══════════ NAV WAVEFORM (Audio Analyser reactive) ═══════════
(function(){
  let waveCanvas = document.getElementById('navWaveform');
  if (!waveCanvas) return;
  let ctx = waveCanvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let waveW = 0, waveH = 0;

  function initSize() {
    waveW = waveCanvas.offsetWidth || waveCanvas.width || 140;
    waveH = waveCanvas.offsetHeight || waveCanvas.height || 32;
    waveCanvas.width = waveW * dpr;
    waveCanvas.height = waveH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  initSize();

  let isVisible = true;
  new IntersectionObserver(function(e) { isVisible = e[0].isIntersecting; }, { threshold: 0 }).observe(waveCanvas);

  // ── Web Audio API shared Analyser Setup ──
  let audioCtx = null;
  let analyser = null;
  let dataArray = null;
  const sourceNodes = new Map();

  function initAudioAnalyser() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      // Share a single global AudioContext to avoid browser limit warnings
      audioCtx = window.__audioCtx || (window.__audioCtx = new AudioContextClass());
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128; // 64 frequency bins, perfect resolution for a small canvas
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    } catch (e) {
      console.warn("[Waveform] AudioContext failed to initialize:", e);
    }
  }

  function connectAudioSource(audioElement) {
    if (!audioCtx || !analyser) return;
    if (!sourceNodes.has(audioElement)) {
      try {
        audioElement.crossOrigin = "anonymous";
        const source = audioCtx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        sourceNodes.set(audioElement, source);
      } catch (err) {
        // Safe catch if already connected in another context
      }
    }
  }

  function resumeCtx() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  window.addEventListener('click', resumeCtx, { once: false });
  window.addEventListener('touchstart', resumeCtx, { once: false });

  function draw() {
    if (!isVisible) { requestAnimationFrame(draw); return; }
    initSize();
    if (waveW < 2 || waveH < 2) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, waveW, waveH);

    let playing = window.__audioPlaying === true;
    let mid = waveH / 2;
    let time = Date.now() * 0.0028;

    // Proactively scan for any playing bgAudios and connect them dynamically
    let playingAudio = null;
    if (window.__bgAudios) {
      for (let i = 0; i < window.__bgAudios.length; i++) {
        const a = window.__bgAudios[i];
        if (a && !a.paused) {
          playingAudio = a;
          break;
        }
      }
    }

    if (playingAudio) {
      if (!audioCtx) initAudioAnalyser();
      if (audioCtx) {
        resumeCtx();
        connectAudioSource(playingAudio);
      }
    }

    // Capture real-time frequency data
    if (analyser && dataArray && playing) {
      analyser.getByteFrequencyData(dataArray);
    }

    // Smoothly lerp amplitude scale
    if (window.__waveAmp === undefined) window.__waveAmp = 0.06;

    let targetAmp = 0.08;
    if (playing) {
      if (dataArray) {
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        let avgVolume = sum / dataArray.length;
        // Dynamically scale wave amplitude based on volume (spikes and pulses to the beat)
        targetAmp = 0.28 + (avgVolume / 255.0) * 1.35;
      } else {
        targetAmp = 1.0;
      }
    }
    window.__waveAmp += (targetAmp - window.__waveAmp) * 0.08;
    let ampScale = window.__waveAmp;

    // Gradient 1: Accent Orange for Main Wave
    let grad1 = ctx.createLinearGradient(0, 0, waveW, 0);
    grad1.addColorStop(0, 'rgba(232, 124, 80, 0)');
    grad1.addColorStop(0.18, 'rgba(232, 124, 80, 0.85)');
    grad1.addColorStop(0.5, 'rgba(232, 124, 80, 1)');
    grad1.addColorStop(0.82, 'rgba(232, 124, 80, 0.85)');
    grad1.addColorStop(1, 'rgba(232, 124, 80, 0)');

    // Gradient 2: Delicate White/Gold for Secondary Wave
    let grad2 = ctx.createLinearGradient(0, 0, waveW, 0);
    grad2.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad2.addColorStop(0.2, 'rgba(255, 255, 255, 0.35)');
    grad2.addColorStop(0.5, 'rgba(255, 255, 255, 0.55)');
    grad2.addColorStop(0.8, 'rgba(255, 255, 255, 0.35)');
    grad2.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // Gradient 3: Faint Accent Glow for Background Wave
    let grad3 = ctx.createLinearGradient(0, 0, waveW, 0);
    grad3.addColorStop(0, 'rgba(232, 124, 80, 0)');
    grad3.addColorStop(0.25, 'rgba(232, 124, 80, 0.22)');
    grad3.addColorStop(0.5, 'rgba(232, 124, 80, 0.35)');
    grad3.addColorStop(0.75, 'rgba(232, 124, 80, 0.22)');
    grad3.addColorStop(1, 'rgba(232, 124, 80, 0)');

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Wave 3: Deep Background wave
    ctx.strokeStyle = grad3;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let x = 0; x <= waveW; x += 1.5) {
      let progress = x / waveW;
      let envelope = Math.sin(progress * Math.PI);
      let y = mid + Math.sin(x * 0.022 + time * 1.1) * 9 * envelope * ampScale;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Wave 2: Secondary White Wave
    ctx.strokeStyle = grad2;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x <= waveW; x += 1.5) {
      let progress = x / waveW;
      let envelope = Math.sin(progress * Math.PI);
      let y = mid + Math.sin(x * 0.075 - time * 3.3) * 5 * envelope * ampScale
                + Math.sin(x * 0.038 + time * 1.4) * 3.5 * envelope * ampScale;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Wave 1: Main Orange Wave
    ctx.strokeStyle = grad1;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let x = 0; x <= waveW; x += 1.5) {
      let progress = x / waveW;
      let envelope = Math.sin(progress * Math.PI);
      let y = mid + Math.sin(x * 0.045 + time * 2.2) * 8 * envelope * ampScale
                + Math.sin(x * 0.11 - time * 4.1) * 2.5 * envelope * ampScale;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', initSize);

  // Initialize shared audio files in case hanging-circles.js didn't run
  function initSharedAudios() {
    if (!window.__bgAudios) {
      window.__bgAudios = [
        new Audio('sound/01.mp3'),
        new Audio('sound/02.mp3'),
        new Audio('sound/03.mp3'),
        new Audio('sound/04.mp3')
      ];
      window.__bgAudios.forEach(function(a) { a.loop = true; a.volume = 0.6; });
      window.__currentTrackIdx = 0;
    }
  }

  let nextBtn = document.getElementById('navNextBtn');

  function updateNextBtnState() {
    if (!nextBtn) return;
    let isPlaying = window.__audioPlaying === true;
    if (isPlaying) {
      nextBtn.classList.add('is-active');
    } else {
      nextBtn.classList.remove('is-active');
    }
  }
  window.__updateNextBtnState = updateNextBtnState;

  // Toggle play/pause when tapping/clicking the wave canvas
  waveCanvas.addEventListener('click', function() {
    initSharedAudios();
    
    let isPlaying = window.__audioPlaying === true;
    if (isPlaying) {
      // Pause track
      window.__bgAudios.forEach(a => a.pause());
      window.__audioPlaying = false;
      // Sync desktop circles (unlatch all)
      if (typeof window.__unlatchAll === 'function') {
        window.__unlatchAll();
      }
    } else {
      // Play current track
      let idx = window.__currentTrackIdx || 0;
      window.__bgAudios.forEach((a, i) => {
        if (i !== idx) {
          a.pause();
          a.currentTime = 0;
        }
      });
      window.__bgAudios[idx].play().catch(e => console.log("Audio play failed:", e));
      window.__audioPlaying = true;
      // Sync desktop circles (latch corresponding disc)
      if (typeof window.__latchDisc === 'function') {
        window.__latchDisc(idx);
      }
    }
    updateNextBtnState();
  });

  // Cycle tracks when tapping/clicking next button
  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // Avoid triggering waveCanvas play/pause toggle
      initSharedAudios();
      
      let nextIdx = ((window.__currentTrackIdx || 0) + 1) % 4;
      window.__currentTrackIdx = nextIdx;
      
      // Stop current & play next
      window.__bgAudios.forEach((a, i) => {
        a.pause();
        a.currentTime = 0;
      });
      
      window.__bgAudios[nextIdx].play().catch(e => console.log("Audio play failed:", e));
      window.__audioPlaying = true;
      window.__waveAmp = 1.8; // Awwwards-level: spike the soundwave amplitude on skip!
      
      // Force slide animation on click/tap
      let icon = nextBtn.querySelector('.nav-next-icon');
      if (icon) {
        icon.classList.remove('run-slide');
        void icon.offsetWidth; // Force reflow
        icon.classList.add('run-slide');
      }

      // Sync desktop circles (latch corresponding disc)
      if (typeof window.__latchDisc === 'function') {
        window.__latchDisc(nextIdx);
      }
      
      updateNextBtnState();
    });

    nextBtn.addEventListener('mouseenter', function() {
      let icon = nextBtn.querySelector('.nav-next-icon');
      if (icon && !icon.classList.contains('run-slide')) {
        icon.classList.add('run-slide');
      }
    });

    nextBtn.addEventListener('animationend', function() {
      let icon = nextBtn.querySelector('.nav-next-icon');
      if (icon) {
        icon.classList.remove('run-slide');
      }
    });
  }
})();
