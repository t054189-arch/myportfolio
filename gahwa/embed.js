/* ==========================================================================
   gahwa — the one line another site includes
   ==========================================================================
       <div id="gahwa"></div>
       <script src="https://<host>/gahwa/embed.js"
               data-venue="riwaq-jabriya"
               data-theme="dark"
               data-lang="en"
               data-mount="#gahwa"
               async></script>

   It inserts an IFRAME, not markup. Two reasons, both of them the point
   of the exercise:

     - the host page's CSS cannot reach inside an iframe, so the widget
       looks the same on a site built by anyone, and cannot be broken by
       a stray `button { }` rule three stylesheets deep;
     - the host page's JavaScript cannot read inside it either. The
       widget is on our origin; the host is not. There is no arrangement
       of injected markup that gives that guarantee.

   What crosses the boundary is three messages, checked for origin at
   both ends, and the only one carrying a payload says { venue_id, at }.
   The host learns that a check-in happened at their venue. Nothing about
   who, nothing about anywhere else.
   ========================================================================== */

(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) {
    var all = document.getElementsByTagName('script');
    script = all[all.length - 1];
  }

  var venue = script.getAttribute('data-venue');
  if (!venue) {
    if (window.console) console.warn('[gahwa] embed.js needs a data-venue');
    return;
  }

  var theme = script.getAttribute('data-theme') === 'dark' ? 'dark' : 'warm';
  var lang  = script.getAttribute('data-lang')  === 'ar'   ? 'ar'   : 'en';
  var mountSel = script.getAttribute('data-mount');

  /* Our origin is wherever this script was served from, which is also
     where the iframe and the popup live. Nothing is hard-coded, so the
     same file works from any host that serves the folder. */
  var base = script.src.replace(/\/embed\.js(\?.*)?$/, '');
  var appOrigin;
  try { appOrigin = new URL(base, window.location.href).origin; }
  catch (e) { appOrigin = window.location.origin; }

  var mount = mountSel ? document.querySelector(mountSel) : null;
  if (!mount) {
    mount = document.createElement('div');
    script.parentNode.insertBefore(mount, script);
  }

  var src = base + '/checkin.html' +
    '?venue=' + encodeURIComponent(venue) +
    '&theme=' + theme + '&lang=' + lang +
    '&host=' + encodeURIComponent(window.location.origin);

  var frame = document.createElement('iframe');
  frame.src = src;
  frame.title = 'gahwa check-in';
  frame.loading = 'lazy';
  frame.setAttribute('scrolling', 'no');
  /* allow-same-origin refers to the frame's OWN origin, not the host's:
     it lets the widget keep using its own storage and session. The host
     page is a different origin either way and can still read nothing.
     allow-popups is what lets the Check in button open a real top-level
     window where the session can be first-party. */
  frame.setAttribute('sandbox',
    'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms');
  frame.style.cssText = 'width:100%;border:0;display:block;height:260px;' +
                        'color-scheme:normal;background:transparent';
  mount.appendChild(frame);

  /* --- the contract ---------------------------------------------------- */

  function handle(event) {
    /* Both ends check. The host verifies the message came from the app
       origin, and the widget was told the host's origin to answer to. */
    if (event.origin !== appOrigin) return;
    if (event.source !== frame.contentWindow) return;

    var d = event.data;
    if (!d || typeof d.type !== 'string') return;

    if (d.type === 'gahwa:resize') {
      var h = Number(d.height);
      if (h > 0 && h < 4000) frame.style.height = h + 'px';
      return;
    }

    if (d.type === 'gahwa:ready' || d.type === 'gahwa:checkin') {
      /* Re-emit on the host page as a plain CustomEvent, so a host can
         react without knowing anything about postMessage. The detail is
         copied field by field rather than passed through, so a future
         version of the widget cannot start leaking extra keys into a
         host that trusted this. */
      var detail = d.type === 'gahwa:checkin'
        ? { venue_id: String(d.venue_id || ''), at: String(d.at || '') }
        : { venue_id: venue };
      try {
        window.dispatchEvent(new CustomEvent(d.type, { detail: detail }));
      } catch (e) { /* very old browser: the widget still works */ }
    }
  }

  window.addEventListener('message', handle);
})();
