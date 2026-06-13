import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
gsap.registerPlugin(Flip);

const workDetail = document.getElementById('workDetail');
const pageTransition = document.getElementById('pageTransition');

// ═══════════ HASH ROUTER ═══════════
const ROUTE_PREFIX = '#/work/';
let detailOpenedFromHash = false;
let savedScrollY = 0;
let isRouteTransitioning = false;
Object.defineProperty(window, '__isRouteTransitioning', {
  get() { return isRouteTransitioning; },
  set(val) { isRouteTransitioning = val; },
  configurable: true
});
window.__isDetailClosing = false;

function buildGalleryHTML(gallery) {
  if (!gallery || !gallery.length) return '';
  // Determine layout class based on count
  let layoutClass = '';
  if (gallery.length === 1) layoutClass = 'layout-1';
  else if (gallery.length === 2) layoutClass = 'layout-2';
  else if (gallery.length === 3) layoutClass = 'layout-3';
  else if (gallery.length === 4) layoutClass = 'layout-4';
  else if (gallery.length === 5) layoutClass = 'layout-5';
  else layoutClass = 'layout-masonry';

  let html = '<div class="detail-gallery ' + layoutClass + '">';
  for (let i = 0; i < gallery.length; i++) {
    const item = gallery[i];
    const src = typeof item === 'string' ? item : item.src;
    const caption = typeof item === 'string' ? '' : (item.caption || '');
    const desc = typeof item === 'string' ? '' : (item.desc || '');
    html += '<div class="gal-item" data-index="' + i + '">';
    html += '<div class="skeleton"></div>';
    html += '<img src="' + src + '" alt="' + (caption || 'gallery image') + '" loading="lazy" onload="this.classList.add(\'loaded\');this.previousElementSibling.style.display=\'none\'">';
    if (caption) html += '<div class="gal-caption"><div class="gal-caption-title">' + caption + '</div>' + (desc ? '<div class="gal-caption-desc">' + desc + '</div>' : '') + '</div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderDetailContent(data, heroImg) {
  document.getElementById('detailTag').textContent = data.tag;
  document.getElementById('detailTitle').textContent = data.name;
  document.getElementById('detailSubtitle').textContent = data.subtitle;
  // Hero with skeleton
  const heroEl = document.getElementById('detailHeroImg');
  const heroSkeleton = document.getElementById('detailHeroSkeleton');
  if (heroSkeleton) { heroSkeleton.classList.remove('hidden'); }
  heroEl.onload = function() {
    if (heroSkeleton) { heroSkeleton.classList.add('hidden'); }
  };
  heroEl.src = heroImg;
  document.getElementById('detailMeta').innerHTML = Object.keys(data.meta).map(function(k) {
    return '<div class="detail-meta-item"><span class="detail-meta-label">' + k + '</span><span class="detail-meta-value">' + data.meta[k] + '</span></div>';
  }).join('');
  document.getElementById('detailContent').innerHTML = data.content.map(function(s) {
    return '<h2>' + s.h2 + '</h2><p>' + s.p + '</p>';
  }).join('');
  document.getElementById('detailGallery').innerHTML = buildGalleryHTML(data.gallery);
}

function getActivePreviewContainer() {
  const isMobile = ('ontouchstart' in window) || (window.innerWidth <= 768);
  if (isMobile) {
    return document.querySelector('.work-preview-wrapper.mobile-preview .work-preview-img-container');
  } else {
    return document.querySelector('.work-preview-wrapper .work-preview-img-container');
  }
}

function openDetail(data, heroImg, pushState) {
  if (isRouteTransitioning) return;
  isRouteTransitioning = true;

  if (pushState === undefined) pushState = true;
  savedScrollY = window.scrollY;
  if (pushState && data.slug) {
    history.pushState({ work: data.slug }, '', ROUTE_PREFIX + data.slug);
  }
  renderDetailContent(data, heroImg);

  const detailBg = document.getElementById('workDetailBg');
  const detailHeroImg = document.getElementById('detailHeroImg');
  const detailHeroDim = document.getElementById('detailHeroDim');
  const previewContainer = getActivePreviewContainer();
  const detailCard = document.getElementById('workDetailCard');
  const detailBody = workDetail.querySelector('.detail-body');
  const detailClose = document.getElementById('detailClose');
  const detailHeroContent = workDetail.querySelector('.detail-hero-content');
  const detailTag = document.getElementById('detailTag');
  const detailTitle = document.getElementById('detailTitle');
  const detailSubtitle = document.getElementById('detailSubtitle');

  // Kill any running Transitions on these elements to avoid overlap conflicts
  gsap.killTweensOf([
    '#nav', '.works-header', '.work-card', '.h-grid-divider', '#ambientGlow', '#backToTop', '.scroll-bar',
    detailBg, detailCard, detailHeroImg, detailHeroDim, detailClose, detailTag, detailTitle, detailSubtitle, detailBody
  ]);

  const isMobile = ('ontouchstart' in window) || (window.innerWidth <= 768);
  const webgl = window.__worksWebGL;
  const hasWebGL = !isMobile && webgl && webgl.isActive;

  // ── 1. Smooth fade out the hover preview card ──
  if (previewContainer) {
    gsap.to(previewContainer, { opacity: 0, duration: 0.25, ease: 'power2.out' });
  }

  // ── 2. Slide and fade out original works page elements immediately ──
  gsap.to('#nav', { opacity: 0, y: -30, duration: 0.8, ease: 'power3.inOut' });
  gsap.to('.works-header', { opacity: 0, y: -40, duration: 0.8, ease: 'power3.inOut' });
  gsap.to('.work-card', { opacity: 0, y: 50, stagger: 0.04, duration: 0.8, ease: 'power3.inOut' });
  gsap.to(['.h-grid-divider', '#ambientGlow', '#backToTop', '.scroll-bar'], { opacity: 0, duration: 0.5, ease: 'power2.out' });
  const btt = document.getElementById('backToTop');
  if (btt) btt.style.pointerEvents = 'none';
  const sb = document.getElementById('scrollBar');
  if (sb) sb.style.pointerEvents = 'none';

  // ── 3. Prepare detail overlay (visible but transparent, enable pointer-events immediately) ──
  workDetail.classList.add('open');
  workDetail.style.display = 'flex';
  workDetail.style.visibility = 'visible';
  if (window.__updateMagnetTargets) window.__updateMagnetTargets();
  if (detailCard) {
    detailCard.scrollTop = 0;
  }
  document.body.style.overflow = 'hidden';

  // Measure targetRect BEFORE we slide the detailCard down (since it's currently y:0 as rendered)
  let targetRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight * 0.6 };
  if (detailHeroImg) {
    targetRect = detailHeroImg.getBoundingClientRect();
  }

  // ── 4. Set initial content and parallax values ──
  if (hasWebGL) {
    gsap.set(detailHeroImg, { opacity: 0 }); // Hide DOM image during morph
  } else {
    gsap.set(detailHeroImg, { opacity: 1, y: -80, scale: 1.15 });
  }
  if (detailHeroDim) gsap.set(detailHeroDim, { opacity: 0 });
  
  // Backdrop fades in immediately in sync with card slide-up
  if (detailBg) {
    gsap.fromTo(detailBg, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
  }

  gsap.set([detailBody, detailClose], { opacity: 0, y: 30 });
  gsap.set(detailHeroContent, { opacity: 1, y: 0 });
  gsap.set([detailTag, detailTitle, detailSubtitle], { opacity: 0, y: 30 });

  // ── 5. Slide up the card panel from the bottom ──
  if (detailCard) {
    gsap.fromTo(detailCard, {
      y: '100%',
      opacity: 1
    }, {
      y: 0,
      opacity: 1,
      duration: 1.2,
      ease: 'expo.out',
      onComplete: () => {
        if (window.__updateMagnetTargets) window.__updateMagnetTargets();
        isRouteTransitioning = false;
        initGalleryLightbox();
      }
    });
  } else {
    if (window.__updateMagnetTargets) window.__updateMagnetTargets();
    isRouteTransitioning = false;
  }

  // ── 6. Run parallax image sliding / WebGL morph ──
  if (hasWebGL) {
    const startRect = webgl.getCurrentRect();
    webgl.morphTo(startRect, targetRect, heroImg, () => {
      gsap.set(detailHeroImg, { opacity: 1, y: 0, scale: 1.0 });
    });
  } else {
    gsap.to(detailHeroImg, {
      y: 0,
      scale: 1.0,
      duration: 1.2,
      ease: 'expo.out'
    });
  }

  // ── 7. Stagger text content animations ──
  gsap.to(detailClose, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.3 });
  gsap.to(detailTag, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.4 });
  gsap.to(detailTitle, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.5 });
  gsap.to(detailSubtitle, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.6 });
  gsap.to(detailBody, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.55 });
}

