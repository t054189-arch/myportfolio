/* ------------------------------------------------------------------
   js/db.js — the catalogue, live from Supabase.

   WHAT THIS CHANGES, AND WHAT IT DELIBERATELY DOES NOT.

   PRODUCTS in js/data.js is still shipped, still complete, and still
   what the first paint is built from. Nothing here blocks a render and
   nothing here is awaited: the site opens from a file:// URL with no
   network at all and behaves exactly as it did before. What this file
   adds is a second pass — it asks the database for the current prices
   and stock, and if the answer arrives it patches the objects already
   in memory and tells the page to refresh the few numbers that moved.

   So data.js is the baseline the shop always has, and Postgres is the
   thing that can be edited without touching JavaScript. A price change
   is now a row update in the Supabase dashboard, live on the next load.

   ABOUT THE KEY BELOW. It is public on purpose — a publishable key is
   meant to sit in front-end source, and there is no way to hide one in
   a static site anyway. It is not what keeps the database safe. That
   job belongs to row-level security, which is declared in
   supabase/migrations/: the catalogue is readable by everybody and
   writable by nobody holding this key. Anyone can read the shop
   window; nobody can reprice it from the browser.
   ------------------------------------------------------------------ */

var DB = (function () {
  'use strict';

  var URL = 'https://amejrcyvjbaepglimnal.supabase.co';
  var KEY = 'sb_publishable_Fnoec4qtrKX045pvCmSgrw_fh-ACiLp';

  /* If the network is slow, the shop does not wait for it. The built-in
     catalogue is already on screen; a late answer is worth nothing. */
  var TIMEOUT = 4000;

  function configured() {
    return !!(URL && KEY && window.fetch && URL.indexOf('supabase.co') > 0);
  }

  /* PostgREST, spoken directly. No client library, so the promise this
     project made about its dependencies stays true: Three.js remains the
     only third-party code in the repository. */
  function get(path) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : 0;

    return fetch(URL + '/rest/v1/' + path, {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, Accept: 'application/json' },
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('rest ' + res.status);
      return res.json();
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  /* Field-by-field, and only for fields the row actually carries.

     Replacing a whole product object with one built from a row would
     mean that any column that came back null — a schema drift, a half
     -finished edit in the dashboard — would blank out copy that
     data.js had perfectly good text for. Patching leaves the baseline
     showing through wherever the database has nothing to say. */
  function patch(product, row, flavours) {
    var moved = false;

    function pair(key, en, ar) {
      if (row[en] == null || row[ar] == null) return;
      if (product[key] && product[key].en === row[en] && product[key].ar === row[ar]) return;
      product[key] = { en: row[en], ar: row[ar] };
      moved = true;
    }

    function plain(key, value) {
      if (value == null || product[key] === value) return;
      product[key] = value;
      moved = true;
    }

    if (row.price_fils != null) plain('price', row.price_fils / 1000);
    plain('stock', row.stock);

    pair('name', 'name_en', 'name_ar');
    pair('origin', 'origin_en', 'origin_ar');
    pair('notes', 'notes_en', 'notes_ar');
    pair('unit', 'unit_en', 'unit_ar');
    if (row.desc_en != null && row.desc_ar != null) pair('desc', 'desc_en', 'desc_ar');

    if (row.tags && row.tags.length) product.tags = row.tags;
    if (row.specs && Object.keys(row.specs).length) product.specs = row.specs;
    if (row.recipe) product.recipe = row.recipe;
    if (row.bag_colour) product.bagColour = row.bag_colour;

    /* Only beans have a flavour ring, and only replace it if the
       database has a full set — a partial list would drop chips out of
       an orbit that is already on screen. */
    if (flavours && flavours.length && product.flavour) product.flavour = flavours;

    return moved;
  }

  /* Ask once per page load. Resolves to the number of products whose
     visible numbers changed, or 0 if the database was unreachable —
     unreachable is not an error here, it is Tuesday. */
  function sync() {
    if (!configured() || !window.PRODUCTS) return Promise.resolve(0);

    return Promise.all([
      get('products?select=*&order=sort_order'),
      get('product_flavours?select=product_id,note_key,position&order=product_id,position')
    ]).then(function (both) {
      var rows = both[0], notes = both[1], byId = {}, rings = {}, i;

      for (i = 0; i < PRODUCTS.length; i++) byId[PRODUCTS[i].id] = PRODUCTS[i];
      for (i = 0; i < notes.length; i++) {
        (rings[notes[i].product_id] || (rings[notes[i].product_id] = []))
          .push(notes[i].note_key);
      }

      var changed = 0;
      for (i = 0; i < rows.length; i++) {
        var product = byId[rows[i].id];
        /* A row with no matching entry in data.js is a product added in
           the dashboard. It is not rendered — the pages are built from
           the shipped array — but say so in the console rather than
           swallowing it, so the gap is findable. */
        if (!product) {
          if (window.console) console.info('[bloom] catalogue row not in data.js:', rows[i].id);
          continue;
        }
        if (patch(product, rows[i], rings[rows[i].id])) changed++;
      }

      if (changed) {
        document.dispatchEvent(new CustomEvent('bloom:catalogue', { detail: { changed: changed } }));
      }
      return changed;
    }, function (err) {
      /* Offline, blocked, or opened from a file with no network. The
         shop is already fully usable; this is information, not a fault. */
      if (window.console) console.info('[bloom] catalogue offline, using built-in data:', err.message);
      return 0;
    });
  }

  return { sync: sync, configured: configured, url: URL };
})();
