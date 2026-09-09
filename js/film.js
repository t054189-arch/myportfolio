/* ==========================================================================
   Bloom — the opening film
   ==========================================================================
   Six and a half seconds after sign-in, no sound, one job: say the name
   over a field of turning beans and hand the visitor to the shop.

   THE ONE THING TO GET RIGHT. Each bean is two elements, not one. The outer
   .fpos carries its static placement — a random angle, depth and offset —
   and the inner .fbean carries the animation. Put both on one element and
   the keyframe's transform overwrites the placement, and all 22 beans pile
   up dead centre. That is the single most likely way to break this.

   Rules this file keeps:
     - a Skip button, always, focused the moment the film starts, plus Escape
     - once per session: a sessionStorage flag, set when it ends or is
       skipped, and never replayed in that session
     - under prefers-reduced-motion it does not play at all
     - nothing important lives only here; everything it says is on the home
       page too
   ========================================================================== */

var Film = (function () {

  var FLAG = 'bloom.film';        /* seen it this session */
  var PENDING = 'bloom.film.next'; /* the login hands the film forward */
  var BEANS = 22;
  var TOTAL = 6400;      /* ms before the overlay starts fading */
  var FADE = 680;        /* ms of that fade */

  function seen() {
    try { return window.sessionStorage.getItem(FLAG) === '1'; } catch (e) { return false; }
  }
  function markSeen() {
    try { window.sessionStorage.setItem(FLAG, '1'); } catch (e) { /* private mode */ }
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* The login page sets this on its way out, so the film plays exactly
     once — right after signing in — and not on some later navigation. */
  function setPending() {
    try { window.sessionStorage.setItem(PENDING, '1'); } catch (e) { /* ignore */ }
  }
  function takePending() {
    var pending = false;
    try {
      pending = window.sessionStorage.getItem(PENDING) === '1';
      window.sessionStorage.removeItem(PENDING);
    } catch (e) { pending = false; }
    return pending;
  }

  /* Should the film run at all? */
  function shouldPlay() {
    return !seen() && !reducedMotion();
  }

  function beansHTML() {
    var out = '';
    for (var i = 0; i < BEANS; i++) {
      /* Static placement on the wrapper: angle around the room, depth into
         it, and an offset so the field is not a perfect ring. */
      var angle = Math.random() * 360;
      var depth = 90 + Math.random() * 300;                 /* 90–390px */
      var lift = (Math.random() - 0.5) * 380;               /* +/-190px  */
      var slide = -320 + Math.random() * 420;               /* -320–+100 */
      var delay = 300 + i * 55;                             /* staggered */

      out +=
        '<span class="fpos" style="transform: rotateY(' + angle.toFixed(1) + 'deg)' +
          ' translateZ(' + depth.toFixed(0) + 'px)' +
          ' translateY(' + lift.toFixed(0) + 'px)' +
          ' translateX(' + slide.toFixed(0) + 'px)">' +
          '<span class="fbean" style="animation-delay: ' + delay + 'ms"></span>' +
        '</span>';
    }
    return out;
  }

  function overlayHTML() {
    return '' +
    '<div class="film" id="film" role="dialog" aria-modal="true" aria-label="Bloom">' +
      '<button type="button" class="film-skip" id="film-skip"' +
        ' data-en="Skip" data-ar="تخطٍّ">Skip</button>' +
      '<div class="film-inner" id="film-inner">' +
        '<div class="film-field" aria-hidden="true">' +
          '<div class="film-group" id="film-group">' + beansHTML() + '</div>' +
        '</div>' +
        '<div class="film-mark">' +
          '<span class="film-word" id="film-word">' +
            '<span class="fl" style="animation-delay: 1000ms">B</span>' +
            '<span class="fl" style="animation-delay: 1130ms">l</span>' +
            '<span class="fl fl-o" style="animation-delay: 1260ms">o</span>' +
            '<span class="fl fl-o" style="animation-delay: 1390ms">o</span>' +
            '<span class="fl" style="animation-delay: 1520ms">m</span>' +
          '</span>' +
          '<span class="film-rule" id="film-rule" aria-hidden="true"></span>' +
          '<span class="film-tag" id="film-tag"' +
            ' data-en="Filter &amp; espresso · Kuwait" data-ar="تقطير وإسبريسو · الكويت"></span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* Remove the animation classes, force a reflow, then add them back —
     otherwise a replay shows the end state with nothing moving. */
  function restart(node) {
    node.classList.remove('is-running');
    void node.offsetWidth;
    node.classList.add('is-running');
  }

  function play(onDone) {
    var finish = function () {
      markSeen();
      if (typeof onDone === 'function') onDone();
    };

    if (!shouldPlay()) { finish(); return null; }

    document.body.insertAdjacentHTML('afterbegin', overlayHTML());
    var film = document.getElementById('film');
    var skip = document.getElementById('film-skip');
    var previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (window.I18N) I18N.apply(film);

    var exitTimer = 0;
    var removeTimer = 0;
    var done = false;

    function end() {
      if (done) return;
      done = true;
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (film.parentNode) film.parentNode.removeChild(film);
      finish();
    }

    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); end(); }
    }

    skip.addEventListener('click', end);
    document.addEventListener('keydown', onKey);

    /* Nobody should be trapped in an animation they have seen before, so
       the skip button takes focus the moment the film starts. */
    restart(film);
    skip.focus();

    exitTimer = window.setTimeout(function () { film.classList.add('is-leaving'); }, TOTAL);
    removeTimer = window.setTimeout(end, TOTAL + FADE);

    return { end: end };
  }

  return {
    play: play, shouldPlay: shouldPlay, seen: seen, markSeen: markSeen,
    setPending: setPending, takePending: takePending, beans: BEANS
  };
})();
