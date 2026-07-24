/* ==========================================================================
   REVEAL — IntersectionObserver-driven scroll reveal for .reveal* elements.
   Exposes window.BD_revealScan(root) so dynamically-injected content
   (product/service cards rendered after content loads) can be (re)observed.
   ========================================================================== */

(() => {
  const SEL = '.reveal, .reveal-scale, .reveal-left, .reveal-right';

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), (entry.target.dataset.revealDelay || 0) * 1);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Observe any not-yet-revealed elements within `root` (default: whole document).
  const scan = (root = document) => {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(SEL).forEach(el => {
      if (!el.classList.contains('in-view')) io.observe(el);
    });
  };

  window.BD_revealScan = scan;
  scan();
})();
