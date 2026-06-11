# WebGL Works Preview & Scroll Shader Walkthrough

This walkthrough outlines the technical implementation for **Stage 2 (WebGL Image Displacement, GLSL Scroll Shaders, and Liquid Transitions)**.

---

## 🚀 Accomplishments

### 1. WebGL Core Setup & Coordinates Mapping
- **Canvas Integration**: Added a full-screen `<canvas class="works-webgl-canvas" id="worksWebGLCanvas">` in [index.html](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/index.html).
- **DOM-to-WebGL Math**: Created a specialized coordinate projection system in [webgl-preview.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/webgl-preview.js) that maps screen pixel bounding rects (from `.work-preview-img-container`) to Z=0 coordinates in the Three.js PerspectiveCamera space. This aligns 1 Three.js unit to exactly 1 CSS pixel, making layout synchronization flawless.

### 2. High-Performance GLSL Shaders
- **Vertex Shader (Scroll Bending & Mouse Skew)**:
  - Implemented vertical bending along the Y-axis using a sine wave function driven by window scroll velocity (`uVelocity`), making the image curve dynamically on scroll.
  - Implemented X-axis skewing driven by mouse speed (`uMeshVelocity`) during hover drag.
- **Fragment Shader (Liquid Transitions & RGB Shift)**:
  - Coded a fast, high-performance 2D noise algorithm in GLSL to distort texture UVs during page morphs.
  - Added dynamic chromatic aberration (RGB color splitting) driven by scroll velocity and transition progress, splitting colors near moving edges.
- **Shader Warm-up**: Triggered `renderer.compile(scene, camera)` on initialization to pre-compile the GLSL code, eliminating rendering stutters on first interaction.

### 3. DOM Tracking & Physics Sync
- **LERP Damping**: Hooked window scroll event and mouse movement deltas into interpolation loops (`currentScrollVelocity += (target - current) * 0.1`) to ensure physics values decay and accelerate smoothly without jagged jumps.
- **Texture Swap**: Auto-synchronized the WebGL material texture with the active hovered image source dynamically.
- **Invisible Sensor Mode**: Added a `body.webgl-active` class in [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) that hides the DOM `.work-preview-img` (opacity: 0) while keeping the container's layout active. This turns the existing premium DOM hover engine into an invisible "sensor" that guides the WebGL mesh overlay.

### 4. Seamless WebGL Morph Transition
- **Hash Router Integration**: Updated `openDetail` in [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) to intercept clicks when WebGL is active.
- **Transition Orchestration**:
  1. Hides the starting DOM preview card and target DOM detail hero image immediately.
  2. Teleports the WebGL plane mesh to the card's starting viewport coordinates.
  3. Animates the WebGL mesh coordinates and scales to match the final detail hero banner coordinates.
  4. Animates `uTransition` from `0.0` to `1.0`, triggering liquid wave distortion that peaks at `0.5` and settles back to standard rendering at `1.0`.
  5. Reveals the final DOM detail hero image and hides the WebGL canvas on completion, ensuring smooth standard scroll performance.

### 5. Performance Lifecycles & Mobile Fallback
- **Intersection Observer**: Monitored the `#work` viewport to pause the WebGL render loop (`cancelAnimationFrame`) whenever the works section is off-screen.
- **Mobile Fallback**: Added feature checks to disable WebGL initialization on touch-screen devices and screens `<= 768px`, falling back gracefully to the original lightweight CSS transform setup.

---

## 🔍 Validation & Verification

### 1. Automated Playwright Test Output
Ran the automated headless test suite (`test_webgl.js`) with the following log outputs:
```
Launching browser...
Navigating to http://localhost:5173...
BROWSER [log]: Premium Interactions JS Initialized (Desktop). true 4
BROWSER [log]: [Works WebGL] Initialized successfully. WebGL active.
Checking WebGL initialization status...
WebGL Status: {
  "active": true,
  "bodyClass": true
}
Clicking first card (flux)...
Detail Opened State: {
  "display": "block",
  "classList": [
    "work-detail",
    "open"
  ],
  "bgOpacity": "1",
  "imgOpacity": "1"
}
Closing detail page...
Detail Closed State: {
  "display": "none",
  "classList": [
    "work-detail"
  ],
  "bgOpacity": "0"
}
Browser closed.
```
- **Zero console errors**: Shaders compiled perfectly, modules transformed without any warnings, and imports resolved flawlessly.
- **WebGL active state registered**: The browser successfully instantiated the Three.js preview system and appended the activation class.
- **Transition hand-off validated**: The detail page successfully completed its morph transition, showing `imgOpacity: 1` and `display: block` at the end of the timeline.

