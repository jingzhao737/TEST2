(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'laserCanvas';
  document.body.appendChild(canvas);

  // Style the canvas dynamically to overlay screen and ignore mouse events
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none';
  canvas.style.mixBlendMode = 'screen';

  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const segments = [];
  const sparks = [];
  
  // Signature Holographic Laser Palette
  const colors = [
    '#ff8da1', // Holographic Pink
    '#b19ffb', // Holographic Purple
    '#70e6d2', // Holographic Turquoise
    '#ffffff'  // Laser White
  ];
  
  let colorIndex = 0;

  // The interactive selector list where laser drawing is disabled
  const interactiveSelector = 'a, button, [role="button"], .work-card, .footer-cta, .detail-close, .gal-item, .motion-slide, .nav-menu-btn, .theme-toggle, .logo-wrapper, .lightbox-nav, .lightbox-close, .nav-waveform, .nav-next-btn, .hdr-ring, .ice-container, .zoom-slider-track, .zoom-slider-knob, .back-to-top, .scroll-dot-marker, .theme-pull-wrapper, .motion-hero, .scroll-thumb, .scroll-bubble, #framesCanvas';

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  
  // LERP delay variables to match custom cursor trailing physics
  let cX = 0;
  let cY = 0;
  let targetX = 0;
  let targetY = 0;
  let isFirstDraw = true;

  function isInteractive(target) {
    if (!target) return false;
    return target.closest(interactiveSelector) !== null;
  }

  // Handle mousedown/touchstart
  function handleStart(x, y, target, e) {
    if (isInteractive(target)) return;
    
    // Prevent text selection highlights on desktop
    if (e && e.type === 'mousedown' && e.cancelable) {
      e.preventDefault();
    }

    isDrawing = true;
    targetX = x;
    targetY = y;
    
    if (isFirstDraw) {
      cX = x;
      cY = y;
      isFirstDraw = false;
    }
    
    lastX = cX;
    lastY = cY;

    // Trigger laser splash burst on click
    createBurst(cX, cY);
  }

  // Handle mousemove/touchmove
  function handleMove(x, y, target) {
    if (!isDrawing) return;
    if (isInteractive(target)) {
      isDrawing = false;
      return;
    }

    targetX = x;
    targetY = y;
  }

  function handleEnd() {
    isDrawing = false;
    isFirstDraw = true;
  }

  // Generate laser spark burst on click
  function createBurst(x, y) {
    const numSparks = 8 + Math.floor(Math.random() * 6); // 8-14 sparks
    for (let i = 0; i < numSparks; i++) {
      const angle = (i / numSparks) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 3 + Math.random() * 7;
      const color = colors[Math.floor(Math.random() * colors.length)];
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        created: Date.now(),
        life: 400 + Math.random() * 300 // 400ms - 700ms lifespan
      });
    }
  }

  // Mouse listeners
  window.addEventListener('mousedown', (e) => {
    handleStart(e.clientX, e.clientY, e.target, e);
  });

  window.addEventListener('mousemove', (e) => {
    handleMove(e.clientX, e.clientY, e.target);
  });

  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('mouseleave', handleEnd);

  // Touch listeners (mobile/tablet support without preventing scroll)
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, touch.target, e);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY, touch.target);
    }
  }, { passive: true });

  window.addEventListener('touchend', handleEnd);
  window.addEventListener('touchcancel', handleEnd);

  // Animation Loop
  function loop() {
    ctx.clearRect(0, 0, width, height);
    
    const now = Date.now();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // LERP drawing position to match custom cursor LERP delay (0.09)
    if (isDrawing) {
      cX += (targetX - cX) * 0.09;
      cY += (targetY - cY) * 0.09;

      const dist = Math.sqrt(Math.pow(cX - lastX, 2) + Math.pow(cY - lastY, 2));
      if (dist > 0.5) {
        const color = colors[Math.floor(colorIndex) % colors.length];
        colorIndex += 0.15;

        segments.push({
          x1: lastX,
          y1: lastY,
          x2: cX,
          y2: cY,
          color: color,
          created: now,
          life: 800 // 800ms lifespan
        });

        lastX = cX;
        lastY = cY;
      }
    }

    // Draw & decay drawn line segments
    for (let i = segments.length - 1; i >= 0; i--) {
      const s = segments[i];
      const age = (now - s.created) / s.life;

      if (age >= 1) {
        segments.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      
      // Laser bloom styling with screen blend
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3.5 * (1 - age);
      ctx.globalAlpha = 1 - age;
      ctx.shadowBlur = 12 * (1 - age);
      ctx.shadowColor = s.color;
      
      ctx.stroke();
    }

    // Draw & decay laser sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const age = (now - s.created) / s.life;

      if (age >= 1) {
        sparks.splice(i, 1);
        continue;
      }

      // Update position with friction drag
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.95;
      s.vy *= 0.95;

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 1.5, s.y - s.vy * 1.5); // Directional velocity tail

      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.0 * (1 - age);
      ctx.globalAlpha = 1 - age;
      ctx.shadowBlur = 8 * (1 - age);
      ctx.shadowColor = s.color;

      ctx.stroke();
    }

    // Reset styles for next frames
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
