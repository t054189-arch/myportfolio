/* ==========================================================================
   Bloom — header behaviour, theme, cart drawer and page rendering
   1. Helpers              5. Cart drawer + badge     9. Café
   2. Theme                6. Listing pages          10. Cart page
   3. Header               7. Product page           11. Bloom timer
   4. Footer               8. Brew recipe block      12. Boot
   ========================================================================== */

/* --- 1. Helpers --------------------------------------------------------- */

function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* A bilingual string as a pair of data attributes, so I18N.apply owns it. */
function bi(pair) {
  return ' data-en="' + esc(pair.en) + '" data-ar="' + esc(pair.ar) + '"';
}
function biLabel(pair) {
  return ' data-en-label="' + esc(pair.en) + '" data-ar-label="' + esc(pair.ar) + '"';
}

/* KWD, always three decimals, mono, with a small grey currency after it. */
function money(amount) {
  return '<span class="price">' + Number(amount).toFixed(3) + '</span>' +
         '<span class="price-cur"' + bi(WORDS.kwd) + '>' + esc(t(WORDS.kwd)) + '</span>';
}

/* Some WORDS carry {tokens}. Fill them after translating, so a number
   lands where that language puts it rather than where English does. */
function tf(pair, values) {
  return t(pair).replace(/\{(\w+)\}/g, function (whole, key) {
    return values[key] === undefined ? whole : values[key];
  });
}

/* One measurement as its own bidi island: "93 °C" never comes out "C° 93". */
function ltr(value) {
  return '<span class="ltr" dir="ltr">' + esc(value) + '</span>';
}

function tagChip(key) {
  var tag = TAGS[key];
  if (!tag) return '';
  return '<span class="tag tag-' + tag.tone + '"' + bi(tag) + '>' + esc(t(tag)) + '</span>';
}

function productArt(product, cls) {
  var alt = product.category === 'beans' ? t(product.name) + ' — ' + t(product.origin) : t(product.name);
  return '<img src="' + esc(product.image) + '" alt="' + esc(alt) + '" class="' + (cls || '') + '" loading="lazy">';
}

function byCategory(category) {
  var out = [];
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].category === category) out.push(PRODUCTS[i]);
  }
  return out;
}

function el(id) { return document.getElementById(id); }

