import * as THREE from 'three';

// ═══════════════════════════════════════════
// WebGL GPU Fluid Simulation (Pavel Dobryakov / Lusion Style)
// ═══════════════════════════════════════════

(function() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;

  const isMobile = ('ontouchstart' in window) || (window.innerWidth <= 768);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // --- 1. Setup Three.js ---
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(dpr);

  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, true);

  // --- Text Distortion Canvas Setup ---
  const textCanvas = document.createElement('canvas');
  const textCtx = textCanvas.getContext('2d');
  let textTexture = new THREE.CanvasTexture(textCanvas);
  textTexture.minFilter = THREE.LinearFilter;
  textTexture.magFilter = THREE.LinearFilter;
  textTexture.wrapS = THREE.ClampToEdgeWrapping;
  textTexture.wrapT = THREE.ClampToEdgeWrapping;

  let webglTextElements = [];
  function initWebGLTextElements() {
    const selectors = [
      '#work .section-tag',
      '#work .section-heading',
      '#work .works-count',
      '#ice .section-tag',
      '#ice .section-heading',
      '#showcase .section-tag',
      '#showcase .section-heading',
      '.showcase-text-item .section-tag',
      '.showcase-text-item .showcase-title',
      '.showcase-text-item .showcase-desc',
      '#motion .section-tag',
      '#motion .section-heading',
      '#poetry .poetry-sidebar .section-tag',
      '#poetry .poetry-title-vertical span',
      '#about .about-large .section-tag'
    ];
    webglTextElements = [];
    selectors.forEach(sel => {
      const els = document.querySelectorAll(sel);
      els.forEach(el => webglTextElements.push(el));
    });
  }
  initWebGLTextElements();
  window.addEventListener('load', initWebGLTextElements);

  let workCardElements = [];
  function initWorkCardElements() {
    workCardElements = Array.from(document.querySelectorAll('.work-card'));
  }
  initWorkCardElements();
  window.addEventListener('load', initWorkCardElements);

  // --- 2. Fluid Simulation Settings ---
  // Lower resolution for simulation grids is standard for fluid dynamics
  const SIM_RES = isMobile ? 64 : 128;
  const DYE_RES = isMobile ? 256 : 512;

  // Parameters
  const config = {
    DISSIPATION: 0.99,      // How fast the fluid dye fades (longer trails)
    VELOCITY_DISSIPATION: 0.994, // Damped decay for smoother, less abrupt movements (optimized for dual-ripple animation)
    PRESSURE: 0.8,          // Pressure solve multiplier
    PRESSURE_ITERATIONS: 20,// Quality of the swirls
    CURL: 30.0,             // Vorticity confinement (adds micro-swirls)
    SPLAT_RADIUS: isMobile ? 0.01 : 0.008, // Wider, gentler splat brush radius
  };

  // WebGL Half Float support
  const type = THREE.HalfFloatType; 

  function createFBO(width, height) {
    return new THREE.WebGLRenderTarget(width, height, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: type,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false
    });
  }

  function createDoubleFBO(width, height) {
    let fbo1 = createFBO(width, height);
    let fbo2 = createFBO(width, height);
    return {
      read: fbo1,
      write: fbo2,
      swap() {
        const temp = this.read;
        this.read = this.write;
        this.write = temp;
      }
    };
  }

  // Double buffers for Ping-Ponging
  const density = createDoubleFBO(DYE_RES, DYE_RES);
  const velocity = createDoubleFBO(SIM_RES, SIM_RES);
  const pressure = createDoubleFBO(SIM_RES, SIM_RES);
  const divergence = createFBO(SIM_RES, SIM_RES);
  const curl = createFBO(SIM_RES, SIM_RES);

  // --- 3. Shaders ---
  const baseVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Advect Shader: Moves density/velocity along velocity field
  const advectShader = `
    precision highp float;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 uTexelSize;
    uniform float uDt;
    uniform float uDissipation;
    varying vec2 vUv;
    void main() {
      // Semi-Lagrangian advection
      vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexelSize;
      gl_FragColor = uDissipation * texture2D(uSource, coord);
    }
  `;

  // Splat Shader: Applies force / adds dye color
  const splatShader = `
    precision highp float;
    uniform sampler2D uTarget;
    uniform vec2 uPoint;
    uniform vec3 uColor;
    uniform float uRadius;
    uniform float uAspect;
    varying vec2 vUv;
    void main() {
      vec4 base = texture2D(uTarget, vUv);
      vec2 p = vUv - uPoint;
      p.x *= uAspect; // Correct aspect ratio for circular brush
      float splat = exp(-dot(p, p) / uRadius);
      gl_FragColor = vec4(base.rgb + uColor * splat, base.a);
    }
  `;

  // Divergence Shader
  const divergenceShader = `
    precision highp float;
    uniform sampler2D uVelocity;
    uniform vec2 uTexelSize;
    varying vec2 vUv;
    void main() {
      float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
      float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
      float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
      float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;

      // Boundary condition handles (simple slip)
      if (vUv.x - uTexelSize.x < 0.0) L = -texture2D(uVelocity, vUv).x;
      if (vUv.x + uTexelSize.x > 1.0) R = -texture2D(uVelocity, vUv).x;
      if (vUv.y - uTexelSize.y < 0.0) B = -texture2D(uVelocity, vUv).y;
      if (vUv.y + uTexelSize.y > 1.0) T = -texture2D(uVelocity, vUv).y;

      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  `;

  // Jacobi Solve (Pressure) Shader
  const jacobiShader = `
    precision highp float;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    uniform vec2 uTexelSize;
    varying vec2 vUv;
    void main() {
      float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
      float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
      float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
      float div = texture2D(uDivergence, vUv).x;
      float p = (L + R + B + T - div) * 0.25;
      gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
    }
  `;

  // Gradient Subtraction Shader (makes velocity field divergence-free)
  const gradientSubtractShader = `
    precision highp float;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    uniform vec2 uTexelSize;
    varying vec2 vUv;
    void main() {
      float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
      float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
      float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
      vec2 vel = texture2D(uVelocity, vUv).xy;
      vel -= 0.5 * vec2(R - L, T - B);
      gl_FragColor = vec4(vel, 0.0, 1.0);
    }
  `;

  // Display Shader: Render final fluid colors on top of stars + space
  const displayShader = `
    precision highp float;
    uniform sampler2D uDensity;
    uniform sampler2D uVelocity;
    uniform sampler2D uTextTexture;
    uniform float uTime;
    uniform float uIsLightMode;
    uniform vec2 uResolution;
    uniform float uDividerYs[10];
    uniform int uDividerCount;
    uniform float uDpr;
    varying vec2 vUv;

    // High quality 2D hash returning vec3
    vec3 hash3(vec2 p) {
      vec3 q = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
      q += dot(q, q.yzx + 19.19);
      return fract((q.xxy + q.yxx) * q.zyx);
    }

    // Grid-based pinpoint star generator
    float getStars(vec2 uv, float scale, float t) {
      vec2 p = uv * scale;
      vec2 g = floor(p);
      vec2 f = fract(p);
      
      vec3 r = hash3(g);
      
      // Star position offset in the cell
      vec2 offset = r.xy * 0.8 + 0.1;
      float d = length(f - offset);
      
      // Twinkle frequency and phase based on hash
      float twinkle = 0.2 + 0.8 * sin(t * (1.5 + r.z) + r.x * 20.0);
      
      // Pinpoint star falloff
      float size = 0.008 + r.z * 0.025;
      float star = smoothstep(size, 0.0, d);
      
      // Core glow
      float core = smoothstep(size * 0.25, 0.0, d) * 1.5;
      
      // Spawn star only in ~40% of the grid cells
      return (star + core) * twinkle * step(0.6, r.z);
    }

    // WebGL Line drawer with sub-pixel antialiasing
    float getCrispLine(float dist, float dpr) {
      float aa = 1.0 / dpr;
      float halfWidth = 0.5; // 1 CSS pixel thick
      return smoothstep(halfWidth + aa, halfWidth - aa, abs(dist));
    }

    // WebGL Crosshair (+) drawer with sub-pixel antialiasing
    float getCrispCrosshair(vec2 uv, float cx, float cy, float size, vec2 res, float dpr) {
      vec2 d = abs(uv - vec2(cx / res.x, cy)) * res;
      float aa = 1.0 / dpr;
      float thickness = 1.0; // 1 CSS pixel thick
      float halfWidth = thickness * 0.5;
      
      // Horizontal line
      float hLine = smoothstep(halfWidth + aa, halfWidth - aa, d.y) * step(d.x, size);
      // Vertical line
      float vLine = smoothstep(halfWidth + aa, halfWidth - aa, d.x) * step(d.y, size);
      
      return max(hLine, vLine);
    }

    void main() {
      // Sample velocity to apply spatial refraction / chromatic aberration
      vec2 vel = texture2D(uVelocity, vUv).xy;
      
      // Chromatic aberration offsets based on velocity strength
      float abFactor = 0.015;
      vec2 uvR = vUv + vel * abFactor;
      vec2 uvG = vUv + vel * (abFactor * 1.2);
      vec2 uvB = vUv + vel * (abFactor * 1.4);

      // Sample fluid dye colors
      float dyeR = texture2D(uDensity, uvR).r;
      float dyeG = texture2D(uDensity, uvG).g;
      float dyeB = texture2D(uDensity, uvB).b;
      vec3 fluidColor = vec3(dyeR, dyeG, dyeB);

      // Procedural space stars background (swirling under velocity)
      vec2 spaceUvR = (uvR - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) + 0.5;
      vec2 spaceUvG = (uvG - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) + 0.5;
      vec2 spaceUvB = (uvB - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) + 0.5;
      
      // Render two layers of stars for parallax depth:
      float sR = getStars(spaceUvR, 25.0, uTime) + getStars(spaceUvR, 60.0, uTime) * 0.5;
      float sG = getStars(spaceUvG, 25.0, uTime) + getStars(spaceUvG, 60.0, uTime) * 0.5;
      float sB = getStars(spaceUvB, 25.0, uTime) + getStars(spaceUvB, 60.0, uTime) * 0.5;
      vec3 starColor = vec3(sR, sG, sB);

      // Dark space background color
      vec3 spaceColor = vec3(0.005, 0.005, 0.01) + starColor * 0.85;

      // 1px Vertical Blueprint lines warped by fluid velocity with chromatic aberration
      float leftLinePx = 32.0;
      float rightLinePx = uResolution.x - 32.0;
      
      float lineR = getCrispLine(uvR.x * uResolution.x - leftLinePx, uDpr) +
                    getCrispLine(uvR.x * uResolution.x - rightLinePx, uDpr);
      float lineG = getCrispLine(uvG.x * uResolution.x - leftLinePx, uDpr) +
                    getCrispLine(uvG.x * uResolution.x - rightLinePx, uDpr);
      float lineB = getCrispLine(uvB.x * uResolution.x - leftLinePx, uDpr) +
                    getCrispLine(uvB.x * uResolution.x - rightLinePx, uDpr);

      float crosshairR = 0.0;
      float crosshairG = 0.0;
      float crosshairB = 0.0;

      // Draw horizontal dividers and crosshairs dynamically (up to 10 in viewport)
      for (int i = 0; i < 10; i++) {
        if (i < uDividerCount) {
          float yVal = uDividerYs[i];
          // Horizontal line
          lineR += getCrispLine((uvR.y - yVal) * uResolution.y, uDpr);
          lineG += getCrispLine((uvG.y - yVal) * uResolution.y, uDpr);
          lineB += getCrispLine((uvB.y - yVal) * uResolution.y, uDpr);

          // Left crosshair (+)
          float cLeftR = getCrispCrosshair(uvR, leftLinePx, yVal, 5.0, uResolution, uDpr);
          float cLeftG = getCrispCrosshair(uvG, leftLinePx, yVal, 5.0, uResolution, uDpr);
          float cLeftB = getCrispCrosshair(uvB, leftLinePx, yVal, 5.0, uResolution, uDpr);

          // Right crosshair (+)
          float cRightR = getCrispCrosshair(uvR, rightLinePx, yVal, 5.0, uResolution, uDpr);
          float cRightG = getCrispCrosshair(uvG, rightLinePx, yVal, 5.0, uResolution, uDpr);
          float cRightB = getCrispCrosshair(uvB, rightLinePx, yVal, 5.0, uResolution, uDpr);

          // Accumulate crosshair masks
          crosshairR += max(cLeftR, cRightR);
          crosshairG += max(cLeftG, cRightG);
          crosshairB += max(cLeftB, cRightB);
        }
      }

      vec3 lineColor = vec3(lineR, lineG, lineB) * 0.15;
      vec3 crosshairColor = vec3(crosshairR, crosshairG, crosshairB) * 0.65;

      // Combine space, stars, fluid, and lines
      vec3 finalColor = spaceColor + fluidColor * 1.5 + lineColor + crosshairColor;

      // Handle Light Mode Inversion
      if (uIsLightMode > 0.5) {
        // Soft white canvas instead of pure black
        finalColor = mix(vec3(0.98, 0.98, 0.96), vec3(0.1, 0.3, 0.4), length(fluidColor) * 0.8);
        finalColor -= starColor * 0.15; // Darker stars in light mode
        finalColor -= vec3(lineR, lineG, lineB) * 0.15; // Darker lines in light mode
        finalColor -= vec3(crosshairR, crosshairG, crosshairB) * 0.65; // Darker crosshairs in light mode
      }

      // Sample text texture with chromatic aberration
      vec4 textColR = texture2D(uTextTexture, uvR);
      vec4 textColG = texture2D(uTextTexture, uvG);
      vec4 textColB = texture2D(uTextTexture, uvB);
      vec3 textColor = vec3(textColR.r, textColG.g, textColB.b);
      float textMask = max(textColR.a, max(textColG.a, textColB.a));

      // Blend text on top
      finalColor = mix(finalColor, textColor, textMask);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // --- 4. Pass Materials ---
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new THREE.Scene();
  const quadGeometry = new THREE.PlaneGeometry(2, 2);
  const quadMesh = new THREE.Mesh(quadGeometry, null);
  quadScene.add(quadMesh);

  function createMaterial(frag, uniforms) {
    return new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: frag,
      uniforms: uniforms,
      depthWrite: false,
      depthTest: false,
      transparent: true
    });
  }

  const matAdvect = createMaterial(advectShader, {
    uVelocity: { value: null },
    uSource: { value: null },
    uTexelSize: { value: new THREE.Vector2() },
    uDt: { value: 0 },
    uDissipation: { value: 1.0 }
  });

  const matSplat = createMaterial(splatShader, {
    uTarget: { value: null },
    uPoint: { value: new THREE.Vector2() },
    uColor: { value: new THREE.Vector3() },
    uRadius: { value: 0 },
    uAspect: { value: 1.0 }
  });

  const matDivergence = createMaterial(divergenceShader, {
    uVelocity: { value: null },
    uTexelSize: { value: new THREE.Vector2() }
  });

  const matJacobi = createMaterial(jacobiShader, {
    uPressure: { value: null },
    uDivergence: { value: null },
    uTexelSize: { value: new THREE.Vector2() }
  });

  const matGradientSubtract = createMaterial(gradientSubtractShader, {
    uPressure: { value: null },
    uVelocity: { value: null },
    uTexelSize: { value: new THREE.Vector2() }
  });

  const matDisplay = createMaterial(displayShader, {
    uDensity: { value: null },
    uVelocity: { value: null },
    uTextTexture: { value: textTexture },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
    uIsLightMode: { value: 0 },
    uDividerYs: { value: new Float32Array(10) },
    uDividerCount: { value: 0 },
    uDpr: { value: dpr }
  });

  // --- 5. GPU Simulation Functions ---
  function renderPass(material, output) {
    quadMesh.material = material;
    renderer.setRenderTarget(output);
    renderer.render(quadScene, quadCamera);
  }

  function splat(x, y, dx, dy, color, customRadius) {
    const radius = customRadius !== undefined ? customRadius : config.SPLAT_RADIUS;

    // Velocity splat (adds force)
    matSplat.uniforms.uTarget.value = velocity.read.texture;
    matSplat.uniforms.uPoint.value.set(x, y);
    matSplat.uniforms.uColor.value.set(dx * 35.0, dy * 35.0, 0.0); // Reset to 35.0 for rich hover trails
    matSplat.uniforms.uRadius.value = radius;
    matSplat.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    renderPass(matSplat, velocity.write);
    velocity.swap();

    // Dye/Color splat
    matSplat.uniforms.uTarget.value = density.read.texture;
    matSplat.uniforms.uPoint.value.set(x, y);
    matSplat.uniforms.uColor.value.set(color.r, color.g, color.b);
    matSplat.uniforms.uRadius.value = radius;
    matSplat.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    renderPass(matSplat, density.write);
    density.swap();
  }

  function clickSplat(x, y) {
    // 蜻蜓点水：点击产生两次扩散的涟漪，第二重延迟 0.15 秒触发（配合 0.6s 周期缩短延迟）
    createSingleRipple(x, y, 0.0);
    createSingleRipple(x, y, 0.15);
  }

  function createSingleRipple(x, y, delay) {
    // 限制最大活跃波纹数，防止狂点导致多帧渲染卡顿
    if (activeRipples.length >= 6) {
      activeRipples.shift();
    }
    
    activeRipples.push({
      x,
      y,
      delay,      // 延迟触发的时间（秒）
      age: 0,     // 已存活时间
      duration: 0.6,   // 生命周期进一步缩短至 0.6s，使起伏和消散更加快速利落
      maxRadius: 0.11, // 最大范围限制在 0.11 (原先 0.16 的 70% 左右)
      color: new THREE.Color(pointer.color.r, pointer.color.g, pointer.color.b)
    });
  }

  function step(dt) {
    // 1. Advect Velocity
    matAdvect.uniforms.uVelocity.value = velocity.read.texture;
    matAdvect.uniforms.uSource.value = velocity.read.texture;
    matAdvect.uniforms.uTexelSize.value.set(1.0 / SIM_RES, 1.0 / SIM_RES);
    matAdvect.uniforms.uDt.value = dt;
    matAdvect.uniforms.uDissipation.value = config.VELOCITY_DISSIPATION;
    renderPass(matAdvect, velocity.write);
    velocity.swap();

    // 2. Advect Density (Dye)
    matAdvect.uniforms.uVelocity.value = velocity.read.texture;
    matAdvect.uniforms.uSource.value = density.read.texture;
    matAdvect.uniforms.uTexelSize.value.set(1.0 / DYE_RES, 1.0 / DYE_RES);
    matAdvect.uniforms.uDt.value = dt;
    matAdvect.uniforms.uDissipation.value = config.DISSIPATION;
    renderPass(matAdvect, density.write);
    density.swap();

    // 3. Compute Divergence
    matDivergence.uniforms.uVelocity.value = velocity.read.texture;
    matDivergence.uniforms.uTexelSize.value.set(1.0 / SIM_RES, 1.0 / SIM_RES);
    renderPass(matDivergence, divergence);

    // 4. Pressure Solve (Jacobi iterations)
    renderer.setRenderTarget(pressure.read);
    renderer.clear();
    
    matJacobi.uniforms.uDivergence.value = divergence.texture;
    matJacobi.uniforms.uTexelSize.value.set(1.0 / SIM_RES, 1.0 / SIM_RES);
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      matJacobi.uniforms.uPressure.value = pressure.read.texture;
      renderPass(matJacobi, pressure.write);
      pressure.swap();
    }

    // 5. Subtract Gradient
    matGradientSubtract.uniforms.uPressure.value = pressure.read.texture;
    matGradientSubtract.uniforms.uVelocity.value = velocity.read.texture;
    matGradientSubtract.uniforms.uTexelSize.value.set(1.0 / SIM_RES, 1.0 / SIM_RES);
    renderPass(matGradientSubtract, velocity.write);
    velocity.swap();
  }

  // --- 6. Event Listeners & Input ---
  const pointer = {
    x: 0.5,
    y: 0.5,
    px: 0.5,
    py: 0.5,
    dx: 0,
    dy: 0,
    targetDx: 0,
    targetDy: 0,
    moved: false,
    color: new THREE.Color()
  };
  
  // 存储所有处于活动状态的“蜻蜓点水”涟漪数据
  const activeRipples = [];

  function updatePointerColor(time) {
    const r = Math.sin(time * 0.5) * 0.5 + 0.5;
    const g = Math.sin(time * 0.3 + 2.0) * 0.5 + 0.5;
    const b = Math.sin(time * 0.2 + 4.0) * 0.5 + 0.5;
    pointer.color.setRGB(r * 0.4 + 0.1, g * 0.2 + 0.2, b * 0.7 + 0.3);
  }

  function updatePointer(clientX, clientY) {
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.x = clientX / window.innerWidth;
    pointer.y = 1.0 - (clientY / window.innerHeight);
    pointer.targetDx = pointer.x - pointer.px;
    pointer.targetDy = pointer.y - pointer.py;
    pointer.moved = true;
  }

  window.addEventListener('mousemove', (e) => {
    updatePointer(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('mousedown', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = 1.0 - (e.clientY / window.innerHeight);
    clickSplat(x, y);
  });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const x = e.touches[0].clientX / window.innerWidth;
      const y = 1.0 - (e.touches[0].clientY / window.innerHeight);
      clickSplat(x, y);
    }
  }, { passive: true });

  let dividers = [];
  function initDividers() {
    dividers = Array.from(document.querySelectorAll('.h-grid-divider'));
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initDividers();
  } else {
    window.addEventListener('load', initDividers);
  }

  // --- 7. Animation Loop ---
  let isVisible = true;
  new IntersectionObserver((e) => { isVisible = e[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, true);
    matDisplay.uniforms.uResolution.value.set(w, h);
    matDisplay.uniforms.uDpr.value = dpr;
    
    // Resize text canvas
    textCanvas.width = w * dpr;
    textCanvas.height = h * dpr;
    
    // Dispose old texture to prevent WebGL offset overflow errors
    if (textTexture) {
      textTexture.dispose();
    }
    // Recreate texture with new canvas dimensions
    textTexture = new THREE.CanvasTexture(textCanvas);
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.magFilter = THREE.LinearFilter;
    textTexture.wrapS = THREE.ClampToEdgeWrapping;
    textTexture.wrapT = THREE.ClampToEdgeWrapping;
    matDisplay.uniforms.uTextTexture.value = textTexture;
  }
  window.addEventListener('resize', resize);
  resize();

  // Theme Sync
  function syncTheme() {
    const isLight = document.documentElement.classList.contains('light');
    matDisplay.uniforms.uIsLightMode.value = isLight ? 1.0 : 0.0;
  }
  syncTheme();
  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const dt = Math.min(clock.getDelta(), 0.033);
    const time = clock.getElapsedTime();

    updatePointerColor(time);

    // Smoothly LERP pointer velocity to create a soft, liquid glide
    pointer.dx += (pointer.targetDx - pointer.dx) * 0.12;
    pointer.dy += (pointer.targetDy - pointer.dy) * 0.12;
    
    // Decay targets over time so deceleration is organic
    pointer.targetDx *= 0.85;
    pointer.targetDy *= 0.85;

    if (pointer.moved || Math.abs(pointer.dx) > 0.0001 || Math.abs(pointer.dy) > 0.0001) {
      splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
      pointer.moved = false;
    } else {
      const automoveX = 0.5 + Math.sin(time * 1.5) * 0.3;
      const automoveY = 0.5 + Math.cos(time * 1.2) * 0.3;
      const dx = Math.sin(time * 5.0) * 0.0015;
      const dy = Math.cos(time * 4.0) * 0.0015;
      splat(automoveX, automoveY, dx, dy, pointer.color);
    }
    
    // 注入并渲染所有“蜻蜓点水”涟漪的波浪变化
    for (let i = activeRipples.length - 1; i >= 0; i--) {
      const rp = activeRipples[i];
      if (rp.delay > 0) {
        rp.delay -= dt;
        continue;
      }
      
      rp.age += dt;
      if (rp.age >= rp.duration) {
        activeRipples.splice(i, 1);
        continue;
      }
      
      const progress = rp.age / rp.duration; // 0.0 到 1.0
      // 径向扩散半径使用 sine 缓动，先快后慢
      const currentRadius = Math.sin(progress * Math.PI * 0.5) * rp.maxRadius;
      
      // 力道随着扩散加速衰减 (1 - p)^2，最大力道设为 0.024，保持极佳的缓和性
      const force = (1.0 - progress) * (1.0 - progress) * 0.024;
      
      // splat 画笔尺寸随扩散缓慢变大
      const splatRadius = config.SPLAT_RADIUS * (3.0 + progress * 2.5);
      
      const numAngles = 8;
      for (let j = 0; j < numAngles; j++) {
        const angle = (j / numAngles) * Math.PI * 2;
        const splatX = rp.x + Math.cos(angle) * currentRadius;
        const splatY = rp.y + Math.sin(angle) * currentRadius;
        
        // 速度矢量朝内，在折射贴图转换中呈现向外不断推开的涟漪层
        const fx = -Math.cos(angle) * force;
        const fy = -Math.sin(angle) * force;
        splat(splatX, splatY, fx, fy, rp.color, splatRadius);
      }
    }

    // Calculate Y coordinates of horizontal dividers relative to the viewport
    const dividerYs = new Float32Array(10);
    let dividerCount = 0;
    for (let i = 0; i < dividers.length && dividerCount < 10; i++) {
      const rect = dividers[i].getBoundingClientRect();
      if (rect.top >= -20 && rect.top <= window.innerHeight + 20) {
        dividerYs[dividerCount] = 1.0 - (rect.top + rect.height / 2) / window.innerHeight;
        dividerCount++;
      }
    }
    matDisplay.uniforms.uDividerYs.value = dividerYs;
    matDisplay.uniforms.uDividerCount.value = dividerCount;

    // 1. Draw WebGL text elements onto offscreen canvas
    if (webglTextElements.length > 0 || workCardElements.length > 0) {
      try {
        textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
        textCtx.save();
        textCtx.scale(dpr, dpr);

        // Draw work card borders
        workCardElements.forEach((el, idx) => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom >= -100 && rect.top <= window.innerHeight + 100) {
            textCtx.save();
            const style = window.getComputedStyle(el);
            const opacity = parseFloat(style.opacity);
            textCtx.globalAlpha = opacity;

            const isLight = document.documentElement.classList.contains('light');
            const color = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)';
            textCtx.fillStyle = color;

            // Draw top border line
            textCtx.fillRect(rect.left, rect.top - 0.5, rect.width, 1);

            // Draw bottom border line for the last card
            if (idx === workCardElements.length - 1) {
              textCtx.fillRect(rect.left, rect.bottom - 0.5, rect.width, 1);
            }
            textCtx.restore();
          }
        });

        webglTextElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const opacity = parseFloat(style.opacity);
          
          // Traverse ancestors to check for hidden visibility/display and accumulate opacity
          let computedOpacity = opacity;
          let parent = el.parentElement;
          let isParentVisible = true;
          while (parent) {
            const pStyle = window.getComputedStyle(parent);
            if (pStyle.display === 'none' || pStyle.visibility === 'hidden') {
              isParentVisible = false;
              break;
            }
            const pOpacity = parseFloat(pStyle.opacity);
            if (!isNaN(pOpacity)) {
              computedOpacity *= pOpacity;
            }
            parent = parent.parentElement;
          }
          
          if (isParentVisible && computedOpacity > 0) {
            const rect = el.getBoundingClientRect();
            if (rect.bottom >= -100 && rect.top <= window.innerHeight + 100) {
              textCtx.save();
              textCtx.globalAlpha = computedOpacity;

              const filter = style.filter || '';
              const blurMatch = filter.match(/blur\(([\d.]+)px\)/);
              const blurVal = blurMatch ? parseFloat(blurMatch[1]) : 0;
              if (blurVal > 0) {
                textCtx.filter = `blur(${blurVal}px)`;
              }

              const paddingLeft = parseFloat(style.paddingLeft) || 0;
              const paddingRight = parseFloat(style.paddingRight) || 0;
              const maxWidth = rect.width - paddingLeft - paddingRight;

              // Pre-configure context font for accurate measurements
              textCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

              let lines = [];
              if (el.classList.contains('section-heading')) {
                const rawHTML = el.innerHTML;
                lines = rawHTML.split(/<br\s*\/?>/i).map(str => {
                  const tmp = document.createElement('div');
                  tmp.innerHTML = str;
                  return tmp.textContent || tmp.innerText || '';
                });
              } else if (el.classList.contains('showcase-desc') || el.classList.contains('showcase-title')) {
                const text = el.textContent || el.innerText || '';
                const words = text.split(' ');
                let currentLine = '';
                for (let n = 0; n < words.length; n++) {
                  const testLine = currentLine + (currentLine ? ' ' : '') + words[n];
                  const testWidth = textCtx.measureText(testLine).width;
                  if (testWidth > maxWidth && n > 0) {
                    lines.push(currentLine);
                    currentLine = words[n];
                  } else {
                    currentLine = testLine;
                  }
                }
                if (currentLine) {
                  lines.push(currentLine);
                }
              } else {
                lines = [el.textContent || el.innerText || ''];
              }

              const align = style.textAlign || 'left';
              textCtx.textAlign = align;
              textCtx.textBaseline = 'middle';

              let color = style.color;
              const isLight = document.documentElement.classList.contains('light');
              if (isLight) {
                if (el.classList.contains('section-tag')) {
                  color = style.color || '#e87c50';
                } else {
                  color = '#000000';
                }
              } else {
                if (el.classList.contains('section-tag')) {
                  color = style.color || '#e87c50';
                } else {
                  color = '#ffffff';
                }
              }
              textCtx.fillStyle = color;

              let isShowcaseTag = false;
              let tagLineW = 36;
              let tagPadding = paddingLeft;

              if (el.classList.contains('section-tag')) {
                if (el.closest && el.closest('.showcase-text-item')) {
                  isShowcaseTag = true;
                  tagLineW = 14;
                  tagPadding = 26; // 14px line + 12px gap
                }
              }

              let drawX = rect.left;
              if (align === 'right') {
                drawX = rect.right - paddingRight;
              } else if (align === 'center') {
                drawX = rect.left + rect.width / 2 + (paddingLeft - paddingRight) / 2;
              } else {
                drawX = rect.left + (isShowcaseTag ? tagPadding : paddingLeft);
              }

              if (el.classList.contains('section-tag')) {
                textCtx.fillStyle = color;
                textCtx.fillRect(rect.left, rect.top + rect.height / 2 - 0.5, tagLineW, 1);
              }

              const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
              const numLines = lines.length;
              const centerY = rect.top + rect.height / 2;
              const startY = centerY - (numLines - 1) * lineHeight / 2;

              lines.forEach((lineText, idx) => {
                const lineY = startY + idx * lineHeight;
                textCtx.fillText(lineText, drawX, lineY);
              });

              textCtx.restore();
            }
          }
        });

        textCtx.restore();
        textTexture.needsUpdate = true;
      } catch (err) {
        console.error('Error drawing WebGL text elements: ', err);
      }
    }

    step(dt);

    // Update display uniforms
    matDisplay.uniforms.uDensity.value = density.read.texture;
    matDisplay.uniforms.uVelocity.value = velocity.read.texture;
    matDisplay.uniforms.uTime.value = time;

    quadMesh.material = matDisplay;
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCamera);
  }

  animate();
})();
