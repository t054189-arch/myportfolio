/* ==========================================================================
   gahwa — the regulars board
   ==========================================================================
   A cafe that embeds the widget learns one thing: that check-ins happened
   at their venue. Not who, not how often that person comes, not where
   else they go. That rule is kept here rather than in the interface,
   because an interface can be inspected and a function cannot be asked
   for columns it does not return.

   This is SECURITY DEFINER on purpose — it has to see rows the caller
   cannot — and it is safe only because of what it gives back: counts.
   There is no user_id in the result, no row detail, and no way to ask it
   for one. If a future version needs to show names, that is a different
   function with consent behind it, not a widened version of this one.

   Verified check-ins only. Anything public needs proof; a printed QR can
   be photographed and used from a sofa, and that is fine for a diary and
   not fine for a board.
   ========================================================================== */

create function public.venue_board(p_venue text, p_days int default 7)
returns table (
  venue_id  text,
  name_en   text,
  name_ar   text,
  area      text,
  checkins  bigint,
  regulars  bigint,
  today     bigint,
  days      jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  with head as (
    select coalesce(v.merged_into, v.id) as id from venues v where v.id = p_venue
  ),
  visits as (
    select g.user_id, g.had_at
    from gahwa_logs g
    join venues v on v.id = g.venue_id
    where coalesce(v.merged_into, v.id) = (select id from head)
      and g.verified
      and g.had_at > now() - make_interval(days => greatest(coalesce(p_days, 7), 1))
  )
  select ve.id, ve.name_en, ve.name_ar, ve.area,
         (select count(*) from visits),
         (select count(distinct user_id) from visits),
         (select count(*) from visits
            where (had_at at time zone 'Asia/Kuwait')::date
                = (current_timestamp at time zone 'Asia/Kuwait')::date),
         (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d), '[]'::jsonb)
            from (select (had_at at time zone 'Asia/Kuwait')::date as d, count(*) as n
                    from visits group by 1) x)
  from head h join venues ve on ve.id = h.id;
$$;

revoke execute on function public.venue_board(text, int) from public;
grant  execute on function public.venue_board(text, int) to anon, authenticated;

comment on function public.venue_board(text, int) is
  'Counts only, for a venue''s public board. Never returns a user_id, a '
  'row, or anything about an individual. Counts verified check-ins only.';
