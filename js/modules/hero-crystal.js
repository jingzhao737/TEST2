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

  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let scrollY = 0, targetScrollY = 0;

  // 1. Generate gradient envMap for crystal reflection
  function createCrystalEnvMap() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#ffffff');      // Bright sky reflection
    grad.addColorStop(0.25, '#d6ff3e');   // Bright theme color (Lime green)
    grad.addColorStop(0.48, '#101216');   // Horizon dark band
    grad.addColorStop(0.72, '#1756fd');   // Bright blue reflection
    grad.addColorStop(1, '#08090d');      // Ambient ground
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }

  function init() {
    scene = new THREE.Scene();

    // Perspective camera
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
    renderer.toneMappingExposure = 1.2;

    scene.add(crystalGroup);

    // Light Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    // Subtle blue point light for glass refraction color depth
    const ptLight = new THREE.PointLight(0x1756fd, 2.5, 10);
    ptLight.position.set(-2, 1, 2);
    scene.add(ptLight);
  }

  // Handle responsiveness and positioning
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (w === 0 || h === 0) return;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    if (crystalMesh) {
      if (w >= 1024) {
        // Desktop: Align to the right side of the screen
        crystalMesh.position.x = 1.35;
        crystalMesh.position.y = 0.0;
        crystalMesh.scale.setScalar(fitScale * 0.95);
      } else {
        // Mobile/Tablet: Align to bottom center, scaled down
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

      // Calculate automatic scaling box
      const box = new THREE.Box3();
      gltf.scene.traverse(c => { if (c.isMesh) box.expandByObject(c); });
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      // Target height is 1.6 units in perspective space
      fitScale = maxDim > 0.001 ? 1.6 / maxDim : 1;
      const center = box.getCenter(new THREE.Vector3());

      const crystalSubGroup = new THREE.Group();

      gltf.scene.traverse(function(child) {
        if (!child.isMesh) return;
        
        // Re-generate normals to ensure perfectly smooth reflections
        child.geometry.computeVertexNormals();

        const mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.05,
          roughness: 0.05,
          ior: 1.5,
          transmission: 0.95,
          thickness: 2.5,
          envMap: envMap,
          envMapIntensity: 1.5,
          specularIntensity: 1.0,
          specularColor: new THREE.Color(0xffffff),
          dispersion: 0.5,
          side: THREE.DoubleSide,
          transparent: true
        });

        const mesh = new THREE.Mesh(child.geometry, mat);
        crystalSubGroup.add(mesh);
      });

      // Align model local center
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

    // Smooth lerps for interaction
    mouseX += (targetMouseX - mouseX) * 0.06;
    mouseY += (targetMouseY - mouseY) * 0.06;
    scrollY += (targetScrollY - scrollY) * 0.08;

    if (crystalMesh) {
      // 1. Automatic slow rotation
      crystalMesh.rotation.y += dt * 0.15;
      crystalMesh.rotation.z += dt * 0.08;

      // 2. Mouse Parallax tilt and position offset
      // Moves model opposite to mouse direction
      crystalGroup.position.x = -mouseX * 0.28;
      crystalGroup.position.y = mouseY * 0.28 - scrollY * 0.0055; // Scroll slides model up

      // Rotates model slightly based on mouse
      crystalGroup.rotation.x = mouseY * 0.15;
      crystalGroup.rotation.y = mouseX * 0.15;
    }

    renderer.render(scene, camera);
  }

  init();
  await loadModel();
  window.addEventListener('resize', resize);
  requestAnimationFrame(animate);
})();
