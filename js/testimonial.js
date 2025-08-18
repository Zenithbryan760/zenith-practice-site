/* Testimonials (Swiper) — accessible, motion-aware, lazy-init */
(function () {
  const hasReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function doInit() {
    const el = document.querySelector('.testimonialSwiper');
    if (!el || typeof Swiper === 'undefined') return;

    // Guard: avoid double init after async includes / re-inits
    if (el.dataset.inited === '1') return;
    el.dataset.inited = '1';

    const reduce = hasReducedMotion();

    const swiper = new Swiper(el, {
      loop: true,
      speed: reduce ? 0 : 500,
      grabCursor: true,
      watchSlidesVisibility: true,
      slidesPerView: 3,
      slidesPerGroup: 3,
      spaceBetween: 24,
      autoplay: reduce
        ? false
        : { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      keyboard: { enabled: true, onlyInViewport: true },
      breakpoints: {
        0:    { slidesPerView: 1, slidesPerGroup: 1 },
        680:  { slidesPerView: 2, slidesPerGroup: 2 },
        1024: { slidesPerView: 3, slidesPerGroup: 3 }
      },
      on: {
        init(sw) {
          // mark slides so CSS can animate them
          sw.slides.forEach(s => s.classList.add('t-slide'));
          updateActive(sw);
        },
        transitionStart: updateActive,
        resize: updateActive
      }
    });

    function updateActive(sw) {
      const count = typeof sw.params.slidesPerView === 'number' ? sw.params.slidesPerView : 1;
      sw.slides.forEach(s => {
        s.classList.add('is-dim');
        s.setAttribute('aria-hidden', 'true');
      });
      for (let i = 0; i < count; i++) {
        const slide = sw.slides[sw.activeIndex + i];
        if (slide) {
          slide.classList.remove('is-dim');
          slide.setAttribute('aria-hidden', 'false');
        }
      }
    }

    // Pause autoplay while keyboard focusing inside the carousel
    el.addEventListener('focusin', () => {
      if (swiper.autoplay && swiper.autoplay.stop) swiper.autoplay.stop();
    });
    el.addEventListener('focusout', () => {
      if (!reduce && swiper.autoplay && swiper.autoplay.start) swiper.autoplay.start();
    });
  }

  // Lazy init when visible (perf) — also expose a global guarded init for your loader
  function ensureInit() {
    const target = document.querySelector('.testimonialSwiper');
    if (!target) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            doInit();
            io.disconnect();
          }
        });
      }, { threshold: 0.15 });
      io.observe(target);
    } else {
      doInit();
    }
  }

  // Called by your index loader (safe to call multiple times)
  window.initTestimonials = ensureInit;

  // Fallback init if someone loads this file standalone
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureInit);
  } else {
    ensureInit();
  }
})();
