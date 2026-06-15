import * as THREE from 'three';

;// ═══════════ HANGING CIRCLES ═══════════
(function() {
  // Initialize shared global audio files so mobile can play them
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

  const canvas = document.getElementById('framesCanvas');
  
  if (!canvas) return;
  if (getComputedStyle(canvas).display === 'none') return;
  if ('ontouchstart' in window) { canvas.style.display = 'none'; return; }
  let ctx = canvas.getContext('2d');

  let scene, camera, renderer, dirLight;
  let discs = [];
  let bumpTexture, shadowTexture;
  let webglCanvas;

  let knobColors = ['#e85570', '#444444', '#bbbbbb', '#3ccda0'];
  let ringTextures = [null, null, null, null];
  let ringLoaded = [false, false, false, false];
  const textureLoader = new THREE.TextureLoader();

  function drawArchText(ctx, text, centerX, centerY, radius, startAngle, isUpward) {
    ctx.save();
    ctx.translate(centerX, centerY);
    
    const chars = text.split('');
    const widths = chars.map(c => ctx.measureText(c).width);
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    const totalAngle = totalWidth / radius;
    
    let currentAngle = startAngle - totalAngle / 2;
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charAngle = widths[i] / radius;
      const midAngle = currentAngle + charAngle / 2;
      
      ctx.save();
      ctx.rotate(midAngle);
      
      if (isUpward) {
        ctx.translate(0, radius);
        ctx.rotate(Math.PI);
      } else {
        ctx.translate(0, -radius);
      }
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
      
      currentAngle += charAngle;
    }
    
    ctx.restore();
  }

  function drawVinylLabel(image, card, knobColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Background (deep rich off-black paper)
    const grad = ctx.createRadialGradient(256, 256, 35, 256, 256, 256);
    grad.addColorStop(0, '#151518');
    grad.addColorStop(0.8, '#0f0f11');
    grad.addColorStop(1, '#0b0b0c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Draw Cover Image in the center circle (using cover/clip)
    ctx.save();
    ctx.beginPath();
    ctx.arc(256, 256, 166, 0, Math.PI * 2);
    ctx.clip();

    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    const aspect = iw / ih;
    let dw, dh, dx, dy;
    if (aspect > 1) {
      dh = 332;
      dw = 332 * aspect;
      dx = 256 - dw / 2;
      dy = 256 - dh / 2;
    } else {
      dw = 332;
      dh = 332 / aspect;
      dx = 256 - dw / 2;
      dy = 256 - dh / 2;
    }
    ctx.drawImage(image, dx, dy, dw, dh);
    ctx.restore();

    // 3. Draw dividing rings and accents
    // Accent ring using the specific knob color
    ctx.strokeStyle = knobColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(256, 256, 167.5, 0, Math.PI * 2);
    ctx.stroke();

    // Inner shadow ring overlay on cover image for depth
    const shadowGrad = ctx.createRadialGradient(256, 256, 140, 256, 256, 168);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(256, 256, 168, 0, Math.PI * 2);
    ctx.fill();

    // Clean separation rings
    ctx.strokeStyle = '#2b2b31';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(256, 256, 172, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.stroke();

    // Subtly drawn concentric groove lines on the outer label paper
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    for (let r = 180; r < 245; r += 12) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Inner spindle border
    ctx.strokeStyle = '#2c2c32';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(256, 256, 36, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Extract card information and draw text
    let title = card.querySelector('.work-name') ? card.querySelector('.work-name').textContent.trim() : 'TRACK';
    let idxStr = card.querySelector('.work-idx') ? card.querySelector('.work-idx').textContent.trim() : 'NO. 0';
    let year = card.querySelector('.work-year') ? card.querySelector('.work-year').textContent.trim() : '2026';
    let tagsList = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent.trim().toUpperCase());
    let tagsStr = tagsList.join('  •  ') || 'STEREO RECORD';

    let topText = `${title.toUpperCase()}  //  RELEASE ${year}`;
    let bottomText = `${tagsStr}  •  ${idxStr}`;

    // Text style
    ctx.fillStyle = '#ecebeb';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Top text: Google Sans font for a sleek premium layout
    ctx.font = "bold 13px 'Google Sans', sans-serif";
    let spacedTopText = topText.split('').join(' ');
    drawArchText(ctx, spacedTopText, 256, 256, 210, -Math.PI / 2, false);

    // Bottom text: monospace clean font
    ctx.fillStyle = '#8a8a93';
    ctx.font = "9px monospace";
    let spacedBottomText = bottomText.split('').join(' ');
    drawArchText(ctx, spacedBottomText, 256, 256, 210, Math.PI / 2, true);

    return canvas;
  }

  (function preloadImages() {
    let cards = document.querySelectorAll('.work-card');
    cards.forEach(function(card, i) {
      if (i >= 4) return;
      (function(idx) {
        textureLoader.load(card.dataset.image, function(texture) {
          // Generate dynamic vinyl label canvas texture
          const labelCanvas = drawVinylLabel(texture.image, card, knobColors[idx]);
          const canvasTexture = new THREE.CanvasTexture(labelCanvas);
          canvasTexture.colorSpace = THREE.SRGBColorSpace;
          
          ringTextures[idx] = canvasTexture;
          ringLoaded[idx] = true;
          if (discs[idx]) {
            discs[idx].labelMesh.material.map = canvasTexture;
            discs[idx].labelMesh.material.needsUpdate = true;
          }
        }, undefined, function() {
          ringLoaded[idx] = true;
        });
      })(i);
    });
  })();

  let springK = 0.05;
  let damping = 0.993;
  let gravity = 0.35;

  let thumbs = [];
  let draggedIdx = -1;
  let hoveredIdx = -1;
  let latchedIdx = -1; // index of the disc locked to its anchor
  let dragOffX = 0, dragOffY = 0;
  let dragStartX = 0, dragStartY = 0;
  let prevMouseX = 0, prevMouseY = 0;
  let mouseCanvasX = 0, mouseCanvasY = 0;
  let frameCount = 0;
  let canvasOffX = 0; // canvas CSS offset for latch clip positioning
  let canvasOffY = 0; // canvas CSS Y offset
  let navBottomPx = 0; // nav bottom position relative to hero

  // === WIND SYSTEM ===
  let windDir = 0;       // 0=none, 1=right, -1=left
  let windPower = 0;     // 1~7
  let windFrame = 0;     // current frame in wind cycle
  let windDuration = 0;  // total frames for this gust
  let windNext = 0;      // frame count until next gust
  function scheduleWind() {
    windDir = Math.random() < 0.5 ? -1 : 1;
    windPower = 1 + Math.random() * 6;
    windDuration = 80 + Math.floor(Math.random() * 60);
    windFrame = 0;
    windNext = 150 + Math.floor(Math.random() * 510);
  }
  scheduleWind();

  if (!window.__fadeOutAndPause) {
    window.__fadeOutAndPause = function(audio, duration = 300, resetTime = false) {
      if (!audio) return;
      if (audio.paused) {
        if (resetTime) audio.currentTime = 0;
        return;
      }
      if (audio.__fadeTimer) {
        clearInterval(audio.__fadeTimer);
      }
      const startVol = audio.__originalVolume || (audio.__originalVolume = audio.volume) || 0.6;
      const steps = 15;
      const interval = duration / steps;
      let currentStep = 0;
      
      audio.__fadeTimer = setInterval(() => {
        currentStep++;
        let vol = startVol * (1 - currentStep / steps);
        if (vol <= 0.01) {
          clearInterval(audio.__fadeTimer);
          audio.__fadeTimer = null;
          audio.pause();
          audio.volume = startVol;
          if (resetTime) audio.currentTime = 0;
        } else {
          audio.volume = vol;
        }
      }, interval);
    };
  }

  if (!window.__playAudioWithFade) {
    window.__playAudioWithFade = function(audio) {
      if (!audio) return;
      if (audio.__fadeTimer) {
        clearInterval(audio.__fadeTimer);
        audio.__fadeTimer = null;
      }
      const startVol = audio.__originalVolume || (audio.__originalVolume = audio.volume) || 0.6;
      audio.volume = startVol;
      audio.play().catch(() => {});
    };
  }

  // --- audio players for each disc ---
  let audios = window.__bgAudios;
  let prevHoveredIdx = -1;

  function handleAudioHover(newIdx) {
    // If a disc is latched, don't override with hover
    if (latchedIdx >= 0) {
      window.__audioPlaying = true;
      return;
    }
    if (newIdx === prevHoveredIdx) return;
    // Stop previous
    if (prevHoveredIdx >= 0 && prevHoveredIdx < 4) {
      window.__fadeOutAndPause(audios[prevHoveredIdx], 300, true);
    }
    // Play new
    if (newIdx >= 0 && newIdx < 4) {
      const targetAudio = audios[newIdx];
      if (targetAudio.__fadeTimer) {
        clearInterval(targetAudio.__fadeTimer);
        targetAudio.__fadeTimer = null;
      }
      targetAudio.currentTime = 0;
      window.__playAudioWithFade(targetAudio);
      window.__audioPlaying = true;
      window.__currentTrackIdx = newIdx;
      if (window.__updateNextBtnState) window.__updateNextBtnState();
    } else {
      window.__audioPlaying = false;
      if (window.__updateNextBtnState) window.__updateNextBtnState();
    }
    prevHoveredIdx = newIdx;
  }

  // Force play for latched disc (called from mouseup)
  window.__navWaveForcePlay = function(idx) {
    window.__currentTrackIdx = idx;
    for (let i = 0; i < audios.length; i++) {
      if (i !== idx) { window.__fadeOutAndPause(audios[i], 300, true); }
    }
    window.__playAudioWithFade(audios[idx]);
    window.__audioPlaying = true;
    prevHoveredIdx = idx;
    if (window.__updateNextBtnState) window.__updateNextBtnState();
  };

  // Nav wave stop hook
  window.__navWaveStop = function(idx) {
    if (audios && audios[idx]) {
      window.__fadeOutAndPause(audios[idx], 350, true);
    }
    window.__audioPlaying = false;
    if (window.__updateNextBtnState) window.__updateNextBtnState();
  };

  // Global hooks for external syncing (e.g. from navbar wave controls)
  window.__unlatchAll = function() {
    if (latchedIdx >= 0) {
      let tl = thumbs[latchedIdx];
      if (tl) {
        tl.vy = -8;
        tl.vx = (Math.random() - 0.5) * 6;
        tl.entering = false;
        tl._swayV = (Math.random() - 0.5) * 0.45;
      }
      latchedIdx = -1;
      document.querySelectorAll('.latch-clip').forEach(function(c){ c.classList.remove('latched'); });
    }
  };

  window.__latchDisc = function(idx) {
    if (idx >= 0 && idx < 4) {
      if (latchedIdx >= 0 && latchedIdx !== idx) {
        let ejected = thumbs[latchedIdx];
        if (ejected) {
          ejected.vy = -6;
          ejected.vx = (Math.random() - 0.5) * 4;
          ejected.entering = false;
          ejected._swayV = (Math.random() - 0.5) * 0.35;
        }
      }
      latchedIdx = idx;
      document.querySelectorAll('.latch-clip').forEach(function(c, ci){
        c.classList.toggle('latched', ci === latchedIdx);
      });
    }
  };

  function getCircleSz(screenW) {
    if (screenW >= 1800) return 156;
    if (screenW >= 1400) return 140;
    if (screenW >= 1024) return 120;
    if (screenW >= 768) return 104;
    return 88;
  }

  function initWebGL() {
    // Create the WebGL canvas and insert it right behind the 2D canvas
    webglCanvas = document.createElement('canvas');
    webglCanvas.id = 'webglCanvas';
    webglCanvas.className = 'frames-canvas'; // share styles (position, inset, transform, etc.)
    webglCanvas.style.pointerEvents = 'none'; // click events pass through to 2D canvas
    canvas.parentNode.insertBefore(webglCanvas, canvas.nextSibling);

    scene = new THREE.Scene();
    
    // Perspective camera set up for pixel-perfect coordinates at Z=0
    let rect = canvas.getBoundingClientRect();
    let w = rect.width, h = rect.height;
    let dpr = window.devicePixelRatio || 1;
    
    const depth = 500;
    const fov = 2 * Math.atan(h / (2 * depth)) * (180 / Math.PI);
    camera = new THREE.PerspectiveCamera(fov, w / h, 1, 2000);
    camera.position.set(w / 2, h / 2, depth);
    camera.lookAt(w / 2, h / 2, 0);

    renderer = new THREE.WebGLRenderer({
      canvas: webglCanvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);
    
    dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    // Light points from top-left, slightly in front
    dirLight.position.set(w * 0.2, h * 1.5, 350);
    scene.add(dirLight);
    
    // Generate bump texture for grooves
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d');
    bCtx.fillStyle = '#808080'; // Neutral grey bump height
    bCtx.fillRect(0, 0, 512, 512);
    // Draw fine horizontal lines (concentric grooves in polar UVs)
    for (let y = 0; y < 512; y += Math.random() * 3.5 + 1.2) {
      let height = Math.random() * 26 - 13;
      bCtx.strokeStyle = `rgb(${128 + height}, ${128 + height}, ${128 + height})`;
      bCtx.lineWidth = Math.random() * 1.5 + 0.5;
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(512, y);
      bCtx.stroke();
    }
    bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    
    // Generate soft shadow texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    let grad = sCtx.createRadialGradient(64, 64, 28, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.45)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);
    shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  }

  function resize() {
    let hero = document.getElementById('home');
    if (!hero) return;
    let rect = hero.getBoundingClientRect();
    let dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let w = rect.width, h = rect.height;

    let sz = getCircleSz(w);
    let gap = sz * 1.1;
    let xOff = w < 1200 ? w * 0.52 : w * 0.58;
    let yOffsets = [0, sz * 0.12, sz * 0.24, sz * 0.36];
    let anchorY = 0;
    let anchorXs = [xOff, xOff + gap, xOff + gap * 2, xOff + gap * 3];
    let bottomY = h * 0.33;
    let anchors = [];
    for (let ai = 0; ai < 4; ai++) {
      anchors.push({
        x: anchorXs[ai],
        y: anchorY,
        restOffX: 0,
        stringLen: (bottomY + yOffsets[ai]) - anchorY
      });
    }

    if (thumbs.length === 0) {
      let loadDelay = 0.45;
      for (let i = 0; i < 4; i++) {
        let a = anchors[i];
        let cs = getCircleSz(w);
        let restX = a.x + a.restOffX;
        let restY = a.y + a.stringLen + (yOffsets[i] || 0);
        let startX = restX + (i % 2 === 0 ? -45 : 45);
        let startY = -200;
        thumbs.push({
          x: startX, y: startY, vx: 0, vy: 0,
          anchorX: a.x, anchorY: a.y,
          stringLen: a.stringLen,
          restX: restX, restY: restY,
          dispW: cs, dispH: cs,
          color: knobColors[i],
          entering: true,
          delayFrames: 12 * i,
          restOffX: 0,
          hoverAlpha: 0
        });
      }
    } else {
      let cs2 = getCircleSz(w);
      for (let j = 0; j < 4; j++) {
        let b = anchors[j];
        thumbs[j].anchorX = b.x;
        thumbs[j].anchorY = b.y;
        thumbs[j].stringLen = b.stringLen;
        thumbs[j].restX = b.x + b.restOffX;
        thumbs[j].restY = b.y + b.stringLen;
        thumbs[j].dispW = cs2;
        thumbs[j].dispH = cs2;
      }
    }

    // Instantiate 3D meshes in Three.js on resize/first run
    if (discs.length === 0 && thumbs.length > 0) {
      for (let i = 0; i < 4; i++) {
        let t = thumbs[i];
        let discGroup = new THREE.Group();
        
        // 1. Create Shadow Mesh (Plane Geometry with Canvas Soft Shadow)
        const shadowGeom = new THREE.PlaneGeometry(t.dispW * 2.4, t.dispW * 2.4);
        const shadowMat = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          opacity: 0.4,
          depthWrite: false
        });
        const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
        shadowMesh.position.set(5, -10, -30);
        discGroup.add(shadowMesh);
        
        // 2. Create Vinyl Outer Body (Cylinder for physical thickness and edges)
        const vinylGeom = new THREE.CylinderGeometry(t.dispW / 2, t.dispW / 2, 1.6, 64, 1, false);
        vinylGeom.rotateX(Math.PI / 2);
        
        // Convert Cap UVs to polar coordinates for circular anisotropic reflections
        const pos = vinylGeom.attributes.position;
        const uv = vinylGeom.attributes.uv;
        let rOuter = t.dispW / 2;
        let rInner = rOuter * 0.58;
        for (let j = 0; j < pos.count; j++) {
          let x = pos.getX(j);
          let y = pos.getY(j);
          let dist = Math.sqrt(x * x + y * y);
          let angle = Math.atan2(y, x);
          let u = (angle + Math.PI) / (Math.PI * 2);
          let v = Math.max(0, Math.min(1, (dist - rInner) / (rOuter - rInner)));
          uv.setXY(j, u, v);
        }
        uv.needsUpdate = true;

        const vinylMat = new THREE.MeshPhysicalMaterial({
          color: 0x111114,
          roughness: 0.4,
          metalness: 0.12,
          anisotropy: 0.85,
          anisotropyRotation: 0,
          clearcoat: 0.65,
          clearcoatRoughness: 0.22,
          bumpMap: bumpTexture,
          bumpScale: 0.035,
          side: THREE.DoubleSide
        });
        const vinylMesh = new THREE.Mesh(vinylGeom, vinylMat);
        discGroup.add(vinylMesh);
        
        // 3. Create Label Mesh (Spindle ring)
        const labelGeom = new THREE.RingGeometry(t.dispW * 0.04, t.dispW * 0.29, 32, 1);
        const posL = labelGeom.attributes.position;
        const uvL = labelGeom.attributes.uv;
        let labelR = t.dispW * 0.29;
        for (let j = 0; j < posL.count; j++) {
          let x = posL.getX(j);
          let y = posL.getY(j);
          let u = (x / labelR + 1) / 2;
          let v = (y / labelR + 1) / 2;
          uvL.setXY(j, u, v);
        }
        uvL.needsUpdate = true;

        const labelMat = new THREE.MeshPhysicalMaterial({
          map: ringTextures[i] || null,
          roughness: 0.55,
          metalness: 0.02,
          clearcoat: 0.12,
          clearcoatRoughness: 0.45,
          side: THREE.DoubleSide
        });
        const labelMesh = new THREE.Mesh(labelGeom, labelMat);
        labelMesh.position.z = 0.9; // sit slightly in front
        discGroup.add(labelMesh);
        
        scene.add(discGroup);
        discs.push({
          group: discGroup,
          shadowMesh: shadowMesh,
          vinylMesh: vinylMesh,
          labelMesh: labelMesh,
          baseSz: t.dispW
        });
      }
    }

    // Update WebGL Canvas & Renderer Size
    if (webglCanvas) {
      webglCanvas.width = rect.width * dpr;
      webglCanvas.height = rect.height * dpr;
      webglCanvas.style.width = rect.width + 'px';
      webglCanvas.style.height = rect.height + 'px';
    }
    if (renderer) {
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(dpr);
    }
    if (camera) {
      const depth = 500;
      camera.fov = 2 * Math.atan(h / (2 * depth)) * (180 / Math.PI);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      camera.position.set(w / 2, h / 2, depth);
      camera.lookAt(w / 2, h / 2, 0);
    }
    if (dirLight) {
      dirLight.position.set(w * 0.2, h * 1.5, 350);
    }

    // Position latch clips: flat edge at nav bottom, centered on disc rest position
    let heroEl = document.getElementById('home');
    let canvasRect = canvas.getBoundingClientRect();
    let heroRect = heroEl.getBoundingClientRect();
    canvasOffX = canvasRect.left - heroRect.left;
    canvasOffY = canvasRect.top - heroRect.top;
    let nav = document.querySelector('nav');
    // Use stable position: nav bottom relative to hero, ignoring scroll
    navBottomPx = nav ? (nav.offsetHeight + parseInt(getComputedStyle(nav).top || '0', 10)) : 80;
    let clips = document.querySelectorAll('.latch-clip');
    // Size latch clips proportional to disc size
    let sampleDisc = thumbs[0];
    let clipSize = sampleDisc ? Math.round(sampleDisc.dispW * 0.7) : 70;
    let clipH = Math.round(clipSize / 2);
    for (let k = 0; k < clips.length && k < thumbs.length; k++) {
      clips[k].style.left = (thumbs[k].restX + canvasOffX) + 'px';
      clips[k].style.top = navBottomPx + 'px';
      clips[k].style.width = clipSize + 'px';
      clips[k].style.height = clipH + 'px';
      let circle = clips[k].querySelector('.latch-circle');
      if (circle) { circle.style.width = clipSize + 'px'; circle.style.height = clipSize + 'px'; circle.style.marginTop = -clipH + 'px'; }
    }
    // Click on HTML clip to unlatch
    clips.forEach(function(clip, ci) {
      clip.onclick = function() {
        if (latchedIdx === ci) {
          let tl = thumbs[latchedIdx];
          tl.vy = -8;
          tl.vx = (Math.random() - 0.5) * 6;
          tl.entering = false;
          tl._swayV = (Math.random() - 0.5) * 0.45;
          latchedIdx = -1;
          document.querySelectorAll('.latch-clip').forEach(function(c){ c.classList.remove('latched'); });
          if (window.__navWaveStop) window.__navWaveStop(ci);
        }
      };
    });
  }

  let startTime = 0;

  function update(ts) {
    frameCount++;
    if (!startTime) startTime = ts;
    let elapsed = (ts - startTime) / 1000;

    if (draggedIdx < 0) {
      hoveredIdx = getThumbAt(mouseCanvasX, mouseCanvasY);
    }

    // Wind scheduling
    if (windNext > 0) {
      windNext--;
    } else {
      windFrame++;
      if (windFrame > windDuration) {
        scheduleWind();
      }
    }

    for (let i = 0; i < thumbs.length; i++) {
      let t = thumbs[i];

      // Staggered entry handling on load (waits for loader to finish)
      if (t.entering) {
        if (!window.loaderFinished) {
          t.x = t.restX + (i % 2 === 0 ? -45 : 45);
          t.y = -200;
          t.vx = 0; t.vy = 0;
          continue;
        }
        if (t.delayFrames > 0) {
          t.delayFrames--;
          t.x = t.restX + (i % 2 === 0 ? -45 : 45);
          t.y = -200;
          t.vx = 0; t.vy = 0;
          continue;
        } else {
          t.entering = false;
        }
      }

      // Wind force (staggered by disc index)
      if (windNext <= 0 && windFrame > 0) {
        let stagger = i * 6;
        let localFrame = windFrame - stagger;
        if (localFrame > 0 && localFrame < windDuration) {
          let progress = localFrame / windDuration;
          let envelope = Math.sin(progress * Math.PI);
          let f = windDir * windPower * envelope;
          t.vx += f * 0.04;
        }
      }

      // Latched disc: smooth lock to HTML latch clip position
      if (i === latchedIdx) {
        if (i !== draggedIdx) {
          let heroRect2 = document.getElementById('home').getBoundingClientRect();
          let cRect2 = canvas.getBoundingClientRect();
          let targetX = t.anchorX;
          let targetY = navBottomPx - (cRect2.top - heroRect2.top);
          
          let dx = targetX - t.x;
          let dy = targetY - t.y;
          
          // Match the luxurious slow glide of the magnetic pocket
          t.x += dx * 0.1;
          t.y += dy * 0.1;
          
          // Feed a tiny bit of the movement into sway for a soft tilt
          t.vx = dx * 0.05;
          
          // Still run sway physics so the drop impact causes it to tilt and settle
          let targetSway = t.vx * 0.05;
          let swayForce = targetSway - t._sway;
          if (t._sway === undefined) t._sway = 0;
          if (t._swayV === undefined) t._swayV = 0;
          t._swayV += swayForce * 0.2; 
          t._swayV *= 0.82;           
          t._sway += t._swayV;
          t.vx *= 0.85;
          t.vy *= 0.85;

          t.entering = false;
          t.hoverAlpha += (1 - t.hoverAlpha) * 0.05;
          continue;
        }
      }
      let targetHA = (i === hoveredIdx && draggedIdx < 0) ? 1 : 0;
      let speed = targetHA > t.hoverAlpha ? 0.04 : 0.05;
      t.hoverAlpha += (targetHA - t.hoverAlpha) * speed;

      // Magnetic Hover Pull (with subtle force)
      if (targetHA > 0 && i !== latchedIdx) {
        let pullX = mouseCanvasX - t.x;
        let pullY = mouseCanvasY - t.y;
        t.vx += pullX * 0.0025;
        t.vy += pullY * 0.0025;
      }

      if (i === draggedIdx) {
        if (t._sway === undefined) t._sway = 0;
        if (t._swayV === undefined) t._swayV = 0;
        
        // 1. Calculate raw target based on mouse position
        let rawTargetX = mouseCanvasX + dragOffX;
        let rawTargetY = mouseCanvasY + dragOffY;
        
        // 2. Rope constraint on the raw target
        let rdx = rawTargetX - t.anchorX;
        let rdy = rawTargetY - t.anchorY;
        let rdist = Math.sqrt(rdx * rdx + rdy * rdy);
        let ropeLen = t.restY - t.anchorY + t.dispH * 0.5;
        if (rdist > ropeLen && rdist > 0.01) {
          let rnx = rdx / rdist;
          let rny = rdy / rdist;
          rawTargetX = t.anchorX + rnx * ropeLen;
          rawTargetY = t.anchorY + rny * ropeLen;
        }
        

        let latchSX = t.anchorX;
        let latchSY2 = navBottomPx - canvasOffY;
        
        let snapDx = rawTargetX - latchSX;
        let snapDy = rawTargetY - latchSY2;
        let snapDist = Math.sqrt(snapDx * snapDx + snapDy * snapDy);
        
        let snapZone = t.dispW * 0.95;
        
        if (t._lerp === undefined) t._lerp = 0.35;
        
        let isInZone = (snapDist < snapZone);
        
        if (isInZone) {
          // --- SILKY MAGNETIC POCKET PHYSICS ---
          t._wasInZone = true;
          
          let dx = latchSX - t.x;
          let dy = latchSY2 - t.y;
          
          // Instantly drop the lerp factor to 0.055 (10% faster than 0.05) so the first frame doesn't jump, then settle at 0.09
          if (t._lerp > 0.09) t._lerp = 0.055; 
          else t._lerp += (0.09 - t._lerp) * 0.1;
          
          t.x += dx * t._lerp;
          t.y += dy * t._lerp;
          
          // Feed a tiny bit of the movement into sway for a soft tilt
          t.vx = dx * 0.05;
        } else {
          // --- NORMAL DYNAMIC DRAG ---
          if (latchedIdx === draggedIdx) {
            latchedIdx = -1;
            document.querySelectorAll('.latch-clip').forEach(function(c){ c.classList.remove('latched'); });
            if (window.__navWaveStop) window.__navWaveStop(draggedIdx);
          }
          
          if (t._wasInZone) {
            t._wasInZone = false;
            t._rippedOut = true;
            t._lerp = 0.055; // Instantly drop to match entry speed!
          }
          
          let distToMouse = Math.sqrt(Math.pow(rawTargetX - t.x, 2) + Math.pow(rawTargetY - t.y, 2));
          if (distToMouse < 15) {
            t._rippedOut = false;
          }
          
          if (t._rippedOut) {
            if (t._lerp > 0.09) t._lerp = 0.055;
            else t._lerp += (0.09 - t._lerp) * 0.1;
          } else {
            t._lerp += (0.52 - t._lerp) * 0.1; // Smoothly recover normal drag
          }
          
          t.x += (rawTargetX - t.x) * t._lerp; 
          t.y += (rawTargetY - t.y) * t._lerp;
        }

        let targetSway = t.vx * 0.05;
        let swayForce = targetSway - t._sway;
        t._swayV += swayForce * 0.2;  // spring constant for drag
        t._swayV *= 0.82;             // damping for drag
        t._sway += t._swayV;
        t.vx *= 0.98;
        t.vy *= 0.98;
        continue;
      }

      // Rope constraint variables
      let ax = t.anchorX, ay = t.anchorY;
      let dx = t.x - ax;
      let dy = t.y - ay;
      let dist = Math.sqrt(dx * dx + dy * dy);
      let ropeLen = t.restY - t.anchorY + t.dispH * 0.5;

      // Normal physics: gravity + rope constraint
      t.vy += gravity;
      t.vx *= damping;
      t.vy *= damping;
      t.x += t.vx;
      t.y += t.vy;

      // Enforce rope length constraint
      dx = t.x - ax;
      dy = t.y - ay;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > ropeLen && dist > 0.01) {
        let nx = dx / dist, ny = dy / dist;
        t.x = ax + nx * ropeLen;
        t.y = ay + ny * ropeLen;
        // Remove outward radial velocity (rope can't push, only pull)
        let vradial = t.vx * nx + t.vy * ny;
        if (vradial > 0) {
          t.vx -= vradial * nx * 1.35;
          t.vy -= vradial * ny * 1.35;
          if (vradial > 2.5) {
            t._swayV += (Math.random() - 0.5) * 0.08;
          }
        }
      }

      // Sway for rope curve with springy oscillation
      if (t._sway === undefined) t._sway = 0;
      if (t._swayV === undefined) t._swayV = 0;
      let windSway = 0;
      if (windNext <= 0 && windFrame > 0) {
        let stagger = i * 6;
        let localFrame = windFrame - stagger;
        if (localFrame > 0 && localFrame < windDuration) {
          let progress = localFrame / windDuration;
          let envelope = Math.sin(progress * Math.PI);
          windSway = windDir * windPower * envelope * 0.06;
        }
      }
      let targetSway = t.vx * 0.02 + windSway;
      let swayForce = targetSway - t._sway;
      t._swayV += swayForce * 0.15; // spring constant
      t._swayV *= 0.85;             // damping
      t._sway += t._swayV;
    }
  }

  function drawString(ax, ay, bx, by, sway, restLen) {
    let dx = bx - ax, dy = by - ay;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;

    let perpX = -dy / len;
    let perpY = dx / len;

    // Constant number of coils based on rest length (spring stretches physically!)
    let coils = Math.max(6, Math.floor(restLen / 20)); 
    let maxAngle = coils * Math.PI * 2;

    // Physical spring stretch dynamics
    let stretch = len / restLen;
    let amp = 10.5 * Math.max(0.35, Math.min(1.8, 1 / Math.sqrt(stretch)));
    let baseLineWidth = 3.6 * Math.max(0.6, Math.min(1.4, 1 / Math.sqrt(stretch)));

    // We divide the spring into half-loops of angle PI
    // Odd indices are back loops, Even indices are front loops
    let totalHalfLoops = Math.ceil(maxAngle / Math.PI);

    // Drop Shadow configuration
    ctx.save();

    // Helper to draw a single half-loop path
    function pathHalfLoop(ctx, i) {
      let thetaS = Math.max(0, i * Math.PI - Math.PI / 2);
      let thetaE = Math.min(maxAngle, i * Math.PI + Math.PI / 2);
      if (thetaS >= thetaE) return;

      ctx.beginPath();
      let steps = 12;
      for (let s = 0; s <= steps; s++) {
        let theta = thetaS + (thetaE - thetaS) * (s / steps);
        let t = theta / maxAngle;
        let Px = ax + dx * t;
        let Py = ay + dy * t;
        let swayOffset = sway * Math.sin(t * Math.PI) * len * 0.3;
        let offsetP = Math.sin(theta) * amp + swayOffset;
        let x = Px + offsetP * perpX;
        let y = Py + offsetP * perpY;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }

    // 1. Draw all Back loops first (no shadow)
    ctx.shadowColor = 'transparent';
    for (let i = 1; i < totalHalfLoops; i += 2) {
      pathHalfLoop(ctx, i);
      ctx.strokeStyle = 'rgba(145, 65, 35, 0.8)'; // Softer warm terracotta shadow (less harsh metallic contrast)
      ctx.lineWidth = baseLineWidth * 0.72;
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw all Front loops on top (with shadow & double-stroke highlight)
    for (let i = 0; i < totalHalfLoops; i += 2) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)'; // Softer shadow
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2.5;
      ctx.shadowOffsetY = 3.5;

      pathHalfLoop(ctx, i);
      ctx.strokeStyle = 'rgba(232, 124, 80, 0.95)';
      ctx.lineWidth = baseLineWidth;
      ctx.stroke();
      ctx.restore();

      // Draw a soft satin/matte highlight (instead of bright metallic white)
      pathHalfLoop(ctx, i);
      ctx.strokeStyle = 'rgba(255, 225, 200, 0.38)'; // Transparent warm peach highlight for soft satin sheen
      ctx.lineWidth = baseLineWidth * 0.25;
      ctx.stroke();
    }
  }

  function drawThumb(t, idx) {
    if (t.y + t.dispH < -20) return;

    let r = t.dispW / 2;
    // Draw rope from anchor, stopping short of disc edge
    let rdx = t.x - t.anchorX, rdy = t.y - t.anchorY;
    let rDist = Math.sqrt(rdx * rdx + rdy * rdy);
    let hideTop = r * 0.3;      // hide near anchor
    let hideBot = r * 0.75;     // stop before disc edge
    let visLen = rDist - hideTop - hideBot;
    if (visLen > 2) {
      let sx = t.anchorX + rdx * (hideTop / rDist);
      let sy = t.anchorY + rdy * (hideTop / rDist);
      let ex = t.x - rdx * (hideBot / rDist);
      let ey = t.y - rdy * (hideBot / rDist);
      let sway = t._sway || 0;
      let restVisLen = t.stringLen - hideTop - hideBot;
      drawString(sx, sy, ex, ey, sway, restVisLen);
    }
  }

  let isVisible = true;
  new IntersectionObserver(function(e) { isVisible = e[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  function render(ts) {
    if (!isVisible) { requestAnimationFrame(render); return; }
    update(ts);
    let dpr = window.devicePixelRatio || 1;
    let cw = canvas.width / dpr;
    let ch = canvas.height / dpr;
    ctx.clearRect(0, 0, cw, ch);
    
    // 1. Draw ropes on 2D Canvas
    for (let i = 0; i < thumbs.length; i++) {
      drawThumb(thumbs[i], i);
    }
    
    // 2. Update WebGL discs
    for (let i = 0; i < thumbs.length; i++) {
      let t = thumbs[i];
      let d = discs[i];
      if (d) {
        let eased = t.hoverAlpha || 0;
        eased = 1 - Math.pow(1 - eased, 3);
        
        let scaleBoost = 0.05;
        let pulse = 0;
        if (i === latchedIdx) {
          let t_sec = Date.now() / 1000;
          pulse = (Math.sin(t_sec * Math.PI * 0.75) * 0.5 + 0.5) * 0.15;
        }
        
        let scaleFactor = t.dispW / d.baseSz;
        let scale = scaleFactor * (1 + eased * scaleBoost + pulse * 0.25);
        
        // Dynamic Z depth lift to prevent clipping (穿模) and simulate physical height
        let baseZ = i * 4;
        let targetZ = baseZ;
        if (i === draggedIdx) {
          targetZ = baseZ + 45;
        } else if (i === hoveredIdx) {
          targetZ = baseZ + 15;
        }
        t.currentZ = t.currentZ || baseZ;
        t.currentZ += (targetZ - t.currentZ) * 0.12;

        // Place in pixel coordinates, correcting for perspective projection shift 
        // so that the projected 3D disc center aligns perfectly with (t.x, ch - t.y) in 2D space.
        const cameraDepth = 500;
        let pFactor = (cameraDepth - t.currentZ) / cameraDepth;
        let centerX = cw / 2;
        let centerY = ch / 2;
        
        d.group.position.x = centerX + (t.x - centerX) * pFactor;
        d.group.position.y = centerY + ((ch - t.y) - centerY) * pFactor;
        d.group.position.z = t.currentZ;
        d.group.scale.set(scale, scale, 1);
        
        // 3D dynamic tilt based on swing velocity
        let targetTiltX = -t.vy * 0.035;
        let targetTiltY = t.vx * 0.035;
        t.tiltX = t.tiltX || 0;
        t.tiltY = t.tiltY || 0;
        t.tiltX += (targetTiltX - t.tiltX) * 0.08;
        t.tiltY += (targetTiltY - t.tiltY) * 0.08;
        
        d.group.rotation.x = t.tiltX;
        d.group.rotation.y = t.tiltY;
        
        // Spin the child meshes
        d.vinylMesh.rotation.z = t._spin || 0;
        d.labelMesh.rotation.z = t._spin || 0;
        
        // Animate shadow position and opacity (depth simulation)
        // Keep shadow on the background plane (world Z approx -30) by subtracting t.currentZ
        let lift = (t.currentZ - baseZ) / 45; // 0 to 1 lift ratio
        d.shadowMesh.position.x = (5 + eased * 6 + lift * 12) * scaleFactor;
        d.shadowMesh.position.y = (-10 - eased * 12 - lift * 24) * scaleFactor;
        d.shadowMesh.position.z = -30 - t.currentZ - eased * 15;
        d.shadowMesh.scale.set(1 + eased * 0.05 + lift * 0.18, 1 + eased * 0.05 + lift * 0.18, 1);
        d.shadowMesh.material.opacity = Math.max(0.05, 0.45 - eased * 0.08 - lift * 0.15 - (pulse * 0.05));
      }
    }
    
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
    
    requestAnimationFrame(render);
  }

  function getThumbAt(mx, my) {
    // 1. Sticky hover: check the currently hovered item first
    if (hoveredIdx >= 0 && hoveredIdx < thumbs.length) {
      let t = thumbs[hoveredIdx];
      let r = t.dispW / 2;
      let dx = mx - t.x, dy = my - t.y;
      // Use slightly larger radius for stickiness so it doesn't snap off easily
      if (dx * dx + dy * dy <= r * r * 1.8) {
        return hoveredIdx;
      }
    }

    // 2. Normal check for all other items
    for (let i = thumbs.length - 1; i >= 0; i--) {
      let t = thumbs[i];
      let r = t.dispW / 2;
      let dx = mx - t.x, dy = my - t.y;
      if (dx * dx + dy * dy <= r * r * 1.44) {
        return i;
      }
    }
    return -1;
  }

  canvas.addEventListener('mousedown', function(e) {
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let idx = getThumbAt(mx, my);
    if (idx !== -1) {
      draggedIdx = idx;
      let t = thumbs[idx];
      dragOffX = t.x - mx;
      dragOffY = t.y - my;
      dragStartX = mx;
      dragStartY = my;
      prevMouseX = mx;
      prevMouseY = my;
      t.vx = 0; t.vy = 0;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    } else {
      // Check if click was in the latched clip area (since z-index covers it)
      if (latchedIdx >= 0) {
        let t = thumbs[latchedIdx];
        let latchCY = navBottomPx - canvasOffY;
        let clipSize = Math.round(t.dispW * 0.7);
        let clipH = Math.round(clipSize / 2);
        let minX = t.anchorX - clipSize / 2;
        let maxX = t.anchorX + clipSize / 2;
        let minY = latchCY;
        let maxY = latchCY + clipH;
        if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
          let tl = thumbs[latchedIdx];
          tl.vy = -8;
          tl.vx = (Math.random() - 0.5) * 6;
          tl.entering = false;
          tl._swayV = (Math.random() - 0.5) * 0.45;
          let oldLatched = latchedIdx;
          latchedIdx = -1;
          document.querySelectorAll('.latch-clip').forEach(function(c){ c.classList.remove('latched'); });
          if (window.__navWaveStop) window.__navWaveStop(oldLatched);
        }
      }
    }
  });

  // Canvas mousemove: hover only (drag handled globally)
  canvas.addEventListener('mousemove', function(e) {
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    mouseCanvasX = mx;
    mouseCanvasY = my;
    if (draggedIdx < 0) {
      canvas.style.cursor = getThumbAt(mx, my) >= 0 ? 'grab' : '';
      handleAudioHover(getThumbAt(mx, my));
    }
  });

  canvas.addEventListener('mouseleave', function() {
    // Don't interrupt drag when mouse leaves canvas
    if (draggedIdx >= 0) return;
    hoveredIdx = -1;
    handleAudioHover(-1);
    canvas.style.cursor = '';
  });

  // Global mouseup/mousemove so drag survives leaving canvas
  window.addEventListener('mousemove', function(e) {
    if (draggedIdx < 0) return;
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    mouseCanvasX = mx;
    mouseCanvasY = my;
    let t = thumbs[draggedIdx];
    t.vx = (mx - prevMouseX) * 0.50;
    t.vy = (my - prevMouseY) * 0.50;
    prevMouseX = mx;
    prevMouseY = my;
  });

  window.addEventListener('mouseup', function(e) {
    if (draggedIdx < 0) return;
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let dist = Math.sqrt(Math.pow(mx - dragStartX, 2) + Math.pow(my - dragStartY, 2));
    if (dist < 3) {
      // Short click: unlatch or open work detail
      if (latchedIdx === draggedIdx) {
        let tl = thumbs[latchedIdx];
        tl.vy = -8;
        tl.vx = (Math.random() - 0.5) * 6;
        tl.entering = false;
        tl._swayV = (Math.random() - 0.5) * 0.45;
        latchedIdx = -1;
        document.querySelectorAll('.latch-clip').forEach(function(c){ c.classList.remove('latched'); });
        if (window.__navWaveStop) window.__navWaveStop(draggedIdx);
      } else {
        let works = document.querySelectorAll('.work-card');
        if (works[draggedIdx]) {
          let card = works[draggedIdx];
          let key = card.dataset.work;
          let hero = card.dataset.hero;
          if (key && window.workData && window.workData[key]) {
            let data = Object.assign({ slug: key }, window.workData[key]);
            if (window.openDetail) window.openDetail(data, hero);
          }
        }
      }
    } else {
      // Drag release: check if near latch clip
      let t = thumbs[draggedIdx];
      let canvasRect = canvas.getBoundingClientRect();
      let latchCY = navBottomPx - canvasOffY;
      let discCX = t.x;
      let discCY = t.y;
      let latchCX = t.anchorX;
      let dx2 = discCX - latchCX;
      let dy2 = discCY - latchCY;
      let latchDist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      let latchThreshold = t.dispW * 0.95; // Matched to the slightly larger visual snapZone
      if (latchDist < latchThreshold) {
        if (latchedIdx >= 0 && latchedIdx !== draggedIdx) {
          let ejected = thumbs[latchedIdx];
          ejected.vy = -6;
          ejected.vx = (Math.random() - 0.5) * 4;
          ejected.entering = false;
          ejected._swayV = (Math.random() - 0.5) * 0.35;
        }
        let wasAlreadyLatched = (latchedIdx === draggedIdx);
        latchedIdx = draggedIdx;
        
        document.querySelectorAll('.latch-clip').forEach(function(c, ci){
          c.classList.toggle('latched', ci === latchedIdx);
        });
        if (window.__navWaveForcePlay) window.__navWaveForcePlay(draggedIdx);
      }
    }
    draggedIdx = -1;
    hoveredIdx = -1;
    canvas.style.cursor = '';
  });

  canvas.addEventListener('touchstart', function(e) {}, { passive: true });
  canvas.addEventListener('touchmove', function(e) {}, { passive: true });
  canvas.addEventListener('touchend', function(e) {}, { passive: true });

  initWebGL();
  resize();
  requestAnimationFrame(render);
  window.addEventListener('resize', function() { resize(); });

})();
