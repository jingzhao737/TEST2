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
  - `[x]` 应用户最新优化需求，将锻造粒子动效进一步重构为无重力干扰的“宇宙大爆炸”式纯径向直线扩散：去除向上重力偏置和下落重力（`gravity: 0`），并设置高品质的滑动阻尼（`0.95`），确保所有粒子在 1.2s~2s 的生命周期中，完全保持初始抛射方向，以完美的直线向外匀称扩散、缓缓减速并优雅淡出，完全消除任何向下或向上的漂移感。
  - `[x]` 微调大爆炸粒子动效范围与触发时序：移除 0.1s 的 `setTimeout` 延迟，使爆破动效在 Logo 时间线结束的瞬间即时触发；同时将火花粒子初速度区间降为 `2.5~7.0`，双重激波环的最大半径压缩至 `50px` 和 `80px`，并将火星数量精简到 `12~17` 颗，使动效更紧凑精致。

- `[x]` **修复 stars.js 中的 TDZ（暂存死区）初始化 ReferenceError 错误**
  - `[x]` 解决 `stars.js` 在模块加载时，由于 `initWebGLTextElements` 在声明 `workCardElements` 变量之前就被调用而引发的 `ReferenceError: Cannot access 'workCardElements' before initialization` 运行时报错。
  - `[x]` 将 `webglTextElements`, `workCardElements`, `cachedTextItems`, `cachedCardItems` 的 `let` 声明语句整体移动至 `initWebGLTextElements` 函数 the 定义及调用之前。
  - `[x]` 本地构建与打包（`npx vite build`）校验编译完全通过。
  - `[x]` 运行 `py workflow.py deploy` 命令，将最新修复自动提交并成功推送至 GitHub Pages 线上服务。

- `[x]` **优化 Works 区域滚动与鼠标进入卡顿、掉帧问题 (Optimize Scroll & Hover Entry Performance in Works)**
  - `[x]` **消除强制同步布局 (Remove Forced Reflows)**：从 `premium-interactions.js` 中的 `onListEnter()` 函数里移除 `updateFlatPageCoordinates()`。利用已在页面初始化、`load` 和 `resize` 时算好的页面坐标，彻底避免鼠标滑入卡片区域时频繁切换 3D 旋转所造成的严重页面重排和卡顿。
  - `[x]` **优化 WebGL 文本静态渲染缓存 (Decouple Style Resolution from Geometry mapping)**：将 `stars.js` 的缓存机制重构为静态基础缓存 `cachedTextItemsBase`。使每次坐标更新（`cacheLayoutCoords`）只需获取 `getBoundingClientRect()` 测定位置，不再重复进行开销极高的 `getComputedStyle()` 样式解析以及 `innerHTML`/`textContent` DOM 节点读取。
  - `[x]` **按需上传 WebGL 文本纹理 (Upload Textures on Demand)**：在 `stars.js` 渲染循环中加入滚动状态与文本改变检测。仅在滚动位置发生变化、页面缩放、或切换主题时才重新擦写文本 Canvas 并设置 `textTexture.needsUpdate = true` 上传至 GPU。当页面静止时，文本纹理的 CPU 测绘与 GPU 传输开销降为 0。
  - `[x]` **滚动防抖与间隔调整 (Scroll-Aware Cache Throttle)**：将 `stars.js` 中的坐标定期校准间隔从 1 秒提升至 3 秒，并加入滚动监听器，在用户处于主动滚动期间自动跳过定时校准，避免在滚动时触发布局重算。
  - `[x]` **WebGL 预览渲染循环按需唤醒 (Animate Loop Sleep Mode)**：移除 `webgl-preview.js` 内部的 `IntersectionObserver` 监测。将 animate 循环改为只在卡片悬停 (`isHoverActive`) 或详情页形变过渡 (`isMorphing`) 处于激活状态时运行，未悬停时自动进入休眠，从而彻底释放 Works 区域滚动时的空转渲染消耗。

- `[x]` **临时关闭 VISION (Ice Crystal) 页面模块以排查掉帧问题 (Temporarily Disable VISION Page for Troubleshooting)**
  - `[x]` 在 `index.html` 中为 `<section class="ice-section" id="ice">` 容器及其下方的横向分界线添加 `style="display: none !important;"`，在 DOM 渲染树上完全移除其渲染和布局。
  - `[x]` 在 `index.html` 底部注释掉 `<script type="module" src="ice.js"></script>`，停止该 3D 结晶模块在背景的初始化与 WebGL/Three.js 资源加载。
  - `[x]` 编译生产包并通过 `py workflow.py deploy` 部署至线上。

