/* ==========================================================================
   gahwa — check-ins point at venues, and stop knowing about Bloom
   ==========================================================================
   Two couplings come out here.

   place_id pointed at the per-user places table; venue_id points at the
   shared directory instead, so two people at the same cafe produce two
   rows about one place rather than two places.

   product_id was a foreign key into a particular shop's product
   catalogue. A module that cannot be installed without that shop's
   `products` table is not portable, so it becomes item_ref: an opaque
   string the host site chooses the meaning of. Bloom puts its bean slug
   in it; another shop could put a SKU, or nothing.
   ========================================================================== */

alter table gahwa_logs
  drop column place_id,
  add column venue_id text references venues(id) on delete set null,
  add column verified boolean not null default false,
  add column source   text not null default 'web'
    check (source in ('web','embed','qr'));

/* Keep the free text: somewhere with no venue row yet is still a place
   someone drank coffee, and making them file paperwork first would be a
   good way to lose the entry. */
comment on column gahwa_logs.place_note is
  'Free text for a place with no venue row yet. Never shown to anyone else.';

alter table gahwa_logs rename column product_id to item_ref;
alter table gahwa_logs drop constraint if exists gahwa_logs_product_id_fkey;

comment on column gahwa_logs.item_ref is
  'Opaque reference chosen by the host site (a product slug, a SKU, or null). '
  'Deliberately not a foreign key: the module must install without any '
  'particular shop''s catalogue.';

comment on column gahwa_logs.verified is
  'True only when the counter code was checked server-side. Personal '
  'statistics count every check-in; the public regulars board counts only '
  'these.';

create index on gahwa_logs (venue_id, had_at desc);
