/* ==========================================================================
   Bloom — where the shop's data lives
   ==========================================================================
   One place for the two values js/auth.js and js/db.js both need, so a
   project move is a one-line edit rather than a search across files.

   The key is public, and that is not an oversight. A publishable key is
   designed to sit in front-end source; a static site has nowhere to hide
   one, and pretending otherwise would be worse than being plain about
   it. What protects the data is row-level security in Postgres, declared
   in supabase/migrations/ — the catalogue is readable by anyone, and
   every other table is readable only by the account that owns the row.
   Holding this key lets you read the shop window. It lets you do nothing
   else.
   ========================================================================== */

var BLOOM = {
  url: 'https://amejrcyvjbaepglimnal.supabase.co',
  key: 'sb_publishable_Fnoec4qtrKX045pvCmSgrw_fh-ACiLp'
};
