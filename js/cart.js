/* ==========================================================================
   Bloom — cart state
   Lives in localStorage under one key so the bag count survives navigation.
   Every mutation fires 'bloom:cart' and the header badge listens for it.
   ========================================================================== */

var Cart = (function () {

  var KEY = 'bloom.cart';
  var lines = [];   /* [{ id, qty }] */

  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || Object.prototype.toString.call(parsed) !== '[object Array]') return [];
      var clean = [];
      for (var i = 0; i < parsed.length; i++) {
        var line = parsed[i];
        if (!line || typeof line.id !== 'string') continue;
        if (!productById(line.id)) continue;              /* drop stale ids */
        var qty = parseInt(line.qty, 10);
        if (!qty || qty < 1) qty = 1;
        clean.push({ id: line.id, qty: Math.min(qty, 99) });
      }
      return clean;
    } catch (e) {
      return [];
    }
  }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('bloom:cart', { detail: { count: count() } }));
  }

  function find(id) {
    for (var i = 0; i < lines.length; i++) { if (lines[i].id === id) return lines[i]; }
    return null;
  }

  function add(id, qty) {
    var product = productById(id);
    if (!product) return;
    var n = parseInt(qty, 10) || 1;
    var line = find(id);
    if (line) line.qty = Math.min(line.qty + n, 99);
    else lines.push({ id: id, qty: Math.min(n, 99) });
    save();
  }

  function setQty(id, qty) {
    var n = parseInt(qty, 10);
    var line = find(id);
    if (!line) return;
    if (!n || n < 1) { remove(id); return; }
    line.qty = Math.min(n, 99);
    save();
  }

  function remove(id) {
    var next = [];
    for (var i = 0; i < lines.length; i++) { if (lines[i].id !== id) next.push(lines[i]); }
    lines = next;
    save();
  }

  function clear() { lines = []; save(); }

  function items() {
    /* Hydrated lines: the product record plus its quantity and line total. */
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var product = productById(lines[i].id);
      if (!product) continue;
      out.push({ product: product, qty: lines[i].qty, total: product.price * lines[i].qty });
    }
    return out;
  }

  function count() {
    var n = 0;
    for (var i = 0; i < lines.length; i++) n += lines[i].qty;
    return n;
  }

  function subtotal() {
    var sum = 0;
    var list = items();
    for (var i = 0; i < list.length; i++) sum += list[i].total;
    return sum;
  }

  lines = load();

  return {
    add: add, setQty: setQty, remove: remove, clear: clear,
    items: items, count: count, subtotal: subtotal
  };
})();
