/* Bloom — the catalogue.

   This mirrors PRODUCTS in js/data.js. The shape follows that file
   deliberately: bilingual scalars become _en / _ar column pairs, and the
   variable-key nested objects (specs, recipe, bagColour) stay as jsonb
   because their keys differ per category — a bean has altitude and
   varietal, a grinder has burrs and steps. Forcing those into columns
   would mean a wide table of mostly-null fields.

   Money is stored in fils (1 KWD = 1000 fils) as an integer. Never a
   float: 6.500 is not representable in binary floating point, and a
   rounding error in a price is a rounding error in a receipt. */

create table products (
  id            text primary key,             -- 'eth-guji', matches data.js
  category      text not null check (category in ('beans','tools','machines')),
  icon          text,                          -- ICONS key, tools/machines only
  sort_order    integer not null default 0,    -- preserves the data.js order

  name_en       text not null,
  name_ar       text not null,
  origin_en     text not null,
  origin_ar     text not null,
  notes_en      text not null,                 -- the short card blurb
  notes_ar      text not null,
  desc_en       text,                          -- the long product-page copy
  desc_ar       text,
  unit_en       text not null,                 -- '250 g' / 'size 02'
  unit_ar       text not null,

  price_fils    integer not null check (price_fils > 0),
  stock         integer not null default 0 check (stock >= 0),
  tags          text[]  not null default '{}',
  specs         jsonb   not null default '{}'::jsonb,
  recipe        jsonb,                         -- beans only
  bag_colour    jsonb,                         -- beans only: {body, top}
  model         text,                          -- 3D model key for Scene.mount
  image         text not null,

  updated_at    timestamptz not null default now()
);

comment on column products.price_fils is
  'Price in fils. 6500 = 6.500 KWD. Divide by 1000 for display.';

/* The flavour rings. data.js calls this array `flavour`; each entry is a
   key into NOTES, which supplies the glyph and the colour. Ordered,
   because the ring lays the chips out in sequence. */
create table product_flavours (
  product_id  text    not null references products (id) on delete cascade,
  note_key    text    not null,
  position    integer not null,
  primary key (product_id, note_key)
);

create index on product_flavours (product_id, position);
create index on products (category, sort_order);

/* The catalogue is a shop window: everyone reads it, nobody writes it
   from the browser. Edits happen in the Supabase dashboard or through a
   service-role key that never leaves a server. */
alter table products         enable row level security;
alter table product_flavours enable row level security;

create policy "catalogue is public" on products
  for select using (true);

create policy "flavours are public" on product_flavours
  for select using (true);
