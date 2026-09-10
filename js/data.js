/* ==========================================================================
   Bloom — catalogue and content
   Plain script, no modules, so the site runs straight off the file system.
   Everything a visitor can read exists as an { en, ar } pair.
   ========================================================================== */

/* --- Line icons ---------------------------------------------------------
   One 24x24 grid and one stroke weight (2.2, set in CSS) for all of them.
   The gear icons are the same paths as the illustrations in assets/.
   ----------------------------------------------------------------------- */
var ICONS = {
  dripper     : '<path d="M3.2 5.6h17.6l-6.4 10.8h-4.8z"/><path d="M7.6 9.4h8.8"/><path d="M12 16.4V20"/><path d="M9 20h6"/>',
  paper       : '<path d="M5.4 4h13.2l-6.6 16z"/><path d="M12 4v16"/><path d="M8 9.6h8"/>',
  grinder     : '<path d="M7 10.2h10v7.6a2.2 2.2 0 0 1-2.2 2.2H9.2A2.2 2.2 0 0 1 7 17.8z"/><path d="M6.2 10.2h11.6"/><path d="M7 14.4h10"/><path d="M12 10.2V5.4"/><path d="M12 5.4h3.4"/><circle cx="16.2" cy="6.6" r="1.3"/>',
  kettle      : '<path d="M4 10.4h9.6v7.2a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 17.6z"/><path d="M5.8 10.4V8.4h6v2"/><path d="M13.6 12.4c3.6-.8 5.8-3 5.8-6.4"/><path d="M19.4 6c0-1.4-1.2-2.6-2.6-2.6"/>',
  scale       : '<path d="M3.4 9.4h17.2v8.6a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z"/><path d="M6.4 9.4V7.2h11.2v2.2"/><path d="M6.6 13.8h5.2"/><circle cx="17" cy="14" r="1.4"/>',
  thermometer : '<path d="M12 3.6a1.9 1.9 0 0 1 1.9 1.9v8.2a3.6 3.6 0 1 1-3.8 0V5.5A1.9 1.9 0 0 1 12 3.6z"/><path d="M15.8 7.2h2.4"/><path d="M15.8 10.4h2.4"/>',
  server      : '<path d="M6.2 4h11.6l-1.4 14.8a2 2 0 0 1-2 1.8H9.6a2 2 0 0 1-2-1.8z"/><path d="M7.6 13.6h8.8"/><path d="M7.2 9.4h9.6"/>',
  espresso    : '<path d="M3.4 4.2h17.2v8.4H3.4z"/><path d="M8 12.6v2.8h8v-2.8"/><path d="M10 15.4h4v4.4h-4z"/><path d="M9 19.8h6"/><circle cx="7" cy="8.4" r="1.4"/><path d="M12.6 8.4h5"/>',
  brewer      : '<path d="M4.2 3.8h12.4v5.2H4.2z"/><path d="M10.4 9v3"/><path d="M6 12h9l-1.2 8.2H7.2z"/><path d="M16.6 4.8h3.2v4.2h-3.2"/>',
  burr        : '<path d="M8.2 3.6h7.6l-1 4.8H9.2z"/><path d="M6.2 8.4h11.6v5.6H6.2z"/><path d="M9.2 14v3.2h5.6V14"/><path d="M10 20.2h4"/><circle cx="12" cy="11.2" r="1.6"/>',

  /* interface */
  globe       : '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4c2.4 2.4 3.6 5.4 3.6 8.6s-1.2 6.2-3.6 8.6c-2.4-2.4-3.6-5.4-3.6-8.6S9.6 5.8 12 3.4z"/>',
  sun         : '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>',
  moon        : '<path d="M20 14.2A8.4 8.4 0 0 1 9.8 4 8.6 8.6 0 1 0 20 14.2z"/>',
  bag         : '<path d="M5.4 7.6h13.2l1 12.2a1.6 1.6 0 0 1-1.6 1.8H6a1.6 1.6 0 0 1-1.6-1.8z"/><path d="M8.8 7.6V6.2a3.2 3.2 0 0 1 6.4 0v1.4"/>',
  chevron     : '<path d="M4.6 8.6 12 15.4l7.4-6.8"/>',
  menu        : '<path d="M3.6 6.4h16.8M3.6 12h16.8M3.6 17.6h16.8"/>',
  close       : '<path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
  pin         : '<path d="M12 21.2s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  user        : '<circle cx="12" cy="8.4" r="3.8"/><path d="M4.8 20.4c.7-3.8 3.7-6 7.2-6s6.5 2.2 7.2 6"/>',
  clock       : '<circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.4l3.6 2.2"/>',
  drop        : '<path d="M12 3.2s6 6.4 6 10.4a6 6 0 0 1-12 0c0-4 6-10.4 6-10.4z"/>'
};

/* --- The 3D icon ---------------------------------------------------------
   No icon on this site is a flat sticker. Each is the same line art drawn
   three times on separate Z planes inside a preserve-3d tile, so a hover
   parts the plates and gives real parallax rather than a painted shadow.
   Pure CSS transforms: no WebGL, no library, no download.
   ------------------------------------------------------------------------ */
function icon(name, cls) {
  var d = ICONS[name] || '';
  var plate = function (layer) {
    return '<svg viewBox="0 0 24 24" class="' + layer + '" aria-hidden="true" focusable="false">' + d + '</svg>';
  };
  return '<span class="ico3d ' + (cls || '') + '" aria-hidden="true">' +
           '<span class="layers">' + plate('l1') + plate('l2') + plate('l3') + '</span>' +
         '</span>';
}

/* The theme control needs two faces on one tile, swapping mid-turn. */
function flipIcon(frontName, backName, cls) {
  var face = function (name, side) {
    return '<span class="face ' + side + '">' +
             '<svg viewBox="0 0 24 24" class="l1" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>' +
             '<svg viewBox="0 0 24 24" class="l2" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>' +
             '<svg viewBox="0 0 24 24" class="l3" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>' +
           '</span>';
  };
  return '<span class="ico3d ico-flip ' + (cls || '') + '" aria-hidden="true">' +
           '<span class="layers">' + face(frontName, 'front') + face(backName, 'back') + '</span>' +
         '</span>';
}


/* --- Flavour notes -------------------------------------------------------
   Every note has one glyph and one colour. Twelve base glyphs are reused
   across the whole set, so the icons read as one family rather than thirty
   unrelated drawings.

   These colours are the one place the palette opens up past the five brand
   colours. They belong to the fruit, not to the brand: they live inside the
   discs of a flavour ring and never leak into a button, a tag or any type.
   ------------------------------------------------------------------------ */