/* Duration tokens live in CSS; JS reads them rather than repeating numbers. */
function ms(token) {
  var raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  var value = parseFloat(raw) || 0;
  return raw.indexOf('ms') !== -1 ? value : value * 1000;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* Strings the interface itself needs. */
var WORDS = {
  kwd:        { en: 'KWD', ar: 'د.ك' },
  skip:       { en: 'Skip to content', ar: 'تجاوز إلى المحتوى' },
  menu:       { en: 'Menu', ar: 'القائمة' },
  langSwitch: { en: 'Switch to Arabic', ar: 'التبديل إلى الإنجليزية' },
  langLabel:  { en: 'ع', ar: 'EN' },
  toDark:     { en: 'Switch to dark theme', ar: 'التبديل إلى الوضع الداكن' },
  toLight:    { en: 'Switch to light theme', ar: 'التبديل إلى الوضع الفاتح' },
  bag:        { en: 'Shopping bag', ar: 'حقيبة الشراء' },
  bagCount:   { en: 'items in bag', ar: 'عناصر في الحقيبة' },
  close:      { en: 'Close', ar: 'إغلاق' },
  yourBag:    { en: 'Your bag', ar: 'حقيبتك' },
  empty:      { en: 'Your bag is empty. The beans are roasted weekly — start there.', ar: 'حقيبتك فارغة. الحبوب تُحمّص أسبوعياً — ابدأ من هناك.' },
  shopBeans:  { en: 'Shop beans', ar: 'تسوّق الحبوب' },
  subtotal:   { en: 'Subtotal', ar: 'المجموع' },
  checkout:   { en: 'Checkout', ar: 'إتمام الشراء' },
  soon:       { en: 'Online checkout is coming soon — visit us at the café and we will grind it for you.', ar: 'الشراء عبر الموقع قريباً — زُرنا في المقهى ونطحنها لك.' },
  viewCart:   { en: 'View the full cart', ar: 'عرض السلة كاملة' },
  remove:     { en: 'Remove', ar: 'إزالة' },
  less:       { en: 'Decrease quantity', ar: 'تقليل الكمية' },
  more:       { en: 'Increase quantity', ar: 'زيادة الكمية' },
  qty:        { en: 'Quantity', ar: 'الكمية' },
  addToCart:  { en: 'Add to cart', ar: 'أضف إلى السلة' },
  added:      { en: 'Added to your bag.', ar: 'أُضيف إلى حقيبتك.' },
  inStock:    { en: 'in stock', ar: 'متوفّر' },
  lowStock:   { en: 'left — roasted this week', ar: 'متبقّية — محمّصة هذا الأسبوع' },
  all:        { en: 'All', ar: 'الكل' },
  results:    { en: 'products', ar: 'منتجات' },
  noResults:  { en: 'Nothing under that filter yet.', ar: 'لا توجد منتجات بهذا التصنيف بعد.' },
  notFound:   { en: 'We could not find that product.', ar: 'لم نجد هذا المنتج.' },
  emptyHint:  { en: 'The link may be old. Everything we roast is one click away.', ar: 'قد يكون الرابط قديماً. كل ما نحمّصه على بعد نقرة واحدة.' },
  specs:      { en: 'Specifications', ar: 'المواصفات' },
  dose:       { en: 'Dose', ar: 'الجرعة' },
  water:      { en: 'Water', ar: 'الماء' },
  tempW:      { en: 'Temperature', ar: 'الحرارة' },
  grind:      { en: 'Grind', ar: 'الطحن' },
  totalTime:  { en: 'Total time', ar: 'الزمن الكلي' },
  ratio:      { en: 'Ratio', ar: 'النسبة' },
  bloomS:     { en: 'Bloom', ar: 'التفتّح' },
  yieldW:     { en: 'In the cup', ar: 'في الفنجان' },
  recipe:     { en: 'Brew recipe', ar: 'وصفة التحضير' },
  seconds:    { en: 's', ar: 'ث' },
  grams:      { en: 'g', ar: 'غم' },
  degrees:    { en: '°C', ar: '°م' },
  bar:        { en: 'bar', ar: 'بار' },

  /* login and account */
  account:    { en: 'Account', ar: 'الحساب' },
  signedIn:   { en: 'Signed in as', ar: 'تم الدخول باسم' },
  guest:      { en: 'Guest', ar: 'زائر' },
  signOut:    { en: 'Sign out', ar: 'تسجيل الخروج' },
  signIn:     { en: 'Sign in', ar: 'تسجيل الدخول' },
  signingIn:  { en: 'Signing in…', ar: 'جارٍ الدخول…' },
  createAcct: { en: 'Create account', ar: 'إنشاء حساب' },
  creating:   { en: 'Creating your account…', ar: 'جارٍ إنشاء حسابك…' },

  /* Every message a visitor can be shown at the door. Written here rather
     than passed through from the auth server, so they are ours, they are
     bilingual, and they say what to do next instead of only what went
     wrong. */
  noName:     { en: 'Please enter a name — we use it to greet you.', ar: 'الرجاء إدخال الاسم — نستخدمه للترحيب بك.' },
  noEmail:    { en: 'Please enter your email address.', ar: 'الرجاء إدخال بريدك الإلكتروني.' },
  badEmail:   { en: 'That does not look like an email address.', ar: 'هذا لا يبدو بريداً إلكترونياً.' },
  noPassword: { en: 'Please enter a password.', ar: 'الرجاء إدخال كلمة المرور.' },
  shortPass:  { en: 'That password is too short — eight characters or more.', ar: 'كلمة المرور قصيرة جداً — ثمانية أحرف أو أكثر.' },
  badCreds:   { en: 'That email and password do not match an account. Check them, or create an account.',
                ar: 'البريد وكلمة المرور لا يطابقان أي حساب. تحقّق منهما أو أنشئ حساباً.' },
  notConfirm: { en: 'Confirm your email address first — the link is in your inbox.',
                ar: 'أكّد بريدك الإلكتروني أولاً — الرابط في صندوق بريدك.' },
  acctExists: { en: 'There is already an account with that email. Sign in instead.',
                ar: 'يوجد حساب بهذا البريد بالفعل. سجّل الدخول بدلاً من ذلك.' },
  rateLimit:  { en: 'Too many attempts just now. Wait a minute and try again.',
                ar: 'محاولات كثيرة الآن. انتظر دقيقة ثم أعد المحاولة.' },
  offlineMsg: { en: 'We cannot reach the shop right now. Check your connection, or continue as a guest.',
                ar: 'لا يمكننا الوصول إلى المتجر الآن. تحقّق من اتصالك أو تابع كزائر.' },
  authFailed: { en: 'Something went wrong. Please try again.', ar: 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.' },
  noSignups:  { en: 'New accounts are closed at the moment.', ar: 'إنشاء الحسابات مغلق حالياً.' },
  checkEmail: { en: 'Account created. Confirm your email address, then sign in.',
                ar: 'تم إنشاء الحساب. أكّد بريدك الإلكتروني ثم سجّل الدخول.' },
  /* --- the gahwa log --------------------------------------------------
     A diary, not a brewing sheet: the words stay in that register. No
     "session", no "entry #4" — a cup, a place, the people who were
     there. */
  gahwaNav:   { en: 'Gahwa log', ar: 'سجل القهوة' },
  gahwaLead:  { en: 'A private diary of the coffee you drink — where you were, who you were with, and whether it was any good.',
                ar: 'دفتر خاص للقهوة التي تشربها — أين كنت، ومع من، وهل كانت جيدة.' },
  gahwaPrivate: { en: 'Only you can read this. Not the shop, not anyone else.',
                ar: 'أنت وحدك تقرأ هذا. لا المتجر ولا أي شخص آخر.' },

  cupsMonth:  { en: 'Cups this month', ar: 'فناجين هذا الشهر' },
  streakNow:  { en: 'Current streak', ar: 'السلسلة الحالية' },
  avgBeans:   { en: 'Average rating', ar: 'متوسط التقييم' },
  topPlaceLbl:{ en: 'Most-visited place', ar: 'أكثر مكان زيارة' },
  noneYet:    { en: '—', ar: '—' },

  logCup:     { en: 'Log a coffee', ar: 'سجّل فنجاناً' },
  logCupHere: { en: 'Log a coffee here', ar: 'سجّل فنجاناً هنا' },
  logThisCup: { en: 'Log this cup', ar: 'سجّل هذا الفنجان' },

  qGood:      { en: 'Was it any good?', ar: 'هل كانت جيدة؟' },
  qWhere:     { en: 'Where?', ar: 'أين؟' },
  qWho:       { en: 'Who with?', ar: 'مع من؟' },
  qWhat:      { en: 'What?', ar: 'ماذا شربت؟' },
  beansOf:    { en: '{n} of 5 beans', ar: '{n} من ٥ حبّات' },
  newPlace:   { en: 'Somewhere new — type its name', ar: 'مكان جديد — اكتب اسمه' },
  placeKindQ: { en: 'What kind of place?', ar: 'ما نوع المكان؟' },
  addPerson:  { en: 'A name or a nickname', ar: 'اسم أو لقب' },
  nicknameOk: { en: 'Nicknames are fine — this is your diary, not a directory.',
                ar: 'الألقاب مناسبة تماماً — هذا دفترك، وليس دليل أسماء.' },
  bloomBeanQ: { en: 'A Bloom bean?', ar: 'حبة من بلوم؟' },
  noBean:     { en: 'Not a Bloom bean', ar: 'ليست من بلوم' },
  doseLbl:    { en: 'Dose', ar: 'الجرعة' },
  noteLbl:    { en: 'A note, if you want one', ar: 'ملاحظة، إن أردت' },
  photoLbl:   { en: 'Photo — stays private', ar: 'صورة — تبقى خاصة' },
  whenLbl:    { en: 'When', ar: 'الوقت' },
  saveCup:    { en: 'Save', ar: 'حفظ' },
  savingCup:  { en: 'Saving…', ar: 'جارٍ الحفظ…' },
  savedCup:   { en: 'Logged.', ar: 'تم التسجيل.' },
  closeSheet: { en: 'Close', ar: 'إغلاق' },
  onlyRating: { en: 'Nothing here is required except the beans.',
                ar: 'لا شيء مطلوب هنا سوى الحبّات.' },

  fAll:       { en: 'All', ar: 'الكل' },
  fMonth:     { en: 'This month', ar: 'هذا الشهر' },
  fFive:      { en: '5 beans only', ar: '٥ حبّات فقط' },
  fPlace:     { en: 'By place', ar: 'حسب المكان' },
  fPerson:    { en: 'By person', ar: 'حسب الشخص' },

  yourPlaces: { en: 'Your places', ar: 'أماكنك' },
  yourPeople: { en: 'Your people', ar: 'أشخاصك' },
  lastLbl:    { en: 'Last', ar: 'آخر مرة' },
  aBloomBranch:{ en: 'A Bloom branch', ar: 'فرع بلوم' },
  peopleEmpty:{ en: 'Cups you drink with someone will show up here.',
                ar: 'الفناجين التي تشربها بصحبة أحد ستظهر هنا.' },
  placesEmpty:{ en: 'Places you log will show up here.',
                ar: 'الأماكن التي تسجّلها ستظهر هنا.' },

  logEmpty:   { en: 'Nothing logged yet. Tap a bean and you are halfway done.',
                ar: 'لا شيء مسجّل بعد. اضغط حبة وتكون قد أنجزت النصف.' },
  exampleTag: { en: 'Example', ar: 'مثال' },
  exampleNote:{ en: 'This is what an entry looks like. It is not one of yours.',
                ar: 'هكذا يبدو التسجيل. وهو ليس من تسجيلاتك.' },

  removeCup:  { en: 'Delete this entry', ar: 'احذف هذا التسجيل' },
  reallyOne:  { en: 'Delete it? This cannot be undone.', ar: 'حذفه؟ لا يمكن التراجع.' },
  yesDelete:  { en: 'Delete', ar: 'حذف' },
  keepIt:     { en: 'Keep it', ar: 'إبقاؤه' },

  exportLog:  { en: 'Download my log', ar: 'تنزيل سجلي' },
  exportCsv:  { en: 'CSV, for a spreadsheet', ar: 'CSV، لجدول بيانات' },
  exportJson: { en: 'JSON, for everything else', ar: 'JSON، لما سوى ذلك' },
  wipeLog:    { en: 'Delete my entire log', ar: 'احذف سجلي بالكامل' },
  wipeWarn:   { en: 'Every entry and every photo, removed now and not recoverable. Your places are kept unless you tick the box.',
                ar: 'كل تسجيل وكل صورة، تُحذف الآن ولا يمكن استرجاعها. تُحفظ أماكنك إلا إذا اخترت الصندوق.' },
  wipePlaces: { en: 'My saved places too', ar: 'وأماكني المحفوظة أيضاً' },
  wipeDo:     { en: 'Delete everything', ar: 'احذف كل شيء' },
  wipeDone:   { en: 'Deleted {entries} and {photos}.', ar: 'حُذف {entries} و{photos}.' },
  wipeNothing:{ en: 'There was nothing to delete.', ar: 'لم يكن هناك ما يُحذف.' },
  photoLeft:  { en: 'The entries are gone, but a photo could not be removed. Try again.',
                ar: 'حُذفت التسجيلات، لكن تعذّر حذف صورة. أعد المحاولة.' },

  bagBrewed:  { en: 'You have brewed {cups} from this bag — about {grams} g used.',
                ar: 'حضّرت {cups} من هذا الكيس — نحو {grams} غم.' },
  bagLeft:    { en: 'About {grams} g left.', ar: 'يتبقّى نحو {grams} غم.' },
  bagOut:     { en: 'That bag is about finished.', ar: 'هذا الكيس على وشك الانتهاء.' },
  reorder:    { en: 'Reorder', ar: 'أعد الطلب' },

  logSignedOut:{ en: 'The gahwa log belongs to an account, so there is somewhere private to keep it. Guests can browse everything else.',
                ar: 'سجل القهوة مرتبط بحساب، ليكون له مكان خاص. يمكن للزوار تصفّح كل ما عداه.' },
  goSignIn:   { en: 'Sign in or create an account →', ar: 'سجّل الدخول أو أنشئ حساباً →' },
  loadFailed: { en: 'Could not reach your log. Check your connection and reload.',
                ar: 'تعذّر الوصول إلى سجلك. تحقّق من اتصالك وأعد التحميل.' },
  myAccount:  { en: 'My account', ar: 'حسابي' },
  accountData:{ en: 'Your data', ar: 'بياناتك' },

  dragHint:   { en: 'Drag to rotate', ar: 'اسحب للتدوير' },
  rigAlt:     { en: 'A V60 cone with brass rib rings above a glass server of brewed coffee',
                ar: 'قمع V60 بحلقات نحاسية فوق دورق زجاجي فيه قهوة محضّرة' },
  tasting:    { en: 'Tasting notes', ar: 'ملاحظات التذوّق' },
  viewBean:   { en: 'View the bean →', ar: 'عرض الحبة →' },
  brewsWith:  { en: 'Brews well with', ar: 'يُستحسن معه' },
  restOfKit:  { en: 'The rest of the kit', ar: 'بقية العدّة' },

  /* the brew unit */
  time:       { en: 'Time', ar: 'الوقت' },
  water:      { en: 'Water', ar: 'الماء' },
  prep:       { en: 'prep', ar: 'تحضير' },
  brewIt:     { en: 'Brew it', ar: 'حضّرها' },
  pause:      { en: 'Pause', ar: 'إيقاف' },
  resume:     { en: 'Resume', ar: 'متابعة' },
  brewAgain:  { en: 'Brew again', ar: 'حضّر مرة أخرى' },
  speed:      { en: '7× speed', ar: 'بسرعة ٧×' },
  howToV60:   { en: 'How to make a V60', ar: 'كيف تحضّر V60' },
  howToNote:  { en: 'One clock drives the kettle, the bed, the server and the scale. Scrub to any step.',
                ar: 'ساعة واحدة تحرّك الغلاية والقاع والدورق والميزان. انتقل إلى أي خطوة.' },
  relatedNote:{ en: 'What we reach for alongside it on the bar.', ar: 'ما نستخدمه معه على البار.' }
};

/* --- 2. Theme ----------------------------------------------------------- */

var Theme = (function () {
  var KEY = 'bloom.theme';

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* ignore */ }
  }

  /* What the viewer is actually looking at right now. */
  function effective() {
    var stored = read();
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function paintButton() {
    var button = el('theme-btn');
    if (!button) return;
    var dark = effective() === 'dark';
    /* Built once, then flipped: the two faces swap mid-turn on separate
       backfaces, so the icon turns instead of being replaced. */
    if (!button.querySelector('.ico-flip')) button.innerHTML = flipIcon('moon', 'sun');
    button.querySelector('.ico-flip').classList.toggle('is-flipped', dark);
    var words = dark ? WORDS.toLight : WORDS.toDark;
    button.setAttribute('data-en-label', words.en);
    button.setAttribute('data-ar-label', words.ar);
    button.setAttribute('aria-pressed', dark ? 'true' : 'false');
    I18N.apply(button);
  }

  function set(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    write(mode);
    paintButton();
    /* the 3D scene relights itself from this */
    document.dispatchEvent(new CustomEvent('bloom:theme', { detail: { theme: mode } }));
  }

  function toggle() { set(effective() === 'dark' ? 'light' : 'dark'); }

  /* Restore the stored choice. Nothing is set when the viewer never chose,
     so the OS preference keeps deciding. */
  function init() {
    var stored = read();
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  }

  init();
  return { toggle: toggle, paintButton: paintButton, effective: effective };
})();

/* --- 3. Header ----------------------------------------------------------
   Built once here and injected on every page, so it can never drift.
   ----------------------------------------------------------------------- */

function headerHTML(page) {
  var nav = '';

  for (var i = 0; i < MENUS.length; i++) {
    var menu = MENUS[i];
    var links = '';

    for (var j = 0; j < menu.links.length; j++) {
      var link = menu.links[j];

      /* Beans are chosen by taste, so their rows show the notes turning
         rather than a generic icon. */
      if (menu.key === 'beans') {
        var beanId = (link.href.split('id=')[1] || '').split('&')[0];
        links +=
          '<a class="panel-link panel-link-ring ringcard" href="' + esc(link.href) + '">' +
            '<span class="ring-holder" data-ring="' + esc(beanId) + '" data-ring-size="half"></span>' +
            '<span class="panel-link-body">' +
              '<span class="panel-link-name"><span' + bi(link.name) + '>' + esc(t(link.name)) + '</span>' +
                (link.tag ? tagChip(link.tag) : '') +
              '</span>' +
              '<span class="panel-link-desc"' + bi(link.desc) + '>' + esc(t(link.desc)) + '</span>' +
            '</span>' +
          '</a>';
        continue;
      }

      links +=
        '<a class="panel-link" href="' + esc(link.href) + '">' +
          '<span class="tile">' + icon(link.icon) + '</span>' +
          '<span class="panel-link-body">' +
            '<span class="panel-link-name"><span' + bi(link.name) + '>' + esc(t(link.name)) + '</span>' +
              (link.tag ? tagChip(link.tag) : '') +
            '</span>' +
            '<span class="panel-link-desc"' + bi(link.desc) + '>' + esc(t(link.desc)) + '</span>' +
          '</span>' +
        '</a>';
    }

    nav +=
      '<li class="nav-item has-panel" data-menu="' + menu.key + '">' +
        '<button type="button" class="nav-trigger' + (page === menu.key ? ' is-current' : '') + '"' +
          ' aria-expanded="false" aria-controls="panel-' + menu.key + '">' +
          '<span' + bi(menu.label) + '>' + esc(t(menu.label)) + '</span>' +
          icon('chevron', 'nav-chevron') +
        '</button>' +
        '<div class="panel" id="panel-' + menu.key + '">' +
          '<div class="panel-head">' +
            '<span class="eyebrow"' + bi(menu.eyebrow) + '>' + esc(t(menu.eyebrow)) + '</span>' +
            '<a class="panel-all" href="' + esc(menu.href) + '"' + bi(menu.all) + '>' + esc(t(menu.all)) + '</a>' +
          '</div>' +
          '<div class="panel-grid' + (menu.key === 'beans' ? ' panel-grid-beans' : '') + '">' + links + '</div>' +
        '</div>' +
      '</li>';
  }

  for (var k = 0; k < NAV_LINKS.length; k++) {
    var plain = NAV_LINKS[k];
    var current = page && plain.href.indexOf(page) === 0;
    nav +=
      '<li class="nav-item">' +
        '<a class="nav-link" href="' + esc(plain.href) + '"' + (current ? ' aria-current="page"' : '') +
          bi(plain.label) + '>' + esc(t(plain.label)) + '</a>' +
      '</li>';
  }

  return '' +
    '<a class="skip-link" href="#main"' + bi(WORDS.skip) + '>' + esc(t(WORDS.skip)) + '</a>' +
    '<header class="site-header" id="site-header">' +
      '<div class="header-inner wrap">' +
        '<a class="wordmark" href="index.html" aria-label="Bloom">Bl<em>oo</em>m</a>' +
        '<nav class="nav" id="site-nav" aria-label="Main">' +
          '<ul class="nav-list">' + nav + '</ul>' +
        '</nav>' +
        '<div class="header-actions">' +
          '<button type="button" class="icon-btn icon-btn-wide" id="lang-btn"' + biLabel(WORDS.langSwitch) + '>' +
            icon('globe', 'lang-globe') +
            '<span class="lang-label"' + bi(WORDS.langLabel) + '>' + esc(t(WORDS.langLabel)) + '</span>' +
          '</button>' +
          '<button type="button" class="icon-btn" id="theme-btn"' + biLabel(WORDS.toDark) + '>' + icon('moon') + '</button>' +
          '<div class="account-wrap" id="account-wrap">' +
            '<button type="button" class="icon-btn icon-btn-wide" id="account-btn"' +
              ' aria-expanded="false" aria-controls="account-menu"' + biLabel(WORDS.account) + '>' +
              icon('user') +
              '<span class="account-name" id="account-name"></span>' +
            '</button>' +
            '<div class="account-menu" id="account-menu">' +
              '<p class="account-who" id="account-who"></p>' +
              '<a class="btn btn-quiet" href="gahwa-log.html"' + bi(WORDS.gahwaNav) + '>' + esc(t(WORDS.gahwaNav)) + '</a>' +
              '<a class="btn btn-quiet" href="account.html"' + bi(WORDS.myAccount) + '>' + esc(t(WORDS.myAccount)) + '</a>' +
              '<button type="button" class="btn btn-secondary" id="signout-btn"' + bi(WORDS.signOut) + '>' + esc(t(WORDS.signOut)) + '</button>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="icon-btn bag-btn" id="bag-btn"' + biLabel(WORDS.bag) + '>' +
            icon('bag') +
            '<span class="bag-badge" id="bag-badge" hidden>0</span>' +
          '</button>' +
          '<button type="button" class="icon-btn hamburger" id="menu-btn" aria-expanded="false"' +
            ' aria-controls="site-nav"' + biLabel(WORDS.menu) + '>' + icon('menu') + '</button>' +
        '</div>' +
      '</div>' +
    '</header>';
}

function initHeader() {
  var header = el('site-header');
  var desktop = window.matchMedia('(hover: hover) and (min-width: 900px)');
  var items = header.querySelectorAll('.nav-item.has-panel');

  function closeAll(except) {
    for (var i = 0; i < items.length; i++) {
      if (items[i] === except) continue;
      items[i].classList.remove('is-open');
      items[i].querySelector('.nav-trigger').setAttribute('aria-expanded', 'false');
    }
  }

  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.nav-trigger').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) closeAll(item);
  }

  for (var i = 0; i < items.length; i++) {
    (function (item) {
      var trigger = item.querySelector('.nav-trigger');

      /* Click and keyboard, on every device. A pointer that opened the panel
         by hovering should not close it again on the click that follows. */
      trigger.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        if (open && desktop.matches && item.matches(':hover')) return;
        setOpen(item, !open);
      });

      /* Hover, only where hovering is real */
      item.addEventListener('mouseenter', function () {
        if (desktop.matches) setOpen(item, true);
      });
      item.addEventListener('mouseleave', function () {
        if (desktop.matches) setOpen(item, false);
      });

      /* Tabbing out of the panel closes it */
      item.addEventListener('focusout', function (event) {
        if (!desktop.matches) return;
        if (!item.contains(event.relatedTarget)) setOpen(item, false);
      });
    })(items[i]);
  }

  /* Escape closes and hands focus back to the trigger */
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var open = header.querySelector('.nav-item.is-open');
    if (open) {
      setOpen(open, false);
      open.querySelector('.nav-trigger').focus();
    }
    if (header.classList.contains('nav-open')) {
      header.classList.remove('nav-open');
      el('menu-btn').setAttribute('aria-expanded', 'false');
    }
  });

  /* Clicking outside closes */
  document.addEventListener('click', function (event) {
    if (header.contains(event.target)) return;
    closeAll(null);
    header.classList.remove('nav-open');
    el('menu-btn').setAttribute('aria-expanded', 'false');
    el('account-wrap').classList.remove('is-open');
    el('account-btn').setAttribute('aria-expanded', 'false');
  });

  /* Hamburger below 900px */
  el('menu-btn').addEventListener('click', function () {
    var open = !header.classList.contains('nav-open');
    header.classList.toggle('nav-open', open);
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* Account menu: the signed-in name plus a way out. */
  var accountWrap = el('account-wrap');
  var accountBtn = el('account-btn');
  accountBtn.addEventListener('click', function () {
    var open = !accountWrap.classList.contains('is-open');
    accountWrap.classList.toggle('is-open', open);
    accountBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  el('signout-btn').addEventListener('click', function () {
    Auth.signOut();
    window.location.href = 'login.html';
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && accountWrap.classList.contains('is-open')) {
      accountWrap.classList.remove('is-open');
      accountBtn.setAttribute('aria-expanded', 'false');
      accountBtn.focus();
    }
  });

  el('theme-btn').addEventListener('click', function () { Theme.toggle(); });
  el('lang-btn').addEventListener('click', function () {
    spinIcon(this);
    I18N.toggle();
  });
  el('bag-btn').addEventListener('click', function () { Drawer.open(); });

  Theme.paintButton();
}

/* --- 4. Footer ---------------------------------------------------------- */

var FOOTER_NOTE = {
  en: 'We roast every Tuesday in Shuwaikh and rest the beans three days before they reach you. Filter and espresso, by origin, in small batches.',
  ar: 'نحمّص كل ثلاثاء في الشويخ وتستريح الحبوب ثلاثة أيام قبل أن تصلك. تقطير وإسبريسو، بحسب الأصل، وبدفعات صغيرة.'
};

function footerHTML() {
  var cols = '';
  for (var i = 0; i < FOOTER.length; i++) {
    var col = FOOTER[i];
    var links = '';
    for (var j = 0; j < col.links.length; j++) {
      var link = col.links[j];
      links += '<li><a href="' + esc(link.href) + '"' + bi(link.label) + '>' + esc(t(link.label)) + '</a></li>';
    }
    cols +=
      '<div class="footer-col">' +
        '<h2' + bi(col.title) + '>' + esc(t(col.title)) + '</h2>' +
        '<ul class="stack stack-2">' + links + '</ul>' +
      '</div>';
  }

  return '' +
    '<footer class="site-footer">' +
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          cols +
          '<div class="footer-col">' +
            '<h2' + bi({ en: 'Roasted weekly', ar: 'تُحمّص أسبوعياً' }) + '>Roasted weekly</h2>' +
            '<p class="footer-note"' + bi(FOOTER_NOTE) + '>' + esc(t(FOOTER_NOTE)) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="footer-base">' +
          '<span class="type-credit">Bodoni Moda · Archivo · IBM Plex Mono</span>' +
          '<span class="type-credit"' + bi({ en: '© 2026 Bloom · Salmiya, Kuwait', ar: '© ٢٠٢٦ بلوم · السالمية، الكويت' }) + '></span>' +
        '</div>' +
      '</div>' +
    '</footer>';
}

/* --- 5. Cart drawer + badge -------------------------------------------- */

function lineItemsHTML(items) {
  if (!items.length) {
    return '<p class="cart-empty"' + bi(WORDS.empty) + '>' + esc(t(WORDS.empty)) + '</p>';
  }
  var html = '<ul class="line-items">';
  for (var i = 0; i < items.length; i++) {
    var product = items[i].product;
    html +=
      '<li class="line-item">' +
        '<span class="line-art">' + productArt(product) + '</span>' +
        '<span class="line-meta">' +
          '<a class="line-name" href="product.html?id=' + esc(product.id) + '">' + esc(t(product.name)) + '</a>' +
          '<span class="note">' + esc(t(product.unit)) + '</span>' +
          '<span class="stepper" role="group"' + biLabel(WORDS.qty) + '>' +
            '<button type="button" data-step="-1" data-id="' + esc(product.id) + '"' + biLabel(WORDS.less) + '>−</button>' +
            '<span class="stepper-value">' + items[i].qty + '</span>' +
            '<button type="button" data-step="1" data-id="' + esc(product.id) + '"' + biLabel(WORDS.more) + '>+</button>' +
          '</span>' +
        '</span>' +
        '<span class="line-end">' +
          '<span>' + money(items[i].total) + '</span>' +
          '<button type="button" class="link-btn" data-remove="' + esc(product.id) + '"' + bi(WORDS.remove) + '>' + esc(t(WORDS.remove)) + '</button>' +
        '</span>' +
      '</li>';
  }
  return html + '</ul>';
}

function drawerHTML() {
  return '' +
    '<div class="drawer-backdrop" id="drawer-backdrop" hidden></div>' +
    '<aside class="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">' +
      '<div class="drawer-head">' +
        '<h2 id="drawer-title" class="drawer-title"' + bi(WORDS.yourBag) + '>' + esc(t(WORDS.yourBag)) + '</h2>' +
        '<button type="button" class="icon-btn" id="drawer-close"' + biLabel(WORDS.close) + '>' + icon('close', 'ico-close') + '</button>' +
      '</div>' +
      '<div class="drawer-body" id="drawer-body"></div>' +
      '<div class="drawer-foot">' +
        '<p class="notice" id="drawer-notice" hidden' + bi(WORDS.soon) + '></p>' +
        '<div class="totals">' +
          '<span class="eyebrow"' + bi(WORDS.subtotal) + '>' + esc(t(WORDS.subtotal)) + '</span>' +
          '<span id="drawer-total">' + money(0) + '</span>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-block" id="drawer-checkout"' + bi(WORDS.checkout) + '>' + esc(t(WORDS.checkout)) + '</button>' +
        '<a class="btn btn-secondary btn-block" href="cart.html"' + bi(WORDS.viewCart) + '>' + esc(t(WORDS.viewCart)) + '</a>' +
      '</div>' +
    '</aside>';
}

var Drawer = (function () {
  var lastFocus = null;

  function render() {
    var body = el('drawer-body');
    if (!body) return;
    var items = Cart.items();
    body.innerHTML = lineItemsHTML(items);
    el('drawer-total').innerHTML = money(Cart.subtotal());
    I18N.apply(el('cart-drawer'));
  }

  function open() {
    var drawer = el('cart-drawer');
    var backdrop = el('drawer-backdrop');
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    /* one frame later, so the transition has a starting point */
    window.requestAnimationFrame(function () {
      backdrop.classList.add('is-open');
      drawer.classList.add('is-open');
    });
    el('drawer-close').focus();
  }

  function close() {
    var drawer = el('cart-drawer');
    var backdrop = el('drawer-backdrop');
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    window.setTimeout(function () { backdrop.hidden = true; }, ms('--t-slow'));
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* aria-modal is a promise: while the drawer is open, Tab stays inside it. */
  function trap(event) {
    var drawer = el('cart-drawer');
    if (event.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
    var focusable = drawer.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!drawer.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function init() {
    el('drawer-close').addEventListener('click', close);
    el('drawer-backdrop').addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && el('cart-drawer').classList.contains('is-open')) close();
      trap(event);
    });
    el('drawer-checkout').addEventListener('click', function () {
      var notice = el('drawer-notice');
      notice.hidden = false;
      I18N.apply(notice);
    });
    el('cart-drawer').addEventListener('click', onCartClick);
    render();
  }

  return { init: init, open: open, close: close, render: render };
})();

/* Steppers and remove buttons behave the same in the drawer and on cart.html */
function onCartClick(event) {
  var step = event.target.closest ? event.target.closest('[data-step]') : null;
  if (step) {
    var id = step.getAttribute('data-id');
    var delta = parseInt(step.getAttribute('data-step'), 10);
    var items = Cart.items();
    for (var i = 0; i < items.length; i++) {
      if (items[i].product.id === id) { Cart.setQty(id, items[i].qty + delta); break; }
    }
    return;
  }
  var remove = event.target.closest ? event.target.closest('[data-remove]') : null;
  if (remove) Cart.remove(remove.getAttribute('data-remove'));
}

/* The header shows who is signed in, in the current language. */
function syncAccount() {
  var nameEl = el('account-name');
  if (!nameEl) return;
  var user = Auth.current();
  var label = !user ? t(WORDS.signIn) : (Auth.isGuest() ? t(WORDS.guest) : user);
  nameEl.textContent = label;
  el('account-who').innerHTML = esc(t(WORDS.signedIn)) + ' <b>' + esc(label) + '</b>';
  el('account-btn').setAttribute('aria-label', t(WORDS.account) + ' — ' + label);
}

function syncBadge() {
  var badge = el('bag-badge');
  if (!badge) return;
  var n = Cart.count();
  badge.textContent = n;
  badge.hidden = n === 0;
  var button = el('bag-btn');
  var suffix = n === 0 ? '' : ' — ' + n + ' ' + t(WORDS.bagCount);
  button.setAttribute('aria-label', t(WORDS.bag) + suffix);
}

/* --- 6. Listing pages -------------------------------------------------- */

/* The front of every card is identical, so a row shares its edges,
   padding and baselines and the price always lands in the same place. */
function cardFaceHTML(product) {
  return '' +
    '<span class="card-art">' + productArt(product) + '</span>' +
    '<span class="card-body">' +
      '<span class="card-origin">' + esc(t(product.origin)) + ' · ' + esc(t(product.unit)) + '</span>' +
      '<span class="card-name">' + esc(t(product.name)) + '</span>' +
      '<span class="card-note">' + esc(t(product.notes)) + '</span>' +
      '<span class="card-foot">' +
        tagChip(product.tags[0]) +
        '<span data-live-price="' + esc(product.id) + '">' + money(product.price) + '</span>' +
      '</span>' +
    '</span>';
}

/* Every card tilts toward the cursor and lifts 6px. A bean also carries
   its flavour ring beneath, wrapped so hovering or tabbing to either the
   card or the ring pauses the orbit. */
function cardHTML(product) {
  var href = 'product.html?id=' + esc(product.id);
  var card = '<a class="card" data-tilt href="' + href + '">' + cardFaceHTML(product) + '</a>';

  if (product.flavour) {
    return '<div class="reveal card-slot ringcard">' +
             card +
             '<div class="ring-holder" data-ring="' + esc(product.id) + '"></div>' +
           '</div>';
  }
  return '<div class="reveal card-slot">' + card + '</div>';
}

var FILTER_SETS = {
  beans:    ['all', 'classic', 'fruity', 'filter', 'espresso'],
  tools:    ['all', 'brewing', 'grinding', 'weighing'],
  machines: ['all', 'espresso', 'filter', 'grinding']
};

function initListing(category) {
  var grid = el('listing-grid');
  var filters = el('listing-filters');
  var count = el('listing-count');
  if (!grid) return;

  var active = 'all';
  var keys = FILTER_SETS[category] || ['all'];

  function paintFilters() {
    var html = '';
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var label = key === 'all' ? WORDS.all : TAGS[key];
      html += '<button type="button" class="pill" data-tilt="8" data-filter="' + key + '"' +
              ' aria-pressed="' + (active === key ? 'true' : 'false') + '"' +
              bi(label) + '>' + esc(t(label)) + '</button>';
    }
    filters.innerHTML = html;
  }

  function paintGrid(settled) {
    var all = byCategory(category);
    var shown = [];
    for (var i = 0; i < all.length; i++) {
      if (active === 'all' || all[i].tags.indexOf(active) !== -1) shown.push(all[i]);
    }
    if (!shown.length) {
      grid.innerHTML = '<p class="note"' + bi(WORDS.noResults) + '>' + esc(t(WORDS.noResults)) + '</p>';
    } else {
      var html = '';
      for (var j = 0; j < shown.length; j++) html += cardHTML(shown[j]);
      grid.innerHTML = html;
    }
    count.textContent = shown.length + ' ' + t(WORDS.results);

    if (settled) {
      /* A filter change is its own animation: the cards come back in
         staggered 40ms apart, and nothing else in the view moves. */
      var cards = grid.querySelectorAll('.reveal');
      for (var k = 0; k < cards.length; k++) {
        cards[k].style.transitionDelay = (Math.min(k, 8) * 40) + 'ms';
        cards[k].classList.add('is-revealed');
      }
    } else {
      Motion.observe(grid);
    }
    initTilt(grid);
    Rings.mount(grid);
  }

  function paint(settled) {
    paintFilters();
    paintGrid(settled);
    I18N.apply(el('main'));
    initTilt(filters);
  }

  filters.addEventListener('click', function (event) {
    var pill = event.target.closest ? event.target.closest('[data-filter]') : null;
    if (!pill) return;
    active = pill.getAttribute('data-filter');

    if (prefersReducedMotion()) { paint(true); return; }
    grid.classList.add('is-fading');
    window.setTimeout(function () {
      paint(true);
      grid.classList.remove('is-fading');
    }, ms('--t-base'));
  });

  document.addEventListener('bloom:lang', function () { paint(true); });
  paint(false);
}

/* --- 7. Product page --------------------------------------------------- */

function specsTableHTML(product) {
  var rows = '';
  for (var key in product.specs) {
    if (!Object.prototype.hasOwnProperty.call(product.specs, key)) continue;
    var label = SPEC_LABELS[key] || { en: key, ar: key };
    rows += '<tr><th scope="row">' + esc(t(label)) + '</th><td>' + esc(t(product.specs[key])) + '</td></tr>';
  }
  return '<div class="scroll-x"><table class="specs"><caption class="visually-hidden">' + esc(t(WORDS.specs)) + '</caption><tbody>' + rows + '</tbody></table></div>';
}

function initProductPage() {
  var host = el('product-host');
  if (!host) return;

  var params = new URLSearchParams(window.location.search);
  var product = productById(params.get('id') || '');

  function paint() {
    if (!product) {
      host.innerHTML =
        '<h1' + bi(WORDS.notFound) + '>' + esc(t(WORDS.notFound)) + '</h1>' +
        '<p class="lede"' + bi(WORDS.emptyHint) + '>' + esc(t(WORDS.emptyHint)) + '</p>' +
        '<p><a class="btn btn-primary" href="beans.html"' + bi(WORDS.shopBeans) + '>' + esc(t(WORDS.shopBeans)) + '</a></p>';
      I18N.apply(host);
      return;
    }

    /* The page title lives on <body> so I18N owns it in both languages. */
    document.body.setAttribute('data-title-en', product.name.en + ' — Bloom');
    document.body.setAttribute('data-title-ar', product.name.ar + ' — بلوم');

    var tags = '';
    for (var i = 0; i < product.tags.length; i++) tags += tagChip(product.tags[i]);

    var stockLine = stockText(product);

    /* The gallery slot. A bean's own object is its flavour ring — the
       notes turning around the bag answer the only question a customer
       has. Gear gets its drag-to-rotate build, and anything without a
       build falls back to the flat illustration. */
    var gallery;
    if (product.flavour) {
      gallery = '<div class="product-art product-ring ringcard">' +
                  '<div class="ring-holder" data-ring="' + esc(product.id) + '"></div>' +
                '</div>';
    } else if (product.model) {
      gallery = '<div class="scene product-scene" data-model="' + esc(product.model) + '" data-mode="drag"' +
                ' data-fallback="' + esc(product.image) + '"></div>';
    } else {
      gallery = '<div class="product-art">' + productArt(product) + '</div>';
    }

    host.innerHTML =
      '<div class="product">' +
        gallery +
        '<div class="product-info">' +
          '<p class="eyebrow">' + esc(t(product.origin)) + '</p>' +
          '<h1>' + esc(t(product.name)) + '</h1>' +
          '<p class="product-price" data-live-price="' + esc(product.id) + '">' + money(product.price) +
            '<span class="note">/ ' + esc(t(product.unit)) + '</span></p>' +
          '<div class="row">' + tags + '</div>' +
          '<p class="product-desc">' + esc(t(product.desc)) + '</p>' +
          specsTableHTML(product) +
          '<div class="buy-row">' +
            '<span class="stepper" role="group"' + biLabel(WORDS.qty) + '>' +
              '<button type="button" id="qty-less"' + biLabel(WORDS.less) + '>−</button>' +
              '<span class="stepper-value" id="qty-value">1</span>' +
              '<button type="button" id="qty-more"' + biLabel(WORDS.more) + '>+</button>' +
            '</span>' +
            '<button type="button" class="btn btn-primary btn-sheen" id="add-to-cart"' + bi(WORDS.addToCart) + '>' + esc(t(WORDS.addToCart)) + '</button>' +
            '<span class="stock-note" data-live-stock="' + esc(product.id) + '">' + esc(stockLine) + '</span>' +
          '</div>' +
          '<p class="notice" id="added-notice" hidden' + bi(WORDS.added) + '></p>' +
          /* Filled by initBagTracker only when the log has something to
             say about this bag. Empty and invisible otherwise. */
          '<div id="bag-line"></div>' +
        '</div>' +
      '</div>' +
      (product.recipe ? '<div class="block-tight" id="product-recipe">' + brewBlockHTML(product.recipe, t(product.name), product.recipe.note) + '</div>' : '') +
      relatedHTML(product);

    var qty = 1;
    el('qty-less').addEventListener('click', function () {
      qty = Math.max(1, qty - 1); el('qty-value').textContent = qty;
    });
    el('qty-more').addEventListener('click', function () {
      qty = Math.min(99, qty + 1); el('qty-value').textContent = qty;
    });
    el('add-to-cart').addEventListener('click', function () {
      Cart.add(product.id, qty);
      var notice = el('added-notice');
      notice.hidden = false;
      I18N.apply(notice);
      sweep(this);
      Drawer.open();
    });

    I18N.apply(host);
    Motion.observe(host);
    initTilt(host);
    initScenes(host);
    Rings.mount(host);
    initBagTracker(product);
  }

  document.addEventListener('bloom:lang', paint);
  paint();
}

/* Three things we would reach for alongside this one. */
function relatedFor(product) {
  var wanted = product.category === 'beans'
    ? ['gooseneck-kettle', 'digital-scale', 'dripper-v60']
    : ['eth-guji', 'col-huila', 'yem-haraz'];

  var out = [];
  for (var i = 0; i < wanted.length; i++) {
    var item = productById(wanted[i]);
    if (item && item.id !== product.id) out.push(item);
  }
  /* Never show a short row: top up from the same category if one was the
     product we are already looking at. */
  if (out.length < 3) {
    var pool = byCategory(product.category === 'beans' ? 'tools' : 'beans');
    for (var j = 0; j < pool.length && out.length < 3; j++) {
      if (pool[j].id === product.id) continue;
      var already = false;
      for (var k = 0; k < out.length; k++) if (out[k].id === pool[j].id) already = true;
      if (!already) out.push(pool[j]);
    }
  }
  return out;
}

function relatedHTML(product) {
  var items = relatedFor(product);
  if (!items.length) return '';
  var cards = '';
  for (var i = 0; i < items.length; i++) cards += cardHTML(items[i]);

  return '<section class="related">' +
    '<div class="section">' +
      '<div class="section-label">' +
        '<span class="eyebrow">' + esc(t(WORDS.restOfKit)) + '</span>' +
        '<h2>' + esc(t(WORDS.brewsWith)) + '</h2>' +
        '<p class="note">' + esc(t(WORDS.relatedNote)) + '</p>' +
      '</div>' +
      '<div class="grid grid-cards">' + cards + '</div>' +
    '</div>' +
  '</section>';
}

/* Restart a one-shot icon animation, whatever state it was left in. */
function replayIcon(node, className) {
  if (!node || prefersReducedMotion()) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

/* The language globe turns a full circle while the strings swap. */
function spinIcon(button) {
  replayIcon(button.querySelector('.ico3d'), 'is-spinning');
}

/* Adding to cart: a sheen across the button, a coin flip of the bag, and
   the badge popping to 1.45x. One gesture, three parts of the same beat. */
function sweep(button) {
  if (prefersReducedMotion()) return;
  button.classList.remove('is-sweeping');
  void button.offsetWidth;
  button.classList.add('is-sweeping');

  var bagBtn = el('bag-btn');
  if (bagBtn) replayIcon(bagBtn.querySelector('.ico3d'), 'is-coin');

  var badge = el('bag-badge');
  if (badge) {
    badge.classList.remove('is-popping');
    void badge.offsetWidth;
    badge.classList.add('is-popping');
  }
}

/* --- 8. Brew recipe block ---------------------------------------------- */

var STEP_TEXT = {
  filter: [
    {
      en: 'Rinse the <a href="product.html?id=filter-papers">paper</a> in the <a href="product.html?id=dripper-v60">dripper</a>, add grounds, level the bed.',
      ar: 'اغسل <a href="product.html?id=filter-papers">الورقة</a> داخل <a href="product.html?id=dripper-v60">القمع</a>، أضف البنّ، وسوِّ السطح.'
    },
    {
      en: 'The bloom. Twice the coffee’s weight in water from the <a href="product.html?id=gooseneck-kettle">kettle</a>.',
      ar: 'التفتّح. ضعف وزن البنّ ماءً من <a href="product.html?id=gooseneck-kettle">الغلاية</a>.'
    },
    {
      en: 'Pour in slow spirals, keep the bed flat.',
      ar: 'اصبب بلوالب بطيئة، وابقِ سطح البنّ مستوياً.'
    },
    {
      en: 'Final pour — watch the <a href="product.html?id=digital-scale">scale</a>, drawdown by then.',
      ar: 'الصبّة الأخيرة — راقب <a href="product.html?id=digital-scale">الميزان</a>، ويكتمل التصريف عندها.'
    }
  ],
  press: [
    {
      en: 'Coarse grind straight into a warmed press, level it.',
      ar: 'طحن خشن مباشرة في مكبس مسخَّن، وسوِّ السطح.'
    },
    {
      en: 'The bloom. Twice the coffee’s weight in water, stir once.',
      ar: 'التفتّح. ضعف وزن البنّ ماءً، وحرّك مرة واحدة.'
    },
    {
      en: 'Fill to the top from the <a href="product.html?id=gooseneck-kettle">kettle</a>, lid on, do not plunge.',
      ar: 'أكمل حتى الأعلى من <a href="product.html?id=gooseneck-kettle">الغلاية</a>، ضع الغطاء، ولا تكبس.'
    },
    {
      en: 'Skim the crust, wait, then pour off the <a href="product.html?id=glass-server">server</a> without pressing.',
      ar: 'أزل القشرة، انتظر، ثم صبّ في <a href="product.html?id=glass-server">الدورق</a> بلا كبس.'
    }
  ],
  espresso: [
    {
      en: 'Grind fine on the <a href="product.html?id=electric-grinder">grinder</a>, distribute, tamp level.',
      ar: 'اطحن ناعماً على <a href="product.html?id=electric-grinder">المطحنة</a>، وزّع، واكبس مستوياً.'
    },
    {
      en: 'Pre-infusion at low pressure. First drops should fall by 0:08.',
      ar: 'نقع مسبق بضغط منخفض. تظهر أول القطرات عند 0:08.'
    },
    {
      en: 'Full 9 bar. The stream should run like warm honey.',
      ar: 'ضغط كامل 9 بار. يجري السائل كعسل دافئ.'
    },
    {
      en: 'Stop on the <a href="product.html?id=digital-scale">scale</a>, not on the clock.',
      ar: 'أوقف الجرعة على <a href="product.html?id=digital-scale">الميزان</a>، لا على الساعة.'
    }
  ]
};

/* Four steps, generated from the recipe's real numbers. */
function brewStepsFor(recipe) {
  var text = STEP_TEXT[recipe.method] || STEP_TEXT.filter;
  var grams = t(WORDS.grams);

  if (recipe.method === 'espresso') {
    return [
      { time: '0:00',      weight: recipe.dose + ' ' + grams, desc: text[0] },
      { time: '0:00–0:08', weight: '3 ' + t(WORDS.bar),        desc: text[1] },
      { time: '0:08–0:22', weight: '25 ' + grams,             desc: text[2] },
      { time: '0:22–' + recipe.total, weight: recipe.yield + ' ' + grams, desc: text[3] }
    ];
  }

  if (recipe.method === 'press') {
    return [
      { time: '0:00',      weight: recipe.dose + ' ' + grams,  desc: text[0] },
      { time: '0:00–0:30', weight: recipe.bloom + ' ' + grams, desc: text[1] },
      { time: '0:30–4:00', weight: recipe.water + ' ' + grams, desc: text[2] },
      { time: '4:00–' + recipe.total, weight: Math.round(recipe.water * 0.92) + ' ' + grams, desc: text[3] }
    ];
  }

  var mid = Math.round(recipe.water * 0.6);
  return [
    { time: '0:00',      weight: recipe.dose + ' ' + grams,  desc: text[0] },
    { time: '0:00–0:30', weight: recipe.bloom + ' ' + grams, desc: text[1] },
    { time: '0:30–1:30', weight: mid + ' ' + grams,          desc: text[2] },
    { time: '1:30–' + recipe.total, weight: recipe.water + ' ' + grams, desc: text[3] }
  ];
}

function metaCell(label, value, measurement) {
  return '<div><span class="eyebrow">' + esc(t(label)) + '</span>' +
         '<span class="value">' + (measurement ? ltr(value) : esc(value)) + '</span></div>';
}

function brewBlockHTML(recipe, title, note) {
  var steps = brewStepsFor(recipe);
  var stepHTML = '';
  for (var i = 0; i < steps.length; i++) {
    stepHTML +=
      '<div class="brew-step">' +
        '<span class="brew-time">' + esc(steps[i].time) + '</span>' +
        '<span class="brew-weight">' + esc(steps[i].weight) + '</span>' +
        '<span class="brew-desc">' + t(steps[i].desc) + '</span>' +
      '</div>';
  }

  /* Truncated, not rounded — 250 g over 15 g is how we write it: 1:16.6 */
  var ratio = '1:' + (Math.floor((recipe.water / recipe.dose) * 10) / 10).toFixed(1);
  var grams = t(WORDS.grams);

  var degrees = t(WORDS.degrees);

  var meta =
    metaCell(WORDS.dose, recipe.dose + ' ' + grams, true) +
    metaCell(recipe.method === 'espresso' ? WORDS.yieldW : WORDS.water, recipe.water + ' ' + grams, true) +
    metaCell(WORDS.tempW, recipe.temp + ' ' + degrees, true) +
    metaCell(WORDS.grind, t(recipe.grind)) +
    metaCell(WORDS.totalTime, recipe.total, true);

  var foot =
    '<span>' + esc(t(WORDS.ratio)) + ' ' + ltr(ratio) + '</span>' +
    (recipe.bloomTime ? '<span>' + esc(t(WORDS.bloomS)) + ' ' + ltr(recipe.bloomTime + ' ' + t(WORDS.seconds)) + '</span>' : '') +
    '<span>' + ltr(recipe.temp + ' ' + degrees) + '</span>';

  return '' +
    '<div class="brew"' + (recipe.id ? ' id="brew-' + esc(recipe.id) + '"' : '') + '>' +
      '<div class="brew-head">' +
        '<span class="brew-method">' + esc(t(recipe.methodName)) + '</span>' +
        '<span class="brew-title">' + esc(title) + '</span>' +
      '</div>' +
      '<div class="brew-meta">' + meta + '</div>' +
      '<div class="brew-steps">' + stepHTML + '</div>' +
      '<div class="brew-foot">' + foot + '</div>' +
    '</div>' +
    (note ? '<p class="brew-note note">' + esc(t(note)) + '</p>' : '');
}

function initBrewGuides() {
  var host = el('guides-host');
  if (!host) return;

  function paint() {
    var html = '';
    for (var i = 0; i < BREW_GUIDES.length; i++) {
      var guide = BREW_GUIDES[i];
      html +=
        '<section class="section block-tight reveal" id="' + esc(guide.id) + '">' +
          '<div class="section-label">' +
            '<span class="eyebrow">' + esc(t(guide.methodName)) + '</span>' +
            '<h2>' + esc(t(guide.title)) + '</h2>' +
            '<p class="note">' + esc(t(guide.note)) + '</p>' +
          '</div>' +
          '<div>' + brewBlockHTML(guide, t(guide.title)) + '</div>' +
        '</section>';
    }
    host.innerHTML = html;
    I18N.apply(host);
    Motion.observe(host);
  }

  document.addEventListener('bloom:lang', paint);
  paint();
}

/* --- 9. Café ------------------------------------------------------------ */

function initCafe() {
  var host = el('cafe-host');
  if (!host) return;

  function paint() {
    var address = t(CAFE.address);
    var lines = '';
    for (var i = 0; i < address.length; i++) lines += '<span>' + esc(address[i]) + '</span>';

    var hours = '';
    for (var j = 0; j < CAFE.hours.length; j++) {
      hours += '<tr><th scope="row">' + esc(t(CAFE.hours[j].day)) + '</th>' +
               '<td>' + esc(CAFE.hours[j].time) + '</td></tr>';
    }

    var bar = '';
    for (var k = 0; k < CAFE.bar.length; k++) {
      bar += '<li><span class="what">' + esc(t(CAFE.bar[k].what)) + '</span>' +
             '<span class="detail">' + esc(t(CAFE.bar[k].detail)) + '</span></li>';
    }

    el('cafe-address').innerHTML = lines +
      '<span class="mono note">' + esc(CAFE.phone) + '</span>';
    el('cafe-hours').innerHTML = hours;
    el('cafe-bar').innerHTML = bar;
    I18N.apply(host);
  }

  document.addEventListener('bloom:lang', paint);
  paint();
}

/* --- 10. Cart page ----------------------------------------------------- */

function initCartPage() {
  var host = el('cart-host');
  if (!host) return;

  function paint() {
    el('cart-lines').innerHTML = lineItemsHTML(Cart.items());
    el('cart-total').innerHTML = money(Cart.subtotal());
    I18N.apply(host);
  }

  host.addEventListener('click', onCartClick);
  el('cart-checkout').addEventListener('click', function () {
    var notice = el('cart-notice');
    notice.hidden = false;
    I18N.apply(notice);
  });

  document.addEventListener('bloom:cart', paint);
  document.addEventListener('bloom:lang', paint);
  document.addEventListener('bloom:catalogue', paint);
  paint();
}

/* --- 11. Bloom timer ---------------------------------------------------
   Thirty seconds: the ring fills, the circle swells on a sine curve and
   settles. The only real animation on the site.
   ----------------------------------------------------------------------- */

var TIMER_WORDS = {
  start:   { en: 'Start the bloom', ar: 'ابدأ التفتّح' },
  reset:   { en: 'Reset', ar: 'إعادة' },
  waiting: { en: '30 seconds of swelling grounds, releasing CO₂.', ar: '٣٠ ثانية يتفتّح فيها البنّ ويطلق ثاني أكسيد الكربون.' },
  running: { en: 'Grounds swelling — keep the pour off.', ar: 'البنّ يتفتّح — أوقف الصبّ.' },
  done:    { en: 'Bloom finished. Pour on, drawdown by 2:45.', ar: 'انتهى التفتّح. تابع الصبّ، ويكتمل التصريف عند 2:45.' }
};

function initTimer() {
  var figure = el('bloom-timer');
  if (!figure) return;

  var DURATION = 30000;
  var ring = el('timer-ring');
  var bubble = el('timer-bubble');
  var count = el('timer-count');
  var button = el('timer-btn');
  var caption = el('timer-caption');

  var radius = Number(ring.getAttribute('r'));
  var circumference = 2 * Math.PI * radius;
  ring.style.strokeDasharray = circumference.toFixed(2);
  ring.style.strokeDashoffset = circumference.toFixed(2);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var startedAt = 0;
  var frame = 0;
  var running = false;

  function setCaption(words) {
    caption.setAttribute('data-en', words.en);
    caption.setAttribute('data-ar', words.ar);
    I18N.apply(caption);
  }
  function setButton(words) {
    button.setAttribute('data-en', words.en);
    button.setAttribute('data-ar', words.ar);
    I18N.apply(button);
  }

  function paint(progress) {
    ring.style.strokeDashoffset = (circumference * (1 - progress)).toFixed(2);
    count.textContent = Math.ceil(30 - progress * 30);
    /* r sweeps 26 → 36 → 26 across the thirty seconds */
    var r = reduce.matches ? 26 : 26 + 10 * Math.sin(Math.PI * progress);
    bubble.setAttribute('r', r.toFixed(2));
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(frame);
  }

  function reset() {
    stop();
    paint(0);
    count.textContent = '30';
    setButton(TIMER_WORDS.start);
    setCaption(TIMER_WORDS.waiting);
  }

  function tick(now) {
    var elapsed = now - startedAt;
    var progress = Math.min(elapsed / DURATION, 1);
    paint(progress);
    if (progress < 1) {
      frame = window.requestAnimationFrame(tick);
    } else {
      running = false;
      count.textContent = '0';
      setButton(TIMER_WORDS.start);
      setCaption(TIMER_WORDS.done);
    }
  }

  button.addEventListener('click', function () {
    if (running) { reset(); return; }
    running = true;
    startedAt = window.performance ? window.performance.now() : Date.now();
    setButton(TIMER_WORDS.reset);
    setCaption(TIMER_WORDS.running);
    frame = window.requestAnimationFrame(tick);
  });

  reset();
}

/* --- 12. Motion ---------------------------------------------------------
   Reveal and page-transition classes are added here, never in the markup,
   so a visitor with JavaScript off gets the whole page, fully readable.
   ----------------------------------------------------------------------- */

var Motion = (function () {
  var observer = null;
  var STAGGER = 60;   /* ms between items entering together */

  /* The delay must be set before the class, and must survive it — an
     earlier version cleared it here and the stagger never played. */
  function revealNow(node, delayMs) {
    node.style.transitionDelay = delayMs ? delayMs + 'ms' : '';
    node.classList.add('is-revealed');
  }

  function revealAll() {
    var pending = document.querySelectorAll('.reveal:not(.is-revealed)');
    for (var i = 0; i < pending.length; i++) revealNow(pending[i]);
  }

  /* Position among its reveal siblings, so a row of cards enters in order. */
  function staggerIndex(node) {
    var parent = node.parentNode;
    if (!parent) return 0;
    var siblings = parent.querySelectorAll(':scope > .reveal');
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] === node) return Math.min(i, 8);
    }
    return 0;
  }

  function observe(root) {
    if (!observer) return;
    var nodes = (root || document).querySelectorAll('.reveal:not(.is-revealed)');
    for (var i = 0; i < nodes.length; i++) observer.observe(nodes[i]);
  }

  function initReveals() {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-reveal');

    observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var node = entries[i].target;
        revealNow(node, staggerIndex(node) * STAGGER);
        observer.unobserve(node);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });

    observe(document);

    /* Safety net: nothing stays invisible because an observer never fired. */
    window.setTimeout(revealAll, 3000);
  }

  /* Fade <main> out, then navigate. Same-document and external links pass
     straight through untouched. */
  function initPageTransitions() {
    if (prefersReducedMotion()) return;
    document.documentElement.classList.add('js-page');

    document.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = event.target.closest ? event.target.closest('a[href]') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (/^[a-z]+:/i.test(href) && href.indexOf('.html') === -1) return;
      if (link.origin && link.origin !== window.location.origin) return;

      /* Same page, only the query changing, is still a navigation we
         animate. The room starts turning now, over 700ms, while the old
         view fades out over 320ms — so the next page opens mid-flight. */
      event.preventDefault();
      Room.flyTo(href);
      var main = document.querySelector('main');
      if (main) main.classList.add('is-leaving');
      window.setTimeout(function () { window.location.href = href; }, ms('--t-slow'));
    });
  }

  function init() {
    initPageTransitions();
    initReveals();
  }

  return { init: init, observe: observe, revealAll: revealAll };
})();

