/* ==========================================================================
   MAIN — native smooth scroll, AOS init, scroll progress, misc UI
   ========================================================================== */

(() => {
  const NAV_OFFSET = 84;

  window.BD_scrollTo = (target) => {
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(target);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  /* ---- AOS init ---- */
  if (window.AOS) {
    AOS.init({ duration: 600, once: true, offset: 60, easing: 'ease-out-cubic' });
  }

  /* ---- Scroll progress bar ---- */
  const progressBar = document.getElementById('scroll-progress');
  const updateProgress = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    if (progressBar) progressBar.style.width = scrolled + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ---- Back to top ---- */
  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    backToTop?.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  backToTop?.addEventListener('click', () => window.BD_scrollTo(0));

  /* ---- WhatsApp float ---- */
  document.getElementById('whatsapp-float')?.addEventListener('click', () => {
    window.open('https://wa.me/923099211799?text=' + encodeURIComponent('Assalam-o-Alaikum, I would like to know more about Baghdadi Dawakhana.'), '_blank');
  });

  /* ---- Ripple effect for buttons ---- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

})();