var GLYPHS = {
  /* solid shapes, drawn on a 24 grid, filled in the note's colour */
  flower: '<path d="M12 3.4c1.5 0 2.6 1.2 2.6 2.7 0 .5-.1 1-.4 1.4 1.4-.5 3 .1 3.5 1.5.5 1.4-.2 3-1.6 3.5.4.3.8.7 1 1.2.6 1.4 0 3-1.4 3.6-1.3.6-2.9 0-3.6-1.3-.3.5-.7.9-1.2 1.1-1.4.6-3 0-3.6-1.4-.5-1.3.1-2.8 1.3-3.4-1.4-.4-2.2-1.9-1.8-3.3.4-1.4 1.9-2.3 3.3-1.9-.2-.4-.3-.8-.3-1.2 0-1.5 1.2-2.7 2.7-2.7z"/><circle cx="12" cy="12.4" r="2.1" fill="#fff" fill-opacity=".55"/>',
  stone:  '<path d="M12 6.6c3.6 0 6.4 2.7 6.4 6.2S15.6 20 12 20s-6.4-2.7-6.4-7.2S8.4 6.6 12 6.6z"/><path d="M12.4 6.7c.2-1.8 1.7-3.2 3.6-3.4-.2 1.9-1.6 3.3-3.6 3.4z"/><path d="M11.4 12.6c-.7-1.5-.4-3.2.7-4.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/>',
  berry:  '<circle cx="8.9" cy="14.6" r="4.3"/><circle cx="15.6" cy="15.6" r="3.5"/><path d="M9 10.4c0-2.4.9-4.4 2.6-5.8M15.7 12.1c.4-1.7 1.4-3 2.9-3.8" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" stroke-linecap="round"/>',
  apple:  '<path d="M12 7.2c2 0 2.6-.9 4.1-.9 2.2 0 3.9 2.1 3.9 5.1 0 3.6-2.6 8-5.2 8-1.2 0-1.8-.6-2.8-.6s-1.6.6-2.8.6C6.6 19.4 4 15 4 11.4c0-3 1.7-5.1 3.9-5.1 1.5 0 2.1.9 4.1.9z"/><path d="M12 6.8c0-2 1.3-3.4 3.3-3.7" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" stroke-linecap="round"/>',
  citrus: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.1"/>',
  leaf:   '<path d="M19.4 4.4C10.6 4 4.6 8.2 4.6 14.4c0 2.4.9 4.2 2.2 5.2 1.1-4.9 4.3-8.5 9.2-10.4-3.6 2.3-6 5.6-7 9.8 6.6.6 10.6-4.3 10.4-14.6z"/>',
  cube:   '<path d="M12 3.6l8 4.2v8.4L12 20.4 4 16.2V7.8z"/><path d="M4 7.8l8 4.2 8-4.2M12 12v8.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/>',
  bar:    '<rect x="4.4" y="6.4" width="15.2" height="11.2" rx="1.4"/><path d="M9.5 6.4v11.2M14.5 6.4v11.2M4.4 12h15.2" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/>',
  nib:    '<path d="M12 3.8c3.4 2.4 5.2 5.2 5.2 8.4 0 4-2.3 7-5.2 7s-5.2-3-5.2-7c0-3.2 1.8-6 5.2-8.4z"/><path d="M12 6.6v10.2" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>',
  drop:   '<path d="M12 3.4c3.6 4.3 5.6 7.5 5.6 10.2a5.6 5.6 0 0 1-11.2 0c0-2.7 2-5.9 5.6-10.2z"/><path d="M9.6 13.8c0 1.5.9 2.7 2.2 3.2" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>',
  nut:    '<path d="M12 4.2c4 0 6.8 3 6.8 7.4 0 4.6-3 8.2-6.8 8.2s-6.8-3.6-6.8-8.2C5.2 7.2 8 4.2 12 4.2z"/><path d="M12 6.4v11.4M9.2 8.6c-.9 1.6-1.2 3.4-.9 5.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>',
  star:   '<path d="M12 2.8l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z"/>',
  /* the rating glyph: a bean, tilted, with the crease down the middle */
  bean:   '<ellipse cx="12" cy="12" rx="6.4" ry="8.4" transform="rotate(-18 12 12)"/><path d="M12.6 4.2c-1.9 2.6-2 5.2-.3 7.8 1.7 2.6 1.5 5.2-.6 7.8" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" stroke-linecap="round"/>',
  fig:    '<path d="M12 6.4c3.8 0 6.6 3 6.6 6.6 0 3.9-3 6.8-6.6 6.8s-6.6-2.9-6.6-6.8c0-3.6 2.8-6.6 6.6-6.6z"/><path d="M12 6.5V3.2c1.8 0 3.1 1 3.6 2.8" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" stroke-linecap="round"/>'
};

var NOTES = {
  'Jasmine':        { glyph: 'flower', colour: '#C9A83C', ar: 'ياسمين' },
  'Rose':           { glyph: 'flower', colour: '#C1748A', ar: 'ورد' },
  'Peach':          { glyph: 'stone',  colour: '#E0904F', ar: 'خوخ' },
  'Ripe peach':     { glyph: 'stone',  colour: '#E0904F', ar: 'خوخ ناضج' },
  'Plum':           { glyph: 'stone',  colour: '#7B4C7A', ar: 'برقوق' },
  'Red cherry':     { glyph: 'berry',  colour: '#AF3540', ar: 'كرز أحمر' },
  'Blackcurrant':   { glyph: 'berry',  colour: '#4E2B50', ar: 'كشمش أسود' },
  'Red currant':    { glyph: 'berry',  colour: '#AF3540', ar: 'كشمش أحمر' },
  'Apple skin':     { glyph: 'apple',  colour: '#8CA455', ar: 'قشر تفاح' },
  'Red apple':      { glyph: 'apple',  colour: '#BC4630', ar: 'تفاح أحمر' },
  'Citrus zest':    { glyph: 'citrus', colour: '#D79B26', ar: 'قشر حمضيات' },
  'Grapefruit':     { glyph: 'citrus', colour: '#D77461', ar: 'جريب فروت' },
  'Orange peel':    { glyph: 'citrus', colour: '#CE7C27', ar: 'قشر برتقال' },
  'Lime':           { glyph: 'citrus', colour: '#7A9E3A', ar: 'ليمون أخضر' },
  'Black tea':      { glyph: 'leaf',   colour: '#5A4A32', ar: 'شاي أسود' },
  'Tobacco leaf':   { glyph: 'leaf',   colour: '#75663C', ar: 'ورق تبغ' },
  'Cane sugar':     { glyph: 'cube',   colour: '#C6A870', ar: 'سكر قصب' },
  'Brown sugar':    { glyph: 'cube',   colour: '#A97F4C', ar: 'سكر بني' },
  'Dark chocolate': { glyph: 'bar',    colour: '#3E2418', ar: 'شوكولاتة داكنة' },
  'Milk chocolate': { glyph: 'bar',    colour: '#74472A', ar: 'شوكولاتة بالحليب' },
  'Cocoa':          { glyph: 'bar',    colour: '#5A3620', ar: 'كاكاو' },
  'Cocoa nib':      { glyph: 'nib',    colour: '#5A3620', ar: 'حبّ كاكاو' },
  'Honey':          { glyph: 'drop',   colour: '#D49B33', ar: 'عسل' },
  'Caramel':        { glyph: 'drop',   colour: '#BB7C39', ar: 'كراميل' },
  'Hazelnut':       { glyph: 'nut',    colour: '#A0734A', ar: 'بندق' },
  'Almond':         { glyph: 'nut',    colour: '#A0734A', ar: 'لوز' },
  'Warm spice':     { glyph: 'star',   colour: '#AE5B38', ar: 'بهار دافئ' },
  'Dried fig':      { glyph: 'fig',    colour: '#6B475A', ar: 'تين مجفف' }
};

/* One note as its coloured disc plus its label. */
function noteNode(name) {
  var note = NOTES[name];
  if (!note) return '';
  var glyph = GLYPHS[note.glyph] || '';
  return '' +
    '<span class="disc" style="background: ' + note.colour + '26; border-color: ' + note.colour + '66">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="fill: ' + note.colour + '">' + glyph + '</svg>' +
    '</span>' +
    '<span class="lbl">' + esc(I18N.isArabic() ? note.ar : name) + '</span>';
}

/* The label alone, for the screen-reader summary. */
function noteLabel(name) {
  var note = NOTES[name];
  if (!note) return name;
  return I18N.isArabic() ? note.ar : name;
}

/* --- Tag vocabulary ----------------------------------------------------
   Green acts, clay describes flavour — so only taste-ish tags go clay.
   ----------------------------------------------------------------------- */
var TAGS = {
  classic  : { en: 'Classic',  ar: 'كلاسيكي', tone: 'leaf' },
  fruity   : { en: 'Fruity',   ar: 'فاكهي',   tone: 'clay' },
  filter   : { en: 'Filter',   ar: 'تقطير',   tone: 'leaf' },
  espresso : { en: 'Espresso', ar: 'إسبريسو', tone: 'clay' },
  brewing  : { en: 'Brewing',  ar: 'التحضير', tone: 'leaf' },
  grinding : { en: 'Grinding', ar: 'الطحن',   tone: 'leaf' },
  weighing : { en: 'Weighing', ar: 'القياس',  tone: 'leaf' }
};

/* --- The gahwa log's vocabulary ----------------------------------------
   Three closed lists, all bilingual. The place and company kinds match the
   Postgres enums exactly — if one is added there it must be added here or
   the interface will show a raw enum value to a customer.

   DRINKS is keyed by the English name that goes into the column, not by a
   slug: the schema stores 'Arabic coffee', so that string is the key and
   the Arabic label hangs off it. Anything the customer types themselves
   falls through this table unchanged, which is right — a drink they named
   is not ours to translate.
   ----------------------------------------------------------------------- */
