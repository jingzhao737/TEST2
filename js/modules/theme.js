;/* THEME */
(function initTheme() {
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light');
  }
  let btn = document.getElementById('themeToggle');
  let wrapper = document.getElementById('themePullWrapper');
  let stringEl = document.getElementById('themePullString');
  let anchor = document.getElementById('navThemeAnchor');
  let menuBtn = document.getElementById('navMenuBtn');
  if (!btn) return;

  // Position the anchor div to align with the nav-menu-btn center
  function positionAnchor() {
    if (!anchor || !menuBtn) return;
    const r = menuBtn.getBoundingClientRect();
    // Anchor top = bottom of nav (bottom of menuBtn area), centered on btn
    anchor.style.top = r.bottom + 'px';
    anchor.style.left = (r.left + r.width / 2) + 'px';
  }
  positionAnchor();
  window.addEventListener('resize', positionAnchor);
  window.addEventListener('scroll', positionAnchor, { passive: true });
  // Also re-position periodically in case nav transitions (scrolled state changes top)
  setInterval(positionAnchor, 500);

  // ── Audio ──
  let audioCtx = null;
  let clickBuffer = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      fetch('sound/sound1/Ding.wav')
        .then(function(r) { return r.arrayBuffer(); })
        .then(function(buf) { return audioCtx.decodeAudioData(buf); })
        .then(function(b) { clickBuffer = b; })
        .catch(function() {});
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playClick() {
    if (!audioCtx || !clickBuffer) return;
    let src = audioCtx.createBufferSource();
    let gain = audioCtx.createGain();
    src.buffer = clickBuffer;
    src.playbackRate.value = 0.92 + Math.random() * 0.16;
    gain.gain.setValueAtTime(0.4 + Math.random() * 0.2, audioCtx.currentTime);
    src.connect(gain).connect(audioCtx.destination);
    src.start(audioCtx.currentTime);
  }
  function playBounce() { playClick(); }

  let dragEnd = 40;
  let threshold = 60;
  let maxPull = 100;
  let resistance = 0.2;
  let dragging = false, startY = 0, pullY = 0, toggled = false;
  let inMotion = false;

  function setPull(v) {
    let raw = Math.max(0, v);
    if (raw <= dragEnd) {
      pullY = raw;
    } else {
      pullY = dragEnd + (raw - dragEnd) * resistance;
    }
    pullY = Math.min(pullY, maxPull);

    wrapper.style.transform = 'translateX(-50%) translateY(' + pullY + 'px)';
    stringEl.style.height = (pullY + 14) + 'px';
    if (pullY >= dragEnd && !toggled) {
      btn.style.borderColor = 'var(--accent)';
      btn.style.boxShadow = '0 0 16px var(--accent-glow)';
    } else if (pullY < dragEnd) {
      btn.style.borderColor = '';
      btn.style.boxShadow = '';
    }
    if (pullY >= threshold && !toggled) {
      toggled = true;
      doToggle();
      playClick();
      dragging = false;
      springBack();
      setTimeout(function() {
        window.__isDraggingTheme = false;
      }, 150);
    }
  }

  function springBack() {
    inMotion = true;
    wrapper.style.transition = 'transform .7s cubic-bezier(.34,1.56,.64,1)';
    stringEl.style.transition = 'height .7s cubic-bezier(.34,1.56,.64,1)';
    btn.style.transition = 'border-color .3s, box-shadow .3s';
    setPull(0);
    btn.style.borderColor = '';
    btn.style.boxShadow = '';
    setTimeout(function() {
      wrapper.style.transition = '';
      stringEl.style.transition = '';
      btn.style.transition = '';
      inMotion = false;
    }, 750);
  }

  function bounceBack() {
    let bounceY = pullY;
    inMotion = true;
    // Animate back with a nice spring — overshoot then settle
    wrapper.style.transition = 'transform .65s cubic-bezier(.34,1.56,.64,1)';
    stringEl.style.transition = 'height .65s cubic-bezier(.34,1.56,.64,1)';
    btn.style.transition = 'border-color .3s, box-shadow .3s';
    setPull(0);
    btn.style.borderColor = '';
    btn.style.boxShadow = '';
    playBounce();
    setTimeout(function() {
      wrapper.style.transition = '';
      stringEl.style.transition = '';
      btn.style.transition = '';
      inMotion = false;
    }, 700);
  }

  function doToggle() {
    document.documentElement.classList.toggle('light');
    const isLightMode = document.documentElement.classList.contains('light');
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }

  function onStart(e) {
    if (dragging || inMotion) return;
    initAudio();
    dragging = true; toggled = false;
    window.__isDraggingTheme = true;
    e.preventDefault();
    wrapper.style.transition = 'none';
    stringEl.style.transition = 'none';
    btn.style.transition = 'none';
    btn.style.borderColor = '';
    btn.style.boxShadow = '';
    startY = e.touches ? e.touches[0].clientY : e.clientY;
  }

  function onMove(e) {
    if (!dragging) return;
    e.preventDefault();
    let y = e.touches ? e.touches[0].clientY : e.clientY;
    let dy = y - startY;
    setPull(dy);
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    if (pullY > 0 && !toggled) {
      bounceBack();
    } else if (!inMotion) {
      springBack();
    }
    setTimeout(function() {
      window.__isDraggingTheme = false;
    }, 150);
  }

  setPull(0);
  stringEl.style.height = '14px';

  [wrapper, btn].forEach(function(el) {
    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
  });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
})();
