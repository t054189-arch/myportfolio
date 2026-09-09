/* ==========================================================================
   Bloom — flavour rings
   ==========================================================================
   Each bean's tasting notes orbit its bag on a tilted ring. It answers the
   only question a customer actually has — what does it taste like? — before
   they read a word of description.

   Pure CSS 3D: a stage holds a tilted plane, the plane holds a spinning
   ring, the ring holds one node per note. This module only builds the
   markup and hands the angles and delays to CSS; every frame after that is
   the compositor's work, not JavaScript's.

   Three details carry the whole effect, and all three are easy to get
   wrong:

     1. The .bb wrapper cancels the node's own placement angle, and the
        .face unspin cancels the ring's rotation. Without both, the notes
        turn edge-on and become unreadable.
     2. Every animation shares one duration and linear timing, and each
        node's delay is negative — -(i / n) x 22s — so its fade lines up
        with where it actually is in the orbit. Node and face take the
        same delay.
     3. The ring is tilted, not flat, so notes pass above and below the bag
        instead of colliding with it.
   ========================================================================== */

var Rings = (function () {

  var DURATION = 22;   /* seconds — must match --ring-spin in the CSS */

  /* Build one ring. `size` is 'full' for listings and product pages, or
     'half' for the mega-dropdown. */
  function ringHTML(product, size) {
    if (!product || !product.flavour || !product.flavour.length) return '';

    var notes = product.flavour;
    var n = notes.length;
    var nodes = '';

    for (var i = 0; i < n; i++) {
      var theta = (360 / n) * i;
      var delay = (-(i / n) * DURATION).toFixed(2) + 's';
      var label = t(notes[i]);

      nodes +=
        '<span class="node" style="transform: rotateY(' + theta + 'deg) translateZ(var(--ring-r))">' +
          /* cancels this node's own placement angle */
          '<span class="bb" style="transform: rotateY(-' + theta + 'deg)">' +
            /* cancels the ring's rotation, so the text always faces front */
            /* Two animations, two delays, and the split matters.
               unspin must cancel the ring exactly, so it runs with no
               delay: give it the node's negative delay and every chip ends
               up permanently yawed by its own placement angle, which is
               how notes end up edge-on. The fade takes the negative delay
               instead, so it still lines up with where this node is in
               the orbit. */
            '<span class="face" style="animation-delay: 0s, ' + delay + '">' + esc(label) + '</span>' +
          '</span>' +
        '</span>';
    }

    return '' +
      '<div class="ringstage ' + (size === 'half' ? 'ringstage-half' : '') + '">' +
        '<div class="ringcore">' +
          '<img src="' + esc(product.image) + '" alt="" aria-hidden="true">' +
        '</div>' +
        '<div class="ringtilt">' +
          '<div class="ringspin">' + nodes + '</div>' +
        '</div>' +
        '<span class="ringbase" aria-hidden="true"></span>' +
        /* The notes are decorative motion, but the information is not, so
           it is also present as plain text for a screen reader. */
        '<span class="visually-hidden">' + esc(t(WORDS.tasting)) + ': ' +
          esc(notes.map(function (note) { return t(note); }).join(', ')) + '</span>' +
      '</div>';
  }

  /* One observer for every ring on the page: a ring nobody can see stops
     turning. Motion needs a subject, and an off-screen ring has no
     audience — this is also the cheapest frame budget on the page. */
  var idleObserver = null;

  function watch(stage) {
    if (!('IntersectionObserver' in window)) return;
    if (!idleObserver) {
      idleObserver = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          entries[i].target.classList.toggle('is-idle', !entries[i].isIntersecting);
        }
      }, { threshold: 0.05 });
    }
    stage.classList.add('is-idle');   /* until the observer says otherwise */
    idleObserver.observe(stage);
  }

  /* Render into every placeholder that names a product. */
  function mount(root) {
    var hosts = (root || document).querySelectorAll('[data-ring]');
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      var product = productById(host.getAttribute('data-ring'));
      if (!product) continue;
      host.innerHTML = ringHTML(product, host.getAttribute('data-ring-size') || 'full');
      var stage = host.querySelector('.ringstage');
      if (stage) watch(stage);
    }
  }

  return { html: ringHTML, mount: mount, duration: DURATION };
})();