var PLACE_KINDS = {
  bloom_cafe: { en: 'Bloom café',   ar: 'مقهى بلوم' },
  other_cafe: { en: 'Café',         ar: 'مقهى' },
  home:       { en: 'Home',         ar: 'البيت' },
  work:       { en: 'Work',         ar: 'العمل' },
  majlis:     { en: 'Majlis',       ar: 'المجلس' },
  outdoors:   { en: 'Outdoors',     ar: 'في الخارج' },
  travel:     { en: 'Travelling',   ar: 'في السفر' },
  other:      { en: 'Somewhere else', ar: 'مكان آخر' }
};

var COMPANY_KINDS = {
  alone:        { en: 'Alone',        ar: 'بمفردي' },
  family:       { en: 'Family',       ar: 'العائلة' },
  friends:      { en: 'Friends',      ar: 'الأصدقاء' },
  colleagues:   { en: 'Colleagues',   ar: 'الزملاء' },
  guests:       { en: 'Guests',       ar: 'ضيوف' },
  work_meeting: { en: 'Work meeting', ar: 'اجتماع عمل' }
};

var DRINKS = [
  { id: 'V60',           ar: 'تقطير V60' },
  { id: 'Espresso',      ar: 'إسبريسو' },
  { id: 'Cortado',       ar: 'كورتادو' },
  { id: 'Arabic coffee', ar: 'قهوة عربية' },
  { id: 'Turkish',       ar: 'قهوة تركية' },
  { id: 'Batch brew',    ar: 'قهوة الدفعة' },
  { id: 'Latte',         ar: 'لاتيه' }
];

/* Counting things, in two languages with very different rules.

   English has two forms. Arabic has six categories — zero, one, two, few
   (3-10), many (11-99) and other — so "2 cups" cannot be translated by
   appending a plural label to a number: it needs the dual. Intl.PluralRules
   knows the rules for both languages; this table only has to hold the
   words, and the count picks the form. */
var PLURALS = {
  cups: {
    en: { one: 'cup', other: 'cups' },
    ar: { zero: 'فناجين', one: 'فنجان', two: 'فنجانان', few: 'فناجين', many: 'فنجاناً', other: 'فنجان' }
  },
  visits: {
    en: { one: 'visit', other: 'visits' },
    ar: { zero: 'زيارات', one: 'زيارة', two: 'زيارتان', few: 'زيارات', many: 'زيارة', other: 'زيارة' }
  },
  days: {
    en: { one: 'day', other: 'days' },
    ar: { zero: 'أيام', one: 'يوم', two: 'يومان', few: 'أيام', many: 'يوماً', other: 'يوم' }
  },
  entries: {
    en: { one: 'entry', other: 'entries' },
    ar: { zero: 'تسجيلات', one: 'تسجيل', two: 'تسجيلان', few: 'تسجيلات', many: 'تسجيلاً', other: 'تسجيل' }
  },
  photos: {
    en: { one: 'photo', other: 'photos' },
    ar: { zero: 'صور', one: 'صورة', two: 'صورتان', few: 'صور', many: 'صورة', other: 'صورة' }
  }
};

function plural(key, count) {
  var lang = I18N.isArabic() ? 'ar' : 'en';
  var forms = (PLURALS[key] || {})[lang] || {};
  var category = 'other';
  try { category = new Intl.PluralRules(lang).select(count); } catch (e) { /* old browser */ }
  return forms[category] || forms.other || '';
}

/* A count and its word, in the right order for the language. */
function counted(key, count) { return count + ' ' + plural(key, count); }

function drinkLabel(stored) {
  for (var i = 0; i < DRINKS.length; i++) {
    if (DRINKS[i].id === stored) return I18N.isArabic() ? DRINKS[i].ar : stored;
  }
  return stored || '';
}

function placeKindLabel(kind) {
  var k = PLACE_KINDS[kind];
  return k ? (I18N.isArabic() ? k.ar : k.en) : '';
}

function companyKindLabel(kind) {
  var k = COMPANY_KINDS[kind];
  return k ? (I18N.isArabic() ? k.ar : k.en) : '';
}

/* Labels for the spec tables */
var SPEC_LABELS = {
  process   : { en: 'Process',     ar: 'المعالجة' },
  altitude  : { en: 'Altitude',    ar: 'الارتفاع' },
  roast     : { en: 'Roast',       ar: 'التحميص' },
  varietal  : { en: 'Varietal',    ar: 'الصنف' },
  harvest   : { en: 'Harvest',     ar: 'الحصاد' },
  material  : { en: 'Material',    ar: 'المادة' },
  size      : { en: 'Size',        ar: 'المقاس' },
  ribs      : { en: 'Ribs',        ar: 'الأخاديد' },
  finish    : { en: 'Finish',      ar: 'النوع' },
  count     : { en: 'Count',       ar: 'العدد' },
  burrs     : { en: 'Burrs',       ar: 'المطاحن' },
  steps     : { en: 'Adjustment',  ar: 'التدريج' },
  capacity  : { en: 'Capacity',    ar: 'السعة' },
  range     : { en: 'Range',       ar: 'المدى' },
  hold      : { en: 'Stability',   ar: 'الثبات' },
  accuracy  : { en: 'Accuracy',    ar: 'الدقة' },
  timer     : { en: 'Timer',       ar: 'المؤقّت' },
  readtime  : { en: 'Read time',   ar: 'زمن القراءة' },
  volume    : { en: 'Volume',      ar: 'الحجم' },
  glass     : { en: 'Glass',       ar: 'الزجاج' },
  markings  : { en: 'Markings',    ar: 'التدريجات' },
  boiler    : { en: 'Boiler',      ar: 'السخّان' },
  pressure  : { en: 'Pressure',    ar: 'الضغط' },
  pid       : { en: 'PID',         ar: 'تحكم الحرارة' },
  group     : { en: 'Group head',  ar: 'رأس التحضير' },
  batch     : { en: 'Batch',       ar: 'الدفعة' },
  temp      : { en: 'Temperature', ar: 'الحرارة' },
  shower    : { en: 'Shower',      ar: 'الموزّع' },
  adjust    : { en: 'Adjustment',  ar: 'التدريج' },
  rpm       : { en: 'Motor',       ar: 'المحرك' }
};

/* --- The catalogue -----------------------------------------------------
   price is KWD and always renders with three decimals.
   Beans carry a recipe; tools and machines carry specs only.
   ----------------------------------------------------------------------- */
