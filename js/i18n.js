/* ==========================================================================
   Bloom — language switching (English / Arabic)
   Static copy is translated through data-en / data-ar attributes; product
   content through { en, ar } pairs in js/data.js.
   ========================================================================== */

var I18N = (function () {

  var KEY = 'bloom.lang';
  var current = 'en';

  /* localStorage can throw in private modes — never let it break the page. */
  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* ignore */ }
  }

  /* Pick the right half of an { en, ar } pair. Plain strings pass through. */
  function t(pair) {
    if (pair === null || pair === undefined) return '';
    if (typeof pair === 'string' || typeof pair === 'number') return String(pair);
    return pair[current] !== undefined ? pair[current] : (pair.en || '');
  }

  /* Walk a subtree and swap every translated string in it. */
  function apply(root) {
    var scope = root || document;
    var suffix = current === 'ar' ? 'ar' : 'en';

    var selector = '[data-en], [data-en-label], [data-en-placeholder], [data-en-title]';
    var nodes = [];
    /* An element passed in is translated too, not just its descendants. */
    if (scope.nodeType === 1 && scope.matches && scope.matches(selector)) nodes.push(scope);
    var found = scope.querySelectorAll(selector);
    for (var n = 0; n < found.length; n++) nodes.push(found[n]);

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var text = el.getAttribute('data-' + suffix);
      if (text !== null) el.textContent = text;

      var label = el.getAttribute('data-' + suffix + '-label');
      if (label !== null) el.setAttribute('aria-label', label);

      var ph = el.getAttribute('data-' + suffix + '-placeholder');
      if (ph !== null) el.setAttribute('placeholder', ph);

      var title = el.getAttribute('data-' + suffix + '-title');
      if (title !== null) el.setAttribute('title', title);
    }

    /* Page title, when the page supplies both. */
    var titles = document.body ? document.body.getAttribute('data-title-' + suffix) : null;
    if (titles) document.title = titles;
  }

  /* Mirror the document and reload every string. */
  function set(lang, silent) {
    current = lang === 'ar' ? 'ar' : 'en';
    var html = document.documentElement;
    html.setAttribute('lang', current);
    html.setAttribute('dir', current === 'ar' ? 'rtl' : 'ltr');
    html.classList.toggle('lang-ar', current === 'ar');
    write(current);
    apply();
    if (!silent) {
      document.dispatchEvent(new CustomEvent('bloom:lang', { detail: { lang: current } }));
    }
  }

  function toggle() { set(current === 'ar' ? 'en' : 'ar'); }

  /* Restore the stored choice as early as possible, before first paint. */
  function init() {
    var stored = read();
    current = stored === 'ar' ? 'ar' : 'en';
    var html = document.documentElement;
    html.setAttribute('lang', current);
    html.setAttribute('dir', current === 'ar' ? 'rtl' : 'ltr');
    html.classList.toggle('lang-ar', current === 'ar');
  }

  init();

  return {
    t: t,
    apply: apply,
    set: set,
    toggle: toggle,
    get lang() { return current; },
    isArabic: function () { return current === 'ar'; }
  };
})();

/* Shorthand used by the render functions. */
function t(pair) { return I18N.t(pair); }
