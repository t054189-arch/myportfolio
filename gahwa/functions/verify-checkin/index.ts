/* ==========================================================================
   gahwa — verify a check-in against the counter code
   ==========================================================================
   The only place a venue code is ever compared. It runs on the server
   with the service key, because the alternative — shipping the code to
   the browser and comparing it there — would mean publishing the code to
   everyone who opens devtools, which is the same as not having one.

   What this does NOT do, on purpose:
     - it never returns the code, or any hint of it beyond right/wrong;
     - it never says whether a venue has a code at all, so the endpoint
       cannot be used to enumerate which cafes are set up;
     - it only ever touches a row the caller already owns. A correct code
       for someone else's check-in still verifies nothing.
   ========================================================================== */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);

  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return reply({ error: 'sign in first' }, 401);

  let payload: { log_id?: string; venue_id?: string; code?: string };
  try {
    payload = await req.json();
  } catch {
    return reply({ error: 'bad request' }, 400);
  }

  const logId = String(payload.log_id ?? '');
  const venueId = String(payload.venue_id ?? '');
  const code = String(payload.code ?? '').trim().toUpperCase();
  if (!logId || !venueId || !code) return reply({ error: 'bad request' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  /* Who is asking. Done with the caller's own token against the anon
     key, so the answer is whoever the auth server says it is — not
     whoever the request body claims. */
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: auth } }
  });
  const { data: who, error: whoErr } = await asCaller.auth.getUser();
  if (whoErr || !who?.user) return reply({ error: 'sign in first' }, 401);
  const userId = who.user.id;

  const admin = createClient(url, serviceKey);

  /* Resolve a merged venue to its survivor, so a code still works after
     two duplicate listings are joined. */
  const { data: venue } = await admin
    .from('venues')
    .select('id, merged_into')
    .eq('id', venueId)
    .maybeSingle();
  const head = venue ? (venue.merged_into ?? venue.id) : venueId;

  const { data: row } = await admin
    .from('venue_codes')
    .select('code')
    .eq('venue_id', head)
    .maybeSingle();

  /* One answer for "wrong code", "no code set" and "no such venue".
     Telling them apart would turn this into a directory of which cafes
     have codes. */
  if (!row || String(row.code).trim().toUpperCase() !== code) {
    return reply({ verified: false });
  }

  const { data: updated, error: upErr } = await admin
    .from('gahwa_logs')
    .update({ verified: true })
    .eq('id', logId)
    .eq('user_id', userId)          // never anyone else's row
    .eq('venue_id', venueId)
    .select('id')
    .maybeSingle();

  if (upErr) return reply({ error: 'could not verify' }, 500);
  if (!updated) return reply({ verified: false });

  return reply({ verified: true });
});
