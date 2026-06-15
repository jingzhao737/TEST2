import gsap from 'gsap';

;// ═══════════ WORK DETAIL ═══════════
document.querySelectorAll('.work-card').forEach(function(card) {
  // Keyboard accessibility
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  function openCard(e) {
    if (window.__isDraggingTheme) return;
    if (card.getAttribute('data-clicked') === 'true') return;
    card.setAttribute('data-clicked', 'true');

    // Create click coordinates relative to card
    let rect = card.getBoundingClientRect();
    let x, y;
    if (e && e.clientX !== undefined && e.clientX !== 0) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      x = rect.width / 2;
      y = rect.height / 2;
    }

    // Append ripple element
    let ripple = document.createElement('span');
    ripple.className = 'card-click-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    card.appendChild(ripple);

    // Tactile 3D press - compress quickly and spring back up with a premium back.out ease (wobble overshoot)
    let tl = gsap.timeline();
    tl.to(card, {
      scale: 0.95,
      z: -40,
      duration: 0.08,
      ease: 'power2.out'
    });
    tl.to(card, {
      scale: 1,
      z: 0,
      duration: 0.32,
      ease: 'back.out(2.5)' // snappy spring rebound overshoot
    });

    // Momentarily delay route transition (280ms) to allow the organic spring rebound to be fully visible
    setTimeout(function() {
      let key = card.dataset.work; if (!window.workData || !window.workData[key]) return;
      let data = Object.assign({ slug: key }, window.workData[key]);
      if (window.openDetail) {
        window.openDetail(data, card.dataset.hero);
      }
      card.removeAttribute('data-clicked');
      // Clean up ripple element after animation ends
      setTimeout(function() {
        ripple.remove();
      }, 800);
    }, 280);
  }

  card.addEventListener('click', openCard);
  card.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCard(e);
    }
  });
});

// Fallback click handler on background/empty spaces of the 3D-tilted list
(function() {
  const worksEl = document.querySelector('.works');
  if (worksEl) {
    worksEl.addEventListener('click', function(e) {
      if (window.__isDraggingTheme) return;
      // If the click is inside a work-card or other interactive elements, let them handle it
      if (e.target.closest('.work-card') || e.target.closest('a, button, [role="button"]:not(.work-card)')) {
        return;
      }
      // Otherwise, if a card is visually hovered in 3D projection, trigger its click
      if (window.__hoveredCardIndex !== undefined && window.__hoveredCardIndex >= 0) {
        const cards = document.querySelectorAll('.work-card');
        const card = cards[window.__hoveredCardIndex];
        if (card) {
          card.click();
        }
      }
    });
  }
})();