/* --- 13. Cursor tilt ----------------------------------------------------
   Tilt is written as two custom properties; the hover lift stays in CSS so
   the two never overwrite each other's transform.
   ----------------------------------------------------------------------- */

function initTilt(root) {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var nodes = (root || document).querySelectorAll('[data-tilt]');

  for (var i = 0; i < nodes.length; i++) {
    (function (node) {
      /* data-tilt carries the maximum angle: 14deg for cards, 8 for pills */
      var max = parseFloat(node.getAttribute('data-tilt')) || 14;
      node.addEventListener('pointermove', function (event) {
        var box = node.getBoundingClientRect();
        var px = (event.clientX - box.left) / box.width - 0.5;
        var py = (event.clientY - box.top) / box.height - 0.5;
        node.style.setProperty('--tilt-y', (px * max).toFixed(2) + 'deg');
        node.style.setProperty('--tilt-x', (-py * max).toFixed(2) + 'deg');
      });
      node.addEventListener('pointerleave', function () {
        node.style.setProperty('--tilt-y', '0deg');
        node.style.setProperty('--tilt-x', '0deg');
      });
    })(nodes[i]);
  }
}

/* --- 13b. The background room -------------------------------------------
   Injected before anything else so it is behind everything else. The
   canvas takes no pointer events; the veil carries legibility; every page
   is a station in the same room.
   ----------------------------------------------------------------------- */

