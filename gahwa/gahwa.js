/* ==========================================================================
   gahwa — a coffee check-in module
   ==========================================================================
   A self-contained check-in log that any coffee shop's website can embed.
   It carries its own styles, its own strings, its own auth and its own
   database migrations, and it references nothing from whatever site is
   hosting it.

   THE TEST APPLIED TO EVERY LINE IN THIS FOLDER: if the host site were
   deleted tomorrow, would this still run? If the answer is no, the
   coupling is in the wrong place.

   A host talks to this through exactly two doors:

       gahwa.configure({ url, key, theme, lang, getToken })
       gahwa.checkIn({ venue, rating, drink, ... })      -> Promise
       gahwa.myCheckIns({ itemRef, venue, since })       -> Promise

   ...or, from another origin entirely, through gahwa/embed.js. There is
   no third way in, and nothing here reads a global belonging to a host.

   PRIVACY, CARRIED WITH THE MODULE RATHER THAN LEFT BEHIND:
     - a check-in log is a diary. There is one policy on the table and it
       is the owner's own; no staff read, no admin screen, and none may
       be added;
     - a cafe that embeds the widget learns that check-ins happened at
       their venue and nothing else. Not who, not how often, not where
       else. That is enforced in the postMessage payload and in the
       counts-only function behind the board, not in the interface;
     - the browser is never asked where it is. A venue is a name in a
       shared directory; the map colours governorates the directory
       already knows about;
     - nothing personal is written to browser storage beyond the session
       token itself, and the log is held in memory only;
     - delete means delete: rows and photos, immediately, no tombstone.
   ========================================================================== */

