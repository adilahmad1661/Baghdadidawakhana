/* ==========================================================================
   BAGHDADI DAWAKHANA — Admin panel logic (vanilla JS SPA)
   ========================================================================== */
(() => {
  'use strict';

  const TOKEN_KEY = 'bd-admin-token';
  let token = localStorage.getItem(TOKEN_KEY) || '';
  let content = null;          // working copy
  let currentTab = 'dashboard';
  let productEditIndex = null; // which product is open in the detail editor (null = list)

  /* ---------- tiny DOM helper ---------- */
  function h(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  const $ = (s, r = document) => r.querySelector(s);

  /* Resolve an image path for DISPLAY inside the admin (served from /admin/).
     Relative paths like "assets/…" must be rooted with "/" so they resolve
     against the site root, not /admin/. Stored values are never changed. */
  const assetUrl = (u) => (!u ? '' : (/^(https?:|data:|\/)/.test(u) ? u : '/' + u));

  /* ---------- path helpers ---------- */
  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setPath(obj, path, val) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (o[k] == null) o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      o = o[k];
    }
    o[keys[keys.length - 1]] = val;
  }

  /* ---------- API ---------- */
  async function api(path, opts = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    if (res.status === 401) { logout(); throw new Error('Session expired. Please log in again.'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  const loadContent = () => fetch('/api/content', { cache: 'no-store' }).then(r => r.json());
  const saveContent = () => api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
  const listUploads = () => api('/api/uploads');
  const deleteUpload = (name) => api('/api/uploads/' + encodeURIComponent(name), { method: 'DELETE' });
  function uploadImage(file) {
    const fd = new FormData();
    fd.append('image', file);
    return fetch('/api/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Upload failed'); return d; });
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg, isErr) {
    const t = $('#admin-toast');
    t.className = 'admin-toast' + (isErr ? ' err' : '');
    t.innerHTML = `<i class="fa-solid ${isErr ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${msg}`;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  /* ==========================================================================
     AUTH
     ========================================================================== */
  async function doLogin(e) {
    e.preventDefault();
    const pass = $('#login-pass').value;
    const errEl = $('#login-error');
    errEl.hidden = true;
    try {
      const { token: tk } = await api('/api/login', { method: 'POST', body: JSON.stringify({ password: pass }) });
      token = tk; localStorage.setItem(TOKEN_KEY, tk);
      await boot();
    } catch (err) {
      errEl.textContent = err.message; errEl.hidden = false;
    }
  }
  function logout() {
    token = ''; localStorage.removeItem(TOKEN_KEY);
    $('#app-view').hidden = true;
    $('#login-view').style.display = 'flex';
  }

  /* ==========================================================================
     FIELD BUILDERS
     ========================================================================== */
  function bindInput(el) {
    el.addEventListener('input', () => {
      let v = el.value;
      if (el.type === 'number') v = v === '' ? null : Number(v);
      setPath(content, el.dataset.path, v);
    });
    return el;
  }
  function field(label, path, opts = {}) {
    const val = getPath(content, path);
    let input;
    if (opts.type === 'textarea') {
      input = h('textarea', { 'data-path': path, rows: opts.rows || 3, placeholder: opts.ph || '' });
      input.value = val == null ? '' : val;
    } else if (opts.type === 'select') {
      input = h('select', { 'data-path': path },
        (opts.options || []).map(o => h('option', { value: o.value, selected: o.value === val }, o.label)));
    } else {
      input = h('input', { type: opts.type || 'text', 'data-path': path, placeholder: opts.ph || '' });
      input.value = val == null ? '' : val;
    }
    bindInput(input);
    return h('div', { class: 'field' + (opts.full ? ' field-full' : '') }, [h('label', {}, label), input]);
  }
  // array of strings <-> textarea (one per line)
  function linesField(label, path, hint) {
    const arr = getPath(content, path) || [];
    const ta = h('textarea', { rows: Math.max(3, arr.length + 1) });
    ta.value = arr.join('\n');
    ta.addEventListener('input', () => {
      setPath(content, path, ta.value.split('\n').map(s => s.trim()).filter(Boolean));
    });
    return h('div', { class: 'field field-full' }, [
      h('label', {}, label), ta, hint ? h('div', { class: 'tag-hint' }, hint) : null
    ]);
  }

  /* Image control bound to a path */
  function imageControl(label, path) {
    const val = getPath(content, path) || '';
    const preview = h('img', { class: 'img-preview', src: assetUrl(val) || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E', alt: '' });
    const urlInput = h('input', { class: 'img-url-input', type: 'text', value: val, placeholder: 'Image URL or /uploads/...' });
    urlInput.addEventListener('input', () => { setPath(content, path, urlInput.value); preview.src = assetUrl(urlInput.value); });

    const uploadBtn = h('button', { class: 'btn btn-outline btn-sm', type: 'button' }, [h('i', { class: 'fa-solid fa-upload' }), ' Upload']);
    uploadBtn.addEventListener('click', () => pickFile(async (file) => {
      try { toast('Uploading…'); const { url } = await uploadImage(file); setPath(content, path, url); urlInput.value = url; preview.src = assetUrl(url); toast('Image uploaded'); }
      catch (e) { toast(e.message, true); }
    }));
    const libBtn = h('button', { class: 'btn btn-outline btn-sm', type: 'button' }, [h('i', { class: 'fa-solid fa-images' }), ' Library']);
    libBtn.addEventListener('click', () => openPicker((url) => { setPath(content, path, url); urlInput.value = url; preview.src = assetUrl(url); }));

    return h('div', { class: 'field field-full' }, [
      h('label', {}, label),
      h('div', { class: 'img-control' }, [preview, h('div', { class: 'img-control-btns' }, [uploadBtn, libBtn]), urlInput])
    ]);
  }

  /* generic repeatable list editor.
     items: array path; render(item, index) returns fields; makeNew() returns blank item */
  function repeatList(path, titleOf, renderItem, makeNew, addLabel) {
    const arr = getPath(content, path) || [];
    const wrap = h('div', {});
    arr.forEach((item, i) => {
      const removeBtn = h('button', { class: 'repeat-remove', type: 'button', title: 'Remove' }, h('i', { class: 'fa-solid fa-trash' }));
      removeBtn.addEventListener('click', () => { arr.splice(i, 1); rerender(); });
      wrap.appendChild(h('div', { class: 'repeat-item' }, [
        h('div', { class: 'repeat-head' }, [h('strong', {}, titleOf(item, i)), removeBtn]),
        ...renderItem(item, i)
      ]));
    });
    const addBtn = h('button', { class: 'btn btn-outline btn-sm repeat-add', type: 'button' }, [h('i', { class: 'fa-solid fa-plus' }), ' ' + (addLabel || 'Add')]);
    addBtn.addEventListener('click', () => { arr.push(makeNew()); setPath(content, path, arr); rerender(); });
    wrap.appendChild(addBtn);
    return wrap;
  }

  /* ==========================================================================
     EDITORS
     ========================================================================== */
  const editors = {};

  editors.dashboard = () => {
    const stat = (n, l) => h('div', { class: 'dash-stat' }, [h('div', { class: 'n' }, String(n)), h('div', { class: 'l' }, l)]);
    const quick = (tab, label, icon) => {
      const b = h('button', { class: 'btn btn-outline btn-sm' }, [h('i', { class: 'fa-solid ' + icon }), ' ' + label]);
      b.addEventListener('click', () => switchTab(tab));
      return b;
    };
    return h('div', {}, [
      h('div', { class: 'ed-card' }, [
        h('h3', {}, 'Welcome back 👋'),
        h('p', { class: 'ed-hint' }, 'Manage every section of your website from here. Edit content, upload product photos, add or remove products, and toggle sections on or off. Remember to press "Save Changes" after editing.')
      ]),
      h('div', { class: 'dash-grid' }, [
        stat((content.products || []).length, 'Products'),
        stat((content.services || []).length, 'Services'),
        stat((content.testimonials || []).length, 'Testimonials'),
        stat(Object.values(content.sections || {}).filter(Boolean).length, 'Active Sections')
      ]),
      h('div', { class: 'ed-card', style: 'margin-top:1.25rem' }, [
        h('h3', {}, 'Quick actions'),
        h('div', { class: 'dash-quick' }, [
          quick('products', 'Add / Edit Products', 'fa-bag-shopping'),
          quick('hero', 'Edit Hero', 'fa-star'),
          quick('media', 'Media Library', 'fa-images'),
          quick('contact', 'Contact & Branches', 'fa-location-dot')
        ])
      ])
    ]);
  };

  editors.settings = () => h('div', { class: 'ed-card' }, [
    h('h3', {}, [h('i', { class: 'fa-solid fa-gear' }), ' Site Settings']),
    h('p', { class: 'ed-hint' }, 'Brand name, logo, and contact numbers used across the site (navbar, footer, WhatsApp buttons).'),
    imageControl('Logo (navbar / footer)', 'settings.logo'),
    h('div', { class: 'ed-grid' }, [
      field('Site Name', 'settings.siteName'),
      field('Tagline', 'settings.tagline'),
      field('Phone (display)', 'settings.phone'),
      field('Phone (digits only, for call link)', 'settings.phoneRaw', { ph: '923000000000' }),
      field('WhatsApp number (digits only)', 'settings.whatsapp', { ph: '923000000000' }),
      field('Email', 'settings.email')
    ])
  ]);

  editors.sections = () => {
    const rows = [
      ['hero', 'Hero', 'The main banner at the top'],
      ['about', 'About / Our Story', ''],
      ['whyMarquee', 'Trust Marquee', 'Moving strip of trust points'],
      ['services', 'Services', 'Treatment categories'],
      ['shop', 'Shop / Products', ''],
      ['testimonials', 'Testimonials', 'Patient reviews'],
      ['booking', 'Appointment Booking', ''],
      ['contact', 'Contact', 'Map, branches, details']
    ];
    content.sections = content.sections || {};
    return h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-toggle-on' }), ' Section Visibility']),
      h('p', { class: 'ed-hint' }, 'Turn any section of the website on or off. Hidden sections are removed from the live page.'),
      ...rows.map(([key, label, sub]) => {
        const cb = h('input', { type: 'checkbox', checked: content.sections[key] !== false });
        cb.addEventListener('change', () => { content.sections[key] = cb.checked; });
        return h('div', { class: 'toggle-row' }, [
          h('div', { class: 'toggle-label' }, [label, sub ? h('small', {}, sub) : null]),
          h('label', { class: 'switch' }, [cb, h('span', { class: 'track' })])
        ]);
      })
    ]);
  };

  editors.hero = () => h('div', {}, [
    h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-star' }), ' Hero Section']),
      h('p', { class: 'ed-hint' }, 'The headline reads: “{Kicker} {BIG WORD} {for} {Banner}”.'),
      h('div', { class: 'ed-grid' }, [
        field('Kicker (small line)', 'hero.kicker'),
        field('Big Word', 'hero.megaWord'),
        field('Connector', 'hero.forText'),
        field('Banner text', 'hero.bannerText'),
        field('Tagline pill', 'hero.tagline'),
        field('Round badge (image corner)', 'hero.roundBadge')
      ]),
      imageControl('Hero image', 'hero.image')
    ]),
    h('div', { class: 'ed-card' }, [
      h('h3', {}, 'Benefit Badges'),
      h('p', { class: 'ed-hint' }, 'The five circular icons. Use Font Awesome icon names (e.g. fa-leaf). Use a line break in the label with \\n.'),
      repeatList('hero.badges',
        (b) => (b.label || 'Badge').replace(/\n/g, ' '),
        (b, i) => [h('div', { class: 'ed-grid' }, [
          field('Icon (fa-…)', `hero.badges.${i}.icon`),
          field('Label (use \\n for line break)', `hero.badges.${i}.label`)
        ])],
        () => ({ icon: 'fa-leaf', label: 'New\nBadge' }), 'Add badge')
    ])
  ]);

  editors.about = () => h('div', {}, [
    h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-book-open' }), ' About / Our Story']),
      h('div', { class: 'ed-grid' }, [
        field('Eyebrow', 'about.eyebrow'),
        field('Badge title (on image)', 'about.badgeTitle'),
        field('Title', 'about.title', { full: true }),
        field('Badge subtitle', 'about.badgeText')
      ]),
      field('Story text', 'about.text', { type: 'textarea', rows: 4, full: true }),
      imageControl('Image 1 (large)', 'about.images.0'),
      imageControl('Image 2 (small)', 'about.images.1'),
      imageControl('Image 3 (small)', 'about.images.2')
    ]),
    h('div', { class: 'ed-card' }, [
      h('h3', {}, 'Mission / Vision / Values'),
      repeatList('about.values',
        (v) => v.title || 'Value',
        (v, i) => [h('div', { class: 'ed-grid' }, [
          field('Icon (fa-…)', `about.values.${i}.icon`),
          field('Title', `about.values.${i}.title`)
        ]), field('Text', `about.values.${i}.text`, { full: true })],
        () => ({ icon: 'fa-star', title: 'New Value', text: '' }), 'Add value')
    ])
  ]);

  editors.whyMarquee = () => h('div', { class: 'ed-card' }, [
    h('h3', {}, [h('i', { class: 'fa-solid fa-bolt' }), ' Trust Marquee']),
    h('p', { class: 'ed-hint' }, 'The moving green strip. Each item is an icon + a few words.'),
    repeatList('whyMarquee',
      (w) => w.label || 'Item',
      (w, i) => [h('div', { class: 'ed-grid' }, [
        field('Icon (fa-…)', `whyMarquee.${i}.icon`),
        field('Label', `whyMarquee.${i}.label`)
      ])],
      () => ({ icon: 'fa-leaf', label: 'New Point' }), 'Add item')
  ]);

  editors.services = () => h('div', {}, [
    h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-stethoscope' }), ' Services Heading']),
      h('div', { class: 'ed-grid' }, [
        field('Eyebrow', 'servicesMeta.eyebrow'),
        field('Title', 'servicesMeta.title')
      ]),
      field('Subtitle', 'servicesMeta.subtitle', { full: true })
    ]),
    h('div', { class: 'ed-card' }, [
      h('h3', {}, 'Treatments'),
      h('p', { class: 'ed-hint' }, 'Each treatment opens a detail popup on the site.'),
      repeatList('services',
        (s) => s.name || 'Service',
        (s, i) => [
          imageControl('Category image', `services.${i}.image`),
          h('div', { class: 'ed-grid' }, [
            field('Name', `services.${i}.name`),
            field('Icon (fa-…)', `services.${i}.icon`),
            field('Badge / speciality', `services.${i}.badge`),
            field('Typical course', `services.${i}.duration`)
          ]),
          field('Description', `services.${i}.desc`, { type: 'textarea', full: true }),
          linesField('Conditions covered (one per line)', `services.${i}.symptoms`),
          linesField('Our approach (one per line)', `services.${i}.approach`)
        ],
        () => ({ id: 'svc-' + Date.now().toString(36), name: 'New Service', icon: 'fa-leaf', badge: '', duration: '4-6 weeks', image: '', desc: '', symptoms: [], approach: [] }),
        'Add service')
    ])
  ]);

  /* ---- Multi-image gallery editor (3-5 images per product) ---- */
  function imagesEditor(path) {
    if (!Array.isArray(getPath(content, path))) {
      // migrate a single legacy `image` into the images array
      const legacy = getPath(content, path.replace(/\.images$/, '.image'));
      setPath(content, path, legacy ? [legacy] : []);
    }
    const arr = getPath(content, path);
    const imgPath = path.replace(/\.images$/, '.image');
    const container = h('div', { class: 'field field-full' });
    const syncPrimary = () => setPath(content, imgPath, arr[0] || '');
    const rebuild = () => {
      container.innerHTML = '';
      container.appendChild(h('label', {}, 'Product images (add 3–5)'));
      const gallery = h('div', { class: 'img-gallery' });
      arr.forEach((src, idx) => {
        const rm = h('button', { class: 'img-gallery-remove', type: 'button', title: 'Remove' }, h('i', { class: 'fa-solid fa-xmark' }));
        rm.addEventListener('click', () => { arr.splice(idx, 1); syncPrimary(); rebuild(); });
        gallery.appendChild(h('div', { class: 'img-gallery-item' }, [
          h('img', { src: assetUrl(src), alt: '' }),
          idx === 0 ? h('span', { class: 'img-gallery-primary' }, 'Main') : null,
          rm
        ]));
      });
      const uploadBtn = h('button', { class: 'btn btn-outline btn-sm', type: 'button' }, [h('i', { class: 'fa-solid fa-upload' }), ' Upload']);
      uploadBtn.addEventListener('click', () => pickFile(async (file) => {
        try { toast('Uploading…'); const { url } = await uploadImage(file); arr.push(url); syncPrimary(); rebuild(); toast('Image added'); }
        catch (e) { toast(e.message, true); }
      }));
      const libBtn = h('button', { class: 'btn btn-outline btn-sm', type: 'button' }, [h('i', { class: 'fa-solid fa-images' }), ' Library']);
      libBtn.addEventListener('click', () => openPicker((url) => { arr.push(url); syncPrimary(); rebuild(); }));
      gallery.appendChild(h('div', { class: 'img-gallery-add' }, [uploadBtn, libBtn]));
      container.appendChild(gallery);
      container.appendChild(h('div', { class: 'tag-hint' }, 'First image is the main photo shown on the product card. Drag not needed — remove and re-add to reorder.'));
    };
    rebuild();
    return container;
  }

  editors.products = () => {
    const wrap = h('div', {});
    wrap.appendChild(h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-bag-shopping' }), ' Shop Heading']),
      h('div', { class: 'ed-grid' }, [
        field('Eyebrow', 'shopMeta.eyebrow'),
        field('Title', 'shopMeta.title')
      ]),
      field('Subtitle', 'shopMeta.subtitle', { full: true })
    ]));

    content.products = content.products || [];

    if (productEditIndex == null) {
      /* ---------- LIST VIEW ---------- */
      const listCard = h('div', { class: 'ed-card' });
      const head = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem' }, [
        h('h3', { style: 'margin:0' }, `Products (${content.products.length})`),
        (() => { const b = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, [h('i', { class: 'fa-solid fa-plus' }), ' Add product']);
          b.addEventListener('click', () => {
            content.products.push({ id: 'prod-' + Date.now().toString(36), name: 'New Product', category: (content.shopMeta?.categories?.[0]?.key || 'sharbat'), collections: [], price: 0, oldPrice: null, rating: 5, reviews: 0, badge: '', stock: 'in', image: '', images: [], desc: '', benefits: [], ingredients: '', dosage: '' });
            productEditIndex = content.products.length - 1; rerender();
          }); return b; })()
      ]);
      listCard.appendChild(head);
      listCard.appendChild(h('p', { class: 'ed-hint' }, 'Click a product to open and edit its full details.'));

      const list = h('div', { class: 'product-list' });
      content.products.forEach((p, i) => {
        const thumb = (Array.isArray(p.images) && p.images[0]) || p.image || '';
        const openIt = () => { productEditIndex = i; rerender(); };
        const editBtn = h('button', { class: 'btn btn-outline btn-sm', type: 'button' }, [h('i', { class: 'fa-solid fa-pen' }), ' Edit']);
        editBtn.addEventListener('click', openIt);
        const delBtn = h('button', { class: 'btn btn-danger btn-sm', type: 'button', title: 'Delete' }, h('i', { class: 'fa-solid fa-trash' }));
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); if (confirm(`Delete "${p.name}"?`)) { content.products.splice(i, 1); rerender(); } });
        const row = h('div', { class: 'product-row' }, [
          h('img', { class: 'product-row-thumb', src: assetUrl(thumb), alt: '' }),
          h('div', { class: 'product-row-info' }, [
            h('strong', {}, p.name || 'Untitled'),
            h('span', {}, `${(content.shopMeta?.categories?.find(c => c.key === p.category)?.label) || p.category || '—'} · Rs. ${p.price} · ${(Array.isArray(p.images) ? p.images.length : (p.image ? 1 : 0))} image(s)`)
          ]),
          h('div', { class: 'product-row-actions' }, [editBtn, delBtn])
        ]);
        row.addEventListener('click', openIt);
        list.appendChild(row);
      });
      if (!content.products.length) list.appendChild(h('p', { class: 'ed-hint' }, 'No products yet — click "Add product".'));
      listCard.appendChild(list);
      wrap.appendChild(listCard);
    } else {
      /* ---------- DETAIL VIEW ---------- */
      const i = productEditIndex;
      const p = content.products[i];
      if (!p) { productEditIndex = null; return editors.products(); }
      const catOpts = (content.shopMeta?.categories || []).map(c => ({ value: c.key, label: c.label }));
      const badgeOpts = [{ value: '', label: 'None' }, { value: 'new', label: 'New' }, { value: 'bestseller', label: 'Bestseller' }, { value: 'sale', label: 'Sale' }];
      const stockOpts = [{ value: 'in', label: 'In stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }];

      const back = h('button', { class: 'btn btn-outline btn-sm', type: 'button', style: 'margin-bottom:1rem' }, [h('i', { class: 'fa-solid fa-arrow-left' }), ' Back to products']);
      back.addEventListener('click', () => { productEditIndex = null; rerender(); });
      wrap.appendChild(back);

      const card = h('div', { class: 'ed-card' }, [
        h('h3', {}, [h('i', { class: 'fa-solid fa-pen' }), ' Edit: ' + (p.name || 'Product')]),
        imagesEditor(`products.${i}.images`),
        h('div', { class: 'ed-grid' }, [
          field('Name', `products.${i}.name`),
          field('Category', `products.${i}.category`, { type: 'select', options: catOpts }),
          field('Price (Rs.)', `products.${i}.price`, { type: 'number' }),
          field('Old price (optional)', `products.${i}.oldPrice`, { type: 'number' }),
          field('Badge', `products.${i}.badge`, { type: 'select', options: badgeOpts }),
          field('Stock', `products.${i}.stock`, { type: 'select', options: stockOpts }),
          field('Rating (0-5)', `products.${i}.rating`, { type: 'number' }),
          field('Reviews count', `products.${i}.reviews`, { type: 'number' })
        ]),
        collectionsCheck(i, p),
        field('Description', `products.${i}.desc`, { type: 'textarea', full: true }),
        linesField('Benefits (one per line)', `products.${i}.benefits`),
        field('Ingredients', `products.${i}.ingredients`, { full: true }),
        field('Dosage / usage', `products.${i}.dosage`, { full: true })
      ]);
      wrap.appendChild(card);

      const bottomRow = h('div', { style: 'display:flex;gap:.75rem;justify-content:space-between' });
      const doneBtn = h('button', { class: 'btn btn-primary', type: 'button' }, [h('i', { class: 'fa-solid fa-check' }), ' Done editing']);
      doneBtn.addEventListener('click', () => { productEditIndex = null; rerender(); });
      const delBtn2 = h('button', { class: 'btn btn-danger', type: 'button' }, [h('i', { class: 'fa-solid fa-trash' }), ' Delete product']);
      delBtn2.addEventListener('click', () => { if (confirm(`Delete "${p.name}"?`)) { content.products.splice(i, 1); productEditIndex = null; rerender(); } });
      bottomRow.appendChild(delBtn2);
      bottomRow.appendChild(doneBtn);
      wrap.appendChild(bottomRow);
    }
    return wrap;
  };

  function collectionsCheck(i, p) {
    const opts = (content.shopMeta?.collections || []).filter(c => c.key !== 'all');
    p.collections = p.collections || [];
    const boxes = opts.map(c => {
      const cb = h('input', { type: 'checkbox', checked: p.collections.includes(c.key) });
      cb.addEventListener('change', () => {
        if (cb.checked) { if (!p.collections.includes(c.key)) p.collections.push(c.key); }
        else p.collections = p.collections.filter(k => k !== c.key);
      });
      return h('label', { style: 'display:inline-flex;align-items:center;gap:.4rem;margin-right:1rem;font-size:.85rem' }, [cb, c.label]);
    });
    return h('div', { class: 'field field-full' }, [h('label', {}, 'Collections'), h('div', {}, boxes)]);
  }

  editors.testimonials = () => h('div', {}, [
    h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-quote-right' }), ' Testimonials Heading']),
      h('div', { class: 'ed-grid' }, [
        field('Eyebrow', 'testimonialsMeta.eyebrow'),
        field('Title', 'testimonialsMeta.title'),
        field('Rating', 'testimonialsMeta.rating'),
        field('Rating source', 'testimonialsMeta.ratingSource')
      ])
    ]),
    h('div', { class: 'ed-card' }, [
      h('h3', {}, 'Reviews'),
      repeatList('testimonials',
        (t) => t.name || 'Review',
        (t, i) => [
          field('Review text', `testimonials.${i}.text`, { type: 'textarea', full: true }),
          h('div', { class: 'ed-grid' }, [
            field('Name', `testimonials.${i}.name`),
            field('Role / product', `testimonials.${i}.role`)
          ])
        ],
        () => ({ text: '', name: 'New Patient', role: '' }), 'Add review')
    ])
  ]);

  editors.booking = () => h('div', {}, [
    h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-regular fa-calendar-check' }), ' Booking Section']),
      h('div', { class: 'ed-grid' }, [
        field('Eyebrow', 'booking.eyebrow'),
        field('Title', 'booking.title')
      ]),
      field('Subtitle', 'booking.subtitle', { full: true }),
      linesField('Perks (one per line)', 'booking.perks'),
      linesField('Departments (one per line)', 'booking.departments'),
      linesField('Doctors (one per line)', 'booking.doctors')
    ])
  ]);

  editors.contact = () => h('div', {}, [
    h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-location-dot' }), ' Contact Details']),
      h('div', { class: 'ed-grid' }, [
        field('Eyebrow', 'contact.eyebrow'),
        field('Title', 'contact.title'),
        field('Phone', 'contact.phone'),
        field('WhatsApp (display)', 'contact.whatsapp'),
        field('Email', 'contact.email'),
        field('Working hours', 'contact.hours'),
        field('Emergency line', 'contact.emergency')
      ]),
      field('Google Map embed URL', 'contact.mapEmbed', { full: true }),
      linesField('Branches (one per line)', 'contact.branches')
    ])
  ]);

  editors.footer = () => h('div', {}, [
    h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-shoe-prints' }), ' Footer']),
      field('About text', 'footer.about', { type: 'textarea', full: true })
    ]),
    h('div', { class: 'ed-card' }, [
      h('h3', {}, 'Social Links'),
      repeatList('footer.socials',
        (s) => s.icon || 'Social',
        (s, i) => [h('div', { class: 'ed-grid' }, [
          field('Icon (fa-brands e.g. fa-facebook-f)', `footer.socials.${i}.icon`),
          field('URL', `footer.socials.${i}.url`)
        ])],
        () => ({ icon: 'fa-facebook-f', url: '#' }), 'Add link')
    ])
  ]);

  editors.media = () => {
    const card = h('div', { class: 'ed-card' }, [
      h('h3', {}, [h('i', { class: 'fa-solid fa-images' }), ' Media Library']),
      h('p', { class: 'ed-hint' }, 'All uploaded images. Click the copy icon to copy an image URL, or the trash to delete.'),
      h('button', { class: 'btn btn-primary btn-sm', type: 'button', id: 'media-upload' }, [h('i', { class: 'fa-solid fa-upload' }), ' Upload image']),
      h('div', { class: 'media-grid', id: 'media-grid', style: 'margin-top:1rem' }, [h('p', { class: 'ed-hint' }, 'Loading…')])
    ]);
    setTimeout(async () => {
      $('#media-upload').addEventListener('click', () => pickFile(async (file) => {
        try { toast('Uploading…'); await uploadImage(file); toast('Uploaded'); editors._renderMedia(); }
        catch (e) { toast(e.message, true); }
      }));
      editors._renderMedia();
    }, 0);
    return card;
  };
  editors._renderMedia = async () => {
    const grid = $('#media-grid'); if (!grid) return;
    try {
      const files = await listUploads();
      if (!files.length) { grid.innerHTML = '<p class="ed-hint">No uploads yet.</p>'; return; }
      grid.innerHTML = '';
      files.forEach(f => {
        const copyBtn = h('button', { title: 'Copy URL' }, h('i', { class: 'fa-solid fa-copy' }));
        copyBtn.addEventListener('click', () => { navigator.clipboard?.writeText(f.url); toast('URL copied'); });
        const delBtn = h('button', { title: 'Delete' }, h('i', { class: 'fa-solid fa-trash' }));
        delBtn.addEventListener('click', async () => { if (confirm('Delete this image?')) { try { await deleteUpload(f.name); editors._renderMedia(); toast('Deleted'); } catch (e) { toast(e.message, true); } } });
        grid.appendChild(h('div', { class: 'media-item' }, [
          h('img', { src: f.url, alt: f.name, loading: 'lazy' }),
          h('div', { class: 'media-actions' }, [h('span', { class: 'media-copy', title: f.name }, f.name), h('div', {}, [copyBtn, delBtn])])
        ]));
      });
    } catch (e) { grid.innerHTML = `<p class="ed-hint">${e.message}</p>`; }
  };

  /* ==========================================================================
     FILE PICKER + MEDIA PICKER
     ========================================================================== */
  let fileCb = null;
  function pickFile(cb) { fileCb = cb; const inp = $('#upload-input'); inp.value = ''; inp.click(); }
  $('#upload-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && fileCb) fileCb(file);
    fileCb = null;
  });

  async function openPicker(onPick) {
    const overlay = h('div', { class: 'picker-overlay' });
    const grid = h('div', { class: 'media-grid' }, [h('p', { class: 'ed-hint' }, 'Loading…')]);
    const closeBtn = h('button', { class: 'picker-close', type: 'button' }, h('i', { class: 'fa-solid fa-xmark' }));
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.appendChild(h('div', { class: 'picker-box' }, [
      h('h3', {}, ['Pick an image', closeBtn]), grid
    ]));
    document.body.appendChild(overlay);
    try {
      const files = await listUploads();
      grid.innerHTML = '';
      if (!files.length) grid.appendChild(h('p', { class: 'ed-hint' }, 'No uploads yet — use the Upload button instead.'));
      files.forEach(f => {
        const item = h('div', { class: 'media-item', style: 'cursor:pointer' }, [h('img', { src: f.url, alt: f.name })]);
        item.addEventListener('click', () => { onPick(f.url); overlay.remove(); toast('Image selected'); });
        grid.appendChild(item);
      });
    } catch (e) { grid.innerHTML = `<p class="ed-hint">${e.message}</p>`; }
  }

  /* ==========================================================================
     ROUTER / RENDER
     ========================================================================== */
  const TITLES = { dashboard: 'Dashboard', settings: 'Site Settings', sections: 'Sections', hero: 'Hero', about: 'About', whyMarquee: 'Trust Marquee', services: 'Services', products: 'Products', testimonials: 'Testimonials', booking: 'Booking', contact: 'Contact', footer: 'Footer', media: 'Media Library' };
  function rerender() {
    const host = $('#admin-content');
    host.innerHTML = '';
    host.appendChild((editors[currentTab] || editors.dashboard)());
    $('#admin-title').textContent = TITLES[currentTab] || 'Admin';
    document.querySelectorAll('#admin-nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab));
  }
  function switchTab(tab) {
    currentTab = tab; productEditIndex = null; rerender();
    $('.admin-sidebar').classList.remove('open');
    window.scrollTo(0, 0);
  }

  /* ==========================================================================
     SAVE
     ========================================================================== */
  async function save() {
    const btn = $('#save-btn');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    try {
      await saveContent();
      toast('All changes saved & published');
      const s = $('#admin-saved'); s.hidden = false; setTimeout(() => (s.hidden = true), 2500);
    } catch (e) { toast(e.message, true); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes'; }
  }

  /* ==========================================================================
     BOOT
     ========================================================================== */
  async function boot() {
    try {
      content = await loadContent();
      // guarantee containers exist
      content.sections = content.sections || {};
      $('#login-view').style.display = 'none';
      $('#app-view').hidden = false;
      switchTab('dashboard');
    } catch (e) {
      logout();
    }
  }

  // events
  $('#login-form').addEventListener('submit', doLogin);
  $('#logout-btn').addEventListener('click', () => { api('/api/logout', { method: 'POST' }).catch(() => {}); logout(); });
  $('#save-btn').addEventListener('click', save);
  document.querySelectorAll('#admin-nav button').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  $('#admin-menu-toggle').addEventListener('click', () => $('.admin-sidebar').classList.toggle('open'));
  window.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (!$('#app-view').hidden) save(); } });

  // auto-login if token present
  if (token) boot(); else $('#login-view').style.display = 'flex';
})();
