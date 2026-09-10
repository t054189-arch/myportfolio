/* ==========================================================================
   gahwa — the venue directory
   ==========================================================================
   The old `places` table was per-user and shaped for one shop: two people
   at the same cafe created two unrelated rows. A check-in module needs the
   opposite — one shared row per real place, so that everyone who checks in
   at Roots lands on the same Roots.

   Nothing in this file knows about any particular coffee shop's website.
   A venue is a slug, two names, a kind and an area. That is all a host
   site has to agree with.
   ========================================================================== */

create type venue_status as enum ('pending','live','merged');

create table venues (
  id          text primary key,               -- slug: 'bloom-salmiya', 'riwaq-jabriya'
  name_en     text not null,
  name_ar     text not null,
  kind        place_kind not null default 'other_cafe',
  area        text,
  governorate text check (governorate in
    ('Capital','Hawalli','Farwaniya','Ahmadi','Jahra','Mubarak Al-Kabeer')),
  status      venue_status not null default 'pending',
  merged_into text references venues(id),
  /* Null means nobody has claimed this venue. There is no claim flow yet
     — a shop cannot currently prove a listing is theirs — so today this
     column is always null and is here to be filled by that flow when it
     exists, not to pretend it already does. */
  tenant_id   uuid references profiles(id),
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create index on venues (status, name_en);

/* A short code the cafe shows at the counter, so the regulars board can
   tell a person who was there from a person who photographed the QR.
   Changeable by the shop, never sent to the browser: there is no select
   policy on this table at all, and checking a code happens in an Edge
   Function holding the service key. */
create table venue_codes (
  venue_id   text primary key references venues(id) on delete cascade,
  code       text not null check (char_length(code) between 4 and 8),
  rotated_at timestamptz not null default now()
);

alter table venues      enable row level security;
alter table venue_codes enable row level security;

-- The directory is public: a check-in module with a private directory
-- would be useless, and a venue name is not anyone's personal data.
create policy "venues are readable" on venues for select using (true);

-- Anyone signed in may add a missing cafe. It starts 'pending' and works
-- immediately for its creator; a moderation queue would promote it.
create policy "signed-in visitors may add a venue" on venues for insert
  with check (auth.uid() is not null and created_by = auth.uid() and status = 'pending');

create policy "the person who added it may fix it" on venues for update
  using (created_by = auth.uid()) with check (created_by = auth.uid());

/* venue_codes deliberately has row level security on and NOT ONE POLICY.
   That is not an omission: it means no browser holding any anon or
   authenticated key can read, write or guess at a counter code. Only the
   service key, inside an Edge Function, can see it. */