var PRODUCTS = [

  /* ---------- Beans: eight origins, each with four notes ---------- */
  {
    id: 'eth-guji',
    category: 'beans',
    name:   { en: 'Hambela Washed', ar: 'همبيلا مغسولة' },
    origin: { en: 'Ethiopia · Guji', ar: 'إثيوبيا · قوجي' },
    price: 6.500,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['classic', 'filter'],
    notes: {
      en: 'Jasmine and ripe peach over black tea. Light-roasted for filter — the clean, floral classic.',
      ar: 'ياسمين وخوخ ناضج فوق شاي أسود. تحميص فاتح للتقطير — النقي الزهري الكلاسيكي.'
    },
    flavour: ['Jasmine', 'Ripe peach', 'Black tea', 'Citrus zest'],
    bagColour: { body: '#57683F', top: '#3D4B2C' },
    desc: {
      en: 'Fully washed at the Hambela mill and dried on raised beds at 2050 m, which is why the cup arrives so clear. Jasmine on the nose, ripe peach in the body, and a black-tea dryness in the finish that keeps it drinkable to the last mouthful. We roast it light on Tuesdays and rest it three days. It is the bean we hand anyone brewing pour-over for the first time.',
      ar: 'تُغسل كاملاً في معمل همبيلا وتُجفَّف على أسِرَّة مرتفعة عند 2050 متراً، ولهذا يأتي الفنجان بهذا الصفاء. ياسمين في الأنف، وخوخ ناضج في الجسم، وجفاف الشاي الأسود في النهاية يجعلها قابلة للشرب حتى آخر جرعة. نحمّصها فاتحة كل ثلاثاء وتستريح ثلاثة أيام. هذه أول حبة نرشّحها لمن يبدأ بالتقطير.'
    },
    specs: {
      process:  { en: 'Washed', ar: 'مغسولة' },
      altitude: { en: '2050 m', ar: '2050 م' },
      roast:    { en: 'Filter', ar: 'تقطير' },
      varietal: { en: 'Heirloom', ar: 'أصناف محلية' },
      harvest:  { en: 'Nov 2025', ar: 'نوفمبر 2025' }
    },
    recipe: {
      method: 'filter', methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 15, water: 250, temp: 93, bloom: 30, bloomTime: 30, total: '2:45',
      grind: { en: 'Medium-fine', ar: 'وسط ناعم' }
    },
    model: 'v60',
    stock: 12,
    image: 'assets/eth-guji.svg'
  },
  {
    id: 'col-huila',
    category: 'beans',
    name:   { en: 'El Mirador Natural', ar: 'إل ميرادور طبيعية' },
    origin: { en: 'Colombia · Huila', ar: 'كولومبيا · هويلا' },
    price: 6.000,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['fruity', 'filter'],
    notes: {
      en: 'Red cherry and cane sugar with apple skin. Natural process — juicy, sweet and forgiving.',
      ar: 'كرز أحمر وسكر قصب مع قشر تفاح. معالجة طبيعية — عصيرية وحلوة ومتسامحة.'
    },
    flavour: ['Red cherry', 'Cane sugar', 'Apple skin', 'Cocoa nib'],
    bagColour: { body: '#AC5334', top: '#7E3722' },
    desc: {
      en: 'Picked ripe on a smallholding above Pitalito and dried whole for eighteen days, turned by hand every few hours. That slow drying is what pushes the red cherry forward without letting it tip into ferment. Sweet enough to drink black all afternoon, and it will forgive a pour that wanders. Brew it a degree cooler than the Ethiopian.',
      ar: 'تُقطف ناضجة في حيازة صغيرة فوق بيتاليتو وتُجفَّف كاملة ثمانية عشر يوماً، وتُقلَّب يدوياً كل ساعات. هذا التجفيف البطيء هو ما يُبرز الكرز الأحمر دون أن ينقلب إلى تخمّر. حلاوتها تكفي لشربها سادة طول العصر، وهي تتسامح مع صبّ متعثّر. حضّرها بدرجة أبرد من الإثيوبية.'
    },
    specs: {
      process:  { en: 'Natural', ar: 'طبيعية' },
      altitude: { en: '1750 m', ar: '1750 م' },
      roast:    { en: 'Filter', ar: 'تقطير' },
      varietal: { en: 'Caturra', ar: 'كاتورا' },
      harvest:  { en: 'Oct 2025', ar: 'أكتوبر 2025' }
    },
    recipe: {
      method: 'filter', methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 15, water: 250, temp: 92, bloom: 30, bloomTime: 30, total: '3:00',
      grind: { en: 'Medium', ar: 'وسط' }
    },
    model: 'v60',
    stock: 20,
    image: 'assets/col-huila.svg'
  },
  {
    id: 'yem-haraz',
    category: 'beans',
    name:   { en: 'Haraz Terraces', ar: 'مدرّجات حراز' },
    origin: { en: 'Yemen · Haraz', ar: 'اليمن · حراز' },
    price: 14.000,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['classic', 'espresso'],
    notes: {
      en: 'Dark chocolate and dried fig with warm spice. Deep and traditional — excellent as espresso.',
      ar: 'شوكولاتة داكنة وتين مجفف مع بهار دافئ. عميقة وتقليدية — ممتازة كإسبريسو.'
    },
    flavour: ['Dark chocolate', 'Dried fig', 'Warm spice', 'Tobacco leaf'],
    bagColour: { body: '#241A14', top: '#0F0A07' },
    desc: {
      en: 'Terraced smallholder plots at 2200 m in the Haraz mountains, sun-dried on rooftops the way they have been for centuries. Heavy in the mouth, low in acidity, and unmistakably Yemeni: dark chocolate first, then dried fig, then a long spiced finish. Pulled as espresso it tastes of fig and cardamom; brewed as filter it turns to cocoa.',
      ar: 'مدرّجات صغيرة على ارتفاع 2200 متر في جبال حراز، تُجفَّف شمساً على الأسطح كما جرت العادة منذ قرون. ثقيلة في الفم، قليلة الحموضة، ويمنية بلا التباس: شوكولاتة داكنة أولاً، ثم تين مجفف، ثم نهاية طويلة مبهّرة. كإسبريسو تعطي التين والهيل، وكقطرة تتحوّل إلى كاكاو.'
    },
    specs: {
      process:  { en: 'Natural', ar: 'طبيعية' },
      altitude: { en: '2200 m', ar: '2200 م' },
      roast:    { en: 'Espresso', ar: 'إسبريسو' },
      varietal: { en: 'Udaini', ar: 'عُديني' },
      harvest:  { en: 'Sep 2025', ar: 'سبتمبر 2025' }
    },
    recipe: {
      method: 'filter', methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 16, water: 250, temp: 94, bloom: 32, bloomTime: 30, total: '3:10',
      grind: { en: 'Medium', ar: 'وسط' }
    },
    model: 'v60',
    stock: 6,
    image: 'assets/yem-haraz.svg'
  },
  {
    id: 'ken-nyeri',
    category: 'beans',
    name:   { en: 'Gichathaini AA', ar: 'جيتشاثايني AA' },
    origin: { en: 'Kenya · Nyeri', ar: 'كينيا · نيري' },
    price: 8.500,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['fruity', 'filter'],
    notes: {
      en: 'Blackcurrant and grapefruit over plum and brown sugar. Sharp, structured, unmistakably Kenyan.',
      ar: 'كشمش أسود وجريب فروت فوق برقوق وسكر بني. حادّة ومتماسكة وكينية بلا التباس.'
    },
    flavour: ['Blackcurrant', 'Grapefruit', 'Plum', 'Brown sugar'],
    bagColour: { body: '#8C3B44', top: '#5E252C' },
    desc: {
      en: 'AA screen from the Gichathaini factory in Nyeri, double-fermented in water and dried slowly on beds at 1800 m. Kenyan coffee at its most itself: blackcurrant that borders on savoury, grapefruit acidity with real structure behind it, and brown sugar underneath holding it together. Grind a touch coarser than you think — this one gets astringent if you over-extract it.',
      ar: 'حجم AA من معمل جيتشاثايني في نيري، تُخمَّر مرتين في الماء وتُجفَّف ببطء على الأسِرَّة عند 1800 متر. القهوة الكينية في أصدق صورها: كشمش أسود يقارب المالح، وحموضة جريب فروت بهيكل حقيقي خلفها، وسكر بني تحتها يجمع الأمر. اطحن أخشن قليلاً مما تتوقّع — فهذه تصبح قابضة إن أفرطت في الاستخلاص.'
    },
    specs: {
      process:  { en: 'Washed, double-fermented', ar: 'مغسولة، تخمير مزدوج' },
      altitude: { en: '1800 m', ar: '1800 م' },
      roast:    { en: 'Filter', ar: 'تقطير' },
      varietal: { en: 'SL28 · SL34', ar: 'SL28 · SL34' },
      harvest:  { en: 'Jan 2026', ar: 'يناير 2026' }
    },
    recipe: {
      method: 'filter', methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 15, water: 250, temp: 94, bloom: 30, bloomTime: 30, total: '2:50',
      grind: { en: 'Medium', ar: 'وسط' }
    },
    model: 'v60',
    stock: 9,
    image: 'assets/ken-nyeri.svg'
  },
  {
    id: 'bra-cerrado',
    category: 'beans',
    name:   { en: 'Fazenda Rio Verde', ar: 'فازيندا ريو فيردي' },
    origin: { en: 'Brazil · Cerrado', ar: 'البرازيل · سيرادو' },
    price: 5.000,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['classic', 'espresso'],
    notes: {
      en: 'Hazelnut and milk chocolate with caramel. Low acidity, thick body — the everyday espresso.',
      ar: 'بندق وشوكولاتة بالحليب مع كراميل. حموضة منخفضة وجسم سميك — إسبريسو كل يوم.'
    },
    flavour: ['Hazelnut', 'Milk chocolate', 'Caramel', 'Brown sugar'],
    bagColour: { body: '#8A6A3F', top: '#5F4826' },
    desc: {
      en: 'Pulped natural from the Cerrado plateau at 1100 m, where the dry harvest lets the fruit come off cleanly and leaves the sugars behind. Hazelnut and milk chocolate, almost no acidity, and a body thick enough to carry milk without disappearing into it. This is the one we keep in the hopper: cheap enough to drink daily and sweet enough that you want to.',
      ar: 'معالجة نصف طبيعية من هضبة سيرادو عند 1100 متر، حيث يسمح الحصاد الجاف بإزالة الفاكهة بنظافة ويُبقي السكريات. بندق وشوكولاتة بالحليب، بلا حموضة تقريباً، وجسم سميك يحمل الحليب دون أن يذوب فيه. هذه ما نُبقيها في القادوس: رخيصة تكفي لشربها يومياً وحلوة تكفي لترغب في ذلك.'
    },
    specs: {
      process:  { en: 'Pulped natural', ar: 'نصف طبيعية' },
      altitude: { en: '1100 m', ar: '1100 م' },
      roast:    { en: 'Espresso', ar: 'إسبريسو' },
      varietal: { en: 'Yellow Catuaí', ar: 'كاتواي أصفر' },
      harvest:  { en: 'Aug 2025', ar: 'أغسطس 2025' }
    },
    recipe: {
      method: 'filter', methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 16, water: 250, temp: 95, bloom: 32, bloomTime: 30, total: '3:15',
      grind: { en: 'Medium-coarse', ar: 'وسط خشن' }
    },
    model: 'v60',
    stock: 26,
    image: 'assets/bra-cerrado.svg'
  },
  {
    id: 'gua-huehue',
    category: 'beans',
    name:   { en: 'Finca La Bolsa', ar: 'فينكا لا بولسا' },
    origin: { en: 'Guatemala · Huehuetenango', ar: 'غواتيمالا · ويويتينانغو' },
    price: 7.000,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['classic', 'filter'],
    notes: {
      en: 'Caramel and red apple with cocoa and orange peel. Balanced, round, good every way you brew it.',
      ar: 'كراميل وتفاح أحمر مع كاكاو وقشر برتقال. متوازنة وممتلئة، وجيدة بأي طريقة تحضّرها.'
    },
    flavour: ['Caramel', 'Red apple', 'Cocoa', 'Orange peel'],
    bagColour: { body: '#6B4A2E', top: '#48301C' },
    desc: {
      en: 'Washed and sun-dried at 1900 m in the dry highland air of Huehuetenango, which lets the drying finish evenly and slowly. Caramel and red apple up front, cocoa underneath, and a twist of orange peel as it cools. The most even-tempered coffee on the shelf: it is good as filter, good as espresso, and good the next morning if you forgot about it.',
      ar: 'مغسولة ومجفّفة شمساً عند 1900 متر في هواء مرتفعات ويويتينانغو الجاف، مما يجعل التجفيف يكتمل بانتظام وبطء. كراميل وتفاح أحمر في المقدّمة، وكاكاو تحتهما، ولمسة قشر برتقال حين تبرد. أكثر قهوة متوازنة على الرف: جيدة تقطيراً، وجيدة إسبريسو، وجيدة صباح الغد إن نسيتها.'
    },
    specs: {
      process:  { en: 'Washed', ar: 'مغسولة' },
      altitude: { en: '1900 m', ar: '1900 م' },
      roast:    { en: 'Filter', ar: 'تقطير' },
      varietal: { en: 'Bourbon · Caturra', ar: 'بوربون · كاتورا' },
      harvest:  { en: 'Mar 2026', ar: 'مارس 2026' }
    },
    recipe: {
      method: 'filter', methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 15, water: 250, temp: 93, bloom: 30, bloomTime: 30, total: '2:55',
      grind: { en: 'Medium-fine', ar: 'وسط ناعم' }
    },
    model: 'v60',
    stock: 15,
    image: 'assets/gua-huehue.svg'
  },
  {
    id: 'cri-tarrazu',
    category: 'beans',
    name:   { en: 'Las Lajas Honey', ar: 'لاس لاخاس هني' },
    origin: { en: 'Costa Rica · Tarrazú', ar: 'كوستاريكا · تارّازو' },
    price: 7.500,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['fruity', 'filter'],
    notes: {
      en: 'Honey and peach with plum and cane sugar. Syrupy sweetness from the honey process.',
      ar: 'عسل وخوخ مع برقوق وسكر قصب. حلاوة كالشراب من المعالجة العسلية.'
    },
    flavour: ['Honey', 'Peach', 'Plum', 'Cane sugar'],
    bagColour: { body: '#B07A3C', top: '#7E5322' },
    desc: {
      en: 'A yellow honey: the skin comes off but the sticky mucilage stays on through drying, so the sugars work their way back into the bean. The result is syrupy in a way washed coffee never is — honey and peach, plum as it cools, cane sugar all the way through. Dried twelve days at 1500 m in Tarrazú, turned every two hours.',
      ar: 'عسلية صفراء: تُزال القشرة ويبقى اللبّ اللزج طوال التجفيف، فتعود السكريات إلى الحبة. والنتيجة قوامها كالشراب بشكل لا تصله المغسولة أبداً — عسل وخوخ، وبرقوق حين تبرد، وسكر قصب من البداية للنهاية. جُفِّفت اثني عشر يوماً عند 1500 متر في تارّازو، وقُلِّبت كل ساعتين.'
    },
    specs: {
      process:  { en: 'Yellow honey', ar: 'عسلية صفراء' },
      altitude: { en: '1500 m', ar: '1500 م' },
      roast:    { en: 'Filter', ar: 'تقطير' },
      varietal: { en: 'Caturra · Villalobos', ar: 'كاتورا · فيلالوبوس' },
      harvest:  { en: 'Feb 2026', ar: 'فبراير 2026' }
    },
    recipe: {
      method: 'filter', methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 15, water: 250, temp: 92, bloom: 30, bloomTime: 30, total: '3:05',
      grind: { en: 'Medium', ar: 'وسط' }
    },
    model: 'v60',
    stock: 11,
    image: 'assets/cri-tarrazu.svg'
  },
  {
    id: 'rwa-nyamasheke',
    category: 'beans',
    name:   { en: 'Kanzu Washed', ar: 'كانزو مغسولة' },
    origin: { en: 'Rwanda · Nyamasheke', ar: 'رواندا · نياماشيكي' },
    price: 7.000,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['fruity', 'filter'],
    notes: {
      en: 'Rose and lime over blackcurrant and honey. Delicate, floral, and very clean in the cup.',
      ar: 'ورد وليمون أخضر فوق كشمش أسود وعسل. رقيقة وزهرية ونظيفة جداً في الفنجان.'
    },
    flavour: ['Rose', 'Lime', 'Blackcurrant', 'Honey'],
    bagColour: { body: '#5E7060', top: '#3F4E42' },
    desc: {
      en: 'From the Kanzu washing station in Nyamasheke, on the hills above Lake Kivu at 1700 m. Fully washed and soaked overnight in clean water, which is what gives it that glassy clarity. Rose and lime arrive first, blackcurrant sits behind them, and honey rounds off the finish. Delicate enough that a coarse grind or cool water will hide it — brew this one carefully.',
      ar: 'من محطة غسل كانزو في نياماشيكي، على التلال فوق بحيرة كيفو عند 1700 متر. تُغسل كاملاً وتُنقع ليلة في ماء نظيف، وهذا ما يمنحها صفاءً زجاجياً. يأتي الورد والليمون الأخضر أولاً، ويجلس الكشمش الأسود خلفهما، ويُدوّر العسل النهاية. رقيقة لدرجة أن طحناً خشناً أو ماءً بارداً سيخفيها — حضّر هذه بعناية.'
    },
    specs: {
      process:  { en: 'Washed, overnight soak', ar: 'مغسولة، نقع ليلي' },
      altitude: { en: '1700 m', ar: '1700 م' },
      roast:    { en: 'Filter', ar: 'تقطير' },
      varietal: { en: 'Red Bourbon', ar: 'بوربون أحمر' },
      harvest:  { en: 'Dec 2025', ar: 'ديسمبر 2025' }
    },
    recipe: {
      method: 'filter', methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 15, water: 250, temp: 93, bloom: 30, bloomTime: 30, total: '2:45',
      grind: { en: 'Medium-fine', ar: 'وسط ناعم' }
    },
    model: 'v60',
    stock: 13,
    image: 'assets/rwa-nyamasheke.svg'
  },

  /* ---------- Tools ---------- */
  {
    id: 'dripper-v60',
    category: 'tools',
    icon: 'dripper',
    name:   { en: 'Cone dripper', ar: 'قمع التقطير' },
    origin: { en: 'Dripper', ar: 'قمع' },
    price: 4.500,
    unit:  { en: 'size 02', ar: 'مقاس ٠٢' },
    tags: ['brewing'],
    notes: {
      en: 'V60 and flat-bottom cones in ceramic, glass or plastic.',
      ar: 'أقماع V60 ومسطحة القاعدة من السيراميك أو الزجاج أو البلاستيك.'
    },
    desc: {
      en: 'A 60° cone with spiral ribs, so the paper never seals against the wall and the bed drains evenly. Ceramic holds heat best; plastic is the one to travel with.',
      ar: 'قمع بزاوية ٦٠° وأخاديد حلزونية، فلا تلتصق الورقة بالجدار ويصرّف القاع بانتظام. السيراميك يحفظ الحرارة أفضل، والبلاستيك أنسب للسفر.'
    },
    specs: {
      material: { en: 'Ceramic · glass · plastic', ar: 'سيراميك · زجاج · بلاستيك' },
      size:     { en: '02 · 1–4 cups', ar: '٠٢ · 1–4 فناجين' },
      ribs:     { en: 'Spiral, 60° cone', ar: 'حلزونية، قمع 60°' }
    },
    model: 'v60',
    stock: 30,
    image: 'assets/dripper.svg'
  },
  {
    id: 'filter-papers',
    category: 'tools',
    icon: 'paper',
    name:   { en: 'Filter papers', ar: 'أوراق الترشيح' },
    origin: { en: 'Filter papers', ar: 'أوراق' },
    price: 1.750,
    unit:  { en: '100 pack', ar: 'عبوة ١٠٠' },
    tags: ['brewing'],
    notes: {
      en: 'Bleached and natural, sizes 01 and 02, 100-packs.',
      ar: 'مبيّضة وطبيعية، مقاسا ٠١ و٠٢، عبوات ١٠٠ ورقة.'
    },
    desc: {
      en: 'Rinse them first, always — a dry paper tastes of paper and cools the cone. Bleached brews cleaner; natural adds a faint hint of card.',
      ar: 'اغسلها أولاً دائماً — الورقة الجافة تُشعر بطعم الورق وتبرّد القمع. المبيّضة أنقى في الكوب، والطبيعية تضيف لمسة كرتونية خفيفة.'
    },
    specs: {
      size:   { en: '01 · 02', ar: '٠١ · ٠٢' },
      finish: { en: 'Bleached / natural', ar: 'مبيّضة / طبيعية' },
      count:  { en: '100 sheets', ar: '100 ورقة' }
    },
    stock: 80,
    image: 'assets/paper.svg'
  },
  {
    id: 'hand-grinder',
    category: 'tools',
    icon: 'grinder',
    name:   { en: 'Manual grinder', ar: 'مطحنة يدوية' },
    origin: { en: 'Manual grinder', ar: 'مطحنة' },
    price: 22.000,
    unit:  { en: '1 pc', ar: 'حبة' },
    tags: ['grinding'],
    notes: {
      en: 'Stainless burrs with click adjustment for filter and espresso.',
      ar: 'مطاحن ستانلس بتدريج نقري للتقطير والإسبريسو.'
    },
    desc: {
      en: 'Conical steel burrs on a double bearing, so the shaft does not wobble and the grind stays even. Thirty clicks from espresso to French press; filter sits around click 18.',
      ar: 'مطاحن مخروطية من الفولاذ على محملين، فلا يتأرجح العمود ويبقى الطحن متساوياً. ثلاثون نقرة من الإسبريسو إلى الفرنسية، والتقطير عند النقرة ١٨ تقريباً.'
    },
    specs: {
      burrs:    { en: '48 mm stainless conical', ar: 'مخروطية ستانلس 48 مم' },
      steps:    { en: '30 clicks · 22 µm each', ar: '30 نقرة · 22 ميكرون لكل نقرة' },
      capacity: { en: '30 g', ar: '30 غم' }
    },
    model: 'grinder',
    stock: 14,
    image: 'assets/grinder.svg'
  },
  {
    id: 'gooseneck-kettle',
    category: 'tools',
    icon: 'kettle',
    name:   { en: 'Gooseneck kettle', ar: 'غلاية رقبة الإوزة' },
    origin: { en: 'Kettle', ar: 'غلاية' },
    price: 34.000,
    unit:  { en: '0.8 L', ar: '٠٫٨ لتر' },
    tags: ['brewing'],
    notes: {
      en: 'Variable temperature, slow controlled pour, 0.6–1 L.',
      ar: 'حرارة متغيّرة وصبّ بطيء محكوم، 0.6–1 لتر.'
    },
    desc: {
      en: 'The narrow spout is the whole point: it turns your wrist into a flow-rate control. Set it to 93 °C and it holds there while you pour.',
      ar: 'الفوهة الضيقة هي الفكرة كلها: تحوّل معصمك إلى منظّم لسرعة الصبّ. اضبطها على 93 °م وتثبت عندها أثناء الصبّ.'
    },
    specs: {
      capacity: { en: '0.6–1.0 L', ar: '0.6–1.0 لتر' },
      range:    { en: '40–100 °C', ar: '40–100 °م' },
      hold:     { en: '±1 °C for 60 min', ar: '±1 °م لمدة 60 دقيقة' }
    },
    model: 'kettle',
    stock: 9,
    image: 'assets/kettle.svg'
  },
  {
    id: 'digital-scale',
    category: 'tools',
    icon: 'scale',
    name:   { en: 'Digital scale', ar: 'ميزان رقمي' },
    origin: { en: 'Scale', ar: 'ميزان' },
    price: 12.500,
    unit:  { en: '1 pc', ar: 'حبة' },
    tags: ['weighing'],
    notes: {
      en: '0.1 g accuracy with a built-in timer for the bloom.',
      ar: 'دقة 0.1 غم مع مؤقّت مدمج لمرحلة التفتّح.'
    },
    desc: {
      en: 'Weigh the coffee, weigh the water, watch the clock — that is most of brewing. The timer starts itself at the first drop, which is exactly when the bloom begins.',
      ar: 'زِن البنّ، زِن الماء، وراقب الوقت — هذا معظم التحضير. يبدأ المؤقّت تلقائياً مع أول قطرة، وهي لحظة بدء التفتّح.'
    },
    specs: {
      accuracy: { en: '0.1 g', ar: '0.1 غم' },
      capacity: { en: '2000 g', ar: '2000 غم' },
      timer:    { en: 'Auto-start at first drop', ar: 'بدء تلقائي مع أول قطرة' }
    },
    model: 'scale',
    stock: 18,
    image: 'assets/scale.svg'
  },
  {
    id: 'thermometer',
    category: 'tools',
    icon: 'thermometer',
    name:   { en: 'Probe thermometer', ar: 'ميزان حرارة' },
    origin: { en: 'Thermometer', ar: 'حرارة' },
    price: 6.000,
    unit:  { en: '1 pc', ar: 'حبة' },
    tags: ['weighing'],
    notes: {
      en: 'Instant read, 0–100 °C — brew at 92–94 °C.',
      ar: 'قراءة فورية، 0–100 °م — حضّر عند 92–94 °م.'
    },
    desc: {
      en: 'For any kettle without a thermostat. Boil, wait, probe: water off the boil drops roughly a degree every twenty seconds in a Kuwait kitchen.',
      ar: 'لأي غلاية بلا منظّم حرارة. اغلِ، انتظر، ثم اقرأ: الماء بعد الغليان ينزل درجة كل عشرين ثانية تقريباً في مطبخ كويتي.'
    },
    specs: {
      range:    { en: '0–100 °C', ar: '0–100 °م' },
      accuracy: { en: '±0.5 °C', ar: '±0.5 °م' },
      readtime: { en: '2 s', ar: '2 ثانية' }
    },
    stock: 25,
    image: 'assets/thermometer.svg'
  },
  {
    id: 'glass-server',
    category: 'tools',
    icon: 'server',
    name:   { en: 'Glass server', ar: 'دورق زجاجي' },
    origin: { en: 'Server', ar: 'دورق' },
    price: 7.500,
    unit:  { en: '600 ml', ar: '٦٠٠ مل' },
    tags: ['brewing'],
    notes: {
      en: 'Heat-proof glass carafes, 400 and 600 ml, with markings.',
      ar: 'دوارق زجاج مقاوم للحرارة، 400 و600 مل، بتدريجات.'
    },
    desc: {
      en: 'Borosilicate, marked every 100 ml so you can read the brew without a scale. Warm it with the paper rinse and the cup lands hotter.',
      ar: 'زجاج بوروسيليكات مدرّج كل 100 مل، فتقرأ الكمية بلا ميزان. سخّنه بماء غسل الورقة ليصل الفنجان أسخن.'
    },
    specs: {
      volume:   { en: '400 / 600 ml', ar: '400 / 600 مل' },
      glass:    { en: 'Borosilicate', ar: 'بوروسيليكات' },
      markings: { en: 'Every 100 ml', ar: 'كل 100 مل' }
    },
    stock: 22,
    image: 'assets/server.svg'
  },

  /* ---------- Machines ---------- */
  {
    id: 'espresso-machine',
    category: 'machines',
    icon: 'espresso',
    name:   { en: 'Espresso machine', ar: 'مكينة إسبريسو' },
    origin: { en: 'Espresso', ar: 'إسبريسو' },
    price: 185.000,
    unit:  { en: 'dual boiler', ar: 'سخّان مزدوج' },
    tags: ['espresso'],
    notes: {
      en: 'Single boiler to dual boiler, 9 bar, PID temperature control.',
      ar: 'من سخّان واحد إلى سخّانين، 9 بار، وتحكّم PID بالحرارة.'
    },
    desc: {
      en: 'A 58 mm group and a real PID, which is what separates a repeatable shot from a lucky one. Brew and steam at once, and a 30-minute warm-up before the first cup.',
      ar: 'رأس 58 مم ومنظّم PID حقيقي، وهذا ما يفرق بين جرعة متكرّرة وجرعة محظوظة. تحضير وبخار في الوقت نفسه، مع تسخين 30 دقيقة قبل أول فنجان.'
    },
    specs: {
      boiler:   { en: 'Dual · 1.8 L', ar: 'مزدوج · 1.8 لتر' },
      pressure: { en: '9 bar', ar: '9 بار' },
      pid:      { en: '±0.3 °C', ar: '±0.3 °م' },
      group:    { en: '58 mm', ar: '58 مم' }
    },
    model: 'espresso',
    stock: 4,
    image: 'assets/espresso.svg'
  },
  {
    id: 'filter-brewer',
    category: 'machines',
    icon: 'brewer',
    name:   { en: 'Batch brewer', ar: 'مكينة تقطير' },
    origin: { en: 'Filter brewer', ar: 'تقطير' },
    price: 95.000,
    unit:  { en: '1.9 L', ar: '١٫٩ لتر' },
    tags: ['filter'],
    notes: {
      en: 'Batch brewers that hold 93 °C and shower evenly.',
      ar: 'مكائن دفعات تثبّت 93 °م وتوزّع الماء بانتظام.'
    },
    desc: {
      en: 'What we run on the bar for filter by the cup. A six-jet shower head wets the whole bed at once, and the brew stays inside 92–96 °C for the full cycle.',
      ar: 'هذه ما نشغّلها على البار للتقطير بالفنجان. موزّع بستّ فتحات يبلّل القاع كله دفعة واحدة، وتبقى الحرارة بين 92 و96 °م طوال الدورة.'
    },
    specs: {
      batch:  { en: '1.9 L · 12 cups', ar: '1.9 لتر · 12 فنجاناً' },
      temp:   { en: '92–96 °C', ar: '92–96 °م' },
      shower: { en: '6-jet head', ar: 'موزّع بست فتحات' }
    },
    stock: 5,
    image: 'assets/brewer.svg'
  },
  {
    id: 'electric-grinder',
    category: 'machines',
    icon: 'burr',
    name:   { en: 'Electric burr grinder', ar: 'مطحنة كهربائية' },
    origin: { en: 'Grinder', ar: 'مطحنة' },
    price: 68.000,
    unit:  { en: '64 mm flat', ar: 'مسطحة ٦٤ مم' },
    tags: ['grinding'],
    notes: {
      en: 'Flat and conical burrs, stepless from espresso to French press.',
      ar: 'مطاحن مسطحة ومخروطية، تدريج مستمر من الإسبريسو إلى الفرنسية.'
    },
    desc: {
      en: 'Stepless adjustment, so you can chase a shot by a hair rather than a whole click. Single-dose it and it retains under half a gram.',
      ar: 'تدريج مستمر، فتضبط الجرعة بفروق دقيقة لا بنقرة كاملة. مع الجرعة المفردة يبقى فيها أقل من نصف غرام.'
    },
    specs: {
      burrs:  { en: '64 mm flat steel', ar: 'مسطحة فولاذ 64 مم' },
      adjust: { en: 'Stepless', ar: 'مستمر' },
      rpm:    { en: '1350 rpm', ar: '1350 دورة/دقيقة' }
    },
    model: 'grinder',
    stock: 7,
    image: 'assets/burr.svg'
  }
];