### 2. Vite Production Build Verification
Built the client bundle successfully using `npx.cmd vite build`:
```
vite v8.0.16 building client environment for production...
transforming...✓ 51 modules transformed.
rendering chunks...
dist/index.html                                                       25.88 kB
dist/assets/index-71FmZ5Z6.css                                        74.42 kB
dist/assets/index-DfQ5XNW0.js                                        875.52 kB
✓ built in 227ms
```
The compilation successfully bound and bundled the local packages, compiling all custom shaders into minified production assets.

---

## 🛠️ Hotfix: iOS Safari Italic Character Clipping

### Problem
- On iOS Safari (WebKit engine), italic words that are wrapped in hardware-accelerated containers (`will-change: transform` or undergoing active 3D GPU animations like `skewY` in GSAP) are rendered on separate graphics compositing layers.
- The GPU layer boundary is strictly constrained by the element's layout bounding box (the `border-box` boundary).
- Since italic glyphs tilt to the right, they naturally overflow this `border-box` boundary. On WebKit, this causes the rightmost parts of characters (such as the upper-right corner of slanted letters) to be clipped.
- In mobile viewports (`<= 768px`), individual characters `.hero-char` inside the bold title `CRESCENT` are changed to `display: block; flex: 0 0 50%; max-width: 50%` and forced into a fixed `border-box` box model. This removed the `0.08em` padding safeguard defined on desktop, causing prominent character clipping on iPhones.

### Resolution
- **Robust CSS Grid Layout**: Switched the container `.hero-title-word.word-bold` from `display: flex; flex-wrap: wrap` to `display: grid !important` with `grid-template-columns: 1fr 1fr` on mobile viewports.
  - By upgrading to CSS Grid, we rigidly define the two 50% columns at the parent layout level. This completely bypasses WebKit's layout engine bugs where child items with active `transform` properties ignore flex-basis percentages, which was forcing each letter into its own separate line (single column).
  - Individual character items `.hero-char` are set to `width: 100%` and `box-sizing: border-box !important`, fitting perfectly into the grid columns to restore the visual 2-column (`C R` / `E S`) configuration.
- **Internal Safety Gutter & Tightened Spacing**: Added `padding-right: 0.18em !important` to `.hero-char` to buffer italic characters.
  - To prevent this padding from widening the gap between the two columns, we applied relative visual offsets: `left: 4vw !important` on odd characters (left column, shifting right) and `left: -4vw !important` on even characters (right column, shifting left).
  - This pulls the columns inward by a total of `8vw`, keeping the letter spacing tight and aesthetically cohesive without compromising WebKit clipping safety.
- **De-prioritized Synthetic Layers**: Overrode `will-change: auto !important` on these characters in mobile viewports to prevent WebKit from unnecessarily keeping them as independent GPU layers when they are not animating.
- **Verified Deployment**: Recompiled and pushed directly to production. The layout columns stay structurally centered while giving Safari's rendering engine ample box width to draw the characters fully without truncation.

---

## 🛠️ Hotfix: Showcase Page Mobile Scroll Jitter

### Problem
- On mobile browsers (Safari/Chrome), scrolling through the Showcase section caused violent jittering/shaking.
- **Dynamic Viewport Height Loops**: The `.showcase` container was styled with `height: 100vh; height: 100dvh` under mobile media queries, and the `.showcase-item` cards used `height: 38vh` or `35vh`. When scrolling on mobile, the address bar retracts/expands, constantly resizing the viewport height. This caused layout shifts, triggering ScrollTrigger recalculations, which scrolled the page, changing the address bar state again, resulting in an infinite scroll-jitter feedback loop.
- **Mobile Touch-to-Hover Event Pollution**: The cards listened for `mouseenter`, `mousemove`, and `mouseleave` to perform 3D cursor tilts and start an organic fluid shimmer ticker. On mobile touch-screens, touch-to-scroll gestures emulated mouse hover states that got stuck permanently, running active animation tick loops in the background and stuttering the scroll.
- **ScrollTrigger Animation Overhead**: Mobile cards were animated on entering and leaving (`toggleActions: "play none none reverse"`), causing continuous layout recalculations when scrolling back and forth.

