import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

(async function() {
  const canvas = document.getElementById('heroCrystalCanvas');
  if (!canvas) return;

  const container = document.getElementById('home');
  if (!container) return;

  let scene, camera, renderer;
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
      alpha: true,              // Crucial: keep canvas background transparent
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15; // Clean, natural exposure

    scene.add(crystalGroup);

    // Standard high-end lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 8, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd6ff3e, 0.8);
    dirLight2.position.set(-5, -4, 2);
    scene.add(dirLight2);

    // Subtle blue point light for glass refraction color depth
    const ptLight = new THREE.PointLight(0x1756fd, 2.5, 10);
    ptLight.position.set(-2, 1, 2);
    scene.add(ptLight);
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
        // Desktop: Align right side
        crystalMesh.position.x = 1.35;
        crystalMesh.position.y = 0.0;
        crystalMesh.scale.setScalar(fitScale * 0.95);
      } else {
        // Mobile: Align center-bottom, scaled down
        crystalMesh.position.x = 0.0;
        crystalMesh.position.y = -1.15;
        crystalMesh.scale.setScalar(fitScale * 0.65);
      }
    }
  }

  // Load GLTF Model & EXR Environment
  async function loadAssets() {
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileCubemapShader();

    // 1. Load EXR Environment Map for realistic glossy reflections and transmission refractions
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

      // Bounding box auto scaling
      const box = new THREE.Box3();
      gltf.scene.traverse(c => { if (c.isMesh) box.expandByObject(c); });
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      fitScale = maxDim > 0.001 ? 1.6 / maxDim : 1;
      const center = box.getCenter(new THREE.Vector3());

      const crystalSubGroup = new THREE.Group();

      gltf.scene.traverse(function(child) {
        if (!child.isMesh) return;
        
        child.geometry.computeVertexNormals();

        // 100% physically correct crystal glass material setup
        const mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.01,
          roughness: 0.01,              // Extremely smooth polished glass
          ior: 1.58,                    // High-refractive-index flint glass
          transmission: 0.96,           // Keep transmission high; in standard renderer, alpha blends correctly!
          thickness: 2.0,               // Thickness for light refraction warp
          envMap: envTexture,
          envMapIntensity: 2.2,         // High-contrast shiny reflection from real environment map
          specularIntensity: 1.0,
          specularColor: new THREE.Color(0xffffff),
          dispersion: 0.88,             // High Abbe chromatic dispersion (物理彩虹阿贝色散)
          side: THREE.DoubleSide,
          transparent: true
        });

        const mesh = new THREE.Mesh(child.geometry, mat);
        crystalSubGroup.add(mesh);
      });

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

    mouseX += (targetMouseX - mouseX) * 0.06;
    mouseY += (targetMouseY - mouseY) * 0.06;
    scrollY += (targetScrollY - scrollY) * 0.08;

    if (crystalMesh) {
      crystalMesh.rotation.y += dt * 0.16;
      crystalMesh.rotation.z += dt * 0.06;

      crystalGroup.position.x = -mouseX * 0.28;
      crystalGroup.position.y = mouseY * 0.28 - scrollY * 0.0055;

      crystalGroup.rotation.x = mouseY * 0.16;
      crystalGroup.rotation.y = mouseX * 0.16;
    }

    renderer.render(scene, camera);
  }

  init();
  await loadAssets();
  window.addEventListener('resize', resize);
  requestAnimationFrame(animate);
})();
