import * as THREE from 'three';
import gsap from 'gsap';

// ═══════════════════════════════════════════
// WebGL Works Preview System (Morph Transition Only)
// ═══════════════════════════════════════════

(function() {
  const isMobile = ('ontouchstart' in window) || (window.innerWidth <= 768);
  if (isMobile) {
    console.log('[Works WebGL] Mobile detected. Skipping WebGL preview module.');
    return;
  }

  const canvas = document.getElementById('worksWebGLCanvas');
  const worksSection = document.getElementById('work');
  if (!canvas || !worksSection) return;

  // Three.js Core
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  const Z_DEPTH = 600;
  camera.position.set(0, 0, Z_DEPTH);

  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true,
    powerPreference: 'high-performance', premultipliedAlpha: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ── Shaders with object-fit:cover UV computation ──
  const vertexShader = `
    varying vec2 vUv;
    uniform vec2 uMouseVelocity;
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Dynamic jelly skewing/bending along X and Y axes driven by mouse speed
      float PI = 3.14159265;
      pos.x += sin(uv.y * PI) * uMouseVelocity.x * 0.12;
      pos.y += sin(uv.x * PI) * uMouseVelocity.y * 0.12;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uVelocity;
    uniform float uTransition;
    uniform float uOpacity;
    uniform float uImageAspect;
    uniform float uContainerAspect;
    uniform vec2 uMouseVelocity;
    varying vec2 vUv;

    float rand(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 fp = fract(p);
      fp = fp * fp * (3.0 - 2.0 * fp);
      return mix(mix(rand(ip), rand(ip+vec2(1,0)), fp.x),
                 mix(rand(ip+vec2(0,1)), rand(ip+vec2(1,1)), fp.x), fp.y);
    }

    void main() {
      // ── object-fit: cover UV computation ──
      vec2 uv = vUv;
      float ratio = uContainerAspect / uImageAspect;
      if (ratio > 1.0) {
        // Container is wider than image -> crop top/bottom
        uv.y = (uv.y - 0.5) / ratio + 0.5;
      } else {
        // Container is taller than image -> crop left/right
        uv.x = (uv.x - 0.5) * ratio + 0.5;
      }

      // Liquid noise at transition midpoint (multi-layered warp)
      float wave = uTransition * (1.0 - uTransition);
      
      // Hover mouse velocity liquid warp
      float mouseSpeed = length(uMouseVelocity);
      vec2 uvDistorted = uv;
      
      if (wave > 0.0) {
        float n1 = noise(uv * 8.0 + vec2(0.0, uTransition * 4.0));
        float n2 = noise(uv * 15.0 - vec2(uTransition * 6.0, 0.0));
        uvDistorted.x += (n1 - 0.5) * 0.12 * wave;
        uvDistorted.y += (n2 - 0.5) * 0.12 * wave;
      } else if (mouseSpeed > 0.01) {
        // Organic liquid ripple on active mouse movement
        float n = noise(uv * 10.0 + mouseSpeed * 1.5);
        uvDistorted += (n - 0.5) * mouseSpeed * 0.06;
      }

      // Chromatic aberration: split channels along movement direction
      float shift = abs(uVelocity) * 0.0004 + wave * 0.022 + mouseSpeed * 0.015;
      
      vec2 shiftVector = vec2(shift, shift * 0.5);
      if (mouseSpeed > 0.01) {
        shiftVector = normalize(uMouseVelocity) * shift;
      }
      
      vec4 r = texture2D(uTexture, uvDistorted + shiftVector);
      vec4 g = texture2D(uTexture, uvDistorted);
      vec4 b = texture2D(uTexture, uvDistorted - shiftVector);

      gl_FragColor = vec4(r.r, g.g, b.b, uOpacity);
    }
  `;

  // ── Pre-load textures & store natural aspect ratios ──
  const textureLoader = new THREE.TextureLoader();
  const textures = {};
  const imageAspects = {};
  const texturePaths = [
    'images/works/image1.webp',
    'images/works/image2.jpg',
    'images/works/image3.webp',
    'images/works/image4.webp'
  ];
  texturePaths.forEach(path => {
    textures[path] = textureLoader.load(path, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      // Store natural image aspect ratio once loaded
      if (tex.image) {
        imageAspects[path] = tex.image.width / tex.image.height;
      }
    });
  });

  // Material with cover uniforms
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: {
      uTexture: { value: new THREE.Texture() },
      uVelocity: { value: 0.0 },
      uTransition: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uImageAspect: { value: 1.0 },
      uContainerAspect: { value: 1.0 },
      uMouseVelocity: { value: new THREE.Vector2(0, 0) }
    },
    transparent: true, depthWrite: false, depthTest: false
  });

  // Geometry & Mesh
  const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  scene.add(mesh);
  renderer.compile(scene, camera);

  // States
  let isHoverActive = false;
  let isMorphing = false;
  let animId = null;
  const currentRect = { left: 0, top: 0, width: 0, height: 0 };

  // Scroll velocity
  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  let currentScrollVelocity = 0;
  window.addEventListener('scroll', () => {
    const curScrollY = window.scrollY;
    scrollVelocity = curScrollY - lastScrollY;
    lastScrollY = curScrollY;
  }, { passive: true });

  // DOM -> WebGL coordinate mapping
  function mapDOMToWebGL(rect) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      width: rect.width,
      height: rect.height,
      x: rect.left + rect.width / 2 - w / 2,
      y: -(rect.top + rect.height / 2 - h / 2)
    };
  }

  // ── Render loop ──
  function animate() {
    if (!isMorphing && !isHoverActive) {
      animId = null;
      return;
    }
    animId = requestAnimationFrame(animate);

    currentScrollVelocity += (scrollVelocity - currentScrollVelocity) * 0.1;
    scrollVelocity *= 0.9;
    material.uniforms.uVelocity.value = gsap.utils.clamp(-25, 25, currentScrollVelocity);

    // Smoothly decay mouse velocity uniform towards zero
    material.uniforms.uMouseVelocity.value.x += (0 - material.uniforms.uMouseVelocity.value.x) * 0.12;
    material.uniforms.uMouseVelocity.value.y += (0 - material.uniforms.uMouseVelocity.value.y) * 0.12;

    // Update container aspect ratio every frame
    material.uniforms.uContainerAspect.value = currentRect.width / currentRect.height;

    const mapped = mapDOMToWebGL(currentRect);
    mesh.scale.set(mapped.width, mapped.height, 1);
    mesh.position.set(mapped.x, mapped.y, 0);
    renderer.render(scene, camera);
  }

  canvas.style.display = 'block';
  canvas.style.pointerEvents = 'none';

  // ── Hover API ──
  function showPreview(texturePath, rect) {
    isHoverActive = true;
    if (!animId) animate();

    canvas.className = 'works-webgl-canvas';
    canvas.style.zIndex = '90';

    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = 2 * Math.atan(h / (2 * Z_DEPTH)) * (180 / Math.PI);
    camera.updateProjectionMatrix();

    // Assign texture and natural aspect ratio
    const tex = textures[texturePath];
    if (tex) material.uniforms.uTexture.value = tex;
    material.uniforms.uImageAspect.value = imageAspects[texturePath] || 1.0;

    // Reset transitions and rotation
    material.uniforms.uTransition.value = 0.0;
    mesh.rotation.set(0, 0, 0);
    mesh.visible = true;

    // Initialize current coordinates
    currentRect.left = rect.left;
    currentRect.top = rect.top;
    currentRect.width = rect.width;
    currentRect.height = rect.height;

    // Animate opacity fade-in
    gsap.killTweensOf(material.uniforms.uOpacity);
    gsap.to(material.uniforms.uOpacity, {
      value: 1.0,
      duration: 0.35,
      ease: 'power2.out'
    });
  }

  function updatePreviewRect(rect, tiltX, tiltY, tiltZ, mouseVelX, mouseVelY) {
    currentRect.left = rect.left;
    currentRect.top = rect.top;
    currentRect.width = rect.width;
    currentRect.height = rect.height;

    if (tiltX !== undefined) mesh.rotation.x = THREE.MathUtils.degToRad(tiltX);
    if (tiltY !== undefined) mesh.rotation.y = THREE.MathUtils.degToRad(tiltY);
    if (tiltZ !== undefined) mesh.rotation.z = THREE.MathUtils.degToRad(tiltZ);

    if (mouseVelX !== undefined && mouseVelY !== undefined) {
      // Scale velocity to a balanced range for shader distortion
      material.uniforms.uMouseVelocity.value.set(mouseVelX * 0.04, mouseVelY * 0.04);
    }
  }

  function hidePreview() {
    gsap.killTweensOf(material.uniforms.uOpacity);
    gsap.to(material.uniforms.uOpacity, {
      value: 0.0,
      duration: 0.35,
      ease: 'power2.out',
      onComplete: () => {
        isHoverActive = false;
        if (!isMorphing) {
          mesh.visible = false;
          mesh.rotation.set(0, 0, 0);
          renderer.render(scene, camera); // Force clear the canvas since render loop will pause
        }
      }
    });
  }

  // ── Morph API ──
  function morphTo(startRect, targetRect, texturePath, onComplete) {
    isMorphing = true;
    isHoverActive = false; // Turn off hover tracking
    if (!animId) animate();

    canvas.className = 'works-webgl-canvas';
    canvas.style.zIndex = '501';

    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = 2 * Math.atan(h / (2 * Z_DEPTH)) * (180 / Math.PI);
    camera.updateProjectionMatrix();

    // Reset mesh rotation for flat morph
    mesh.rotation.set(0, 0, 0);

    // Assign texture and natural aspect ratio
    const tex = textures[texturePath];
    if (tex) material.uniforms.uTexture.value = tex;
    material.uniforms.uImageAspect.value = imageAspects[texturePath] || 1.0;

    // Set initial aspect ratio from start rect
    material.uniforms.uContainerAspect.value = startRect.width / startRect.height;

    // Set initial coordinates
    currentRect.left = startRect.left;
    currentRect.top = startRect.top;
    currentRect.width = startRect.width;
    currentRect.height = startRect.height;

    material.uniforms.uTransition.value = 0.0;
    material.uniforms.uOpacity.value = 1.0; // Keep fully opaque during morph transition
    mesh.visible = true;

    // Animate position/size
    gsap.killTweensOf(currentRect);
    gsap.to(currentRect, {
      left: targetRect.left,
      top: targetRect.top,
      width: targetRect.width,
      height: targetRect.height,
      duration: 1.2,
      ease: 'expo.out'
    });

    // Animate liquid transition
    gsap.killTweensOf(material.uniforms.uTransition);
    gsap.to(material.uniforms.uTransition, {
      value: 1.0,
      duration: 1.2,
      ease: 'expo.out',
      onComplete: () => {
        isMorphing = false;
        mesh.visible = false;
        renderer.render(scene, camera); // Force clear the canvas since render loop will pause
        canvas.style.zIndex = '90';
        if (onComplete) onComplete();
      }
    });
  }

  function getCurrentRect() {
    return { ...currentRect };
  }

  function reset() {
    isMorphing = false;
    isHoverActive = false;
    gsap.killTweensOf(currentRect);
    gsap.killTweensOf(material.uniforms.uTransition);
    gsap.killTweensOf(material.uniforms.uOpacity);
    mesh.visible = false;
    renderer.render(scene, camera);
    canvas.style.zIndex = '90';
  }

  window.__worksWebGL = { showPreview, updatePreviewRect, hidePreview, morphTo, getCurrentRect, reset, isActive: true };
  document.body.classList.add('webgl-active');
  console.log('[Works WebGL] Full preview & transition renderer initialized successfully.');
})();