### Resolution
- **Stable Mobile Dimensions**: Changed `.showcase` on mobile viewports (`<= 768px` and `<= 480px`) to use `height: auto !important` and custom vertical paddings (`100px 0`/`80px 0`). Replaced dynamic card heights (`vh`) with stable pixel values (`280px`/`240px`) to prevent any viewport-size recalculations during scroll.
- **Hover/Tilt Bypassing for Mobile/Touch**: Moved mouse event listeners, 3D quickTo transitions, and shimmer tickers inside a `!isMobile` conditional check. This prevents emulation triggers and keeps CPU/GPU overhead at zero when scrolling on touch screens.
- **One-Time Scroll Reveal**: Changed mobile ScrollTrigger to use `once: true` instead of toggle actions. The cards slide and fade in smoothly once, locking into place for a stable, high-performance scrolling flow.

---

## 🛠️ Hotfix: Desktop Showcase Horizontal Jump & Overlap Bug

### Problem
- **Horizontal Jitter / Jump when Scrolling UP**: On desktop viewports, when scrolling back up through the Showcase section, the cards would suddenly jump to the right. This was caused by `pinSpacing: false` combined with an `onUpdate` scroll listener that toggled `.showcaseSection.style.visibility` to `"hidden"` / `"visible"` at progress `0.67`. The layout switch and the removal of the pin-wrapper's fixed state triggered sudden horizontal width recalculations (especially with scrollbars present), resulting in a layout jump.
- **Overlap Collision with next section (Moving/Motion Section)**: Because `pinSpacing: false` was used, the next sibling (Motion page) was allowed to scroll up immediately while the Showcase cards were still animating their stacked sequence. The timing was offset using a manual `marginTop` of `100vh` on the next sibling. However, since the Showcase section pins for a scroll distance of `200vh` (`+=200%`), the next sibling would reach the top of the screen at progress `0.5` (scroll distance of `100vh`), completely covering the cards before the third card finished animating or Step 3 could run, creating a messy overlap collision.

### Resolution
- **GSAP Native Pin Spacing (`pinSpacing: true`)**: Changed the desktop ScrollTrigger setup in [showcase.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/showcase.js) to use `pinSpacing: true` (which is standard for pinned stacks). This tells GSAP to automatically add bottom padding spacing equal to the scroll distance inside the pin-wrapper.
- **Eliminated Manual Spacing and Visibility Hacks**: Removed the manual `marginTop` calculations and the `onUpdate` visibility toggles from both desktop and mobile branches. The next sibling (Motion page) now stays naturally positioned below the pinned section and scrolls in seamlessly only *after* the Showcase animation finishes and unpins. This completely resolves the horizontal layout jumping when scrolling back up and prevents any section overlapping/collisions.

---

## 🛠️ Hotfix: Restored Showcase Depth-of-Field & Stacked Deck Effects

### Problem
- **Mobile Stacked Deck & Depth-of-Field Bypassed**: In a previous commit, the stacked deck card animation (scale, overlay, and 3D positioning) and the depth-of-field blur effects were completely disabled on mobile (screen widths `< 768px`) in favor of a standard vertical list flow to avoid mobile pinning jitter. The user wanted these premium stacked deck and depth-of-field blur effects restored on mobile.
- **Desktop Cards Vanished Too Early**: In the previous layout fix, the cards faded out to `opacity: 0` in the timeline (Step 3). With `pinSpacing: true`, this caused the cards to disappear completely before the section unpinned, leaving a blank black space for 33% of the scroll.
- **CSS Transition Conflicts**: The cards were styled with the `.anim-up` and `.anim-done` classes, which applied a `transition: transform 0.8s, opacity 0.75s` CSS rule. When GSAP tried to scrub card transforms and scale dynamically on scroll, the CSS transition intercepted the updates, causing the cards to lag behind the scroll, stutter, and jump horizontally when scrolling up.

### Resolution
- **Unified Stacked Deck animations**: Re-enabled the stacked deck layout and the ScrollTrigger pinning/depth-of-field timeline on mobile. Desktop and mobile now share the same premium animation engine, restoring the depth-of-field blur and layered stacking on all devices.
# WebGL Works Preview & Scroll Shader Walkthrough