/* Look one product up by id. */
function productById(id) {
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === id) return PRODUCTS[i];
  }
  return null;
}

/* --- Header menus -------------------------------------------------------
   People shop coffee by taste, not by name, so every link carries a note.
   ----------------------------------------------------------------------- */
var MENUS = [
  {
    key: 'beans',
    label: { en: 'Beans', ar: 'حبوب البن' },
    href: 'beans.html',
    eyebrow: { en: 'Single origin · roasted weekly', ar: 'أصل واحد · تُحمّص أسبوعياً' },
    all: { en: 'All beans →', ar: 'كل الحبوب →' },
    links: [
      {
        href: 'product.html?id=eth-guji', icon: 'drop', tag: 'classic',
        name: { en: 'Ethiopian', ar: 'إثيوبية' },
        desc: {
          en: 'Guji · Jasmine, peach and black tea. Light-roasted for filter — the clean, floral classic.',
          ar: 'قوجي · ياسمين وخوخ وشاي أسود. تحميص فاتح للتقطير — نظيف وزهري.'
        }
      },
      {
        href: 'product.html?id=col-huila', icon: 'drop', tag: 'fruity',
        name: { en: 'Colombian', ar: 'كولومبية' },
        desc: {
          en: 'Huila · Red cherry, cane sugar and apple skin. Natural process — juicy and bright.',
          ar: 'هويلا · كرز أحمر وسكر قصب وقشر تفاح. معالجة طبيعية — عصيرية ومنعشة.'
        }
      },
      {
        href: 'product.html?id=yem-haraz', icon: 'drop', tag: 'classic',
        name: { en: 'Yemeni', ar: 'يمنية' },
        desc: {
          en: 'Haraz · Dark chocolate, dried fig and warm spice. Deep and traditional — excellent as espresso.',
          ar: 'حراز · شوكولاتة داكنة وتين وبهار دافئ. عميقة وتقليدية — ممتازة كإسبريسو.'
        }
      }
    ]
  },
  {
    key: 'tools',
    label: { en: 'Tools', ar: 'أدوات التحضير' },
    href: 'tools.html',
    eyebrow: { en: 'Everything for pour-over', ar: 'كل ما يلزم للتقطير' },
    all: { en: 'All tools →', ar: 'كل الأدوات →' },
    links: [
      { href: 'product.html?id=dripper-v60', icon: 'dripper',
        name: { en: 'Dripper', ar: 'قمع التقطير' },
        desc: { en: 'V60 and flat-bottom cones in ceramic, glass or plastic.', ar: 'أقماع V60 ومسطحة القاعدة من السيراميك أو الزجاج أو البلاستيك.' } },
      { href: 'product.html?id=filter-papers', icon: 'paper',
        name: { en: 'Filter papers', ar: 'أوراق الترشيح' },
        desc: { en: 'Bleached and natural, sizes 01 and 02, 100-packs.', ar: 'مبيّضة وطبيعية، مقاسا ٠١ و٠٢، عبوات ١٠٠ ورقة.' } },
      { href: 'product.html?id=hand-grinder', icon: 'grinder',
        name: { en: 'Manual grinder', ar: 'مطحنة يدوية' },
        desc: { en: 'Stainless burrs with click adjustment for filter and espresso.', ar: 'مطاحن ستانلس بتدريج نقري للتقطير والإسبريسو.' } },
      { href: 'product.html?id=gooseneck-kettle', icon: 'kettle',
        name: { en: 'Gooseneck kettle', ar: 'غلاية رقبة الإوزة' },
        desc: { en: 'Variable temperature, slow controlled pour, 0.6–1 L.', ar: 'حرارة متغيّرة وصبّ بطيء محكوم، 0.6–1 لتر.' } },
      { href: 'product.html?id=digital-scale', icon: 'scale',
        name: { en: 'Digital scale', ar: 'ميزان رقمي' },
        desc: { en: '0.1 g accuracy with a built-in timer for the bloom.', ar: 'دقة 0.1 غم مع مؤقّت مدمج لمرحلة التفتّح.' } },
      { href: 'product.html?id=thermometer', icon: 'thermometer',
        name: { en: 'Thermometer', ar: 'ميزان حرارة' },
        desc: { en: 'Instant read, 0–100 °C — brew at 92–94 °C.', ar: 'قراءة فورية، 0–100 °م — حضّر عند 92–94 °م.' } },
      { href: 'product.html?id=glass-server', icon: 'server',
        name: { en: 'Server', ar: 'دورق' },
        desc: { en: 'Heat-proof glass carafes, 400 and 600 ml, with markings.', ar: 'دوارق زجاج مقاوم للحرارة، 400 و600 مل، بتدريجات.' } }
    ]
  },
  {
    key: 'machines',
    label: { en: 'Machines', ar: 'المكائن' },
    href: 'machines.html',
    eyebrow: { en: 'Home and café', ar: 'للمنزل والمقهى' },
    all: { en: 'All machines →', ar: 'كل المكائن →' },
    links: [
      { href: 'product.html?id=espresso-machine', icon: 'espresso',
        name: { en: 'Espresso machines', ar: 'مكائن الإسبريسو' },
        desc: { en: 'Single boiler to dual boiler, 9 bar, PID temperature control.', ar: 'من سخّان واحد إلى سخّانين، 9 بار، وتحكّم PID بالحرارة.' } },
      { href: 'product.html?id=filter-brewer', icon: 'brewer',
        name: { en: 'Filter brewers', ar: 'مكائن التقطير' },
        desc: { en: 'Batch brewers that hold 93 °C and shower evenly.', ar: 'مكائن دفعات تثبّت 93 °م وتوزّع الماء بانتظام.' } },
      { href: 'product.html?id=electric-grinder', icon: 'burr',
        name: { en: 'Electric grinders', ar: 'المطاحن الكهربائية' },
        desc: { en: 'Flat and conical burrs, stepless from espresso to French press.', ar: 'مطاحن مسطحة ومخروطية، تدريج مستمر من الإسبريسو إلى الفرنسية.' } }
    ]
  }
];

