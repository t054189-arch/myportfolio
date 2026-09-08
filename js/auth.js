/* ==========================================================================
   Bloom — demo sign-in
   ==========================================================================
   BE CLEAR ABOUT WHAT THIS IS. This is a front-end demo and nothing more:

     - the credentials below are hardcoded in a file the browser downloads,
       so they are public to anyone who opens devtools or View Source;
     - the "session" is a single localStorage flag, which any visitor can set
       by hand in the console to walk straight past this screen;
     - there is no server, no password hashing, no token, no expiry, and no
       check of any kind once the flag exists.

   It must never be used to protect real customer data, real orders, or
   anything private. Real authentication has to be enforced by a server that
   never trusts the client. Treat this as a stage prop.

   "Continue as guest" is therefore always visible and always works. A
   visitor who cannot get past a login screen is a lost customer, not a
   secured one.
   ========================================================================== */

var Auth = (function () {

  var KEY = 'bloomUser';

  /* The demo account, shown on the login card in a dashed box. */
  var DEMO_USER = 'bloom';
  var DEMO_PASS = 'bloom123';

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

  /* Returns { ok: true } or { ok: false, reason: 'empty' | 'wrong' }. */
  function signIn(username, password) {
    var user = (username || '').trim();
    var pass = password || '';

    if (!user || !pass) return { ok: false, reason: 'empty' };
    if (user.toLowerCase() !== DEMO_USER || pass !== DEMO_PASS) {
      return { ok: false, reason: 'wrong' };
    }
    write(user.toLowerCase());
    return { ok: true };
  }

  function signInAsGuest() {
    write('guest');
    return { ok: true };
  }

  function signOut() {
    clear();
  }

  /* Send a visitor with no session to the front door. Called at the top of
     every page except login.html itself. Uses replace() so the back button
     cannot bounce between the two. */
  function guard() {
    if (document.body && document.body.getAttribute('data-page') === 'login') return false;
    if (current()) return false;
    window.location.replace('login.html');
    return true;   /* caller stops booting the page */
  }

  return {
    current: current,
    isGuest: isGuest,
    signIn: signIn,
    signInAsGuest: signInAsGuest,
    signOut: signOut,
    guard: guard,
    demo: { user: DEMO_USER, pass: DEMO_PASS }
  };
})();
