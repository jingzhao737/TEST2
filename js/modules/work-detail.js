;// ═══════════ WORK DETAIL ═══════════
document.querySelectorAll('.work-card').forEach(function(card) {
  // Keyboard accessibility
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  function openCard() {
    let key = card.dataset.work; if (!window.workData || !window.workData[key]) return;
    let data = Object.assign({ slug: key }, window.workData[key]);
    if (window.openDetail) {
      window.openDetail(data, card.dataset.hero);
    }
  }

  card.addEventListener('click', openCard);
  card.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCard();
    }
  });
});

// Fallback click handler on background/empty spaces of the 3D-tilted list
(function() {
  const worksEl = document.querySelector('.works');
  if (worksEl) {
    worksEl.addEventListener('click', function(e) {
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
