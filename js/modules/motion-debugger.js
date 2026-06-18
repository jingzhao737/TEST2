import gsap from 'gsap';

// ── CUBIC BEZIER SOLVER FOR GSAP ──
function cubicBezier(x1, y1, x2, y2) {
  const NEWTON_ITERATIONS = 4;
  const NEWTON_MIN_SLOPE = 0.001;
  const SUBDIVISION_PRECISION = 0.0000001;
  const SUBDIVISION_MAX_ITERATIONS = 10;

  const kSampleStepSize = 1.0 / 10.0;
  const sampleValues = new Float32Array(11);

  if (x1 === y1 && x2 === y2) return (t) => t; // Linear

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
  function C(aA1)      { return 3.0 * aA1; }

  function calcBezier(aT, aA1, aA2) {
    return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
  }

  function getSlope(aT, aA1, aA2) {
    return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
  }

  function binarySubdivide(aX, aA, aB, aA1, aA2) {
    let currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, aA1, aA2) - aX;
      if (currentX > 0.0) {
        aB = currentT;
      } else {
        aA = currentT;
      }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, aA1, aA2) {
    for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
      const currentSlope = getSlope(aGuessT, aA1, aA2);
      if (currentSlope === 0.0) return aGuessT;
      const currentX = calcBezier(aGuessT, aA1, aA2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  for (let i = 0; i < 11; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, x1, x2);
  }

  function getTForX(aX) {
    let intervalStart = 0.0;
    let currentSample = 1;
    const lastSample = 10;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;

    const initialSlope = getSlope(guessForT, x1, x2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, x1, x2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, x1, x2);
    }
  }

  return function solve(x) {
    if (x === 0 || x === 1) return x;
    return calcBezier(getTForX(x), y1, y2);
  };
}

// Register default cubic-bezier ease with GSAP
const defaultTitleEase = 'cubic-bezier(0.9, 0, 0.1, 1)';
gsap.registerEase(defaultTitleEase, cubicBezier(0.9, 0, 0.1, 1));

// ── INITIALIZE CONFIG GLOBALLY ──
window.__motionDebuggerConfig = {
  worksTitle: {
    duration: 2.55,
    ease: 'power4.inOut',
    y: '100vh',
    delay: 0
  },
  worksCards: {
    duration: 1.6,
    stagger: 0.16,
    ease: 'elastic.out(1, 0.75)'
  },
  chromaBlob: {
    duration: 0.4,
    ease: 'power1.inOut'
  },
  scrollLength: 900,
  customElements: {} // To store configurations of other animated elements dynamically
};

// Helper to check if an element has animations
function isAnimatedElement(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  
  // Explicit classes we know represent animated components
  if (el.matches('.works-big-title, .work-card, .works-chroma-blob, .works-chroma-wrapper, .hero-title, .hero-char, .hero-eyebrow, .hero-subtitle, .scroll-hint, .anim-up, #footerCta, .back-to-top, .motion-slide, .poetry-line, .poetry-stanza, .theme-toggle, .nav-logo, .nav-links li, .hdr-ring')) {
    return true;
  }
  
  // Dynamic CSS transition/animation check
  const style = window.getComputedStyle(el);
  const hasTransition = style.transitionProperty && style.transitionProperty !== 'none' && parseFloat(style.transitionDuration) > 0;
  const hasAnimation = style.animationName && style.animationName !== 'none' && parseFloat(style.animationDuration) > 0;
  
  if (hasTransition || hasAnimation) {
    return true;
  }
  
  return false;
}

// Helper to generate a unique selector path for any element
function getUniqueSelector(el) {
  if (el.id) return `#${el.id}`;
  let path = [];
  let current = el;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break; // Unique enough
    } else if (current.className) {
      const classes = Array.from(current.classList).filter(c => c !== 'motion-inspect-hover' && c !== 'anim-done');
      if (classes.length) {
        selector += '.' + classes.join('.');
      }
    }
    
    // Add child index relative to siblings if not unique
    let sibling = current.previousElementSibling;
    let nth = 1;
    while (sibling) {
      if (sibling.nodeName.toLowerCase() === current.nodeName.toLowerCase()) {
        nth++;
      }
      sibling = sibling.previousElementSibling;
    }
    if (nth > 1 || current.nextElementSibling) {
      selector += `:nth-of-type(${nth})`;
    }
    path.unshift(selector);
    current = current.parentNode;
  }
  return path.join(' > ');
}

