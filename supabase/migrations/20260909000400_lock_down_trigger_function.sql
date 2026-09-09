/* Supabase's own security linter caught this, correctly.

   handle_new_user() is SECURITY DEFINER — it has to be, because it
   writes a profile row on behalf of a user who does not exist yet. But
   it lives in the public schema, and PostgREST publishes everything in
   public: that made it callable by anyone as /rest/v1/rpc/handle_new_user.

   A direct call would fail (there is no NEW record outside a trigger),
   so this was not exploitable so much as untidy. Either way an
   anonymous visitor has no business being able to reach it. The trigger
   itself does not need these grants — it runs as the table owner — so
   revoking EXECUTE closes the endpoint and changes nothing else. */

revoke execute on function public.handle_new_user() from anon, authenticated, public;
