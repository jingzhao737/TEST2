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
  let lastDx = 0;
  let lastDy = 0;
  
  // LERP delay variables to match custom cursor trailing physics
  let cX = 0;
  let cY = 0;
  let targetX = 0;
  let targetY = 0;
  let isFirstDraw = true;

  function isInteractive(target) {
    if (!target) return false;
    if (typeof target.closest !== 'function') return false;
    if (target.closest('#work') !== null) return true;
    // For #framesCanvas, only treat it as interactive when cursor is grab/grabbing (hovering a vinyl record)
    if (target.id === 'framesCanvas') {
      const cur = target.style.cursor;
      return cur === 'grab' || cur === 'grabbing';
    }
    return target.closest(interactiveSelector) !== null;
  }

  // Handle mousedown/touchstart
  function handleStart(x, y, target, e) {
    let clickX = x;
    let clickY = y;
    
    // If the custom cursor is snapped, use the snapped visual position for the particles
    if (window.__customCursor && window.__customCursor.hoveredElement) {
      clickX = window.__customCursor.x;
      clickY = window.__customCursor.y;
    }

    // Detect if clicking on pointer, grab, or selection elements (based on selectors or computed CSS styles)
    const computedCursor = window.getComputedStyle(target).cursor;
    const isPointerOrGrab = isInteractive(target) || 
                            computedCursor === 'pointer' || 
                            computedCursor === 'grab' || 
                            computedCursor === 'grabbing';

    // Trigger click particle burst immediately, adding extra orange cross-stars if in pointer/grab state
    createBurst(clickX, clickY, isPointerOrGrab);

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
    lastDx = 0;
    lastDy = 0;
  }

  // Generate laser spark burst on click
  function createBurst(x, y, isOrange = false, customLife = null, customNumSparks = null) {
    const burstColor = isOrange ? '#E87C50' : '#ffffff'; // Monochromatic: all orange on interactive elements, all white on general background
    const isIronSpark = (customLife !== null);
    
    // Burst Micro-Sparks (Small Cross-Stars)
    const numSparks = customNumSparks !== null ? customNumSparks : (4 + Math.floor(Math.random() * 4)); // 4-7 sparks
    for (let i = 0; i < numSparks; i++) {
      const angle = (i / numSparks) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      // Faster, more energetic speed profile to simulate iron sparks flying
      const speed = isIronSpark ? (5.0 + Math.random() * 7.0) : (2.5 + Math.random() * 6.5);
      const lifeSpan = isIronSpark ? (customLife * (0.8 + Math.random() * 0.4)) : (500 + Math.random() * 300);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        // Initial upward burst bias (making sparks shoot up and fall down beautifully like striking metal)
        vy: Math.sin(angle) * speed - (isIronSpark ? 3.0 : 0.0),
        color: burstColor,
        type: 'star', // All particles are cross-stars
        size: 0.8 + Math.random() * 3.8, // Size variation: 0.8px to 4.6px
        angle: isIronSpark ? (Math.random() * Math.PI * 2) : 0,
        spin: isIronSpark ? ((Math.random() - 0.5) * 0.08) : 0, // Slow spin for high-quality shimmering/twinkling effect on iron sparks
        created: Date.now(),
        life: lifeSpan,
        drag: isIronSpark ? 0.93 : 0.90, // Custom drag per type (iron spark has 0.93 for smoother slide and continue expansion)
        gravity: isIronSpark ? 0.06 : -0.025 // Custom gravity per type (iron spark has 0.06 for gentle falling)
      });
    }
  }

  // Generate white small cross-stars at sharp drawing turns
  function triggerCornerBurst(x, y) {
    const numSparks = 2 + Math.floor(Math.random() * 3); // 2-4 sparks (very delicate and crisp)
    for (let i = 0; i < numSparks; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.5; // Slower dispersion
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.05, // Subtle upward drift
        color: '#ffffff',
        type: 'star', // White small cross-stars
        size: 0.8 + Math.random() * 2.2, // Size: 0.8px to 3.0px
        angle: 0,
        spin: 0,
        created: Date.now(),
        life: 400 + Math.random() * 300, // 400ms - 700ms lifespan
        drag: 0.90, // Original drag
        gravity: -0.025 // Original upward float
      });
    }
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
    ctx.globalCompositeOperation = 'screen'; // Enable additive blending for realistic neon glow overlay

    // LERP drawing position to match custom cursor LERP delay (0.09)
    const distToTarget = Math.sqrt(Math.pow(targetX - cX, 2) + Math.pow(targetY - cY, 2));
    if (isDrawing || distToTarget > 0.5) {
      cX += (targetX - cX) * 0.09;
      cY += (targetY - cY) * 0.09;

      const dist = Math.sqrt(Math.pow(cX - lastX, 2) + Math.pow(cY - lastY, 2));
      if (dist > 0.5) {
        const dx = cX - lastX;
        const dy = cY - lastY;

        // Check if there is a sharp turn compared to the last segment direction
        if (lastDx !== 0 || lastDy !== 0) {
          const len = dist;
          const plen = Math.sqrt(lastDx * lastDx + lastDy * lastDy);
          if (len > 0.5 && plen > 0.5) {
            const cosTheta = (dx * lastDx + dy * lastDy) / (len * plen);
            if (cosTheta < 0.819) { // 35-degree turn threshold (cos 35° ≈ 0.819)
              triggerCornerBurst(lastX, lastY);
            }
          }
        }

        lastDx = dx;
        lastDy = dy;

        const color = '#ffffff';

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

    // 2. Filter & decay drawn line segments
    for (let i = segments.length - 1; i >= 0; i--) {
      const age = (now - segments[i].created) / segments[i].life;
      if (age >= 1) {
        segments.splice(i, 1);
      }
    }

    // 3. Group segments into contiguous strokes (prevents connection lines between separate drags)
    const strokes = [];
    let currentStroke = [];
    for (const s of segments) {
      if (currentStroke.length === 0) {
        currentStroke.push(s);
      } else {
        const lastSeg = currentStroke[currentStroke.length - 1];
        // If segments endpoints match within a 1.5px tolerance, they belong to the same contiguous stroke
        const isContiguous = Math.abs(s.x1 - lastSeg.x2) < 1.5 && Math.abs(s.y1 - lastSeg.y2) < 1.5;
        if (isContiguous) {
          currentStroke.push(s);
        } else {
          strokes.push(currentStroke);
          currentStroke = [s];
        }
      }
    }
    if (currentStroke.length > 0) {
      strokes.push(currentStroke);
    }

    // 4. Draw each stroke in smooth continuous chunk paths (Quantum Filament)
    for (const stroke of strokes) {
      const chunkSize = 3;
      for (let i = 0; i < stroke.length; i += chunkSize) {
        const chunk = stroke.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;

        let sumAlpha = 0;
        for (const s of chunk) {
          const age = (now - s.created) / s.life;
          sumAlpha += Math.max(0, 1 - age);
        }
        const alpha = sumAlpha / chunk.length;
        if (alpha <= 0) continue;

        // Smoothly decay width, ignoring single-frame velocity noise
        const baseWidth = 1.3 * alpha;

        ctx.beginPath();
        ctx.moveTo(chunk[0].x1, chunk[0].y1);
        for (const s of chunk) {
          ctx.lineTo(s.x2, s.y2);
        }

        // Layer A: Soft, wide outer color glow
        ctx.strokeStyle = chunk[chunk.length - 1].color;
        ctx.lineWidth = baseWidth * 3.5;
        ctx.globalAlpha = alpha * 0.18;
        ctx.shadowBlur = 10 * alpha;
        ctx.shadowColor = chunk[chunk.length - 1].color;
        ctx.stroke();

        // Layer B: Bright white core filament
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = baseWidth * 0.8;
        ctx.globalAlpha = alpha * 0.85;
        ctx.shadowBlur = 4 * alpha;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();
      }
    }

    // 3. Draw & decay laser sparks (with particle physics)
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const age = (now - s.created) / s.life;

      if (age >= 1) {
        sparks.splice(i, 1);
        continue;
      }

      // Update position with air drag & gravity based on particle properties
      s.x += s.vx;
      s.y += s.vy;
      if (s.type === 'center-flare') {
        // Center flare stays fixed at click coordinate
      } else {
        const dragFactor = s.drag !== undefined ? s.drag : 0.90;
        const gravityFactor = s.gravity !== undefined ? s.gravity : -0.025;
        s.vx *= dragFactor;
        s.vy *= dragFactor;
        
        // Add thermal convection / random wind drift for forge sparks (heavy iron sparks)
        // to make them flutter and sway horizontally instead of falling straight down
        if (s.gravity !== undefined && s.gravity > 0) {
          s.vx += (Math.random() - 0.5) * 0.09; // Horizontal sway
          s.vy += (Math.random() - 0.5) * 0.04; // Vertical flutter
        }
        
        s.vy += gravityFactor;
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
        // Delicate Small Cross-Star (十字星)
        s.angle += s.spin;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        
        ctx.strokeStyle = s.color || '#ffffff'; // Dynamic color support (white or brand orange)
        ctx.lineWidth = 1.0 * alpha; // Slightly thicker lines for brightness
        ctx.globalAlpha = alpha * 1.0; // Max opacity
        ctx.shadowBlur = 8 * alpha; // Stronger glow blur
        ctx.shadowColor = s.color || '#ffffff'; // Glowing halo color matches particle color

        // Draw cross lines (+)
        ctx.beginPath();
        ctx.moveTo(-size * 1.6, 0);
        ctx.lineTo(size * 1.6, 0);
        ctx.moveTo(0, -size * 1.6);
        ctx.lineTo(0, size * 1.6);
        ctx.stroke();

        // Central tiny core glow dot (intense hot white center for realistic light rendering)
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 1.0; // Max opacity
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (s.type === 'dust-dot') {
        // Draw tiny white stardust dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.8;
        ctx.shadowBlur = 3 * alpha;
        ctx.shadowColor = '#ffffff';
        ctx.fill();
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
    ctx.globalCompositeOperation = 'source-over'; // Reset blending mode

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  window.__segments = segments;
  window.__sparks = sparks;
  window.__ripples = ripples;
  window.triggerLaserBurst = function(x, y, isOrange = false, customLife = null, customNumSparks = null) {
    createBurst(x, y, isOrange, customLife, customNumSparks);
  };
  window.triggerForgeBurst = function(x, y) {
    const colors = ['#ffffff', '#E87C50', '#FF9F1C', '#FFD700'];
    
    // 1. Pulsing Center Flare (Flash)
    sparks.push({
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      color: '#E87C50',
      type: 'center-flare',
      size: 45.0,
      created: Date.now(),
      life: 600
    });

    // 2. Double expanding shockwave ripples
    ripples.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: 80,
      color: '#E87C50',
      created: Date.now(),
      life: 600
    });
    ripples.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: 120,
      color: '#FF9F1C',
      created: Date.now(),
      life: 800
    });

    // 3. Dense sparks with forging physics
    const numSparks = 20 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numSparks; i++) {
      const angle = (i / numSparks) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 4.0 + Math.random() * 8.0;
      const lifeSpan = 1200 + Math.random() * 800;
      const color = colors[Math.floor(Math.random() * colors.length)];
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed, // Pure radial velocity without upward bias
        color: color,
        type: 'star',
        size: 0.8 + Math.random() * 3.5,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.20, // Rapid spin for shimmering glints
        created: Date.now(),
        life: lifeSpan,
        drag: 0.95, // Easing: slides out beautifully in a straight line
        gravity: 0.0 // No gravity (don't go down, don't go up, just like the Big Bang)
      });
    }
  };
})();

