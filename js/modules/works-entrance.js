import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const cards = gsap.utils.toArray('.work-card');
const section = document.querySelector('.works');

if (cards.length && section) {
  const cardData = [];
  let animationStarted = false;
  let animationCompleted = false;

  // Measure static coordinates relative to the document
  function measureCards() {
    if (animationCompleted) return;

    // Save current scroll to restore later (so we can measure clean positions)
    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

    // Save current transform/opacity/filter inline values to restore after measurement
    const originalStyles = cards.map(card => ({
      transform: card.style.transform,
      opacity: card.style.opacity,
      filter: card.style.filter
    }));

    // Temporarily clear inline GSAP transform/opacity styles to read natural layout
    cards.forEach(card => {
      gsap.set(card, { clearProps: 'transform,opacity,filter' });
    });

    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      cardData[idx] = {
        element: card,
        pageLeft: rect.left + currentScrollX,
        pageTop: rect.top + currentScrollY,
        width: rect.width,
        height: rect.height
      };
    });

    // Restore original styles
    cards.forEach((card, idx) => {
      const styles = originalStyles[idx];
      gsap.set(card, {
        transform: styles.transform,
        opacity: styles.opacity,
        filter: styles.filter
      });
    });

    // Re-hide cards after measurement ONLY if the animation hasn't started yet
    if (!animationStarted) {
      cards.forEach(card => {
        gsap.set(card, { opacity: 0 });
      });
    }
  }

  // Initial measurement
  measureCards();

  // Re-measure on window load and window resize
  window.addEventListener('load', measureCards);
  window.addEventListener('resize', measureCards);

  // Create GSAP ScrollTrigger timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      id: 'worksEntrance',
      trigger: '#work',
      start: 'top 85%', // Plays when the top of `#work` enters 85% of viewport height
      toggleActions: 'play none none none' // Play once and stay revealed
    },
    onStart: () => {
      animationStarted = true;
    },
    onComplete: () => {
      animationCompleted = true;
      window.removeEventListener('load', measureCards);
      window.removeEventListener('resize', measureCards);
    }
  });

  // Setup flight parameters for each card
  cards.forEach((card, idx) => {
    const animState = { progress: 0 };

    tl.to(animState, {
      progress: 1,
      duration: 1.6,
      ease: 'elastic.out(1, 0.75)',
      onStart: () => {
        // Ensure card is visible at start of tween
        gsap.set(card, { opacity: 0.01 });
      },
      onUpdate: () => {
        const data = cardData[idx];
        if (!data) return;

        const p = animState.progress;

        // Dynamic starting offset relative to current scroll position
        const startX = window.scrollX - data.pageLeft - data.width * 2.0;
        const startY = window.scrollY - data.pageTop - data.height * 2.0;

        // Direction vector from start to destination (0, 0)
        const dx = -startX;
        const dy = -startY;
        const dist = Math.hypot(dx, dy) || 1;

        // Perpendicular vector for the curve (bulge) direction
        // Bending downwards and leftwards for a nice sweeping arc
        const px = -dy / dist;
        const py = dx / dist;

        // Exaggerated curve distance
        const maxBulge = window.innerWidth > 768 ? 320 : 120;

        // Calculate current offsets
        const baseX = gsap.utils.interpolate(startX, 0, p);
        const baseY = gsap.utils.interpolate(startY, 0, p);
        const bulge = Math.sin(p * Math.PI) * maxBulge;

        const currentX = baseX + px * bulge;
        const currentY = baseY + py * bulge;

        // Interpolate scale, rotation, blur, and opacity
        const scale = gsap.utils.interpolate(4.5, 1.0, p);
        const rotate = gsap.utils.interpolate(-60, 0, p);
        const opacity = gsap.utils.interpolate(0, 1, p);
        const blur = gsap.utils.interpolate(15, 0, p);

        gsap.set(card, {
          x: currentX,
          y: currentY,
          scale: scale,
          rotation: rotate,
          opacity: opacity,
          filter: `blur(${blur}px)`,
          pointerEvents: p > 0.82 ? 'auto' : 'none' // Enable clicks/hover near completion
        });
      },
      onComplete: () => {
        // Clear GSAP inline styles to hand over styling back to CSS (hover effects, etc.)
        gsap.set(card, { clearProps: 'all' });
      }
    }, idx * 0.16); // Stagger cards by 0.16s
  });

  // ==========================================
  // 🛸 调试舱：临时控制面板与循环播放预览 (Temporary Control Panel)
  // ==========================================
  let activeTimeline = null;
  let loopTimeout = null;
  let isLooping = false;

  function runFlightAnimation(selectedEase, selectedDuration, selectedStagger) {
    if (activeTimeline) activeTimeline.kill();
    if (loopTimeout) clearTimeout(loopTimeout);

    // Reset cards
    cards.forEach(card => {
      gsap.killTweensOf(card);
      gsap.set(card, { clearProps: 'all' });
    });

    measureCards();

    cards.forEach(card => {
      gsap.set(card, { opacity: 0 });
    });

    animationStarted = true;
    animationCompleted = false;

    activeTimeline = gsap.timeline({
      onComplete: () => {
        if (isLooping) {
          loopTimeout = setTimeout(() => {
            runFlightAnimation(selectedEase, selectedDuration, selectedStagger);
          }, 1500);
        }
      }
    });

    cards.forEach((card, idx) => {
      const animState = { progress: 0 };
      activeTimeline.to(animState, {
        progress: 1,
        duration: selectedDuration,
        ease: selectedEase,
        onStart: () => {
          gsap.set(card, { opacity: 0.01 });
        },
        onUpdate: () => {
          const data = cardData[idx];
          if (!data) return;

          const p = animState.progress;
          const startX = window.scrollX - data.pageLeft - data.width * 2.0;
          const startY = window.scrollY - data.pageTop - data.height * 2.0;

          const dx = -startX;
          const dy = -startY;
          const dist = Math.hypot(dx, dy) || 1;

          const px = -dy / dist;
          const py = dx / dist;

          const maxBulge = window.innerWidth > 768 ? 320 : 120;

          const baseX = gsap.utils.interpolate(startX, 0, p);
          const baseY = gsap.utils.interpolate(startY, 0, p);
          const bulge = Math.sin(p * Math.PI) * maxBulge;

          const currentX = baseX + px * bulge;
          const currentY = baseY + py * bulge;

          const scale = gsap.utils.interpolate(4.5, 1.0, p);
          const rotate = gsap.utils.interpolate(-60, 0, p);
          const opacity = gsap.utils.interpolate(0, 1, p);
          const blur = gsap.utils.interpolate(15, 0, p);

          gsap.set(card, {
            x: currentX,
            y: currentY,
            scale: scale,
            rotation: rotate,
            opacity: opacity,
            filter: `blur(${blur}px)`,
            pointerEvents: p > 0.82 ? 'auto' : 'none'
          });
        },
        onComplete: () => {
          gsap.set(card, { clearProps: 'all' });
        }
      }, idx * selectedStagger);
    });
  }

  function createControlPanel() {
    if (document.getElementById('entrance-preview-panel')) return;

    // Kill default ScrollTrigger on panel activation
    const trigger = ScrollTrigger.getById('worksEntrance');
    if (trigger) trigger.kill();
    if (tl) tl.kill();

    const panel = document.createElement('div');
    panel.id = 'entrance-preview-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 320px;
      background: rgba(18, 18, 18, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 20px;
      color: #fff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      z-index: 999999;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: default !important;
    `;

    const eases = [
      { name: '🧬 Elastic Out - Tech (科技感软弹簧)', value: 'elastic.out(1, 0.75)' },
      { name: '✨ Expo Out (极速切入后慢吸附)', value: 'expo.out' },
      { name: '🚀 Power4 Out (迅猛自如缓动)', value: 'power4.out' },
      { name: '⚡ Power3 Out (均衡舒适缓动)', value: 'power3.out' },
      { name: '⚪ Circ Out (高敏急刹减速)', value: 'circ.out' },
      { name: '↩️ Back Out - Soft (轻微回弹落地)', value: 'back.out(1.2)' },
      { name: '🪃 Back Out - Hard (动感深回弹落地)', value: 'back.out(2.5)' },
      { name: '🎯 Elastic Out - Spring (超强果冻回弹)', value: 'elastic.out(1.2, 0.4)' },
      { name: '🎭 Expo InOut (慢速起跑快冲慢收)', value: 'expo.inOut' },
      { name: '💥 Bounce Out (物理弹跳落地)', value: 'bounce.out' }
    ];

    const easeOptions = eases.map(e => `<option value="${e.value}">${e.name}</option>`).join('');

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h4 style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; background: linear-gradient(135deg, #ff7e5f, #feb47b); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🛸 飞入动画调试舱</h4>
        <button id="close-preview-panel" style="background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 18px; padding: 0; line-height: 1; transition: color 0.2s;">&times;</button>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.5); margin-bottom: 6px;">选择速度曲线 (Ease)</label>
        <select id="preview-ease" style="width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; padding: 8px 10px; font-size: 12px; outline: none; cursor: pointer;">
          ${easeOptions}
        </select>
      </div>

      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <label style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.5);">动画时长 (Duration)</label>
          <span id="val-duration" style="font-size: 11px; color: #ff7e5f; font-weight: 600;">1.6s</span>
        </div>
        <input type="range" id="preview-duration" min="0.5" max="4.0" step="0.1" value="1.6" style="width: 100%; accent-color: #ff7e5f; cursor: pointer; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <label style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.5);">卡片间隔 (Stagger)</label>
          <span id="val-stagger" style="font-size: 11px; color: #ff7e5f; font-weight: 600;">0.16s</span>
        </div>
        <input type="range" id="preview-stagger" min="0.0" max="0.5" step="0.02" value="0.16" style="width: 100%; accent-color: #ff7e5f; cursor: pointer; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05);">
        <span style="font-size: 12px; color: rgba(255,255,255,0.8);">🔁 循环自动播测试</span>
        <label class="switch" style="position: relative; display: inline-block; width: 34px; height: 18px; cursor: pointer;">
          <input type="checkbox" id="preview-loop" checked style="opacity: 0; width: 0; height: 0;">
          <span class="slider" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.2); transition: .4s; border-radius: 20px;"></span>
        </label>
      </div>

      <div style="display: flex; gap: 8px;">
        <button id="btn-play-preview" style="flex: 1; background: linear-gradient(135deg, #ff7e5f, #feb47b); border: none; border-radius: 8px; color: #fff; padding: 10px; font-weight: 600; cursor: pointer; transition: transform 0.2s, opacity 0.2s; font-size: 12px; box-shadow: 0 4px 15px rgba(255, 126, 95, 0.2);">▶ 播放动画</button>
        <button id="btn-scroll-to-works" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; padding: 10px 12px; font-size: 12px; cursor: pointer; transition: background 0.2s;">📌 视口对齐</button>
      </div>
    `;

    document.body.appendChild(panel);

    const styleEl = document.createElement('style');
    styleEl.id = 'entrance-preview-styles';
    styleEl.innerHTML = `
      #entrance-preview-panel,
      #entrance-preview-panel * {
        cursor: default !important;
      }
      #entrance-preview-panel select,
      #entrance-preview-panel select option,
      #entrance-preview-panel input,
      #entrance-preview-panel button,
      #entrance-preview-panel #close-preview-panel,
      #entrance-preview-panel .slider {
        cursor: pointer !important;
      }
      #entrance-preview-panel input:checked + .slider {
        background-color: #ff7e5f !important;
      }
      #entrance-preview-panel .slider:before {
        position: absolute;
        content: "";
        height: 12px;
        width: 12px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      #entrance-preview-panel input:checked + .slider:before {
        transform: translateX(16px);
      }
      #entrance-preview-panel select option {
        background: #181818;
        color: #fff;
      }
      #entrance-preview-panel button:hover {
        opacity: 0.95;
        transform: translateY(-1px);
      }
      #entrance-preview-panel button:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(styleEl);

    requestAnimationFrame(() => {
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    });

    const selectEase = panel.querySelector('#preview-ease');
    const inputDuration = panel.querySelector('#preview-duration');
    const inputStagger = panel.querySelector('#preview-stagger');
    const inputLoop = panel.querySelector('#preview-loop');
    const valDuration = panel.querySelector('#val-duration');
    const valStagger = panel.querySelector('#val-stagger');
    const btnPlay = panel.querySelector('#btn-play-preview');
    const btnScroll = panel.querySelector('#btn-scroll-to-works');
    const btnClose = panel.querySelector('#close-preview-panel');

    inputDuration.addEventListener('input', (e) => {
      valDuration.textContent = parseFloat(e.target.value).toFixed(1) + 's';
    });
    inputStagger.addEventListener('input', (e) => {
      valStagger.textContent = parseFloat(e.target.value).toFixed(2) + 's';
    });

    isLooping = inputLoop.checked;
    inputLoop.addEventListener('change', (e) => {
      isLooping = e.target.checked;
      if (isLooping) {
        triggerPlay();
      } else {
        if (loopTimeout) clearTimeout(loopTimeout);
      }
    });

    function triggerPlay() {
      const ease = selectEase.value;
      const duration = parseFloat(inputDuration.value);
      const stagger = parseFloat(inputStagger.value);
      runFlightAnimation(ease, duration, stagger);
    }

    btnPlay.addEventListener('click', () => {
      triggerPlay();
    });

    btnScroll.addEventListener('click', () => {
      const worksSection = document.querySelector('#work');
      if (worksSection) {
        worksSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    btnClose.addEventListener('click', () => {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(20px)';
      setTimeout(() => {
        panel.remove();
        styleEl.remove();
      }, 400);

      isLooping = false;
      if (loopTimeout) clearTimeout(loopTimeout);
      if (activeTimeline) activeTimeline.kill();

      cards.forEach(card => {
        gsap.killTweensOf(card);
        gsap.set(card, { clearProps: 'all' });
      });

      createOpenBadge();
    });

    setTimeout(() => {
      const worksSection = document.querySelector('#work');
      if (worksSection) {
        worksSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      triggerPlay();
    }, 600);
  }

  function createOpenBadge() {
    if (document.getElementById('entrance-preview-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'entrance-preview-badge';
    badge.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #ff7e5f, #feb47b);
      border-radius: 30px;
      padding: 10px 18px;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer !important;
      box-shadow: 0 10px 25px rgba(255, 126, 95, 0.4);
      z-index: 999999;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    badge.innerHTML = '🛸 调试飞入入场';
    document.body.appendChild(badge);

    requestAnimationFrame(() => {
      badge.style.opacity = '1';
      badge.style.transform = 'scale(1)';
    });

    badge.addEventListener('click', () => {
      badge.style.opacity = '0';
      badge.style.transform = 'scale(0.8)';
      setTimeout(() => {
        badge.remove();
        createControlPanel();
      }, 300);
    });
  }

  if (document.readyState === 'complete') {
    createControlPanel();
  } else {
    window.addEventListener('load', createControlPanel);
  }
}