var Room = (function () {
  var instance = null;

  function backgroundHTML() {
    return '<canvas id="bgfx" aria-hidden="true"></canvas>' +
           '<div class="veil" aria-hidden="true"></div>';
  }

  /* Which station a link leads to, so the room can start turning before
     the navigation happens. */
  function stationFor(href) {
    var file = String(href).split('?')[0].split('#')[0].split('/').pop() || 'index.html';
    var key = file.replace(/\.html$/, '');
    if (!key) key = 'index';
    return Scene.stations && Scene.stations[key] ? key : 'index';
  }

  function init(page) {
    document.body.insertAdjacentHTML('afterbegin', backgroundHTML());
    var canvas = el('bgfx');
    if (!canvas || !window.Scene) return;

    /* No WebGL, no problem: the canvas stays empty and the two gradients
       in .veil carry the background on their own. */
    instance = Scene.room(canvas, { station: Scene.stations[page] ? page : 'index' });
  }

  function flyTo(href) {
    if (instance) instance.flyTo(stationFor(href));
  }

  return {
    init: init,
    flyTo: flyTo,
    stationFor: stationFor,
    get current() { return instance; }
  };
})();

/* --- 14. The foreground rigs --------------------------------------------
   Every canvas host is a .scene element carrying data-model, data-mode and
   data-fallback. If Three.js or WebGL is missing, the flat illustration
   named by data-fallback takes its place and the page stays fully usable.
   ----------------------------------------------------------------------- */

