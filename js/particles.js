/* ==========================================================================
   PARTICLES — lightweight floating leaf/dot particle background for hero
   ========================================================================== */

(() => {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const section = canvas.closest('section');
  let particles = [];
  let width, height, raf;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const resize = () => {
    width = canvas.width = section.offsetWidth;
    height = canvas.height = section.offsetHeight;
  };

  const colors = ['rgba(24,146,103,0.35)', 'rgba(238,172,46,0.4)', 'rgba(18,131,143,0.3)'];

  const makeParticles = () => {
    const count = Math.round((width * height) / 42000);
    particles = Array.from({ length: BD.clamp(count, 12, 34) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 2 + Math.random() * 3.5,
      vy: 0.15 + Math.random() * 0.35,
      vx: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      drift: Math.random() * Math.PI * 2
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.y -= p.vy;
      p.drift += 0.01;
      p.x += p.vx + Math.sin(p.drift) * 0.2;
      if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!raf) draw();
      } else {
        cancelAnimationFrame(raf);
        raf = null;
      }
    });
  }, { threshold: 0.05 });

  window.addEventListener('resize', BD.debounce(() => { resize(); makeParticles(); }, 200));
  resize();
  makeParticles();
  io.observe(section);
})();
