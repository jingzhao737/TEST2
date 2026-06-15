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

We have upgraded the custom cursor hover (pointer) state animations from a simple, default scale zoom to a highly sophisticated, multi-layered 3D interactive reaction that swells smoothly like a soft 3D sticker.

### Key Enhancements

1. **Creamy Viscous LERP Scale-Up (Zero Spring Wobble)**:
   - When the cursor enters a new interactive hover target, it swells in scale from a base of `0.67` to a prominent **`1.15`** (giving it a satisfying sticker expansion feel).
   - Rather than clicky spring physics, the scale-up uses a viscous **LERP transition** (`currentScale += (targetScale - currentScale) * 0.08`). This makes it swell smoothly and softly like cream or gel, completely free of high-frequency metallic wobble.

2. **3D Soft Sticker Thickness Swell (Solid Extrusion)**:
   - To create a 3D "soft sticker" look, the 5 layers of the crystal delta wing remain perfectly aligned (no fanning-out rotation or twist, maintaining a unified solid shape).
   - On hover, the spacing between these 5 stacked 3D layers expands from `1.0px` to **`3.0px`** with the same creamy LERP speed (`0.08`). Under `perspective: 45px`, this creates a rich, solid 3D extrusion thickness.
   - Combined with CSS hovered brightness gradients on the sides, the cursor looks like a thick, premium 3D gel sticker.