function sceneFallback(host) {
  var src = host.getAttribute('data-fallback');
  if (!src) return;
  host.innerHTML = '<div class="scene-fallback">' +
    '<img src="' + esc(src) + '" alt="' + esc(t(WORDS.rigAlt)) + '">' +
    '</div>';
}

function initScenes(root) {
  var hosts = (root || document).querySelectorAll('.scene');
  for (var i = 0; i < hosts.length; i++) {
    var host = hosts[i];
    if (host.getAttribute('data-mounted') === 'true') continue;
    host.setAttribute('data-mounted', 'true');
    var mounted = false;

    if (window.Scene && Scene.supported()) {
      mounted = !!Scene.mount(host, {
        model: host.getAttribute('data-model') || 'v60',
        mode: host.getAttribute('data-mode') || 'auto'
      });
      /* mount() clears the host, so the hint is added after it, not before */
      if (mounted && host.getAttribute('data-mode') === 'drag') {
        var hint = document.createElement('span');
        hint.className = 'scene-hint';
        hint.setAttribute('data-en', WORDS.dragHint.en);
        hint.setAttribute('data-ar', WORDS.dragHint.ar);
        hint.textContent = t(WORDS.dragHint);
        host.appendChild(hint);
      }
    }
    if (!mounted) sceneFallback(host);
  }
}