// ── INJECT HTML & CSS FOR THE DEBUGGER ──
(function initDebuggerUI() {
  // Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* Floating trigger button */
    .motion-debugger-btn {
      position: fixed;
      left: 24px;
      bottom: 24px;
      z-index: 9999;
      background: var(--card-bg, #161616);
      border: 1px solid var(--border, rgba(255,255,255,0.1));
      color: var(--fg, #FAF2E3);
      padding: 10px 18px;
      border-radius: 20px;
      font-family: 'Google Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .motion-debugger-btn:hover {
      border-color: var(--accent);
      background: var(--accent-soft);
      transform: translateY(-2px);
    }
    .motion-debugger-btn.active {
      background: var(--accent);
      color: #000;
      border-color: var(--accent);
    }
    .motion-debugger-btn .btn-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #888;
      transition: background 0.3s;
    }
    .motion-debugger-btn.active .btn-dot {
      background: #000;
      animation: debug-pulse 1.2s infinite;
    }

    @keyframes debug-pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.5; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* Target Reticle Cursor */
    .inspect-cursor {
      position: fixed;
      top: 0;
      left: 0;
      width: 64px;
      height: 64px;
      border: 2px dashed var(--accent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10002;
      transform: translate(-50%, -50%);
      display: none;
      transition: width 0.2s, height 0.2s, background-color 0.2s, border-color 0.2s;
      box-sizing: border-box;
    }
    .inspect-cursor::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 6px;
      background: var(--accent);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    /* Highlight outline for hovered inspectable elements */
    .motion-inspect-hover {
      outline: 2px dashed #D6FF3E !important;
      outline-offset: 6px !important;
      cursor: crosshair !important;
    }

    /* Control Panel */
    .debugger-panel {
      position: fixed;
      left: 24px;
      bottom: 84px;
      width: 350px;
      max-height: 75vh;
      background: rgba(22, 22, 22, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      color: #FAF2E3;
      z-index: 9998;
      display: none;
      flex-direction: column;
      box-shadow: 0 10px 40px rgba(0,0,0,0.55);
      overflow: hidden;
      font-family: 'Google Sans', sans-serif;
      animation: panel-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes panel-slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .debugger-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.25);
    }
    .debugger-panel-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--accent);
    }
    .debugger-panel-close {
      background: none;
      border: none;
      color: #888;
      font-size: 22px;
      cursor: pointer;
      transition: color 0.2s;
      padding: 0;
      line-height: 1;
    }
    .debugger-panel-close:hover {
      color: #fff;
    }

    .debugger-panel-body {
      padding: 18px;
      overflow-y: auto;
      flex: 1;
    }

    .debugger-accordion-item {
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(255, 255, 255, 0.02);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 14px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .debugger-accordion-item.active {
      border-color: rgba(var(--accent-rgb), 0.35);
      background: rgba(var(--accent-rgb), 0.04);
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }

    .debugger-section-title {
      font-size: 12px;
      font-weight: 700;
      color: #aaa;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
      border-left: 2px solid rgba(255,255,255,0.15);
      padding-left: 8px;
      transition: border-color 0.3s;
    }
    .debugger-accordion-item.active .debugger-section-title {
      color: var(--accent);
      border-left-color: var(--accent);
    }

    .debugger-control-group {
      margin-bottom: 14px;
    }
    .debugger-control-group:last-child {
      margin-bottom: 0;
    }
    .debugger-control-label {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #bbb;
      margin-bottom: 6px;
    }
    .debugger-control-label span.val {
      color: var(--accent);
      font-family: monospace;
      font-weight: 600;
    }
    .debugger-slider-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .debugger-slider {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      border-radius: 2px;
      background: rgba(255,255,255,0.15);
      outline: none;
    }
    .debugger-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      transition: transform 0.1s;
    }
    .debugger-slider::-webkit-slider-thumb:hover {
      transform: scale(1.25);
    }
    .debugger-select {
      width: 100%;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .debugger-select:focus {
      border-color: var(--accent);
    }

    .bezier-sliders {
      background: rgba(0, 0, 0, 0.3);
      padding: 12px;
      border-radius: 8px;
      margin-top: 10px;
      border: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .debugger-panel-footer {
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 12px;
      background: rgba(0, 0, 0, 0.2);
      align-items: center;
      position: relative;
    }
    .debugger-btn-primary {
      flex: 1;
      background: var(--accent);
      color: #000;
      border: none;
      padding: 10px 14px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
      text-align: center;
    }
    .debugger-btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .debugger-btn-copy {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #FAF2E3;
      padding: 10px 14px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .debugger-btn-copy:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: var(--accent);
    }

    /* Copy Feedback Toast */
    .debugger-toast {
      position: absolute;
      bottom: 70px;
      right: 20px;
      background: #D6FF3E;
      color: #000;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(10px);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 10000;
    }
    .debugger-toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    /* Light Theme overrides for Debugger Panel */
    .light .debugger-panel {
      background: rgba(245, 240, 232, 0.9);
      border-color: rgba(0, 0, 0, 0.08);
      color: #1a1a1a;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    .light .debugger-panel-header {
      background: rgba(0, 0, 0, 0.03);
      border-bottom-color: rgba(0, 0, 0, 0.06);
    }
    .light .debugger-panel-close {
      color: #666;
    }
    .light .debugger-panel-close:hover {
      color: #000;
    }
    .light .debugger-accordion-item {
      border-color: rgba(0, 0, 0, 0.06);
      background: rgba(0, 0, 0, 0.01);
    }
    .light .debugger-accordion-item.active {
      border-color: rgba(var(--accent-rgb), 0.25);
      background: rgba(var(--accent-rgb), 0.03);
    }
    .light .debugger-section-title {
      color: #666;
      border-left-color: rgba(0, 0, 0, 0.15);
    }
    .light .debugger-accordion-item.active .debugger-section-title {
      color: var(--accent);
      border-left-color: var(--accent);
    }
    .light .debugger-control-label {
      color: #444;
    }
    .light .debugger-slider {
      background: rgba(0, 0, 0, 0.1);
    }
    .light .debugger-select {
      background: rgba(255, 255, 255, 0.6);
      border-color: rgba(0, 0, 0, 0.15);
      color: #1a1a1a;
    }
    .light .bezier-sliders {
      background: rgba(0, 0, 0, 0.02);
      border-color: rgba(0, 0, 0, 0.06);
    }
    .light .debugger-panel-footer {
      background: rgba(0, 0, 0, 0.02);
      border-top-color: rgba(0, 0, 0, 0.06);
    }
    .light .debugger-btn-copy {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.1);
      color: #1a1a1a;
    }
    .light .debugger-btn-copy:hover {
      background: rgba(0, 0, 0, 0.08);
      border-color: var(--accent);
    }
    .light .debugger-toast {
      background: var(--accent);
      color: #fff;
    }

    /* Pointer overrides during active inspection */
    .motion-inspect-active .works-big-title {
      pointer-events: auto !important;
      z-index: 999 !important;
    }
    .motion-inspect-active .works-chroma-wrapper {
      pointer-events: auto !important;
      z-index: 998 !important;
    }
    .motion-inspect-active .works-chroma-blob {
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(styleEl);

  // Ingest Floating Button
  const btn = document.createElement('button');
  btn.className = 'motion-debugger-btn';
  btn.id = 'motionDebuggerBtn';
  btn.innerHTML = `<span class="btn-dot"></span><span class="btn-text">调试动效</span>`;
  document.body.appendChild(btn);

  // Ingest Inspect Cursor
  const cursor = document.createElement('div');
  cursor.className = 'inspect-cursor';
  cursor.id = 'inspectCursor';
  document.body.appendChild(cursor);

  // Ingest Debugger Panel
  const panel = document.createElement('div');
  panel.className = 'debugger-panel';
  panel.id = 'motionDebuggerPanel';
  panel.innerHTML = `
    <div class="debugger-panel-header">
      <h3>动效调试面板</h3>
      <button class="debugger-panel-close" id="motionDebuggerClose">&times;</button>
    </div>
    <div class="debugger-panel-body">
      
      <!-- 自定义选中元素动画 (动态插入显示) -->
      <div class="debugger-accordion-item" data-section="customElement" id="sec-custom-element" style="display: none;">
        <div class="debugger-section-title" id="custom-element-title">选中元素动画 (Custom Element)</div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>过渡时长 (秒)</span>
            <span class="val" id="val-custom-duration">0.75</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-custom-duration" min="0.0" max="5.0" step="0.05" value="0.75">
          </div>
        </div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>延迟时间 (秒)</span>
            <span class="val" id="val-custom-delay">0.00</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-custom-delay" min="0.0" max="3.0" step="0.05" value="0.00">
          </div>
        </div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>缓动曲线</span>
          </div>
          <select class="debugger-select" id="select-custom-ease">
            <option value="cubic-bezier(0.19, 1, 0.22, 1)">Expo.out (极速减速)</option>
            <option value="cubic-bezier(0.9, 0, 0.1, 1)">经典的慢快慢</option>
            <option value="cubic-bezier(0.25, 0.1, 0.25, 1)">Ease (标准)</option>
            <option value="cubic-bezier(0.42, 0, 1, 1)">Ease-in (渐快)</option>
            <option value="cubic-bezier(0, 0, 0.58, 1)">Ease-out (渐慢)</option>
            <option value="cubic-bezier(0.42, 0, 0.58, 1)">Ease-in-out (渐入渐出)</option>
            <option value="linear">Linear (线性匀速)</option>
            <option value="custom">自定义贝塞尔曲线 (Custom Bezier)</option>
          </select>
          
          <!-- Custom Bezier Sliders -->
          <div class="bezier-sliders" id="custom-bezier-container" style="display: none;">
            <div class="debugger-control-group">
              <div class="debugger-control-label">
                <span>x1</span>
                <span class="val" id="val-custom-x1">0.19</span>
              </div>
              <input type="range" class="debugger-slider" id="slide-custom-x1" min="0" max="1" step="0.01" value="0.19">
            </div>
            <div class="debugger-control-group">
              <div class="debugger-control-label">
                <span>y1</span>
                <span class="val" id="val-custom-y1">1.00</span>
              </div>
              <input type="range" class="debugger-slider" id="slide-custom-y1" min="0" max="1" step="0.01" value="1">
            </div>
            <div class="debugger-control-group">
              <div class="debugger-control-label">
                <span>x2</span>
                <span class="val" id="val-custom-x2">0.22</span>
              </div>
              <input type="range" class="debugger-slider" id="slide-custom-x2" min="0" max="1" step="0.01" value="0.22">
            </div>
            <div class="debugger-control-group">
              <div class="debugger-control-label">
                <span>y2</span>
                <span class="val" id="val-custom-y2">1.00</span>
              </div>
              <input type="range" class="debugger-slider" id="slide-custom-y2" min="0" max="1" step="0.01" value="1">
            </div>
          </div>
        </div>
        
        <div class="debugger-control-group" style="margin-top: 14px;">
          <button class="debugger-btn-primary" id="btn-replay-custom" style="width: 100%; font-size: 12px; padding: 8px 12px;">重置并重新播放该元素动画</button>
        </div>
      </div>

      <!-- 大标题动画 -->
      <div class="debugger-accordion-item" data-section="worksTitle">
        <div class="debugger-section-title">大标题入场动画 (Works Title)</div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>进入动画时长 (秒)</span>
            <span class="val" id="val-title-duration">2.55</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-title-duration" min="0.1" max="5.0" step="0.05" value="2.55">
          </div>
        </div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>进入延迟时间 (秒)</span>
            <span class="val" id="val-title-delay">0.00</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-title-delay" min="0.0" max="3.0" step="0.05" value="0">
          </div>
        </div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>起始Y轴位移 (vh)</span>
            <span class="val" id="val-title-y">100</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-title-y" min="0" max="100" step="1" value="100">
          </div>
        </div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>缓动曲线类型</span>
          </div>
          <select class="debugger-select" id="select-title-ease">
            <option value="cubic-bezier(0.9, 0, 0.1, 1)">经典的慢快慢 (cubic-bezier(0.9, 0, 0.1, 1))</option>
            <option value="cubic-bezier(0.95, 0.05, 0.05, 0.95)">极慢快极慢 (cubic-bezier(0.95, 0.05, 0.05, 0.95))</option>
            <option value="power3.inOut">Power3.inOut (平滑过渡)</option>
            <option value="power4.inOut" selected>Power4.inOut (强力双向缓动)</option>
            <option value="elastic.out(1, 0.75)">Elastic.out (回弹落入)</option>
            <option value="custom">自定义贝塞尔曲线 (Custom Bezier)</option>
          </select>
          
          <!-- Custom Bezier Sliders -->
          <div class="bezier-sliders" id="title-bezier-container" style="display: none;">
            <div class="debugger-control-group">
              <div class="debugger-control-label">
                <span>x1 (起始控制点X)</span>
                <span class="val" id="val-title-x1">0.90</span>
              </div>
              <input type="range" class="debugger-slider" id="slide-title-x1" min="0" max="1" step="0.01" value="0.9">
            </div>
            <div class="debugger-control-group">
              <div class="debugger-control-label">
                <span>y1 (起始控制点Y)</span>
                <span class="val" id="val-title-y1">0.00</span>
              </div>
              <input type="range" class="debugger-slider" id="slide-title-y1" min="0" max="1" step="0.01" value="0">
            </div>
            <div class="debugger-control-group">
              <div class="debugger-control-label">
                <span>x2 (结束控制点X)</span>
                <span class="val" id="val-title-x2">0.10</span>
              </div>
              <input type="range" class="debugger-slider" id="slide-title-x2" min="0" max="1" step="0.01" value="0.1">
            </div>
            <div class="debugger-control-group">
              <div class="debugger-control-label">
                <span>y2 (结束控制点Y)</span>
                <span class="val" id="val-title-y2">1.00</span>
              </div>
              <input type="range" class="debugger-slider" id="slide-title-y2" min="0" max="1" step="0.01" value="1">
            </div>
          </div>
        </div>
      </div>
      
      <!-- 作品卡片动画 -->
      <div class="debugger-accordion-item" data-section="worksCards">
        <div class="debugger-section-title">作品卡片动画 (Works Cards)</div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>卡片飞入时长 (秒)</span>
            <span class="val" id="val-cards-duration">1.6</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-cards-duration" min="0.5" max="5.0" step="0.1" value="1.6">
          </div>
        </div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>Stagger卡片间隔 (秒)</span>
            <span class="val" id="val-cards-stagger">0.16</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-cards-stagger" min="0.0" max="1.0" step="0.01" value="0.16">
          </div>
        </div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>缓动曲线类型</span>
          </div>
          <select class="debugger-select" id="select-cards-ease">
            <option value="elastic.out(1, 0.75)">经典弹性弧线 (elastic.out(1, 0.75))</option>
            <option value="cubic-bezier(0.9, 0, 0.1, 1)">慢快慢贝塞尔曲线</option>
            <option value="power3.out">Power3.out (平滑减速入场)</option>
            <option value="power4.out">Power4.out (极速减速入场)</option>
            <option value="back.out(1.7)">Back.out (超出边界回弹)</option>
          </select>
        </div>
      </div>
      
      <!-- 背景光斑动画 -->
      <div class="debugger-accordion-item" data-section="chromaBlob">
        <div class="debugger-section-title">背景光斑渐变 (Chroma Blob)</div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>透明度渐变时长 (秒)</span>
            <span class="val" id="val-chroma-duration">0.4</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-chroma-duration" min="0.1" max="3.0" step="0.05" value="0.4">
          </div>
        </div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>缓动曲线类型</span>
          </div>
          <select class="debugger-select" id="select-chroma-ease">
            <option value="power1.inOut">Power1.inOut (双向缓和)</option>
            <option value="power3.inOut">Power3.inOut (平滑双向缓和)</option>
            <option value="linear">Linear (线性均匀渐变)</option>
          </select>
        </div>
      </div>
      
      <!-- 全局滚动参数 -->
      <div class="debugger-accordion-item" data-section="globalScroll">
        <div class="debugger-section-title">滚动固定参数 (Global Scroll)</div>
        
        <div class="debugger-control-group">
          <div class="debugger-control-label">
            <span>作品区域固定滚动长度 (px)</span>
            <span class="val" id="val-scroll-length">900</span>
          </div>
          <div class="debugger-slider-wrapper">
            <input type="range" class="debugger-slider" id="slide-scroll-length" min="200" max="2000" step="50" value="900">
          </div>
        </div>
      </div>
      
    </div>
    <div class="debugger-panel-footer">
      <button class="debugger-btn-primary" id="btn-replay-animation">播放整个作品动画</button>
      <button class="debugger-btn-copy" id="btn-copy-parameters">copy参数</button>
      <div class="debugger-toast" id="debugger-copy-toast">参数已复制!</div>
    </div>
  `;
  document.body.appendChild(panel);
})();

// ── EVENT LISTENERS AND BINDING ──
(function setupDebuggerController() {
  const btn = document.getElementById('motionDebuggerBtn');
  const cursor = document.getElementById('inspectCursor');
  const panel = document.getElementById('motionDebuggerPanel');
  const panelClose = document.getElementById('motionDebuggerClose');
  const replayBtn = document.getElementById('btn-replay-animation');
  const copyBtn = document.getElementById('btn-copy-parameters');
  const toast = document.getElementById('debugger-copy-toast');

  // Custom element elements
  const secCustomElement = document.getElementById('sec-custom-element');
  const customElementTitle = document.getElementById('custom-element-title');
  const slideCustomDuration = document.getElementById('slide-custom-duration');
  const valCustomDuration = document.getElementById('val-custom-duration');
  const slideCustomDelay = document.getElementById('slide-custom-delay');
  const valCustomDelay = document.getElementById('val-custom-delay');
  const selectCustomEase = document.getElementById('select-custom-ease');
  const customBezierContainer = document.getElementById('custom-bezier-container');
  const btnReplayCustom = document.getElementById('btn-replay-custom');

  const slideCustomX1 = document.getElementById('slide-custom-x1');
  const valCustomX1 = document.getElementById('val-custom-x1');
  const slideCustomY1 = document.getElementById('slide-custom-y1');
  const valCustomY1 = document.getElementById('val-custom-y1');
  const slideCustomX2 = document.getElementById('slide-custom-x2');
  const valCustomX2 = document.getElementById('val-custom-x2');
  const slideCustomY2 = document.getElementById('slide-custom-y2');
  const valCustomY2 = document.getElementById('val-custom-y2');

  let isInspectMode = false;
  let inspectedElement = null;
  let currentCustomElement = null;

  if (!btn || !cursor || !panel) return;

  // Toggle Inspect Mode
  btn.addEventListener('click', () => {
    isInspectMode = !isInspectMode;
    if (isInspectMode) {
      document.body.classList.add('motion-inspect-active');
      btn.classList.add('active');
      btn.querySelector('.btn-text').textContent = '退出调试';
      cursor.style.display = 'block';
      panel.style.display = 'none'; // Close panel while inspecting
      if (inspectedElement) {
        inspectedElement.classList.remove('motion-inspect-hover');
        inspectedElement = null;
      }
    } else {
      exitInspectMode();
    }
  });

  function exitInspectMode() {
    isInspectMode = false;
    document.body.classList.remove('motion-inspect-active');
    btn.classList.remove('active');
    btn.querySelector('.btn-text').textContent = '调试动效';
    cursor.style.display = 'none';
    if (inspectedElement) {
      inspectedElement.classList.remove('motion-inspect-hover');
      inspectedElement = null;
    }
    // Reset cursor size/style
    gsap.set(cursor, {
      width: 64,
      height: 64,
      borderColor: 'var(--accent)',
      backgroundColor: 'transparent'
    });
  }

  // Close panel
  panelClose.addEventListener('click', () => {
    panel.style.display = 'none';
  });

  // Track Mouse movement to position custom cursor
  document.addEventListener('mousemove', (e) => {
    if (!isInspectMode) return;
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Highlight elements on Hover (Walks up ancestors to find inspectable animated target)
  document.addEventListener('mouseover', (e) => {
    if (!isInspectMode) return;

    let target = e.target;
    let animatedTarget = null;

    while (target && target !== document.body) {
      if (isAnimatedElement(target)) {
        animatedTarget = target;
        break;
      }
      target = target.parentElement;
    }

    if (animatedTarget) {
      if (inspectedElement && inspectedElement !== animatedTarget) {
        inspectedElement.classList.remove('motion-inspect-hover');
      }
      inspectedElement = animatedTarget;
      inspectedElement.classList.add('motion-inspect-hover');

      // Expand custom cursor reticle
      gsap.to(cursor, {
        width: 80,
        height: 80,
        borderColor: '#D6FF3E',
        backgroundColor: 'rgba(214, 255, 62, 0.05)',
        duration: 0.2
      });
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (!isInspectMode) return;

    let target = e.target;
    let animatedTarget = null;
    while (target && target !== document.body) {
      if (isAnimatedElement(target)) {
        animatedTarget = target;
        break;
      }
      target = target.parentElement;
    }

    if (animatedTarget && inspectedElement === animatedTarget) {
      inspectedElement.classList.remove('motion-inspect-hover');
      inspectedElement = null;

      // Shrink custom cursor reticle back to default
      gsap.to(cursor, {
        width: 64,
        height: 64,
        borderColor: 'var(--accent)',
        backgroundColor: 'transparent',
        duration: 0.2
      });
    }
  });

  // Capture Click to Inspect Element
  document.addEventListener('click', (e) => {
    if (!isInspectMode) return;

    let target = e.target;
    let animatedTarget = null;
    while (target && target !== document.body) {
      if (isAnimatedElement(target)) {
        animatedTarget = target;
        break;
      }
      target = target.parentElement;
    }

    if (animatedTarget) {
      e.preventDefault();
      e.stopPropagation();

      showDebuggerPanel(animatedTarget);
    }
  }, true); // Capture phase to prevent default actions (like launching overlays)

  function showDebuggerPanel(element) {
    exitInspectMode();

    panel.style.display = 'flex';

    // Highlight and focus the corresponding section
    const accordionItems = panel.querySelectorAll('.debugger-accordion-item');
    accordionItems.forEach(item => item.classList.remove('active'));

    let activeSection = 'worksTitle';
    let isPreset = true;

    if (element.classList.contains('work-card')) {
      activeSection = 'worksCards';
    } else if (element.classList.contains('works-chroma-blob') || element.classList.contains('works-chroma-wrapper')) {
      activeSection = 'chromaBlob';
    } else if (element.classList.contains('works-big-title')) {
      activeSection = 'worksTitle';
    } else {
      isPreset = false;
      activeSection = 'customElement';
    }

    if (!isPreset) {
      secCustomElement.style.display = 'block';
      loadCustomElementConfig(element);
    } else {
      secCustomElement.style.display = 'none';
      currentCustomElement = null;
    }

    const targetItem = panel.querySelector(`.debugger-accordion-item[data-section="${activeSection}"]`);
    if (targetItem) {
      targetItem.classList.add('active');
      setTimeout(() => {
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }

  // Load Transition Configuration of Custom Elements
  function loadCustomElementConfig(element) {
    currentCustomElement = element;
    
    // Build selector name
    let tag = element.tagName.toLowerCase();
    let name = tag;
    if (element.id) {
      name += '#' + element.id;
    } else if (element.className) {
      const classes = Array.from(element.classList).filter(c => c !== 'motion-inspect-hover' && c !== 'anim-done');
      if (classes.length) {
        name += '.' + classes[0];
      }
    }
    customElementTitle.textContent = `选中元素动画 (${name.toUpperCase()})`;

    const selector = getUniqueSelector(element);
    let duration = 0.75;
    let delay = 0.0;
    let ease = 'cubic-bezier(0.19, 1, 0.22, 1)'; // default ease-out-expo

    const saved = config.customElements[selector];
    if (saved) {
      duration = saved.duration;
      delay = saved.delay;
      ease = saved.ease;
    } else {
      // Read computed styling from browser
      const style = window.getComputedStyle(element);
      const computedDur = style.transitionDuration;
      if (computedDur && computedDur !== '0s') {
        duration = parseFloat(computedDur.split(',')[0]) || 0.75;
      }
      const computedDelay = style.transitionDelay;
      if (computedDelay && computedDelay !== '0s') {
        delay = parseFloat(computedDelay.split(',')[0]) || 0.0;
      }
      const computedEase = style.transitionTimingFunction;
      if (computedEase && computedEase !== 'ease') {
        ease = computedEase.split(',')[0].trim();
      }
    }

    // Sync sliders
    slideCustomDuration.value = duration;
    valCustomDuration.textContent = duration.toFixed(2);
    
    slideCustomDelay.value = delay;
    valCustomDelay.textContent = delay.toFixed(2);

    // Sync ease selector
    let foundPreset = false;
    const options = selectCustomEase.options;
    for (let i = 0; i < options.length; i++) {
      const optVal = options[i].value.replace(/\s+/g, '');
      const normEase = ease.replace(/\s+/g, '');
      if (optVal === normEase) {
        selectCustomEase.selectedIndex = i;
        foundPreset = true;
        break;
      }
    }

    if (foundPreset) {
      customBezierContainer.style.display = 'none';
    } else {
      const match = ease.match(/cubic-bezier\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
      if (match) {
        selectCustomEase.value = 'custom';
        customBezierContainer.style.display = 'block';
        
        slideCustomX1.value = parseFloat(match[1]);
        valCustomX1.textContent = parseFloat(match[1]).toFixed(2);
        
        slideCustomY1.value = parseFloat(match[2]);
        valCustomY1.textContent = parseFloat(match[2]).toFixed(2);
        
        slideCustomX2.value = parseFloat(match[3]);
        valCustomX2.textContent = parseFloat(match[3]).toFixed(2);
        
        slideCustomY2.value = parseFloat(match[4]);
        valCustomY2.textContent = parseFloat(match[4]).toFixed(2);
      } else {
        selectCustomEase.selectedIndex = 0;
        customBezierContainer.style.display = 'none';
      }
    }
  }

  // Apply tuned values dynamically to selected Custom Element
  function applyCustomElementStyles() {
    if (!currentCustomElement) return;

    const duration = parseFloat(slideCustomDuration.value);
    const delay = parseFloat(slideCustomDelay.value);
    
    let ease = selectCustomEase.value;
    if (ease === 'custom') {
      const x1 = parseFloat(slideCustomX1.value);
      const y1 = parseFloat(slideCustomY1.value);
      const x2 = parseFloat(slideCustomX2.value);
      const y2 = parseFloat(slideCustomY2.value);
      
      valCustomX1.textContent = x1.toFixed(2);
      valCustomY1.textContent = y1.toFixed(2);
      valCustomX2.textContent = x2.toFixed(2);
      valCustomY2.textContent = y2.toFixed(2);
      
      ease = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
    }

    valCustomDuration.textContent = duration.toFixed(2);
    valCustomDelay.textContent = delay.toFixed(2);

    // Override element transitions with inline styles
    currentCustomElement.style.transitionDuration = duration + 's';
    currentCustomElement.style.transitionDelay = delay + 's';
    currentCustomElement.style.transitionTimingFunction = ease;

    // Save to configuration
    const selector = getUniqueSelector(currentCustomElement);
    config.customElements[selector] = {
      duration: duration,
      delay: delay,
      ease: ease
    };
  }

  [slideCustomDuration, slideCustomDelay].forEach(slider => {
    slider.addEventListener('input', applyCustomElementStyles);
  });

  selectCustomEase.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customBezierContainer.style.display = 'block';
    } else {
      customBezierContainer.style.display = 'none';
    }
    applyCustomElementStyles();
  });

  [slideCustomX1, slideCustomY1, slideCustomX2, slideCustomY2].forEach(slider => {
    slider.addEventListener('input', applyCustomElementStyles);
  });

  // Replay Custom Element CSS transition
  btnReplayCustom.addEventListener('click', () => {
    if (!currentCustomElement) return;

    currentCustomElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Handle scroll reveal elements
    if (currentCustomElement.classList.contains('anim-up')) {
      currentCustomElement.classList.remove('anim-done');
      void currentCustomElement.offsetHeight; // Force reflow
      currentCustomElement.classList.add('anim-done');
    } else if (currentCustomElement.id === 'footerCta') {
      currentCustomElement.classList.remove('revealed');
      void currentCustomElement.offsetHeight;
      currentCustomElement.classList.add('revealed');
    } else {
      // Toggle transition state temporarily to replay transition animations
      const oldTransition = currentCustomElement.style.transition;
      currentCustomElement.style.transition = 'none';
      const oldOpacity = currentCustomElement.style.opacity;
      const oldTransform = currentCustomElement.style.transform;
      
      currentCustomElement.style.opacity = '0';
      currentCustomElement.style.transform = 'translateY(15px)';
      void currentCustomElement.offsetHeight; // trigger reflow
      
      currentCustomElement.style.transition = oldTransition;
      currentCustomElement.style.opacity = oldOpacity;
      currentCustomElement.style.transform = oldTransform;
    }
  });

  // ── BIND SLIDERS AND CONTROLS TO CONFIG OBJECT ──
  const config = window.__motionDebuggerConfig;

  // Title controls
  const slideTitleDuration = document.getElementById('slide-title-duration');
  const valTitleDuration = document.getElementById('val-title-duration');
  slideTitleDuration.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valTitleDuration.textContent = v.toFixed(2);
    config.worksTitle.duration = v;
  });

  const slideTitleDelay = document.getElementById('slide-title-delay');
  const valTitleDelay = document.getElementById('val-title-delay');
  slideTitleDelay.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valTitleDelay.textContent = v.toFixed(2);
    config.worksTitle.delay = v;
  });

  const slideTitleY = document.getElementById('slide-title-y');
  const valTitleY = document.getElementById('val-title-y');
  slideTitleY.addEventListener('input', (e) => {
    const v = parseInt(e.target.value, 10);
    valTitleY.textContent = v;
    config.worksTitle.y = v + 'vh';
  });

  const selectTitleEase = document.getElementById('select-title-ease');
  const titleBezierContainer = document.getElementById('title-bezier-container');
  const slideX1 = document.getElementById('slide-title-x1');
  const valX1 = document.getElementById('val-title-x1');
  const slideY1 = document.getElementById('slide-title-y1');
  const valY1 = document.getElementById('val-title-y1');
  const slideX2 = document.getElementById('slide-title-x2');
  const valX2 = document.getElementById('val-title-x2');
  const slideY2 = document.getElementById('slide-title-y2');
  const valY2 = document.getElementById('val-title-y2');

  function updateBezierEase() {
    const x1 = parseFloat(slideX1.value);
    const y1 = parseFloat(slideY1.value);
    const x2 = parseFloat(slideX2.value);
    const y2 = parseFloat(slideY2.value);
    
    valX1.textContent = x1.toFixed(2);
    valY1.textContent = y1.toFixed(2);
    valX2.textContent = x2.toFixed(2);
    valY2.textContent = y2.toFixed(2);
    
    const easeStr = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
    
    // Register custom Bezier dynamically
    gsap.registerEase(easeStr, cubicBezier(x1, y1, x2, y2));
    config.worksTitle.ease = easeStr;
  }

  selectTitleEase.addEventListener('change', (e) => {
    const v = e.target.value;
    if (v === 'custom') {
      titleBezierContainer.style.display = 'block';
      updateBezierEase();
    } else {
      titleBezierContainer.style.display = 'none';
      config.worksTitle.ease = v;
      if (v.startsWith('cubic-bezier')) {
        const match = v.match(/cubic-bezier\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
        if (match) {
          const x1 = parseFloat(match[1]);
          const y1 = parseFloat(match[2]);
          const x2 = parseFloat(match[3]);
          const y2 = parseFloat(match[4]);
          gsap.registerEase(v, cubicBezier(x1, y1, x2, y2));
        }
      }
    }
  });

  [slideX1, slideY1, slideX2, slideY2].forEach(slider => {
    slider.addEventListener('input', updateBezierEase);
  });

  // Cards controls
  const slideCardsDuration = document.getElementById('slide-cards-duration');
  const valCardsDuration = document.getElementById('val-cards-duration');
  slideCardsDuration.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valCardsDuration.textContent = v.toFixed(1);
    config.worksCards.duration = v;
  });

  const slideCardsStagger = document.getElementById('slide-cards-stagger');
  const valCardsStagger = document.getElementById('val-cards-stagger');
  slideCardsStagger.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valCardsStagger.textContent = v.toFixed(2);
    config.worksCards.stagger = v;
  });

  const selectCardsEase = document.getElementById('select-cards-ease');
  selectCardsEase.addEventListener('change', (e) => {
    const v = e.target.value;
    config.worksCards.ease = v;
    if (v.startsWith('cubic-bezier')) {
      const match = v.match(/cubic-bezier\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
      if (match) {
        const x1 = parseFloat(match[1]);
        const y1 = parseFloat(match[2]);
        const x2 = parseFloat(match[3]);
        const y2 = parseFloat(match[4]);
        gsap.registerEase(v, cubicBezier(x1, y1, x2, y2));
      }
    }
  });

  // Chroma Blob controls
  const slideChromaDuration = document.getElementById('slide-chroma-duration');
  const valChromaDuration = document.getElementById('val-chroma-duration');
  slideChromaDuration.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valChromaDuration.textContent = v.toFixed(2);
    config.chromaBlob.duration = v;
  });

  const selectChromaEase = document.getElementById('select-chroma-ease');
  selectChromaEase.addEventListener('change', (e) => {
    config.chromaBlob.ease = e.target.value;
  });

  // Scroll Length control
  const slideScrollLength = document.getElementById('slide-scroll-length');
  const valScrollLength = document.getElementById('val-scroll-length');
  slideScrollLength.addEventListener('input', (e) => {
    const v = parseInt(e.target.value, 10);
    valScrollLength.textContent = v;
    config.scrollLength = v;

    // Trigger rebuild of scrollTrigger in real time so users see the pinning length changes
    if (typeof window.__rebuildWorksCinema === 'function') {
      window.__rebuildWorksCinema();
    }
  });

  // ── REPLAY ANIMATION SEQUENCER ──
  function replayAnimationSequence() {
    // 1. Scroll top of works section to top of viewport
    const workSection = document.querySelector('#work');
    if (workSection) {
      workSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 2. Dispatch reset event to hide cards and clear entrance flags
    window.dispatchEvent(new CustomEvent('works-cinema-reset'));

    // 3. Rebuild the timelines/ScrollTriggers with latest configs
    if (typeof window.__rebuildWorksCinema === 'function') {
      window.__rebuildWorksCinema();
    }

    // 4. Play the cinema intro timeline from beginning
    if (window.__worksTitleTimeline) {
      window.__worksTitleTimeline.play(0);
    }

    // 5. Trigger cards fly-in after title rise lands
    const titleDuration = parseFloat(config.worksTitle.duration) || 1.6;
    const titleDelay = parseFloat(config.worksTitle.delay) || 0.25;
    const totalWait = (titleDuration + titleDelay) * 1000 + 100; // in milliseconds

    setTimeout(() => {
      // Dispatch entrance event to trigger cards animation
      window.dispatchEvent(new CustomEvent('works-cinema-complete'));
    }, totalWait);
  }

  replayBtn.addEventListener('click', replayAnimationSequence);

  // ── COPY PARAMETERS TO CLIPBOARD ──
  copyBtn.addEventListener('click', () => {
    // Generate beautiful and readable JSON output format
    const outputData = {
      "大标题入场动画 (worksTitle)": {
        "持续时间 (duration)": config.worksTitle.duration,
        "延迟时间 (delay)": config.worksTitle.delay,
        "起始位移 (y)": config.worksTitle.y,
        "缓动曲线 (ease)": config.worksTitle.ease
      },
      "作品卡片动画 (worksCards)": {
        "持续时间 (duration)": config.worksCards.duration,
        "stagger间隔 (stagger)": config.worksCards.stagger,
        "缓动曲线 (ease)": config.worksCards.ease
      },
      "背景光斑渐变 (chromaBlob)": {
        "渐变时间 (duration)": config.chromaBlob.duration,
        "缓动曲线 (ease)": config.chromaBlob.ease
      },
      "固定滚动长度 (scrollLength)": config.scrollLength
    };

    // Include custom elements if adjusted
    if (config.customElements && Object.keys(config.customElements).length > 0) {
      outputData["自定义网页元素动画 (customElements)"] = config.customElements;
    }

    const commentText = 
`// Crescent Portfolio 动画调试参数结果
// 将以下 JSON 复制发送给 AI 助手，它将能够一键解析并修改代码。
`;
    const fullText = commentText + JSON.stringify(outputData, null, 2);

    navigator.clipboard.writeText(fullText).then(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }).catch(err => {
      console.error('Copy failed, using backup alert log: ', err);
      alert('复制失败，请打开控制台查看参数！');
      console.log(fullText);
    });
  });
})();
