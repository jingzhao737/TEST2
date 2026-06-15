# PROJECT.md — Portfolio v2 Complete Knowledge Base

> **Purpose**: This document contains EVERYTHING an AI agent needs to know about this project,
> including architecture, design decisions, user preferences, and history.
> Read this file completely before doing any work.
> 
> **CRITICAL**: You MUST periodically re-read this file and `AGENTS.md` during long sessions (every 5-10 turns) to prevent context drift and ensure strict adherence to all guidelines.

---

## 1. What Is This Project

A personal portfolio website for a visual artist (YYJZ / JingZhao). It showcases paintings, digital art, 3D models, and video work. The site is a single-page application with smooth scroll-based animations, a 3D interactive crystal model, video carousel, and editorial typography.

**Live site**: https://jingzhao737.github.io/TEST2/

---

## 2. The User (Who You're Working For)

- Communicates in **Chinese (Mandarin)**. Respond in Chinese unless they write in English. **All generated markdown files (such as implementation_plan.md, task.md, walkthrough.md) must be written in Chinese.**
- Has a strong aesthetic sense. They care deeply about visual quality — pixel-level details matter.
- Prefers **restraint and elegance** over flashy or excessive effects.
- Gets frustrated when agents change things they didn't ask for.
- Wants to understand what you're doing and why — explain step by step, don't just dump results.
- Often gives feedback like "有点怪" (looks a bit off) or "差不多了" (that's about right) — these are signals to fine-tune, not to overhaul.
- Values efficiency. Don't waste their time with unnecessary questions about obvious things.

### Design Philosophy (User's Own Words)
> "极致克制的先锋数字艺术风格"
> (Minimalist Avant-Garde Digital Art Style)

This means:
- Clean, geometric, modern — NOT decorative or ornate
- Subtle micro-animations — NOT flashy or distracting
- Dark mode is the primary experience
- White space is intentional. Don't fill every pixel.
- Typography should feel premium and precise, not generic

---

## 3. Page Sections (Top to Bottom)

### Hero (`#home`)
- Giant "CRESCENT" title with per-character positioning
- Subtitle: "Painting, digital art, sculpture, and visual design"
- Animated background beams, star canvas, hanging circle decorations
- Scroll hint at bottom-right

### Selected Works (`#work`)
- 4 work cards in a vertical list layout
- Grid: `index | name | tags | year`
- Hover: left accent line appears, text shifts right, color changes to accent
- Click opens a detail overlay with hero image, metadata, and gallery
- **Font size was intentionally reduced** — user said the titles were "too big"

### Vision / 3D Crystal (`#ice`)
- Three.js scene with a GLB model rendered as transparent crystal
- 3 HDR environment maps switchable via buttons
- Post-processing: Bloom + Lens Flare shader
- Orbiting particles and star fields
- Zoom slider and trackball rotation controls
- **Three.js loads via import map (CDN)**, NOT from node_modules

### Featured Showcase (`#showcase`)
- 3 full-width parallax cards with background images
- Shimmer/glow text effect on titles (CSS gradient animation)
- **Bloom effect**: `::after` pseudo-element with `filter: blur()` creates a "溢光" (overflow glow) when the shimmer highlight passes over text
- GSAP ScrollTrigger for parallax

### Motion (`#motion`)
- Video carousel with 3 reels
- Swipe/drag navigation
- Videos: `reel1.mp4`, `reel2.mp4`, `reel3.mp4`

### Poetry (`#poetry`)
- Generated mosaic grid of text fragments
- Dylan Thomas "Do Not Go Gentle" theme

### About (`#about`)
- Two-column layout: large intro text + body text
- Animated counters: 60+ works, 12 exhibitions, 7 countries

### Marquee
- Infinite horizontal scroll of names/nicknames
- Pure CSS animation

### Footer (`#contact`)
- "LET'S CREATE SOMETHING ICONIC" CTA
- Email contact: 2578215228@qq.com

---

## 4. Technical Architecture

### Dependencies (ALL loaded via CDN, NOT npm)

| Library | Version | How It's Loaded |
|---------|---------|-----------------|
| Three.js | 0.160.0 | `<script type="importmap">` in index.html |
| GSAP | 3.12.5 | `import from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm'` |

**IMPORTANT**: Do NOT add `import xxx from 'three'` or `import gsap from 'gsap'` as bare module imports. They will break on GitHub Pages. Always use the CDN URL or the import map.

### Key Files and What They Do

| File | Purpose | Key Details |
|------|---------|-------------|
| `index.html` | Page structure | Import map for Three.js is in `<head>`. All scripts are `type="module"`. |
| `styles.css` | All styles | ~1200 lines. CSS variables defined in `:root`. Media queries at lines 642+ (1024px, 768px, 480px). |
| `ice.js` | 3D scene | Creates WebGL renderer, loads GLB model, applies physical material with transmission/dispersion, adds bloom + lens flare post-processing. |
| `js/modules/showcase.js` | Showcase section | GSAP parallax + shimmer gradient animation on `.showcase-title`. |
| `js/modules/premium-interactions.js` | Global enhancements | Magnetic button hover effects, text reveal animations for section headings. |
| `js/modules/data.js` | Work data | Contains the detail content for each work card (description, gallery images, metadata). |
| `js/modules/theme.js` | Dark/light toggle | Manages theme state, pull-string animation for toggle, CSS variable updates. |
| `js/modules/motion-carousel.js` | Video carousel | Drag/swipe navigation, auto-play on visible, GSAP animations. |

### CSS Architecture

- Variables in `:root` — colors, easing functions, accent color
- Font: `'Google Sans', sans-serif` everywhere (5 weights: 400, 400i, 500, 600, 700)
- Dark mode is default. Light mode via `:root.light` class
- Responsive breakpoints: 1024px (tablet), 768px (mobile), 480px (small mobile)

---

## 5. Design Decisions Already Made (Don't Undo These)

| Decision | Reason |
|----------|--------|
| Google Sans replaced JosefinSans and Magnat | User wanted modern geometric feel, explicitly said "彻底抛弃全部替换" |
| `.work-name` font-size is `clamp(1.8rem, 2.5vw, 2.4rem)` | User said original size was "太大了" (too big) |
| Fallback fonts are all `sans-serif` | Matches the geometric Google Sans aesthetic |
| Showcase title has bloom/glow `::after` effect | User specifically requested "溢光" (overflow glow) and we iterated multiple times to get the intensity right |
| Three.js via import map, GSAP via CDN | Required for GitHub Pages deployment (no bundler) |
| No Vite build for deployment | Source code is served directly. Vite is only for local dev convenience. |

---

## 6. Common Pitfalls

| Pitfall | How to Avoid |
|---------|-------------|
| Editing CSS line numbers from memory | styles.css is 1200+ lines. ALWAYS `view_file` with specific line ranges before editing. |
| Adding bare `import` for npm packages | Will break on GitHub Pages. Use CDN URLs or import map. |
| Changing font-family back to serif | User explicitly chose sans-serif everywhere. |
| Making showcase titles too bright/flashy | User wants "克制" (restraint). Bloom should be subtle, not blinding. |
| Editing multiple things the user didn't ask for | Only change what was requested. The user will tell you if more is needed. |
| Forgetting to backup before editing | ALWAYS run `python workflow.py backup "note"` before your first edit. |
| Pushing to GitHub without user confirmation | (Authorized June 5, 2026): Automatically run `deploy` as soon as modifications are completed and verified. |

---

## 7. Responsive Design Notes

The works list layout changes significantly across breakpoints:

| Breakpoint | Grid Columns | Notes |
|------------|-------------|-------|
| Desktop (>1024px) | `100px 1fr 180px 100px` | Full layout with index, name, tags, year |
| Tablet (<=1024px) | `60px 1fr 120px 80px` | Reduced padding and font sizes |
| Mobile (<=768px) | `32px 1fr` | Only index + name visible. Tags and year hidden. |
| Small Mobile (<=480px) | `32px 1fr` | Even smaller text, tighter spacing |

---

## 8. Workflow Summary

```
User gives request
    |
    v
[1] Run: python workflow.py backup "description"
    |
    v
[2] Edit code (can modify multiple files sequentially in one turn, explain each in final response)
    |
    v
[3] User previews at http://localhost:5173
    |
    v
[4] Automatically run: python workflow.py deploy "description" (Auto-deploy authorized by user)
    |
    v
[5] Site auto-updates on GitHub Pages in ~1 minute
```

If something breaks: `python workflow.py rollback <step_number>`
