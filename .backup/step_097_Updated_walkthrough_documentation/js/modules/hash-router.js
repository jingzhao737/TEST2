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

let is3DCardActive = false;
let floatTween = null;
let isDragging = false;
let startX = 0;
let startY = 0;
let currentRotateX = 0;
let currentRotateY = 0;
let lastDragTime = 0;
let lastDragX = 0;
let lastDragY = 0;
let velocityRotateX = 0;
let velocityRotateY = 0;

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

  // Set 3D Card image and calculate aspect ratio dimensions
  const card3dImg = document.getElementById('detail3dCardImg');
  if (card3dImg) {
    card3dImg.onload = function() {
      const aspectRatio = card3dImg.naturalWidth / card3dImg.naturalHeight || 16/9;
      const cardEl = document.getElementById('detail3dCard');
      if (cardEl) {
        const isMobile = window.innerWidth <= 768;
        const maxH = isMobile ? window.innerHeight * 0.28 : window.innerHeight * 0.42;
        const height = Math.min(360, Math.max(200, maxH));
        cardEl.style.height = height + 'px';
        cardEl.style.width = (height * aspectRatio) + 'px';
      }
    };
    card3dImg.src = heroImg;
  }

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
  // Disable WebGL morph transition; detail hero image slides up together with the card container
  const hasWebGL = false;

  // ── 1. Smooth fade out the hover preview card ──
  if (previewContainer) {
    gsap.to(previewContainer, { opacity: 0, duration: 0.15, ease: 'power2.out' });
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
  const scrollWrapper = document.getElementById('workDetailScrollWrapper');
  if (scrollWrapper) {
    scrollWrapper.scrollTop = 0;
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
    gsap.set(detailHeroImg, { opacity: 1, y: -80, scale: 1.15, filter: 'none' });
  }
  if (detailHeroDim) gsap.set(detailHeroDim, { opacity: 0 });
  
  // Reset the Apple-style capsule toggle pill button to "Image" state
  const togglePill = document.getElementById('heroTogglePill');
  const togglePillImg = document.getElementById('togglePillImg');
  const togglePillCard = document.getElementById('togglePillCard');
  if (togglePill && togglePillImg && togglePillCard) {
    togglePill.classList.remove('card-active');
    togglePillImg.classList.add('active');
    togglePillCard.classList.remove('active');
  }
  
  // Backdrop fades in immediately in sync with card slide-up
  if (detailBg) {
    gsap.fromTo(detailBg, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
  }

  gsap.set(detailBody, { opacity: 0, y: 30 });
  gsap.set(detailClose, { opacity: 1, y: 0 });
  gsap.set(detailHeroContent, { opacity: 1, y: 0 });
  gsap.set([detailTag, detailTitle, detailSubtitle], { opacity: 0, y: 30 });

  // ── 5. Slide up the card panel from the bottom with a narrow-to-wide expansion ──
  if (detailCard) {
    gsap.fromTo(detailCard, {
      y: '100%',
      scaleX: 0.4,
      transformOrigin: '50% 100%',
      opacity: 1
    }, {
      y: 0,
      scaleX: 1,
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
  gsap.to(detailTag, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.4 });
  gsap.to(detailTitle, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.5 });
  gsap.to(detailSubtitle, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.6 });
  gsap.to(detailBody, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.55 });
}

