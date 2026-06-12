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

  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const segments = [];
  const sparks = [];
  const ripples = [];
  
  // Signature Holographic Laser Palette (Enhanced with vivid cyber colors)
  const colors = [
    '#ff8da1', // Holographic Pink
    '#b19ffb', // Holographic Purple
    '#70e6d2', // Holographic Turquoise
    '#00f0ff', // Cyber Cyan
    '#ff007f', // Neon Magenta
    '#ffffff'  // Laser White
  ];
  
  let colorIndex = 0;

  // The interactive selector list where laser drawing is disabled
  // Note: #framesCanvas is excluded here - we handle it dynamically below
  const interactiveSelector = 'a, button, [role="button"], .work-card, .footer-cta, .detail-close, .gal-item, .motion-slide, .nav-menu-btn, .theme-toggle, .logo-wrapper, .lightbox-nav, .lightbox-close, .nav-waveform, .nav-next-btn, .hdr-ring, .ice-container, .zoom-slider-track, .zoom-slider-knob, .back-to-top, .scroll-dot-marker, .theme-pull-wrapper, .scroll-thumb, .scroll-bubble';

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
    if (typeof target.closest !== 'function') return false;
    // For #framesCanvas, only treat it as interactive when cursor is grab/grabbing (hovering a vinyl record)
    if (target.id === 'framesCanvas') {
      const cur = target.style.cursor;
      return cur === 'grab' || cur === 'grabbing';
    }
    return target.closest(interactiveSelector) !== null;
  }

  // Handle mousedown/touchstart
  function handleStart(x, y, target, e) {
    if (isInteractive(target)) return;

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

    // Trigger laser splash burst and shockwave ripple on click
    createBurst(cX, cY);
    createRipple(cX, cY);
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
    // 1. Center Lens Flare / HUD Crosshair (White)
    sparks.push({
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      type: 'center-flare',
      size: 14 + Math.random() * 6,
      created: Date.now(),
      life: 300
    });

    // 2. Burst Micro-Sparks (White Small Cross-Stars)
    const numSparks = 4 + Math.floor(Math.random() * 4); // Extremely sparse count: 4-7 sparks
    for (let i = 0; i < numSparks; i++) {
      const angle = (i / numSparks) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const speed = 2.5 + Math.random() * 6.5; // Slightly slower, more controlled dispersion
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ffffff',
        type: 'star', // All burst particles are now cross-stars
        size: 0.8 + Math.random() * 3.8, // Size variation: 0.8px to 4.6px
        angle: 0,
        spin: 0, // No rotation, keeping them perfectly upright +
        created: Date.now(),
        life: 500 + Math.random() * 300 // 500ms - 800ms lifespan
      });
    }
  }

  // Generate ambient dust sparks while drawing
  function createDust(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    sparks.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4, // slight upward float bias
      color: color,
      type: 'trail',
      size: 1 + Math.random() * 1.5,
      created: Date.now(),
      life: 300 + Math.random() * 200 // shorter lifespan for dust
    });
  }

  // Generate dynamic ripple ring
  function createRipple(x, y) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    ripples.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: 40 + Math.random() * 20,
      color: color,
      created: Date.now(),
      life: 400 // 400ms lifespan
    });
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
    const distToTarget = Math.sqrt(Math.pow(targetX - cX, 2) + Math.pow(targetY - cY, 2));
    if (isDrawing || distToTarget > 0.5) {
      cX += (targetX - cX) * 0.09;
      cY += (targetY - cY) * 0.09;

      const dist = Math.sqrt(Math.pow(cX - lastX, 2) + Math.pow(cY - lastY, 2));
      if (dist > 0.5) {
        const color = colors[Math.floor(colorIndex) % colors.length];
        colorIndex += 0.12;

        segments.push({
          x1: lastX,
          y1: lastY,
          x2: cX,
          y2: cY,
          speed: dist,
          color: color,
          created: now,
          life: 800 // 800ms lifespan
        });

        // Emit trail dust sparkles when moving
        if (Math.random() < 0.25) {
          createDust(cX, cY, color);
        }

        lastX = cX;
        lastY = cY;
      }
    }

    // 1. Draw Shockwave Ripples (Dotted concentric rings for a premium HUD aesthetic)
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      const age = (now - r.created) / r.life;

      if (age >= 1) {
        ripples.splice(i, 1);
        continue;
      }

      const currentRadius = r.maxRadius * Math.sin(age * Math.PI / 2); // Outward deceleration curve
      
      // Main thin ring
      ctx.beginPath();
      ctx.arc(r.x, r.y, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 1.0 * (1 - age);
      ctx.globalAlpha = 0.5 * (1 - age);
      ctx.shadowBlur = 8 * (1 - age);
      ctx.shadowColor = r.color;
      ctx.stroke();

      // Secondary outer dashed HUD ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, currentRadius * 1.25, 0, Math.PI * 2);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 0.75 * (1 - age);
      ctx.globalAlpha = 0.35 * (1 - age);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw & decay drawn line segments
    for (let i = segments.length - 1; i >= 0; i--) {
      const s = segments[i];
      const age = (now - s.created) / s.life;

      if (age >= 1) {
        segments.splice(i, 1);
        continue;
      }

      const alpha = 1 - age;
      // Faster mouse movement makes the laser lines thinner and more stretched
      const speedFactor = Math.min(1.5, Math.max(0.4, 8 / (s.speed + 1)));
      const baseWidth = 3.5 * alpha * speedFactor;

      // Chromatic Aberration & Multilayer Neon Glow logic
      // If speed is high, draw chromatic split paths
      if (s.speed > 6) {
        const offset = 2.0 * alpha; // split distance fades out as segment decays
        
        // Pass 1: Magenta split
        ctx.beginPath();
        ctx.moveTo(s.x1 - offset, s.y1 - offset);
        ctx.lineTo(s.x2 - offset, s.y2 - offset);
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = baseWidth * 0.8;
        ctx.globalAlpha = alpha * 0.5;
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Pass 2: Cyan split
        ctx.beginPath();
        ctx.moveTo(s.x1 + offset, s.y1 + offset);
        ctx.lineTo(s.x2 + offset, s.y2 + offset);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = baseWidth * 0.8;
        ctx.globalAlpha = alpha * 0.5;
        ctx.stroke();
      }

      // Main glows (Drawn on top of split paths or drawn standalone at low speed)
      // Layer A: Ambient outer glow
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = baseWidth * 2.2;
      ctx.globalAlpha = alpha * 0.25;
      ctx.shadowBlur = 24 * alpha;
      ctx.shadowColor = s.color;
      ctx.stroke();

      // Layer B: Bright inner neon core
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = baseWidth * 0.5;
      ctx.globalAlpha = alpha * 0.95;
      ctx.shadowBlur = 6 * alpha;
      ctx.shadowColor = s.color;
      ctx.stroke();
    }

    // 3. Draw & decay laser sparks (with particle physics)
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const age = (now - s.created) / s.life;

      if (age >= 1) {
        sparks.splice(i, 1);
        continue;
      }

      // Update position with air drag & slow upward energy float (no heavy gravity)
      s.x += s.vx;
      s.y += s.vy;
      if (s.type === 'center-flare') {
        // Center flare stays fixed at click coordinate
      } else {
        s.vx *= 0.90; // Higher friction for a snappier, more localized deceleration
        s.vy *= 0.90;
        s.vy -= 0.025; // Subtle upward float to mimic energy dissipating
      }

      const size = s.size * (1 - age);
      const alpha = 1 - age;

      if (s.type === 'center-flare') {
        // Center Flare / HUD Crosshair
        const sizeVal = s.size * Math.sin(age * Math.PI); // Pulse size
        ctx.save();
        ctx.translate(s.x, s.y);
        
        // Circular core glow (Brighter gradient overlay)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, sizeVal);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, s.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = alpha * 0.95; // Brighter core glow
        ctx.beginPath();
        ctx.arc(0, 0, sizeVal, 0, Math.PI * 2);
        ctx.fill();

        // Thin HUD crosshair lines (Brighter and slightly thicker)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0 * alpha;
        ctx.globalAlpha = alpha * 0.75;
        ctx.shadowBlur = 12 * alpha; // Double the blur for neon pop
        ctx.shadowColor = s.color;
        ctx.beginPath();
        ctx.moveTo(-sizeVal * 2.2, 0);
        ctx.lineTo(sizeVal * 2.2, 0);
        ctx.moveTo(0, -sizeVal * 2.2);
        ctx.lineTo(0, sizeVal * 2.2);
        ctx.stroke();

        ctx.restore();
      } else if (s.type === 'star') {
        // Delicate White Small Cross-Star (十字星)
        s.angle += s.spin;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0 * alpha; // Slightly thicker lines for brightness
        ctx.globalAlpha = alpha * 1.0; // Max opacity
        ctx.shadowBlur = 8 * alpha; // Stronger glow blur
        ctx.shadowColor = '#ffffff';

        // Draw cross lines (+)
        ctx.beginPath();
        ctx.moveTo(-size * 1.6, 0);
        ctx.lineTo(size * 1.6, 0);
        ctx.moveTo(0, -size * 1.6);
        ctx.lineTo(0, size * 1.6);
        ctx.stroke();

        // Central tiny core glow dot
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 1.0; // Max opacity
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else {
        // Draw velocity-aligned trail sparks
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        const tailX = s.vx * 1.6;
        const tailY = s.vy * 1.6;
        ctx.lineTo(s.x - tailX, s.y - tailY);

        ctx.strokeStyle = s.color;
        ctx.lineWidth = size * 0.75;
        ctx.globalAlpha = alpha * 0.85;
        ctx.shadowBlur = 6 * alpha;
        ctx.shadowColor = s.color;
        ctx.stroke();
      }
    }

    // Reset styles for next frames
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  window.__segments = segments;
  window.__sparks = sparks;
  window.__ripples = ripples;
})();
