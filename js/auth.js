/* ==========================================================================
   Bloom — the sign-in shell
   ==========================================================================
   BE CLEAR ABOUT WHAT THIS IS. This is a front-end shell, not
   authentication. Nothing is verified:

     - there is no server, no account record, no password check;
     - the form validates shape only — a username must be present and a
       password must be at least four characters. Anything that passes
       those two checks is accepted;
     - the "session" is a single localStorage flag, which anyone can set by
       hand from devtools and walk straight past this screen.

   It exists to give the shop a door and a name to greet, nothing more. A
   real backend has to go behind it before a single real account exists —
   before that point there is no account to protect, and afterwards the
   server must be the thing that decides, never this file.

   "Continue as guest" is therefore always visible and always works. A
   visitor who cannot get past a login screen is a lost customer, not a
   secured one.
   ========================================================================== */

var Auth = (function () {

  var KEY = 'bloomUser';
  var MIN_PASSWORD = 4;   /* a shape check, not a security policy */

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* private mode */ }
  }
  function clear() {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* private mode */ }
  }

  /* The signed-in name, or null. */
  function current() {
    var name = read();
    return name ? name : null;
  }

  function isGuest() { return current() === 'guest'; }

  /* Shape only. Returns { ok: true } or { ok: false, reason }.
     reason: 'noUser' | 'noPassword' | 'shortPassword' */
  function signIn(username, password) {
    var user = (username || '').trim();
    var pass = password || '';

    if (!user) return { ok: false, reason: 'noUser' };
    if (!pass) return { ok: false, reason: 'noPassword' };
    if (pass.length < MIN_PASSWORD) return { ok: false, reason: 'shortPassword' };

    write(user);
    return { ok: true, name: user };
  }

  function signInAsGuest() {
    write('guest');
    return { ok: true, name: 'guest' };
  }

  function signOut() { clear(); }

  /* Send a visitor with no session to the front door. Called at the top of
     every page except login.html itself. replace() so the back button
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
    signIn: signIn,
    signInAsGuest: signInAsGuest,
    signOut: signOut,
    guard: guard,
    minPassword: MIN_PASSWORD
  };
})();
