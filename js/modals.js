/* ==========================================================================
   MODALS — generic open/close plumbing for all .modal-overlay dialogs
   ========================================================================== */

(() => {
  let releaseFocus = null;
  let lastFocused = null;

  const openModal = (modal) => {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.classList.add('active');
    document.documentElement.classList.add('no-scroll');
    releaseFocus = BD.trapFocus(modal);
    modal.querySelector('[data-close-modal]')?.focus();
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('active');
    document.documentElement.classList.remove('no-scroll');
    releaseFocus?.();
    lastFocused?.focus();
  };

  window.BD_openModal = openModal;
  window.BD_closeModal = closeModal;

  BD.qsa('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    BD.qsa('[data-close-modal]', modal).forEach(btn => btn.addEventListener('click', () => closeModal(modal)));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    BD.qsa('.modal-overlay.active').forEach(closeModal);
  });
})();
