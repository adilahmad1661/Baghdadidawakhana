/* ==========================================================================
   UTILS — shared helpers used across modules
   ========================================================================== */

const BD = window.BD || {};

BD.qs = (sel, ctx = document) => ctx.querySelector(sel);
BD.qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

BD.debounce = (fn, wait = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

BD.clamp = (val, min, max) => Math.min(Math.max(val, min), max);

BD.formatPrice = (num) => `Rs. ${Number(num).toLocaleString('en-PK')}`;

/* Force-reveal dynamically injected .reveal* cards with a gentle stagger.
   Used after (re)rendering product/service grids so they are ALWAYS visible,
   independent of scroll position or IntersectionObserver timing. */
BD.revealCards = (root, sel = '.reveal, .reveal-scale, .reveal-left, .reveal-right') => {
  if (!root) return;
  const cards = Array.from(root.querySelectorAll(sel));
  requestAnimationFrame(() => {
    cards.forEach((c, i) => setTimeout(() => c.classList.add('in-view'), Math.min(i, 10) * 45));
  });
  // Safety net: guarantee visibility even if the transition/rAF is skipped.
  setTimeout(() => cards.forEach(c => c.classList.add('in-view')), 600);
};

BD.storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable */ }
  }
};

BD.toast = (message, icon = 'fa-circle-check') => {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2600);
};

BD.trapFocus = (container) => {
  const focusable = BD.qsa('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])', container)
    .filter(el => !el.disabled);
  if (!focusable.length) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
};

window.BD = BD;
