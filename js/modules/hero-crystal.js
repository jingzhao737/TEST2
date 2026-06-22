import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ═══ Anamorphic Streak & Lens Flare Shader ═══
const LensFlareShader = {
  uniforms: {
    tDiffuse: { value: null },
    tBloom:   { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    intensity:  { value: 1.2 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float intensity;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 dir = normalize(uv - center);

      // ── Ghost artifacts ──
      vec4 flare = vec4(0.0);
      float ghostCount = 6.0;

      for (float i = 1.0; i <= 6.0; i += 1.0) {
        float offset = i / ghostCount;
        float falloff = pow(1.0 - offset, 3.0);
        vec2 ghostUv = uv - dir * offset * 0.35;

        if (ghostUv.x < 0.0 || ghostUv.x > 1.0 ||
            ghostUv.y < 0.0 || ghostUv.y > 1.0) continue;

        vec4 ghost = texture2D(tDiffuse, ghostUv);
        float ghostBright = dot(ghost.rgb, vec3(0.2126, 0.7152, 0.0722));

        // Prismatic color shift
        vec3 tint = vec3(1.0);
        if (i == 1.0) tint = vec3(0.9, 0.3, 0.1);
        if (i == 2.0) tint = vec3(0.2, 0.5, 0.9);
        if (i == 3.0) tint = vec3(0.3, 0.9, 0.2);
        if (i == 4.0) tint = vec3(0.9, 0.2, 0.7);
        if (i == 5.0) tint = vec3(0.7, 0.5, 0.2);
        if (i == 6.0) tint = vec3(1.0, 0.8, 0.4);

        float sizeFalloff = 1.0 - offset * 0.5;
        float ghostWeight = ghostBright * falloff * 0.25 * sizeFalloff;
        flare.rgb += ghost.rgb * tint * ghostWeight;

        // Chroma shift on ghosts
        float chroma = 0.04 * offset;
        vec2 rUv = ghostUv + dir * chroma * 0.5;
        vec2 bUv = ghostUv - dir * chroma * 0.3;
        float rSample = texture2D(tDiffuse, rUv).r;
        float bSample = texture2D(tDiffuse, bUv).b;
        flare.r += rSample * ghostWeight * 0.3;
        flare.b += bSample * ghostWeight * 0.3;
      }

      // ── Halo ring ──
      float haloDist = length(uv - center);
      float halo = smoothstep(0.07, 0.35, haloDist) * (1.0 - smoothstep(0.35, 0.55, haloDist));
      vec2 haloUv = uv - dir * 0.12;
      vec4 haloColor = texture2D(tDiffuse, haloUv);
      float haloBright = dot(haloColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      flare.rgb += haloColor.rgb * vec3(0.6, 0.3, 0.8) * halo * haloBright * 0.15;

      // ── Anamorphic streak (Horizontal flare lines) ──
      vec2 texel = 1.0 / resolution;
      vec3 streak = vec3(0.0);
      for (float i = -15.0; i <= 15.0; i += 1.0) {
        float t = i / 15.0;
        vec2 offset = vec2(t * texel.x * 4.0, t * texel.y * 1.0); // Streaks horizontally
        vec4 s = texture2D(tDiffuse, uv + offset);
        float b = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
        float w = exp(-abs(t) * 2.5);
        streak += s.rgb * b * w * 0.10;
      }

      // ── Composite ──
      vec3 result = color.rgb + flare.rgb * intensity + streak * intensity * 0.6;

      // Subtle tone map to prevent blowout
      result = result / (result + 1.0);

      gl_FragColor = vec4(result, color.a);
    }
  `
};

(async function() {
  const canvas = document.getElementById('heroCrystalCanvas');
  if (!canvas) return;

  const container = document.getElementById('home');
  if (!container) return;

  let scene, camera, renderer, composer;
  let bloomPass, lensFlarePass;
  let crystalGroup = new THREE.Group();
  let crystalMesh = null;
  let fitScale = 1;

  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let scrollY = 0, targetScrollY = 0;

  function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 0, 8);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,              // Keep canvas transparent to see HTML background
      antialias: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: false // Prevent black fringe around glowing transparent edges
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    scene.add(crystalGroup);

    // ═══ Post Processing with Transparency Support ═══
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    // HalfFloatType RenderTarget to store high intensity HDR highlights for Bloom, while keeping RGBA format for alpha transparency
    const renderTarget = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace
    });
    
    composer = new EffectComposer(renderer, renderTarget);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.35,  // strength
      0.25,  // radius
      0.45   // threshold
    );
    composer.addPass(bloomPass);

    lensFlarePass = new ShaderPass(LensFlareShader);
    lensFlarePass.uniforms['resolution'].value.set(w, h);
    lensFlarePass.uniforms['intensity'].value = 1.4;
    lensFlarePass.renderToScreen = true;
    composer.addPass(lensFlarePass);

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(6, 10, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd6ff3e, 1.2);
    dirLight2.position.set(-6, -4, 2);
    scene.add(dirLight2);

    // Subtle blue point light for glass refraction color depth
    const ptLight = new THREE.PointLight(0x1756fd, 3.5, 12);
    ptLight.position.set(-2, 1, 2);
    scene.add(ptLight);
  }

  // Handle responsiveness and layout offsets
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (w === 0 || h === 0) return;

    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
    lensFlarePass.uniforms['resolution'].value.set(w, h);
    
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    if (crystalMesh) {
      if (w >= 1024) {
        // Desktop positioning: Align to the right side of the screen
        crystalMesh.position.x = 1.35;
        crystalMesh.position.y = 0.0;
        crystalMesh.scale.setScalar(fitScale * 0.95);
      } else {
        // Mobile positioning: Align center-bottom, scaled down
        crystalMesh.position.x = 0.0;
        crystalMesh.position.y = -1.15;
        crystalMesh.scale.setScalar(fitScale * 0.65);
      }
    }
  }

  // Load GLTF Model & EXR Environment
  async function loadAssets() {
    // 1. Load EXR Environment Map for refraction source
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileCubemapShader();

    const exrLoader = new EXRLoader();
    const envTexture = await new Promise((resolve, reject) => {
      exrLoader.load('images/exr/field_02k.exr', (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.colorSpace = THREE.LinearSRGBColorSpace;
        const env = pmremGen.fromEquirectangular(tex).texture;
        resolve(env);
      }, undefined, reject);
    }).catch(err => {
      console.warn("Failed to load EXR env map:", err);
      return null;
    });

    if (envTexture) {
      scene.environment = envTexture;
    }

    // 2. Load Model
    try {
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load('model/Model1.glb', resolve, undefined, reject);
      });

      // Calculate bounding box for auto-scaling
      const box = new THREE.Box3();
      gltf.scene.traverse(c => { if (c.isMesh) box.expandByObject(c); });
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Scale target height to 1.6 units in perspective space
      fitScale = maxDim > 0.001 ? 1.6 / maxDim : 1;
      const center = box.getCenter(new THREE.Vector3());

      const crystalSubGroup = new THREE.Group();

      gltf.scene.traverse(function(child) {
        if (!child.isMesh) return;
        
        // Re-generate vertex normals for glossy fluid-like specular reflections
        child.geometry.computeVertexNormals();

        const mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.02,
          roughness: 0.02,              // Highly polished glass
          ior: 1.58,                    // High-refractive-index flint glass
          transmission: 0.98,           // Maximum physical transparency
          thickness: 3.0,               // Generous physical thickness for refractive warping
          envMap: envTexture,
          envMapIntensity: 3.8,         // Exaggerated environment highlight
          specularIntensity: 1.0,
          specularColor: new THREE.Color(0xffffff),
          dispersion: 0.85,             // Extreme Abbe chromatic dispersion (物理彩虹阿贝色散)
          side: THREE.DoubleSide,
          transparent: true
        });

        const mesh = new THREE.Mesh(child.geometry, mat);
        crystalSubGroup.add(mesh);
      });

      // Align geometry local center to (0,0,0)
      crystalSubGroup.position.set(-center.x, -center.y, -center.z);
      
      crystalMesh = new THREE.Group();
      crystalMesh.add(crystalSubGroup);
      crystalGroup.add(crystalMesh);

      resize();
    } catch (e) {
      console.warn("Failed to load hero 3D model:", e);
    }
  }

  // Mouse move listener
  window.addEventListener('mousemove', function(e) {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Scroll listener
  window.addEventListener('scroll', function() {
    targetScrollY = window.scrollY;
  }, { passive: true });

  // IntersectionObserver to pause rendering when scrolled out
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(container);
  }

  let lastTime = performance.now();

  function animate(ts) {
    requestAnimationFrame(animate);
    if (!visible) return;

    const dt = Math.min((ts - lastTime) / 1000, 0.1);
    lastTime = ts;

    // Smooth lerping of parallax variables
    mouseX += (targetMouseX - mouseX) * 0.06;
    mouseY += (targetMouseY - mouseY) * 0.06;
    scrollY += (targetScrollY - scrollY) * 0.08;

    if (crystalMesh) {
      // 1. Slow, high-end automatic spin
      crystalMesh.rotation.y += dt * 0.16;
      crystalMesh.rotation.z += dt * 0.06;

      // 2. Front-layer parallax shift & tilt
      crystalGroup.position.x = -mouseX * 0.28;
      crystalGroup.position.y = mouseY * 0.28 - scrollY * 0.0055;

      crystalGroup.rotation.x = mouseY * 0.16;
      crystalGroup.rotation.y = mouseX * 0.16;
    }

    composer.render();
  }

  init();
  await loadAssets();
  window.addEventListener('resize', resize);
  requestAnimationFrame(animate);
})();