/* Plain links that sit beside the menus in the bar. */
var NAV_LINKS = [
  { href: 'brew-guides.html', label: { en: 'Brew guides', ar: 'طرق التحضير' } },
  { href: 'gahwa-log.html',   label: { en: 'Gahwa log', ar: 'سجل القهوة' } },
  { href: 'cafe.html',        label: { en: 'Café', ar: 'المقهى' } }
];

/* --- Brew guides --------------------------------------------------------
   The same recipe block component renders all three.
   ----------------------------------------------------------------------- */
var BREW_GUIDES = [
  {
    id: 'v60',
    method: 'filter',
    methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
    title: { en: 'Hambela Washed · one cup', ar: 'همبيلا مغسولة · فنجان واحد' },
    note: {
      en: 'The house filter recipe. If a brew tastes thin, grind one click finer before you touch anything else.',
      ar: 'وصفة التقطير في بلوم. إن جاء الفنجان خفيفاً، اطحن نقرة أنعم قبل أن تغيّر أي شيء آخر.'
    },
    dose: 15, water: 250, temp: 93, bloom: 30, bloomTime: 30, total: '2:45',
    grind: { en: 'Medium-fine', ar: 'وسط ناعم' }
  },
  {
    id: 'press',
    method: 'press',
    methodName: { en: 'French press', ar: 'المكبس الفرنسي' },
    title: { en: 'Huila Natural · two cups', ar: 'هويلا طبيعية · فنجانان' },
    note: {
      en: 'Full immersion, no plunging until the end. Skimming the crust at 4:00 is what keeps the cup clean.',
      ar: 'نقع كامل، ولا تكبس حتى النهاية. إزالة القشرة عند 4:00 هي ما يبقي الفنجان نظيفاً.'
    },
    dose: 30, water: 500, temp: 95, bloom: 60, bloomTime: 30, total: '8:00',
    grind: { en: 'Coarse', ar: 'خشن' }
  },
  {
    id: 'espresso',
    method: 'espresso',
    methodName: { en: 'Espresso', ar: 'إسبريسو' },
    title: { en: 'Haraz Natural · double shot', ar: 'حراز طبيعية · جرعة مزدوجة' },
    note: {
      en: 'Weigh in and weigh out. Two grams of yield is the difference between fig and ash.',
      ar: 'زِن الداخل والخارج. غرامان في الناتج هما الفرق بين التين والرمادي.'
    },
    dose: 18, yield: 38, water: 38, temp: 93, total: '0:28',
    grind: { en: 'Fine', ar: 'ناعم' }
  }
];