/* --- 15. Login page ----------------------------------------------------- */

/* --- The door: sign in, or create an account ---------------------------
   Both panels live in one card and share one leaving animation. Every
   message is inline and bilingual — no alert(), ever.

   The important change from the first version of this file: nothing here
   decides whether a password is right. It asks the server, waits, and
   reports what came back. A typo and a wrong password are now genuinely
   different outcomes, because there is finally something to be wrong
   against. */
function initLogin() {
  var card = el('login-card');
  if (!card) return;

  var tabs   = card.querySelector('.auth-tabs');
  var panel  = { signin: el('signin-form'), signup: el('signup-form') };
  var tab    = { signin: el('tab-signin'),  signup: el('tab-signup') };
  var msgFor = { signin: el('signin-msg'),  signup: el('signup-msg') };

  /* One map from an Auth reason to what the visitor reads and where the
     cursor lands. Keeping it in one place means a reason can never be
     handled in sign-in and forgotten in sign-up. */
  var MESSAGES = {
    noName:        { words: WORDS.noName,     focus: 'signup-name' },
    noEmail:       { words: WORDS.noEmail,    focus: '-email' },
    badEmail:      { words: WORDS.badEmail,   focus: '-email' },
    noPassword:    { words: WORDS.noPassword, focus: '-password' },
    shortPassword: { words: WORDS.shortPass,  focus: '-password' },
    badCredentials:{ words: WORDS.badCreds,   focus: '-password' },
    notConfirmed:  { words: WORDS.notConfirm, focus: '-email' },
    exists:        { words: WORDS.acctExists, focus: '-email' },
    rateLimit:     { words: WORDS.rateLimit,  focus: null },
    offline:       { words: WORDS.offlineMsg, focus: null },
    noSignups:     { words: WORDS.noSignups,  focus: null },
    failed:        { words: WORDS.authFailed, focus: null }
  };

  function showMessage(which, words, good) {
    var msg = msgFor[which];
    msg.setAttribute('data-en', words.en);
    msg.setAttribute('data-ar', words.ar);
    msg.classList.toggle('is-good', !!good);
    msg.hidden = false;
    /* restart the rise animation on a repeat failure */
    msg.style.animation = 'none';
    void msg.offsetWidth;
    msg.style.animation = '';
    I18N.apply(msg);
  }

  function clearMessage(which) { msgFor[which].hidden = true; }

  /* Switch panels. The tabs are real tabs, so aria-selected and the
     roving tabindex move with them. */
  function show(which, moveFocus) {
    ['signin', 'signup'].forEach(function (key) {
      var on = key === which;
      panel[key].hidden = !on;
      tab[key].setAttribute('aria-selected', on ? 'true' : 'false');
      tab[key].tabIndex = on ? 0 : -1;
    });
    tabs.setAttribute('data-showing', which);
    if (moveFocus) tab[which].focus();
  }

  ['signin', 'signup'].forEach(function (key) {
    tab[key].addEventListener('click', function () { show(key, false); });
  });

  /* Left and right arrows move between tabs, as a tablist should. */
  tabs.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    var showing = tabs.getAttribute('data-showing') === 'signup' ? 'signup' : 'signin';
    show(showing === 'signin' ? 'signup' : 'signin', true);
    event.preventDefault();
  });

  /* The "no account yet? / already a customer?" links under each form. */
  card.addEventListener('click', function (event) {
    var swap = event.target.closest ? event.target.closest('[data-goto]') : null;
    if (!swap) return;
    var which = swap.getAttribute('data-goto');
    show(which, false);
    var first = el(which === 'signup' ? 'signup-name' : 'signin-email');
    if (first) first.focus();
  });

  /* The card fades while the camera pushes forward through the dripper.
     The film then plays over the home page as it arrives. */
  function leaveTo(href) {
    if (window.Film) Film.setPending();
    Room.flyTo(href);
    card.classList.add('is-leaving');
    window.setTimeout(function () { window.location.href = href; }, ms('--t-slow'));
  }

  /* A submit that has to wait for a network round trip. The label says
     so and the button stops taking clicks, which is all a visitor needs
     — a spinner here would be a second thing moving on a screen that
     already has a dripper turning behind it. */
  function busy(button, words) {
    button.setAttribute('aria-busy', 'true');
    button.setAttribute('data-en', words.en);
    button.setAttribute('data-ar', words.ar);
    I18N.apply(button);
  }
  function idle(button, words) {
    button.removeAttribute('aria-busy');
    button.setAttribute('data-en', words.en);
    button.setAttribute('data-ar', words.ar);
    I18N.apply(button);
  }

  function fail(which, reason) {
    var problem = MESSAGES[reason] || MESSAGES.failed;
    showMessage(which, problem.words);
    if (!problem.focus) return;
    /* A focus target starting with "-" belongs to whichever panel is
       showing, so one entry covers both forms. */
    var target = el(problem.focus.charAt(0) === '-' ? which + problem.focus : problem.focus);
    if (target) target.focus();
  }

  /* ---- sign in ---- */
  panel.signin.addEventListener('submit', function (event) {
    event.preventDefault();
    var button = el('signin-submit');
    if (button.getAttribute('aria-busy') === 'true') return;

    clearMessage('signin');
    busy(button, WORDS.signingIn);

    Auth.signIn(el('signin-email').value, el('signin-password').value)
      .then(function (result) {
        if (result.ok) { leaveTo('index.html'); return; }
        idle(button, WORDS.signIn);
        fail('signin', result.reason);
      });
  });

  /* ---- create an account ---- */
  panel.signup.addEventListener('submit', function (event) {
    event.preventDefault();
    var button = el('signup-submit');
    if (button.getAttribute('aria-busy') === 'true') return;

    clearMessage('signup');
    busy(button, WORDS.creating);

    Auth.signUp(el('signup-name').value, el('signup-email').value, el('signup-password').value)
      .then(function (result) {
        if (result.ok && result.signedIn) { leaveTo('index.html'); return; }

        idle(button, WORDS.createAcct);

        if (result.ok) {
          /* Created, but the project is set to confirm the address
             first. Say so on the sign-in panel, carrying the email
             across, because that is where they have to come back to. */
          el('signin-email').value = el('signup-email').value;
          el('signup-password').value = '';
          show('signin', false);
          showMessage('signin', WORDS.checkEmail, true);
          return;
        }

        /* An address that is already taken belongs on the other panel:
           the next thing to do is sign in, not fix the form. */
        if (result.reason === 'exists') {
          el('signin-email').value = el('signup-email').value;
          show('signin', false);
          showMessage('signin', WORDS.acctExists);
          el('signin-password').focus();
          return;
        }

        fail('signup', result.reason);
      });
  });

  /* Guests get in too — same fade, no account, no network. */
  el('guest-link').addEventListener('click', function (event) {
    event.preventDefault();
    Auth.signInAsGuest();
    leaveTo('index.html');
  });

  /* The login page has no header, so it carries its own two controls. */
  el('theme-btn').addEventListener('click', function () { Theme.toggle(); });
  el('lang-btn').addEventListener('click', function () {
    spinIcon(this);
    I18N.toggle();
  });
  paintLoginControls();
  document.addEventListener('bloom:lang', paintLoginControls);

  show('signin', false);
}