function closeDetail(popState) {
  // Allow closing even if isRouteTransitioning is true (e.g. still opening),
  // but prevent closing if we are already closed or closing (checked via classList.contains('open'))
  if (!workDetail.classList.contains('open')) return;
  isRouteTransitioning = true;
  window.__isDetailClosing = true;
  workDetail.classList.remove('open');

  const previewContainer = getActivePreviewContainer();
  const detailBg = document.getElementById('workDetailBg');
  const detailClose = document.getElementById('detailClose');
  const detailHero = workDetail.querySelector('.detail-hero');
  const detailBody = workDetail.querySelector('.detail-body');
  const detailHeroDim = document.getElementById('detailHeroDim');
  const detailCard = document.getElementById('workDetailCard');
  const detailHeroImg = document.getElementById('detailHeroImg');
  const detailTag = document.getElementById('detailTag');
  const detailTitle = document.getElementById('detailTitle');
  const detailSubtitle = document.getElementById('detailSubtitle');

  // Kill any running Transitions on these elements to avoid overlap conflicts
  gsap.killTweensOf([
    '#nav', '.works-header', '.work-card', '.h-grid-divider', '#ambientGlow', '#backToTop', '.scroll-bar',
    detailBg, detailCard, detailHeroImg, detailHeroDim, detailClose, detailTag, detailTitle, detailSubtitle, detailBody
  ]);

  // Fade out backdrop smoothly
  if (detailBg) {
    gsap.to(detailBg, { opacity: 0, duration: 0.6, ease: 'power2.inOut' });
  }

  // Fade original preview container back in smoothly
  if (previewContainer) {
    gsap.to(previewContainer, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }

  // Restore works page elements immediately in sync with detail close
  gsap.to('#nav', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
  gsap.to('.works-header', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
  gsap.to('.work-card', { opacity: 1, y: 0, stagger: 0.04, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
  gsap.to(['.h-grid-divider', '#ambientGlow', '#backToTop', '.scroll-bar'], { opacity: 1, duration: 0.6, ease: 'power2.out', clearProps: 'all' });
  const bttRestore = document.getElementById('backToTop');
  if (bttRestore) bttRestore.style.pointerEvents = '';
  const sbRestore = document.getElementById('scrollBar');
  if (sbRestore) sbRestore.style.pointerEvents = '';

  // Slide down the entire card panel to the bottom!
  if (detailCard) {
    gsap.to(detailCard, {
      y: '100%',
      duration: 0.65,
      ease: 'power3.inOut',
      onComplete: function() {
        workDetail.classList.remove('open');
        if (window.__updateMagnetTargets) window.__updateMagnetTargets();
        workDetail.style.display = 'none';
        workDetail.style.visibility = 'hidden';
        document.body.style.overflow = '';

        // Reset ALL inline styles for next open cycle
        gsap.set([detailClose, detailHero, detailBody], { y: 0, opacity: 1 });
        if (detailCard) gsap.set(detailCard, { y: 0, opacity: 1 });
        if (detailHeroImg) gsap.set(detailHeroImg, { y: 0, scale: 1 });

        // Reset dim overlay
        if (detailHeroDim) gsap.set(detailHeroDim, { opacity: 0 });

        // Reset text elements to hidden start state
        if (detailTag) gsap.set(detailTag, { opacity: 0, y: 24 });
        if (detailTitle) gsap.set(detailTitle, { opacity: 0, y: 24 });
        if (detailSubtitle) gsap.set(detailSubtitle, { opacity: 0, y: 24 });

        // Reset DOM hero image
        if (detailHeroImg) gsap.set(detailHeroImg, { opacity: 1 });

        if (popState) {
          history.replaceState(null, '', ' ' + window.location.pathname + location.hash.replace(ROUTE_PREFIX, '#work'));
        }
        window.scrollTo({ top: savedScrollY, behavior: 'instant' });

        window.__isDetailClosing = false;
        isRouteTransitioning = false;
      }
    });
  } else {
    window.__isDetailClosing = false;
    isRouteTransitioning = false;
  }
}

// Lightbox
let lightboxIndex = 0, lightboxItems = [];

function initGalleryLightbox() {
  const items = workDetail.querySelectorAll('.gal-item');
  items.forEach(function(item, idx) {
    item.onclick = function() { openLightbox(idx); };
  });
}

function openLightbox(index) {
  const items = workDetail.querySelectorAll('.gal-item img');
  lightboxItems = Array.from(items).map(img => img.src);
  lightboxIndex = index;
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  lb.querySelector('.lightbox-img').src = lightboxItems[index];
  lb.querySelector('.lightbox-counter').textContent = (index + 1) + ' / ' + lightboxItems.length;
  lb.classList.add('open');
  if (window.__updateMagnetTargets) window.__updateMagnetTargets();
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  lb.classList.remove('open');
  if (window.__updateMagnetTargets) window.__updateMagnetTargets();
  if (!workDetail.classList.contains('open')) document.body.style.overflow = '';
}

function lightboxPrev() {
  if (lightboxItems.length === 0) return;
  lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
  const lb = document.getElementById('galleryLightbox');
  lb.querySelector('.lightbox-img').src = lightboxItems[lightboxIndex];
  lb.querySelector('.lightbox-counter').textContent = (lightboxIndex + 1) + ' / ' + lightboxItems.length;
}

// Lightbox navigation bindings
function lightboxNext() {
  if (lightboxItems.length === 0) return;
  lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
  const lb = document.getElementById('galleryLightbox');
  lb.querySelector('.lightbox-img').src = lightboxItems[lightboxIndex];
  lb.querySelector('.lightbox-counter').textContent = (lightboxIndex + 1) + ' / ' + lightboxItems.length;
}

// Hash router event listeners
window.addEventListener('popstate', function(e) {
  const hash = window.location.hash;
  if (hash.startsWith(ROUTE_PREFIX) && e.state && e.state.work) {
    const slug = e.state.work;
    const data = window.workData ? window.workData[slug] : null;
    if (data) {
      const dataWithSlug = Object.assign({ slug: slug }, data);
      const heroImg = (window.workHeroMap && window.workHeroMap[slug]) || (data.gallery && data.gallery.length ? (typeof data.gallery[0] === 'string' ? data.gallery[0] : data.gallery[0].src) : '');
      openDetail(dataWithSlug, heroImg, false);
    }
  } else if (workDetail.classList.contains('open')) {
    closeDetail(false);
  }
});

// Check URL on page load
window.addEventListener('load', function() {
  const hash = window.location.hash;
  if (hash.startsWith(ROUTE_PREFIX)) {
    const slug = hash.slice(ROUTE_PREFIX.length);
    const data = window.workData ? window.workData[slug] : null;
    if (data) {
      const dataWithSlug = Object.assign({ slug: slug }, data);
      const heroImg = (window.workHeroMap && window.workHeroMap[slug]) || (data.gallery && data.gallery.length ? (typeof data.gallery[0] === 'string' ? data.gallery[0] : data.gallery[0].src) : '');
      setTimeout(function() { openDetail(dataWithSlug, heroImg, false); }, 500);
    }
  }
});

document.getElementById('detailClose').addEventListener('click', function() { closeDetail(true); });

// Lightbox bindings — run after DOM ready
document.addEventListener('DOMContentLoaded', function() {
  const lbClose = document.querySelector('.lightbox-close');
  const lbPrev = document.querySelector('.lightbox-nav-prev');
  const lbNext = document.querySelector('.lightbox-nav-next');
  const lb = document.querySelector('.gallery-lightbox');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', lightboxPrev);
  if (lbNext) lbNext.addEventListener('click', lightboxNext);
  if (lb) lb.addEventListener('click', function(e) { if (e.target === e.currentTarget) closeLightbox(); });
});

document.addEventListener('keydown', function(e) {
  const lb = document.getElementById('galleryLightbox');
  if (lb && lb.classList.contains('open')) {
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowLeft') { lightboxPrev(); return; }
    if (e.key === 'ArrowRight') { lightboxNext(); return; }
    return;
  }
  if (e.key === 'Escape' && workDetail.classList.contains('open')) { closeDetail(true); return; }
  if (workDetail.classList.contains('open')) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' }); }
  if (e.key === 'ArrowUp') { e.preventDefault(); window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' }); }
});

const workDetailCard = document.getElementById('workDetailCard');
if (workDetailCard) {
  workDetailCard.addEventListener('wheel', function(e) {
    e.stopPropagation();
    let atTop = workDetailCard.scrollTop <= 0, atBottom = workDetailCard.scrollTop + workDetailCard.clientHeight >= workDetailCard.scrollHeight - 2;
    if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) e.preventDefault();
  }, { passive: false });
}

workDetail.addEventListener('wheel', function(e) {
  e.preventDefault();
}, { passive: false });

window.openDetail = openDetail;
window.closeDetail = closeDetail;
