/* ==========================================================================
   Bloom — the gahwa log
   ==========================================================================
   This is the most personal table in the database. It records where one
   named person drinks coffee, on which days, and the names of the people
   sitting with them — and those people never agreed to be in anyone's
   database. Two omissions below are therefore deliberate, and are written
   here so that whoever opens this schema next does not read them as
   oversights and "fix" them:

   1. THERE IS NO STAFF POLICY ON gahwa_logs, AND NONE MAY BE ADDED.
      The only policy is the owner's own. Nobody at the shop — not
      support, not a manager, not an analyst — can read a customer's log,
      and no admin screen may be built over it. If a customer needs help
      with their log, the answer is to help them read their own, not to
      read it for them.

   2. THIS DATA IS NEVER MINED FOR MARKETING.
      Not for recommendations, not for segments, not for "customers like
      you", not for a mailing list. If the shop wants to know what sells,
      the orders table answers that from data a customer handed over on
      purpose, in exchange for coffee. This table is a diary they keep for
      themselves and store here for convenience. The difference matters.

   Also, on purpose and for the same reasons: no coordinates anywhere in
   this schema. A place is a name the customer chose. The site never asks
   the browser for a location, so there is nothing here to put one in.
   ========================================================================== */

create type place_kind   as enum ('bloom_cafe','other_cafe','home','work','majlis','outdoors','travel','other');
create type company_kind as enum ('alone','family','friends','colleagues','guests','work_meeting');

/* Places are reusable so "Bloom, Salmiya" isn't retyped every visit.
   user_id null = a shared place everyone can pick (Bloom's own branches). */
create table places (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  name       text not null,
  kind       place_kind not null default 'other_cafe',
  area       text,                       -- Salmiya, Kuwait City, Jabriya
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, name)
);

create table gahwa_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,

  -- when it happened, not when it was typed
  had_at       timestamptz not null default now(),

  -- WHERE
  place_id     uuid references places(id) on delete set null,
  place_note   text,                     -- free text when they don't want a saved place

  -- WITH WHO
  company      text[] not null default '{}',   -- names or nicknames, the user's own words
  company_kind company_kind not null default 'alone',

  -- WAS IT ANY GOOD
  rating       smallint check (rating between 1 and 5),
  note         text,

  -- what it actually was
  drink        text not null,            -- 'V60','Espresso','Cortado','Arabic coffee','Turkish'
  product_id   text references products(id) on delete set null,  -- if it was a Bloom bean
  dose_g       numeric(5,1),             -- optional, only when brewed at home
  photo_path   text,                     -- Supabase Storage, private bucket

  created_at   timestamptz not null default now()
);

create index on gahwa_logs (user_id, had_at desc);
create index on gahwa_logs (user_id, place_id);
create index on gahwa_logs using gin (company);


/* --- Row level security ------------------------------------------------ */

alter table places     enable row level security;
alter table gahwa_logs enable row level security;

-- Shared places are readable by all; your own places are yours.
create policy "read places" on places for select
  using (user_id is null or user_id = auth.uid());
create policy "write own places" on places for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The log is private. There is no policy that lets anyone else read it,
-- including staff. This is deliberate — do not add one.
create policy "own gahwa log" on gahwa_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
