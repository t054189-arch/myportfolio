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
  clock       : '<circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.4l3.6 2.2"/>',
  drop        : '<path d="M12 3.2s6 6.4 6 10.4a6 6 0 0 1-12 0c0-4 6-10.4 6-10.4z"/>'
};

/* Build an inline SVG for one icon. Decorative by default. */
function icon(name, cls) {
  var d = ICONS[name] || '';
  return '<svg viewBox="0 0 24 24" class="' + (cls || '') + '" aria-hidden="true" focusable="false">' + d + '</svg>';
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

  /* ---------- Beans ---------- */
  {
    id: 'eth-guji',
    category: 'beans',
    name:   { en: 'Hambela Washed', ar: 'همبيلا مغسولة' },
    origin: { en: 'Ethiopia · Guji', ar: 'إثيوبيا · قوجي' },
    price: 6.500,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['classic', 'filter'],
    notes: {
      en: 'Jasmine, peach and black tea. Light-roasted for filter — the clean, floral classic.',
      ar: 'ياسمين وخوخ وشاي أسود. تحميص فاتح للتقطير — نظيف وزهري وكلاسيكي.'
    },
    about: {
      en: 'Grown at 2050 m in the Guji highlands and fully washed at the mill, so the cup arrives clear and tea-like. We roast it light on Tuesdays and rest it three days before it ships. It is the bean we hand to anyone brewing pour-over for the first time.',
      ar: 'تُزرع على ارتفاع ٢٠٥٠ متراً في مرتفعات قوجي وتُغسل كاملاً في المعمل، فيأتي الفنجان صافياً قريباً من الشاي. نحمّصها تحميصاً فاتحاً كل ثلاثاء وتستريح ثلاثة أيام قبل الشحن. هذه أول حبة نرشّحها لمن يبدأ بالتقطير.'
    },
    specs: {
      process:  { en: 'Washed', ar: 'مغسولة' },
      altitude: { en: '2050 m', ar: '2050 م' },
      roast:    { en: 'Filter', ar: 'تقطير' },
      varietal: { en: 'Heirloom', ar: 'أصناف محلية' },
      harvest:  { en: 'Nov 2025', ar: 'نوفمبر 2025' }
    },
    recipe: {
      method: 'filter',
      methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 15, water: 250, temp: 93, bloom: 30, bloomTime: 30,
      total: '2:45',
      grind: { en: 'Medium-fine', ar: 'وسط ناعم' }
    },
    stock: 12,
    image: 'assets/eth-guji.svg'
  },
  {
    id: 'col-huila',
    category: 'beans',
    name:   { en: 'Huila Natural', ar: 'هويلا طبيعية' },
    origin: { en: 'Colombia · Huila', ar: 'كولومبيا · هويلا' },
    price: 6.000,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['fruity', 'filter'],
    notes: {
      en: 'Red cherry, cane sugar and apple skin. Natural process — juicy and bright.',
      ar: 'كرز أحمر وسكر قصب وقشر تفاح. معالجة طبيعية — عصيرية ومنعشة.'
    },
    about: {
      en: 'Dried whole on raised beds for eighteen days, which pushes the fruit forward without tipping into ferment. Sweet enough to drink black all afternoon, and forgiving if your pour wanders. Brew it a degree cooler than the Ethiopian.',
      ar: 'تُجفَّف كاملة على أسِرَّة مرتفعة ثمانية عشر يوماً، فتبرز الفاكهة دون أن تنقلب إلى تخمّر. حلاوتها تكفي لشربها سادة طول العصر، وهي متسامحة إن تعثّر صبّك. حضّرها بدرجة أبرد من الإثيوبية.'
    },
    specs: {
      process:  { en: 'Natural', ar: 'طبيعية' },
      altitude: { en: '1750 m', ar: '1750 م' },
      roast:    { en: 'Filter', ar: 'تقطير' },
      varietal: { en: 'Caturra', ar: 'كاتورا' },
      harvest:  { en: 'Oct 2025', ar: 'أكتوبر 2025' }
    },
    recipe: {
      method: 'filter',
      methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 15, water: 250, temp: 92, bloom: 30, bloomTime: 30,
      total: '3:00',
      grind: { en: 'Medium', ar: 'وسط' }
    },
    stock: 20,
    image: 'assets/col-huila.svg'
  },
  {
    id: 'yem-haraz',
    category: 'beans',
    name:   { en: 'Haraz Natural', ar: 'حراز طبيعية' },
    origin: { en: 'Yemen · Haraz', ar: 'اليمن · حراز' },
    price: 14.000,
    unit:  { en: '250 g', ar: '٢٥٠ غم' },
    tags: ['classic', 'espresso'],
    notes: {
      en: 'Dark chocolate, dried fig and warm spice. Deep and traditional — excellent as espresso.',
      ar: 'شوكولاتة داكنة وتين مجفف وبهار دافئ. عميقة وتقليدية — ممتازة كإسبريسو.'
    },
    about: {
      en: 'Terraced smallholder plots at 2200 m, sun-dried on rooftops the way they have been for centuries. Heavy in the mouth, low in acidity, and unmistakably Yemeni. Pulled as espresso it tastes of fig and cardamom; brewed as filter it turns into cocoa.',
      ar: 'مدرّجات صغيرة على ارتفاع ٢٢٠٠ متر، تُجفَّف شمساً على الأسطح كما جرت العادة منذ قرون. ثقيلة في الفم، قليلة الحموضة، ويمناوية بلا التباس. كإسبريسو تعطي التين والهيل، وكقطرة تتحوّل إلى كاكاو.'
    },
    specs: {
      process:  { en: 'Natural', ar: 'طبيعية' },
      altitude: { en: '2200 m', ar: '2200 م' },
      roast:    { en: 'Espresso', ar: 'إسبريسو' },
      varietal: { en: 'Udaini', ar: 'عُديني' },
      harvest:  { en: 'Sep 2025', ar: 'سبتمبر 2025' }
    },
    recipe: {
      method: 'filter',
      methodName: { en: 'V60 pour-over', ar: 'تقطير V60' },
      dose: 16, water: 250, temp: 94, bloom: 32, bloomTime: 30,
      total: '3:10',
      grind: { en: 'Medium', ar: 'وسط' }
    },
    stock: 6,
    image: 'assets/yem-haraz.svg'
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
    about: {
      en: 'A 60° cone with spiral ribs, so the paper never seals against the wall and the bed drains evenly. Ceramic holds heat best; plastic is the one to travel with.',
      ar: 'قمع بزاوية ٦٠° وأخاديد حلزونية، فلا تلتصق الورقة بالجدار ويصرّف القاع بانتظام. السيراميك يحفظ الحرارة أفضل، والبلاستيك أنسب للسفر.'
    },
    specs: {
      material: { en: 'Ceramic · glass · plastic', ar: 'سيراميك · زجاج · بلاستيك' },
      size:     { en: '02 · 1–4 cups', ar: '٠٢ · 1–4 فناجين' },
      ribs:     { en: 'Spiral, 60° cone', ar: 'حلزونية، قمع 60°' }
    },
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
    about: {
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
    about: {
      en: 'Conical steel burrs on a double bearing, so the shaft does not wobble and the grind stays even. Thirty clicks from espresso to French press; filter sits around click 18.',
      ar: 'مطاحن مخروطية من الفولاذ على محملين، فلا يتأرجح العمود ويبقى الطحن متساوياً. ثلاثون نقرة من الإسبريسو إلى الفرنسية، والتقطير عند النقرة ١٨ تقريباً.'
    },
    specs: {
      burrs:    { en: '48 mm stainless conical', ar: 'مخروطية ستانلس 48 مم' },
      steps:    { en: '30 clicks · 22 µm each', ar: '30 نقرة · 22 ميكرون لكل نقرة' },
      capacity: { en: '30 g', ar: '30 غم' }
    },
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
    about: {
      en: 'The narrow spout is the whole point: it turns your wrist into a flow-rate control. Set it to 93 °C and it holds there while you pour.',
      ar: 'الفوهة الضيقة هي الفكرة كلها: تحوّل معصمك إلى منظّم لسرعة الصبّ. اضبطها على 93 °م وتثبت عندها أثناء الصبّ.'
    },
    specs: {
      capacity: { en: '0.6–1.0 L', ar: '0.6–1.0 لتر' },
      range:    { en: '40–100 °C', ar: '40–100 °م' },
      hold:     { en: '±1 °C for 60 min', ar: '±1 °م لمدة 60 دقيقة' }
    },
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
    about: {
      en: 'Weigh the coffee, weigh the water, watch the clock — that is most of brewing. The timer starts itself at the first drop, which is exactly when the bloom begins.',
      ar: 'زِن البنّ، زِن الماء، وراقب الوقت — هذا معظم التحضير. يبدأ المؤقّت تلقائياً مع أول قطرة، وهي لحظة بدء التفتّح.'
    },
    specs: {
      accuracy: { en: '0.1 g', ar: '0.1 غم' },
      capacity: { en: '2000 g', ar: '2000 غم' },
      timer:    { en: 'Auto-start at first drop', ar: 'بدء تلقائي مع أول قطرة' }
    },
    stock: 18,
    image: 'assets/scale.svg'
  },
  {
    id: 'thermometer',
    category: 'tools',
    icon: 'thermometer',
    name:   { en: 'Probe thermometer', ar: 'ميزان حرارة' },
    origin: { en: 'Thermometer', ar: 'حرارة' },
    price: 6.750,
    unit:  { en: '1 pc', ar: 'حبة' },
    tags: ['weighing'],
    notes: {
      en: 'Instant read, 0–100 °C — brew at 92–94 °C.',
      ar: 'قراءة فورية، 0–100 °م — حضّر عند 92–94 °م.'
    },
    about: {
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
    price: 8.000,
    unit:  { en: '600 ml', ar: '٦٠٠ مل' },
    tags: ['brewing'],
    notes: {
      en: 'Heat-proof glass carafes, 400 and 600 ml, with markings.',
      ar: 'دوارق زجاج مقاوم للحرارة، 400 و600 مل، بتدريجات.'
    },
    about: {
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
    price: 285.000,
    unit:  { en: 'dual boiler', ar: 'سخّان مزدوج' },
    tags: ['espresso'],
    notes: {
      en: 'Single boiler to dual boiler, 9 bar, PID temperature control.',
      ar: 'من سخّان واحد إلى سخّانين، 9 بار، وتحكّم PID بالحرارة.'
    },
    about: {
      en: 'A 58 mm group and a real PID, which is what separates a repeatable shot from a lucky one. Brew and steam at once, and a 30-minute warm-up before the first cup.',
      ar: 'رأس 58 مم ومنظّم PID حقيقي، وهذا ما يفرق بين جرعة متكرّرة وجرعة محظوظة. تحضير وبخار في الوقت نفسه، مع تسخين 30 دقيقة قبل أول فنجان.'
    },
    specs: {
      boiler:   { en: 'Dual · 1.8 L', ar: 'مزدوج · 1.8 لتر' },
      pressure: { en: '9 bar', ar: '9 بار' },
      pid:      { en: '±0.3 °C', ar: '±0.3 °م' },
      group:    { en: '58 mm', ar: '58 مم' }
    },
    stock: 4,
    image: 'assets/espresso.svg'
  },
  {
    id: 'filter-brewer',
    category: 'machines',
    icon: 'brewer',
    name:   { en: 'Batch brewer', ar: 'مكينة تقطير' },
    origin: { en: 'Filter brewer', ar: 'تقطير' },
    price: 165.000,
    unit:  { en: '1.9 L', ar: '١٫٩ لتر' },
    tags: ['filter'],
    notes: {
      en: 'Batch brewers that hold 93 °C and shower evenly.',
      ar: 'مكائن دفعات تثبّت 93 °م وتوزّع الماء بانتظام.'
    },
    about: {
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
    price: 145.000,
    unit:  { en: '64 mm flat', ar: 'مسطحة ٦٤ مم' },
    tags: ['grinding'],
    notes: {
      en: 'Flat and conical burrs, stepless from espresso to French press.',
      ar: 'مطاحن مسطحة ومخروطية، تدريج مستمر من الإسبريسو إلى الفرنسية.'
    },
    about: {
      en: 'Stepless adjustment, so you can chase a shot by a hair rather than a whole click. Single-dose it and it retains under half a gram.',
      ar: 'تدريج مستمر، فتضبط الجرعة بفروق دقيقة لا بنقرة كاملة. مع الجرعة المفردة يبقى فيها أقل من نصف غرام.'
    },
    specs: {
      burrs:  { en: '64 mm flat steel', ar: 'مسطحة فولاذ 64 مم' },
      adjust: { en: 'Stepless', ar: 'مستمر' },
      rpm:    { en: '1350 rpm', ar: '1350 دورة/دقيقة' }
    },
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
      { href: 'index.html',         label: { en: 'Home', ar: 'الرئيسية' } }
    ]
  }
];
