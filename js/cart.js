/* ==========================================================================
   CART — localStorage-backed state + slide-in cart drawer
   ========================================================================== */

(() => {
  const CART_KEY = 'bd-cart';

  const getCart = () => BD.storage.get(CART_KEY, []);
  const setCart = (items) => { BD.storage.set(CART_KEY, items); renderCart(); updateBadges(); };

  const findProduct = (id) => window.BD_MEDICINES?.find(p => p.id === id);

  const addToCart = (id, qty = 1) => {
    const items = getCart();
    const existing = items.find(i => i.id === id);
    if (existing) existing.qty += qty;
    else items.push({ id, qty });
    setCart(items);
    BD.toast('Added to cart', 'fa-bag-shopping');
  };
  const removeFromCart = (id) => setCart(getCart().filter(i => i.id !== id));
  const updateQty = (id, qty) => {
    const items = getCart();
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.qty = BD.clamp(qty, 1, 20);
    setCart(items);
  };

  const updateBadges = () => {
    const cartCount = getCart().reduce((sum, i) => sum + i.qty, 0);
    const cb = document.getElementById('cart-count');
    if (cb) cb.textContent = cartCount;
  };

  const imgOf = (p) => (Array.isArray(p.images) && p.images[0]) || p.image || '';

  const cartItemRow = (item) => {
    const p = findProduct(item.id);
    if (!p) return '';
    return `
    <div class="drawer-item" data-id="${p.id}">
      <img src="${imgOf(p)}" alt="${p.name}">
      <div class="drawer-item-info">
        <strong>${p.name}</strong>
        <span>${BD.formatPrice(p.price)}</span>
        <div class="qty-stepper qty-stepper-sm">
          <button type="button" data-cart-dec="${p.id}" aria-label="Decrease"><i class="fa-solid fa-minus"></i></button>
          <span>${item.qty}</span>
          <button type="button" data-cart-inc="${p.id}" aria-label="Increase"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
      <button class="drawer-remove" data-cart-remove="${p.id}" aria-label="Remove item"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  };

  const renderCart = () => {
    const host = document.getElementById('cart-items');
    if (!host) return;
    const items = getCart();
    host.innerHTML = items.length ? items.map(cartItemRow).join('') : `<div class="drawer-empty"><i class="fa-solid fa-bag-shopping"></i><p>Your cart is empty</p></div>`;
    const subtotal = items.reduce((sum, i) => sum + (findProduct(i.id)?.price || 0) * i.qty, 0);
    const subEl = document.getElementById('cart-subtotal');
    if (subEl) subEl.textContent = BD.formatPrice(subtotal);
  };

  window.BD_cart = { getCart, setCart, addToCart, removeFromCart, updateQty, findProduct, renderCart, updateBadges };

  /* ---- Drawer open/close ---- */
  const openDrawer = (drawer, backdrop) => { drawer?.classList.add('active'); backdrop?.classList.add('active'); document.documentElement.classList.add('no-scroll'); };
  const closeDrawer = (drawer, backdrop) => { drawer?.classList.remove('active'); backdrop?.classList.remove('active'); document.documentElement.classList.remove('no-scroll'); };

  const cartDrawer = document.getElementById('cart-drawer');
  const cartBackdrop = document.getElementById('cart-backdrop');

  document.getElementById('cart-toggle')?.addEventListener('click', () => openDrawer(cartDrawer, cartBackdrop));
  document.getElementById('cart-close')?.addEventListener('click', () => closeDrawer(cartDrawer, cartBackdrop));
  cartBackdrop?.addEventListener('click', () => closeDrawer(cartDrawer, cartBackdrop));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeDrawer(cartDrawer, cartBackdrop);
  });

  document.getElementById('cart-items')?.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-cart-inc]');
    const dec = e.target.closest('[data-cart-dec]');
    const rem = e.target.closest('[data-cart-remove]');
    if (inc) { const id = inc.dataset.cartInc; updateQty(id, (getCart().find(i => i.id === id)?.qty || 0) + 1); }
    if (dec) { const id = dec.dataset.cartDec; const cur = getCart().find(i => i.id === id)?.qty || 0; cur <= 1 ? removeFromCart(id) : updateQty(id, cur - 1); }
    if (rem) removeFromCart(rem.dataset.cartRemove);
  });

  renderCart(); updateBadges();
})();