function paintLoginControls() {
  var lang = el('lang-btn');
  if (!lang) return;
  lang.innerHTML = icon('lang-globe' && 'globe', 'lang-globe') +
    '<span class="lang-label"' + bi(WORDS.langLabel) + '>' + esc(t(WORDS.langLabel)) + '</span>';
  I18N.apply(lang);
  Theme.paintButton();
}

/* --- 16. Home page pieces ---------------------------------------------- */

function initHome() {
  var featured = el('featured-beans');
  if (!featured) return;

  function paint() {
    var beans = byCategory('beans');
    var html = '';
    for (var i = 0; i < beans.length; i++) html += cardHTML(beans[i]);
    featured.innerHTML = html;

    var tools = byCategory('tools');
    var strip = '';
    for (var j = 0; j < tools.length; j++) {
      strip +=
        '<div class="reveal card-slot"><a class="strip-tile" data-tilt href="product.html?id=' + esc(tools[j].id) + '">' +
          '<span class="tile">' + icon(tools[j].icon) + '</span>' +
          '<span class="strip-tile-name">' + esc(t(tools[j].name)) + '</span>' +
          '<span data-live-price="' + esc(tools[j].id) + '">' + money(tools[j].price) + '</span>' +
        '</a></div>';
    }
    el('tools-strip').innerHTML = strip;

    var hours = '';
    for (var k = 0; k < CAFE.hours.length; k++) {
      hours += '<tr><th scope="row">' + esc(t(CAFE.hours[k].day)) + '</th><td>' + esc(CAFE.hours[k].time) + '</td></tr>';
    }
    el('teaser-hours').innerHTML = hours;

    I18N.apply(el('main'));
    Motion.observe(el('main'));
    initTilt(el('main'));
    Rings.mount(el('main'));
  }

  document.addEventListener('bloom:lang', paint);
  paint();
}

/* --- 13. Boot ---------------------------------------------------------- */

/* ------------------------------------------------------------------
   The catalogue's second pass.

   js/db.js asks Supabase for current prices and stock after the page is
   already drawn, then fires bloom:catalogue if anything moved. This is
   what listens. It rewrites the numbers in place and nothing else — it
   does not re-render a card, a listing or a product page.

   That restraint is the whole design. Re-rendering would tear down the
   3D scenes, restart every flavour ring mid-orbit and cancel reveals
   that are still running, which is a visible glitch in exchange for
   nothing. A price is a few characters; replace the few characters. */
function stockText(product) {
  return product.stock > 8
    ? product.stock + ' ' + t(WORDS.inStock)
    : product.stock + ' ' + t(WORDS.lowStock);
}

function syncCatalogue() {
  var nodes = document.querySelectorAll('[data-live-price]'), i, product;

  for (i = 0; i < nodes.length; i++) {
    /* The product page's own price carries a unit after it and is
       rebuilt whole a few lines down. */
    if (nodes[i].className.indexOf('product-price') > -1) continue;
    product = productById(nodes[i].getAttribute('data-live-price'));
    if (!product) continue;
    /* Only touch the DOM if the number actually differs, so a sync that
       changed one bean does not repaint eighteen prices. */
    if (nodes[i].innerHTML.indexOf(Number(product.price).toFixed(3)) === -1) {
      nodes[i].innerHTML = money(product.price);
    }
  }

  /* The product page carries a unit after its price and a stock
     sentence under it; both are rebuilt from the same helpers the first
     render used, then handed back to I18N so the Arabic copy of the
     number is correct too. */
  nodes = document.querySelectorAll('.product-price[data-live-price]');
  for (i = 0; i < nodes.length; i++) {
    product = productById(nodes[i].getAttribute('data-live-price'));
    if (!product) continue;
    nodes[i].innerHTML = money(product.price) +
      '<span class="note">/ ' + esc(t(product.unit)) + '</span>';
  }

  nodes = document.querySelectorAll('[data-live-stock]');
  for (i = 0; i < nodes.length; i++) {
    product = productById(nodes[i].getAttribute('data-live-stock'));
    if (product) nodes[i].textContent = stockText(product);
  }

  /* The cart holds ids and quantities only and prices them from
     PRODUCTS at render time, so it needs redrawing rather than
     patching — and it must be redrawn, or a bean would be one price on
     its own page and another in the drawer. Its own guard returns
     early when there is no drawer, as on the login page. */
  Drawer.render();

  I18N.apply();
}

/* Is the log available on this page at all? Only some pages load
   js/gahwa.js, and a page that does not is not broken — it just has no
   log to connect to, so every hook below asks first. */
