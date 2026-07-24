/* ==========================================================================
   COUNTERS — animated number count-up on scroll into view
   ========================================================================== */

(() => {
  const nums = BD.qsa('.counter-num');
  if (!nums.length) return;

  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const duration = 1800;
    const start = performance.now();
    const startVal = 0;
    const step = (now) => {
      const p = BD.clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = startVal + (target - startVal) * eased;
      el.textContent = target % 1 === 0 ? Math.round(val).toLocaleString('en-US') : val.toFixed(1);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  nums.forEach(el => io.observe(el));
})();
