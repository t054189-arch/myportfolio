/* ==========================================================================
   Bloom — the gahwa log, the page
   ==========================================================================
   The whole brief for this screen is one sentence: someone should be able
   to log a coffee in about fifteen seconds while they are still sitting at
   the table. Everything here follows from that.

   The fastest path is three taps — a bean, a place, Save — because the
   rating doubles as the way in, places are chips rather than a dropdown,
   and every other field already has a sensible answer. Nothing but the
   rating is required; an entry with three beans and nothing else is a real
   memory and the schema accepts it.

   It is also somebody's diary, so: nothing is written to browser storage,
   no photo gets a durable URL, and there is no share button — which is a
   thing someone would have to decide to add, not something half-present.
   ========================================================================== */

var GahwaPage = (function () {
  'use strict';

  /* In memory only, for as long as the tab is open. */
  var data = null;
  var filter = { mode: 'all', value: null };
  var sheet = null;
  var lastFocus = null;

  /* Dates run on Kuwait's clock, the same one the streak counts on, so a
     cup at 1am does not sit under yesterday in one place and today in
     another. Latin digits in both languages, like every other number on
     the site. */
  function fmt(iso, opts) {
    var o = { timeZone: 'Asia/Kuwait' }, k;
    for (k in opts) o[k] = opts[k];
    try {
      return new Intl.DateTimeFormat(
        I18N.isArabic() ? 'ar-KW-u-nu-latn' : 'en-GB', o).format(new Date(iso));
    } catch (e) {
      return new Date(iso).toISOString().slice(0, 10);
    }
  }
  function dayLabel(iso)   { return fmt(iso, { day: '2-digit', month: 'short' }); }
  function timeLabel(iso)  { return fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false }); }
  function monthLabel(iso) { return fmt(iso, { month: 'long', year: 'numeric' }); }
  function monthKey(iso)   { return fmt(iso, { month: '2-digit', year: 'numeric' }); }

  /* --- the bean rating -------------------------------------------------- */

  function beanSVG() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + GLYPHS.bean + '</svg>';
  }

  function beansOf(rating) {
    if (!rating) return '';
    var out = '<span class="beans beans-static" role="img" aria-label="' +
              esc(tf(WORDS.beansOf, { n: rating })) + '">', i;
    for (i = 1; i <= 5; i++) {
      out += '<span class="bean' + (i <= rating ? ' is-on' : '') + '">' + beanSVG() + '</span>';
    }
    return out + '</span>';
  }

  /* The interactive row, and the front door: tapping one of these when no
     sheet is open starts an entry with that rating already set. */
  function beanPicker(id, value) {
    var out = '<span class="beans beans-pick" id="' + id + '" role="radiogroup"' +
              biLabel(WORDS.qGood) + '>', i;
    for (i = 1; i <= 5; i++) {
      out += '<button type="button" class="bean' + (i <= value ? ' is-on' : '') +
             '" role="radio" aria-checked="' + (i === value ? 'true' : 'false') +
             '" data-bean="' + i + '" aria-label="' + esc(tf(WORDS.beansOf, { n: i })) + '">' +
             beanSVG() + '</button>';
    }
    return out + '</span>';
  }

  function paintBeans(host, value) {
    var buttons = host.querySelectorAll('[data-bean]'), i, n;
    for (i = 0; i < buttons.length; i++) {
      n = Number(buttons[i].getAttribute('data-bean'));
      buttons[i].classList.toggle('is-on', n <= value);
      buttons[i].setAttribute('aria-checked', n === value ? 'true' : 'false');
    }
  }

  /* --- the strip of numbers --------------------------------------------- */

  function tile(labelPair, value, sub) {
    return '<div class="gstat">' +
             '<span class="gstat-n">' + value + '</span>' +
             (sub ? '<span class="gstat-sub">' + sub + '</span>' : '') +
             '<span class="gstat-l"' + bi(labelPair) + '>' + esc(t(labelPair)) + '</span>' +
           '</div>';
  }

  function statStripHTML() {
    var s = data && data.summary, k = data && data.streak;
    var dash = '<span class="gstat-none">&mdash;</span>';
    var streak = k && k.current_streak ? k.current_streak : 0;
    return '<div class="gstats">' +
      tile(WORDS.cupsMonth, s && s.cups_30d ? s.cups_30d : dash) +
      tile(WORDS.streakNow, streak ? streak : dash,
           streak ? esc(plural('days', streak)) : '') +
      tile(WORDS.avgBeans, s && s.avg_rating ? s.avg_rating : dash) +
      tile(WORDS.topPlaceLbl,
           s && s.top_place ? '<span class="gstat-word">' + esc(s.top_place) + '</span>' : dash) +
    '</div>';
  }

  /* --- one entry, as a receipt ------------------------------------------ */

  function placeNameOf(entry) {
    if (entry.place) return entry.place.name;
    if (entry.place_note) return entry.place_note;
    return null;
  }

  function entryHTML(entry, example) {
    var place = placeNameOf(entry);
    var people = (entry.company || []).map(function (person) {
      return '<span class="chip-person">' + esc(person) + '</span>';
    }).join('');

    return '<article class="cup' + (example ? ' cup-example' : '') + '"' +
             (example ? '' : ' data-entry="' + esc(entry.id) + '"') + '>' +
      '<div class="cup-when">' +
        '<span class="cup-day">' + esc(dayLabel(entry.had_at)) + '</span>' +
        '<span class="cup-time">' + esc(timeLabel(entry.had_at)) + '</span>' +
      '</div>' +
      '<div class="cup-body">' +
        (example ? '<span class="cup-tag"' + bi(WORDS.exampleTag) + '>' + esc(t(WORDS.exampleTag)) + '</span>' : '') +
        '<h3 class="cup-place">' + esc(place || '') +
          /* A quiet visual mark only. Hidden from assistive tech because
             the place name beside it already says Bloom, and reading
             "Bloom, Salmiya Bloom" helps nobody. */
          (entry.place && entry.place.kind === 'bloom_cafe'
            ? '<span class="cup-bloom" aria-hidden="true">Bl<em>oo</em>m</span>' : '') +
        '</h3>' +
        (people ? '<div class="cup-people">' + people + '</div>' : '') +
        '<div class="cup-meta">' +
          '<span class="cup-drink">' + esc(drinkLabel(entry.drink)) + '</span>' +
          (entry.dose_g ? '<span class="cup-dose">' + ltr(entry.dose_g + ' g') + '</span>' : '') +
          beansOf(entry.rating) +
        '</div>' +
        (entry.note ? '<p class="cup-note">' + esc(entry.note) + '</p>' : '') +
        (entry.photo_path ? '<img class="cup-photo" alt="" data-photo="' + esc(entry.photo_path) + '">' : '') +
      '</div>' +
      (example ? '' :
        '<button type="button" class="cup-x" data-remove="' + esc(entry.id) + '"' +
          biLabel(WORDS.removeCup) + '>' + icon('close') + '</button>') +
    '</article>';
  }

  /* One made-up entry, so the empty page shows the shape of the thing. It
     is built here rather than seeded in the database for a reason: a fake
     row in the table would land in the customer's own averages, streak and
     most-visited place on day one. This cannot, because it never exists
     anywhere but on screen, and it says so on its face. */
  function exampleEntry() {
    return {
      id: 'example',
      had_at: new Date(Date.now() - 3600e3).toISOString(),
      place: { name: 'Bloom, Salmiya', kind: 'bloom_cafe', area: 'Salmiya' },
      company: [I18N.isArabic() ? 'يوسف' : 'Yousef'],
      company_kind: 'friends',
      rating: 4,
      drink: 'V60',
      note: t(WORDS.exampleNote)
    };
  }

  /* --- the timeline ------------------------------------------------------ */

  function visibleEntries() {
    var rows = (data && data.entries) || [], now;
    if (filter.mode === 'month') {
      now = new Date();
      rows = rows.filter(function (r) {
        var d = new Date(r.had_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (filter.mode === 'five') {
      rows = rows.filter(function (r) { return r.rating === 5; });
    } else if (filter.mode === 'place' && filter.value) {
      rows = rows.filter(function (r) { return placeNameOf(r) === filter.value; });
    } else if (filter.mode === 'person' && filter.value) {
      rows = rows.filter(function (r) { return (r.company || []).indexOf(filter.value) > -1; });
    }
    return rows;
  }

  function timelineHTML() {
    var rows = visibleEntries(), out = '', currentMonth = null;
    if (!rows.length) {
      return '<p class="gahwa-none"' + bi(WORDS.logEmpty) + '>' + esc(t(WORDS.logEmpty)) + '</p>';
    }
    rows.forEach(function (entry) {
      var key = monthKey(entry.had_at);
      if (key !== currentMonth) {
        if (currentMonth !== null) out += '</div>';
        currentMonth = key;
        out += '<h2 class="cup-month">' + esc(monthLabel(entry.had_at)) + '</h2><div class="cup-group">';
      }
      out += entryHTML(entry);
    });
    return out + (currentMonth === null ? '' : '</div>');
  }

  /* Filtering fades, and the list's height is pinned across the swap so
     the page never shifts under someone's thumb while they are reading it.
     The pin is released once the new content has been laid out. */
  function repaintTimeline() {
    var host = el('gahwa-timeline'), out;
    if (!host) return;
    out = ms('--t-base');
    host.style.minHeight = host.offsetHeight + 'px';
    host.classList.add('is-swapping');
    window.setTimeout(function () {
      host.innerHTML = timelineHTML();
      I18N.apply(host);
      loadPhotos(host);
      host.classList.remove('is-swapping');
      window.setTimeout(function () { host.style.minHeight = ''; }, out);
    }, out);
  }

  /* --- the two panels ---------------------------------------------------- */

  function panel(titlePair, body, cls) {
    return '<section class="gpanel ' + (cls || '') + '">' +
             '<h2' + bi(titlePair) + '>' + esc(t(titlePair)) + '</h2>' + body +
           '</section>';
  }

  function placesPanelHTML() {
    var rows = ((data && data.places) || []).slice(0, 5), body;
    if (!rows.length) {
      return panel(WORDS.yourPlaces, '<p class="panel-none"' + bi(WORDS.placesEmpty) + '>' +
                   esc(t(WORDS.placesEmpty)) + '</p>');
    }
    body = '<ul class="plist">';
    rows.forEach(function (r) {
      body += '<li class="pitem">' +
        '<div class="pitem-main">' +
          '<span class="pitem-name">' + esc(r.place_name) +
            (r.kind === 'bloom_cafe' ? '<span class="cup-bloom" aria-hidden="true">Bl<em>oo</em>m</span>' : '') +
          '</span>' +
          '<span class="pitem-sub">' +
            (r.kind ? esc(placeKindLabel(r.kind)) : '') +
            (r.area ? ' &middot; ' + esc(r.area) : '') +
          '</span>' +
        '</div>' +
        '<div class="pitem-n">' +
          '<span class="pnum">' + r.visits + '</span>' +
          '<span class="punit">' + esc(plural('visits', r.visits)) + '</span>' +
        '</div>' +
        '<div class="pitem-r">' + (r.avg_rating ? beansOf(Math.round(r.avg_rating)) : '') +
          '<span class="pitem-last">' + esc(dayLabel(r.last_visit)) + '</span>' +
        '</div>' +
      '</li>';
    });
    return panel(WORDS.yourPlaces, body + '</ul>');
  }

  function peoplePanelHTML() {
    var rows = ((data && data.people) || []).slice(0, 6), body;
    if (!rows.length) {
      return panel(WORDS.yourPeople, '<p class="panel-none"' + bi(WORDS.peopleEmpty) + '>' +
                   esc(t(WORDS.peopleEmpty)) + '</p>', 'panel-people');
    }
    body = '<ul class="people">';
    rows.forEach(function (r) {
      body += '<li class="person">' +
        '<span class="person-name">' + esc(r.person) + '</span>' +
        /* The word is chosen by the count, so it carries no data-en/ar
           pair; the whole panel is re-rendered when the language
           changes, which is where the switch is handled. */
        '<span class="person-cups"><b>' + r.cups + '</b> ' +
          '<span>' + esc(plural('cups', r.cups)) + '</span></span>' +
        '<span class="person-rate">' + (r.avg_rating ? beansOf(Math.round(r.avg_rating)) : '') + '</span>' +
        '<span class="person-last">' + esc(dayLabel(r.last_time)) + '</span>' +
      '</li>';
    });
    return panel(WORDS.yourPeople, body + '</ul>', 'panel-people');
  }

  /* --- filters ----------------------------------------------------------- */

  function filtersHTML() {
    var chips = [['all', WORDS.fAll], ['month', WORDS.fMonth], ['five', WORDS.fFive]];
    var out = '<div class="gfilters">';
    chips.forEach(function (c) {
      out += '<button type="button" class="filter' + (filter.mode === c[0] ? ' is-on' : '') +
             '" data-filter="' + c[0] + '" aria-pressed="' + (filter.mode === c[0]) + '"' +
             bi(c[1]) + '>' + esc(t(c[1])) + '</button>';
    });

    var places = (data && data.places) || [];
    if (places.length > 1) {
      out += '<label class="filter filter-select' + (filter.mode === 'place' ? ' is-on' : '') + '">' +
             '<span' + bi(WORDS.fPlace) + '>' + esc(t(WORDS.fPlace)) + '</span>' +
             '<select id="filter-place"><option value="">' + esc(t(WORDS.fAll)) + '</option>';
      places.forEach(function (p) {
        out += '<option value="' + esc(p.place_name) + '"' +
               (filter.mode === 'place' && filter.value === p.place_name ? ' selected' : '') +
               '>' + esc(p.place_name) + '</option>';
      });
      out += '</select></label>';
    }

    var people = (data && data.people) || [];
    if (people.length) {
      out += '<label class="filter filter-select' + (filter.mode === 'person' ? ' is-on' : '') + '">' +
             '<span' + bi(WORDS.fPerson) + '>' + esc(t(WORDS.fPerson)) + '</span>' +
             '<select id="filter-person"><option value="">' + esc(t(WORDS.fAll)) + '</option>';
      people.forEach(function (p) {
        out += '<option value="' + esc(p.person) + '"' +
               (filter.mode === 'person' && filter.value === p.person ? ' selected' : '') +
               '>' + esc(p.person) + '</option>';
      });
      out += '</select></label>';
    }
    return out + '</div>';
  }

  function syncFilterChips() {
    var host = el('gahwa-root'), chips, selects, i, j, id, on;
    chips = host.querySelectorAll('[data-filter]');
    for (i = 0; i < chips.length; i++) {
      on = chips[i].getAttribute('data-filter') === filter.mode;
      chips[i].classList.toggle('is-on', on);
      chips[i].setAttribute('aria-pressed', on);
    }
    selects = host.querySelectorAll('.filter-select');
    for (j = 0; j < selects.length; j++) {
      id = selects[j].querySelector('select').id;
      selects[j].classList.toggle('is-on',
        (id === 'filter-place' && filter.mode === 'place') ||
        (id === 'filter-person' && filter.mode === 'person'));
    }
    if (filter.mode !== 'place' && el('filter-place')) el('filter-place').value = '';
    if (filter.mode !== 'person' && el('filter-person')) el('filter-person').value = '';
  }

  /* --- the whole page ---------------------------------------------------- */

  function render() {
    var root = el('gahwa-root'), empty;
    if (!root) return;
    empty = !data || !data.entries.length;

    root.innerHTML =
      statStripHTML() +
      /* On an empty page this is the only thing to do, so it is bigger
         there. Once there is a log to read, it steps back down and lets
         the entries have the page. */
      '<div class="gquick' + (empty ? ' gquick-big' : '') + '">' +
        '<span class="gquick-q"' + bi(WORDS.qGood) + '>' + esc(t(WORDS.qGood)) + '</span>' +
        beanPicker('quick-beans', 0) +
        '<button type="button" class="btn btn-primary" id="log-open"' + bi(WORDS.logCup) + '>' +
          esc(t(WORDS.logCup)) + '</button>' +
      '</div>' +
      (empty
        ? '<div class="gahwa-empty">' +
            '<p class="gahwa-none"' + bi(WORDS.logEmpty) + '>' + esc(t(WORDS.logEmpty)) + '</p>' +
            entryHTML(exampleEntry(), true) +
          '</div>'
        : '<div class="gahwa-main">' +
            '<div class="gahwa-list">' + filtersHTML() +
              '<div id="gahwa-timeline">' + timelineHTML() + '</div>' +
            '</div>' +
            '<div class="gahwa-side">' + peoplePanelHTML() + placesPanelHTML() + '</div>' +
          '</div>');

    I18N.apply(root);
    loadPhotos(root);
    initTilt(root);
  }

  /* Each photo needs a signed URL minted for this view. They expire, which
     is the point: there is nothing durable to forward. */
  function loadPhotos(scope) {
    var imgs = scope.querySelectorAll('[data-photo]'), i;
    for (i = 0; i < imgs.length; i++) {
      (function (img) {
        Gahwa.photoUrl(img.getAttribute('data-photo')).then(function (url) {
          if (url) img.src = url; else img.remove();
        }, function () { img.remove(); });
      })(imgs[i]);
    }
  }

  /* ====================================================================== */
  /*  The sheet                                                              */
  /* ====================================================================== */

  function placeChip(id, name, on) {
    return '<button type="button" class="chip' + (on ? ' is-on' : '') +
           '" data-place="' + esc(id) + '" aria-pressed="' + !!on + '">' + esc(name) + '</button>';
  }

  function kindOptions() {
    var out = '', key;
    for (key in PLACE_KINDS) {
      out += '<option value="' + key + '"' + (key === 'other_cafe' ? ' selected' : '') + '>' +
             esc(placeKindLabel(key)) + '</option>';
    }
    return out;
  }

  /* datetime-local wants the wall clock, not an ISO instant. */
  function localNow() {
    var d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  }

  function sheetHTML(pre) {
    var saved  = (data && data.saved) || [];
    var recent = (data && data.places) || [];
    var people = (data && data.people) || [];
    var usual  = (data && data.summary && data.summary.usual_drink) || 'V60';
    var chips = '', seen = {}, home = null, drinks = '', kinds = '', faces = '', beans = '', key;

    /* Bloom's branches pinned first, then Home, then the places they
       actually use, most-visited first. All one tap. */
    saved.forEach(function (p) {
      if (p.kind !== 'bloom_cafe') return;
      seen[p.name] = 1;
      chips += placeChip(p.id, p.name, pre.placeId === p.id);
    });
    saved.forEach(function (p) { if (p.kind === 'home' && !home) home = p; });
    if (home) {
      seen[home.name] = 1;
      chips += placeChip(home.id, home.name, pre.placeId === home.id);
    } else {
      chips += '<button type="button" class="chip" data-newhome="1"' +
               bi(PLACE_KINDS.home) + '>' + esc(placeKindLabel('home')) + '</button>';
    }
    recent.forEach(function (r) {
      var match = null;
      if (seen[r.place_name]) return;
      saved.forEach(function (p) { if (p.name === r.place_name) match = p; });
      if (!match) return;
      seen[r.place_name] = 1;
      chips += placeChip(match.id, match.name, pre.placeId === match.id);
    });

    DRINKS.forEach(function (d) {
      var on = (pre.drink || usual) === d.id;
      drinks += '<button type="button" class="chip' + (on ? ' is-on' : '') +
                '" data-drink="' + esc(d.id) + '" aria-pressed="' + on + '">' +
                esc(I18N.isArabic() ? d.ar : d.id) + '</button>';
    });

    for (key in COMPANY_KINDS) {
      var onKind = (pre.companyKind || 'alone') === key;
      kinds += '<button type="button" class="chip' + (onKind ? ' is-on' : '') +
               '" data-ckind="' + key + '" aria-pressed="' + onKind + '">' +
               esc(companyKindLabel(key)) + '</button>';
    }

    people.slice(0, 8).forEach(function (p) {
      faces += '<button type="button" class="chip" data-person="' + esc(p.person) + '">' +
               esc(p.person) + '</button>';
    });

    PRODUCTS.forEach(function (p) {
      if (p.category !== 'beans') return;
      beans += '<option value="' + esc(p.id) + '"' + (pre.productId === p.id ? ' selected' : '') +
               '>' + esc(t(p.name)) + '</option>';
    });

    return '' +
    '<div class="sheet-scrim" id="sheet-scrim"></div>' +
    '<form class="sheet" id="log-sheet" role="dialog" aria-modal="true"' +
          ' aria-labelledby="sheet-title" novalidate>' +
      '<header class="sheet-top">' +
        '<h2 id="sheet-title"' + bi(WORDS.logCup) + '>' + esc(t(WORDS.logCup)) + '</h2>' +
        '<button type="button" class="icon-btn" id="sheet-close"' + biLabel(WORDS.closeSheet) + '>' +
          icon('close') + '</button>' +
      '</header>' +

      '<div class="sheet-body">' +
        '<fieldset class="ask">' +
          '<legend' + bi(WORDS.qGood) + '>' + esc(t(WORDS.qGood)) + '</legend>' +
          beanPicker('sheet-beans', pre.rating || 0) +
          '<p class="ask-hint"' + bi(WORDS.onlyRating) + '>' + esc(t(WORDS.onlyRating)) + '</p>' +
        '</fieldset>' +

        '<fieldset class="ask">' +
          '<legend' + bi(WORDS.qWhere) + '>' + esc(t(WORDS.qWhere)) + '</legend>' +
          '<div class="chips" id="place-chips">' + chips + '</div>' +
          '<input type="text" id="place-new" autocomplete="off"' +
            ' data-en-placeholder="' + esc(WORDS.newPlace.en) + '"' +
            ' data-ar-placeholder="' + esc(WORDS.newPlace.ar) + '">' +
          '<label class="ask-kind" id="place-kind-wrap" hidden>' +
            '<span' + bi(WORDS.placeKindQ) + '>' + esc(t(WORDS.placeKindQ)) + '</span>' +
            '<select id="place-kind">' + kindOptions() + '</select>' +
          '</label>' +
        '</fieldset>' +

        '<fieldset class="ask">' +
          '<legend' + bi(WORDS.qWho) + '>' + esc(t(WORDS.qWho)) + '</legend>' +
          '<div class="chips" id="ckind-chips">' + kinds + '</div>' +
          (faces ? '<div class="chips chips-people" id="person-chips">' + faces + '</div>' : '') +
          '<div class="picked" id="picked-people"></div>' +
          '<input type="text" id="person-new" autocomplete="off"' +
            ' data-en-placeholder="' + esc(WORDS.addPerson.en) + '"' +
            ' data-ar-placeholder="' + esc(WORDS.addPerson.ar) + '">' +
          '<p class="ask-hint"' + bi(WORDS.nicknameOk) + '>' + esc(t(WORDS.nicknameOk)) + '</p>' +
        '</fieldset>' +

        '<fieldset class="ask">' +
          '<legend' + bi(WORDS.qWhat) + '>' + esc(t(WORDS.qWhat)) + '</legend>' +
          '<div class="chips" id="drink-chips">' + drinks + '</div>' +
          '<label class="ask-kind">' +
            '<span' + bi(WORDS.bloomBeanQ) + '>' + esc(t(WORDS.bloomBeanQ)) + '</span>' +
            '<select id="bean-pick"><option value="">' + esc(t(WORDS.noBean)) + '</option>' +
              beans + '</select>' +
          '</label>' +
          '<label class="ask-kind" id="dose-wrap"' + (pre.productId ? '' : ' hidden') + '>' +
            '<span' + bi(WORDS.doseLbl) + '>' + esc(t(WORDS.doseLbl)) + '</span>' +
            '<span class="dose-in"><input type="number" id="dose" min="1" max="200" step="0.5"' +
              ' inputmode="decimal" value="' + (pre.doseG || '') + '"><i>g</i></span>' +
          '</label>' +
        '</fieldset>' +

        '<details class="ask ask-more">' +
          '<summary' + bi(WORDS.noteLbl) + '>' + esc(t(WORDS.noteLbl)) + '</summary>' +
          '<textarea id="cup-note" rows="2"></textarea>' +
          '<label class="ask-kind">' +
            '<span' + bi(WORDS.photoLbl) + '>' + esc(t(WORDS.photoLbl)) + '</span>' +
            '<input type="file" id="cup-photo" accept="image/*">' +
          '</label>' +
          '<label class="ask-kind">' +
            '<span' + bi(WORDS.whenLbl) + '>' + esc(t(WORDS.whenLbl)) + '</span>' +
            '<input type="datetime-local" id="cup-when" value="' + esc(localNow()) + '">' +
          '</label>' +
        '</details>' +

        '<p class="form-msg" id="sheet-msg" hidden role="alert"></p>' +
      '</div>' +

      '<footer class="sheet-foot">' +
        '<button type="submit" class="btn btn-primary btn-block" id="sheet-save"' +
          bi(WORDS.saveCup) + '>' + esc(t(WORDS.saveCup)) + '</button>' +
      '</footer>' +
    '</form>';
  }

  function openSheet(pre) {
    var host;
    if (!Gahwa.ready()) return;
    pre = pre || {};
    closeSheet();
    lastFocus = document.activeElement;

    host = document.createElement('div');
    host.className = 'sheet-host';
    host.id = 'sheet-host';
    host.innerHTML = sheetHTML(pre);
    document.body.appendChild(host);
    I18N.apply(host);
    document.body.classList.add('sheet-open');

    sheet = {
      rating: pre.rating || 0,
      placeId: pre.placeId || null,
      newHome: false,
      company: (pre.company || []).slice(),
      companyKind: pre.companyKind || 'alone',
      drink: pre.drink || (data && data.summary && data.summary.usual_drink) || 'V60',
      productId: pre.productId || null
    };
    if (sheet.productId) el('bean-pick').value = sheet.productId;

    wireSheet(host);
    paintPicked();

    /* Focus lands on the beans: it is the first question and often the
       only one anyone answers. */
    window.setTimeout(function () {
      var first = host.querySelector('#sheet-beans [data-bean="' + (sheet.rating || 4) + '"]');
      if (first) first.focus();
    }, 20);
  }

  function closeSheet() {
    var host = el('sheet-host');
    if (host) host.remove();
    document.body.classList.remove('sheet-open');
    sheet = null;
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); lastFocus = null; }
  }

  function paintPicked() {
    var host = el('picked-people');
    if (!host) return;
    host.innerHTML = sheet.company.map(function (person) {
      return '<button type="button" class="chip-person chip-drop" data-drop="' + esc(person) + '">' +
             esc(person) + icon('close') + '</button>';
    }).join('');
  }

  /* Light up whichever control in a group carries `value`. Passing null
     means none of them — used when typing a new place name has to clear
     whatever chip was chosen. */
  function pressGroup(host, attr, value) {
    var all = host.querySelectorAll('[' + attr + ']'), i, on;
    for (i = 0; i < all.length; i++) {
      on = value !== null && value !== undefined &&
           all[i].getAttribute(attr) === String(value);
      all[i].classList.toggle('is-on', on);
      all[i].setAttribute('aria-pressed', on);
    }
  }

  function addPerson(name) {
    var who = String(name || '').trim();
    if (!who || sheet.company.indexOf(who) > -1) return;
    sheet.company.push(who);
    /* The company kind follows the company: adding a name while "Alone" is
       selected plainly means they were not alone. Any other choice they
       made themselves is left as it is. */
    if (sheet.companyKind === 'alone') {
      sheet.companyKind = 'friends';
      if (el('ckind-chips')) pressGroup(el('ckind-chips'), 'data-ckind', 'friends');
    }
    paintPicked();
  }

  function wireSheet(host) {
    el('sheet-scrim').addEventListener('click', closeSheet);
    el('sheet-close').addEventListener('click', closeSheet);

    host.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); closeSheet(); }
      if (event.key === 'Tab') trapFocus(event, el('log-sheet'));
    });

    host.addEventListener('click', function (event) {
      var hit = function (sel) { return event.target.closest ? event.target.closest(sel) : null; };
      var b, p, home, d, c, person, drop, already;

      if ((b = hit('#sheet-beans [data-bean]'))) {
        sheet.rating = Number(b.getAttribute('data-bean'));
        paintBeans(el('sheet-beans'), sheet.rating);
      } else if ((p = hit('[data-place]'))) {
        already = sheet.placeId === p.getAttribute('data-place');
        sheet.placeId = already ? null : p.getAttribute('data-place');
        sheet.newHome = false;
        el('place-new').value = '';
        el('place-kind-wrap').hidden = true;
        pressGroup(el('place-chips'), 'data-place', already ? null : sheet.placeId);
      } else if ((home = hit('[data-newhome]'))) {
        sheet.newHome = !sheet.newHome;
        sheet.placeId = null;
        pressGroup(el('place-chips'), 'data-place', null);
        home.classList.toggle('is-on', sheet.newHome);
      } else if ((d = hit('[data-drink]'))) {
        sheet.drink = d.getAttribute('data-drink');
        pressGroup(el('drink-chips'), 'data-drink', sheet.drink);
      } else if ((c = hit('[data-ckind]'))) {
        sheet.companyKind = c.getAttribute('data-ckind');
        if (sheet.companyKind === 'alone') { sheet.company = []; paintPicked(); }
        pressGroup(el('ckind-chips'), 'data-ckind', sheet.companyKind);
      } else if ((person = hit('[data-person]'))) {
        addPerson(person.getAttribute('data-person'));
      } else if ((drop = hit('[data-drop]'))) {
        var name = drop.getAttribute('data-drop');
        sheet.company = sheet.company.filter(function (x) { return x !== name; });
        paintPicked();
      }
    });

    /* Typing a place name means a new place, so clear any chosen chip. */
    el('place-new').addEventListener('input', function () {
      var typed = this.value.trim(), h;
      el('place-kind-wrap').hidden = !typed;
      if (!typed) return;
      sheet.placeId = null;
      sheet.newHome = false;
      pressGroup(el('place-chips'), 'data-place', null);
      h = el('place-chips').querySelector('[data-newhome]');
      if (h) h.classList.remove('is-on');
    });

    /* Enter adds a person rather than submitting: the field takes several
       names, and submitting on the first one loses the rest. */
    el('person-new').addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ',') return;
      event.preventDefault();
      addPerson(this.value);
      this.value = '';
    });
    el('person-new').addEventListener('blur', function () {
      if (this.value.trim()) { addPerson(this.value); this.value = ''; }
    });

    el('bean-pick').addEventListener('change', function () {
      sheet.productId = this.value || null;
      el('dose-wrap').hidden = !sheet.productId;
    });

    el('log-sheet').addEventListener('submit', save);
  }

  function trapFocus(event, box) {
    var able = box.querySelectorAll('button, input, select, textarea, summary, [href]');
    var list = [], i, first, last;
    for (i = 0; i < able.length; i++) if (able[i].offsetParent !== null) list.push(able[i]);
    if (!list.length) return;
    first = list[0];
    last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function sheetMessage(pair) {
    var msg = el('sheet-msg');
    msg.setAttribute('data-en', pair.en);
    msg.setAttribute('data-ar', pair.ar);
    msg.hidden = false;
    I18N.apply(msg);
  }

  function save(event) {
    event.preventDefault();
    var button = el('sheet-save'), pending, typedPlace, whenValue, file, entry, place;
    if (button.getAttribute('aria-busy') === 'true') return;
    button.setAttribute('aria-busy', 'true');
    button.setAttribute('data-en', WORDS.savingCup.en);
    button.setAttribute('data-ar', WORDS.savingCup.ar);
    I18N.apply(button);

    /* A name still sitting in the field counts. Nobody should lose the
       person they were with because they did not press Enter. */
    pending = el('person-new').value.trim();
    if (pending) { addPerson(pending); el('person-new').value = ''; }

    typedPlace = el('place-new').value.trim();
    whenValue = el('cup-when').value;
    file = el('cup-photo').files[0];

    entry = {
      rating: sheet.rating || null,
      drink: sheet.drink,
      company: sheet.company,
      companyKind: sheet.companyKind,
      note: el('cup-note').value.trim() || null,
      productId: sheet.productId,
      doseG: sheet.productId && el('dose').value ? Number(el('dose').value) : null,
      hadAt: whenValue ? new Date(whenValue).toISOString() : null
    };

    /* Order matters: make the place, then upload the photo, then write the
       row, so a saved row never points at a place or a file that failed. */
    place = Promise.resolve(null);
    if (typedPlace) place = Gahwa.addPlace(typedPlace, el('place-kind').value);
    else if (sheet.newHome) place = Gahwa.addPlace(PLACE_KINDS.home.en, 'home');

    place.then(function (made) {
      if (made) entry.placeId = made.id;
      else if (sheet.placeId) entry.placeId = sheet.placeId;
      return file ? Gahwa.uploadPhoto(file) : null;
    }).then(function (photoPath) {
      if (photoPath) entry.photoPath = photoPath;
      return Gahwa.addEntry(entry);
    }).then(function () {
      closeSheet();
      return reload();
    })['catch'](function (err) {
      button.removeAttribute('aria-busy');
      button.setAttribute('data-en', WORDS.saveCup.en);
      button.setAttribute('data-ar', WORDS.saveCup.ar);
      I18N.apply(button);
      sheetMessage({ en: 'Could not save that: ' + err.message,
                     ar: 'تعذّر الحفظ: ' + err.message });
    });
  }

  /* Deleting is immediate and permanent, so it is confirmed in place —
     never with a browser confirm(), and never with an undo, which would
     mean keeping the row after saying it was gone. */
  function confirmRemove(id) {
    var card = document.querySelector('[data-entry="' + id + '"]'), entry = null, box;
    if (!card || card.querySelector('.cup-confirm')) return;
    (data.entries || []).forEach(function (e) { if (e.id === id) entry = e; });

    box = document.createElement('div');
    box.className = 'cup-confirm';
    box.innerHTML =
      '<p' + bi(WORDS.reallyOne) + '>' + esc(t(WORDS.reallyOne)) + '</p>' +
      '<button type="button" class="btn btn-secondary" data-keep="1"' + bi(WORDS.keepIt) + '>' +
        esc(t(WORDS.keepIt)) + '</button>' +
      '<button type="button" class="btn btn-danger" data-yes="1"' + bi(WORDS.yesDelete) + '>' +
        esc(t(WORDS.yesDelete)) + '</button>';
    card.appendChild(box);
    I18N.apply(box);
    box.querySelector('[data-yes]').focus();

    box.addEventListener('click', function (event) {
      if (event.target.closest('[data-keep]')) { box.remove(); return; }
      if (!event.target.closest('[data-yes]')) return;
      box.innerHTML = '<p>' + esc(t(WORDS.savingCup)) + '</p>';
      Gahwa.deleteEntry(id, entry && entry.photo_path).then(reload, function () {
        box.innerHTML = '<p>' + esc(t(WORDS.loadFailed)) + '</p>';
      });
    });
  }

  /* ====================================================================== */
  /*  Loading and wiring                                                     */
  /* ====================================================================== */

  function reload() {
    return Gahwa.load().then(function (fresh) {
      data = fresh;
      render();
      document.dispatchEvent(new CustomEvent('bloom:gahwa'));
    });
  }

  function findPlaceId(nameOrKind) {
    var saved = (data && data.saved) || [], found = null;
    saved.forEach(function (p) {
      if (found) return;
      if (p.id === nameOrKind || p.name === nameOrKind ||
          (nameOrKind === 'bloom' && p.kind === 'bloom_cafe')) found = p.id;
    });
    return found;
  }

  function init() {
    var root = el('gahwa-root');
    if (!root) return;

    /* A guest has no private place to keep a diary, so say that plainly
       and point at the door, rather than showing an empty page that can
       never fill. */
    if (!Gahwa.ready()) {
      root.innerHTML = '<div class="gahwa-empty">' +
        '<p class="gahwa-none"' + bi(WORDS.logSignedOut) + '>' + esc(t(WORDS.logSignedOut)) + '</p>' +
        '<a class="btn btn-primary" href="login.html"' + bi(WORDS.goSignIn) + '>' +
          esc(t(WORDS.goSignIn)) + '</a></div>';
      I18N.apply(root);
      return;
    }

    root.innerHTML = '<div class="gahwa-loading" aria-live="polite"></div>';

    reload().then(function () {
      var q = new URLSearchParams(window.location.search);
      if (q.get('log') === null) return;
      openSheet({
        placeId: q.get('place') ? findPlaceId(q.get('place')) : null,
        drink: q.get('drink') || null,
        productId: q.get('bean') || null
      });
    }, function () {
      root.innerHTML = '<p class="gahwa-none"' + bi(WORDS.loadFailed) + '>' +
                       esc(t(WORDS.loadFailed)) + '</p>';
      I18N.apply(root);
    });

    /* One listener for everything the timeline and filters raise, so a
       re-render never leaves a dead handler behind. */
    root.addEventListener('click', function (event) {
      var hit = function (sel) { return event.target.closest ? event.target.closest(sel) : null; };
      var bean, f, rm;
      if ((bean = hit('#quick-beans [data-bean]'))) {
        openSheet({ rating: Number(bean.getAttribute('data-bean')) });
      } else if (hit('#log-open')) {
        openSheet({});
      } else if ((f = hit('[data-filter]'))) {
        filter = { mode: f.getAttribute('data-filter'), value: null };
        syncFilterChips();
        repaintTimeline();
      } else if ((rm = hit('[data-remove]'))) {
        confirmRemove(rm.getAttribute('data-remove'));
      }
    });

    root.addEventListener('change', function (event) {
      if (event.target.id === 'filter-place') {
        filter = event.target.value ? { mode: 'place', value: event.target.value }
                                    : { mode: 'all', value: null };
        syncFilterChips();
        repaintTimeline();
      } else if (event.target.id === 'filter-person') {
        filter = event.target.value ? { mode: 'person', value: event.target.value }
                                    : { mode: 'all', value: null };
        syncFilterChips();
        repaintTimeline();
      }
    });

    document.addEventListener('bloom:lang', function () { if (data) render(); });
  }

  return {
    init: init,
    open: openSheet,
    reload: reload,
    statStripHTML: statStripHTML,
    /* The account page shows the same four numbers, so it borrows the
       renderer by handing over the rows it already fetched. */
    setData: function (rows) { data = rows; },
    hasData: function () { return !!data; }
  };
})();
