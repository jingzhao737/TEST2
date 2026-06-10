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
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uVelocity;
    uniform float uTransition;
    uniform float uImageAspect;
    uniform float uContainerAspect;
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

      // Liquid noise at transition midpoint
      float wave = uTransition * (1.0 - uTransition);
      if (wave > 0.0) {
        float n = noise(uv * 10.0 + uTransition * 5.0);
        uv += (n - 0.5) * 0.04 * wave;
      }

      // Subtle chromatic aberration
      float shift = abs(uVelocity) * 0.0003 + wave * 0.012;
      vec4 r = texture2D(uTexture, uv + vec2(shift, 0.0));
      vec4 g = texture2D(uTexture, uv);
      vec4 b = texture2D(uTexture, uv - vec2(shift, 0.0));

      gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
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
      uImageAspect: { value: 1.0 },
      uContainerAspect: { value: 1.0 }
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
  let isVisible = false;
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
    if (!isVisible && !isMorphing) return;
    animId = requestAnimationFrame(animate);

    currentScrollVelocity += (scrollVelocity - currentScrollVelocity) * 0.1;
    scrollVelocity *= 0.9;
    material.uniforms.uVelocity.value = gsap.utils.clamp(-25, 25, currentScrollVelocity);

    if (isMorphing) {
      // Update container aspect ratio every frame (changes during morph)
      material.uniforms.uContainerAspect.value = currentRect.width / currentRect.height;

      const mapped = mapDOMToWebGL(currentRect);
      mesh.scale.set(mapped.width, mapped.height, 1);
      mesh.position.set(mapped.x, mapped.y, 0);
      renderer.render(scene, camera);
    }
  }

  canvas.style.display = 'none';

  // IntersectionObserver
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        if (!animId) animate();
      } else if (!isMorphing) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
      }
    });
  }, { threshold: 0.01 });
  observer.observe(worksSection);

  // ── Morph API ──
  function morphTo(startRect, targetRect, texturePath, onComplete) {
    isMorphing = true;
    if (!animId) animate();

    canvas.className = 'works-webgl-canvas';
    canvas.style.display = 'block';
    canvas.style.zIndex = '501';

    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = 2 * Math.atan(h / (2 * Z_DEPTH)) * (180 / Math.PI);
    camera.updateProjectionMatrix();

    // Load texture and set image aspect
    const tex = textures[texturePath];
    if (tex) material.uniforms.uTexture.value = tex;
    material.uniforms.uImageAspect.value = imageAspects[texturePath] || 1.0;

    // Set initial container aspect from start rect
    material.uniforms.uContainerAspect.value = startRect.width / startRect.height;

    // Start coordinates
    currentRect.left = startRect.left;
    currentRect.top = startRect.top;
    currentRect.width = startRect.width;
    currentRect.height = startRect.height;
    material.uniforms.uTransition.value = 0.0;
    mesh.visible = true;

    // Animate position/size
    gsap.killTweensOf(currentRect);
    gsap.to(currentRect, {
      left: targetRect.left,
      top: targetRect.top,
      width: targetRect.width,
      height: targetRect.height,
      duration: 0.9,
      ease: 'power4.inOut'
    });

    // Animate liquid transition
    gsap.killTweensOf(material.uniforms.uTransition);
    gsap.to(material.uniforms.uTransition, {
      value: 1.0,
      duration: 0.9,
      ease: 'power4.inOut',
      onComplete: () => {
        isMorphing = false;
        mesh.visible = false;
        canvas.style.display = 'none';
        if (onComplete) onComplete();
      }
    });
  }

  window.__worksWebGL = { morphTo, isActive: true };
  document.body.classList.add('webgl-active');
  console.log('[Works WebGL] Transition renderer initialized successfully.');
})();