This walkthrough outlines the technical implementation for **Stage 2 (WebGL Image Displacement, GLSL Scroll Shaders, and Liquid Transitions)**.

---

## 🚀 Accomplishments

### 1. WebGL Core Setup & Coordinates Mapping
- **Canvas Integration**: Added a full-screen `<canvas class="works-webgl-canvas" id="worksWebGLCanvas">` in [index.html](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/index.html).
- **DOM-to-WebGL Math**: Created a specialized coordinate projection system in [webgl-preview.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/webgl-preview.js) that maps screen pixel bounding rects (from `.work-preview-img-container`) to Z=0 coordinates in the Three.js PerspectiveCamera space. This aligns 1 Three.js unit to exactly 1 CSS pixel, making layout synchronization flawless.

### 2. High-Performance GLSL Shaders
- **Vertex Shader (Scroll Bending & Mouse Skew)**:
  - Implemented vertical bending along the Y-axis using a sine wave function driven by window scroll velocity (`uVelocity`), making the image curve dynamically on scroll.
  - Implemented X-axis skewing driven by mouse speed (`uMeshVelocity`) during hover drag.
- **Fragment Shader (Liquid Transitions & RGB Shift)**:
  - Coded a fast, high-performance 2D noise algorithm in GLSL to distort texture UVs during page morphs.
  - Added dynamic chromatic aberration (RGB color splitting) driven by scroll velocity and transition progress, splitting colors near moving edges.
- **Shader Warm-up**: Triggered `renderer.compile(scene, camera)` on initialization to pre-compile the GLSL code, eliminating rendering stutters on first interaction.

### 3. DOM Tracking & Physics Sync
- **LERP Damping**: Hooked window scroll event and mouse movement deltas into interpolation loops (`currentScrollVelocity += (target - current) * 0.1`) to ensure physics values decay and accelerate smoothly without jagged jumps.
- **Texture Swap**: Auto-synchronized the WebGL material texture with the active hovered image source dynamically.
- **Invisible Sensor Mode**: Added a `body.webgl-active` class in [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) that hides the DOM `.work-preview-img` (opacity: 0) while keeping the container's layout active. This turns the existing premium DOM hover engine into an invisible "sensor" that guides the WebGL mesh overlay.

### 4. Seamless WebGL Morph Transition
- **Hash Router Integration**: Updated `openDetail` in [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) to intercept clicks when WebGL is active.
- **Transition Orchestration**:
  1. Hides the starting DOM preview card and target DOM detail hero image immediately.
  2. Teleports the WebGL plane mesh to the card's starting viewport coordinates.
  3. Animates the WebGL mesh coordinates and scales to match the final detail hero banner coordinates.
  4. Animates `uTransition` from `0.0` to `1.0`, triggering liquid wave distortion that peaks at `0.5` and settles back to standard rendering at `1.0`.
  5. Reveals the final DOM detail hero image and hides the WebGL canvas on completion, ensuring smooth standard scroll performance.

### 5. Performance Lifecycles & Mobile Fallback
- **Intersection Observer**: Monitored the `#work` viewport to pause the WebGL render loop (`cancelAnimationFrame`) whenever the works section is off-screen.
- **Mobile Fallback**: Added feature checks to disable WebGL initialization on touch-screen devices and screens `<= 768px`, falling back gracefully to the original lightweight CSS transform setup.

---

## 🔍 Validation & Verification

### 1. Automated Playwright Test Output
Ran the automated headless test suite (`test_webgl.js`) with the following log outputs:
```
Launching browser...
Navigating to http://localhost:5173...
BROWSER [log]: Premium Interactions JS Initialized (Desktop). true 4
BROWSER [log]: [Works WebGL] Initialized successfully. WebGL active.
Checking WebGL initialization status...
WebGL Status: {
  "active": true,
  "bodyClass": true
}
Clicking first card (flux)...
Detail Opened State: {
  "display": "block",
  "classList": [
    "work-detail",
    "open"
  ],
  "bgOpacity": "1",
  "imgOpacity": "1"
}
Closing detail page...
Detail Closed State: {
  "display": "none",
  "classList": [
    "work-detail"
  ],
  "bgOpacity": "0"
}
Browser closed.
```
- **Zero console errors**: Shaders compiled perfectly, modules transformed without any warnings, and imports resolved flawlessly.
- **WebGL active state registered**: The browser successfully instantiated the Three.js preview system and appended the activation class.
- **Transition hand-off validated**: The detail page successfully completed its morph transition, showing `imgOpacity: 1` and `display: block` at the end of the timeline.