var gahwa = (function () {
  'use strict';

  var VERSION = '1.0.0';

  /* Its own connection details, not a host's config file. Override with
     gahwa.configure() when self-hosting against another project. */
  var cfg = {
    url: 'https://amejrcyvjbaepglimnal.supabase.co',
    key: 'sb_publishable_Fnoec4qtrKX045pvCmSgrw_fh-ACiLp',
    theme: 'warm',
    lang: 'en',
    getToken: null        /* a host may lend its own token; see configure */
  };

  var SESSION_KEY = 'gahwa.session';
  var TIMEOUT = 12000;

  /* ---------------------------------------------------------------- */
  /*  Words                                                            */
  /* ---------------------------------------------------------------- */

  var STR = {
    en: {
      checkIn: 'Check in', checkingIn: 'Checking in…', checkedIn: 'Checked in',
      here: 'Here now', close: 'Close', cancel: 'Cancel', save: 'Save',
      signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out',
      email: 'Email', password: 'Password', yourName: 'Your name',
      needAccount: 'No account yet?', haveAccount: 'Already have one?',
      wasItGood: 'Was it any good?', whatDrink: 'What did you drink?',
      whoWith: 'Who with?', aNote: 'A note, if you want one',
      counterCode: 'Counter code', counterHint:
        'The short code on the counter. It marks your check-in as verified so it counts on this venue’s board. Skip it and the cup still goes in your own log.',
      verified: 'Verified', unverified: 'In your log only',
      board: 'Regulars board', checkins: 'Check-ins', regulars: 'Regulars',
      today: 'Today', lastDays: 'Last 7 days', noneYet: 'No verified check-ins this week yet.',
      myLog: 'My log', cups: 'Cups', venues: 'Venues', streak: 'Streak',
      verifiedCups: 'Verified', days: 'days', day: 'day',
      stickers: 'Stickers', map: 'Where you drink', mapNote:
        'Coloured from the governorate each venue says it is in. Your location is never used.',
      timeline: 'Every cup', empty: 'Nothing here yet. Check in at a cafe and it appears.',
      exportLog: 'Download my log', deleteAll: 'Delete everything',
      deleteWarn: 'Every check-in and every photo, removed now and not recoverable.',
      deleted: 'Deleted.', nothingToDelete: 'There was nothing to delete.',
      remove: 'Delete', really: 'Delete it?', keep: 'Keep it',
      venueUnknown: 'Somewhere else', addVenue: 'Add this place',
      searchVenues: 'Search cafes', pickVenue: 'Where are you?',
      alone: 'Alone', poweredBy: 'gahwa check-in',
      offline: 'Cannot reach the server. Try again in a moment.',
      badCredentials: 'That email and password do not match an account.',
      needEmail: 'Enter your email.', needPassword: 'Enter a password.',
      shortPassword: 'Eight characters or more.', exists: 'There is already an account with that email.',
      confirmEmail: 'Account created. Confirm your email, then sign in.',
      codeWrong: 'That code did not match. The cup is in your log, but not on the board.',
      printCard: 'Print the counter card', scanToCheckIn: 'Scan to check in',
      cardLine: 'Point your camera here, then enter the code at the counter.',
      demoNote: 'Sample entries, for demonstration.'
    },
    ar: {
      checkIn: 'سجّل حضورك', checkingIn: 'جارٍ التسجيل…', checkedIn: 'تم التسجيل',
      here: 'هنا الآن', close: 'إغلاق', cancel: 'إلغاء', save: 'حفظ',
      signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب', signOut: 'تسجيل الخروج',
      email: 'البريد الإلكتروني', password: 'كلمة المرور', yourName: 'اسمك',
      needAccount: 'ليس لديك حساب؟', haveAccount: 'لديك حساب؟',
      wasItGood: 'هل كانت جيدة؟', whatDrink: 'ماذا شربت؟',
      whoWith: 'مع من؟', aNote: 'ملاحظة، إن أردت',
      counterCode: 'رمز الكاشير', counterHint:
        'الرمز القصير المعروض على الكاشير. يجعل تسجيلك موثّقاً فيُحتسب في لوحة المكان. تجاوزه وسيبقى الفنجان في سجلك الخاص.',
      verified: 'موثّق', unverified: 'في سجلك فقط',
      board: 'لوحة الروّاد', checkins: 'تسجيلات', regulars: 'روّاد',
      today: 'اليوم', lastDays: 'آخر ٧ أيام', noneYet: 'لا تسجيلات موثّقة هذا الأسبوع بعد.',
      myLog: 'سجلي', cups: 'فناجين', venues: 'أماكن', streak: 'السلسلة',
      verifiedCups: 'موثّقة', days: 'أيام', day: 'يوم',
      stickers: 'الأوسمة', map: 'أين تشرب', mapNote:
        'تُلوَّن حسب المحافظة التي يذكرها كل مكان. لا يُستخدم موقعك أبداً.',
      timeline: 'كل فنجان', empty: 'لا شيء هنا بعد. سجّل حضورك في مقهى وسيظهر.',
      exportLog: 'تنزيل سجلي', deleteAll: 'احذف كل شيء',
      deleteWarn: 'كل تسجيل وكل صورة، تُحذف الآن ولا يمكن استرجاعها.',
      deleted: 'تم الحذف.', nothingToDelete: 'لم يكن هناك ما يُحذف.',
      remove: 'حذف', really: 'حذفه؟', keep: 'إبقاؤه',
      venueUnknown: 'مكان آخر', addVenue: 'أضف هذا المكان',
      searchVenues: 'ابحث عن مقهى', pickVenue: 'أين أنت؟',
      alone: 'بمفردي', poweredBy: 'تسجيل حضور gahwa',
      offline: 'تعذّر الوصول إلى الخادم. حاول بعد قليل.',
      badCredentials: 'البريد وكلمة المرور لا يطابقان أي حساب.',
      needEmail: 'أدخل بريدك الإلكتروني.', needPassword: 'أدخل كلمة المرور.',
      shortPassword: 'ثمانية أحرف أو أكثر.', exists: 'يوجد حساب بهذا البريد بالفعل.',
      confirmEmail: 'تم إنشاء الحساب. أكّد بريدك ثم سجّل الدخول.',
      codeWrong: 'الرمز غير مطابق. الفنجان في سجلك، لكنه ليس على اللوحة.',
      printCard: 'اطبع بطاقة الكاشير', scanToCheckIn: 'امسح للتسجيل',
      cardLine: 'وجّه الكاميرا هنا، ثم أدخل الرمز عند الكاشير.',
      demoNote: 'تسجيلات نموذجية، للعرض.'
    }
  };

  function t(key) { return (STR[cfg.lang] || STR.en)[key] || STR.en[key] || key; }
  function isAr() { return cfg.lang === 'ar'; }

  var DRINKS = [
    { id: 'V60', ar: 'تقطير V60' }, { id: 'Espresso', ar: 'إسبريسو' },
    { id: 'Cortado', ar: 'كورتادو' }, { id: 'Arabic coffee', ar: 'قهوة عربية' },
    { id: 'Turkish', ar: 'قهوة تركية' }, { id: 'Batch brew', ar: 'قهوة الدفعة' },
    { id: 'Latte', ar: 'لاتيه' }
  ];
  function drinkLabel(id) {
    for (var i = 0; i < DRINKS.length; i++) if (DRINKS[i].id === id) return isAr() ? DRINKS[i].ar : id;
    return id || '';
  }

  var GOVS = ['Capital', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra', 'Mubarak Al-Kabeer'];
  var GOV_AR = {
    'Capital': 'العاصمة', 'Hawalli': 'حولي', 'Farwaniya': 'الفروانية',
    'Ahmadi': 'الأحمدي', 'Jahra': 'الجهراء', 'Mubarak Al-Kabeer': 'مبارك الكبير'
  };
  function govLabel(g) { return isAr() ? (GOV_AR[g] || g) : g; }

  /* ---------------------------------------------------------------- */
  /*  Small helpers                                                    */
  /* ---------------------------------------------------------------- */

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function now() { return Math.floor(Date.now() / 1000); }
  function el(id) { return document.getElementById(id); }

  function fmt(iso, opts) {
    var o = { timeZone: 'Asia/Kuwait' }, k;
    for (k in opts) o[k] = opts[k];
    try {
      return new Intl.DateTimeFormat(isAr() ? 'ar-KW-u-nu-latn' : 'en-GB', o).format(new Date(iso));
    } catch (e) { return String(iso).slice(0, 10); }
  }
  var dayLabel   = function (iso) { return fmt(iso, { day: '2-digit', month: 'short' }); };
  var timeLabel  = function (iso) { return fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false }); };
  var monthLabel = function (iso) { return fmt(iso, { month: 'long', year: 'numeric' }); };

  function plural(n, one, many) { return n === 1 ? one : many; }

  /* ---------------------------------------------------------------- */
  /*  Session — the module's own, on the module's own origin           */
  /* ---------------------------------------------------------------- */

  function loadSession() {
    try {
      var raw = window.localStorage.getItem(SESSION_KEY);
      var s = raw ? JSON.parse(raw) : null;
      return s && s.token ? s : null;
    } catch (e) { return null; }
  }
  function saveSession(s) {
    try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function dropSession() {
    try { window.localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function authPost(path, body, token) {
    var headers = { 'Content-Type': 'application/json', apikey: cfg.key };
    if (token) headers.Authorization = 'Bearer ' + token;
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : 0;
    return fetch(cfg.url + '/auth/v1/' + path, {
      method: 'POST', headers: headers, body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.json().then(function (d) { return { ok: res.ok, status: res.status, data: d || {} }; },
                             function () { return { ok: res.ok, status: res.status, data: {} }; });
    }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  function adopt(payload) {
    var user = payload.user || {};
    var meta = user.user_metadata || {};
    var s = {
      token: payload.access_token,
      refresh: payload.refresh_token,
      expires: now() + (payload.expires_in || 3600),
      id: user.id,
      email: user.email,
      name: String(meta.display_name || '').trim() || String(user.email || '').split('@')[0]
    };
    saveSession(s);
    return s;
  }

  function reasonFor(r) {
    var d = r.data || {};
    var text = String(d.error_code || d.code || d.msg || d.message || '').toLowerCase();
    if (text.indexOf('invalid_credentials') > -1 || text.indexOf('invalid login') > -1) return 'badCredentials';
    if (text.indexOf('not confirmed') > -1 || text.indexOf('email_not_confirmed') > -1) return 'confirmEmail';
    if (text.indexOf('already') > -1 || text.indexOf('exists') > -1) return 'exists';
    if (text.indexOf('weak_password') > -1 || text.indexOf('password should be') > -1) return 'shortPassword';
    return 'offline';
  }

  function signIn(email, password) {
    var mail = String(email || '').trim().toLowerCase();
    if (!mail) return Promise.resolve({ ok: false, reason: 'needEmail' });
    if (!password) return Promise.resolve({ ok: false, reason: 'needPassword' });
    return authPost('token?grant_type=password', { email: mail, password: password })
      .then(function (r) {
        if (!r.ok || !r.data.access_token) return { ok: false, reason: reasonFor(r) };
        return { ok: true, session: adopt(r.data) };
      }, function () { return { ok: false, reason: 'offline' }; });
  }

  function signUp(name, email, password) {
    var mail = String(email || '').trim().toLowerCase();
    if (!mail) return Promise.resolve({ ok: false, reason: 'needEmail' });
    if (!password || password.length < 8) return Promise.resolve({ ok: false, reason: 'shortPassword' });
    return authPost('signup', {
      email: mail, password: password,
      data: { display_name: String(name || '').trim() || mail.split('@')[0] }
    }).then(function (r) {
      if (!r.ok) return { ok: false, reason: reasonFor(r) };
      var d = r.data, user = d.user || d;
      /* A repeat sign-up is answered with an empty identities array
         rather than an error, so the form cannot be used to discover
         who has an account. Read it as taken. */
      if (user && user.identities && user.identities.length === 0) return { ok: false, reason: 'exists' };
      if (d.access_token) return { ok: true, session: adopt(d) };
      return { ok: true, needsConfirm: true };
    }, function () { return { ok: false, reason: 'offline' }; });
  }

  function signOut() {
    var s = loadSession();
    dropSession();
    if (s && s.token) authPost('logout', {}, s.token)['catch'](function () {});
  }

  /* A usable access token. A host may lend its own through configure(),
     which is how a site that already signed the person in avoids asking
     twice — through the public door, not by reaching into storage. */
  function token() {
    if (typeof cfg.getToken === 'function') {
      try {
        var lent = cfg.getToken();
        if (lent && typeof lent.then === 'function') return lent;
        if (lent) return Promise.resolve(lent);
      } catch (e) { /* fall through to our own */ }
    }
    var s = loadSession();
    if (!s) return Promise.resolve(null);
    if (s.expires - 60 > now()) return Promise.resolve(s.token);
    if (!s.refresh) return Promise.resolve(null);
    return authPost('token?grant_type=refresh_token', { refresh_token: s.refresh })
      .then(function (r) {
        if (!r.ok || !r.data.access_token) { dropSession(); return null; }
        return adopt(r.data).token;
      }, function () { return s.token; });
  }

  function session() {
    var s = loadSession();
    return s ? { id: s.id, name: s.name, email: s.email } : null;
  }

  /* ---------------------------------------------------------------- */
  /*  Talking to the database                                          */
  /* ---------------------------------------------------------------- */

  function rest(path, opts) {
    opts = opts || {};
    return (opts.anon ? Promise.resolve(null) : token()).then(function (tok) {
      if (!opts.anon && !tok) throw new Error('signed out');
      var headers = { apikey: cfg.key, Accept: 'application/json' };
      headers.Authorization = 'Bearer ' + (tok || cfg.key);
      if (opts.body) headers['Content-Type'] = 'application/json';
      if (opts.prefer) headers.Prefer = opts.prefer;
      return fetch(cfg.url + '/rest/v1/' + path, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
      }).then(function (res) {
        if (res.status === 204) return null;
        return res.text().then(function (txt) {
          var data = null;
          try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
          if (!res.ok) throw new Error((data && (data.message || data.hint)) || ('HTTP ' + res.status));
          return data;
        });
      });
    });
  }

  /* --- the directory (public) --- */

  function venues(query) {
    var q = 'venues?select=id,name_en,name_ar,kind,area,governorate,status,merged_into' +
            '&merged_into=is.null&order=name_en.asc&limit=200';
    if (query) {
      var like = encodeURIComponent('*' + String(query).trim() + '*');
      q += '&or=(name_en.ilike.' + like + ',name_ar.ilike.' + like + ',area.ilike.' + like + ')';
    }
    return rest(q, { anon: true });
  }

  function venue(id) {
    return rest('venues?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1', { anon: true })
      .then(function (rows) { return rows && rows[0]; });
  }

  function addVenue(nameEn, nameAr, area, governorate, kind) {
    return token().then(function (tok) {
      if (!tok) throw new Error('signed out');
      var s = loadSession();
      var slug = String(nameEn).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                   .replace(/^-|-$/g, '').slice(0, 40) + '-' + Math.random().toString(36).slice(2, 6);
      return rest('venues?select=*', {
        method: 'POST', prefer: 'return=representation',
        body: {
          id: slug, name_en: nameEn, name_ar: nameAr || nameEn,
          kind: kind || 'other_cafe', area: area || null,
          governorate: governorate || null, status: 'pending',
          created_by: s && s.id
        }
      }).then(function (rows) { return rows && rows[0]; });
    });
  }

  /* The board. Counts only, and it is the function that guarantees that,
     not this call. Readable without signing in, because a cafe's own
     page should show it to anyone. */
  function board(venueId, days) {
    return rest('rpc/venue_board', {
      anon: true, method: 'POST', body: { p_venue: venueId, p_days: days || 7 }
    }).then(function (rows) { return (rows && rows[0]) || null; });
  }

  /* ---------------------------------------------------------------- */
  /*  THE PUBLIC ENTRY POINT                                           */
  /* ---------------------------------------------------------------- */

  /* checkIn — the one call a host site makes to record a cup.
     Returns { ok, id, at, verified }. Everything is optional except a
     venue or a place note: a check-in with nothing but a place is still
     a real memory, and demanding a rating would slow down the only
     interaction that has to be fast. */
  function checkIn(opts) {
    opts = opts || {};
    return token().then(function (tok) {
      if (!tok) return { ok: false, reason: 'signedOut' };
      var s = loadSession();
      var row = {
        user_id: (s && s.id) || undefined,
        drink: opts.drink || 'V60',
        company: opts.company || [],
        company_kind: opts.companyKind || 'alone',
        source: opts.source || 'web'
      };
      if (opts.venue)     row.venue_id = opts.venue;
      if (opts.placeNote) row.place_note = opts.placeNote;
      if (opts.rating)    row.rating = opts.rating;
      if (opts.note)      row.note = opts.note;
      if (opts.itemRef)   row.item_ref = opts.itemRef;
      if (opts.doseG)     row.dose_g = opts.doseG;
      if (opts.at)        row.had_at = opts.at;

      /* The caller may not stamp a row for somebody else: the policy
         checks user_id against the token, so a wrong id fails the write
         rather than mislabelling it. This just fills it in. */
      if (!row.user_id) {
        return whoAmI(tok).then(function (id) {
          row.user_id = id;
          return writeCheckIn(row, opts);
        });
      }
      return writeCheckIn(row, opts);
    });
  }

  function whoAmI(tok) {
    return fetch(cfg.url + '/auth/v1/user', {
      headers: { apikey: cfg.key, Authorization: 'Bearer ' + tok }
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (u) { return u && u.id; });
  }

  function writeCheckIn(row, opts) {
    return rest('gahwa_logs?select=id,had_at,venue_id,verified', {
      method: 'POST', prefer: 'return=representation', body: row
    }).then(function (rows) {
      var made = rows && rows[0];
      if (!made) return { ok: false, reason: 'failed' };
      var result = { ok: true, id: made.id, at: made.had_at,
                     venue_id: made.venue_id, verified: false };
      if (!opts.code) return result;
      return verify(made.id, row.venue_id, opts.code).then(function (v) {
        result.verified = !!v;
        return result;
      });
    });
  }

  /* The counter code is checked on the server and nowhere else. This
     call cannot tell a wrong code from an unset one, by design. */
  function verify(logId, venueId, code) {
    if (!logId || !venueId || !code) return Promise.resolve(false);
    return token().then(function (tok) {
      return fetch(cfg.url + '/functions/v1/verify-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: cfg.key,
          Authorization: 'Bearer ' + tok
        },
        body: JSON.stringify({ log_id: logId, venue_id: venueId, code: code })
      }).then(function (r) { return r.json(); })
        .then(function (d) { return !!(d && d.verified); }, function () { return false; });
    });
  }

  /* Someone's own check-ins. A host uses this for its own purposes — the
     bag tracking on a product page, say — and gets only rows the token
     already owns, because the policy decides, not this function. */
  function myCheckIns(opts) {
    opts = opts || {};
    var q = 'gahwa_logs?select=*,venue:venues(id,name_en,name_ar,kind,area,governorate,merged_into)' +
            '&order=had_at.desc&limit=' + (opts.limit || 400);
    if (opts.venue)   q += '&venue_id=eq.' + encodeURIComponent(opts.venue);
    if (opts.itemRef) q += '&item_ref=eq.' + encodeURIComponent(opts.itemRef);
    if (opts.since)   q += '&had_at=gte.' + encodeURIComponent(opts.since);
    if (opts.withDose) q += '&dose_g=not.is.null';
    return rest(q);
  }

  function deleteCheckIn(id, photoPath) {
    var first = photoPath ? removePhotos([photoPath])['catch'](function () { return null; })
                          : Promise.resolve(null);
    return first.then(function () {
      return rest('gahwa_logs?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
    });
  }

  function removePhotos(paths) {
    if (!paths || !paths.length) return Promise.resolve(null);
    return token().then(function (tok) {
      return fetch(cfg.url + '/storage/v1/object/gahwa-photos', {
        method: 'DELETE',
        headers: { apikey: cfg.key, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: paths })
      });
    });
  }

  function stats() {
    return Promise.all([
      rest('v_gahwa_summary?select=*'),
      rest('v_gahwa_streak?select=*'),
      rest('v_gahwa_places?select=*&order=visits.desc'),
      rest('v_gahwa_people?select=*&order=cups.desc'),
      rest('v_gahwa_map?select=*'),
      myCheckIns({})
    ]).then(function (r) {
      var data = {
        summary: (r[0] && r[0][0]) || null,
        streak:  (r[1] && r[1][0]) || null,
        places:  r[2] || [],
        people:  r[3] || [],
        map:     r[4] || [],
        entries: r[5] || []
      };
      data.stickers = stickersFor(data);
      return data;
    });
  }

  /* --- taking it with you --- */

  function exportJSON(rows) {
    return JSON.stringify({
      exported_at: new Date().toISOString(),
      note: 'Your gahwa check-in log. Yours to keep, move or delete.',
      entries: rows.map(function (r) {
        return {
          had_at: r.had_at,
          venue: r.venue ? r.venue.name_en : (r.place_note || null),
          area: r.venue ? r.venue.area : null,
          governorate: r.venue ? r.venue.governorate : null,
          verified: r.verified, source: r.source,
          company: r.company || [], company_kind: r.company_kind,
          rating: r.rating, drink: r.drink,
          item_ref: r.item_ref || null, dose_g: r.dose_g, note: r.note
        };
      })
    }, null, 2);
  }

  var CSV_HEAD = ['date', 'time', 'venue', 'area', 'governorate', 'verified', 'source',
                  'company', 'company_kind', 'rating', 'drink', 'item_ref', 'dose_g', 'note'];

  function csvCell(v) {
    if (v === null || v === undefined) return '';
    var s = String(v);
    /* A leading =, +, - or @ makes a spreadsheet treat the cell as a
       formula, so a note that starts with one gets a quote in front. */
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportCSV(rows) {
    var out = [CSV_HEAD.join(',')];
    rows.forEach(function (r) {
      var when = new Date(r.had_at);
      out.push([
        when.toISOString().slice(0, 10), when.toTimeString().slice(0, 5),
        r.venue ? r.venue.name_en : (r.place_note || ''),
        r.venue ? (r.venue.area || '') : '',
        r.venue ? (r.venue.governorate || '') : '',
        r.verified ? 'yes' : 'no', r.source,
        (r.company || []).join(' · '), r.company_kind,
        r.rating === null || r.rating === undefined ? '' : r.rating,
        r.drink, r.item_ref || '',
        r.dose_g === null || r.dose_g === undefined ? '' : r.dose_g,
        r.note || ''
      ].map(csvCell).join(','));
    });
    /* A byte-order mark, so a spreadsheet opens the Arabic as UTF-8. */
    return '﻿' + out.join('\r\n') + '\r\n';
  }

  function deleteEverything() {
    return myCheckIns({ limit: 100000 }).then(function (rows) {
      var photos = rows.map(function (r) { return r.photo_path; })
                       .filter(function (p) { return !!p; });
      return removePhotos(photos).then(function () { return null; },
                                       function (e) { return e; })
        .then(function (photoError) {
          var s = loadSession();
          return rest('gahwa_logs?user_id=eq.' + encodeURIComponent(s.id), { method: 'DELETE' })
            .then(function () {
              return { entries: rows.length, photos: photos.length, photoError: photoError };
            });
        });
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Stickers                                                         */
  /* ---------------------------------------------------------------- */

  var SHAPES = {
    bean: '<ellipse cx="12" cy="12" rx="6.4" ry="8.4" transform="rotate(-18 12 12)"/><path d="M12.6 4.2c-1.9 2.6-2 5.2-.3 7.8 1.7 2.6 1.5 5.2-.6 7.8" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" stroke-linecap="round"/>',
    pin:  '<path d="M12 2.6c-3.9 0-7 3.1-7 7 0 5.2 7 11.8 7 11.8s7-6.6 7-11.8c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9.6" r="2.6" fill="#fff" fill-opacity=".6"/>',
    fire: '<path d="M12 2.5s1.2 3.2-.8 5.6C9.4 10.2 7 11.2 7 14.4A5 5 0 0 0 17 15c0-2.6-1.6-3.7-1.6-6 0 0 2.6 1.4 2.6 4.6 0 0 1.2-1.6 1.2-3.6C19.2 6.4 12 2.5 12 2.5z"/>',
    tick: '<path d="M12 2.6l2.3 1.5 2.7-.3 1.1 2.5 2.4 1.3-.6 2.7.9 2.6-2.2 1.6-.9 2.6-2.8.2L12 21.4l-2.9-1.1-2.8-.2-.9-2.6-2.2-1.6.9-2.6-.6-2.7 2.4-1.3L7 3.8l2.7.3z"/><path d="M8.4 12.2l2.6 2.6 4.8-5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    sun:  '<circle cx="12" cy="12" r="4.6"/><path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M19.2 4.8l-2.1 2.1M6.9 17.1l-2.1 2.1" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
    moon: '<path d="M20 14.4A8.6 8.6 0 0 1 9.6 4a8.8 8.8 0 1 0 10.4 10.4z"/>',
    compass: '<circle cx="12" cy="12" r="9.2"/><path d="M15.6 8.4l-2.2 5.2-5.2 2.2 2.2-5.2z" fill="#fff" fill-opacity=".75"/>',
    heart: '<path d="M12 20.4S3.6 15.3 3.6 9.6a4.6 4.6 0 0 1 8.4-2.6 4.6 4.6 0 0 1 8.4 2.6c0 5.7-8.4 10.8-8.4 10.8z"/>'
  };

  var STICKERS = [
    { id: 'first',    shape: 'bean',    en: 'First cup',    ar: 'أول فنجان',    hintEn: 'Check in once',        hintAr: 'سجّل مرة واحدة',
      test: function (d) { return d.entries.length >= 1; } },
    { id: 'five',     shape: 'pin',     en: 'Five places',  ar: 'خمسة أماكن',   hintEn: '5 different venues',   hintAr: '٥ أماكن مختلفة',
      test: function (d) { return countVenues(d) >= 5; } },
    { id: 'streak7',  shape: 'fire',    en: 'Seven days',   ar: 'سبعة أيام',    hintEn: 'A 7-day streak',       hintAr: 'سلسلة ٧ أيام',
      test: function (d) { return d.streak && d.streak.longest_streak >= 7; } },
    { id: 'verified', shape: 'tick',    en: 'Regular',      ar: 'زبون دائم',    hintEn: '10 verified check-ins', hintAr: '١٠ تسجيلات موثّقة',
      test: function (d) { return d.entries.filter(function (r) { return r.verified; }).length >= 10; } },
    { id: 'early',    shape: 'sun',     en: 'Early',        ar: 'مبكّر',        hintEn: 'A cup before 8am',     hintAr: 'فنجان قبل الثامنة',
      test: function (d) { return d.entries.some(function (r) { return hourOf(r.had_at) < 8; }); } },
    { id: 'late',     shape: 'moon',    en: 'Late',         ar: 'متأخّر',       hintEn: 'A cup after 10pm',     hintAr: 'فنجان بعد العاشرة',
      test: function (d) { return d.entries.some(function (r) { return hourOf(r.had_at) >= 22; }); } },
    { id: 'explorer', shape: 'compass', en: 'Explorer',     ar: 'مستكشف',       hintEn: '3 governorates',       hintAr: '٣ محافظات',
      test: function (d) { return d.map.length >= 3; } },
    { id: 'loyal',    shape: 'heart',   en: 'Loyal',        ar: 'وفيّ',         hintEn: '10 cups at one place', hintAr: '١٠ فناجين بمكان واحد',
      test: function (d) { return d.places.some(function (p) { return p.visits >= 10; }); } }
  ];

  function hourOf(iso) {
    try { return Number(new Intl.DateTimeFormat('en-GB',
      { timeZone: 'Asia/Kuwait', hour: '2-digit', hour12: false }).format(new Date(iso))); }
    catch (e) { return new Date(iso).getHours(); }
  }
  function countVenues(d) {
    var seen = {};
    d.entries.forEach(function (r) { if (r.venue_id) seen[r.venue_id] = 1; });
    return Object.keys(seen).length;
  }

  function stickersFor(d) {
    return STICKERS.map(function (s) {
      var earned = false;
      try { earned = !!s.test(d); } catch (e) { earned = false; }
      return { id: s.id, shape: s.shape, earned: earned,
               label: isAr() ? s.ar : s.en, hint: isAr() ? s.hintAr : s.hintEn };
    });
  }

  /* ---------------------------------------------------------------- */
  /*  QR — encoded here rather than fetched from a CDN                 */
  /* ---------------------------------------------------------------- */

  /* A module that pulls a QR library off the internet adds a request and
     a dependency to somebody else's website. Byte mode, error correction
     level M, versions 1-10, which covers any sane check-in URL. */
  var QR = (function () {
    var EXP = new Array(512), LOG = new Array(256), i, x = 1;
    for (i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

    function mul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

    function genPoly(n) {
      var poly = [1], i, j;
      for (i = 0; i < n; i++) {
        var next = new Array(poly.length + 1);
        for (j = 0; j < next.length; j++) next[j] = 0;
        for (j = 0; j < poly.length; j++) {
          next[j] ^= poly[j];
          next[j + 1] ^= mul(poly[j], EXP[i]);
        }
        poly = next;
      }
      return poly;
    }

    function ecBytes(data, n) {
      var gen = genPoly(n), res = data.slice().concat(new Array(n).fill(0)), i, j;
      for (i = 0; i < data.length; i++) {
        var coef = res[i];
        if (!coef) continue;
        for (j = 0; j < gen.length; j++) res[i + j] ^= mul(gen[j], coef);
      }
      return res.slice(data.length);
    }

    /* version: [total codewords, ec per block, blocks in group 1,
                 data codewords in group 1, blocks in group 2] — level M */
    var V = {
      1:  [26,  10, 1, 16, 0], 2:  [44,  16, 1, 28, 0], 3:  [70,  26, 1, 44, 0],
      4:  [100, 18, 2, 32, 0], 5:  [134, 24, 2, 43, 0], 6:  [172, 16, 4, 27, 0],
      7:  [196, 18, 4, 31, 0], 8:  [242, 22, 2, 38, 2], 9:  [292, 22, 3, 36, 2],
      10: [346, 26, 4, 43, 1]
    };
    var ALIGN = {
      1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
      7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
    };

    function capacity(v) {
      var s = V[v];
      var g1 = s[2], d1 = s[3], g2 = s[4];
      var d2 = g2 ? d1 + 1 : 0;
      return g1 * d1 + g2 * d2;
    }

    function utf8(str) {
      var out = [], i, c;
      var s = encodeURIComponent(str);
      for (i = 0; i < s.length; i++) {
        c = s.charAt(i);
        if (c === '%') { out.push(parseInt(s.substr(i + 1, 2), 16)); i += 2; }
        else out.push(s.charCodeAt(i));
      }
      return out;
    }

    function encode(text) {
      var bytes = utf8(text), v, need;
      for (v = 1; v <= 10; v++) {
        need = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
        if (need <= capacity(v) * 8) break;
      }
      if (v > 10) throw new Error('gahwa QR: text too long');

      var spec = V[v], ecLen = spec[1], g1 = spec[2], d1 = spec[3], g2 = spec[4];
      var d2 = g2 ? d1 + 1 : 0;
      var total = capacity(v);

      /* bit stream */
      var bits = [];
      function push(value, len) {
        for (var i = len - 1; i >= 0; i--) bits.push((value >> i) & 1);
      }
      push(4, 4);
      push(bytes.length, v < 10 ? 8 : 16);
      bytes.forEach(function (b) { push(b, 8); });
      var rem = total * 8 - bits.length;
      push(0, Math.min(4, rem));
      while (bits.length % 8) bits.push(0);
      var pads = [0xEC, 0x11], p = 0;
      while (bits.length < total * 8) { push(pads[p % 2], 8); p++; }

      var codewords = [];
      for (var i = 0; i < bits.length; i += 8) {
        var b = 0;
        for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
        codewords.push(b);
      }

      /* split into blocks, interleave data then ec */
      var blocks = [], at = 0, k;
      for (k = 0; k < g1; k++) { blocks.push(codewords.slice(at, at + d1)); at += d1; }
      for (k = 0; k < g2; k++) { blocks.push(codewords.slice(at, at + d2)); at += d2; }
      var ecs = blocks.map(function (b) { return ecBytes(b, ecLen); });

      var out = [], maxData = Math.max(d1, d2);
      for (i = 0; i < maxData; i++) {
        for (k = 0; k < blocks.length; k++) if (i < blocks[k].length) out.push(blocks[k][i]);
      }
      for (i = 0; i < ecLen; i++) {
        for (k = 0; k < ecs.length; k++) out.push(ecs[k][i]);
      }
      return { version: v, codewords: out };
    }

    function build(text) {
      var enc = encode(text), v = enc.version, size = v * 4 + 17;
      var m = [], reserved = [], r, c;
      for (r = 0; r < size; r++) {
        m.push(new Array(size).fill(0));
        reserved.push(new Array(size).fill(false));
      }

      function place(rr, cc, val) { m[rr][cc] = val ? 1 : 0; reserved[rr][cc] = true; }

      function finder(row, col) {
        for (r = -1; r <= 7; r++) for (c = -1; c <= 7; c++) {
          var rr = row + r, cc = col + c;
          if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
          var on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                   (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                   (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          place(rr, cc, on);
        }
      }
      finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

      /* timing */
      for (i = 8; i < size - 8; i++) {
        place(6, i, i % 2 === 0);
        place(i, 6, i % 2 === 0);
      }

      /* alignment */
      var centres = ALIGN[v];
      for (var a = 0; a < centres.length; a++) for (var b2 = 0; b2 < centres.length; b2++) {
        var ar = centres[a], ac = centres[b2];
        if ((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= size - 9) || (ar >= size - 9 && ac <= 8)) continue;
        for (r = -2; r <= 2; r++) for (c = -2; c <= 2; c++) {
          place(ar + r, ac + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
        }
      }

      /* dark module + reserve format areas */
      place(size - 8, 8, 1);
      for (i = 0; i <= 8; i++) {
        if (!reserved[8][i]) { reserved[8][i] = true; m[8][i] = 0; }
        if (!reserved[i][8]) { reserved[i][8] = true; m[i][8] = 0; }
      }
      for (i = 0; i < 8; i++) {
        reserved[8][size - 1 - i] = true;
        reserved[size - 1 - i][8] = true;
      }
      /* version blocks */
      if (v >= 7) {
        for (r = 0; r < 6; r++) for (c = 0; c < 3; c++) {
          reserved[r][size - 11 + c] = true;
          reserved[size - 11 + c][r] = true;
        }
      }

      /* data, zigzag from bottom right, skipping the timing column */
      var bitIndex = 0, dataBits = [];
      enc.codewords.forEach(function (byte) {
        for (var i = 7; i >= 0; i--) dataBits.push((byte >> i) & 1);
      });
      var up = true;
      for (var col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        for (var n = 0; n < size; n++) {
          var row = up ? size - 1 - n : n;
          for (var s = 0; s < 2; s++) {
            var cc2 = col - s;
            if (reserved[row][cc2]) continue;
            m[row][cc2] = bitIndex < dataBits.length ? dataBits[bitIndex] : 0;
            bitIndex++;
          }
        }
        up = !up;
      }

      /* Pick the mask with the lowest penalty. The candidates are scored
         with the format and version areas blank rather than filled in:
         those bits depend on the mask being scored, so including them
         would let a mask be judged partly on its own label. Every
         reference encoder scores them blank, and scoring them filled
         picks a different mask often enough to matter. */
      var bestMask = 0, bestScore = Infinity, mask;
      for (mask = 0; mask < 8; mask++) {
        var cand = applyMask(m, reserved, mask, size);
        writeFormat(cand, mask, size, true);
        if (v >= 7) writeVersion(cand, v, size, true);
        var score = penalty(cand, size);
        if (score < bestScore) { bestScore = score; bestMask = mask; }
      }

      var out = applyMask(m, reserved, bestMask, size);
      writeFormat(out, bestMask, size, false);
      if (v >= 7) writeVersion(out, v, size, false);
      return { size: size, version: v, mask: bestMask, modules: out };
    }

    function maskFn(mask, r, c) {
      switch (mask) {
        case 0: return (r + c) % 2 === 0;
        case 1: return r % 2 === 0;
        case 2: return c % 3 === 0;
        case 3: return (r + c) % 3 === 0;
        case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
        case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
        case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
        default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
      }
    }

    function applyMask(m, reserved, mask, size) {
      var out = m.map(function (row) { return row.slice(); }), r, c;
      for (r = 0; r < size; r++) for (c = 0; c < size; c++) {
        if (!reserved[r][c] && maskFn(mask, r, c)) out[r][c] ^= 1;
      }
      return out;
    }

    /* Remainder of (value shifted up) divided by the BCH generator. */
    function bch(value, poly, len) {
      var v = value << (len - 1);
      while (bitLength(v) >= bitLength(poly)) v ^= poly << (bitLength(v) - bitLength(poly));
      return v;
    }
    function bitLength(n) { var l = 0; while (n) { l++; n >>>= 1; } return l; }

    /* Fifteen format bits, written twice. One copy runs down column 8
       beside the top-left finder; the other runs along row 8 from the
       right edge back. Both skip the timing line. `test` writes zeros,
       for scoring a mask before its label exists. */
    function writeFormat(m, mask, size, test) {
      var data = (0 << 3) | mask;                 /* level M = 00 */
      var bits = ((data << 10) | bch(data, 0x537, 11)) ^ 0x5412;
      for (var i = 0; i < 15; i++) {
        var bit = test ? 0 : ((bits >> i) & 1);
        /* down column 8 */
        if (i < 6) m[i][8] = bit;
        else if (i < 8) m[i + 1][8] = bit;
        else m[size - 15 + i][8] = bit;
        /* along row 8 */
        if (i < 8) m[8][size - 1 - i] = bit;
        else if (i === 8) m[8][7] = bit;
        else m[8][14 - i] = bit;
      }
      m[size - 8][8] = test ? 0 : 1;              /* the dark module */
    }

    /* Eighteen version bits, two blocks, versions 7 and up only. */
    function writeVersion(m, v, size, test) {
      var bits = (v << 12) | bch(v, 0x1f25, 13);
      for (var i = 0; i < 18; i++) {
        var bit = test ? 0 : ((bits >> i) & 1);
        var r = Math.floor(i / 3), c = i % 3;
        m[r][size - 11 + c] = bit;
        m[size - 11 + c][r] = bit;
      }
    }

    function penalty(m, size) {
      var score = 0, r, c, i, run, dark = 0;
      for (r = 0; r < size; r++) {
        run = 1;
        for (c = 1; c < size; c++) {
          if (m[r][c] === m[r][c - 1]) { run++; } else { if (run >= 5) score += 3 + (run - 5); run = 1; }
        }
        if (run >= 5) score += 3 + (run - 5);
      }
      for (c = 0; c < size; c++) {
        run = 1;
        for (r = 1; r < size; r++) {
          if (m[r][c] === m[r - 1][c]) { run++; } else { if (run >= 5) score += 3 + (run - 5); run = 1; }
        }
        if (run >= 5) score += 3 + (run - 5);
      }
      for (r = 0; r < size - 1; r++) for (c = 0; c < size - 1; c++) {
        var v0 = m[r][c];
        if (v0 === m[r][c + 1] && v0 === m[r + 1][c] && v0 === m[r + 1][c + 1]) score += 3;
      }
      var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
      var pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
      function matches(get, at, pat) {
        for (var k = 0; k < 11; k++) if (get(at + k) !== pat[k]) return false;
        return true;
      }
      for (r = 0; r < size; r++) for (c = 0; c <= size - 11; c++) {
        var getR = function (k) { return m[r][k]; };
        if (matches(getR, c, pat1) || matches(getR, c, pat2)) score += 40;
      }
      for (c = 0; c < size; c++) for (r = 0; r <= size - 11; r++) {
        var getC = function (k) { return m[k][c]; };
        if (matches(getC, r, pat1) || matches(getC, r, pat2)) score += 40;
      }
      for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (m[r][c]) dark++;
      var pct = (dark * 100) / (size * size);
      score += Math.floor(Math.abs(pct - 50) / 5) * 10;
      return score;
    }

    function svg(text, opts) {
      opts = opts || {};
      var q = build(text);
      var quiet = opts.quiet === undefined ? 4 : opts.quiet;
      var n = q.size + quiet * 2;
      var path = '', r, c;
      for (r = 0; r < q.size; r++) for (c = 0; c < q.size; c++) {
        if (q.modules[r][c]) path += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" ' +
             'shape-rendering="crispEdges" role="img" aria-label="' + esc(opts.label || text) + '">' +
             '<rect width="' + n + '" height="' + n + '" fill="' + (opts.bg || '#fff') + '"/>' +
             '<path d="' + path + '" fill="' + (opts.fg || '#000') + '"/></svg>';
    }

    return { build: build, svg: svg };
  })();

  /* ---------------------------------------------------------------- */
  /*  Rendering                                                        */
  /* ---------------------------------------------------------------- */

  function beanSVG() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + SHAPES.bean + '</svg>';
  }

  function beansStatic(rating) {
    if (!rating) return '';
    var out = '<span class="g-beans" role="img" aria-label="' + rating + '/5">', i;
    for (i = 1; i <= 5; i++) out += '<span class="g-bean" data-on="' + (i <= rating ? 1 : 0) + '">' + beanSVG() + '</span>';
    return out + '</span>';
  }

  function beansPick(id, value) {
    var out = '<span class="g-beans g-beans-pick" id="' + id + '" role="radiogroup" aria-label="' +
              esc(t('wasItGood')) + '">', i;
    for (i = 1; i <= 5; i++) {
      out += '<button type="button" class="g-bean" role="radio" data-bean="' + i +
             '" data-on="' + (i <= value ? 1 : 0) + '" aria-checked="' + (i === value) +
             '" aria-label="' + i + '/5">' + beanSVG() + '</button>';
    }
    return out + '</span>';
  }

  function paintBeans(host, value) {
    var all = host.querySelectorAll('[data-bean]'), i, n;
    for (i = 0; i < all.length; i++) {
      n = Number(all[i].getAttribute('data-bean'));
      all[i].setAttribute('data-on', n <= value ? '1' : '0');
      all[i].setAttribute('aria-checked', n === value ? 'true' : 'false');
    }
  }

  function venueName(v) {
    if (!v) return '';
    return isAr() ? (v.name_ar || v.name_en) : (v.name_en || v.name_ar);
  }

  /* --- the board, drawn from counts and nothing else --- */

  function boardHTML(b) {
    if (!b) return '<p class="g-muted g-small">' + esc(t('noneYet')) + '</p>';
    var days = Array.isArray(b.days) ? b.days : [];
    var max = days.reduce(function (m, d) { return Math.max(m, d.n); }, 1);
    var spark = '';
    if (days.length) {
      spark = '<div class="g-spark" aria-hidden="true">' + days.map(function (d) {
        return '<i style="height:' + Math.max(6, Math.round((d.n / max) * 30)) + 'px"></i>';
      }).join('') + '</div>';
    }
    return '<div class="g-board">' +
        '<div><b>' + b.checkins + '</b><span>' + esc(t('checkins')) + '</span></div>' +
        '<div><b>' + b.regulars + '</b><span>' + esc(t('regulars')) + '</span></div>' +
        '<div><b>' + b.today + '</b><span>' + esc(t('today')) + '</span></div>' +
      '</div>' +
      (spark ? '<div><p class="g-eyebrow">' + esc(t('lastDays')) + '</p>' + spark + '</div>' : '') +
      (b.checkins === 0 ? '<p class="g-muted g-small">' + esc(t('noneYet')) + '</p>' : '');
  }

  /* --- the governorate map --- */

  /* A schematic, not a survey: six blocks in roughly the arrangement the
     governorates sit in, so someone can see at a glance which parts of
     the country they drink coffee in. They do not overlap and nothing
     here is to scale — it is a diagram of a list, which is all the data
     supports, because the only location the module has is the one each
     venue states about itself. */
  var GOV_SHAPES = {
    'Jahra':             'M8 10 H68 V58 H8 Z',
    'Capital':           'M70 10 H132 V44 H70 Z',
    'Hawalli':           'M70 46 H132 V68 H70 Z',
    'Farwaniya':         'M28 60 H68 V82 H28 Z',
    'Mubarak Al-Kabeer': 'M70 70 H132 V92 H70 Z',
    /* One L-shaped path, not two rectangles: drawn as two, the second
       had no label of its own and read as an empty seventh region. */
    'Ahmadi':            'M28 84 H68 V94 H132 V130 H28 Z'
  };
  var GOV_LABEL_AT = {
    'Jahra': [38, 32], 'Capital': [101, 26], 'Hawalli': [101, 58],
    'Farwaniya': [48, 70], 'Mubarak Al-Kabeer': [101, 82], 'Ahmadi': [48, 114]
  };
  var GOV_SHORT = {
    'Mubarak Al-Kabeer': { en: 'Mubarak', ar: 'مبارك الكبير' }
  };

  function mapHTML(rows) {
    var byGov = {};
    (rows || []).forEach(function (r) { byGov[r.governorate] = r.visits; });
    var svg = '<svg viewBox="0 0 140 140" role="img" aria-label="' + esc(t('map')) + '">';
    GOVS.forEach(function (g) {
      var n = byGov[g] || 0;
      var level = n === 0 ? 0 : (n >= 4 ? 2 : 1);
      svg += '<path class="gov" data-been="' + level + '" d="' + GOV_SHAPES[g] + '"><title>' +
             esc(govLabel(g)) + (n ? ' — ' + n : '') + '</title></path>';
    });
    GOVS.forEach(function (g) {
      var at = GOV_LABEL_AT[g], n = byGov[g] || 0;
      var short = GOV_SHORT[g] ? (isAr() ? GOV_SHORT[g].ar : GOV_SHORT[g].en) : govLabel(g);
      svg += '<text x="' + at[0] + '" y="' + at[1] + '" text-anchor="middle"' +
             (n ? ' class="on"' : '') + '>' + esc(short) + '</text>';
      /* The count on its own line, so a long name and a number never
         have to share a width that neither of them fits. */
      if (n) {
        svg += '<text class="n" x="' + at[0] + '" y="' + (at[1] + 7) +
               '" text-anchor="middle">' + n + '</text>';
      }
    });
    svg += '</svg>';
    return '<div class="g-map"><p class="g-eyebrow">' + esc(t('map')) + '</p>' + svg +
           '<p class="g-muted g-small">' + esc(t('mapNote')) + '</p></div>';
  }

  function stickersHTML(list) {
    return '<div><p class="g-eyebrow">' + esc(t('stickers')) + '</p><div class="g-stickers">' +
      list.map(function (s) {
        return '<div class="g-sticker" data-earned="' + (s.earned ? 1 : 0) + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true">' + SHAPES[s.shape] + '</svg>' +
          '<b>' + esc(s.label) + '</b><span>' + esc(s.hint) + '</span></div>';
      }).join('') + '</div></div>';
  }

  function cupHTML(r) {
    var v = r.venue;
    var name = v ? venueName(v) : (r.place_note || t('venueUnknown'));
    return '<article class="g-cup" data-cup="' + esc(r.id) + '">' +
      '<div class="g-cup-when"><b>' + esc(dayLabel(r.had_at)) + '</b>' + esc(timeLabel(r.had_at)) + '</div>' +
      '<div class="g-cup-main">' +
        '<h3>' + esc(name) + '</h3>' +
        ((r.company && r.company.length)
          ? '<div class="g-people">' + r.company.map(function (p) {
              return '<span class="g-person">' + esc(p) + '</span>'; }).join('') + '</div>'
          : '') +
        '<div class="g-cup-meta"><span>' + esc(drinkLabel(r.drink)) + '</span>' +
          beansStatic(r.rating) +
          '<span class="g-tick">' + esc(r.verified ? t('verified') : t('unverified')) + '</span>' +
        '</div>' +
        (r.note ? '<p class="g-cup-note">' + esc(r.note) + '</p>' : '') +
      '</div>' +
      '<button type="button" class="g-btn g-btn-quiet g-small" data-remove="' + esc(r.id) +
        '" style="min-height:30px;padding:0 10px">' + esc(t('remove')) + '</button>' +
    '</article>';
  }

  /* ---------------------------------------------------------------- */
  /*  Public surface                                                   */
  /* ---------------------------------------------------------------- */

  function configure(opts) {
    opts = opts || {};
    if (opts.url) cfg.url = opts.url;
    if (opts.key) cfg.key = opts.key;
    if (opts.theme === 'warm' || opts.theme === 'dark') cfg.theme = opts.theme;
    if (opts.lang === 'en' || opts.lang === 'ar') cfg.lang = opts.lang;
    if (typeof opts.getToken === 'function') cfg.getToken = opts.getToken;
    applyChrome();
    return api;
  }

  /* Set theme and direction on the document this module is drawing into.
     Only ever the module's own pages — a host's page is never touched. */
  function applyChrome(root) {
    var node = root || document.documentElement;
    node.setAttribute('data-g-theme', cfg.theme);
    if (node === document.documentElement) {
      node.setAttribute('lang', cfg.lang);
      node.setAttribute('dir', isAr() ? 'rtl' : 'ltr');
    }
  }

  function readParams() {
    var q = new URLSearchParams(window.location.search);
    var out = {
      venue: q.get('venue') || null,
      theme: q.get('theme'),
      lang: q.get('lang'),
      src: q.get('src') || 'web',
      host: q.get('host') || null
    };
    if (out.theme === 'warm' || out.theme === 'dark') cfg.theme = out.theme;
    if (out.lang === 'en' || out.lang === 'ar') cfg.lang = out.lang;
    return out;
  }

  var api = {
    version: VERSION,
    configure: configure,
    /* the entry point */
    checkIn: checkIn,
    myCheckIns: myCheckIns,
    deleteCheckIn: deleteCheckIn,
    deleteEverything: deleteEverything,
    stats: stats,
    venues: venues,
    venue: venue,
    addVenue: addVenue,
    board: board,
    verify: verify,
    session: session,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    exportCSV: exportCSV,
    exportJSON: exportJSON,
    qrSVG: function (text, opts) { return QR.svg(text, opts); },
    qrMatrix: function (text) { return QR.build(text); },
    /* rendering, used by the module's own pages */
    _internal: {
      t: t, isAr: isAr, esc: esc, cfg: cfg, el: el,
      readParams: readParams, applyChrome: applyChrome,
      beansPick: beansPick, paintBeans: paintBeans, beansStatic: beansStatic,
      boardHTML: boardHTML, mapHTML: mapHTML, stickersHTML: stickersHTML,
      cupHTML: cupHTML, venueName: venueName, drinkLabel: drinkLabel,
      DRINKS: DRINKS, GOVS: GOVS, govLabel: govLabel,
      dayLabel: dayLabel, timeLabel: timeLabel, monthLabel: monthLabel,
      plural: plural
    }
  };

  return api;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = gahwa;