function gahwaOn() { return !!(window.Gahwa && Gahwa.ready()); }

/* --- Where the gahwa log touches the rest of the site -------------------
   Four small hooks and one page. Each is a one-way read from the log into
   somewhere else, never the other direction, and none of them exposes the
   log to anyone but its owner.
   ----------------------------------------------------------------------- */

/* The café page: one button that logs a coffee here, now. The place and
   the time are already known, so this is the fastest entry on the site. */
function initCafeQuickLog() {
  var host = el('cafe-bar');
  if (!host || !gahwaOn()) return;
  var row = document.createElement('p');
  row.className = 'bagline-row';
  row.innerHTML = '<a class="btn btn-primary" href="gahwa-log.html?log=1&place=bloom"' +
                  bi(WORDS.logCupHere) + '>' + esc(t(WORDS.logCupHere)) + '</a>';
  host.parentNode.insertBefore(row, host.nextSibling);
  I18N.apply(row);
}

/* The brew unit: once the V60 has actually finished pouring, a quiet
   offer. It appears once and does not nag — the animation can be replayed
   all afternoon without the link multiplying. */
function initBrewLogLink() {
  var host = el('brew-unit');
  if (!host || !gahwaOn()) return;
  document.addEventListener('bloom:brewed', function () {
    if (el('brew-log-link')) return;
    var link = document.createElement('p');
    link.className = 'bagline-row';
    link.id = 'brew-log-link';
    link.innerHTML = '<a class="guest-link" href="gahwa-log.html?log=1&drink=V60"' +
                     bi(WORDS.logThisCup) + '>' + esc(t(WORDS.logThisCup)) + '</a>';
    host.appendChild(link);
    I18N.apply(link);
  });
}

/* The product page: how much of this bag is left, worked out from the
   doses logged since it was last ordered. A service, not an upsell — it
   only says anything at all once there is something to say, and the
   Reorder button sits next to the number rather than in front of it. */
function initBagTracker(product) {
  if (!product || product.category !== 'beans' || !gahwaOn()) return;
  var host = el('bag-line');
  if (!host) return;

  Gahwa.bagUsage(product.id).then(function (use) {
    if (!use || !use.cups) return;

    /* 250 g a bag, and the unit string is the shop's own. Deliberately
       "about": a dose is what someone typed, not what a scale saw. */
    var bagGrams = 250;
    var left = Math.max(0, bagGrams - use.grams);
    var lines = '<p>' + esc(tf(WORDS.bagBrewed,
      { cups: counted('cups', use.cups), grams: use.grams })) + '</p>';
    lines += '<p>' + esc(left > 15 ? tf(WORDS.bagLeft, { grams: Math.round(left) })
                                   : t(WORDS.bagOut)) + '</p>';
    host.innerHTML = '<div class="bagline">' + lines +
      '<div class="bagline-row">' +
        '<button type="button" class="btn btn-secondary" id="bag-reorder"' + bi(WORDS.reorder) + '>' +
          esc(t(WORDS.reorder)) + '</button>' +
        '<a class="btn btn-quiet" href="gahwa-log.html?log=1&bean=' + esc(product.id) + '"' +
          bi(WORDS.logThisCup) + '>' + esc(t(WORDS.logThisCup)) + '</a>' +
      '</div></div>';
    I18N.apply(host);
    el('bag-reorder').addEventListener('click', function () {
      Cart.add(product.id, 1);
      Drawer.open();
    });
  }, function () { /* no log, no line — nothing to say and nothing broken */ });
}

/* The account page: the same four numbers, a copy of everything, and the
   button that destroys it. */
function initAccountPage() {
  var host = el('account-gahwa');
  if (!host) return;

  var greet = el('account-greet');
  if (greet) greet.textContent = Auth.current() && !Auth.isGuest() ? Auth.current() : '';

  if (!gahwaOn()) {
    host.innerHTML = '<p class="gahwa-none"' + bi(WORDS.logSignedOut) + '>' +
      esc(t(WORDS.logSignedOut)) + '</p>' +
      '<p><a class="guest-link" href="login.html"' + bi(WORDS.goSignIn) + '>' +
      esc(t(WORDS.goSignIn)) + '</a></p>';
    I18N.apply(host);
    return;
  }

  paintAccountStats();
  initAccountData();
}

/* Only the numbers. Kept separate from initAccountData on purpose: after a
   deletion the strip has to be redrawn, and redrawing the whole page would
   destroy the message that says what was just deleted — leaving someone
   who asked to erase their diary with no confirmation that anything
   happened. */
function paintAccountStats() {
  var host = el('account-gahwa');
  if (!host || !gahwaOn()) return;

  Gahwa.load(1).then(function (data) {
    GahwaPage.setData(data);
    host.innerHTML = '<div class="acct-block">' +
      '<h2' + bi(WORDS.gahwaNav) + '>' + esc(t(WORDS.gahwaNav)) + '</h2>' +
      GahwaPage.statStripHTML() +
      '<p class="bagline-row"><a class="guest-link" href="gahwa-log.html"' +
        bi(WORDS.gahwaNav) + '>' + esc(t(WORDS.gahwaNav)) + ' &rarr;</a></p>' +
    '</div>';
    I18N.apply(host);
  }, function () {
    host.innerHTML = '<p class="gahwa-none">' + esc(t(WORDS.loadFailed)) + '</p>';
  });
}

/* Export and delete. Both belong to the customer: one hands the whole log
   over in a form they can keep, the other destroys it on the spot. */
function initAccountData() {
  var host = el('account-data');
  if (!host) return;

  host.innerHTML = '<div class="acct-block">' +
      '<h2' + bi(WORDS.accountData) + '>' + esc(t(WORDS.accountData)) + '</h2>' +
      '<div class="acct-row">' +
        '<button type="button" class="btn btn-secondary" id="dl-csv"' + bi(WORDS.exportCsv) + '>' +
          esc(t(WORDS.exportCsv)) + '</button>' +
        '<button type="button" class="btn btn-secondary" id="dl-json"' + bi(WORDS.exportJson) + '>' +
          esc(t(WORDS.exportJson)) + '</button>' +
      '</div>' +
      '<p class="form-msg" id="dl-msg" hidden role="status"></p>' +
    '</div>' +
    '<div class="acct-block">' +
      '<h2' + bi(WORDS.wipeLog) + '>' + esc(t(WORDS.wipeLog)) + '</h2>' +
      '<p class="acct-warn"' + bi(WORDS.wipeWarn) + '>' + esc(t(WORDS.wipeWarn)) + '</p>' +
      '<label class="acct-check"><input type="checkbox" id="wipe-places">' +
        '<span' + bi(WORDS.wipePlaces) + '>' + esc(t(WORDS.wipePlaces)) + '</span></label>' +
      '<div class="acct-row">' +
        '<button type="button" class="btn btn-danger" id="wipe-log"' + bi(WORDS.wipeDo) + '>' +
          esc(t(WORDS.wipeDo)) + '</button>' +
      '</div>' +
      '<p class="form-msg" id="wipe-msg" hidden role="alert"></p>' +
    '</div>';
  I18N.apply(host);

  /* Built in the browser from rows the customer already has, so the file
     never passes through anyone else on its way to them. */
  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function stamp() { return new Date().toISOString().slice(0, 10); }

  function exportAs(kind) {
    var msg = el('dl-msg');
    msg.hidden = false;
    msg.textContent = t(WORDS.savingCup);
    Gahwa.exportRows().then(function (rows) {
      if (kind === 'csv') download('bloom-gahwa-log-' + stamp() + '.csv',
        Gahwa.toCSV(rows), 'text/csv;charset=utf-8');
      else download('bloom-gahwa-log-' + stamp() + '.json',
        Gahwa.toJSON(rows), 'application/json');
      msg.hidden = true;
    }, function () {
      msg.textContent = t(WORDS.loadFailed);
    });
  }

  el('dl-csv').addEventListener('click', function () { exportAs('csv'); });
  el('dl-json').addEventListener('click', function () { exportAs('json'); });

  el('wipe-log').addEventListener('click', function () {
    var button = this, msg = el('wipe-msg'), alsoPlaces = el('wipe-places').checked;
    button.setAttribute('aria-busy', 'true');
    msg.hidden = false;
    msg.classList.remove('is-good');
    msg.textContent = t(WORDS.savingCup);

    Gahwa.deleteEverything().then(function (result) {
      return (alsoPlaces ? Gahwa.deletePlaces() : Promise.resolve()).then(function () {
        return result;
      });
    }).then(function (result) {
      button.removeAttribute('aria-busy');
      if (result.photoError) {
        msg.textContent = t(WORDS.photoLeft);
        return;
      }
      msg.classList.add('is-good');
      msg.textContent = result.entries
        ? tf(WORDS.wipeDone, { entries: counted('entries', result.entries),
                               photos: counted('photos', result.photos) })
        : t(WORDS.wipeNothing);
      paintAccountStats();
    })['catch'](function () {
      button.removeAttribute('aria-busy');
      msg.textContent = t(WORDS.loadFailed);
    });
  });
}

function boot() {
  var page = document.body.getAttribute('data-page') || '';

  /* No session? Straight to the front door, before anything else renders. */
  if (Auth.guard()) return;

  /* The background room comes first, because everything else sits on it. */
  Room.init(page);

  /* The login page is full-screen and deliberately has no header, footer
     or cart drawer. Every other page gets all three, built right here so
     they cannot drift apart. */
  if (page !== 'login') {
    document.body.insertAdjacentHTML('afterbegin', headerHTML(page));
    document.body.insertAdjacentHTML('beforeend', footerHTML() + drawerHTML());

    initHeader();
    Drawer.init();

    document.addEventListener('bloom:cart', function () { syncBadge(); Drawer.render(); });
    document.addEventListener('bloom:lang', function () {
      syncBadge(); syncAccount(); Drawer.render(); Theme.paintButton();
      Rings.mount(document);
    });
  }

  Motion.init();
  Rings.mount(document);   /* the header's bean rows carry rings too */

  /* The opening film, over the home page as it arrives — once per session,
     never under reduced motion, always skippable. */
  if (page === 'home' && window.Film && Film.takePending()) Film.play();

  initLogin();
  initHome();
  initListing(page === 'beans' || page === 'tools' || page === 'machines' ? page : '');
  initProductPage();
  initBrewGuides();
  initCafe();
  initCafeQuickLog();
  initBrewLogLink();
  if (window.GahwaPage) GahwaPage.init();
  initAccountPage();
  initCartPage();
  initTimer();
  initScenes();
  if (window.Brew) window.__brew = Brew.init(el('brew-unit'));

  I18N.apply();
  syncBadge();
  syncAccount();
  initTilt(document);

  /* Last, and deliberately not awaited: ask the database whether these
     prices are still true. Everything above has already rendered from
     the catalogue shipped in js/data.js, so a slow or absent network
     costs the visitor nothing. */
  document.addEventListener('bloom:catalogue', syncCatalogue);
  document.addEventListener('bloom:lang', syncCatalogue);
  if (window.DB) DB.sync();

  /* And ask the auth server whether this session is still a session.
     guard() above only checked that one exists, which is all it can do
     synchronously; this renews a stale token, and sends the visitor back
     to the door if the server has actually rejected it. */
  if (page !== 'login') {
    Auth.verify().then(function (valid) {
      if (!valid) window.location.replace('login.html');
      else syncAccount();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
