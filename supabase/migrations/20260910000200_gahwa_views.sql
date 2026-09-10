/* Bloom — what the gahwa log adds up to.

   Every view is security_invoker, which is the whole reason they are safe
   to expose: a view normally runs with its author's rights and would hand
   one customer's totals to anyone who selected from it. With
   security_invoker the underlying policies apply to whoever is asking, so
   these return exactly one person's numbers — their own. */

-- Places: where they actually drink coffee, and where it's good.
create view v_gahwa_places
with (security_invoker = true) as
select g.user_id,
       coalesce(p.name, g.place_note, 'Unsaved place') as place_name,
       p.kind, p.area,
       count(*)                    as visits,
       round(avg(g.rating), 1)     as avg_rating,
       max(g.had_at)               as last_visit
from gahwa_logs g
left join places p on p.id = g.place_id
group by g.user_id, coalesce(p.name, g.place_note, 'Unsaved place'), p.kind, p.area;

-- People: who they drink coffee with, and whether those cups score higher.
create view v_gahwa_people
with (security_invoker = true) as
select user_id, person, count(*) as cups, round(avg(rating), 1) as avg_rating,
       max(had_at) as last_time
from gahwa_logs, unnest(company) as person
group by user_id, person;

-- Streaks, in Kuwait time.
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
       max(len)                                                    as longest_streak,
       /* Anchored in Kuwait time, not the server's. The days above are
          bucketed at Asia/Kuwait midnight, so comparing them against a
          UTC current_date disagrees for the three hours after midnight
          in Kuwait — exactly when someone logging a late cup would look
          at this number — and would call a streak that ended the day
          before yesterday "current". Same intent as current_date - 1,
          measured on the same clock as the buckets. */
       coalesce(max(len) filter (
         where ended >= (current_timestamp at time zone 'Asia/Kuwait')::date - 1
       ), 0)                                                       as current_streak
from runs group by user_id;

-- One row per customer: the headline strip.
create view v_gahwa_summary
with (security_invoker = true) as
select g.user_id,
       count(*)                                                     as total_cups,
       count(*) filter (where g.had_at > now() - interval '30 days') as cups_30d,
       round(avg(g.rating), 1)                                      as avg_rating,
       mode() within group (order by g.drink)                       as usual_drink,
       (select place_name from v_gahwa_places vp
         where vp.user_id = g.user_id order by visits desc limit 1) as top_place,
       (select person from v_gahwa_people pe
         where pe.user_id = g.user_id and person <> 'Alone'
         order by cups desc limit 1)                                as top_companion
from gahwa_logs g group by g.user_id;