function closeDetail(popState) {
  // Allow closing even if isRouteTransitioning is true (e.g. still opening),
  // but prevent closing if we are already closed or closing (checked via classList.contains('open'))
  if (!workDetail.classList.contains('open')) return;

  if (window.__worksWebGL) {
    window.__worksWebGL.reset();
  }

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

  // Fade out close button immediately to prevent lingering
  if (detailClose) {
    gsap.to(detailClose, { opacity: 0, duration: 0.2, ease: 'power2.out' });
  }

  // Fade original preview container back in smoothly
  if (previewContainer) {
    gsap.to(previewContainer, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }

  // Restore works page elements immediately in sync with detail close
  gsap.to('#nav', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
  gsap.to('.works-header', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
  gsap.to('.work-card', { opacity: 1, y: 0, scale: 1, z: 0, stagger: 0.04, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
  gsap.to(['.h-grid-divider', '#ambientGlow', '#backToTop', '.scroll-bar'], { opacity: 1, duration: 0.6, ease: 'power2.out', clearProps: 'all' });
  const bttRestore = document.getElementById('backToTop');
  if (bttRestore) bttRestore.style.pointerEvents = '';
  const sbRestore = document.getElementById('scrollBar');
  if (sbRestore) sbRestore.style.pointerEvents = '';

  // Slide down and shrink the card panel horizontally
  if (detailCard) {
    gsap.to(detailCard, {
      y: '100%',
      scaleX: 0.4,
      transformOrigin: '50% 100%',
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
        if (detailCard) gsap.set(detailCard, { y: 0, opacity: 1, scaleX: 1, transformOrigin: '50% 50%' });
        if (detailHeroImg) gsap.set(detailHeroImg, { y: 0, scale: 1, filter: 'none' });

        // Reset dim overlay
        if (detailHeroDim) gsap.set(detailHeroDim, { opacity: 0 });

        // Reset text elements to hidden start state
        if (detailTag) gsap.set(detailTag, { opacity: 0, y: 24 });
        if (detailTitle) gsap.set(detailTitle, { opacity: 0, y: 24 });
        if (detailSubtitle) gsap.set(detailSubtitle, { opacity: 0, y: 24 });

        // Reset DOM hero image
        if (detailHeroImg) gsap.set(detailHeroImg, { opacity: 1 });

        // Reset 3D Card active state and float animations
        is3DCardActive = false;
        isDragging = false;
        currentRotateX = 0;
        currentRotateY = 0;
        const togglePill = document.getElementById('heroTogglePill');
        const togglePillImg = document.getElementById('togglePillImg');
        const togglePillCard = document.getElementById('togglePillCard');
        if (togglePill && togglePillImg && togglePillCard) {
          togglePill.classList.remove('card-active');
          togglePillImg.classList.add('active');
          togglePillCard.classList.remove('active');
        }
        const heroEl = document.querySelector('.detail-hero');
        if (heroEl) {
          heroEl.classList.remove('detail-hero-3d-active');
          heroEl.classList.remove('detail-hero-grabbing');
        }
        if (floatTween) {
          if (Array.isArray(floatTween)) {
            floatTween.forEach(t => t.kill());
          } else {
            floatTween.kill();
          }
          floatTween = null;
        }
        gsap.set('#detail3dContainer', { opacity: 0, scale: 0.8, pointerEvents: 'none' });
        gsap.set('.detail-hero-content', { opacity: 1, scale: 1, pointerEvents: 'auto' });
        gsap.set('#detail3dCard', { rotateX: 0, rotateY: 0, x: 0, y: 0 });
        const glare = document.getElementById('detail3dCardGlare');
        if (glare) {
          glare.style.opacity = 0;
          glare.style.background = '';
        }

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

  // Setup 3D card hover/click interaction
  setupDetail3DCard();
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

function setupDetail3DCard() {
  const hero = document.querySelector('.detail-hero');
  const card = document.getElementById('detail3dCard');
  const cardInner = document.getElementById('detail3dCardInner');
  const cardImg = document.getElementById('detail3dCardImg');
  const container = document.getElementById('detail3dContainer');
  const glare = document.getElementById('detail3dCardGlare');
  const sheen = document.getElementById('detail3dCardSheen');
  
  if (!hero || !card || !cardInner || !cardImg || !container || !glare || !sheen) return;

  // Prevent default image drag-and-drop ghosting behaviour
  hero.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });

  function startFloating() {
    if (floatTween) {
      if (Array.isArray(floatTween)) floatTween.forEach(t => t.kill());
      else floatTween.kill();
    }
    // Smoothly transition from 0 (where snap-back left it) to the floating state
    floatTween = [
      gsap.fromTo('#detail3dFloatWrapper', { y: 0 }, { 
        y: 10, 
        duration: 1.3, 
        ease: 'sine.inOut', 
        onComplete: function() {
          if (is3DCardActive && !isDragging && floatTween) {
            floatTween[0] = gsap.fromTo('#detail3dFloatWrapper', { y: 10 }, { y: -10, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          }
        }
      }),
      gsap.fromTo('#detail3dFloatWrapper', { rotateY: 0 }, { 
        rotateY: 6, 
        duration: 1.7, 
        ease: 'sine.inOut', 
        onComplete: function() {
          if (is3DCardActive && !isDragging && floatTween) {
            floatTween[1] = gsap.fromTo('#detail3dFloatWrapper', { rotateY: 6 }, { rotateY: -6, duration: 3.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          }
        }
      }),
      gsap.fromTo('#detail3dFloatWrapper', { rotateX: 0 }, { 
        rotateX: 4, 
        duration: 2.05, 
        ease: 'sine.inOut', 
        onComplete: function() {
          if (is3DCardActive && !isDragging && floatTween) {
            floatTween[2] = gsap.fromTo('#detail3dFloatWrapper', { rotateX: 4 }, { rotateX: -4, duration: 4.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          }
        }
      })
    ];
  }

  const togglePill = document.getElementById('heroTogglePill');
  const togglePillImg = document.getElementById('togglePillImg');
  const togglePillCard = document.getElementById('togglePillCard');

  function activate3DCard() {
    if (is3DCardActive) return;
    is3DCardActive = true;
    hero.classList.add('detail-hero-3d-active');
    
    if (togglePill && togglePillImg && togglePillCard) {
      togglePill.classList.add('card-active');
      togglePillCard.classList.add('active');
      togglePillImg.classList.remove('active');
    }

    // Smooth cinematic zoom and blur instead of abrupt cross-fade
    gsap.to('#detailHeroImg', { 
      filter: 'blur(15px) brightness(0.35)', 
      scale: 1.06, 
      duration: 0.8, 
      ease: 'power2.out' 
    });
    gsap.to('.detail-hero-content', { opacity: 0, scale: 0.95, duration: 0.5, ease: 'power2.out', pointerEvents: 'none' });
    
    gsap.set(container, { pointerEvents: 'auto' });
    gsap.fromTo(container,
      { opacity: 0, scale: 0.75 },
      { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.2)' }
    );

    // Reset values
    gsap.set(cardInner, { rotateX: 0, rotateY: 0 });
    gsap.set(cardImg, { x: 0, y: 0 });
    gsap.set(sheen, { opacity: 0 });
    gsap.set(glare, { opacity: 0 });
    currentRotateX = 0;
    currentRotateY = 0;
    velocityRotateX = 0;
    velocityRotateY = 0;

    // Introduce card with tilted 3D entry spin
    gsap.fromTo(cardInner,
      { rotateY: -70, rotateX: 18 },
      { rotateY: 0, rotateX: 0, duration: 1.2, ease: 'power3.out' }
    );
    
    // Start multi-axis organic floating & swaying loops
    startFloating();
  }

  function deactivate3DCard() {
    if (!is3DCardActive) return;
    is3DCardActive = false;
    hero.classList.remove('detail-hero-3d-active');
    hero.classList.remove('detail-hero-grabbing');
    
    if (togglePill && togglePillImg && togglePillCard) {
      togglePill.classList.remove('card-active');
      togglePillImg.classList.add('active');
      togglePillCard.classList.remove('active');
    }

    gsap.to(container, {
      opacity: 0,
      scale: 0.75,
      duration: 0.5,
      ease: 'power2.out',
      pointerEvents: 'none',
      onComplete: () => {
        if (floatTween) {
          if (Array.isArray(floatTween)) floatTween.forEach(t => t.pause());
          else floatTween.pause();
        }
      }
    });
    // Restore background image from blurred state
    gsap.to('#detailHeroImg', { 
      filter: 'blur(0px) brightness(1)', 
      scale: 1.0, 
      duration: 0.65, 
      ease: 'power2.out' 
    });
    gsap.to('.detail-hero-content', { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out', pointerEvents: 'auto' });
    
    // Reset rotation/translation smoothly
    gsap.to(cardInner, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power2.out' });
    gsap.to(container, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
    gsap.to(cardImg, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
    gsap.to(glare, { opacity: 0, duration: 0.8, ease: 'power2.out' });
    gsap.to(sheen, { opacity: 0, duration: 0.8, ease: 'power2.out' });
  }

  if (togglePillImg) {
    togglePillImg.addEventListener('click', function(e) {
      e.stopPropagation();
      deactivate3DCard();
    });
  }
  if (togglePillCard) {
    togglePillCard.addEventListener('click', function(e) {
      e.stopPropagation();
      activate3DCard();
    });
  }

  // Helper functions for drag lifecycle
  function handleDragStart(clientX, clientY) {
    isDragging = true;
    startX = clientX;
    startY = clientY;
    
    // Intercept current rotation (allows seamless catching mid-rebound)
    currentRotateY = gsap.getProperty(cardInner, "rotateY") || 0;
    currentRotateX = gsap.getProperty(cardInner, "rotateX") || 0;
    
    // Kill active rebound or entry tweens
    gsap.killTweensOf([cardInner, container, cardImg, sheen, glare, '#detail3dFloatWrapper']);
    
    // Pause float loops (keep current position frozen, prevent slippery cursor jumps)
    if (floatTween) {
      if (Array.isArray(floatTween)) floatTween.forEach(t => t.pause());
      else floatTween.pause();
    }

    hero.classList.add('detail-hero-grabbing');
    
    lastDragTime = performance.now();
    lastDragX = clientX;
    lastDragY = clientY;
    velocityRotateX = 0;
    velocityRotateY = 0;
  }

  function handleDragMove(clientX, clientY) {
    if (!isDragging) return;
    
    const now = performance.now();
    const dt = now - lastDragTime;
    
    const dx = clientX - startX;
    const dy = clientY - startY;
    
    // Rotate card based on drag distance
    const rotY = currentRotateY + dx * 0.45;
    const rotX = Math.max(-80, Math.min(80, currentRotateX - dy * 0.45));
    
    // Smooth responsive drag positioning with weighted delay & unified synchronisation
    gsap.to(cardInner, {
      rotateY: rotY,
      rotateX: rotX,
      duration: 0.4, // Increased to 0.4 to add a premium weighted lag/delay
      ease: 'power2.out', // Changed to power2.out for smoother deceleration
      overwrite: 'auto',
      onUpdate: () => {
        const rY = gsap.getProperty(cardInner, "rotateY") || 0;
        const rX = gsap.getProperty(cardInner, "rotateX") || 0;
        
        const px = Math.sin(rY * Math.PI / 180);
        const py = Math.sin(-rX * Math.PI / 180);
        
        // Parallax image shift updates dynamically in perfect sync
        gsap.set(cardImg, { x: -px * 15, y: -py * 15 });
        
        // Parallax container shift updates dynamically in perfect sync
        gsap.set(container, { x: px * 15, y: py * 15 });
        
        // Radial glare reflection update in sync
        const glareX = 50 - px * 25;
        const glareY = 50 - py * 25;
        const glareOpacity = Math.min(0.6, Math.sqrt(px*px + py*py) * 0.4);
        glare.style.opacity = glareOpacity;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%)`;
        
        // Holographic rainbow sheen background-position shift in sync
        const sheenX = 50 + px * 35;
        const sheenY = 50 + py * 35;
        const sheenOpacity = Math.min(0.7, Math.sqrt(px*px + py*py) * 0.5);
        sheen.style.opacity = sheenOpacity;
        sheen.style.backgroundPosition = `${sheenX}% ${sheenY}%`;
      }
    });
    
    // Velocity tracking for spring snap-back dynamic overshoot
    if (dt > 0) {
      const instantV_rotY = ((clientX - lastDragX) * 0.45) / dt;
      const instantV_rotX = (- (clientY - lastDragY) * 0.45) / dt;
      
      velocityRotateY = velocityRotateY * 0.65 + instantV_rotY * 0.35;
      velocityRotateX = velocityRotateX * 0.65 + instantV_rotX * 0.35;
    }
    
    lastDragTime = now;
    lastDragX = clientX;
    lastDragY = clientY;
  }

  function handleDragEnd(clientX, clientY) {
    if (!isDragging) return;
    isDragging = false;
    hero.classList.remove('detail-hero-grabbing');
    
    // Calculate final drag angle on release
    const dx = clientX - startX;
    const dy = clientY - startY;
    const endRotateY = currentRotateY + dx * 0.45;
    const endRotateX = Math.max(-80, Math.min(80, currentRotateX - dy * 0.45));
    
    // Snapping to the nearest multiple of 180 degrees (0 for front, 180 or -180 for back)
    const targetRotateY = Math.round(endRotateY / 180) * 180;
    const targetRotateX = 0; // X always snaps back to 0
    
    // Calculate rebound snap duration and overshoot based on release velocity
    // Reset velocity if user paused for more than 100ms before releasing
    const timeSinceLastMove = performance.now() - lastDragTime;
    const activeVelocity = (timeSinceLastMove < 100) ? Math.sqrt(velocityRotateX * velocityRotateX + velocityRotateY * velocityRotateY) : 0;
    
    const overshoot = Math.max(1.0, Math.min(3.5, 1.2 + activeVelocity * 0.5));
    const snapDuration = Math.max(0.7, Math.min(1.5, 0.9 + activeVelocity * 0.1));
    
    // Elastic spring snap back to nearest stable face (0, 180, 360, etc.)
    gsap.to(cardInner, {
      rotateY: targetRotateY,
      rotateX: targetRotateX,
      duration: snapDuration,
      ease: `back.out(${overshoot})`,
      overwrite: 'auto',
      onUpdate: () => {
        const rotY = gsap.getProperty(cardInner, "rotateY") || 0;
        const rotX = gsap.getProperty(cardInner, "rotateX") || 0;
        
        const px = Math.sin(rotY * Math.PI / 180);
        const py = Math.sin(-rotX * Math.PI / 180);
        
        // Image parallax shift updates dynamically during snap-back
        gsap.set(cardImg, { x: -px * 15, y: -py * 15 });
        
        // Glare updates
        const glareX = 50 - px * 25;
        const glareY = 50 - py * 25;
        const glareOpacity = Math.min(0.6, Math.sqrt(px*px + py*py) * 0.4);
        glare.style.opacity = glareOpacity;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%)`;
        
        // Sheen updates
        const sheenX = 50 + px * 35;
        const sheenY = 50 + py * 35;
        const sheenOpacity = Math.min(0.7, Math.sqrt(px*px + py*py) * 0.5);
        sheen.style.opacity = sheenOpacity;
        sheen.style.backgroundPosition = `${sheenX}% ${sheenY}%`;
      },
      onComplete: () => {
        // Resume floating loops once snap animation completes successfully
        if (is3DCardActive && !isDragging) {
          startFloating();
        }
      }
    });
    
    // Snap container translation back to 0
    gsap.to(container, {
      x: 0,
      y: 0,
      duration: snapDuration,
      ease: `back.out(${overshoot})`,
      overwrite: 'auto'
    });
    
    // Snap float wrapper back to 0 (position and rotation) in sync with the snap duration
    gsap.to('#detail3dFloatWrapper', {
      y: 0,
      rotateY: 0,
      rotateX: 0,
      duration: snapDuration,
      ease: `back.out(${overshoot})`,
      overwrite: 'auto'
    });
    
    currentRotateY = targetRotateY;
    currentRotateX = targetRotateX;
    velocityRotateX = 0;
    velocityRotateY = 0;
  }

  hero.addEventListener('mousedown', function(e) {
    if (!is3DCardActive) return;
    if (e.target.closest('#detailClose') || e.target.closest('a') || e.target.closest('button') || e.target.closest('#heroTogglePill')) {
      return;
    }
    handleDragStart(e.clientX, e.clientY);
    e.preventDefault();
  });

  window.addEventListener('mousemove', function(e) {
    if (!is3DCardActive || !isDragging) return;
    handleDragMove(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', function(e) {
    if (!is3DCardActive || !isDragging) return;
    handleDragEnd(e.clientX, e.clientY);
  });

  hero.addEventListener('touchstart', function(e) {
    if (!is3DCardActive) return;
    if (e.target.closest('#detailClose') || e.target.closest('a') || e.target.closest('button') || e.target.closest('#heroTogglePill')) {
      return;
    }
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('touchmove', function(e) {
    if (!is3DCardActive || !isDragging || !e.touches.length) return;
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    
    // Suppress scroll gestures while dragging/rotating the interactive 3D card
    if (e.cancelable) {
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('touchend', function(e) {
    if (!is3DCardActive || !isDragging) return;
    if (e.changedTouches && e.changedTouches.length) {
      handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    } else {
      handleDragEnd(startX, startY);
    }
  });
}

window.openDetail = openDetail;
window.closeDetail = closeDetail;
