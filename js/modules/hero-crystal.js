import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

(async function() {
  const canvas = document.getElementById('heroCrystalCanvas');
  if (!canvas) return;

  const container = document.getElementById('home');
  if (!container) return;

  let scene, camera, renderer;
  let crystalGroup = new THREE.Group();
  let crystalMesh = null;
  let fitScale = 1;

  // Parallax elements
  let starsParticle = null;
  let backGlowMesh = null;

  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let scrollY = 0, targetScrollY = 0;

  // 1. Generate high-contrast gradient envMap for sharp crystal reflections
  function createCrystalEnvMap() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#ffffff');      // Bright sky reflection
    grad.addColorStop(0.28, '#d6ff3e');   // Accent tone (Lime)
    grad.addColorStop(0.48, '#0b0c10');   // Horizon dark gap
    grad.addColorStop(0.75, '#1756fd');   // Secondary tone (Blue)
    grad.addColorStop(1, '#1a1f2e');      // Warm ambient base
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }

  // 2. Generate a custom gradient texture for the background glow
  function createGlowTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 5, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');     // Central pure white hot spot
    grad.addColorStop(0.25, 'rgba(214, 255, 62, 0.95)');   // Lime green core
    grad.addColorStop(0.55, 'rgba(23, 86, 253, 0.75)');    // Intense blue ring
    grad.addColorStop(0.80, 'rgba(15, 20, 35, 0.28)');     // Dark purple border
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');              // Transparent fade out
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 3. Create bright background stars to pass through and scatter inside the crystal
  function addBackgroundStars() {
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Color definitions matching the presets
    const colorLime = new THREE.Color(0xd6ff3e);
    const colorBlue = new THREE.Color(0x1756fd);
    const colorWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      // Scatter in a cylindrical column directly behind the crystal (Z offset is -4 to -0.5)
      const theta = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2.0;
      pos[i * 3]     = Math.cos(theta) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 2] = -4.0 + Math.random() * 3.5;

      // Distribute colors: 45% Lime, 45% Blue, 10% White
      const rand = Math.random();
      let chosenColor = colorWhite;
      if (rand < 0.45) {
        chosenColor = colorLime;
      } else if (rand < 0.90) {
        chosenColor = colorBlue;
      }

      colors[i * 3]     = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom textured points to prevent square particle borders
    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    starsParticle = new THREE.Points(geo, mat);
    crystalGroup.add(starsParticle);
  }

  function init() {
    scene = new THREE.Scene();

    // Perspective camera Setup
    camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 0, 8);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35; // Brighten overall tone mapping for crystal luminosity

    scene.add(crystalGroup);

    // Setup background stars first so they sit behind the model in rendering
    addBackgroundStars();

    // Setup background gradient nebula plane at z = -2.5
    const glowTex = createGlowTexture();
    const glowGeom = new THREE.PlaneGeometry(3.5, 3.5);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    backGlowMesh = new THREE.Mesh(glowGeom, glowMat);
    backGlowMesh.position.set(0, 0, -2.5);
    crystalGroup.add(backGlowMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(6, 10, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd6ff3e, 0.8);
    dirLight2.position.set(-6, -4, 2);
    scene.add(dirLight2);
  }

  // Handle responsiveness and layout offsets
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (w === 0 || h === 0) return;

    renderer.setSize(w, h, false);
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

  // Load GLTF Model
  async function loadModel() {
    const envMap = createCrystalEnvMap();

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
          transmission: 0.96,           // Maximum transparency
          thickness: 2.8,               // Generous physical thickness for refractive warping
          envMap: envMap,
          envMapIntensity: 3.8,         // Exaggerated environment highlight
          specularIntensity: 1.0,
          specularColor: new THREE.Color(0xffffff),
          dispersion: 0.85,             // Extreme Abbe chromatic dispersion (彩虹阿贝分色)
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

    // Animate background elements
    if (starsParticle) {
      starsParticle.rotation.z += dt * 0.04;
      starsParticle.rotation.y += dt * 0.02;
      
      // Foreground-Background multi-layer parallax shift
      starsParticle.position.x = -mouseX * 0.12;
      starsParticle.position.y = mouseY * 0.12 - scrollY * 0.0055;
    }

    if (backGlowMesh) {
      backGlowMesh.rotation.z -= dt * 0.025;
      
      // Nebular radial scale pulse
      const pulse = 1.0 + Math.sin(ts * 0.0012) * 0.05;
      backGlowMesh.scale.set(pulse, pulse, 1);
      
      // Mid-layer parallax shift
      backGlowMesh.position.x = -mouseX * 0.18;
      backGlowMesh.position.y = mouseY * 0.18 - scrollY * 0.0055;
    }

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

    renderer.render(scene, camera);
  }

  init();
  await loadModel();
  window.addEventListener('resize', resize);
  requestAnimationFrame(animate);
})();
