# WebGL 交互重构与无缝转场升级方案（高阶优化版）

本方案在上一版基础上进行了深度优化，重点引入了**液态噪波过渡、着色器预编译（防止首次卡顿）、弹性惯性跟踪与完善的内存管理**。

---

## 升级目标：WebGL 底层预览与滚动着色器

我们将 Selected Works 的 hover 预览层和滚动变形机制从 DOM 彻底重构为 **WebGL (Three.js Plane) 渲染管线**：

1. **全局 WebGL 预览画布**：在 Works 区域上方覆盖一个透明的 WebGL Canvas。
2. **DOM 坐标投影同步**：使用 `getBoundingClientRect()` 跟踪 DOM 容器的物理尺寸和滚动坐标，实时同步 WebGL 中的平面几何体（PlaneGeometry）。
3. **GLSL 顶点着色器弹性弯曲（Vertex Shader Scroll Warp）**：利用滚动速度（uVelocity）在顶点着色器中对平面网格进行 Y 轴正弦弯曲，加入 LERP 缓动，使图像产生回弹的物理弹性。
4. **GLSL 片段着色器液态融化与 RGB 色散（Fragment Shader Liquid Melt & RGB Shift）**：在卡片切换或详情页打开时，通过 `uTransition` Uniform 触发基于**辛普森噪波（Simplex Noise）**的液态融化扭曲，伴随 R/G/B 通道色散分离。
5. **WebGL 无缝转场**：点击卡片时，直接在 WebGL 中将平面无缝放大至全屏 Banner，过渡期间伴随液态融化/波动动效。

---

## Proposed Changes (拟议修改)

### Stage 2: WebGL Image Displacement & Scroll Shaders (WebGL 图像变性着色器)

#### [NEW] [webgl-preview.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/webgl-preview.js)
* 创建全局 Works WebGL 渲染系统，主要技术实现细节如下：
  * **Mesh 动态映射**：创建一个占位的 WebGL 平面，材质使用自定义的 `THREE.ShaderMaterial`。
  * **纹理预加载与着色器预编译（Shader Warm-up）**：
    - 在页面 Load 阶段预加载所有作品的高清图，并提前进行 WebGL 材质编译（渲染一次不可见极小 plane）。避免首次 hover/点击转场时由于 GPU 编译着色器导致的微小卡顿（Stutter）。
  * **GLSL 顶点着色器 (Vertex Shader)**:
    ```glsl
    uniform float uVelocity;
    uniform float uMeshVelocity;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      // 顶点根据滚动速度在 Y 轴产生弯曲形变
      pos.y += sin(uv.x * 3.14159) * uVelocity * 0.12;
      // 顶点根据鼠标移动速度在 X/Y 轴产生轻微扭曲
      pos.x += sin(uv.y * 3.14159) * uMeshVelocity * 0.08;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
    ```
  * **GLSL 片段着色器 (Fragment Shader)**:
    ```glsl
    uniform sampler2D uTexture;
    uniform float uRGBShift;
    uniform float uTransition; // 0.0 -> 1.0 展开过渡值
    varying vec2 vUv;

    // 简单噪波函数，生成液态波动
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                 mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
    }

    void main() {
      vec2 uv = vUv;
      
      // 融合液态噪波扭曲
      float n = noise(uv * 10.0) * 0.05 * uTransition;
      uv.x += n;
      uv.y += n;

      // RGB 色散分离
      float shift = (uRGBShift + uTransition * 2.0) * 0.015;
      vec4 r = texture2D(uTexture, uv + vec2(shift, 0.0));
      vec4 g = texture2D(uTexture, uv);
      vec4 b = texture2D(uTexture, uv - vec2(shift, 0.0));
      vec4 texColor = vec4(r.r, g.g, b.b, 1.0);
      
      gl_FragColor = texColor;
    }
    ```

#### [MODIFY] [premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js)
* 禁用原有的 DOM-based `.work-preview-wrapper` 和 CSS/GSAP 属性变形。
* 计算滚动速度与鼠标移动差值，采用 **LERP (线性插值插补法)** 缓动，将平滑的物理数值输入 WebGL 材质。

#### [MODIFY] [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js)
* 将转场动画桥接到 WebGL。当点击作品卡片时：
  1. 激活 WebGL canvas，将 Plane 网格置于卡片缩略图完全重合的屏幕位置。
  2. 动画开始：利用 GSAP 驱动 `uTransition` 从 `0` 变至 `1`，同时让 WebGL 平面网格平滑放大覆盖视口。
  3. 动画结束：详情页 DOM 展现，WebGL Canvas 自动暂停渲染并隐藏，最大化释放 CPU 资源。

---

## 更好建议与架构优化策略

1. **资源动态释放与销毁（Memory / Performance Lifecycle）**：
   - 每次详情页打开并完成转场后，必须彻底暂停 Works WebGL canvas 的 render loop；关闭详情页时，恢复 render 并在退出动画结束后再次暂停。
   - 所有 Three.js 资源在非必要时停止 GPU 运算，保证下方 `#ice` 三维水晶部分以 120 FPS 满帧渲染。
2. **移动端智能回退（Mobile Fallback）**：
   - 移动端自动退回到现有的 CSS 滚动变形与平滑滑动方案（目前已验证完美且流畅），而 PC 端采用极致的 WebGL 物理质感形变。
3. **保留 Vanilla JS 架构**：
   - **强烈建议不要引入 React 等重型框架**。当前的 Vanilla JS + Vite 架构具有极低的打包体积（JS 编译产物极小），且完全不受 React 虚拟 DOM 对 Canvas 声明周期干扰，极其有利于写纯粹的 WebGL 底层着色器。

---

## Verification Plan (验证计划)

### 自动化验证
* **FPS 性能监控**：在开启 WebGL image displacement 时，执行模拟滚动测试，确保帧率保持在 60fps/120fps。
* **内存泄露检测**：反复触发 open/close 详情页，检查 Three.js Texture 与 Geometry 是否正确 `dispose()`，避免 GPU 内存暴涨。

### 手动测试
* 检查鼠标 hover 各个卡片时，悬浮图是否具有丝滑的液体波纹及 RGB 抖动效果。
* 检查在快速滚动时，预览图是否有向后拉伸的惯性弯曲效果。
* 检查转场进入详情页时，是否有液态扩张的放大效果，且无任何闪烁白屏。
