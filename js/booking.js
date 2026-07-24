/* ==========================================================================
   BOOKING — appointment form validation + animated success state
   ========================================================================== */

(() => {
  const form = document.getElementById('booking-form');
  if (!form) return;

  const formView = document.getElementById('booking-form-view');
  const successView = document.getElementById('booking-success-view');
  const summaryEl = document.getElementById('booking-success-summary');
  const dateInput = document.getElementById('bk-date');

  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const name = document.getElementById('bk-name').value;
    const dept = document.getElementById('bk-dept').value;
    const date = dateInput.value;
    summaryEl.textContent = `${dept} on ${date}`;

    formView.hidden = true;
    successView.hidden = false;
    BD.toast(`Thanks, ${name}! We'll confirm shortly.`, 'fa-calendar-check');
  });

  document.getElementById('booking-reset-btn')?.addEventListener('click', () => {
    form.reset();
    formView.hidden = false;
    successView.hidden = true;
  });
})();