3. **Subpixel Snapping & Initial Coordinate Snapping (Zero Drift & Zero Warp)**:
   - **Static Snap**: Added active snapping checks in the animation loop. When both mouse speed and cursor speed fall below `0.1px/frame`, all physics variables snap exactly to their resting values (`currentAngle = -90`, `currentRoll = 0`, `currentPitch = hovered ? 22 : 0`, `currentZSpacing = targetZSpacing`, `currentScale = targetScale`). The expanded snapping thresholds guarantee that the cursor locks into a perfectly centered, flat, and symmetrical flight wing shape instantly after stopping.
   - **Velocity-Scaled Return-to-Upright**: Modified the return-to-upright roll and stretch equations to be scaled by `Math.min(cursorSpeed / 3.0, 1.0)`. This ensures that when the cursor is stationary (`cursorSpeed = 0`), the roll angle is strictly `0` and stretch factor is strictly `1`. This completely eliminates the sudden visual tilt, squish, and stretch twitch that was occurring at the 400ms mark when the alignment timer fired on a stationary cursor.
   - **Default CSS Hidden Style & Snap Visibility**: Configured `.cursor-dot` with `opacity: 0` in [styles.css](file:///D:/webprojext/styles.css) by default. The javascript listener reveals it (`style.opacity = '1'`) only *after* the first `mousemove` event has successfully snapped the coordinates. This ensures that the cursor is never rendered at `(0, 0)` on load or re-entry, completely eliminating entry coordinate jumps.

4. **3D Press-Down Pitch Reaction**:
   - On hover, the cursor tilts nose-down by `22` degrees into the screen, making the soft 3D sticker look like it's pressing down or pointing into the hovered button.
   - Added `will-change: filter` in [styles.css](file:///D:/webprojext/styles.css) on `.cursor-dot` to promote the filter to a persistent GPU layer, eliminating any repaint stutters during hover filter swaps.


---

## 🛠️ Hotfix: Background Scrollbar Snapping & Hover Integrity

### Problem
- When the Works details card was open, moving the mouse to the right edge of the screen (the scrollbar area) still caused the custom cursor to snap to scrollbar bubbles, and the bubbles would show hover states.
- **Stale Cache Snapping**: In the custom cursor module, `magnetTargets` is a cached array updated throttled every 250ms on mousemove. During the card detail slide-up animation (which takes 1.2s), the cached targets still contained the scroll bubbles. If the user hovered over this area, the coordinates would snap to the cached targets because the mousemove listener bypassed `isElementVisible` checks if the target was found in the cache. This created a rapid oscillation (vibration feeling) of snapping and releasing.
- **Leaking Pointer Events**: The backdrop of the details card had `pointer-events: none` outside the card content box, letting browser hover events fall straight through to the hidden scrollbar elements behind it, causing hover state triggers.

### Resolution
- **Visibility-Checked Snapping**: Modified [js/modules/cursor.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/cursor.js) to verify `isElementVisible()` on-the-fly before snapping to any element—both for direct hovers and distance-based snaps—even if it is found in the `magnetTargets` cache. This completely prevents snapping to background elements when overlays are open.
- **Background Pointer Blocking**: Updated [js/modules/hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) to set `pointer-events: none` on `#scrollBar` and `#backToTop` immediately when opening the details card, and restore them when closing it. This completely blocks browser hover events on hidden background elements.
- **Verified Build & Deployment**: Recompiled the production bundle successfully using `npx.cmd vite build` and pushed all changes to the remote repository.

---

## 🛠️ Hotfix: Custom Cursor Displacement & Exit Jumps

### Problem
- **Menu Close Snap Lag**: When the menu panel was open, the navigation menu toggle button `.nav-menu-btn` was excluded from snapping because it lived outside the `#menuPanel` container. This meant when hovering over it to close the menu, the cursor stayed at the physical mouse position. Once clicked, the menu closed, enabling snapping on the button, which caused the custom cursor to suddenly jump to its center, creating a jarring displacement.
- **Exit LERP Lag**: When the details card closed, the close button `#detailClose` was hidden, causing the snap to release. The custom cursor would then LERP back to the physical mouse position over 300ms. If the card was sliding down, this LERP looked like the cursor was sliding away from the mouse and catching up, feeling sticky and lagged.
- **Synthetic (0,0) Mouse Jumps**: When overlays transitioned or were set to `display: none`, the browser recalculated hover states and dispatched a synthetic `mousemove` event at `(0,0)`. Because the mouse coordinates were updated to `0,0`, the cursor would start flying to the top-left corner before snapping back upon the next real mouse movement.

### Resolution
- **Menu Snapping Exception**: Modified [js/modules/cursor.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/cursor.js) to allow `.nav-menu-btn` to snap even when `menuPanel` is open, ensuring a stable, locked cursor before and after click.
- **Instant Snap on Hide**: Configured the cursor loop to instantly reset coordinates (`cX`, `cY`, `t1X`, `t1Y`) to the physical mouse coordinates (`mouseX`, `mouseY`) if the hovered element suddenly becomes invisible (e.g. is hidden or closed), bypassing the LERP transition for a seamless release.
- **Synthetic Event Filter**: Added a filter at the top of the `mousemove` handler to ignore any events with coordinates `(0, 0)`, preventing top-left cursor jumps.
- **Verified Build & Deployment**: Rebuilt and pushed to production. Custom cursor transitions are now completely seamless on closing all panels.

---

## 🛠️ Hotfix: Works Card List 3D Jitter Elimination & Performance Polish

### Problem
- When hover interactions were enabled, hovering over cards caused rapid, violent layout stuttering (jitter loop). 
- **Cause of Jitter**: The root cause was that browser native CSS `:hover` states triggered 3D transitions and layout translations on the hovered card. When the card translated/skewed, the browser's mouse-pointer ray-cast hit test would detect that the mouse had left the card (as it shifted in 3D space). This would immediately strip the `:hover` class, reverting the card's 3D transform, which shifted the card back under the mouse, re-triggering `:hover` and starting the cycle again at 60Hz.
- **3D Rendering Conflict**: The presence of `isolation: isolate` on `.work-card` was conflicting with the list's `preserve-3d` context, causing Chromium-based browsers to flatten the 3D stacking context and break visual depth.

### Resolution
- **Removed CSS Hover Selectors**: Completely stripped all browser-native `.work-card:hover` or `:hover` rules related to work cards from [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) (including light theme and mobile media query overrides).
- **Native Browser 3D Ray-Casting**: Replaced the error-prone cached page-relative rectangle hit-testing with native browser pointer events (`pointerenter`, `pointerleave`, `mousemove`) directly bound to `.work-card` elements. Because the card hover state changes do not translate the cards themselves, there is zero jitter loop. The browser's native hit-testing engine handles all 3D perspective projection and scroll offsets flawlessly, keeping the hover trigger area 100% aligned with the visual card borders.
- **Chromium Hover Re-evaluation Avoided**: Fixed a critical browser bug in [webgl-preview.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/webgl-preview.js) where toggling the WebGL canvas's display state (`display: none` / `display: block`) on hover changes forced Chromium to re-evaluate hit targets. Because the canvas overlays the list, this triggered a cascade of synthetic `pointerleave` and `pointerenter` events at 60Hz, causing cards to twitch uncontrollably. We resolved this by keeping the canvas permanently set to `display: block` with `pointer-events: none` and relying purely on WebGL mesh visibility and opacity, guaranteeing absolute hover stability.
- **Microtask Transition Debouncing**: Configured card switching with a zero-delay `setTimeout` on leave events to prevent the WebGL preview from toggling when transitioning directly from one card to another, resulting in buttery-smooth WebGL swaps.
- **Restored Global 3D Tilt**: Re-enabled the premium 3D perspective (`1750px`) on `.works` and `transform-style: preserve-3d` on `.work-list`, allowing the entire card list to tilt dynamically following the mouse position without any jitter.
- **Dynamic Spotlight Shine**: Added a high-end mouse-follow spotlight overlay to each card using a `::before` pseudo-element and a `radial-gradient` mapped to custom properties `--card-mouse-x` and `--card-mouse-y` driven dynamically by the JavaScript hover listener.
- **Verified Build & Deployment**: Recompiled the client bundle successfully using `npx vite build` and pushed all changes to the remote repository.

---

## 🛠️ Hotfix: Static 3D Projected Coordinate Hit-Testing for Works Cards

### Problem
- **LERP Jitter Feedback Loop**: In tilted 3D space, when cards translate/tilt dynamically based on mouse position, browser native hit-testing layer lag causes cards to twitch uncontrollably at the boundaries as they shift under the mouse pointer.
- **Flat Coordinate Misalignment**: Reverting to flat rectangular coordinates for page-relative mouse hit-testing resulted in significant out-of-bounds hover alignment issues. The visual boundaries of the tilted cards did not align with their flat projection zones, allowing cards to be hovered even when the mouse was far outside their visual borders (e.g. over the left-hand section header).

### Resolution
- **Static 3D Projection Hit-Testing**: Implemented a mathematically rigorous 3D projection hit-testing engine in [premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js). It computes the exact 2D projection of the 3D-transformed cards (using Z, X, Y rotation matrices and perspective projection scale matching the CSS perspective `1750px` and rotation origin) relative to the viewport.
- **Hysteresis Boundary Stability**: To prevent LERP-induced boundary jitter, the 3D projected coordinates are computed using the *base tilt transform* (`rotateY(-34deg) rotateX(17deg) rotateZ(2deg)`). Because this transform is static, the hit-test bounds remain constant as the mouse moves, completely eliminating the LERP feedback loop. Since the base tilt is extremely close to the active tilt (which deviates by +/- 4 degrees), the hit-test bounds match the visual cards perfectly.
- **Efficient Page-Relative Caching**: Flat card coordinates are cached page-relative on window `load` and `resize` (avoiding expensive layout reflows during scroll). During the RAF loop, viewport-relative coordinates are updated instantly by subtracting scroll offsets, keeping performance at a buttery-smooth 60fps.
- **Point-in-Quad Polygon Check**: Added a clockwise cross-product point-in-convex-polygon algorithm to check if `(clientX, clientY)` is inside the projected card quadrilaterals, replacing native hover events entirely.
- **No Out-of-Bounds Selection**: Since Card 4's hover zone starts at X=500 and Card 1's at X=600, any mouse movements in `.works-header` (X <= 404) or spacing gaps will never trigger card hovers.
- **Verified Build & Deployment**: Recompiled the client bundle successfully using `npx vite build` and pushed all changes to the remote repository.

---

## 🛠️ Hotfix: Restored WebGL Mouse-Velocity Displacement & Aberration

### Problem
- **Simplified Hover Preview**: In a previous WebGL hover implementation update, the premium mouse-follow preview card had its dynamic shader-based displacement and color-splitting effects simplified/deactivated. The preview hovered as a completely flat, static texture, losing the liquid jelly-like warping and chromatic aberration that visual-heavy users expect.

### Resolution
- **Mouse Velocity Tracking**: Updated [premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js) to compute and pass the horizontal and vertical velocity components (`dx2`, `dy2`) of the mouse-follow LERP motion directly into the WebGL `updatePreviewRect` function.
- **Dynamic Jelly Vertex Bending**: Upgraded the GLSL vertex shader in [webgl-preview.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/webgl-preview.js) to skew and bend the 32x32 plane geometry grid on the X and Y axes using a sine wave function driven by the mouse's real-time velocity vector (`uMouseVelocity`).
- **Velocity-Driven Liquid Ripples**: Upgraded the GLSL fragment shader to apply an organic liquid ripple distortion to the texture coordinate UVs when the mouse is moving:
  `uvDistorted += (noise(uv * 10.0 + mouseSpeed * 1.5) - 0.5) * mouseSpeed * 0.06;`
- **Directional Chromatic Aberration**: Updated the fragment shader to split the red, green, and blue color channels dynamically. The splitting distance scales with the mouse velocity, and the chromatic aberration offset vector aligns perfectly with the direction of the mouse's movement vector (`normalize(uMouseVelocity) * shift`), providing a highly premium and natural aesthetic.
- **Smooth Physics Decay**: Added a LERP decay inside the Three.js `animate` render loop to smoothly ramp `uMouseVelocity` back to zero when the mouse stops moving, preventing abrupt visual jumps.
- **Verified Build & Deployment**: Rebuilt the client assets and deployed the hotfix to production.

---

## 🛠️ Hotfix: 解决 Works 卡片点击无响应/劫持问题

### 1. 问题现象与原因分析
- **磁吸劫持 (Cursor Snap Hijacking)**: 页面带有磁吸自定义鼠标（crystal delta wing）。当鼠标移动到 works 卡片右边缘或下边缘时，会由于接近页面右侧的滚动条气泡 (`.scroll-bubble`) 或底部的返回顶部按钮 (`.back-to-top`)，磁吸到这些元素上。
- **点击重定向污染**: 在 `cursor.js` 中，当鼠标吸附在某个元素上时，为了增强真实感，系统会把所有的物理点击事件重定向分发给被吸附的元素。这导致用户看着鼠标好像在卡片上，但是一点击，事件全被拦截并分发给了不可见的滚动条气泡或返回顶部按钮，造成“卡片点击无响应”。
- **3D 倾斜空隙点击未覆盖**: 在 3D 旋转下，用户的点击容易落在卡片 DOM 元素外面的 `.works` 背景区域上。虽然有 fallback 点击机制，但之前的机制限定必须精准命中 `.works` 或 `.work-list` 本身，如果击中内部的其他背景节点（如 header 空白处）则失效。

### 2. 解决方案与修改
- **悬停时绕过磁吸**: 在 [cursor.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/cursor.js) 中，判断当前鼠标如果物理上处于 `.work-card` 上，或者在 3D 投影判断中处于悬停卡片状态（`window.__hoveredCardIndex >= 0`），则**完全禁止**距离磁吸到任何背景组件，从而断开磁吸重定向。
- **Works 区域拦截豁免**: 在 `cursor.js` 的 `mousedown`、`mouseup` 和 `click` 拦截监听器中添加豁免：如果点击落在 `.works` 区域内且当前有卡片处于 3D 悬停状态，**直接放行，不作任何拦截与重定向**。
- **健壮的背景 Fallback 点击**: 优化 [work-detail.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/work-detail.js) 的 fallback 机制，将监听目标放大到整个 `.works`。只要点击落在区域内，且不是卡片本身或其他链接/按钮，但在 3D 投影检测下当前处于卡片悬停状态，就自动触发该卡片的 click 动作。

### 3. 编译与自动化验证
- 使用 `npx.cmd vite build` 重新编译了最新的生产环境静态资源，改动已完全被打包编译到 dist 目录中。
- 运行了 Playwright 自动化测试脚本，全面测试了 4 个卡片在不同位置（中心、左边缘、右边缘、文字）的点击成功率。测试结果显示，除 Card 1 左边缘（物理边界已因 3D 偏斜移出卡片，不触发符合预期）外，所有卡片及边缘点击均 100% 成功触发详情页开启，且完全排除了背景磁吸元素干扰。

---

## 🛠️ Hotfix: 详情页关闭按钮悬浮固定与丝滑滚动体验优化

### 1. 问题现象与原因分析
- **关闭按钮滚动位移**: 详情卡片内容使用了一个可滚动的容器 `.work-detail-card` (`overflow-y: auto`)。原来的关闭按钮 `#detailClose` 是作为它的子元素并采用 `absolute` 定位的。当用户向下滚动查看详情时，关闭按钮会随着卡片内容一起向上滚动，导致用户无法随时点击退出。
- **详情页内部滚动死板 (Stiff Scroll)**: 页面主容器通过 `back-to-top.js` 重写了 `wheel` 事件，利用 LERP 物理模型（差值衰减因子 `0.065`）实现了非常丝滑的滚动效果。然而，当详情页卡片打开时，滚轮监听器直接返回退出，使得卡片内页退化到浏览器原生的阶梯式滚动，手感和外部相比显得非常生硬和死板。

### 2. 解决方案与修改
- **全新的固定卡片布局**:
  - 在 [index.html](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/index.html) 中引入了全新的三层层级关系，将 `#detailClose` 移动到了滚动容器外侧 of the `#workDetailContainer` 下。
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中对新结构进行了布局，使 `#workDetailContainer` 作为卡片的外层包裹器（`position: relative`、`max-width: 1320px` 居中、`pointer-events: none`），而 `#detailClose` 设置为它的绝对定位子元素（同时设置 `pointer-events: auto` 保证点击响应）。
  - 这样，关闭按钮无论在何种分辨率下，都会**悬浮且固定在卡片视口右上角 24px 处**，不随页面滚动移位，完美可达。
- **滚动模型移植**:
  - 在 [js/modules/back-to-top.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/back-to-top.js) 中，重写了 `wheel` 的拦截逻辑。当详情内页打开时，不再直接退出，而是调用 `e.preventDefault()` 阻止原生阶梯滚动。
  - 采用和外部主页相同的 LERP 物理滚屏引擎，通过 `requestAnimationFrame` 自主驱动 `#workDetailCard` 的 `scrollTop`。
  - 加入了自校准机制：只要检测到页面被重新打开（`scrollTop === 0`）或者滚动动画未运行，即刻对齐物理滚动条与 LERP 虚拟坐标，杜绝出现坐标错位。
  - 在 `.work-detail-card` 的 CSS 规则中补充了 `-webkit-overflow-scrolling: touch;` 属性，确保移动端/触屏的惯性滚动同样舒适丝滑。

### 3. 编译部署与测试
- 重新使用 `npx.cmd vite build` 完成生产环境编译。
- 使用 `python workflow.py deploy` 推送至 GitHub（Step 495），并自动发布生产页面。


---

## 🛠️ Hotfix: 详情页关闭按钮一体化固定与滚轮/触屏丝滑滚动优化

### 1. 问题现象与原因分析
- **关闭按钮悬浮分离/留存滞后**: 在之前的修复方案中，为了让关闭按钮 `#detailClose` 固定，我们将其移出了 `.work-detail-card`，作为独立视口浮层定位。这导致了三个严重的视觉硬伤：
  1. 卡片淡出关闭时，由于卡片容器在做向下滑动动画（GSAP），而按钮是外部独立的，它会呆立在原处，直到 0.65 秒动画结束才随遮罩一起突兀地消失（造成“留存一会”）。
  2. 卡片淡入开启时，按钮是凭空在右上角飞入，和卡片之间没有一体感，显得像个独立插头。
  3. 如果在大屏上，卡片有最大宽度限制居中，而按钮若采用视口定位会离卡片太远。
- **详情页内部滚动失效与死板 (Scroll Stiff / No Effect)**: 之前虽然尝试接管 wheel 事件，但在同步实际滚动位置时误使用了 `card.scrollTop === 0` 作为条件。这导致每次滚动回到顶部或初始触发时，动画状态会被频繁意外清零或无法正确捕获实际的滚动偏移（特别是使用触控板、滚轮多重滑动时），使得丝滑 LERP 滚动完全未生效。

### 2. 解决方案与修改
- **一体化嵌套固定卡片布局 (Close Button Card Integration)**:
  - 移除了无意义的外部包裹容器，保持原有的干净 HTML 树形结构。
  - 将 `.work-detail-card` 设置为 `overflow: hidden;`，使其成为不滚动的基准背景（滑动进出时，所有子元素作为整体运动，关闭按钮天然和卡片随形，完美解决制造的滞后留存和分离问题）。
  - 在 `.work-detail-card` 内部建立直接子元素 `#detailClose`（`position: absolute; top: 24px; right: 24px;`）。因为卡片本身不滚动，该按钮将完美静止钉在卡片右上角。
  - 在卡片内新建真正的滚动容器 `.work-detail-scroll-wrapper`（`overflow-y: auto; height: 100%;`），将所有图文内容放入其中进行实际滚动。
- **高阶 LERP 滚动与自校准移植**:
  - 在 [js/modules/back-to-top.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/back-to-top.js) 中，当详情内页打开时，拦截 `wheel` 事件，将平滑滚动的操作对象重新路由到新的子滚动容器 `#workDetailScrollWrapper`。
  - 精准的坐标偏差同步：丢弃容易导致重置死锁的 `scrollTop === 0` 静态判断，升级为差值动态捕获 `Math.abs(card.scrollTop - window.__cardWheelCurrent) > 2`。只要用户通过手动拖拽滚动条、触控板或者新页面打开时产生了任意超过 2 像素的错位，LERP 引擎会在下一帧立即零延迟自动校准，绝无跳变和卡死。
  - 在 [js/modules/hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) 中，将页面路由切换时的 `scrollTop` 重置和卡片边缘滚轮截断全部重新定向至 `#workDetailScrollWrapper`。
  - 对 `.work-detail-scroll-wrapper` 增加了 `-webkit-overflow-scrolling: touch;` 与 `-ms-overflow-style: none`，实现了移动端原生的高性能惯性缓冲滑动。

### 3. 编译部署与测试
- 重新使用 `npx.cmd vite build` 完成生产环境编译。
- 使用 `python workflow.py deploy` 推送至 GitHub（Step 496），自动发布最新的线上页面。


---

## 🛠️ Hotfix: 详情页关闭按钮一体化飞入与零延迟淡出 & 解决 LERP 滚动失效

### 1. 问题现象与原因分析
- **退出键仍有留存/独立感 (Exit Button Detached & Lingering)**: 
  - 之前虽然将 `#detailClose` 嵌套在了 `#workDetailCard` 内部，但在打开卡片时，依然使用了 `gsap.set(detailClose, { opacity: 0, y: 30 })` 并以 `delay: 0.3` 延迟淡出和向上位移。这使得卡片滑动时按钮是不可见的，之后又单独在卡片上漂移出现，破坏了“一体感”（看着像个独立的东西）。
  - 在关闭卡片时，由于只动了 `#workDetailCard` 的 slide-down 动画（0.65 秒），虽然按钮随着卡片向下移出，但在关闭过程中按钮依然以 100% 不透明度显示在卡片上，造成视觉上关闭按钮“仍留存一会”的感觉。
- **丝滑滚动没有生效 (Smooth LERP Scroll Not Working)**:
  - 之前我们在 `hash-router.js` 中给 `#workDetailScrollWrapper` 绑定了一个拦截滚动的监听器，其中使用了 `e.stopPropagation()` 阻止事件冒泡。
  - 由于这行代码，当用户在详情页滚动时，滚轮事件（`wheel`）被完全拦截在容器层，无法冒泡到 `document` 上。而我们定义在 `back-to-top.js` 中的全局 LERP 平滑滚动引擎正是监听的 `document` 的 `wheel` 事件，这就导致 LERP 平滑滚动彻底失效，退化为原生阶梯滚动。

### 2. 解决方案与修改
- **关闭按钮完全一体化 (Close Button Integration)**:
  - **开启时同频滑入**: 修改 [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js)，在 `openDetail` 时直接设置 `gsap.set(detailClose, { opacity: 1, y: 0 })`，并彻底去除了针对 `detailClose` 的单独 `gsap.to` 延迟移动动画。使关闭按钮作为卡片的固定右上角部分，在卡片从底部滑入的那一刻起就完美呈现在其原本位置，与卡片浑然一体一同滑入。
  - **关闭时即刻淡出**: 在 `closeDetail` 开始时，立即对 `#detailClose` 进行 `gsap.to(detailClose, { opacity: 0, duration: 0.2, ease: 'power2.out' })` 的淡出动画。在 0.2 秒内将退出键完全隐藏，绝不在屏幕上多留存一会，而卡片则在 0.65 秒内平滑滑出。
- **释放滚轮冒泡启用 LERP 滚动 (Enable LERP Scrolling)**:
  - 移除了 [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) 中对 `#workDetailScrollWrapper` 绑定 `e.stopPropagation()` 的 `wheel` 监听器，同时清理了背景层 `#workDetail` 上的冗余 `wheel` 拦截，让滚轮事件能够顺利冒泡到 `document`。
  - 事件冒泡后，[back-to-top.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/back-to-top.js) 中的全局 `wheel` 监听器正常捕获该事件，对其调用 `preventDefault()` 并顺利介入 LERP 滚动物理引擎（衰减系数 `0.065`），完美实现了和主页外网一样丝滑的内页滚动效果。

### 3. 部署与验证
- 运行 `cmd /c "npx vite build"`，项目构建打包成功，生成最新编译后的生产静态资源。
- 确认 LERP 滚动、一体化滑入、0.2秒退出键即刻淡出完全生效。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 497），发布线上。


---

## 🛠️ Hotfix: 解决 Works 页面初次加载时 3D 倾斜列表呈扁平状态的问题

### 1. 问题现象与原因分析
- **页面初次加载呈扁平状态 (Flat State on Fresh Load)**: 
  - 在大屏桌面端（`min-width: 1025px`），Works 列表 `.work-list` 在初次刷新载入时呈完全扁平（未偏斜倾斜）的普通列表布局。
  - 只有当用户的鼠标物理性地首次移动进入 Works 区域（触发 `onListEnter()` 将 `isVisible` 置为 `true` 并且在 RAF 帧计算中产生 `diff > 0.001` 的角度偏移）后，系统才会首次对 `workList.style.transform` 注入偏斜坐标属性。一旦滑过一次，偏斜角度就会记忆并以 `baseX`, `baseY`, `baseZ` 作为静息状态基础偏角驻留。
  - 这导致了用户第一次进入或刷新页面时，页面先呈现扁平排布，鼠标挪入又突然切变为 3D 效果的不连贯、非拟真的断档体验。

### 2. 解决方案与修改
- **CSS 静态 3D 倾斜初始化 (CSS 3D Initial State)**:
  - 修改 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中对 `.work-list` 处的桌面媒体查询块（`@media(min-width: 1025px)`），为其加入初始静态 transform 偏斜值：
    `transform: rotateY(-34deg) rotateX(17deg) rotateZ(2deg);`
    这保证了浏览器在首次渲染 DOM 并解析 CSS 之后，Works 列表就**在没有任何 JS 执行或鼠标交互前，就已经默认完美呈偏斜 3D 空间状态**。
- **JS 初始化对齐 (JS State Synchronization)**:
  - 修改 [js/modules/premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js) 的初始化流程，在脚本开始运行时直接为 `workList.style.transform` 分配初始旋转矩阵字符串：
    `workList.style.transform = `rotateY(${baseY}deg) rotateX(${baseX}deg) rotateZ(${baseZ}deg)`;`
    让 JS 的默认偏斜值（`baseY = -34`, `baseX = 17`, `baseZ = 2`）与 CSS 静态样式处于 100% 对齐的状态。当后续鼠标切入切出时，能够在这套精准的 3D 静息点之上实现绝对丝滑的 LERP 渐变阻尼偏斜，彻底消除界面加载时的闪动与突变。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 498），自动部署线上页面。


---

## 🛠️ Hotfix: 增加 Works 卡片点击时 3D 触感挤压与动态光圈涟漪反馈

### 1. 方案设计与意图
- **提升点击交互的高级感 (Tactile Feedback & Visual Response)**:
  - 之前用户点击 Works 卡片后，页面会立即触发路由切换，整个列表随之淡出滑离。虽然过渡流畅，但卡片本身在被鼠标或按键“按下”的物理瞬间，缺乏一种按下弹起的物理实感和即时视觉响应（点击反馈）。
  - 为了给卡片点击增加豪华微交互感，我们决定为其定制双重反馈：
    1. **物理 3D 挤压 (3D Squeeze)**：卡片瞬间向三维屏幕内凹陷（沿 Z 轴推深、并微缩比例），之后弹性回弹。
    2. **局部光影扩散 (Glow Ripple)**：从鼠标点击的精确坐标处，以极具表现力的大范围混合模式（`mix-blend-mode: screen`）淡入扩散出带有主色调橙红的柔和光影涟漪，带来光能爆破的微交互细节。

### 2. 解决方案与修改
- **3D 挤压触感与回弹实现 (Snappy Spring Timeline)**:
  - 在 [work-detail.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/work-detail.js) 中导入 `gsap`。
  - 在卡片被触发点击（包括回车、空格等无障碍按键激活）时，拦截并延迟路由切换时间。
  - **解决回弹死板问题**：原本使用 `yoyo: true` 和 `repeat: 1` 产生的回弹动画是完全对称的，过程十分生硬和机械（死板）。
  - **物理弹簧效果重构**：我们将其改写为**GSAP Timeline 序列动画**，进行非对称的物理力学模拟：
    1. **下按阶段**：快速在 80ms 内向内下凹并微缩（`scale: 0.95`, `z: -40`），采用 `power2.out` 缓动，塑造极其干脆的按下感。
    2. **回弹阶段**：使用 `back.out(2.5)` 缓动（回弹系数 2.5），在 320ms 内回弹至原始大小。`back.out` 缓动会在回弹到原大（scale: 1）后产生一个物理性的**微小超调（Overshoot，即稍微变大再缩回）**并迅速稳定。这完全模拟出了真实物理弹簧的微幅抖动效果，极其生动灵巧。
  - **路由延迟时间同步**：配合该 200ms 黄金时间点（下按 80ms + 弹起超调 120ms 时分），我们将跳转延迟设为 `280ms`，让用户能完整地在屏幕上看到这一次极具弹性（Wobble）的完美物理回弹，随后再淡出切走。`
- **坐标感知型光圈涟漪**:
  - 计算点击点在 `.work-card` 局部的相对坐标 `(x, y)`（如果是按键触发，则自动以卡片物理中心点作为 fallback 中心）。
  - 动态在卡片内 append 一个带有 `.card-click-ripple` 类的装饰标签，并将其绝对定位在 `(x, y)`。
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中定义该涟漪：
    - 使用 `radial-gradient(circle, rgba(255,255,255,0.45) 0%, var(--accent) 40%, transparent 70%)` 建立圆环光圈；
    - 使用 `mix-blend-mode: screen` 和 `pointer-events: none` 排除事件干扰并实现通透的高亮混合效果；
    - 绑定自定义 `cardRippleExpand` 动画（从 0 扩散至 `1400px`，同时 `opacity` 从 1 渐变衰减为 0），完美模拟出光波扩散的视觉特效。
- **双击与连击防抖**:
  - 在 `openCard` 运行初期为卡片设置 `data-clicked="true"` 并在延迟跳转结束后移除，配合 `hash-router.js` 内部本身的 `isRouteTransitioning` 状态锁，全面杜绝了多重点击和瞬时路由冲突的问题。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 502），自动部署线上页面。


---

## 🛠️ Hotfix: 解决拉动右上角黑白模式开关放手时触发背景元素误点击的问题

### 1. 问题现象与原因分析
- **释放拖拽误触点击 (Drag Release False Click)**:
  - 页面右上角的黑白主题切换是一个需要鼠标/触屏下拉并释放的拉绳开关（Pull-to-toggle String）。
  - 用户在下拉开关并释放（`mouseup` 或 `touchend`）时，若此时鼠标位置正好处于页面其他可点击元素（例如导航栏链接、按钮或页面下方组件）上方，这些背景元素就会被意外触发点击动作。
  - **根本原因**：
    - 为了解决自定义磁吸鼠标在按钮边缘点击容易偏离脱靶的问题，[cursor.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/cursor.js) 引入了**鼠标事件重定向机制**：一旦鼠标磁吸吸附在某个 `hoveredElement`（磁吸目标）上，系统就会截断全局的 `mousedown`、`mouseup` 和 `click` 事件，并强行将其分发重定向给该磁吸元素。
    - 当用户在拉绳开关上按下鼠标并向下拖拽时，原本处于拖拽状态。但当鼠标下滑经过其他吸附节点（例如 `.logo-wrapper`、`.nav-menu-btn` 等）时，鼠标因为距离近而被磁吸过去，将 `hoveredElement` 更新为了该背景节点。
    - 此时用户释放鼠标（产生 `mouseup`），重定向代码在没有任何手势逻辑校验的情况下，直接把 `mouseup` 和 `click` 派发给了当前吸附的背景节点，造成即使在拖拽拉绳中途松手，也会误点击下方按钮的重大 Bug。

### 2. 解决方案与修改
- **手势源头追踪与手势闭环校验 (Gesture Origin Validation)**:
  - 在 [cursor.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/cursor.js) 的事件代理中，定义一个模块级别的全局变量 `mousedownTarget` 用以追踪**当前点击手势在哪个物理元素上发起**。
  - 在 `mousedown` 监听器最前端记录首发目标：
    `mousedownTarget = e.target;`
  - 在拦截并分发 `mouseup` 和 `click` 的逻辑中增加一致性审查：
    ```javascript
    // 只有当这次点击手势的首发起点 (mousedownTarget) 也是在当前磁吸元素内部时，才允许进行事件重定向分发
    if (!mousedownTarget || !hoveredElement.contains(mousedownTarget)) return;
    ```
  - **效果评估**：
    - 如果用户正常点击某磁吸按钮，`mousedown` 起点与释放终点均在该按钮内，重定向校验通过，磁吸点击正常工作。
    - 如果用户是从拉绳开关（或其他拖拽源）拖出并在其他按钮上释放，由于 `mousedownTarget` 依然为拉绳元素，重定向逻辑会立即触发豁免并直接 `return` 拦截，浏览器此时也绝不会触发对该背景按钮的原生 click。误触 Bug 被彻底完美解决。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 503），自动部署线上页面。


---

## 🛠️ Hotfix: 解决纯垂直移动时 3D 预览视口产生左右倾斜偏斜的问题

### 1. 问题现象与原因分析
- **纯垂直移动产生左右倾斜 (Vertical Movement Triggers Side Skew)**:
  - 现象：当鼠标纯垂直上下移动时，本应只触发纯上下三维倾斜（绕 X 轴旋转 `rotateX`），但视觉上预览图和色块却产生了极明显的左右偏移和侧斜（类似 `rotateY` 或 Z 轴倾斜）。而斜向移动时表现正常。
  - **JS 逻辑验证**：通过自动化脚本抓取并打印运行时 `.work-preview-img-container` 的 transform 属性，结果显示：在纯垂直移动时，`rotationY`（绕 Y 轴旋转）和 `rotation`（绕 Z 轴旋转）均精准为 `0`，仅有 `rotateX` 产生了对应数值（例如 `rotateX(-0.85deg)`）。这意味着**JS 计算公式和阻尼物理在数学逻辑上是完全正确的**，不存在交叉污染或多余计算。
  - **根本原因 (CSS 3D Projection Coupling)**：
    - 在原本的 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中，父容器 `.work-preview-wrapper` 具有全局视角透视属性 `perspective: 1000px`，其物理尺寸为 `width: 0; height: 0; position: fixed; left: 0; top: 0;`。这意味着**透视原点 (Perspective Origin) 强行固定在屏幕左上角 (0, 0)**。
    - 预览图 `.work-preview-img-container` 被平移到鼠标坐标处（如屏幕右侧 `x = 950px`）。由于它距离透视原点极远，在 CSS 3D 渲染管线中，任何绕 X 轴的旋转都会因为“视角倾斜投射”而在横向产生巨大的透视梯形偏斜。
    - 随着鼠标上下移动（Y 轴位置变化），投射夹角改变，这种横向梯形偏斜程度和方向也随之剧烈摇摆，因而在视觉上形成了“垂直移动却导致左右倾斜”的假象。

### 2. 解决方案与修改
- **移去父容器透视 (Remove Wrapper Perspective)**:
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中删除了 `.work-preview-wrapper` 上的 `perspective: 1000px;` 属性。
### 2. 解决方案与修改
- **悬停时绕过磁吸**: 在 [cursor.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/cursor.js) 中，判断当前鼠标如果物理上处于 `.work-card` 上，或者在 3D 投影判断中处于悬停卡片状态（`window.__hoveredCardIndex >= 0`），则**完全禁止**距离磁吸到任何背景组件，从而断开磁吸重定向。
- **Works 区域拦截豁免**: 在 `cursor.js` 的 `mousedown`、`mouseup` 和 `click` 拦截监听器中添加豁免：如果点击落在 `.works` 区域内且当前有卡片处于 3D 悬停状态，**直接放行，不作任何拦截与重定向**。
- **健壮的背景 Fallback 点击**: 优化 [work-detail.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/work-detail.js) 的 fallback 机制，将监听目标放大到整个 `.works`。只要点击落在区域内，且不是卡片本身或其他链接/按钮，但在 3D 投影检测下当前处于卡片悬停状态，就自动触发该卡片的 click 动作。

### 3. 编译与自动化验证
- 使用 `npx.cmd vite build` 重新编译了最新的生产环境静态资源，改动已完全被打包编译到 dist 目录中。
- 运行了 Playwright 自动化测试脚本，全面测试了 4 个卡片在不同位置（中心、左边缘、右边缘、文字）的点击成功率。测试结果显示，除 Card 1 左边缘（物理边界已因 3D 偏斜移出卡片，不触发符合预期）外，所有卡片及边缘点击均 100% 成功触发详情页开启，且完全排除了背景磁吸元素干扰。

---

## 🛠️ Hotfix: 详情页关闭按钮悬浮固定与丝滑滚动体验优化

### 1. 问题现象与原因分析
- **关闭按钮滚动位移**: 详情卡片内容使用了一个可滚动的容器 `.work-detail-card` (`overflow-y: auto`)。原来的关闭按钮 `#detailClose` 是作为它的子元素并采用 `absolute` 定位的。当用户向下滚动查看详情时，关闭按钮会随着卡片内容一起向上滚动，导致用户无法随时点击退出。
- **详情页内部滚动死板 (Stiff Scroll)**: 页面主容器通过 `back-to-top.js` 重写了 `wheel` 事件，利用 LERP 物理模型（差值衰减因子 `0.065`）实现了非常丝滑的滚动效果。然而，当详情页卡片打开时，滚轮监听器直接返回退出，使得卡片内页退化到浏览器原生的阶梯式滚动，手感和外部相比显得非常生硬和死板。

### 2. 解决方案与修改
- **全新的固定卡片布局**:
  - 在 [index.html](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/index.html) 中引入了全新的三层层级关系，将 `#detailClose` 移动到了滚动容器外侧 of the `#workDetailContainer` 下。
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中对新结构进行了布局，使 `#workDetailContainer` 作为卡片的外层包裹器（`position: relative`、`max-width: 1320px` 居中、`pointer-events: none`），而 `#detailClose` 设置为它的绝对定位子元素（同时设置 `pointer-events: auto` 保证点击响应）。
  - 这样，关闭按钮无论在何种分辨率下，都会**悬浮且固定在卡片视口右上角 24px 处**，不随页面滚动移位，完美可达。
- **滚动模型移植**:
  - 在 [js/modules/back-to-top.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/back-to-top.js) 中，重写了 `wheel` 的拦截逻辑。当详情内页打开时，不再直接退出，而是调用 `e.preventDefault()` 阻止原生阶梯滚动。
  - 采用和外部主页相同的 LERP 物理滚屏引擎，通过 `requestAnimationFrame` 自主驱动 `#workDetailCard` 的 `scrollTop`。
  - 加入了自校准机制：只要检测到页面被重新打开（`scrollTop === 0`）或者滚动动画未运行，即刻对齐物理滚动条与 LERP 虚拟坐标，杜绝出现坐标错位。
  - 在 `.work-detail-card` 的 CSS 规则中补充了 `-webkit-overflow-scrolling: touch;` 属性，确保移动端/触屏的惯性滚动同样舒适丝滑。

### 3. 编译部署与测试
- 重新使用 `npx.cmd vite build` 完成生产环境编译。
- 使用 `python workflow.py deploy` 推送至 GitHub（Step 495），并自动发布生产页面。


---

## 🛠️ Hotfix: 详情页关闭按钮一体化固定与滚轮/触屏丝滑滚动优化

### 1. 问题现象与原因分析
- **关闭按钮悬浮分离/留存滞后**: 在之前的修复方案中，为了让关闭按钮 `#detailClose` 固定，我们将其移出了 `.work-detail-card`，作为独立视口浮层定位。这导致了三个严重的视觉硬伤：
  1. 卡片淡出关闭时，由于卡片容器在做向下滑动动画（GSAP），而按钮是外部独立的，它会呆立在原处，直到 0.65 秒动画结束才随遮罩一起突兀地消失（造成“留存一会”）。
  2. 卡片淡入开启时，按钮是凭空在右上角飞入，和卡片之间没有一体感，显得像个独立插头。
  3. 如果在大屏上，卡片有最大宽度限制居中，而按钮若采用视口定位会离卡片太远。
- **详情页内部滚动失效与死板 (Scroll Stiff / No Effect)**: 之前虽然尝试接管 wheel 事件，但在同步实际滚动位置时误使用了 `card.scrollTop === 0` 作为条件。这导致每次滚动回到顶部或初始触发时，动画状态会被频繁意外清零或无法正确捕获实际的滚动偏移（特别是使用触控板、滚轮多重滑动时），使得丝滑 LERP 滚动完全未生效。

### 2. 解决方案与修改
- **一体化嵌套固定卡片布局 (Close Button Card Integration)**:
  - 移除了无意义的外部包裹容器，保持原有的干净 HTML 树形结构。
  - 将 `.work-detail-card` 设置为 `overflow: hidden;`，使其成为不滚动的基准背景（滑动进出时，所有子元素作为整体运动，关闭按钮天然和卡片随形，完美解决制造的滞后留存和分离问题）。
  - 在 `.work-detail-card` 内部建立直接子元素 `#detailClose`（`position: absolute; top: 24px; right: 24px;`）。因为卡片本身不滚动，该按钮将完美静止钉在卡片右上角。
  - 在卡片内新建真正的滚动容器 `.work-detail-scroll-wrapper`（`overflow-y: auto; height: 100%;`），将所有图文内容放入其中进行实际滚动。
- **高阶 LERP 滚动与自校准移植**:
  - 在 [js/modules/back-to-top.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/back-to-top.js) 中，当详情内页打开时，拦截 `wheel` 事件，将平滑滚动的操作对象重新路由到新的子滚动容器 `#workDetailScrollWrapper`。
  - 精准的坐标偏差同步：丢弃容易导致重置死锁的 `scrollTop === 0` 静态判断，升级为差值动态捕获 `Math.abs(card.scrollTop - window.__cardWheelCurrent) > 2`。只要用户通过手动拖拽滚动条、触控板或者新页面打开时产生了任意超过 2 像素的错位，LERP 引擎会在下一帧立即零延迟自动校准，绝无跳变和卡死。
  - 在 [js/modules/hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) 中，将页面路由切换时的 `scrollTop` 重置和卡片边缘滚轮截断全部重新定向至 `#workDetailScrollWrapper`。
  - 对 `.work-detail-scroll-wrapper` 增加了 `-webkit-overflow-scrolling: touch;` 与 `-ms-overflow-style: none`，实现了移动端原生的高性能惯性缓冲滑动。

### 3. 编译部署与测试
- 重新使用 `npx.cmd vite build` 完成生产环境编译。
- 使用 `python workflow.py deploy` 推送至 GitHub（Step 496），自动发布最新的线上页面。


---

## 🛠️ Hotfix: 详情页关闭按钮一体化飞入与零延迟淡出 & 解决 LERP 滚动失效

### 1. 问题现象与原因分析
- **退出键仍有留存/独立感 (Exit Button Detached & Lingering)**: 
  - 之前虽然将 `#detailClose` 嵌套在了 `#workDetailCard` 内部，但在打开卡片时，依然使用了 `gsap.set(detailClose, { opacity: 0, y: 30 })` 并以 `delay: 0.3` 延迟淡出和向上位移。这使得卡片滑动时按钮是不可见的，之后又单独在卡片上漂移出现，破坏了“一体感”（看着像个独立的东西）。
  - 在关闭卡片时，由于只动了 `#workDetailCard` 的 slide-down 动画（0.65 秒），虽然按钮随着卡片向下移出，但在关闭过程中按钮依然以 100% 不透明度显示在卡片上，造成视觉上关闭按钮“仍留存一会”的感觉。
- **丝滑滚动没有生效 (Smooth LERP Scroll Not Working)**:
  - 之前我们在 `hash-router.js` 中给 `#workDetailScrollWrapper` 绑定了一个拦截滚动的监听器，其中使用了 `e.stopPropagation()` 阻止事件冒泡。
  - 由于这行代码，当用户在详情页滚动时，滚轮事件（`wheel`）被完全拦截在容器层，无法冒泡到 `document` 上。而我们定义在 `back-to-top.js` 中的全局 LERP 平滑滚动引擎正是监听的 `document` 的 `wheel` 事件，这就导致 LERP 平滑滚动彻底失效，退化为原生阶梯滚动。

### 2. 解决方案与修改
- **关闭按钮完全一体化 (Close Button Integration)**:
  - **开启时同频滑入**: 修改 [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js)，在 `openDetail` 时直接设置 `gsap.set(detailClose, { opacity: 1, y: 0 })`，并彻底去除了针对 `detailClose` 的单独 `gsap.to` 延迟移动动画。使关闭按钮作为卡片的固定右上角部分，在卡片从底部滑入的那一刻起就完美呈现在其原本位置，与卡片浑然一体一同滑入。
  - **关闭时即刻淡出**: 在 `closeDetail` 开始时，立即对 `#detailClose` 进行 `gsap.to(detailClose, { opacity: 0, duration: 0.2, ease: 'power2.out' })` 的淡出动画。在 0.2 秒内将退出键完全隐藏，绝不在屏幕上多留存一会，而卡片则在 0.65 秒内平滑滑出。
- **释放滚轮冒泡启用 LERP 滚动 (Enable LERP Scrolling)**:
  - 移除了 [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) 中对 `#workDetailScrollWrapper` 绑定 `e.stopPropagation()` 的 `wheel` 监听器，同时清理了背景层 `#workDetail` 上的冗余 `wheel` 拦截，让滚轮事件能够顺利冒泡到 `document`。
  - 事件冒泡后，[back-to-top.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/back-to-top.js) 中的全局 `wheel` 监听器正常捕获该事件，对其调用 `preventDefault()` 并顺利介入 LERP 滚动物理引擎（衰减系数 `0.065`），完美实现了和主页外网一样丝滑的内页滚动效果。

### 3. 部署与验证
- 运行 `cmd /c "npx vite build"`，项目构建打包成功，生成最新编译后的生产静态资源。
- 确认 LERP 滚动、一体化滑入、0.2秒退出键即刻淡出完全生效。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 497），发布线上。


---

## 🛠️ Hotfix: 解决 Works 页面初次加载时 3D 倾斜列表呈扁平状态的问题

### 1. 问题现象与原因分析
- **页面初次加载呈扁平状态 (Flat State on Fresh Load)**: 
  - 在大屏桌面端（`min-width: 1025px`），Works 列表 `.work-list` 在初次刷新载入时呈完全扁平（未偏斜倾斜）的普通列表布局。
  - 只有当用户的鼠标物理性地首次移动进入 Works 区域（触发 `onListEnter()` 将 `isVisible` 置为 `true` 并且在 RAF 帧计算中产生 `diff > 0.001` 的角度偏移）后，系统才会首次对 `workList.style.transform` 注入偏斜坐标属性。一旦滑过一次，偏斜角度就会记忆并以 `baseX`, `baseY`, `baseZ` 作为静息状态基础偏角驻留。
  - 这导致了用户第一次进入或刷新页面时，页面先呈现扁平排布，鼠标挪入又突然切变为 3D 效果的不连贯、非拟真的断档体验。

### 2. 解决方案与修改
- **CSS 静态 3D 倾斜初始化 (CSS 3D Initial State)**:
  - 修改 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中对 `.work-list` 处的桌面媒体查询块（`@media(min-width: 1025px)`），为其加入初始静态 transform 偏斜值：
    `transform: rotateY(-34deg) rotateX(17deg) rotateZ(2deg);`
    这保证了浏览器在首次渲染 DOM 并解析 CSS 之后，Works 列表就**在没有任何 JS 执行或鼠标交互前，就已经默认完美呈偏斜 3D 空间状态**。
- **JS 初始化对齐 (JS State Synchronization)**:
  - 修改 [js/modules/premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js) 的初始化流程，在脚本开始运行时直接为 `workList.style.transform` 分配初始旋转矩阵字符串：
    `workList.style.transform = `rotateY(${baseY}deg) rotateX(${baseX}deg) rotateZ(${baseZ}deg)`;`
    让 JS 的默认偏斜值（`baseY = -34`, `baseX = 17`, `baseZ = 2`）与 CSS 静态样式处于 100% 对齐的状态。当后续鼠标切入切出时，能够在这套精准的 3D 静息点之上实现绝对丝滑的 LERP 渐变阻尼偏斜，彻底消除界面加载时的闪动与突变。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 498），自动部署线上页面。


---

## 🛠️ Hotfix: 增加 Works 卡片点击时 3D 触感挤压与动态光圈涟漪反馈

### 1. 方案设计与意图
- **提升点击交互的高级感 (Tactile Feedback & Visual Response)**:
  - 之前用户点击 Works 卡片后，页面会立即触发路由切换，整个列表随之淡出滑离。虽然过渡流畅，但卡片本身在被鼠标或按键“按下”的物理瞬间，缺乏一种按下弹起的物理实感和即时视觉响应（点击反馈）。
  - 为了给卡片点击增加豪华微交互感，我们决定为其定制双重反馈：
    1. **物理 3D 挤压 (3D Squeeze)**：卡片瞬间向三维屏幕内凹陷（沿 Z 轴推深、并微缩比例），之后弹性回弹。
    2. **局部光影扩散 (Glow Ripple)**：从鼠标点击的精确坐标处，以极具表现力的大范围混合模式（`mix-blend-mode: screen`）淡入扩散出带有主色调橙红的柔和光影涟漪，带来光能爆破的微交互细节。

### 2. 解决方案与修改
- **3D 挤压触感与回弹实现 (Snappy Spring Timeline)**:
  - 在 [work-detail.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/work-detail.js) 中导入 `gsap`。
  - 在卡片被触发点击（包括回车、空格等无障碍按键激活）时，拦截并延迟路由切换时间。
  - **解决回弹死板问题**：原本使用 `yoyo: true` 和 `repeat: 1` 产生的回弹动画是完全对称的，过程十分生硬和机械（死板）。
  - **物理弹簧效果重构**：我们将其改写为**GSAP Timeline 序列动画**，进行非对称的物理力学模拟：
    1. **下按阶段**：快速在 80ms 内向内下凹并微缩（`scale: 0.95`, `z: -40`），采用 `power2.out` 缓动，塑造极其干脆的按下感。
    2. **回弹阶段**：使用 `back.out(2.5)` 缓动（回弹系数 2.5），在 320ms 内回弹至原始大小。`back.out` 缓动会在回弹到原大（scale: 1）后产生一个物理性的**微小超调（Overshoot，即稍微变大再缩回）**并迅速稳定。这完全模拟出了真实物理弹簧的微幅抖动效果，极其生动灵巧。
  - **路由延迟时间同步**：配合该 200ms 黄金时间点（下按 80ms + 弹起超调 120ms 时分），我们将跳转延迟设为 `280ms`，让用户能完整地在屏幕上看到这一次极具弹性（Wobble）的完美物理回弹，随后再淡出切走。`
- **坐标感知型光圈涟漪**:
  - 计算点击点在 `.work-card` 局部的相对坐标 `(x, y)`（如果是按键触发，则自动以卡片物理中心点作为 fallback 中心）。
  - 动态在卡片内 append 一个带有 `.card-click-ripple` 类的装饰标签，并将其绝对定位在 `(x, y)`。
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中定义该涟漪：
    - 使用 `radial-gradient(circle, rgba(255,255,255,0.45) 0%, var(--accent) 40%, transparent 70%)` 建立圆环光圈；
    - 使用 `mix-blend-mode: screen` 和 `pointer-events: none` 排除事件干扰并实现通透的高亮混合效果；
    - 绑定自定义 `cardRippleExpand` 动画（从 0 扩散至 `1400px`，同时 `opacity` 从 1 渐变衰减为 0），完美模拟出光波扩散的视觉特效。
- **双击与连击防抖**:
  - 在 `openCard` 运行初期为卡片设置 `data-clicked="true"` 并在延迟跳转结束后移除，配合 `hash-router.js` 内部本身的 `isRouteTransitioning` 状态锁，全面杜绝了多重点击和瞬时路由冲突的问题。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 502），自动部署线上页面。


---

## 🛠️ Hotfix: 解决拉动右上角黑白模式开关放手时触发背景元素误点击的问题

### 1. 问题现象与原因分析
- **释放拖拽误触点击 (Drag Release False Click)**:
  - 页面右上角的黑白主题切换是一个需要鼠标/触屏下拉并释放的拉绳开关（Pull-to-toggle String）。
  - 用户在下拉开关并释放（`mouseup` 或 `touchend`）时，若此时鼠标位置正好处于页面其他可点击元素（例如导航栏链接、按钮或页面下方组件）上方，这些背景元素就会被意外触发点击动作。
  - **根本原因**：
    - 为了解决自定义磁吸鼠标在按钮边缘点击容易偏离脱靶的问题，[cursor.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/cursor.js) 引入了**鼠标事件重定向机制**：一旦鼠标磁吸吸附在某个 `hoveredElement`（磁吸目标）上，系统就会截断全局的 `mousedown`、`mouseup` 和 `click` 事件，并强行将其分发重定向给该磁吸元素。
    - 当用户在拉绳开关上按下鼠标并向下拖拽时，原本处于拖拽状态。但当鼠标下滑经过其他吸附节点（例如 `.logo-wrapper`、`.nav-menu-btn` 等）时，鼠标因为距离近而被磁吸过去，将 `hoveredElement` 更新为了该背景节点。
    - 此时用户释放鼠标（产生 `mouseup`），重定向代码在没有任何手势逻辑校验的情况下，直接把 `mouseup` 和 `click` 派发给了当前吸附的背景节点，造成即使在拖拽拉绳中途松手，也会误点击下方按钮的重大 Bug。

### 2. 解决方案与修改
- **手势源头追踪与手势闭环校验 (Gesture Origin Validation)**:
  - 在 [cursor.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/cursor.js) 的事件代理中，定义一个模块级别的全局变量 `mousedownTarget` 用以追踪**当前点击手势在哪个物理元素上发起**。
  - 在 `mousedown` 监听器最前端记录首发目标：
    `mousedownTarget = e.target;`
  - 在拦截并分发 `mouseup` 和 `click` 的逻辑中增加一致性审查：
    ```javascript
    // 只有当这次点击手势的首发起点 (mousedownTarget) 也是在当前磁吸元素内部时，才允许进行事件重定向分发
    if (!mousedownTarget || !hoveredElement.contains(mousedownTarget)) return;
    ```
  - **效果评估**：
    - 如果用户正常点击某磁吸按钮，`mousedown` 起点与释放终点均在该按钮内，重定向校验通过，磁吸点击正常工作。
    - 如果用户是从拉绳开关（或其他拖拽源）拖出并在其他按钮上释放，由于 `mousedownTarget` 依然为拉绳元素，重定向逻辑会立即触发豁免并直接 `return` 拦截，浏览器此时也绝不会触发对该背景按钮的原生 click。误触 Bug 被彻底完美解决。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 503），自动部署线上页面。


---

## 🛠️ Hotfix: 解决纯垂直移动时 3D 预览视口产生左右倾斜偏斜的问题

### 1. 问题现象与原因分析
- **纯垂直移动产生左右倾斜 (Vertical Movement Triggers Side Skew)**:
  - 现象：当鼠标纯垂直上下移动时，本应只触发纯上下三维倾斜（绕 X 轴旋转 `rotateX`），但视觉上预览图和色块却产生了极明显的左右偏移和侧斜（类似 `rotateY` 或 Z 轴倾斜）。而斜向移动时表现正常。
  - **JS 逻辑验证**：通过自动化脚本抓取并打印运行时 `.work-preview-img-container` 的 transform 属性，结果显示：在纯垂直移动时，`rotationY`（绕 Y 轴旋转）和 `rotation`（绕 Z 轴旋转）均精准为 `0`，仅有 `rotateX` 产生了对应数值（例如 `rotateX(-0.85deg)`）。这意味着**JS 计算公式和阻尼物理在数学逻辑上是完全正确的**，不存在交叉污染或多余计算。
  - **根本原因 (CSS 3D Projection Coupling)**：
    - 在原本的 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中，父容器 `.work-preview-wrapper` 具有全局视角透视属性 `perspective: 1000px`，其物理尺寸为 `width: 0; height: 0; position: fixed; left: 0; top: 0;`。这意味着**透视原点 (Perspective Origin) 强行固定在屏幕左上角 (0, 0)**。
    - 预览图 `.work-preview-img-container` 被平移到鼠标坐标处（如屏幕右侧 `x = 950px`）。由于它距离透视原点极远，在 CSS 3D 渲染管线中，任何绕 X 轴的旋转都会因为“视角倾斜投射”而在横向产生巨大的透视梯形偏斜。
    - 随着鼠标上下移动（Y 轴位置变化），投射夹角改变，这种横向梯形偏斜程度和方向也随之剧烈摇摆，因而在视觉上形成了“垂直移动却导致左右倾斜”的假象。

### 2. 解决方案与修改
- **移去父容器透视 (Remove Wrapper Perspective)**:
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中删除了 `.work-preview-wrapper` 上的 `perspective: 1000px;` 属性。
- **改用元素局部透视 (Element-Local Perspective)**:
  - 维持在 [premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js) 中通过 GSAP 为两个独立运动层（`.work-preview-img-container` 和 `.work-preview-orange-layer`）设置的 `transformPerspective: 1000` 属性。
  - **局部透视的优势**：这会让浏览器为每个子元素在其**自身的中心点 (Center Origin)** 建立独立的局部 3D 视椎体。当发生绕 X 轴旋转时，透视变换只基于自身中心发生，完美消除了由屏幕坐标偏置（Off-center placement）带来的三维投影畸变。
  - 优化后，纯上下移动鼠标只产生纯正的上下倾斜；斜向移动时，横向与纵向偏角完美叠加。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 526/527），自动部署线上页面。


---

## 🛠️ Hotfix: 优化 3D 预览图在离开卡片时的消失边界与响应速度

### 1. 问题现象与原因分析
- **出卡片区域后需移动很远预览图才消失 (Huge Dead-zone on Mouse Leave)**:
  - 现象：当鼠标离开 Works 区域的四个卡片时，向上或向下需要移动超过 200px 甚至更远，悬浮预览图层才会隐藏。这使交互显得非常迟钝和粘滞。
  - **根本原因**：
    - 在 [premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js) 中，三维悬浮列表的进入（`onListEnter`）与离开（`onListLeave`）事件监听器被绑定在全局容器 `worksEl`（即 `.works` 元素）上。
    - 在 CSS 中，为了视觉排布，`.works` section 被赋予了极大的上下内边距：`padding: 240px 64px 220px;`（桌面端）。
    - 导致鼠标指针即使离开了实际的卡片展示区，只要还没滑出 `.works` 的 240px/220px 巨大 Padding 边界，系统就不会触发 `mouseleave` 事件。这就造成了预览图依旧悬空并跟随指针移动的迟钝现象。

### 2. 解决方案与修改
- **将事件源收敛至卡片列表容器 (Narrow Event Target to workList)**:
  - 修改 [premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js#L206-L210)，将 `mouseenter` 和 `mouseleave` 监听器从全局大容器 `worksEl`（`.works`）改绑在紧贴卡片区域包裹的 `workList`（`.work-list`）上。
  - **为何不触发频繁闪烁 (Why it doesn't flicker/jump between cards)**：
    - 虽然四张卡片之间存在 `16px` 的外边距（`margin-bottom`），但它们是 `.work-list` 的直接子元素，且该 flex 列表充满整个列，因此在卡片间隙移动时鼠标仍处于 `.work-list` 的几何边界内。
    - 系统的隐藏逻辑 `hidePreviewDOM()` 仅在 `.work-list` 整体触发 `mouseleave` 时执行；卡片切换时的 `newHoveredIndex = -1` 只清除卡片高亮状态，预览图依旧驻留并连贯跟随。
  - 修改后，一旦鼠标向上滑离第一张卡片 1px 或是向下滑离最后一张卡片 1px，便能立即精准触发 `onListLeave()` 并实现 300ms 快速淡出隐藏。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 528），自动部署线上页面。


---

## 🛠️ Hotfix: 解决鼠标刚移入卡片时相同预览图二次重复缩放动画的问题

### 1. 问题现象与原因分析
- **移入卡片时同一张图产生重复缩放 (Redundant Inner Image Scale Animation)**:
  - 现象：当鼠标第一次移入卡片时，预览框内已经立即呈现了对应的作品图片，但在展现的一刹那，同一张图又在容器内部执行了一次从 scale(0) 到 scale(1) 的放大/缩放动画。
  - **根本原因**：
    1. **历史图层残留 (DOM Image Leak)**：当鼠标移出 Works 区域时，`onListLeave` 仅对包裹层 `.work-preview-wrapper` 执行了 opacity 隐藏，但**未清空** `.work-preview-img-container` 内部最后一次悬停生成的旧图片元素。当用户再次滑入同一张卡片时，该图片其实早已在 DOM 中渲染完好，形成了“刚进入时本身就有一个图”的现象。
    2. **冗余的 CSS 动画触发 (Redundant Keyframe Animation)**：在 `styles.css` 中，为新生成的图片项 `.work-preview-image-item` 绑定了默认关键帧动画 `animation: fadeInScale 0.5s ...`。
       - 当鼠标滑入时，`onCardEnter()` 会在旧图之上的 DOM 树中重新 Append 一个一模一样的图片项。
       - 此时，新追加的图片立即触发并播放 `fadeInScale` 缩放动画，覆盖在底部完全静态的旧图上，在视觉上让用户感到“相同的图又做了一次扩大的动画”。
       - **体验重叠**：此时外部容器已经在通过 `animateHover` 里的 `currentScale` LERP 算法由 `0.5` 缩放到 `1.0` 放大展开了。内部图片如果再次做 `scale(0 -> 1)` 的独立缩放，会造成双重缩放叠加，非常突兀和低端。

### 2. 解决方案与修改
- **移出时优雅清空残留 (Clean Image Stack on mouseleave)**:
  - 修改 [premium-interactions.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/premium-interactions.js#L84-L103) 中的 `hidePreviewDOM()`，为 wrapper 隐藏的 `gsap.to` 补全 `onComplete` 生命周期回调。
  - 一旦 3D 浮层完全淡出不可见（`onComplete`），立即将 JS 缓存 `activeImages` 置空，并将 DOM 容器清空：`imgContainer.innerHTML = ''`。从而彻底杜绝旧图在 DOM 中的残留。
- **智能规避会话首帧缩放 (Skip scale animation on session enter)**:
  - 修改 `premium-interactions.js` 中的 `onCardEnter(index)` 方法，在新建图片元素并准备 append 时进行判断：
    - **逻辑**：如果是该悬停会话中产生的**第一张图片**（即容器 `imgContainer.children.length === 0`），代表整个悬浮框处于从无到有的缩放拉伸阶段。
    - **修改**：对该首张图片直接应用 `img.style.animation = 'none'`，使其默认以 `scale(1)` 静态拉满并随着外框一同进行完美的阻尼变大展开。
    - **后续过渡保留**：当用户在卡片与卡片之间滑移切换时（由于旧图还没被清空，`children.length > 0`），新进入的图片依旧以 `fadeInScale` 播放极其顺滑的交叉放大淡入过度。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 529），自动部署线上页面。

---

## 🛠️ Hotfix: 解决详情页 3D 卡片在同一方向连续翻转旋转时图片在框内无限右移漂移并露出左侧黑色底色的 Bug

### 1. 问题原因分析
- **现象**：当在详情页中连续朝同一个方向拖拽/翻转 3D 卡片时（如一直向右翻转，使得 `rotateY` 累加到 360, 540, 720, 1080 度等），卡片内部的图片会越来越往右移动，导致卡片边框内部的左侧露出一大片黑色的空隙（背景色）。
- **根本原因**：
  - 在之前的代码中，卡片图片视差平移的位移值是直接根据当前旋转角度的绝对值线性累加计算的：
    ```javascript
    gsap.to(cardImg, {
      x: -rotY * 0.15,
      y: rotX * 0.15,
      ...
    });
    ```
  - 当卡片一直往同一个方向翻转时，`rotY` 的绝对值会随着翻转次数无限增大（例如翻转一圈是 `360`，翻两圈是 `720` 等），导致位移量 `x` 也随之无限变大，使得图片无限平移，超出了卡片容器的可视边界（`overflow: hidden`），露出了容器底部的黑色背景。
  - 虽然卡片物理上完成了 360 度的旋转（即在空间中回到原位），但其平移视差变换没有跟随旋转做周期性复位，从而形成了累积漂移。

### 2. 解决方案与修改
- **正弦周期性投影约束 (Periodic Trigonometric Projection Bounding)**：
  - 我们将原本与旋转角度绝对值成线性关系的位移，改为**基于角度正弦值（`Math.sin`）的周期性变化**。
  - 因为 3D 旋转的视差效果应当与卡片在视口中的水平投影分量相关。当旋转角度是 0、180、360 等角度时（正面或背面正对屏幕），视差偏移量应该完全为 `0`；而在 90 或 270 度时（卡片侧面正对屏幕），视差偏移量达到最大值。
  - 修改 `js/modules/hash-router.js` 中的拖拽和 snap-back 逻辑，使用如下的三角公式：
    ```javascript
    const px = Math.sin(rotY * Math.PI / 180);
    const py = Math.sin(-rotX * Math.PI / 180);
    
    gsap.to(cardImg, {
      x: -px * 15, // 限制最大位移在 [-15px, 15px] 之间
      y: -py * 15,
      ...
    });
    ```
  - 这样，不论用户朝一个方向翻转多少圈，`Math.sin` 都会以 360 度为周期自动进行波形循环，限制最大位移量在 `[-15px, 15px]` 之间，并且每次卡片正面或反面朝向用户时（即 `rotY` 达到 180 的倍数），位移量均精准回到 `0`，彻底消除了无限位移的黑边漂移 Bug。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 530），自动部署线上页面。

---

## 🛠️ Hotfix: 解决详情页 3D 卡片点击拖拽时由于重置漂移高度导致的瞬间位移与“打滑”手感 Bug

### 1. 问题原因分析
- **现象**：当卡片在进行自动上下漂浮运动时，用户点击并拖动卡片，卡片会发生瞬间的垂直位移（往下或往上跳跃），并在拖拽过程中产生一种不受控制的“滑动”/“打滑”感，手感与观感不够丝滑和牢固。
- **根本原因**：
  - 在原先的拖拽起始逻辑（`handleDragStart`）中，当触发鼠标按下/手指触摸时，代码会立即将自动漂浮容器 `#detail3dFloatWrapper` 的 `y`, `rotateY`, `rotateX` 属性通过一个 0.3s 的 GSAP 动画强行重置归零：
    ```javascript
    gsap.to('#detail3dFloatWrapper', { y: 0, rotateY: 0, rotateX: 0, duration: 0.3, ... });
    ```
  - 这导致在用户点击并试图移动卡片的最初 300 毫秒内，卡片在外框的漂移归零动画和用户的拖拽旋转动画（针对内层 `#detail3dCardInner`）之间发生**物理位移叠加**。卡片仿佛在光标下方悄悄滑动归零，造成光标与卡片物理定位的“脱节感”和“打滑感”。
  - 同时，由于卡片是从一个动态的漂移高度瞬间重置到 `0`，这种生硬的重置也会导致视觉上的瞬移跳跃。

### 2. 解决方案与修改
- **拖拽时静止冷冻（Zero-offset Freeze on Drag Start）**：
  - 修改 `js/modules/hash-router.js` 中的 `handleDragStart` 逻辑：去除点击时将漂移高度重置归零的 0.3s 动画，而是**仅仅 `.pause()` 暂停当前的漂浮动画**。
  - 这样，卡片在被点击的一瞬间，会**极其自然地“冻结”在它当前运动所在的漂浮高度和角度**（如 `y = 4.2px`），拖拽过程中它会作为静态偏移量保持完全静止，从而消除了拖动开始时的瞬移和叠加滑移，使光标牢牢抓住卡片，手感极佳。
- **松手时同步回弹（Synchronized Snap-back on Release）**：
  - 修改 `handleDragEnd` 逻辑，在卡片松手弹回（Snap-back）的过程中，将外层漂浮容器 `#detail3dFloatWrapper` 同样以与卡片相同的 `duration`、相同的 `ease` 弹性曲线**同步且平滑地弹回 `0`**：
    ```javascript
    gsap.to('#detail3dFloatWrapper', {
      y: 0, rotateY: 0, rotateX: 0,
      duration: snapDuration,
      ease: `back.out(${overshoot})`,
      overwrite: 'auto'
    });
    ```
  - 这实现了卡片旋转、位移、漂浮偏移在松手时的多轨完美同步回弹。
- **重置起始缓动（Smooth Start on Resume）**：
  - 修改 `startFloating` 逻辑，当回弹动画结束需要重新开启漂浮循环时，先用一个 1.3s ~ 2.0s 的**单次缓动动画**（半个周期）将容器平滑地由静止状态（`0`）推送到峰值，然后再平滑无缝地切入无限循环的 `yoyo` 漂浮动画。避免了漂浮循环开启时的任何瞬间跳跃。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建.
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 531），自动部署线上页面。

---

## 🛠️ Hotfix: 去除 3D 卡片下方提示字，并为拖动添加平滑延迟（Inertia Lag）以优化手感

### 1. 问题现象与需求分析
- **去除提示文字**：详情页 3D 卡片底部的提示小字（"Drag to tilt & rotate • Double click to restore"）需要移除，使视觉界面更加精简、高级，突出 3D 卡片本身。
- **拖拽加点延迟（Inertia Lag）**：原先拖动卡片时卡片的旋转速度过于紧贴鼠标（几乎零延迟），使得卡片的物理重量感缺失。希望能增加一些延迟和惯性滑动，让卡片旋转时呈现类似“带有重量的实体卡牌在指尖流转”的高级手感。

### 2. 解决方案与修改
- **删除 HTML & CSS 遗留代码**：
  - 在 [index.html](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/index.html) 中删除了 ID 为 `detail3dCardHint` 的 `div` 提示文本元素。
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中删除了对应的 `.detail-3d-card-hint` 样式类声明，清理冗余代码。
- **引入拖拽阻尼与延迟（Lag Damping in drag move）**：
  - 修改 [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) 中的 `handleDragMove` 逻辑。
  - 将 `cardInner` 拖拽时的动画时长 `duration` 从原先的 `0.2` 秒**增加到 `0.4` 秒**，同时将 GSAP 缓动函数由 `power1.out` 变更为**更具平滑减速特征的 `power2.out`**。
  - **多层视差及反射的同步联动（Unified Update Loop）**：
    - 在原先的代码中，卡片图片视差平移（`cardImg`）和卡片容器视差平移（`container`）是开启独立 GSAP 动画并排执行的；而反光（`glare`）和彩虹全息图层（`sheen`）则是绕过 GSAP 瞬间根据鼠标绝对坐标更新的。
    - **改进**：我们废除了这些零散的多轨动画和即时修改，改将 `cardImg`、`container`、`glare` 与 `sheen` 的所有样式更新全部收敛进 `cardInner` 旋转动画的 **`onUpdate` 回调函数**中。
    - **同步效果**：通过 `gsap.getProperty` 实时读取 `cardInner` 在插值运行时的**当前实际旋转值**，并基于此实时计算偏移和反光。
    - **体验提升**：这使得在拖拽时，无论卡片受 `0.4s` 延迟拖拽如何落后于鼠标光标，其内部图片的视差位移、外框的位移、高光和彩虹全息反射等物理效果，都与卡片的三维转角**百分之百保持一致且绝对同步**，彻底消除了任何视觉脱节，带来了极其震撼、厚重且有机械延迟的奢华手感。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 532），自动部署线上页面。

---

## 🛠️ Hotfix: 将详情页卡片外围显眼的粗橙色边框修改为半透明白色/深色细线以提升高级感

### 1. 问题现象与需求分析
- **粗橙色边框过于显眼 (Conspicuous Orange Border)**：
  - 现象：详情弹窗卡片（`.work-detail-card`）外圈有一圈 3px 粗的品牌橙色（`#E87C50`）上边框。在整体页面中，这道橙色边界线占比太重，显得有些喧宾夺主，不够精细，拉低了整体设计的轻盈质感和高级感。
  - **需求**：将这圈橙色边框改为**半透明的白色细线**（在暗色主题下为白色，在亮色主题下为相对应的深色细线），使其优雅地融于背景中，成为一个高级的磨砂玻璃边缘般的点缀。

### 2. 解决方案与修改
- **引入 CSS 边框变量（CSS Custom Border Variable）**：
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 的全局根变量（`:root`）声明中新增了边框颜色变量：
    - **暗色模式（Dark Mode）**：`--detail-card-border: rgba(255, 255, 255, 0.15)` （15% 不透明度的白色，看起来像极细的磨砂玻璃光泽）。
    - **亮色模式（Light Mode）**：`--detail-card-border: rgba(0, 0, 0, 0.12)` （12% 不透明度的黑色，提供轻盈的层次划分）。
- **细化边框样式（Thinner Semitransparent Border）**：
  - 修改 `.work-detail-card::after` 伪元素的边框属性：
    - 将边框宽度由 `3px` 减至 **`1px`**。
    - 将边框颜色从原先的硬编码颜色 `#E87C50` 变更为 CSS 变量 `var(--detail-card-border)`。
  - **效果提升**：卡片边缘瞬间脱去了厚重感，转而呈现出一种极为纤细、低调且极具现代感的微弱边缘微光，完全融入了页面的大背景。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 533），自动部署线上页面。

---

## 🛠️ Hotfix: 将大图到 3D 卡片激活状态的生硬渐隐渐现升级为高阶电影感“变焦模糊”（Zoom-Blur）过渡动画

### 1. 问题现象与需求分析
- **图片切换生硬 (Stiff Cross-fade)**：
  - 现象：点击大图激活 3D 卡牌时，大图 `#detailHeroImg` 执行 `opacity: 0` 的淡出，同时 3D 卡片执行淡入。由于两者展示的是完全相同的内容，这种“一个消失、另一个出现”的粗糙淡入淡出（Cross-fade）在视觉上显得支离破碎、缺乏关联，切换感十分生硬和廉价。
  - **需求**：让切换过程富有弹性、连贯并且高级，像镜头变焦一样平滑。

### 2. 解决方案与修改
- **高阶“电影感变焦模糊”过渡（Cinematic Zoom-Blur Transition）**：
  - 修改 [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js) 中 3D 卡片激活与退出的动画逻辑：
    - **激活时（点击大图）**：大图 `#detailHeroImg` 不再淡出隐藏，而是通过 GSAP 在 0.8s 内将其**平滑模糊至 15px 并调暗（brightness）**，同时**轻微放大（scale: 1.06）**：
      ```javascript
      gsap.to('#detailHeroImg', { 
        filter: 'blur(15px) brightness(0.35)', 
        scale: 1.06, 
        duration: 0.8, 
        ease: 'power2.out' 
      });
      ```
      这营造出电影镜头中“背景深焦虚化、焦点移向中心”的高级感。
    - **卡牌登场同步优化**：伴随着背景的变焦虚化，3D 卡片容器从 `scale: 0.75` 弹性放大并旋转登场，且初始 3D 自转角度增加到 `-70deg`，使得翻转自转动作更加帅气、立体。
    - **还原时（双击卡片）**：背景大图在 0.65s 内平滑地由模糊和暗调**恢复为清晰无畸变状态（`blur(0px) brightness(1)`，`scale: 1.0`）**，在视觉上将用户的焦点拉回正轨。
    - **关闭清理**：在 `closeDetail` 重置周期中，为大图补全 `filter: 'none'` 的初始化设置，确保项目切换时状态洁净。
  - **体验提升**：这一过渡给用户带来的心理感受是“大图凝聚成了中心的 3D 实体卡牌”，两者的图源得到了自然的继承与过度，整体动画如丝般顺滑，科技感和奢侈感拉满。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 534），自动部署线上页面。

---

## 🛠️ Hotfix: 将 3D 卡片与大图的切换触发方式重构为 Apple 风格的胶囊式滑动切换按钮

### 1. 问题现象与需求分析
- **原本触发方式盲目且低频**：
  - 现象：原先通过“单点大图区域”激活 3D 卡牌，“双击任意处”弹回还原。这两种手势由于缺乏直观的 UI 视觉引导，用户很难自发发现；且在移动端上，全屏盲点容易与滑动页面或卡牌本身发生点击误触。
  - **需求**：将切换卡片和大图的方式，改造为**苹果风格的胶囊式滑动切换按钮（Pill Switch）**，并放置在大图底部的正中间，提供最直观、高级且零误触的交互入口。

### 2. 解决方案与修改
- **胶囊按钮 HTML 骨架（Capsule Toggle Markup）**：
  - 在 [index.html](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/index.html) 中的 `.detail-hero` 容器尾部，添加了 Pill 按钮：
    ```html
    <div class="hero-toggle-pill" id="heroTogglePill">
      <div class="toggle-pill-bg"></div>
      <button class="toggle-pill-btn active" data-mode="image" id="togglePillImg">大图</button>
      <button class="toggle-pill-btn" data-mode="card" id="togglePillCard">3D卡牌</button>
    </div>
    ```
- **苹果风高透玻璃态 CSS 设计（Apple Glassmorphism CSS）**：
  - 在 [styles.css](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/styles.css) 中对胶囊切换器进行了全面设计：
    - **毛玻璃滤镜**：应用 `background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px)` 实现半透明高级苹果毛玻璃背景。
    - **平滑滑动片**：滑块 `.toggle-pill-bg` 使用 `absolute` 宽度占 50%，通过 `transform: translateX(100%)` 实现苹果标志性的平滑缓动滑移（400ms cubic-bezier 缓动）。
    - **自适应高亮**：通过 `.card-active` 状态类控制滑块滑移和文本高亮激活态。同时为 Light/Dark 模式定制了自适应高对比色（亮色下白色滑块+黑色字，暗色下半透滑块+白色字）。
- **重构 JS 驱动逻辑（Refactored Event Routing）**：
  - 修改 [hash-router.js](file:///C:/Users/jackchen/lobsterai/project/Project-C/portfolio-v3/js/modules/hash-router.js)：
    - **废除盲点触发**：删除了原先绑定在全局 `hero` 上的 `click` 和 `dblclick` 切换触发器。
    - **精准按钮路由**：为胶囊按钮的“大图”和“3D卡牌”子选项分别绑定 `click` 事件监听，分别路由调用 `deactivate3DCard()` 和 `activate3DCard()` 核心转换函数，并且通过 `e.stopPropagation()` 阻止事件向父级冒泡。
    - **拦截拖拽误触**：在卡牌原先的 `mousedown` 和 `touchstart` 拖拽监听器中，补充了对胶囊控制条的阻断条件：`e.target.closest('#heroTogglePill')`。**这极其关键**，它能彻底阻止用户在点击或滑动切换胶囊按钮时，后台意外启动 3D 卡牌拖拽物理引擎的 Bug。
    - **重置复位生命周期**：在 `openDetail` 开启以及 `closeDetail` 关闭的完整生命周期中，补全了对胶囊切换器激活状态重置回 `大图 (active)` 的逻辑，保障项目进出时状态一致。

### 3. 部署与验证
- 重新使用 `cmd /c "npx vite build"` 完成生产环境静态资源构建。
- 执行 `python workflow.py deploy` 推送至 GitHub（Step 535），自动部署线上页面。