- `[x]` **深度优化自定义光标（Snapping Cursor）与 3D 悬停环路性能 (Optimize Snapping Cursor & 3D Card Hover loops)**
  - `[x]` **恢复 3D 结晶页面**：将 `index.html` 中 `#ice` 板块、网格线和 `ice.js` 引用全部恢复正常。
  - `[x]` **磁吸坐标静态缓存 (Static Coordinate Snapping Cache)**：重构 `cursor.js` 中的 `updateMagnetTargets`。将所有磁吸目标的 `getBoundingClientRect()` Viewport 视口值与当前 `scroll` 进行相加，转化为不变的**页面文档绝对坐标**。在 `mousemove` 监测和动画循环中直接进行纯数学减法位移计算判定，彻底消除了在移动鼠标时对所有目标重复调用 `getBoundingClientRect()` 造成的 Layout Reflow。
  - `[x]` **彻底消除滚动中的磁吸更新 (Zero DOM operations on Scroll)**：清空 `cursor.js` 中 `scroll` 监听器内的 `updateMagnetTargets()` 查询，使得页面滚动时自定义光标模块对 CPU/DOM 的占用率完美归零。
  - `[x]` **3D 悬停动画按需激活与休眠 (Animate Loop Wake & Sleep)**：重构 `premium-interactions.js` 中的 `animateHover` 循环。移除原本开刷即空转的 IIFE 自执行机制，仅在鼠标划入列表 (`onListEnter`) 时动态开启，在鼠标离开且旋转位置回弹复位后自动切断并停止 `requestAnimationFrame` 调度。
  - `[x]` **预计算三角函数常量 (Precomputed Trigonometric Constants)**：将 `premium-interactions.js` 中卡片 3D 透视投影公式所需的 sines / cosines 三角函数计算移至循环体外静态常量化，省去每帧对 16 个顶点的重复 `Math.sin` 和 `Math.cos` 计算。

- `[x]` **优化 Works 卡片详情页打开与关闭时的掉帧卡顿问题 (Optimize Works Card Detail Open/Close Transitions & Freeze Background WebGL)**
  - `[x]` **动态冻结背景 WebGL 渲染 (On-Demand WebGL Sleep)**：在 `stars.js` 和 `ice.js` 的 `animate()` 循环头部添加拦截判断。在详情页打开（`classList.contains('open')`）或处于路由切换转场（`window.__isRouteTransitioning`）期间，直接返回跳过 WebGL 场景重绘与着色计算，极大释出 GPU 算力供滑入动画使用。
  - `[x]` **避免转场启动重排 (Eliminate Animation Startup Reflow)**：在 `hash-router.js` 的 `openDetail()` 启动段中移除 `__updateMagnetTargets()` 调用，彻底避免在详情卡片动画启动帧触发 DOM 重排。
  - `[x]` **延迟磁吸状态清理 (Defer Magnet Target Updates)**：在 `hash-router.js` 的 `closeDetail()` 中，将 `__updateMagnetTargets()` 调用时序调整至 `display: none` 和 `visibility: hidden` 之后，确保光标磁吸计算能精准剔除隐藏的关闭按钮。
  - `[x]` **开启 Compositor 图层硬件加速 (GPU Layer Promotion)**：在 `styles.css` 中为 `.work-card` 与 `.work-detail-card` 显式设置 `will-change: transform, opacity;`，使其被强制提升至独立合成器图层，彻底规避滚动 and 转场期间的大面积重绘。
  - `[x]` **遮罩改用纯色实底并移除毛玻璃滤镜 (Opaque Solid Backdrop & Zero Blur Overhead)**：在 [styles.css](file:///D:/webprojext/styles.css) 中，将 `.work-detail-bg` 的背景色由半透明黑 `rgba(0,0,0,0.65)` 替换为纯黑色 `#000`（浅色模式下替换为 `#f5f0e8`），并彻底删除 `backdrop-filter: blur(12px)`。当遮罩层完全不透明时，可激活浏览器的不透明度遮挡优化（Occlusion Culling/Overdraw Avoidance），彻底停止渲染底部的整个主页 DOM 树与 Canvas；同时彻底免除了耗费极高 GPU 算力的毛玻璃计算，彻底消除卡顿。
  - `[x]` **移除背景过渡 Transition 冲突 (Remove CSS transition on Backdrop)**：移除 `.work-detail-bg` 上的 CSS 混合过渡，完全将淡入淡出动画控制权移交给 GSAP，彻底避免双重插值冲突。
  - `[x]` **关闭详情时背景提前恢复 (Pre-emptive WebGL Background Recovery)**：优化 [stars.js](file:///D:/webprojext/js/modules/stars.js) 和 [ice.js](file:///D:/webprojext/ice.js) 的暂停渲染判断，增加 `window.__isDetailClosing` 判断免除。在卡片一开始下滑退场时即立刻恢复背景星空与 3D 结晶的动画循环，而不是等待 0.65s 动画全部结束后才激活，消除了背景静态定格突然跳转的突兀感。
  - `[x]` **加速实底遮罩淡出 (Fast Backdrop Fade-out)**：在 `hash-router.js` 中将遮罩淡出时长由 `0.6s` 缩短至 `0.4s`（缓动改为 `power2.out`），使黑色遮罩能迅速清除，让已提前恢复动画的活动背景与下滑卡片衔接得行云流水。




