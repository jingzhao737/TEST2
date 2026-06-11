import gsap from 'gsap';

// ═══════════ LOADING ═══════════
(function() {
  let numEl = document.getElementById('loaderNumber');
  let bar = document.getElementById('loaderBar');
  let loaderEl = document.getElementById('loader');
  if (!numEl || !loaderEl) { revealCrescent(); if (loaderEl) loaderEl.style.display = 'none'; document.body.style.cursor = 'none'; return; }

  // Initial setup for HUD and inner elements entrance
  gsap.set('.loader-hud', { opacity: 0, scale: 0.95 });
  gsap.set(numEl, { opacity: 0, scale: 0.9 });
  gsap.set('.loader-bar-track', { opacity: 0, width: 0 });
  gsap.set('.loader-sub', { opacity: 0, y: 10 });

  // Entrance animation
  const introTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.0 } });
  introTl.to(numEl, { opacity: 1, scale: 1, duration: 1.2 }, 0);
  introTl.to('.loader-bar-track', { opacity: 1, width: 280, duration: 1.2 }, 0.2);
  introTl.to('.loader-sub', { opacity: 0.4, y: 0, duration: 1.0 }, 0.4);
  introTl.to('.loader-hud', { 
    opacity: 0.35, 
    scale: 1, 
    stagger: 0.1,
    duration: 1.0 
  }, 0.5);

  let total = 50, count = 0;
  let iv = setInterval(function() {
    count++;
    let raw = count / total;
    let eased = 1 - Math.pow(1 - raw, 3);
    let num = Math.floor(eased * 100);
    
    // Add dynamic scramble numbers occasionally to make it look hyper-technical/computational
    if (count < total && Math.random() > 0.65) {
      let scrambleVal = Math.floor(Math.random() * 100);
      numEl.innerHTML = scrambleVal + '<span class="pct">%</span>';
    } else {
      numEl.innerHTML = num + '<span class="pct">%</span>';
    }
    
    if (bar) bar.style.width = (eased * 100) + '%';

    if (count >= total) {
      clearInterval(iv);
      numEl.innerHTML = '100<span class="pct">%</span>';
      if (bar) bar.style.width = '100%';
      
      setTimeout(function() {
        // High-end outro timeline using GSAP
        const outroTl = gsap.timeline({
          onComplete: function() {
            loaderEl.style.display = 'none';
            document.body.style.cursor = 'none';
          }
        });

        // 1. Shutter/Push HUD items outwards
        outroTl.to('.loader-hud.hud-tl', { y: -24, x: -24, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0);
        outroTl.to('.loader-hud.hud-tr', { y: -24, x: 24, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0);
        outroTl.to('.loader-hud.hud-bl', { y: 24, x: -24, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0);
        outroTl.to('.loader-hud.hud-br', { y: 24, x: 24, opacity: 0, duration: 0.5, ease: 'power3.in' }, 0);

        // 2. Shrink and blur out the loader inner content
        outroTl.to([numEl, '.loader-bar-track', '.loader-sub'], {
          opacity: 0,
          scale: 0.9,
          filter: 'blur(10px)',
          stagger: 0.05,
          duration: 0.5,
          ease: 'power3.in'
        }, 0.05);

        // 3. Smooth slide up and fade out the entire loader overlay panel
        outroTl.to(loaderEl, {
          yPercent: -100,
          opacity: 0,
          duration: 1.0,
          ease: 'power4.inOut'
        }, 0.2);

        // 4. Trigger the home page crescent animations right as the shutter opens
        outroTl.call(revealCrescent, null, 0.35);

      }, 350);
    }
  }, 32);

  function revealCrescent() {
    window.loaderFinished = true;
    if (typeof window.revealHeroTitle === 'function') {
      window.revealHeroTitle();
    }
  }
})();
