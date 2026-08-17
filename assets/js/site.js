/* Kristina Dixon Counselling — the only behavioural script on the site, loaded
   only by contact.html. The mobile menu and the credentials disclosure are
   both native <details>, so nothing else needs JavaScript.

   Everything here is enhancement. With JS off the form posts normally to
   /api/contact, the browser enforces the required field, and the Function
   redirects to /thanks.html or /message-not-sent.html. */
(function () {
  'use strict';

  var form = document.querySelector('[data-message-form]');
  if (!form) return;

  var required = form.querySelector('[data-required-field]');
  var fieldError = form.querySelector('[data-field-error]');
  var formError = form.querySelector('[data-form-error]');
  var submit = form.querySelector('.form__submit');
  if (!required || !fieldError) return;

  /* Errors are text beside the field, never colour alone, and never a browser
     bubble that vanishes before it can be read. */
  var MISSING = 'Please add an email address or a phone number, so I have a way to reply.';
  var FAILED =
    'Something went wrong sending that, and it is my fault rather than yours. ' +
    'Your message is still in the box above — please try once more, or email it ' +
    'straight to hello@kristinadixon.ca.';

  form.setAttribute('novalidate', '');

  function clearFieldError() {
    if (!fieldError.textContent) return;
    fieldError.textContent = '';
    required.removeAttribute('aria-invalid');
  }

  required.addEventListener('input', clearFieldError);

  form.addEventListener('submit', function (event) {
    if (required.value.trim() === '') {
      event.preventDefault();
      fieldError.textContent = MISSING;
      required.setAttribute('aria-invalid', 'true');
      required.focus();
      return;
    }
    clearFieldError();

    /* Submit in the background so that a failure can be reported without
       navigating away and throwing out what someone just spent ten minutes
       working up the nerve to write. */
    if (!window.fetch || !formError) return;
    event.preventDefault();

    if (formError.textContent) formError.textContent = '';
    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sending';
    }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then(function (response) {
        return response.ok ? response.json() : { ok: false };
      })
      .catch(function () {
        return { ok: false };
      })
      .then(function (result) {
        if (result && result.ok) {
          window.location.href = '/thanks.html';
          return;
        }
        formError.textContent = FAILED;
        if (submit) {
          submit.disabled = false;
          submit.textContent = 'Send';
        }
      });
  });
})();
