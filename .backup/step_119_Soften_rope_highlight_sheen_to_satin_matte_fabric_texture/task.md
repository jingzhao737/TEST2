# WebGL Works Preview & Transition Shader Tasklist

- `[x]` **WebGL Canvas & Core Setup**
  - Add transparent overlay `<canvas id="worksWebGLCanvas">` in `index.html`.
  - Create `js/modules/webgl-preview.js` to set up Three.js scene, perspective camera, and WebGLRenderer.
  - Implement dynamic window resizing and DOM coordinates mapping helper.
- `[x]` **Texture Loading & Shader Materials**
  - Pre-load all 4 work preview images as Three.js textures.
  - Compile custom `ShaderMaterial` with vertex shader (Y-axis scroll bend) and fragment shader (RGB color split + simplex noise).
  - Implement "Shader Warm-up" in `loader.js` (render dummy plane on startup) to prevent transition freeze.
- `[x]` **DOM Tracking & Physics Sync**
  - Set up animation loop tracking the DOM `.work-preview-wrapper` bounding box.
  - Listen to mouse speed and window scroll velocity in `premium-interactions.js` using LERP damping.
  - Connect and update physical variables (`uVelocity`, `uMeshVelocity`, `uRGBShift`) in WebGL material uniforms.
- `[x]` **Seamless WebGL Morph Transition**
  - Integrate transition triggers in `hash-router.js` for `openDetail` and `closeDetail`.
  - Animate WebGL plane position, scale, and `uTransition` uniform to full screen on card selection.
  - Hand over rendering smoothly to the detail page's actual DOM once transition completes.
- `[x]` **Resource Lifecycle & Mobile Fallback**
  - Implement `IntersectionObserver` to toggle rendering loops based on Works visibility.
  - Implement mobile checks to disable WebGL canvas and fallback to native CSS transform rendering.

- `[x]` **Works Hover Jitter Bug Fix**
  - `[x]` Implement static `.work-list-sensors` overlay in `premium-interactions.js`.
  - `[x]` Sync sensor heights with `.work-card` heights dynamically on init and window resize.
  - `[x]` Forward click events from `.card-sensor` to `.work-card`.
  - `[x]` Add `.hovered` class to `.work-card` on `.card-sensor` hover in JS.
  - `[x]` Update `cursor.js` to recognize `.card-sensor` for `isArrowHovered`.
  - `[x]` Update `styles.css` to add `.work-card.hovered` styles parallel to `.work-card:hover`.
  - `[x]` Verify layout correctness and fix the hover loop.

- `[x]` **详情大图与卡片同步滑入转场优化 (Bypassing WebGL Morph / Card-Aligned Image Reveal)**
  - `[x]` 停用 WebGL 形变（Morph）转场动画以满足用户关于“大图跟着出现的卡片一同出现”的要求。
  - `[x]` 详情大图转由 DOM 方式随详情卡片同步滑入，实现平滑的视差滑动位移。
  - `[x]` 运行 Playwright 对点击详情、同步滑入转场以及关闭详情的过程进行逐帧抓取和截图测试验证。
  - `[x]` 提交并推送至 GitHub 并自动触发部署发布。

