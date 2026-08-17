/* Kristina Dixon Counselling — the only script on the site, loaded only by
   contact.html. The mobile menu and the credentials disclosure are both native
   <details>, so nothing else here needs JavaScript, and with JS off this form
   still submits and the browser still enforces the required field. */
(function () {
  'use strict';

  var form = document.querySelector('[data-message-form]');
  if (!form) return;

  var required = form.querySelector('[data-required-field]');
  var error = form.querySelector('[data-field-error]');
  if (!required || !error) return;

  /* The error is text beside the field, never colour alone, and never a
     browser bubble that disappears before it can be read. */
  var MESSAGE = 'Please add an email address or a phone number, so I have a way to reply.';

  form.setAttribute('novalidate', '');

  function clearError() {
    if (!error.textContent) return;
    error.textContent = '';
    required.removeAttribute('aria-invalid');
  }

  required.addEventListener('input', clearError);

  form.addEventListener('submit', function (event) {
    if (required.value.trim() !== '') {
      clearError();
      return;
    }
    event.preventDefault();
    error.textContent = MESSAGE;
    required.setAttribute('aria-invalid', 'true');
    required.focus();
  });
})();
