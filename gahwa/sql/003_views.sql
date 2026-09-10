/* ==========================================================================
   gahwa — what the check-ins add up to
   ==========================================================================
   All four views are security_invoker, which is why they are safe to
   expose: a view normally runs with its author's rights and would hand
   one person's totals to anyone who selected from it. With this flag the
   table policies apply to whoever is asking, so each returns exactly one
   person's numbers.

   Every venue lookup resolves merged_into, so a check-in filed at a
   duplicate that was later merged displays as the surviving venue and
   counts towards it.
   ========================================================================== */

create view v_gahwa_places
with (security_invoker = true) as
select g.user_id,
       coalesce(sv.name_en, g.place_note, 'Unsaved place') as place_name,
       sv.name_ar,
       sv.id                        as venue_id,
       coalesce(sv.kind, 'other'::place_kind) as kind,
       sv.area,
       sv.governorate,
       count(*)                     as visits,
       count(*) filter (where g.verified) as verified_visits,
       round(avg(g.rating), 1)      as avg_rating,
       max(g.had_at)                as last_visit
from gahwa_logs g
left join venues v  on v.id = g.venue_id
left join venues sv on sv.id = coalesce(v.merged_into, v.id)
group by g.user_id, coalesce(sv.name_en, g.place_note, 'Unsaved place'),
         sv.name_ar, sv.id, sv.kind, sv.area, sv.governorate;

create view v_gahwa_people
with (security_invoker = true) as
select user_id, person, count(*) as cups, round(avg(rating), 1) as avg_rating,
       max(had_at) as last_time
from gahwa_logs, unnest(company) as person
group by user_id, person;

create view v_gahwa_streak
with (security_invoker = true) as
with days as (
  select user_id, (had_at at time zone 'Asia/Kuwait')::date as d
  from gahwa_logs group by 1, 2
),
islands as (
  select user_id, d,
         d - (row_number() over (partition by user_id order by d))::int as grp
  from days
),
runs as (
  select user_id, grp, count(*) as len, max(d) as ended
  from islands group by 1, 2
)
select user_id,
       max(len) as longest_streak,
       /* Anchored in Kuwait time, not the server's: the days above are
          bucketed at Asia/Kuwait midnight, and comparing them against a
          UTC current_date disagrees for the three hours after midnight
          there — exactly when someone logging a late cup would look. */
       coalesce(max(len) filter (
         where ended >= (current_timestamp at time zone 'Asia/Kuwait')::date - 1
       ), 0) as current_streak
from runs group by user_id;

/* The map is by governorate, not by coordinates. That is not a
   compromise forced by the no-GPS rule — it is the honest shape of the
   data: the module knows which governorate a venue is in because the
   directory says so, and it has never known where any person was. */
create view v_gahwa_map
with (security_invoker = true) as
select g.user_id,
       sv.governorate,
       count(*)                        as visits,
       count(distinct sv.id)           as venues,
       max(g.had_at)                   as last_visit
from gahwa_logs g
join venues v  on v.id = g.venue_id
join venues sv on sv.id = coalesce(v.merged_into, v.id)
where sv.governorate is not null
group by g.user_id, sv.governorate;

create view v_gahwa_summary
with (security_invoker = true) as
select g.user_id,
       count(*)                                                     as total_cups,
       count(*) filter (where g.had_at > now() - interval '30 days') as cups_30d,
       count(*) filter (where g.verified)                           as verified_cups,
       count(distinct g.venue_id)                                   as venues_visited,
       round(avg(g.rating), 1)                                      as avg_rating,
       mode() within group (order by g.drink)                       as usual_drink,
       (select place_name from v_gahwa_places vp
         where vp.user_id = g.user_id order by visits desc limit 1) as top_place,
       (select person from v_gahwa_people pe
         where pe.user_id = g.user_id and person <> 'Alone'
         order by cups desc limit 1)                                as top_companion
from gahwa_logs g group by g.user_id;
