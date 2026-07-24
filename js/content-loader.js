/* ==========================================================================
   CONTENT LOADER — fetches admin-managed content and applies it to the site.
   Runs before services.js / shop.js. If the API is unavailable (e.g. opened
   as a static file), the site silently keeps its built-in default content.
   ========================================================================== */

(() => {
  const API = '/api/content';

  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  const setText = (root, content) => {
    root.querySelectorAll('[data-c]').forEach(el => {
      const val = get(content, el.getAttribute('data-c'));
      if (val != null && val !== '') el.textContent = val;
    });
  };
  const setSrc = (root, content) => {
    root.querySelectorAll('[data-c-src]').forEach(el => {
      const val = get(content, el.getAttribute('data-c-src'));
      if (val) el.setAttribute('src', val);
    });
  };
  const setHref = (root, content) => {
    root.querySelectorAll('[data-c-href]').forEach(el => {
      const val = get(content, el.getAttribute('data-c-href'));
      if (val) el.setAttribute('href', val);
    });
  };

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const applyContent = (content) => {
    window.BD_CONTENT = content;

    /* ---- Settings: logo, phone, whatsapp ---- */
    const s = content.settings || {};
    if (s.logo) document.querySelectorAll('.nav-logo-img').forEach(img => img.src = s.logo);
    if (s.phoneRaw) document.querySelectorAll('a[href^="tel:"]').forEach(a => a.href = 'tel:' + s.phoneRaw);
    if (s.phone) document.querySelectorAll('[data-c="settings.phone"]').forEach(el => el.textContent = s.phone);

    /* ---- Simple text / src / href bindings ---- */
    setText(document, content);
    setSrc(document, content);
    setHref(document, content);

    /* ---- Hero badges ---- */
    const heroBadges = document.querySelector('.hero-badges');
    if (heroBadges && content.hero?.badges) {
      heroBadges.innerHTML = content.hero.badges.map(b => `
        <div class="hero-badge"><span class="hero-badge-ring"><i class="fa-solid ${esc(b.icon)}"></i></span><span>${esc(b.label).replace(/\n/g, '<br>')}</span></div>
      `).join('');
    }
    /* Hero round badge line break */
    const roundBadge = document.querySelector('.hero-round-badge span');
    if (roundBadge && content.hero?.roundBadge) roundBadge.innerHTML = esc(content.hero.roundBadge).replace(/,\s*/, ',<br>');

    /* ---- About values + images ---- */
    if (content.about) {
      const valuesWrap = document.querySelector('.about-values');
      if (valuesWrap && content.about.values) {
        valuesWrap.innerHTML = content.about.values.map(v => `
          <div class="value-chip"><i class="fa-solid ${esc(v.icon)}"></i><div><strong>${esc(v.title)}</strong><span>${esc(v.text)}</span></div></div>
        `).join('');
      }
      const imgs = content.about.images || [];
      ['ag-1', 'ag-2', 'ag-3'].forEach((cls, i) => {
        const el = document.querySelector('.' + cls);
        if (el && imgs[i]) el.src = imgs[i];
      });
    }

    /* ---- Why marquee ---- */
    const whyMarquee = document.querySelector('.why-marquee');
    if (whyMarquee && content.whyMarquee) {
      const items = content.whyMarquee.map(w => `<span class="why-item"><i class="fa-solid ${esc(w.icon)}"></i> ${esc(w.label)}</span>`).join('');
      whyMarquee.innerHTML = items + items; // doubled for seamless loop
    }

    /* ---- Testimonials marquee ---- */
    const testiMarquee = document.querySelector('.testimonial-marquee');
    if (testiMarquee && content.testimonials) {
      const card = (t) => `<div class="testimonial-card"><span class="stars">★★★★★</span><p>"${esc(t.text)}"</p><div class="testimonial-person"><div><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></div></div></div>`;
      const html = content.testimonials.map(card).join('');
      testiMarquee.innerHTML = html + html;
    }

    /* ---- Booking selects + perks ---- */
    if (content.booking) {
      const perks = document.querySelector('.booking-perks');
      if (perks && content.booking.perks) {
        perks.innerHTML = content.booking.perks.map(p => `<li><i class="fa-solid fa-circle-check"></i> ${esc(p)}</li>`).join('');
      }
      const dept = document.getElementById('bk-dept');
      if (dept && content.booking.departments) {
        dept.innerHTML = '<option value="">Select department</option>' + content.booking.departments.map(d => `<option>${esc(d)}</option>`).join('');
      }
      const doc = document.getElementById('bk-doctor');
      if (doc && content.booking.doctors) {
        doc.innerHTML = '<option value="">No preference</option>' + content.booking.doctors.map(d => `<option>${esc(d)}</option>`).join('');
      }
    }

    /* ---- Contact branches ---- */
    if (content.contact) {
      const branchHost = document.querySelector('.branches-list');
      if (branchHost && content.contact.branches) {
        branchHost.innerHTML = '<h4>Our Branches</h4>' + content.contact.branches
          .map(b => `<div class="branch-row"><i class="fa-solid fa-location-dot"></i> ${esc(b)}</div>`).join('');
      }
      const map = document.querySelector('.contact-map iframe');
      if (map && content.contact.mapEmbed) map.src = content.contact.mapEmbed;
    }

    /* ---- Footer socials ---- */
    const socialWrap = document.querySelector('.footer-social');
    if (socialWrap && content.footer?.socials) {
      socialWrap.innerHTML = content.footer.socials.map(so =>
        `<a href="${esc(so.url)}" aria-label="Social link"><i class="fa-brands ${esc(so.icon)}"></i></a>`).join('');
    }

    /* ---- Section visibility toggles ---- */
    const sec = content.sections || {};
    const secMap = {
      hero: '#hero',
      about: '#about',
      whyMarquee: '.why-marquee-section',
      services: '#services',
      shop: '#medicines',
      testimonials: '.testimonials-section',
      booking: '#appointment',
      contact: '#contact'
    };
    Object.entries(secMap).forEach(([key, sel]) => {
      const el = document.querySelector(sel);
      if (el) el.style.display = sec[key] === false ? 'none' : '';
    });

    /* ---- Notify services.js / shop.js to (re)render from content ---- */
    document.dispatchEvent(new CustomEvent('bd:content', { detail: content }));
  };

  /* Fetch content; on failure, still notify so grids render defaults */
  fetch(API, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(applyContent)
    .catch(() => { document.dispatchEvent(new CustomEvent('bd:content', { detail: null })); });
})();
