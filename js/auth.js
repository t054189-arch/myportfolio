/* ==========================================================================
   Bloom — accounts
   ==========================================================================
   WHAT THIS IS NOW, PLAINLY.

   This file used to be a shell that accepted any username with any
   four-character password, and the comment here said so. That is no
   longer true. Sign-in and sign-up go to Supabase Auth over HTTPS:

     - an account exists only after someone creates one, and only the
       email address and password of an existing account will sign in;
     - the password is never stored or compared here. It is sent once to
       the auth server, which holds only a bcrypt hash of it, and this
       file never sees it again;
     - what is kept in localStorage is not a password and not a flag
       claiming to be signed in. It is a signed access token issued by
       the server, with an expiry, plus the display name to greet.

   WHAT IS STILL WORTH KNOWING, because a static site cannot pretend
   otherwise. The redirect that sends a visitor without a session back to
   the door is a courtesy, not a wall: the shop's own pages are public
   coffee listings, and someone editing localStorage can look at them
   signed out. That costs nothing, because the pages hold nothing
   private. What actually cannot be got at without a valid token is the
   data — a forged or expired token reads no profile and no order, and
   that refusal happens in Postgres under row-level security, where the
   browser has no say. The rule from the start of this project still
   holds: the server decides, never this file.

   "Continue as guest" stays exactly as it was — always visible, always
   working, no account, no network needed. A visitor who cannot get past
   a login screen is a lost customer, not a secured one.
   ========================================================================== */

