/* ==========================================================================
   gahwa — seeding the directory
   ==========================================================================
   A check-in app with one venue in it is not a check-in app, so the
   directory starts with coffee shops that actually exist in Kuwait. They
   go in as community listings: tenant_id null, nobody has claimed them,
   and no claim flow exists yet.

   Two rules held here, and they matter more than completeness:

   1. VENUES ONLY. No check-ins, no ratings, not one. These are real
      businesses, and an invented three-star review sitting on a real
      cafe's page is a fabricated review whatever the intent. Sample
      entries with opinions in them belong on Bloom's own venue or on the
      fictional Riwaq, and the page that shows them says so.

   2. AREA AND GOVERNORATE ARE LEFT BLANK WHERE I AM NOT CERTAIN. A wrong
      area is worse than a missing one: it looks authoritative, and it
      sends someone to the wrong side of the city. The first customer to
      check in there can fix it — that is what the update policy is for.

   The Arabic names below are transliterations, not the businesses' own
   registered Arabic names, which I have no way to verify from here. They
   should be corrected by anyone who knows better; that is also a venue
   update, and also allowed.
   ========================================================================== */

insert into venues (id, name_en, name_ar, kind, area, governorate, status) values
  -- Areas I am confident about
  ('pick-salmiya',      'Pick',                  'بيك',                'other_cafe', 'Salmiya',  'Hawalli',   'live'),
  ('ananas-salmiya',    'Ananas Coffee Bar',     'أناناس كوفي بار',    'other_cafe', 'Salmiya',  'Hawalli',   'live'),
  ('roots-shuwaikh',    'Roots Roastery',        'روتس روستري',        'other_cafe', 'Shuwaikh', 'Capital',   'live'),
  ('oru-shuwaikh',      'Oru Roasters',          'أورو روسترز',        'other_cafe', 'Shuwaikh', 'Capital',   'live'),
  ('arabica-avenues',   '%Arabica, The Avenues', '٪أرابيكا، الأفنيوز', 'other_cafe', 'Al Rai',   'Farwaniya', 'live'),

  -- Real places whose area I am not sure enough of to state
  ('methods-roastery',  'Methods Roastery',      'ميثودز روستري',      'other_cafe', null, null, 'live'),
  ('lean',              'Lean',                  'لين',                'other_cafe', null, null, 'live'),
  ('hazan',             'Hazan',                 'هازان',              'other_cafe', null, null, 'live'),
  ('earth-roastery',    'Earth Roastery',        'إيرث روستري',        'other_cafe', null, null, 'live'),
  ('48east-roastery',   '48East Roastery',       '٤٨ إيست روستري',     'other_cafe', null, null, 'live'),
  ('house-of-beans',    'House of Beans',        'هاوس أوف بينز',      'other_cafe', null, null, 'live'),
  ('wjaar-roastery',    'Wjaar Roastery',        'وجار روستري',        'other_cafe', null, null, 'live'),
  ('rawi-coffee',       'Rawi Coffee',           'راوي كوفي',          'other_cafe', null, null, 'live'),
  ('pause-roasters',    'Pause Coffee Roasters', 'بوز كوفي روسترز',    'other_cafe', null, null, 'live'),
  ('origin-roasters',   'Origin Roasters',       'أوريجن روسترز',      'other_cafe', null, null, 'live'),
  ('altitude-roasters', 'Altitude Roasters',     'التيتيود روسترز',    'other_cafe', null, null, 'live'),
  ('jumo-coffee',       'Jumo Coffee',           'جومو كوفي',          'other_cafe', null, null, 'live'),

  -- The host site's own branch, and the fictional cafe used to prove the
  -- widget travels. Riwaq is invented; its page says so.
  ('bloom-salmiya',     'Bloom, Salmiya',        'بلوم، السالمية',     'bloom_cafe', 'Salmiya', 'Hawalli', 'live'),
  ('riwaq-jabriya',     'Riwaq',                 'رواق',               'other_cafe', 'Jabriya', 'Hawalli', 'live')
on conflict (id) do update set
  name_en = excluded.name_en, name_ar = excluded.name_ar,
  kind = excluded.kind, status = excluded.status;

/* Counter codes for the two venues this project actually controls. They
   are generated here rather than written down, because this repository is
   public and a code committed to git is not a secret. Read yours from the
   dashboard; rotate it by updating this row. Real cafes in the list above
   get no code from us — theirs is theirs to set. */
insert into venue_codes (venue_id, code)
select id, upper(substr(md5(random()::text || id), 1, 6))
from venues where id in ('bloom-salmiya', 'riwaq-jabriya')
on conflict (venue_id) do nothing;
