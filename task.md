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

- `[x]` **优化 Works 卡片详情页打开与关闭时的掉帧卡顿问题 (Optimize Works Card Detail Open/Close Transitions & Keep Background Live)**
  - `[x]` **保持背景 WebGL 渲染持续活跃 (Keep Background WebGL Rendering Active)**：移除 `stars.js` 和 `ice.js` 在 `animate()` 循环中关于 `workDetail` 开启状态及转场的暂停判断，使背景星空与 3D 结晶粒子动画循环在详情页开启及转场期间持续保持活跃与渲染。配合实底不透明背景和无毛玻璃的设计，完全规避了暂停/重启导致的定格与突兀跳变，实现了极致的视觉连续性。
  - `[x]` **避免转场启动重排 (Eliminate Animation Startup Reflow)**：在 `hash-router.js` 的 `openDetail()` 启动段中移除 `__updateMagnetTargets()` 调用，彻底避免在详情卡片动画启动帧触发 DOM 重排。
  - `[x]` **延迟磁吸状态清理 (Defer Magnet Target Updates)**：在 `hash-router.js` 的 `closeDetail()` 中，将 `__updateMagnetTargets()` 调用时序调整至 `display: none` 和 `visibility: hidden` 之后，确保光标磁吸计算能精准剔除隐藏的关闭按钮。
  - `[x]` **开启 Compositor 图层硬件加速 (GPU Layer Promotion)**：在 `styles.css` 中为 `.work-card` 与 `.work-detail-card` 显式设置 `will-change: transform, opacity;`，使其被强制提升至独立合成器图层，彻底规避滚动 and 转场期间的大面积重绘。
  - `[x]` **遮罩改用纯色实底并移除毛玻璃滤镜 (Opaque Solid Backdrop & Zero Blur Overhead)**：在 [styles.css](file:///D:/webprojext/styles.css) 中，将 `.work-detail-bg` 的背景色由半透明黑 `rgba(0,0,0,0.65)` 替换为纯黑色 `#000`（浅色模式下替换为 `#f5f0e8`），并彻底删除 `backdrop-filter: blur(12px)`。当遮罩层完全不透明时，可激活浏览器的不透明度遮挡优化（Occlusion Culling/Overdraw Avoidance），彻底停止渲染底部的整个主页 DOM 树与 Canvas；同时彻底免除了耗费极高 GPU 算力的毛玻璃计算，彻底消除卡顿。
  - `[x]` **移除背景过渡 Transition 冲突 (Remove CSS transition on Backdrop)**：移除 `.work-detail-bg` 上的 CSS 混合过渡，完全将淡入淡出动画控制权移交给 GSAP，彻底避免双重插值冲突。
  - `[x]` **加速实底遮罩淡出 (Fast Backdrop Fade-out)**：在 `hash-router.js` 中将遮罩淡出时长由 `0.6s` 缩短至 `0.4s`（缓动改为 `power2.out`），使黑色遮罩能迅速清除，让已提前恢复动画的活动背景与下滑卡片衔接得行云流水。
  - `[x]` **彻底消除主页元素上下瞬移 (Eliminate Layout and Scroll Position Jumps)**：移除了 `openDetail` 中的 `document.body.style.overflow = 'hidden'` 和 `closeDetail` 中的 `document.body.style.overflow = ''` 及 `window.scrollTo`。在 CSS 中将 `.work-detail-bg` 的 `pointer-events` 改为 `auto`，利用全屏 overlay 的事件捕获机制天然阻断主页鼠标滚轮滚动，无需改变 body 溢出模式。这彻底防止了设置 overflow 时浏览器重置滚动视口高度导致的首页大标题等元素上下瞬移，且同时激活了点击背景黑色区域关闭详情卡片的交互。





- `[x]` **调色盘退场与入场对称动画优化 (Symmetric Entrance/Exit Transitions for Color Console)**
  - `[x]` 将退场 Logo 返航飞行动画的时长从 `1.35s` 延长至 `2.7s`，以对齐入场时长。
  - `[x]` 将退场底板的缩回与圆形剪裁蒙版折叠时间从 `0.7s` 延长至 `1.8s`，缓动改为 `'power4.in'`，起始延时设置为 `0.15s`。
  - `[x]` 将退场底板 Opacity 渐隐时间微调为 `0.2s`，起始延时设置为 `1.75s`，精确对齐蒙版完全闭合瞬间。
  - `[x]` 将内部设置子项 Staggered 退场动画时间从 `0.4s` 延长至 `0.8s`，缓动改为 `'power3.in'`，stagger 间距调整为 `0.1s`。
  - `[x]` 修复 `consoleHeader`, `consoleSections`, `consoleActions` 变量在退场代码块中的作用域 bug，将其提至 `else` 顶部进行共享定义。
  - `[x]` 执行本地打包校验，确认生产环境构建 100% 通过且无编译报错。

- `[x]` **调色盘退场与徽标返航动画加速优化 (Accelerate Color Console Exit & Logo Return Transitions)**
  - `[x]` 将退场 Logo 飞行时间缩短至 `1.4s`（原为 `2.7s`），对齐 solid/outline logo 的淡入淡出时序。
  - `[x]` 将底卡剪裁蒙版收拢及 Scale 缩小时间缩短为 `0.9s`，延迟调整为 `0.05s`。
  - `[x]` 将底板 Opacity 渐隐时间缩短为 `0.15s`，延迟调整为 `0.8s`，确保与缩敛终点合拍。
  - `[x]` 将子级元素 stagger 坠退时间缩短为 `0.5s`，stagger 间距改为 `0.06s`，`0s` 即时起跑。
  - `[x]` 编译项目生产环境构建包并推送部署到 GitHub 线上。

- `[x]` **无缝物理打断与退场进一步加速优化 (Seamless Physics Interruption & Additional Exit Speedup)**
  - `[x]` 在模块级引入 `toggleTimeline` 状态变量，用于跟踪 and 杀死当前未完结的动画。
  - `[x]` 重构 `toggleConsole` 开始阶段：若 Logo 正在飞行（`isLogoInBody` 且 timeline 活跃），使用 `logo.getBoundingClientRect()` 测定实时中途坐标。
  - `[x]` 移除 `if (_animating) return;` 阻断逻辑，允许玩家随时进行关闭或打开。
  - `[x]` 重构 `isOpening` 与 `else` 退出块：自动读取当前底板的 `scale`、`opacity` 及 `clip-path` 并将其设为新 Timeline 的渐变起点，实现空中无缝平滑反向飞跃/收敛。
  - `[x]` 将 Logo 退场飞行总时长进一步压缩至 `0.9s`（原为 `1.4s`）。
  - `[x]` 将底卡缩回与蒙版折叠时间缩短为 `0.6s`（延时 `0.05s`），底卡 Opacity 渐隐缩短为 `0.1s`（延时 `0.55s`）。
  - `[x]` 将子项 Staggered 坠退时长压缩至 `0.3s`，stagger 间距改为 `0.04s`。
  - `[x]` 编译项目并在 GitHub 生产环境部署发布。

- `[x]` **修复打断折返时 Logo 晃动与二次膨胀问题 (Fix Logo Interrupted Double-Bulge Shaking Bug)**
  - `[x]` 在 `isOpening` 与 `else` 关闭块测量 `startRect` 时，反向提取 Logo 当前的 `x` 翻译值并计算出 `startBaselineLeft = startRect.left - currentX`。
  - `[x]` 修正 Outline Logo 的初始 GSAP 定位参数，设置为 `left: startBaselineLeft, x: currentX`，保证测量与呈现绝对对齐。
  - `[x]` 重构 Timeline `onUpdate` 阶段：将 `xOffset` 变更为原空中膨胀值的线性插值衰退与全新收敛正弦叠加：`gsap.utils.interpolate(currentX, 0, s) + Math.sin(s * Math.PI) * maxBulge * (isLogoInBody ? 0.3 : 1)`。
  - `[x]` 编译项目并在 GitHub 生产环境部署发布。

- `[x]` **修复打断时 Logo 跳变与折收动画折叠感恢复 (Fix Interruption Jump & Restore Elegant Folding Transition)**
  - `[x]` 在 `else` 关闭分支的首部，将 `logo.style.transform = 'none'` 设为条件执行：仅在 `!isLogoInBody` 时重置 transform，防止清除飞行中的 translate 位移引发瞬间坐标跳变。
  - `[x]` 精简并优化退出曲线：将底框缩敛和圆形蒙版折叠时间调回 `1.0s`（ease 设为 `'power3.inOut'`），恢复圆润收拢的高级折叠动态。
  - `[x]` 将退场 Logo 飞行时间调至 `1.2s`，底板 Opacity 淡出延长至 `0.2s`，设置项坠落缩短为 `0.4s`。
  - `[x]` 编译项目并在 GitHub 生产环境部署发布。
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

- `[x]` **优化 Works 卡片详情页打开与关闭时的掉帧卡顿问题 (Optimize Works Card Detail Open/Close Transitions & Keep Background Live)**
  - `[x]` **保持背景 WebGL 渲染持续活跃 (Keep Background WebGL Rendering Active)**：移除 `stars.js` 和 `ice.js` 在 `animate()` 循环中关于 `workDetail` 开启状态及转场的暂停判断，使背景星空与 3D 结晶粒子动画循环在详情页开启及转场期间持续保持活跃与渲染。配合实底不透明背景和无毛玻璃的设计，完全规避了暂停/重启导致的定格与突兀跳变，实现了极致的视觉连续性。
  - `[x]` **避免转场启动重排 (Eliminate Animation Startup Reflow)**：在 `hash-router.js` 的 `openDetail()` 启动段中移除 `__updateMagnetTargets()` 调用，彻底避免在详情卡片动画启动帧触发 DOM 重排。
  - `[x]` **延迟磁吸状态清理 (Defer Magnet Target Updates)**：在 `hash-router.js` 的 `closeDetail()` 中，将 `__updateMagnetTargets()` 调用时序调整至 `display: none` 和 `visibility: hidden` 之后，确保光标磁吸计算能精准剔除隐藏的关闭按钮。
  - `[x]` **开启 Compositor 图层硬件加速 (GPU Layer Promotion)**：在 `styles.css` 中为 `.work-card` 与 `.work-detail-card` 显式设置 `will-change: transform, opacity;`，使其被强制提升至独立合成器图层，彻底规避滚动 and 转场期间的大面积重绘。
  - `[x]` **遮罩改用纯色实底并移除毛玻璃滤镜 (Opaque Solid Backdrop & Zero Blur Overhead)**：在 [styles.css](file:///D:/webprojext/styles.css) 中，将 `.work-detail-bg` 的背景色由半透明黑 `rgba(0,0,0,0.65)` 替换为纯黑色 `#000`（浅色模式下替换为 `#f5f0e8`），并彻底删除 `backdrop-filter: blur(12px)`。当遮罩层完全不透明时，可激活浏览器的不透明度遮挡优化（Occlusion Culling/Overdraw Avoidance），彻底停止渲染底部的整个主页 DOM 树与 Canvas；同时彻底免除了耗费极高 GPU 算力的毛玻璃计算，彻底消除卡顿。
  - `[x]` **移除背景过渡 Transition 冲突 (Remove CSS transition on Backdrop)**：移除 `.work-detail-bg` 的 CSS 混合过渡，完全将淡入淡出动画控制权移交给 GSAP，彻底避免双重插值冲突。
  - `[x]` **加速实底遮罩淡出 (Fast Backdrop Fade-out)**：在 `hash-router.js` 中将遮罩淡出时长由 `0.6s` 缩短至 `0.4s`（缓动改为 `power2.out`），使黑色遮罩能迅速清除，让已提前恢复动画的活动背景与下滑卡片衔接得行云流水。
  - `[x]` **彻底消除主页元素上下瞬移 (Eliminate Layout and Scroll Position Jumps)**：移除了 `openDetail` 中的 `document.body.style.overflow = 'hidden'` 和 `closeDetail` 中的 `document.body.style.overflow = ''` 及 `window.scrollTo`。在 CSS 中将 `.work-detail-bg` 的 `pointer-events` 改为 `auto`，利用全屏 overlay 的事件捕获机制天然阻断主页鼠标滚轮滚动，无需改变 body 溢出模式。这彻底防止了设置 overflow 时浏览器重置滚动视口高度导致的首页大标题等元素上下瞬移，且同时激活了点击背景黑色区域关闭详情卡片的交互。





- `[x]` **调色盘退场与入场对称动画优化 (Symmetric Entrance/Exit Transitions for Color Console)**
  - `[x]` 将退场 Logo 返航飞行动画的时长从 `1.35s` 延长至 `2.7s`，以对齐入场时长。
  - `[x]` 将退场底板的缩回与圆形剪裁蒙版折叠时间从 `0.7s` 延长至 `1.8s`，缓动改为 `'power4.in'`，起始延时设置为 `0.15s`。
  - `[x]` 将退场底板 Opacity 渐隐时间微调为 `0.2s`，起始延时设置为 `1.75s`，精确对齐蒙版完全闭合瞬间。
  - `[x]` 将内部设置子项 Staggered 退场动画时间从 `0.4s` 延长至 `0.8s`，缓动改为 `'power3.in'`，stagger 间距调整为 `0.1s`。
  - `[x]` 修复 `consoleHeader`, `consoleSections`, `consoleActions` 变量在退场代码块中的作用域 bug，将其提至 `else` 顶部进行共享定义。
  - `[x]` 执行本地打包校验，确认生产环境构建 100% 通过且无编译报错。

- `[x]` **调色盘退场与徽标返航动画加速优化 (Accelerate Color Console Exit & Logo Return Transitions)**
  - `[x]` 将退场 Logo 飞行时间缩短至 `1.4s`（原为 `2.7s`），对齐 solid/outline logo 的淡入淡出时序。
  - `[x]` 将底卡剪裁蒙版收拢及 Scale 缩小时间缩短为 `0.9s`，延迟调整为 `0.05s`。
  - `[x]` 将底板 Opacity 渐隐时间缩短为 `0.15s`，延迟调整为 `0.8s`，确保与缩敛终点合拍。
  - `[x]` 将子级元素 stagger 坠退时间缩短为 `0.5s`，stagger 间距改为 `0.06s`，`0s` 即时起跑。
  - `[x]` 编译项目生产环境构建包并推送部署到 GitHub 线上。

- `[x]` **无缝物理打断与退场进一步加速优化 (Seamless Physics Interruption & Additional Exit Speedup)**
  - `[x]` 在模块级引入 `toggleTimeline` 状态变量，用于跟踪 and 杀死当前未完结的动画。
  - `[x]` 重构 `toggleConsole` 开始阶段：若 Logo 正在飞行（`isLogoInBody` 且 timeline 活跃），使用 `logo.getBoundingClientRect()` 测定实时中途坐标。
  - `[x]` 移除 `if (_animating) return;` 阻断逻辑，允许玩家随时进行关闭或打开。
  - `[x]` 重构 `isOpening` 与 `else` 退出块：自动读取当前底板的 `scale`、`opacity` 及 `clip-path` 并将其设为新 Timeline 的渐变起点，实现空中无缝平滑反向飞跃/收敛。
  - `[x]` 将 Logo 退场飞行总时长进一步压缩至 `0.9s`（原为 `1.4s`）。
  - `[x]` 将底卡缩回与蒙版折叠时间缩短为 `0.6s`（延时 `0.05s`），底卡 Opacity 渐隐缩短为 `0.1s`（延时 `0.55s`）。
  - `[x]` 将子项 Staggered 坠退时长压缩至 `0.3s`，stagger 间距改为 `0.04s`。
  - `[x]` 编译项目并在 GitHub 生产环境部署发布。

- `[x]` **修复打断折返时 Logo 晃动与二次膨胀问题 (Fix Logo Interrupted Double-Bulge Shaking Bug)**
  - `[x]` 在 `isOpening` 与 `else` 关闭块测量 `startRect` 时，反向提取 Logo 当前的 `x` 翻译值并计算出 `startBaselineLeft = startRect.left - currentX`。
  - `[x]` 修正 Outline Logo 的初始 GSAP 定位参数，设置为 `left: startBaselineLeft, x: currentX`，保证测量与呈现绝对对齐。
  - `[x]` 重构 Timeline `onUpdate` 阶段：将 `xOffset` 变更为原空中膨胀值的线性插值衰退与全新收敛正弦叠加：`gsap.utils.interpolate(currentX, 0, s) + Math.sin(s * Math.PI) * maxBulge * (isLogoInBody ? 0.3 : 1)`。
  - `[x]` 编译项目并在 GitHub 生产环境部署发布。

- `[x]` **修复打断时 Logo 跳变与折收动画折叠感恢复 (Fix Interruption Jump & Restore Elegant Folding Transition)**
  - `[x]` 在 `else` 关闭分支的首部，将 `logo.style.transform = 'none'` 设为条件执行：仅在 `!isLogoInBody` 时重置 transform，防止清除飞行中的 translate 位移引发瞬间坐标跳变。
  - `[x]` 精简并优化退出曲线：将底框缩敛和圆形蒙版折叠时间调回 `1.0s`（ease 设为 `'power3.inOut'`），恢复圆润收拢的高级折叠动态。
  - `[x]` 将退场 Logo 飞行时间调至 `1.2s`，底板 Opacity 淡出延长至 `0.2s`，设置项坠落缩短为 `0.4s`。
  - `[x]` 编译项目并在 GitHub 生产环境部署发布。

- `[x]` **修复实心 Logo 在连续打断时滞留的并发竞争 Bug (Fix Concurrent Solid Logo Stuck Bug)**
  - `[x]` 将实心 Logo 的渐隐 and 渐显动画从独立的 `gsap.to` 重构为直接加入 `tl` 动画时间线的 `tl.to`，确保它们成为主飞行进程的一部分。
  - `[x]` 在 `toggleConsole` 重启时，除关闭时间线外，增加 `gsap.killTweensOf(logo)`、`gsap.killTweensOf(staticLogo)` 及 `gsap.killTweensOf(consoleEl)`，完全清除可能存在的后台竞争 Tweens。
  - `[x]` 编译项目并在 GitHub 生产环境部署发布。

- `[x]` **修复调色盘退场剪裁蒙版折叠感视觉差异 (Fix Color Console Exit Folding Animation Easing & Timing)**
  - `[x]` 使用 `gsap.set` 初始化退出状态，确保剪裁蒙版和缩放无缝衔接，无任何跳闪。
  - `[x]` 将底板折缩和圆形蒙版收拢的 Ease 曲线从 `'power3.inOut'` 变更为 `'power3.out'`，实现与入场对称的高敏捷即时折叠视觉回馈。
  - `[x]` 重构底板 Opacity 渐隐逻辑，重叠在 `0.45s~1.05s` 阶段，确保收尾处剪裁蒙版折叠的视觉连续性。
  - `[x]` 确保不修改任何 Logo 返航的飞行坐标及插值计算，彻底规避打断时 Logo 移位与跳变 Bug。
  - `[x]` 编译生产包并通过 `python workflow.py deploy` 部署发布。

- `[x]` **优化调色盘打开时 Logo 出飞 Ease 曲线 (Optimize Color Console Opening Logo Flight Easing)**
  - `[x]` 将出飞曲线由 `'power4.inOut'` 变更为 `'power4.out'`，实现起跑即加速（快10%）、中段匀速前推（中30%）、尾端柔和徐徐降落（慢60%）的完美动力感。
  - `[x]` 编译项目生产环境包并通过 `python workflow.py deploy` 推送部署。

- `[x]` **移除调色盘飞行徽标描边样式并改用纯实心呈现 (Discard Logo Outline Style & Make Flying Logo Solid)**
  - `[x]` 从 `styles.css` 中移除 `#navLogo` 及其不同状态（包括 `:root.light` 和 `.console-active`）的 `color: transparent !important` 与 `-webkit-text-stroke` 描边属性。
  - `[x]` 让飞行中的 Outline Logo（`#navLogo`）自然继承 `.nav-logo` 的实色属性，实现出飞前与落点后实色接力演进。
  - `[x]` 编译打包并推送发布到生产环境。

- `[x]` **解决控制台打开后 Logo 在导航栏原位残留的 specificity 规格冲突 Bug (Fix Specifity Conflict to Correctly Relocate Landing Logo)**
  - `[x]` 将 `styles.css` 中控制台头部 Logo 样式的选择器由 `.color-console-header .nav-logo` 扩充为 `.color-console-header #navLogo, .color-console-header .nav-logo`。
  - `[x]` 提高选择器权重以成功覆盖 `#navLogo` 自带的 `position: fixed !important` 固态导航属性，使 Logo 在完成飞行动作后能够正确切换为 `position: relative !important` 并归入控制台的占位 placeholder 框，彻底解决在导航栏原位留下静态残留的显示 Bug。
  - `[x]` 编译并部署发布至生产环境。

- `[x]` **消除起跑出发时留在原地的淡出重影徽标 (Eliminate Logo Ghosting/Duplication on Departure)**
  - `[x]` 在 `color-console.js` 的出飞设置中，将 `logo` 的初始 `opacity` 设为 `1`（当 `isLogoInBody` 为 false 时直接呈现），并取消原先从 `0` 到 `1` 的 `0.4` 秒淡入过程。
  - `[x]` 重构起跑时间线，将静态徽标 `staticLogo` 的渐隐改为瞬间隐藏（`tl.set(staticLogo, { opacity: 0 }, 0)`），彻底废除原有的缓慢淡出过渡。
  - `[x]` **重要修复**：在出飞瞬间，同步使用 `staticLogo.style.setProperty('transition', 'none', 'important')` 强制剥离其 CSS transition 过渡，彻底阻止浏览器拦截 opacity 的突变行为进行 0.4 秒隐性淡出，并在 `onComplete` 回调中还原，彻底消除肉眼可见的原地重影残留。
  - `[x]` 编译并部署发布至生产环境。

- `[x]` **修复返航着陆结束瞬间徽标短暂“黑闪一下”的重影重置 Bug (Fix Logo Black Out/Flicker After Returning Landing)**
  - `[x]` 发现由于 GSAP 终点执行 `clearProps` 清理 inline style 与同步还原 CSS transition 处于同一浏览器帧中，导致浏览器在计算“清除 inline 属性到继承样式”时，对 transition 进行多余的样式重算，引发一帧的瞬时黑闪（flicker）。
  - `[x]` 重构 `color-console.js` 中打开和关闭动画的 `onComplete` 回调：使用 `requestAnimationFrame` 将 re-enable CSS transitions 的操作延迟至**下一帧**执行。
  - `[x]` 确保在 `clearProps` 动作完成 the 当前帧中，CSS transitions 依然保持 `none !important` 屏蔽状态，从而强制浏览器瞬时稳定渲染至最终样式，彻底根除“黑闪一下”的视觉 Bug。
  - `[x]` 编译并部署发布至生产环境。

- `[x]` **彻底根除返航接近终点时因淡入淡出重叠导致的“暗闪/黑一下”Bug (Replace Closing Crossfade with Instant Swap on Landing)**
  - `[x]` 发现因为飞行的 Outline Logo 与静态的 Solid Logo 均已重构为纯实心展示，当采用原有的渐变交接（0.3s/0.25s 渐显渐隐）时，两层不透明度半透明叠加（例如各 0.5 叠加仅为 0.75 综合不透明度）会导致中途亮度发生物理变暗，产生肉眼可见的“暗闪/黑一下”。
  - `[x]` 移除返航降落时的 `opacity` 渐变动画。在关闭 block 初始化时设定 `staticLogo` 的 `opacity` 为 `0`，让其在飞行中彻底不可见。
  - `[x]` 在返航时间线的终点（`duration` 帧）插入瞬间替换节点 `tl.set(staticLogo, { opacity: 1 }, duration)` 与 `tl.set(logo, { opacity: 0 }, duration)`。
  - `[x]` 确保徽标不透明度始终保持 100% 恒定，完全消除交接时任何中间态的亮度损失，彻底解决暗闪。
  - `[x]` 编译打包并发布部署。

- [x] **优化返航徽标自适应动态追踪，解决滚动“位移闪现” Bug (Dynamic Target Offset Tracking on Return Flight)**
  - [x] 在 `color-console.js` 关闭分支中，于动画开启前同步测算起点坐标与目标静态徽标的初始坐标差 `initialOffsetLeft` 和 `initialOffsetTop`。
  - [x] 将绝对插值重构为相对偏差插值（`currentOffset = interpolate(initialOffset, 0, s)`），然后结合实时获取的 `currentTargetRect` 叠加输出绝对物理位置。
  - [x] 成功编译构建并发布（Commit `b8444ef`），实现不论导航栏因滚动如何位移，Logo 返回均能自适应贴合，零闪现跳变。

- [x] **作品卡片弧线飞入动画 (Works Cards Curved Scroll Entrance Animation)**
  - [x] 移除 `index.html` 中 4 个 `.work-card` 的 `.anim-up` 类，防止其触发默认的淡入上滑。
  - [x] 在 `index.html` 尾部引入新模块 `js/modules/works-entrance.js`。
  - [x] 创建 `js/modules/works-entrance.js` 模块，使用 GSAP `ScrollTrigger` 绑定作品区块 `#work`。
  - [x] 动态计算每个卡片在当前屏幕布局下的绝对页位置与视口左上角的偏移量（处理 resize 重新计算）。
  - [x] 构建由绝对插值和法向 Sine 波动（正弦起伏）合成的抛物线弧度轨迹。
  - [x] 应用大缩放（`scale: 4.5`）、偏角（`-60deg`）以及运动模糊（`blur`）在飞入过程中。
  - [x] Stagger 级联延迟（`0.15s`）有序飞入。
  - [x] 运行编译打包进行校验，并提交发布。

- [x] **作品卡片磨砂玻璃厚度质感增强 (Works Cards Glass Thickness Enhancement)**
  - [x] 修改 `styles.css` 的 `.work-list .work-card` 类，添加 `backdrop-filter: blur(16px)` 和斜切内阴影（双层 inset box-shadow）。
  - [x] 修改 `styles.css` 的 `.work-list .work-card.hovered` 类，在 hover 状态下增强左上角高光并加深/扩散悬浮投影。
  - [x] 调整 `styles.css` 中的 light theme 对抗样式，使其在亮色模式下依然拥有剔透的白玻璃切边质感。
  - [x] 运行 `npx vite build` 重新编译项目并发布。

- [x] **作品卡片内发光与亮度强化 (Works Cards Glass Glow & Brightness Boost)**
  - [x] 修改 `styles.css` 的 `.work-list .work-card` 类，提升背景与边框的亮透明度，并叠加白色软磨砂内发光（`inset 0 0 16px white`）。
  - [x] 修改 `styles.css` 的 `.work-list .work-card.hovered` 类，在 hover 状态下叠加主题色（`accent`）内反射发光（`inset 0 0 20px accent`）并增亮外描边。
  - [x] 运行 `npx vite build` 重新编译项目并发布。

- [x] **作品卡片内发光与亮度极限强化 (Works Cards Glass Glow & Brightness Max-Boost)**
  - [x] 修改 `styles.css` 的 `.work-list .work-card` 类，大幅提升背景（`9%`）、边框（`28%`）以及白色内发光（`24px / 0.12`）和高光切面（`0.35`）。
  - [x] 修改 `styles.css` 的 `.work-list .work-card.hovered` 类，提升背景（`15%`）、边框（`85%`）以及主题色内发光（`32px / 0.28`）和高光切面（`0.55`）。
  - [x] 运行 `npx vite build` 重新编译项目并发布。

- [x] **修复浏览器缩放导致作品卡片消失的 Bug (Fix Works Cards Disappearing on Resize)**
  - [x] 在 `js/modules/works-entrance.js` 中引入 `animationStarted` 和 `animationCompleted` 状态。
  - [x] 优化 `measureCards` 以临时备份并恢复卡片当前的 GSAP 动画样式，仅在未播放过动画时才将 opacity 强制设为 0。
  - [x] 动画完成（`onComplete`）后解绑 window 上的 resize / load 事件监听，避免多余计算并防范隐式样式覆盖。
  - [x] 重新打包编译生产环境包并完成部署。

- [x] **作品卡片大厚玻璃质感极限增强 (Works Cards Real Thick 3D Glass Slab)**
  - [x] 在 `styles.css` 中为 `.work-list .work-card` 引入 3D 转换空间 (`transform: translate3d(0,0,0)`流动状态) 并开启 `transform 0.5s` 平滑过渡。
  - [x] 引入双重斜切内发光（`inset 1px 1px` 与 `inset 2px 2px` 白色高光，`inset -1px -1px` 与 `inset -2px -2px` 黑色暗影），模拟物理厚倒角（chamfered bevels）。
  - [x] 引入双层折射描边，叠加 inner refraction border (`inset 0 0 0 1px`) 与 outer border (`border: 1.5px solid`)。
  - [x] 大幅增强玻璃折射模糊，从 `blur(16px)` 提升至 `blur(28px)`，实现逼真的超厚磨砂玻璃折射效果。
  - [x] 将背景填充升级为斜向镜面渐变 (`linear-gradient(135deg)`)，折射出反光镜面质感。
  - [x] 为 Hover 悬停状态注入物理 3D 浮空高度 (`transform: translate3d(0, 0, 28px) scale(1.02)`)，搭配高悬空超大超软双层投影（`0 35px 80px rgba(0,0,0,0.65)`），让卡片在三维空间浮空突起，玻璃厚度感瞬间拉满。
  - [x] 重新构建并成功推送到生产环境。

- [x] **作品卡片与双层预览图 3D 三维“夹心”层级设计 (Works Cards 3D Layered Sandwich Layout)**
  - [x] 在 `js/modules/premium-interactions.js` 中调整 hover 激活状态下的 3D Z 坐标高度。
  - [x] 将预览图容器 `imgContainer` 的 `imgZ` 从 `15` 提高到 `52`（浮于悬停卡片 Z=28 之上，相差 24px）。
  - [x] 将底色块 `orangeLayer` 的 `orangeZ` 从 `5` 提高到 `10`（藏于悬停卡片 Z=28 之下，相差 18px）。
  - [x] 按比例将橙色层跟随位移计算公式的分母由 `5` 改为 `10`，乘数增至 `18`（最大位移从 12px 扩宽至 18px），保证拖拽时的立体视差滑行更加柔顺宽阔。
  - [x] 成功打包编译并部署发布。

- [x] **作品卡片切换时底色块 3D 纵深下潜与回弹动效 (Lower Color Block Z-Axis Diving Spring Animation on Switch)**
  - [x] 在 `js/modules/premium-interactions.js` 中引入 `orangeSwitchTimeline` 以避免切换动画与主展示动画冲突。
  - [x] 在 `onCardEnter` 检测到卡片发生切换且当前处于预览活跃状态时，触发 Z 轴下潜：先将 `orangeZ` 在 `0.16s` 内向下俯冲下潜至 **`-24px`**（避开卡片和阴影层，彻底潜入作品列表后方），随后使用弹性曲线 `elastic.out` 在 `0.6s` 内回弹至夹层高度 **`10px`**。
  - [x] 在 `showPreviewDOM` 和 `hidePreviewDOM` 触发时，同步对 `orangeSwitchTimeline` 进行清理（kill），防范多轨道动画竞态冲突。
  - [x] 成功编译构建并发布。
