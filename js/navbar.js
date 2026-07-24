/* ==========================================================================
   NAVBAR — scroll state, mobile drawer
   ========================================================================== */

(() => {
  const navbar = document.getElementById('navbar');
  const burger = document.getElementById('nav-burger');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('drawer-backdrop');

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const openDrawer = () => {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('no-scroll');
  };
  const closeDrawer = () => {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('no-scroll');
  };
  burger?.addEventListener('click', () => drawer.classList.contains('active') ? closeDrawer() : openDrawer());
  backdrop?.addEventListener('click', closeDrawer);
  BD.qsa('.drawer-link', drawer).forEach(a => a.addEventListener('click', closeDrawer));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  BD.qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        closeDrawer();
        window.BD_scrollTo ? window.BD_scrollTo(id) : document.querySelector(id).scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