/* --- The café ----------------------------------------------------------- */
var CAFE = {
  address: {
    en: ['Bloom Coffee', 'Block 5, Street 21, Shop 3', 'Salmiya, Hawalli', 'Kuwait'],
    ar: ['بلوم للقهوة المختصة', 'قطعة ٥، شارع ٢١، محل ٣', 'السالمية، حولي', 'الكويت']
  },
  phone: '+965 2222 0930',
  hours: [
    { day: { en: 'Saturday – Wednesday', ar: 'السبت – الأربعاء' }, time: '07:00 – 22:00' },
    { day: { en: 'Thursday', ar: 'الخميس' }, time: '07:00 – 23:00' },
    { day: { en: 'Friday', ar: 'الجمعة' }, time: '13:00 – 23:00' }
  ],
  bar: [
    {
      what: { en: 'Filter · Hambela Washed', ar: 'تقطير · همبيلا مغسولة' },
      detail: { en: '15 g / 250 g · 93 °C · 1:16.6', ar: '15 غم / 250 غم · 93 °م · 1:16.6' }
    },
    {
      what: { en: 'Espresso · Haraz Natural', ar: 'إسبريسو · حراز طبيعية' },
      detail: { en: '18 g in / 38 g out · 28 s', ar: '18 غم داخل / 38 غم خارج · 28 ثانية' }
    },
    {
      what: { en: 'Batch brew · Huila Natural', ar: 'دفعة · هويلا طبيعية' },
      detail: { en: '60 g / L · 93 °C · by the cup', ar: '60 غم / لتر · 93 °م · بالفنجان' }
    },
    {
      what: { en: 'Cortado · Haraz', ar: 'كورتادو · حراز' },
      detail: { en: '18 g / 38 g + 90 ml milk · 65 °C', ar: '18 غم / 38 غم + 90 مل حليب · 65 °م' }
    }
  ]
};