var Auth = (function () {
  'use strict';

  var KEY    = 'bloom.session';
  var LEGACY = 'bloomUser';       /* the old shape-only flag */
  var MIN_PASSWORD = 8;           /* the server enforces its own floor too */
  var MARGIN = 60;                /* refresh a token a minute before expiry */
  var TIMEOUT = 12000;

  function now()   { return Math.floor(Date.now() / 1000); }
  function conf()  { return window.BLOOM || {}; }
  function ready() { return !!(conf().url && conf().key && window.fetch); }

  /* Every storage touch is wrapped: Safari in private mode throws on
     write, and a shop that crashes because someone opened a private
     window is a broken shop. */
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var s = raw ? JSON.parse(raw) : null;
      return s && (s.guest || s.token) ? s : null;
    } catch (e) { return null; }
  }
  function save(s) {
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function drop() {
    try { window.localStorage.removeItem(KEY); } catch (e) {}
  }

  /* A session left behind by the old form was never verified by anyone,
     so it is not a session. Clearing it once means anybody who was
     "signed in" as an arbitrary username is asked to sign in for real
     or continue as a guest — which is the entire point of this change. */
  (function () {
    try {
      if (window.localStorage.getItem(LEGACY) !== null) {
        window.localStorage.removeItem(LEGACY);
      }
    } catch (e) {}
  })();

  /* --- talking to the auth server ------------------------------------- */

  function post(path, body, token) {
    var headers = { 'Content-Type': 'application/json', apikey: conf().key };
    if (token) headers.Authorization = 'Bearer ' + token;

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : 0;

    return fetch(conf().url + '/auth/v1/' + path, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data || {} };
      }, function () {
        return { ok: res.ok, status: res.status, data: {} };
      });
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  /* Turn whatever the server complained about into one of our own
     reasons, so the messages the visitor reads are written by us and
     are bilingual. Falls back to the message text, because the code
     field has been spelled two different ways across GoTrue versions. */
  function reasonFor(r) {
    var d = r.data || {};
    var code = String(d.error_code || d.code || d.error || '').toLowerCase();
    var text = String(d.msg || d.message || d.error_description || '').toLowerCase();

    function has(needle) { return code.indexOf(needle) > -1 || text.indexOf(needle) > -1; }

    if (has('invalid_credentials') || has('invalid login') || has('invalid_grant')) return 'badCredentials';
    if (has('email_not_confirmed') || has('not confirmed')) return 'notConfirmed';
    if (has('already_registered') || has('already been registered') ||
        has('user_already_exists') || has('email_exists')) return 'exists';
    if (has('weak_password') || has('password should be')) return 'shortPassword';
    if (has('email_address_invalid') || has('invalid email') || has('validation_failed')) return 'badEmail';
    if (has('rate_limit') || has('rate limit') || r.status === 429) return 'rateLimit';
    if (has('signup_disabled') || has('signups not allowed')) return 'noSignups';
    return 'failed';
  }

  /* --- holding a session ----------------------------------------------- */

  /* Store the tokens, then ask the profiles table for the name. That
     read is also the first honest proof the token works: it is fetched
     under row-level security, and it returns a row only because the
     server recognised this token as belonging to that account. */
  function adopt(payload) {
    var user = payload.user || {};
    var meta = user.user_metadata || {};
    var fallback = String(meta.display_name || '').trim() ||
                   String(user.email || '').split('@')[0];

    var s = {
      token:   payload.access_token,
      refresh: payload.refresh_token,
      expires: now() + (payload.expires_in || 3600),
      id:      user.id,
      email:   user.email,
      name:    fallback
    };
    save(s);

    return profileName(s).then(function (name) {
      if (name && name !== s.name) { s.name = name; save(s); }
      return s.name;
    }, function () {
      return s.name;
    });
  }

  function profileName(s) {
    if (!s.id) return Promise.resolve(null);
    return fetch(conf().url + '/rest/v1/profiles?select=display_name&id=eq.' +
                 encodeURIComponent(s.id), {
      headers: { apikey: conf().key, Authorization: 'Bearer ' + s.token }
    }).then(function (res) {
      if (!res.ok) return null;
      return res.json().then(function (rows) {
        return rows && rows[0] ? rows[0].display_name : null;
      });
    });
  }

  function refresh(s) {
    return post('token?grant_type=refresh_token', { refresh_token: s.refresh })
      .then(function (r) {
        if (!r.ok || !r.data.access_token) return null;
        return adopt(r.data).then(function () { return load(); });
      });
  }

  /* --- the public surface ---------------------------------------------- */

  /* The name to greet, or null. Synchronous, because the header is drawn
     before any request could have finished. */
  function current() {
    var s = load();
    return s ? (s.guest ? 'guest' : s.name) : null;
  }

  function isGuest() { var s = load(); return !!(s && s.guest); }
  function email()   { var s = load(); return s && !s.guest ? s.email : null; }

  /* Create an account. Resolves { ok: true, signedIn: true } when the
     project signs new customers straight in, or { ok: true, signedIn:
     false } when it is set to send a confirmation email first — the
     caller has to handle both, because that is a dashboard setting and
     not something this file can know. */
  function signUp(name, mail, password) {
    var who  = String(name || '').trim();
    var addr = String(mail || '').trim().toLowerCase();
    var pass = String(password || '');

    if (!who)  return Promise.resolve({ ok: false, reason: 'noName' });
    if (!addr) return Promise.resolve({ ok: false, reason: 'noEmail' });
    if (!looksLikeEmail(addr)) return Promise.resolve({ ok: false, reason: 'badEmail' });
    if (!pass) return Promise.resolve({ ok: false, reason: 'noPassword' });
    if (pass.length < MIN_PASSWORD) return Promise.resolve({ ok: false, reason: 'shortPassword' });
    if (!ready()) return Promise.resolve({ ok: false, reason: 'offline' });

    return post('signup', {
      email: addr,
      password: pass,
      data: { display_name: who }
    }).then(function (r) {
      if (!r.ok) return { ok: false, reason: reasonFor(r) };

      var d = r.data;
      var user = d.user || d;

      /* A repeat sign-up is answered with a user carrying an empty
         identities array rather than an error, deliberately, so that
         the form cannot be used to find out who has an account. Read
         it the way it is meant: that address is taken. */
      if (user && user.identities && user.identities.length === 0) {
        return { ok: false, reason: 'exists' };
      }

      if (d.access_token) {
        return adopt(d).then(function (n) {
          return { ok: true, signedIn: true, name: n };
        });
      }

      /* Created, but the server wants the address confirmed first. No
         session, so nothing to sign in with yet. */
      return { ok: true, signedIn: false, name: who };
    }, function () {
      return { ok: false, reason: 'offline' };
    });
  }

  /* Sign in an existing account. There is no shape-only path any more:
     if the server does not recognise the pair, this fails. */
  function signIn(mail, password) {
    var addr = String(mail || '').trim().toLowerCase();
    var pass = String(password || '');

    if (!addr) return Promise.resolve({ ok: false, reason: 'noEmail' });
    if (!looksLikeEmail(addr)) return Promise.resolve({ ok: false, reason: 'badEmail' });
    if (!pass) return Promise.resolve({ ok: false, reason: 'noPassword' });
    if (!ready()) return Promise.resolve({ ok: false, reason: 'offline' });

    return post('token?grant_type=password', { email: addr, password: pass })
      .then(function (r) {
        if (!r.ok || !r.data.access_token) return { ok: false, reason: reasonFor(r) };
        return adopt(r.data).then(function (n) { return { ok: true, name: n }; });
      }, function () {
        return { ok: false, reason: 'offline' };
      });
  }

  /* Deliberately loose. The server is the judge of an address; this only
     catches the obvious slip of typing a username into an email box. */
  function looksLikeEmail(value) {
    return /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(value);
  }

  function signInAsGuest() {
    save({ guest: true, name: 'guest' });
    return { ok: true, name: 'guest' };
  }

  /* Clear locally first so the interface updates immediately, then tell
     the server to revoke the refresh token. If that request never
     arrives the visitor is still signed out here, and the access token
     expires on its own within the hour. */
  function signOut() {
    var s = load();
    drop();
    if (s && s.token && ready()) {
      post('logout', {}, s.token).catch(function () {});
    }
  }

  /* A valid access token, refreshing first if it is about to expire.
     Resolves null when there is nothing usable — a guest, no session,
     or a refresh the server refused. Orders and profile writes will
     need this; the catalogue does not. */
  function token() {
    var s = load();
    if (!s || s.guest || !s.token) return Promise.resolve(null);
    if (s.expires - MARGIN > now()) return Promise.resolve(s.token);
    if (!ready() || !s.refresh) return Promise.resolve(null);
    return refresh(s).then(function (fresh) {
      return fresh ? fresh.token : null;
    }, function () { return null; });
  }

  /* Called once per page load. Renews a session that is merely stale,
     then asks the server whether the token is real.

     That second step matters, and skipping it was tempting. An expiry
     stamp sitting in localStorage next to the token proves nothing —
     anyone can write both — so trusting it would leave the door
     ornamental: type a plausible session into devtools and the shop
     greets you by whatever name you chose. One small request per page
     load buys an answer from the only party that can give one, and it
     also catches the cases no local check ever could: an account
     deleted, a password changed elsewhere, a token revoked.

     If the network is unreachable the session is kept rather than
     cleared. Someone whose wifi dropped has not been signed out, and
     locking them out of a coffee menu over it would be silly. Nothing
     is risked by that: the pages they can then see are public, and
     anything that is not needs a token the server accepts. */
  function verify() {
    var s = load();
    if (!s || s.guest) return Promise.resolve(true);
    if (!s.token) { drop(); return Promise.resolve(false); }
    if (!ready()) return Promise.resolve(true);

    var stale = s.expires - MARGIN <= now();
    var first = stale && s.refresh
      ? refresh(s).then(function (fresh) { return fresh || null; })
      : Promise.resolve(s);

    return first.then(function (live) {
      if (!live) { drop(); return false; }
      return whoAmI(live.token).then(function (verdict) {
        if (verdict === 'rejected') { drop(); return false; }
        if (verdict === 'ok' && live.name) {
          /* Take the chance to notice a name changed on another device. */
          var meta = whoAmI.last || {};
          var name = String((meta.user_metadata || {}).display_name || '').trim();
          if (name && name !== live.name) { live.name = name; save(live); }
        }
        return true;
      });
    }, function () {
      return true;   /* unreachable, not rejected */
    });
  }

  /* 'ok', 'rejected', or 'unknown'. Only a clear no from the server —
     401 or 403 — ends a session; a 500 or a dropped connection is the
     shop's problem, not the customer's. */
  function whoAmI(access) {
    return fetch(conf().url + '/auth/v1/user', {
      headers: { apikey: conf().key, Authorization: 'Bearer ' + access }
    }).then(function (res) {
      if (res.status === 401 || res.status === 403) return 'rejected';
      if (!res.ok) return 'unknown';
      return res.json().then(function (user) {
        whoAmI.last = user || {};
        return 'ok';
      }, function () { return 'ok'; });
    }, function () { return 'unknown'; });
  }

  /* Send a visitor with no session to the front door. Called at the top
     of every page except login.html itself. replace() so the back button
     cannot bounce between the two. */
  function guard() {
    if (document.body && document.body.getAttribute('data-page') === 'login') return false;
    if (current()) return false;
    window.location.replace('login.html');
    return true;
  }

  return {
    current: current,
    isGuest: isGuest,
    email: email,
    signUp: signUp,
    signIn: signIn,
    signInAsGuest: signInAsGuest,
    signOut: signOut,
    token: token,
    verify: verify,
    guard: guard,
    minPassword: MIN_PASSWORD
  };
})();