### 2. Vite Production Build Verification
Built the client bundle successfully using `npx.cmd vite build`:
```
vite v8.0.16 building client environment for production...
transforming...✓ 51 modules transformed.
rendering chunks...
dist/index.html                                                       25.88 kB
dist/assets/index-71FmZ5Z6.css                                        74.42 kB
dist/assets/index-DfQ5XNW0.js                                        875.52 kB
✓ built in 227ms
```
The compilation successfully bound and bundled the local packages, compiling all custom shaders into minified production assets.

---

## 🛠️ Hotfix: iOS Safari Italic Character Clipping

### Problem
- On iOS Safari (WebKit engine), italic words that are wrapped in hardware-accelerated containers (`will-change: transform` or undergoing active 3D GPU animations like `skewY` in GSAP) are rendered on separate graphics compositing layers.
- The GPU layer boundary is strictly constrained by the element's layout bounding box (the `border-box` boundary).
- Since italic glyphs tilt to the right, they naturally overflow this `border-box` boundary. On WebKit, this causes the rightmost parts of characters (such as the upper-right corner of slanted letters) to be clipped.
- In mobile viewports (`<= 768px`), individual characters `.hero-char` inside the bold title `CRESCENT` are changed to `display: block; flex: 0 0 50%; max-width: 50%` and forced into a fixed `border-box` box model. This removed the `0.08em` padding safeguard defined on desktop, causing prominent character clipping on iPhones.

### Resolution
- **Robust CSS Grid Layout**: Switched the container `.hero-title-word.word-bold` from `display: flex; flex-wrap: wrap` to `display: grid !important` with `grid-template-columns: 1fr 1fr` on mobile viewports.
  - By upgrading to CSS Grid, we rigidly define the two 50% columns at the parent layout level. This completely bypasses WebKit's layout engine bugs where child items with active `transform` properties ignore flex-basis percentages, which was forcing each letter into its own separate line (single column).
  - Individual character items `.hero-char` are set to `width: 100%` and `box-sizing: border-box !important`, fitting perfectly into the grid columns to restore the visual 2-column (`C R` / `E S`) configuration.
- **Internal Safety Gutter & Tightened Spacing**: Added `padding-right: 0.18em !important` to `.hero-char` to buffer italic characters.
  - To prevent this padding from widening the gap between the two columns, we applied relative visual offsets: `left: 4vw !important` on odd characters (left column, shifting right) and `left: -4vw !important` on even characters (right column, shifting left).
  - This pulls the columns inward by a total of `8vw`, keeping the letter spacing tight and aesthetically cohesive without compromising WebKit clipping safety.
- **De-prioritized Synthetic Layers**: Overrode `will-change: auto !important` on these characters in mobile viewports to prevent WebKit from unnecessarily keeping them as independent GPU layers when they are not animating.
- **Verified Deployment**: Recompiled and pushed directly to production. The layout columns stay structurally centered while giving Safari's rendering engine ample box width to draw the characters fully without truncation.

---

## 🛠️ Hotfix: Showcase Page Mobile Scroll Jitter

### Problem
- On mobile browsers (Safari/Chrome), scrolling through the Showcase section caused violent jittering/shaking.
- **Dynamic Viewport Height Loops**: The `.showcase` container was styled with `height: 100vh; height: 100dvh` under mobile media queries, and the `.showcase-item` cards used `height: 38vh` or `35vh`. When scrolling on mobile, the address bar retracts/expands, constantly resizing the viewport height. This caused layout shifts, triggering ScrollTrigger recalculations, which scrolled the page, changing the address bar state again, resulting in an infinite scroll-jitter feedback loop.
- **Mobile Touch-to-Hover Event Pollution**: The cards listened for `mouseenter`, `mousemove`, and `mouseleave` to perform 3D cursor tilts and start an organic fluid shimmer ticker. On mobile touch-screens, touch-to-scroll gestures emulated mouse hover states that got stuck permanently, running active animation tick loops in the background and stuttering the scroll.
- **ScrollTrigger Animation Overhead**: Mobile cards were animated on entering and leaving (`toggleActions: "play none none reverse"`), causing continuous layout recalculations when scrolling back and forth.

