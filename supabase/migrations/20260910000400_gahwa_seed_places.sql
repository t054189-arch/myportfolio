/* Bloom — the shared places.

   Only the shop's own branches, with user_id null so every customer can
   pick them without retyping. Nothing else is seeded: an empty log is
   honest, and invented entries would corrupt the customer's own averages,
   streaks and "most-visited place" from the first day — the numbers on
   that page are only worth looking at because nobody put anything in
   them but the person reading. */

insert into places (user_id, name, kind, area) values
  (null, 'Bloom, Salmiya', 'bloom_cafe', 'Salmiya')
on conflict (user_id, name) do update set kind = excluded.kind, area = excluded.area;
