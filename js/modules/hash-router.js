import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
gsap.registerPlugin(Flip);

const workDetail = document.getElementById('workDetail');
const pageTransition = document.getElementById('pageTransition');

// ═══════════ HASH ROUTER ═══════════
const ROUTE_PREFIX = '#/work/';
let detailOpenedFromHash = false;
let savedScrollY = 0;

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

  if (previewContainer && detailHeroImg) {
    const webgl = window.__worksWebGL;

    if (webgl && webgl.isActive) {
      // ── 1. Capture preview rect BEFORE any DOM mutation ──
      const previewRect = previewContainer.getBoundingClientRect();

      // ── 2. Smooth fade out the preview card ──
      gsap.to(previewContainer, { opacity: 0, duration: 0.25, ease: 'power2.out' });

      // ── 3. Prepare detail overlay (visible but transparent, no .open yet) ──
      workDetail.style.display = 'block';
      workDetail.scrollTop = 0;
      document.body.style.overflow = 'hidden';

      // ── 4. Hide DOM image, dim overlay, and all text ──
      gsap.set(detailHeroImg, { opacity: 0 });
      if (detailHeroDim) gsap.set(detailHeroDim, { opacity: 0 });
      if (detailBg) gsap.set(detailBg, { opacity: 0 });

      const detailBody = workDetail.querySelector('.detail-body');
      const detailClose = document.getElementById('detailClose');
      const detailHeroContent = workDetail.querySelector('.detail-hero-content');
      const detailTag = document.getElementById('detailTag');
      const detailTitle = document.getElementById('detailTitle');
      const detailSubtitle = document.getElementById('detailSubtitle');
      gsap.set([detailBody, detailClose, detailHeroContent], { opacity: 0, y: 0 });
      gsap.set([detailTag, detailTitle, detailSubtitle], { opacity: 0, y: 24 });

      // ── 5. Get target rect (.detail-hero section bounds) ──
      const heroSection = workDetail.querySelector('.detail-hero');
      const targetRect = heroSection.getBoundingClientRect();

      // ── 6. Start WebGL morph (canvas renders the image expanding) ──
      webgl.morphTo(previewRect, targetRect, heroImg, () => {
        // ── 7. Morph complete → hand off to DOM ──
        gsap.set(detailHeroImg, { opacity: 1 });

        // Dim overlay fades in (replaces old brightness filter)
        if (detailHeroDim) {
          gsap.to(detailHeroDim, { opacity: 0.72, duration: 0.45, ease: 'power2.out' });
        }

        // ── 8. Show page chrome ──
        workDetail.classList.add('open');

        // Backdrop
        if (detailBg) {
          gsap.to(detailBg, { opacity: 1, duration: 0.5, ease: 'power2.out' });
        }

        // Close button
        gsap.to(detailClose, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.05 });

        // Hero text stagger
        gsap.to(detailTag, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 });
        gsap.to(detailTitle, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.28 });
        gsap.to(detailSubtitle, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.42 });

        // Body content
        gsap.to(detailBody, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.3 });

        initGalleryLightbox();
      });

    } else {
      // --- Fallback: DOM-based GSAP Flip transition ---
      const previewRect = previewContainer.getBoundingClientRect();
      gsap.set(previewContainer, { opacity: 0 });

      workDetail.style.display = 'block';
      workDetail.scrollTop = 0;
      document.body.style.overflow = 'hidden';

      if (detailBg) {
        gsap.fromTo(detailBg, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
      }

      // Temporarily fit the detailHeroImg exactly inside the bounds of the previewContainer
      gsap.set(detailHeroImg, {
        position: 'fixed',
        left: previewRect.left,
        top: previewRect.top,
        width: previewRect.width,
        height: previewRect.height,
        borderRadius: '6px',
        zIndex: 100,
        objectFit: 'cover'
      });

      const state = Flip.getState(detailHeroImg);

      gsap.set(detailHeroImg, {
        position: '',
        left: '',
        top: '',
        width: '',
        height: '',
        borderRadius: '',
        zIndex: '',
        objectFit: ''
      });

      workDetail.classList.add('open');

      const detailBody = workDetail.querySelector('.detail-body');
      const detailClose = document.getElementById('detailClose');
      const detailHeroContent = workDetail.querySelector('.detail-hero-content');
      gsap.set([detailBody, detailClose, detailHeroContent], { opacity: 0, y: 20 });
      gsap.to([detailBody, detailClose, detailHeroContent], {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.3
      });

      Flip.from(state, {
        duration: 0.85,
        ease: 'power4.out',
        clearProps: true,
        onComplete: function() {
          initGalleryLightbox();
        }
      });
    }
  } else {
    // Fallback if missing elements
    pageTransition.classList.add('active');
    setTimeout(function() { pageTransition.classList.remove('active'); }, 1000);
    document.body.style.overflow = 'hidden';
    workDetail.style.display = 'block';
    workDetail.scrollTop = 0;
    requestAnimationFrame(function() {
      workDetail.classList.add('open');
      initGalleryLightbox();
    });
  }
}

function closeDetail(popState) {
  if (!workDetail.classList.contains('open')) return;

  const previewContainer = getActivePreviewContainer();
  const detailBg = document.getElementById('workDetailBg');
  const detailClose = document.getElementById('detailClose');
  const detailHero = workDetail.querySelector('.detail-hero');
  const detailBody = workDetail.querySelector('.detail-body');
  const detailHeroDim = document.getElementById('detailHeroDim');

  // Fade out backdrop smoothly
  if (detailBg) {
    gsap.to(detailBg, { opacity: 0, duration: 0.5, ease: 'power2.inOut' });
  }

  // Fade original preview container back in smoothly
  if (previewContainer) {
    gsap.to(previewContainer, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }

  // Slide up and fade out details page content
  gsap.to([detailClose, detailHero, detailBody], {
    y: -80,
    opacity: 0,
    duration: 0.5,
    ease: 'power3.in',
    onComplete: function() {
      workDetail.classList.remove('open');
      workDetail.style.display = 'none';
      document.body.style.overflow = '';

      // Reset ALL inline styles for next open cycle
      gsap.set([detailClose, detailHero, detailBody], { y: 0, opacity: 1 });

      // Reset dim overlay
      if (detailHeroDim) gsap.set(detailHeroDim, { opacity: 0 });

      // Reset text elements to hidden start state
      const detailTag = document.getElementById('detailTag');
      const detailTitle = document.getElementById('detailTitle');
      const detailSubtitle = document.getElementById('detailSubtitle');
      if (detailTag) gsap.set(detailTag, { opacity: 0, y: 24 });
      if (detailTitle) gsap.set(detailTitle, { opacity: 0, y: 24 });
      if (detailSubtitle) gsap.set(detailSubtitle, { opacity: 0, y: 24 });

      // Reset DOM hero image
      const detailHeroImg = document.getElementById('detailHeroImg');
      if (detailHeroImg) gsap.set(detailHeroImg, { opacity: 1 });

      if (popState) {
        history.replaceState(null, '', ' ' + window.location.pathname + location.hash.replace(ROUTE_PREFIX, '#work'));
      }
      window.scrollTo({ top: savedScrollY, behavior: 'instant' });
    }
  });
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
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  lb.classList.remove('open');
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

workDetail.addEventListener('wheel', function(e) {
  e.stopPropagation();
  let atTop = workDetail.scrollTop <= 0, atBottom = workDetail.scrollTop + workDetail.clientHeight >= workDetail.scrollHeight - 2;
  if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) e.preventDefault();
}, { passive: false });

window.openDetail = openDetail;
window.closeDetail = closeDetail;