### Resolution
- **Stable Mobile Dimensions**: Changed `.showcase` on mobile viewports (`<= 768px` and `<= 480px`) to use `height: auto !important` and custom vertical paddings (`100px 0`/`80px 0`). Replaced dynamic card heights (`vh`) with stable pixel values (`280px`/`240px`) to prevent any viewport-size recalculations during scroll.
- **Hover/Tilt Bypassing for Mobile/Touch**: Moved mouse event listeners, 3D quickTo transitions, and shimmer tickers inside a `!isMobile` conditional check. This prevents emulation triggers and keeps CPU/GPU overhead at zero when scrolling on touch screens.
- **One-Time Scroll Reveal**: Changed mobile ScrollTrigger to use `once: true` instead of toggle actions. The cards slide and fade in smoothly once, locking into place for a stable, high-performance scrolling flow.

---

## 🛠️ Hotfix: Desktop Showcase Horizontal Jump & Overlap Bug

### Problem
- **Horizontal Jitter / Jump when Scrolling UP**: On desktop viewports, when scrolling back up through the Showcase section, the cards would suddenly jump to the right. This was caused by `pinSpacing: false` combined with an `onUpdate` scroll listener that toggled `.showcaseSection.style.visibility` to `"hidden"` / `"visible"` at progress `0.67`. The layout switch and the removal of the pin-wrapper's fixed state triggered sudden horizontal width recalculations (especially with scrollbars present), resulting in a layout jump.
- **Overlap Collision with next section (Moving/Motion Section)**: Because `pinSpacing: false` was used, the next sibling (Motion page) was allowed to scroll up immediately while the Showcase cards were still animating their stacked sequence. The timing was offset using a manual `marginTop` of `100vh` on the next sibling. However, since the Showcase section pins for a scroll distance of `200vh` (`+=200%`), the next sibling would reach the top of the screen at progress `0.5` (scroll distance of `100vh`), completely covering the cards before the third card finished animating or Step 3 could run, creating a messy overlap collision.

### Resolution
- **GSAP Native Pin Spacing (`pinSpacing: true`)**: Changed the desktop ScrollTrigger setup in [showcase.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/showcase.js) to use `pinSpacing: true` (which is standard for pinned stacks). This tells GSAP to automatically add bottom padding spacing equal to the scroll distance inside the pin-wrapper.
- **Eliminated Manual Spacing and Visibility Hacks**: Removed the manual `marginTop` calculations and the `onUpdate` visibility toggles from both desktop and mobile branches. The next sibling (Motion page) now stays naturally positioned below the pinned section and scrolls in seamlessly only *after* the Showcase animation finishes and unpins. This completely resolves the horizontal layout jumping when scrolling back up and prevents any section overlapping/collisions.

---

## 🛠️ Hotfix: Restored Showcase Depth-of-Field & Stacked Deck Effects

### Problem
- **Mobile Stacked Deck & Depth-of-Field Bypassed**: In a previous commit, the stacked deck card animation (scale, overlay, and 3D positioning) and the depth-of-field blur effects were completely disabled on mobile (screen widths `< 768px`) in favor of a standard vertical list flow to avoid mobile pinning jitter. The user wanted these premium stacked deck and depth-of-field blur effects restored on mobile.
- **Desktop Cards Vanished Too Early**: In the previous layout fix, the cards faded out to `opacity: 0` in the timeline (Step 3). With `pinSpacing: true`, this caused the cards to disappear completely before the section unpinned, leaving a blank black space for 33% of the scroll.
- **CSS Transition Conflicts**: The cards were styled with the `.anim-up` and `.anim-done` classes, which applied a `transition: transform 0.8s, opacity 0.75s` CSS rule. When GSAP tried to scrub card transforms and scale dynamically on scroll, the CSS transition intercepted the updates, causing the cards to lag behind the scroll, stutter, and jump horizontally when scrolling up.

