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

- `[x]` **徽标降落星星粒子动效 (Post-Flight Logo Star Particle Animation)**
  - `[x]` 增强 `stars.js` 中 `createSingleRipple` 函数，支持自定义生命周期（`duration`）、扩散半径（`maxRadius`）及跟随指针状态（`isCurrentPress`）。
  - `[x]` 暴露全局方法 `window.triggerLogoStarSplash(x, y)`，触发比鼠标点击存活时间更久（1.5s）且由 3 重波纹叠加的星星涟漪特效。
  - `[x]` 在 `color-console.js` 徽标打开飞行动画结束的 `onComplete` 回调中添加 0.2 秒延迟。
  - `[x]` 获取降落后徽标在屏幕空间的中心坐标并转换为 WebGL 归一化坐标，调用全局方法触发该星星特效。

- `[x]` **徽标降落激光星星爆裂动效与打铁火星化 (Post-Flight Logo Laser Star Burst Animation & Iron Spark Physics)**
  - `[x]` 在 `laser-lines.js` 中将点击产生的激光十字星爆裂函数 `createBurst` 封装并暴露为全局方法 `window.triggerLaserBurst(x, y, isOrange, customLife, customNumSparks)`.
  - `[x]` 在 `color-console.js` 中，控制台打开与关闭动画结束的 0.1s 延迟回调中，除了触发 fluid 涟漪之外，增加触发 `window.triggerLaserBurst` 在徽标落点产生打铁般炫目的激光十字星爆裂特效.
  - `[x]` 优化 `laser-lines.js` 中的粒子物理模拟（增加重力与偏向速度，降低阻力），使其呈现如打铁火花般喷溅、划出弧线并优雅坠落的精细质感。
  - `[x]` 确保普通鼠标点击的星星粒子动画和画角粒子保持原有的无重力、无自旋、高阻尼向上微漂的原生效果不变。
  - `[x]` 进一步微调 Logo 星火物理参数：设置较高的初始喷射速度与向上偏置（`5.0~12.0`），搭配高阻尼（`0.88`）及轻缓重力（`0.08`），实现极速爆开、瞬间缓速并持久缓缓下落的完美 Ease-Out 动效曲线。
  - `[x]` 延长 Logo 降落星火总寿命至 `1800ms`（1.8秒），同时降低阻力衰减参数（由 `0.88` 回调至 `0.93`，重力调至 `0.06`），确保粒子在超长生命周期中能流畅地持续向外滑行扩散，彻底消除收尾处静止静止静止或卡顿感。
  - `[x]` 最终应用户要求，将 Logo 降落触发的星火完全整回和鼠标点击完全一样的星星粒子动画（移除 customLife 和 customNumSparks 自定义属性，使用原生无重力、无自旋、高阻尼向上微漂效果），仅保留 0.1s 的紧凑触发延迟。
  - `[x]` 应用户最新需求设计独立炫酷的“装备锻造成功”爆破动效：在 `laser-lines.js` 中新增并暴露 `window.triggerForgeBurst(x, y)` API，该 API 包含 1 重中心脉冲高亮闪烁光圈（`center-flare`）、2 重彩色扩张 HUD 激波光环（`ripples`）、以及 20~28 颗包含白、金、黄、橙多色混合、自旋闪烁、缓动滑行下坠（寿命达 1.2s~2s）的高能铁花粒子。
  - `[x]` 针对粒子后期“直线下坠”导致的呆板定格感，在粒子物理方程中加入热空气对流扰动（Brownian Motion），提供轻微的横向左右摆动（Sway）与纵向颤动（Flutter），并将重力加速度调至 `0.04`，从而保证粒子在收尾期能如空气中漂浮的余烬般生动滑行。








