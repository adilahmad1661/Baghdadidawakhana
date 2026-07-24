/* ==========================================================================
   SHOP — product data, grid rendering, filter/sort, quick view, checkout
   ========================================================================== */

(() => {
  const MEDICINES = [
    { id: 'arq-e-gulab', name: 'Arq-e-Gulab (Rose Water)', category: 'arqiyat', collections: ['new'], price: 250, oldPrice: null, rating: 4.9, reviews: 86, badge: 'new', stock: 'in',
      image: 'assets/images/products/arq-e-gulab.jpg', images: ['assets/images/products/arq-e-gulab.jpg','assets/images/products/arq-e-gulab-2.jpg','assets/images/products/arq-e-gulab-3.jpg'],
      desc: 'Arq-e-Gulab has long been used as a natural remedy for eye care. Its soothing properties help relieve irritation, reduce redness, and refresh tired eyes.',
      benefits: ['Soothes and refreshes eyes', 'Calms skin irritation', 'Adds natural fragrance to skincare routines'],
      ingredients: '100% pure Arq-e-Gulab (rose distillate).', dosage: 'Traditionally, 2-3 drops are applied to calm inflammation and support eye comfort.' },
    { id: 'sharbat-anaar', name: 'Sharbat Anaar (Pomegranate Syrup)', category: 'sharbat', collections: ['bestseller'], price: 420, oldPrice: null, rating: 4.8, reviews: 154, badge: 'bestseller', stock: 'in',
      image: 'assets/images/products/sharbat-anaar.jpg', images: ['assets/images/products/sharbat-anaar.jpg','assets/images/products/sharbat-anaar-2.jpg','assets/images/products/sharbat-anaar-3.jpg'],
      desc: 'Rich pomegranate syrup made the traditional way — a refreshing tonic the whole family can enjoy, hot or cold.',
      benefits: ['Refreshing natural tonic', 'Rich pomegranate flavour', 'A family favourite year-round'],
      ingredients: 'Pomegranate extract, sugar, water.', dosage: 'Mix 1-2 tablespoons with a glass of cold water. Serve chilled.' },
    { id: 'sharbat-sandal', name: 'Sharbat Sandal (Sandalwood Syrup)', category: 'sharbat', collections: ['new'], price: 420, oldPrice: null, rating: 4.7, reviews: 97, badge: '', stock: 'in',
      image: 'assets/images/products/sharbat-sandal.jpg', images: ['assets/images/products/sharbat-sandal.jpg','assets/images/products/sharbat-sandal-2.jpg','assets/images/products/sharbat-sandal-3.jpg'],
      desc: 'Cooling sandalwood syrup made of herbal sandalwood ingredients — a traditional summer favourite for a refreshing homemade drink.',
      benefits: ['Traditional cooling tonic', 'Refreshing summer drink', 'Pleasant natural aroma'],
      ingredients: 'Herbal sandalwood ingredients, sugar, water.', dosage: 'Mix 1-2 tablespoons with a glass of cold water. Serve chilled.' },
    { id: 'sirka-angoori', name: 'Sirka Angoori (Grape Vinegar)', category: 'vinegars', collections: ['bestseller'], price: 380, oldPrice: null, rating: 4.8, reviews: 121, badge: 'bestseller', stock: 'in',
      image: 'assets/images/products/sirka-angoori.jpg', images: ['assets/images/products/sirka-angoori.jpg','assets/images/products/sirka-angoori-2.jpg','assets/images/products/sirka-angoori-3.jpg'],
      desc: 'A natural vinegar prepared from pure, high-quality grapes through traditional fermentation — suitable for improving digestion and enhancing the taste of food.',
      benefits: ['Naturally fermented, no shortcuts', 'Made from quality grapes', 'Enhances the taste of food and drinks'],
      ingredients: 'Fermented grape vinegar (Sirka Angoori).', dosage: 'Mix 1-2 tablespoons in a glass of water, or use to enhance meals as desired.' },
    { id: 'arq-saunf', name: 'Arq Saunf (Fennel Distillate)', category: 'arqiyat', collections: [], price: 320, oldPrice: null, rating: 4.6, reviews: 68, badge: '', stock: 'in',
      image: 'assets/images/products/arq-saunf.jpg', images: ['assets/images/products/arq-saunf.jpg','assets/images/products/arq-saunf-2.jpg','assets/images/products/arq-saunf-3.jpg'],
      desc: 'Traditional fennel-seed distillate, taken to support healthy digestion and ease everyday bloating.',
      benefits: ['Supports digestion', 'Eases bloating and gas', 'Gentle, cooling formula'],
      ingredients: '100% pure Arq Saunf (fennel distillate).', dosage: '2-3 tablespoons in water, after meals or as directed.' },
    { id: 'arq-chahar', name: 'Arq Chahar (Four-Herb Distillate)', category: 'arqiyat', collections: [], price: 320, oldPrice: null, rating: 4.6, reviews: 54, badge: '', stock: 'in',
      image: 'assets/images/products/arq-chahar.jpg', images: ['assets/images/products/arq-chahar.jpg','assets/images/products/arq-chahar-2.jpg','assets/images/products/arq-chahar-3.jpg'],
      desc: 'A classical blend of four traditional herbs, distilled to support everyday wellness the way it has been made for generations.',
      benefits: ['Traditional four-herb blend', 'Cooling and refreshing', 'Supports everyday wellness'],
      ingredients: 'Herbal distillate blend of four traditional botanicals.', dosage: '2-3 tablespoons in water, once or twice daily.' }
  ];

  window.BD_MEDICINES = MEDICINES;

  // Use admin-managed products/categories when available, else built-in defaults
  const getProducts = () => (window.BD_CONTENT?.products?.length ? window.BD_CONTENT.products : MEDICINES);

  const CATEGORY_LABEL = {
    sharbat: 'Sharbat', arqiyat: 'Arqiyat', oils: 'Herbal Oil', creams: 'Herbal Cream',
    vinegars: 'Herbal Vinegar', powders: 'Herbal Powder', medicines: 'Herbal Medicine'
  };

  // Normalise a product's images to an array; primary image is first.
  const imagesOf = (p) => {
    if (Array.isArray(p.images) && p.images.length) return p.images.filter(Boolean);
    return p.image ? [p.image] : [];
  };
  const imgOf = (p) => imagesOf(p)[0] || '';

  const grid = document.getElementById('shop-grid');
  const emptyMsg = document.getElementById('shop-empty');
  const filtersWrap = document.getElementById('shop-filters');
  const collectionsWrap = document.getElementById('shop-collections');
  const sortSelect = document.getElementById('shop-sort-select');
  const loadMoreBtn = document.getElementById('shop-load-more');
  let activeFilter = 'all';
  let activeCollection = 'all';
  let visibleCount = 8;

  const stockLabel = { in: '', low: 'Only a few left', out: 'Out of Stock' };
  const badgeLabel = { bestseller: 'Bestseller', new: 'New', sale: 'Sale' };

  const productCard = (p, i) => `
    <article class="product-card reveal-scale" data-reveal-delay="${(i % 4) * 70}" data-id="${p.id}">
      <div class="product-media" data-quickview="${p.id}" role="button" tabindex="0" aria-label="View details for ${p.name}">
        ${p.badge ? `<span class="badge badge-${p.badge === 'sale' ? 'orange' : p.badge === 'new' ? 'emerald' : 'gold'} product-badge">${badgeLabel[p.badge]}</span>` : ''}
        <img src="${imgOf(p)}" alt="${p.name}" loading="lazy">
        <span class="product-quickview"><i class="fa-solid fa-eye"></i> View Details</span>
      </div>
      <div class="product-body">
        <span class="product-cat">${CATEGORY_LABEL[p.category] || p.category}</span>
        <h3 data-quickview="${p.id}">${p.name}</h3>
        <div class="stars" aria-label="${p.rating} out of 5 stars">★★★★★<span class="stars-bg">★★★★★</span></div>
        <div class="product-price-row">
          <span class="product-price">${BD.formatPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="product-old-price">${BD.formatPrice(p.oldPrice)}</span>` : ''}
        </div>
        ${p.stock !== 'in' ? `<span class="stock-note ${p.stock}">${stockLabel[p.stock]}</span>` : ''}
        <button class="btn btn-primary btn-block btn-sm" data-add-cart="${p.id}" ${p.stock === 'out' ? 'disabled' : ''}><i class="fa-solid fa-bag-shopping"></i> Add to Cart</button>
        <div class="product-actions-row">
          <button class="btn btn-gold btn-sm" data-order-now="${p.id}" ${p.stock === 'out' ? 'disabled' : ''}><i class="fa-solid fa-bolt"></i> Order Now</button>
          <button class="btn product-wa-btn" data-whatsapp="${p.id}" aria-label="Order ${p.name} on WhatsApp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
        </div>
      </div>
    </article>`;

  const orderOnWhatsApp = (id) => {
    const p = getProducts().find(x => x.id === id);
    if (!p) return;
    const num = window.BD_CONTENT?.settings?.whatsapp || '923000000000';
    const msg = `Assalam-o-Alaikum, I would like to order: ${p.name} — ${BD.formatPrice(p.price)}. Please guide me on how to proceed.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getFiltered = () => getProducts().filter(p => {
    const matchCat = activeFilter === 'all' || p.category === activeFilter;
    const matchCollection = activeCollection === 'all' || p.collections.includes(activeCollection);
    return matchCat && matchCollection;
  });

  const getSorted = (list) => {
    const sorted = [...list];
    switch (sortSelect?.value) {
      case 'price-asc': return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc': return sorted.sort((a, b) => b.price - a.price);
      case 'rating': return sorted.sort((a, b) => b.rating - a.rating);
      case 'new': return sorted.filter(p => p.badge === 'new').concat(sorted.filter(p => p.badge !== 'new'));
      default: return sorted.sort((a, b) => (b.badge === 'bestseller') - (a.badge === 'bestseller'));
    }
  };

  const renderGrid = () => {
    if (!grid) return;
    const list = getSorted(getFiltered());
    grid.innerHTML = list.slice(0, visibleCount).map(productCard).join('');
    grid.style.display = list.length ? '' : 'none';
    if (emptyMsg) emptyMsg.hidden = list.length > 0;
    loadMoreBtn.style.display = list.length > visibleCount ? 'inline-flex' : 'none';
    window.BD_cart?.updateBadges();
    BD.revealCards(grid);
  };

  filtersWrap?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    BD.qsa('.chip', filtersWrap).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    visibleCount = 8;
    renderGrid();
  });
  collectionsWrap?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    BD.qsa('.chip', collectionsWrap).forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCollection = chip.dataset.collection;
    visibleCount = 8;
    renderGrid();
  });
  sortSelect?.addEventListener('change', renderGrid);
  loadMoreBtn?.addEventListener('click', () => { visibleCount += 8; renderGrid(); });

  grid?.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add-cart]');
    const orderBtn = e.target.closest('[data-order-now]');
    const waBtn = e.target.closest('[data-whatsapp]');
    const qvEl = e.target.closest('[data-quickview]');
    if (addBtn) { window.BD_cart?.addToCart(addBtn.dataset.addCart, 1); return; }
    if (orderBtn) { window.BD_cart?.addToCart(orderBtn.dataset.orderNow, 1); openCheckout(); return; }
    if (waBtn) { orderOnWhatsApp(waBtn.dataset.whatsapp); return; }
    if (qvEl) openQuickView(qvEl.dataset.quickview);
  });

  grid?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const media = e.target.closest('.product-media[data-quickview]');
    if (media) { e.preventDefault(); openQuickView(media.dataset.quickview); }
  });

  /* ---- Quick View ---- */
  const qvModal = document.getElementById('quickview-modal');
  let qvCurrentId = null;

  const openQuickView = (id) => {
    const p = getProducts().find(x => x.id === id);
    if (!p) return;
    qvCurrentId = id;
    const imgs = imagesOf(p);
    const mainImg = document.getElementById('qv-image');
    mainImg.src = imgs[0] || '';
    mainImg.alt = p.name;
    // Thumbnail gallery (only when there is more than one image)
    const thumbs = document.getElementById('qv-thumbs');
    if (thumbs) {
      if (imgs.length > 1) {
        thumbs.innerHTML = imgs.map((src, idx) =>
          `<button type="button" class="qv-thumb${idx === 0 ? ' active' : ''}" data-qv-thumb="${idx}"><img src="${src}" alt="${p.name} photo ${idx + 1}"></button>`
        ).join('');
        thumbs.style.display = 'flex';
        thumbs.querySelectorAll('[data-qv-thumb]').forEach(btn => btn.addEventListener('click', () => {
          mainImg.src = imgs[+btn.dataset.qvThumb];
          thumbs.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
        }));
      } else {
        thumbs.innerHTML = '';
        thumbs.style.display = 'none';
      }
    }
    document.getElementById('qv-badge').textContent = p.badge ? badgeLabel[p.badge] : 'Certified';
    document.getElementById('qv-category').textContent = CATEGORY_LABEL[p.category] || p.category;
    document.getElementById('qv-title').textContent = p.name;
    document.getElementById('qv-reviews').textContent = `(${p.reviews} reviews)`;
    document.getElementById('qv-price').textContent = BD.formatPrice(p.price);
    document.getElementById('qv-old-price').textContent = p.oldPrice ? BD.formatPrice(p.oldPrice) : '';
    document.getElementById('qv-stock').textContent = p.stock === 'out' ? 'Out of Stock' : p.stock === 'low' ? 'Low Stock' : 'In Stock';
    document.getElementById('qv-desc').textContent = p.desc;
    document.getElementById('qv-benefits').innerHTML = p.benefits.map(b => `<li><i class="fa-solid fa-check"></i> ${b}</li>`).join('');
    document.getElementById('qv-ingredients').textContent = p.ingredients;
    document.getElementById('qv-dosage').textContent = p.dosage;
    document.getElementById('qv-qty').value = 1;
    window.BD_openModal?.(qvModal);
  };

  const qvQtyInput = document.getElementById('qv-qty');
  document.querySelector('[data-qty="inc"]')?.addEventListener('click', () => { qvQtyInput.value = BD.clamp(parseInt(qvQtyInput.value || 1) + 1, 1, 20); });
  document.querySelector('[data-qty="dec"]')?.addEventListener('click', () => { qvQtyInput.value = BD.clamp(parseInt(qvQtyInput.value || 1) - 1, 1, 20); });
  document.getElementById('qv-add-cart')?.addEventListener('click', () => {
    if (!qvCurrentId) return;
    window.BD_cart?.addToCart(qvCurrentId, parseInt(qvQtyInput.value || 1));
    window.BD_closeModal?.(qvModal);
  });
  document.getElementById('qv-order-now')?.addEventListener('click', () => {
    if (!qvCurrentId) return;
    window.BD_cart?.addToCart(qvCurrentId, parseInt(qvQtyInput.value || 1));
    window.BD_closeModal?.(qvModal);
    openCheckout();
  });
  document.getElementById('qv-whatsapp')?.addEventListener('click', () => qvCurrentId && orderOnWhatsApp(qvCurrentId));

  /* ---- Checkout flow ---- */
  const checkoutModal = document.getElementById('checkout-modal');
  const formView = document.getElementById('checkout-form-view');
  const successView = document.getElementById('checkout-success-view');

  const openCheckout = () => {
    const items = window.BD_cart?.getCart() || [];
    if (!items.length) { BD.toast('Your cart is empty', 'fa-circle-exclamation'); return; }
    const summaryHost = document.getElementById('checkout-summary-items');
    let subtotal = 0;
    summaryHost.innerHTML = items.map(i => {
      const p = getProducts().find(m => m.id === i.id);
      if (!p) return '';
      subtotal += p.price * i.qty;
      return `<div class="checkout-summary-row"><span>${p.name} × ${i.qty}</span><span>${BD.formatPrice(p.price * i.qty)}</span></div>`;
    }).join('');
    document.getElementById('checkout-subtotal').textContent = BD.formatPrice(subtotal);
    document.getElementById('checkout-total').textContent = BD.formatPrice(subtotal + 150);
    formView.hidden = false;
    successView.hidden = true;
    document.getElementById('cart-close')?.click();
    window.BD_openModal?.(checkoutModal);
  };

  document.getElementById('cart-checkout-btn')?.addEventListener('click', openCheckout);

  document.getElementById('checkout-place-order')?.addEventListener('click', () => {
    const form = document.getElementById('checkout-form');
    if (!form.reportValidity()) return;
    const orderId = 'BD-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('success-order-id').textContent = '#' + orderId;
    formView.hidden = true;
    successView.hidden = false;
    window.BD_cart?.setCart([]);
    form.reset();
  });

  /* ---- Order tracking ---- */
  const trackModal = document.getElementById('track-modal');
  document.getElementById('cart-track-btn')?.addEventListener('click', () => {
    document.getElementById('cart-close')?.click();
    document.getElementById('track-steps').hidden = true;
    window.BD_openModal?.(trackModal);
  });
  document.getElementById('track-submit')?.addEventListener('click', () => {
    document.getElementById('track-steps').hidden = false;
  });

  renderGrid();
  document.addEventListener('bd:content', () => { visibleCount = 8; renderGrid(); });
})();