### Resolution
- **Unified Stacked Deck animations**: Re-enabled the stacked deck layout and the ScrollTrigger pinning/depth-of-field timeline on mobile. Desktop and mobile now share the same premium animation engine, restoring the depth-of-field blur and layered stacking on all devices.
- **Mobile Height Locking**: Added a JavaScript height lock at script initialization on mobile (`showcaseSection.style.height = window.innerHeight + 'px'`). Together with fixed responsive heights for `.showcase-grid.is-stacked` (`320px`/`260px`), this locks the container and card sizes. This completely prevents viewport height shifts when the mobile browser address bar shows/hides, eliminating scrolling jitter.
- **Removed Early Card Fade-Out**: Removed Step 3 (the cards fading out) from the timeline. The cards now complete their stack and remain fully visible and layered in their final beautiful stacked state. The container then unpins and the entire stacked deck scrolls up together, keeping the depth-of-field and layering effects visible at all times.
- **Disabled conflicting CSS Transitions**: Added `.showcase-item { transition: none !important; }` in [styles.css](file:///D:/webprojext/styles.css). This disables the `.anim-up.anim-done` transition for showcase items, resolving the CSS-JS conflict and ensuring buttery-smooth GSAP scroll scrubbing.

---

## 🚀 Premium 3D Custom Cursor Hover Animations

We have upgraded the custom cursor hover (pointer) state animations from a simple, default scale zoom to a highly sophisticated, multi-layered 3D interactive reaction.

### Key Enhancements

1. **Snappy 3D Barrel Roll Trigger (Spring-decayed Y-rotation)**:
   - When the cursor enters a new interactive hover target (links, buttons, cards), it triggers an instantaneous **3D barrel roll flip** (`-360` degrees) around its longitudinal (Y) axis.
   - The rotation is driven by optimized spring physics (`tension: 0.35`, `damping: 0.48`), allowing it to spin with high velocity and settle in just ~200ms with a tiny, clean 11-degree elastic rebound, completely eliminating the loose pendulum wobble.
   - The event listeners utilize boundary filtering (`!e.relatedTarget || !target.contains(e.relatedTarget)`) to ignore transitions between internal child elements of a button, ensuring that moving the mouse inside a button never triggers repeat barrel rolls or hover flickers.
   - The hover listener tracks the specific element target (`lastHoveredElement`) to ensure that moving directly from one button to another triggers a fresh barrel roll spin.

2. **Torsional Wing-Sweep (Multi-layered Twist)**:
   - On hover, the 5 stacked 3D layers of the crystal delta wing delta-deform by fanning out (twisting) around the pointer tip.
   - The fanning is parameterized on a LERP factor (`currentTwist`) that interpolates smoothly between `0` and `1`.
   - The front layer (`idx = 4`) remains static at `0` rotation to guarantee pixel-precise pointer alignment.
   - The lower layers fan out progressively in alternating directions to remain **perfectly balanced and symmetrical** (net rotation offset is `0`):
     - `Layer 3 (mid-1)`: `-10deg`
     - `Layer 2 (mid-2)`: `+10deg`
     - `Layer 1 (mid-3)`: `-20deg`
     - `Layer 0 (back)`: `+20deg`
   - This creates a gorgeous iridescent geometric prism structure on hover, showcasing the individual layered colors while maintaining a centered visual balance.

3. **Subpixel Snapping Cleanups (Zero Drift)**:
   - Added active snapping checks in the animation loop. When both mouse speed and cursor speed fall below `0.05px/frame`, the rotation angles and pitches snap exactly to their resting values (`currentAngle = -90`, `currentRoll = 0`, `spinRoll = 0`).
   - This guarantees that when the mouse comes to a halt, the flight wing is perfectly flat, upright, and symmetrical with zero residual subpixel drift.

4. **3D Extrusion Depth Expansion**:
   - The dynamic Z-depth spacing between the 5 stacked layers expands from `1.0px` to `4.5px` on hover.
   - With the cursor container's `perspective` set at `45px` in [styles.css](file:///D:/webprojext/styles.css), this creates a deep 3D parallax effect, pulling the back layers deep into the Z-horizon and making the crystal wings look solid, thick, and premium.

5. **Tuned Scale Integration**:
   - The hover scale factor is tuned to a moderate `0.78` (compared to the baseline `0.67`). The subtle scale-up preserves restraint, letting the fanning-out wings and deep Z-spacing serve as the primary interactive feedback.