/* --- Footer ------------------------------------------------------------- */
var FOOTER = [
  {
    title: { en: 'Shop', ar: 'المتجر' },
    links: [
      { href: 'beans.html',    label: { en: 'Beans', ar: 'حبوب البن' } },
      { href: 'tools.html',    label: { en: 'Brewing tools', ar: 'أدوات التحضير' } },
      { href: 'machines.html', label: { en: 'Machines', ar: 'المكائن' } },
      { href: 'cart.html',     label: { en: 'Cart', ar: 'السلة' } }
    ]
  },
  {
    title: { en: 'Learn', ar: 'تعلّم' },
    links: [
      { href: 'brew-guides.html',     label: { en: 'Brew guides', ar: 'طرق التحضير' } },
      { href: 'index.html#the-bloom', label: { en: 'What the bloom is', ar: 'ما هو التفتّح' } },
      { href: 'brew-guides.html#v60', label: { en: 'V60 recipe', ar: 'وصفة V60' } },
      { href: 'brew-guides.html#espresso', label: { en: 'Espresso recipe', ar: 'وصفة الإسبريسو' } }
    ]
  },
  {
    title: { en: 'Bloom', ar: 'بلوم' },
    links: [
      { href: 'cafe.html',          label: { en: 'The café', ar: 'المقهى' } },
      { href: 'cafe.html#hours',    label: { en: 'Opening hours', ar: 'أوقات العمل' } },
      { href: 'cafe.html#find-us',  label: { en: 'Find us', ar: 'كيف تجدنا' } },
      { href: 'gahwa-log.html',     label: { en: 'Gahwa log', ar: 'سجل القهوة' } },
      { href: 'index.html',         label: { en: 'Home', ar: 'الرئيسية' } }
    ]
  }
];
