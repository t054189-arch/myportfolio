/* ==========================================================================
   Bloom — "How to make a V60"
   ==========================================================================
   An animated cross-section of a brew in progress beside the four recipe
   steps. It is the best argument that Bloom knows coffee, and it sells the
   kettle, the scale, the dripper and the papers without a sales line.

   ONE CLOCK DRIVES EVERYTHING. The kettle, the stream, the slurry, the bed,
   the bubbles, the drip, the server and the scale are all derived from the
   same simulated t — never animated independently. Independent animation is
   exactly what makes this kind of illustration look fake: the bed swells
   while the kettle is still upright, the server fills while nothing pours.
   Every visual is a pure function of t, so any scrub point is consistent by
   construction.

   t runs from -20 (prep) to 165 seconds at 7.5x real speed.
   ========================================================================== */

var Brew = (function () {

  var SPEED = 7.5;          /* simulated seconds per real second */
  var T_START = -20;        /* prep */
  var T_END = 165;

  /* --- the model: every quantity is a function of the one clock -------- */

  function poured(t) {
    if (t < 0) return 0;
    if (t < 30) return 30 * (t / 30);
    if (t < 90) return 30 + 120 * ((t - 30) / 60);
    if (t < 135) return 150 + 100 * ((t - 90) / 45);
    return 250;
  }

  function served(t) {
    if (t < 45) return 0;
    if (t < 135) return 165 * ((t - 45) / 90);
    if (t < 162) return 165 + 85 * ((t - 135) / 27);
    return 250;
  }

  function slurry(t) { return Math.max(0, poured(t) - served(t)); }

  function pouring(t) {
    return (t >= 0 && t < 28) || (t >= 33 && t < 88) || (t >= 93 && t < 133);
  }

  function phase(t) {
    if (t < 0) return 0;
    if (t < 30) return 1;
    if (t < 90) return 2;
    return 3;
  }

  /* The coffee bed swells through the first 14 seconds of the bloom and
     settles back by t = 40. */
  function bedRy(t) {
    if (t < 0) return 5;
    if (t < 14) return 5 + 6 * (t / 14);
    if (t < 40) return 11 - 5 * ((t - 14) / 26);
    return 6;
  }

  function clock(t) {
    if (t < 0) return { en: 'prep', ar: 'تحضير' };
    var s = Math.floor(t);
    return { en: Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2),
             ar: Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) };
  }

  var STEPS = [
    { key: 'prep', at: T_START, time: { en: 'prep', ar: 'تحضير' },
      title: { en: 'Rinse & dose', ar: 'اغسل وزِن' },
      body: { en: 'Rinse the paper through, tip in 15 g of medium-fine coffee, level the bed flat.',
              ar: 'اغسل الورقة بالماء، أضف 15 غم بنّاً وسطاً ناعماً، وسوِّ السطح.' } },
    { key: 'bloom', at: 0, time: { en: '0:00–0:30', ar: '0:00–0:30' },
      title: { en: 'The bloom', ar: 'التفتّح' },
      body: { en: 'Pour 30 g at 93 °C — twice the coffee’s weight. The bed swells and breathes out CO₂. Wait.',
              ar: 'اصبب 30 غم عند 93 °م — ضعف وزن البنّ. ينتفخ السطح ويطلق ثاني أكسيد الكربون. انتظر.' } },
    { key: 'pours', at: 30, time: { en: '0:30–1:30', ar: '0:30–1:30' },
      title: { en: 'First pours', ar: 'الصبّات الأولى' },
      body: { en: 'Spiral out and back to 150 g total, keeping the bed flat and the water off the paper.',
              ar: 'اصبب بلوالب للخارج والداخل حتى 150 غم، وابقِ السطح مستوياً والماء بعيداً عن الورقة.' } },
    { key: 'finish', at: 90, time: { en: '1:30–2:45', ar: '1:30–2:45' },
      title: { en: 'Finish & drawdown', ar: 'الإكمال والتصريف' },
      body: { en: 'Take it to 250 g, then let it draw down. Ratio 1:16.6 — the cup should be clear by 2:45.',
              ar: 'أكمل إلى 250 غم ثم اتركه يصرّف. النسبة 1:16.6 — ويصفو الفنجان عند 2:45.' } }
  ];

  /* --- the drawing ------------------------------------------------------
     One inline SVG on a 300x300 grid. Strokes in --ink-2 at 2px over a soft
     radial ground. Parts are named so the driver can address them.
     ---------------------------------------------------------------------- */

  function svgHTML() {
    return '' +
    '<svg class="brewsvg" viewBox="0 0 300 300" role="img" aria-labelledby="brew-svg-title">' +
      '<title id="brew-svg-title" data-en="A cross-section of a V60 brewing: kettle, dripper, coffee bed and server"' +
        ' data-ar="مقطع جانبي لتحضير V60: الغلاية والقمع وقاع البنّ والدورق"></title>' +
      '<defs>' +
        '<radialGradient id="brewground" cx="50%" cy="38%" r="62%">' +
          '<stop offset="0" class="g0"/><stop offset="1" class="g1"/>' +
        '</radialGradient>' +
        '<clipPath id="coneclip"><polygon points="78,86 222,86 166,186 134,186"/></clipPath>' +
        '<clipPath id="serverclip">' +
          '<path d="M96 202h108l-8 58a16 16 0 0 1-16 14h-60a16 16 0 0 1-16-14z"/>' +
        '</clipPath>' +
      '</defs>' +

      '<rect x="0" y="0" width="300" height="300" fill="url(#brewground)"/>' +

      /* kettle, rotating about its handle end */
      '<g id="brew-kettle" class="ln">' +
        '<path d="M30 60h56v26a14 14 0 0 1-14 14H44a14 14 0 0 1-14-14z"/>' +
        '<path d="M40 60V50h30v10"/>' +
        '<path d="M86 68c22-2 33-12 33-27"/>' +
        '<path d="M119 41c0-7-5-12-12-12"/>' +
      '</g>' +

      /* the stream, only while pouring */
      '<path id="brew-stream" class="ln stream" d="M120 47C132 66 143 76 150 84"/>' +

      /* dripper */
      '<g class="ln">' +
        '<ellipse cx="150" cy="86" rx="72" ry="11"/>' +
        '<polygon points="78,86 222,86 166,186 134,186"/>' +
      '</g>' +
      '<g class="rib">' +
        '<path d="M96 116h108"/>' +
        '<path d="M112 146h76"/>' +
      '</g>' +

      /* slurry: clipped to the cone, grows upward from y 184 */
      '<g clip-path="url(#coneclip)">' +
        '<rect id="brew-slurry" class="slurry" x="70" y="184" width="160" height="0"/>' +
      '</g>' +

      /* the coffee bed, swelling */
      '<ellipse id="brew-bed" class="bed" cx="150" cy="176" rx="26" ry="5"/>' +

      /* bloom bubbles */
      '<g id="brew-bubbles" class="bubbles">' +
        '<circle cx="138" cy="170" r="2.6"/>' +
        '<circle cx="150" cy="166" r="3.2"/>' +
        '<circle cx="161" cy="171" r="2.2"/>' +
        '<circle cx="145" cy="174" r="1.8"/>' +
        '<circle cx="157" cy="176" r="2"/>' +
      '</g>' +

      /* the drip */
      '<path id="brew-drip" class="ln drip" d="M150 188v12"/>' +

      /* server, with the brewed coffee clipped inside it */
      '<g clip-path="url(#serverclip)">' +
        '<rect id="brew-coffee" class="coffee" x="90" y="214" width="120" height="60"/>' +
      '</g>' +
      '<path class="ln" d="M96 202h108l-8 58a16 16 0 0 1-16 14h-60a16 16 0 0 1-16-14z"/>' +
      '<path class="ln" d="M92 202h116"/>' +

      /* scale */
      '<g class="ln">' +
        '<rect x="86" y="282" width="128" height="14" rx="3"/>' +
      '</g>' +
      '<rect id="brew-scalebar" class="scalebar" x="90" y="286" width="0" height="6" rx="3"/>' +
    '</svg>';
  }

  function unitHTML() {
    var steps = '';
    for (var i = 0; i < STEPS.length; i++) {
      var step = STEPS[i];
      steps +=
        '<button type="button" class="brewstep" data-step="' + i + '" aria-pressed="false">' +
          '<span class="brewstep-time">' + esc(t(step.time)) + '</span>' +
          '<span class="brewstep-title"' + bi(step.title) + '>' + esc(t(step.title)) + '</span>' +
          '<span class="brewstep-body"' + bi(step.body) + '>' + esc(t(step.body)) + '</span>' +
        '</button>';
    }

    var gear = {
      en: 'Named above: the <a href="product.html?id=gooseneck-kettle">kettle</a>, the ' +
          '<a href="product.html?id=digital-scale">scale</a>, the ' +
          '<a href="product.html?id=dripper-v60">dripper</a> and the ' +
          '<a href="product.html?id=filter-papers">papers</a>.',
      ar: 'المذكور أعلاه: <a href="product.html?id=gooseneck-kettle">الغلاية</a> و' +
          '<a href="product.html?id=digital-scale">الميزان</a> و' +
          '<a href="product.html?id=dripper-v60">القمع</a> و' +
          '<a href="product.html?id=filter-papers">الأوراق</a>.'
    };

    return '' +
    '<div class="brewunit">' +
      '<div class="brewfigure">' +
        svgHTML() +
        '<div class="brewreadout">' +
          '<div class="tile-read"><span class="eyebrow"' + bi(WORDS.time) + '></span>' +
            '<span class="value" id="brew-time">prep</span></div>' +
          '<div class="tile-read"><span class="eyebrow"' + bi(WORDS.water) + '></span>' +
            '<span class="value" id="brew-water">0 g</span></div>' +
          '<div class="tile-read"><span class="eyebrow"' + bi(WORDS.tempW) + '></span>' +
            '<span class="value" id="brew-temp">93 °C</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="brewside">' +
        '<div class="brewsteps">' + steps + '</div>' +
        '<div class="brewcontrols">' +
          '<button type="button" class="btn btn-primary" id="brew-toggle"' + bi(WORDS.brewIt) + '>' + esc(t(WORDS.brewIt)) + '</button>' +
          '<div class="brewprogress" aria-hidden="true"><span id="brew-bar"></span></div>' +
          '<span class="brewspeed mono"' + bi(WORDS.speed) + '></span>' +
        '</div>' +
        '<p class="note brewgear" data-en="' + esc(gear.en) + '" data-ar="' + esc(gear.ar) + '">' + gear.en + '</p>' +
      '</div>' +
    '</div>';
  }

  /* --- the driver ------------------------------------------------------- */

  function init(host) {
    if (!host) return null;
    host.innerHTML = unitHTML();

    var svg = host.querySelector('.brewsvg');
    var kettle = host.querySelector('#brew-kettle');
    var stream = host.querySelector('#brew-stream');
    var slurryRect = host.querySelector('#brew-slurry');
    var bed = host.querySelector('#brew-bed');
    var bubbles = host.querySelector('#brew-bubbles');
    var drip = host.querySelector('#brew-drip');
    var coffee = host.querySelector('#brew-coffee');
    var scalebar = host.querySelector('#brew-scalebar');
    var timeOut = host.querySelector('#brew-time');
    var waterOut = host.querySelector('#brew-water');
    var bar = host.querySelector('#brew-bar');
    var toggle = host.querySelector('#brew-toggle');
    var stepButtons = host.querySelectorAll('.brewstep');

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var t = T_START;
    var tilt = 0;             /* eased, so the kettle never snaps */
    var running = false;
    var frame = 0;
    var last = 0;

    /* Draw one frame from t alone. Nothing here reads a previous state
       except the eased tilt, so any scrub lands consistent. */
    function render() {
      var p = poured(t);
      var s = served(t);
      var inCone = slurry(t);
      var isPouring = pouring(t);

      /* kettle tilts only while pouring */
      var target = isPouring ? -15 : 0;
      tilt += (target - tilt) * (reduce ? 1 : 0.12);
      kettle.setAttribute('transform', 'rotate(' + tilt.toFixed(2) + ' 64 78)');

      /* the stream shows only while pouring, dashes marching to imply flow */
      stream.style.opacity = isPouring ? '1' : '0';
      stream.style.strokeDashoffset = (-(t * 26) % 18).toFixed(1);

      /* slurry sits in the cone, growing upward from y 184 */
      var h = (inCone / 90) * 84;
      h = Math.max(0, Math.min(h, 84));
      slurryRect.setAttribute('height', h.toFixed(1));
      slurryRect.setAttribute('y', (184 - h).toFixed(1));

      /* the bed swells, then settles */
      bed.setAttribute('ry', bedRy(t).toFixed(2));

      /* bubbles only while the bloom is actually breathing out */
      bubbles.style.opacity = (t >= 2 && t <= 34) ? '1' : '0';

      /* the first drip */
      drip.style.opacity = t >= 42 ? '1' : '0';

      /* the server fills with what has been served */
      var ch = (s / 250) * 60;
      coffee.setAttribute('height', ch.toFixed(1));
      coffee.setAttribute('y', (274 - ch).toFixed(1));

      /* the scale reads what has been poured */
      scalebar.setAttribute('width', ((p / 250) * 120).toFixed(1));

      /* readouts — tabular, so they cannot jitter */
      timeOut.textContent = t < 0 ? I18N.t(WORDS.prep) : clock(t).en;
      waterOut.textContent = Math.round(p) + ' ' + I18N.t(WORDS.grams);
      bar.style.width = (((t - T_START) / (T_END - T_START)) * 100).toFixed(1) + '%';

      var current = phase(t);
      for (var i = 0; i < stepButtons.length; i++) {
        var on = i === current;
        stepButtons[i].classList.toggle('is-active', on);
        stepButtons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }

    function step(now) {
      frame = window.requestAnimationFrame(step);
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
      last = now;
      t += dt * SPEED;
      if (t >= T_END) {
        t = T_END;
        render();
        stop(true);
        return;
      }
      render();
    }

    function start() {
      if (running || reduce) return;
      if (t >= T_END) t = T_START;
      running = true;
      last = 0;
      frame = window.requestAnimationFrame(step);
      setToggle(WORDS.pause);
    }

    function stop(finished) {
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      setToggle(finished ? WORDS.brewAgain : WORDS.resume);
    }

    function setToggle(words) {
      toggle.setAttribute('data-en', words.en);
      toggle.setAttribute('data-ar', words.ar);
      I18N.apply(toggle);
    }

    /* Clicking a step scrubs the clock to its start. */
    function scrubTo(index) {
      t = STEPS[index].at;
      tilt = pouring(t) ? -15 : 0;   /* land settled, not mid-ease */
      render();
    }

    toggle.addEventListener('click', function () {
      if (reduce) return;
      if (running) stop(false); else start();
    });

    for (var i = 0; i < stepButtons.length; i++) {
      (function (index) {
        stepButtons[index].addEventListener('click', function () { scrubTo(index); });
      })(i);
    }

    /* Pause when it scrolls out of view: no work for a brew nobody watches. */
    var io = null;
    if ('IntersectionObserver' in window && !reduce) {
      io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting && running) stop(false);
      }, { threshold: 0.15 });
      io.observe(host);
    }

    render();
    if (reduce) {
      /* No loop at all: the step buttons switch between the four phase
         end-states, with the same numbers in the readouts. */
      setToggle(WORDS.brewIt);
      toggle.disabled = true;
      scrubTo(1);
    }

    return { render: render, scrubTo: scrubTo, at: function () { return t; },
             /* scrub to an arbitrary time, for testing and for deep links */
             scrubTo2: function (time) { t = time; tilt = pouring(t) ? -15 : 0; render(); },
             model: { poured: poured, served: served, slurry: slurry, phase: phase, bedRy: bedRy, pouring: pouring } };
  }

  return { init: init, steps: STEPS, model: { poured: poured, served: served, slurry: slurry, phase: phase, bedRy: bedRy, pouring: pouring } };
})();
