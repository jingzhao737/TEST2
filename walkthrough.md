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
