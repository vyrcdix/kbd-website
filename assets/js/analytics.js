/* GA4. Kept in a file rather than inline so the Content-Security-Policy in
   netlify.toml can stay strict — no 'unsafe-inline' anywhere on the site.
   The brief asks for three conversions: message sends, and tel and mailto taps. */
(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-G0EFPKYL7X';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID);

  /* A message that reached the thank-you page is the conversion. The page
     carries data-ga-event so this file needs no knowledge of URLs. */
  var pageEvent = document.body && document.body.getAttribute('data-ga-event');
  if (pageEvent) gtag('event', pageEvent);

  /* One delegated listener rather than a handler per link, so nothing has to
     be rewired when a page gains a phone number or an address. */
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    var label = (link.textContent || '').trim().slice(0, 80);

    if (href.indexOf('tel:') === 0) {
      gtag('event', 'phone_tap', { link_text: label });
    } else if (href.indexOf('mailto:') === 0) {
      gtag('event', 'email_tap', { link_text: label });
    } else if (href.indexOf('bcacc.ca') > -1 || href.indexOf('bcplaytherapy.ca') > -1) {
      gtag('event', 'verification_click', { link_text: label });
    }
  });
})();
