# The Bloom database

Bloom started as a purely static site: eighteen products hard-coded in
`js/data.js`, a cart in `localStorage`, and a sign-in form that verified
nothing. This directory is the beginning of a real back end behind it.

**Project ref:** `amejrcyvjbaepglimnal` · region `eu-central-1` (Frankfurt)
**API URL:** `https://amejrcyvjbaepglimnal.supabase.co`

## What is wired up right now

**Accounts.** `js/auth.js` talks to Supabase Auth. An account exists only
once someone creates one on the sign-up panel, and only that email and
password will sign in — the old behaviour, where any username with any
four characters was accepted, is gone, and any session left over from it
is cleared on first load. What sits in `localStorage` is an access token
issued by the server, not a flag claiming to be signed in, and every page
load asks `/auth/v1/user` whether that token is still real, so a
hand-written one is thrown out rather than believed.

**The catalogue.** `js/db.js` asks Postgres for current prices and stock
*after* the page has already been drawn from `js/data.js`, then patches the
numbers in place. That ordering is the whole point:

- the site still opens from a `file://` URL with no network at all;
- a slow or blocked database costs the visitor nothing, because they are
  already looking at a finished page;
- nothing re-renders, so 3D scenes and flavour rings are never torn down
  mid-animation — only the price text, the stock sentence, and the cart
  are refreshed.

So **changing a price no longer means editing JavaScript.** Edit the
`products` row in the Supabase dashboard and it is live on the next load.

## One setting to check before anyone signs up

**Authentication → Sign In / Providers → Email → Confirm email**, in the
Supabase dashboard. It decides which of two paths a new customer takes,
and both are handled in the code:

| Confirm email | What happens on sign-up |
|---|---|
| **off** | The server returns a session; the customer is signed in immediately and lands on the home page. |
| **on** (the default) | No session. The card says "Account created. Confirm your email address, then sign in," switches to the sign-in panel, and carries the address across. Signing in before confirming is refused with its own message. |

For this shop, **off** is the sensible setting, for two practical reasons
rather than one of principle: the confirmation link is sent to whatever
**Site URL** the project has configured, which for a new project is still
`localhost:3000` and would land nowhere useful; and the built-in email
service is rate-limited to a couple of messages an hour, which is a poor
way to meet a customer. If you would rather keep confirmation on, set the
Site URL to the deployed address first and the flow works as the table
describes.

## What is not wired up

`orders` and `order_items` exist, are tested, and are empty — checkout
still ends at a notice rather than a row. `profiles` fills itself on
sign-up and is read for the name to greet, but the `lang` and `theme`
columns in it are not yet used; those preferences still live in
`localStorage` on each device.

## The gahwa log

A private diary of the coffee a customer drinks: where they were, who they
were with, and whether it was any good. It is the most personal thing in
this database, and two things about it are decisions rather than gaps:

**There is no staff policy on `gahwa_logs`, and none may be added.** The
only policy is the owner's own. Nobody at the shop can read a customer's
log, and no admin screen may be built over it. If a customer needs help
with their log, the answer is to help them read their own.

**It is never mined for marketing.** Not for recommendations, not for
segments, not for "customers like you". The orders table already answers
what sells, from data a customer handed over on purpose in exchange for
coffee. This is a diary they keep for themselves and store here for
convenience — the difference matters.

Both are written at the top of `20260910000100_gahwa_log.sql` too, so
whoever opens the schema next reads them before the tables.

Everything else follows from the same place:

- **No coordinates, anywhere.** A place is a name the customer chose.
  The site never asks the browser where it is, and there is nowhere in
  the schema to put an answer.
- **Photos are private.** They live in a bucket with `public = false`,
  under a folder named for the owner's user id, and reach the page
  through signed URLs that expire in fifteen minutes. There is no
  durable link to forward.
- **The names of companions are just text.** Whatever the customer types
  — nicknames encouraged. Nothing tries to match them to accounts,
  contacts, or each other.
- **Delete means delete.** Per-entry, and "delete my entire log" in
  account settings: photos through the Storage API first, then the rows.
  No soft-delete column, no tombstone, no copy.
- **Nothing is cached in the browser.** The page holds the log in memory
  while the tab is open and writes none of it to localStorage.

### The views

Four, all `security_invoker = true`. That flag is the reason they are
safe to expose: a view normally runs with its author's rights and would
hand one customer's totals to anyone who selected from it. With
`security_invoker` the table policies apply to whoever is asking, so each
returns exactly one person's numbers.

| View | Answers |
|---|---|
| `v_gahwa_places` | where they drink, how often, and how good it is there |
| `v_gahwa_people` | who they drink with, and whether those cups score higher |
| `v_gahwa_streak` | current and longest run of days, bucketed at Kuwait midnight |
| `v_gahwa_summary` | the headline strip: cups, 30-day count, average, usual drink, top place, top companion |

One deliberate change from the schema as specified: `v_gahwa_streak`
compares against `(current_timestamp at time zone 'Asia/Kuwait')::date`
rather than a bare `current_date`. The days are bucketed at Kuwait
midnight, and the database's own clock is UTC, so for the three hours
after midnight in Kuwait — exactly when someone logging a late cup would
look — a bare `current_date` would call a streak that ended the day
before yesterday "current". Same intent, measured on the same clock as
the buckets.

## Tables

| Table | Rows | What it is for |
|---|---|---|
| `products` | 18 | The catalogue, mirroring `PRODUCTS` in `js/data.js` |
| `product_flavours` | 32 | The tasting notes that orbit each bean bag |
| `profiles` | 0 | Display name, language and theme — created by a trigger on sign-up |
| `orders` | 0 | A placed order. `user_id` is nullable — guests must be able to buy |
| `order_items` | 0 | Lines on an order, with the price frozen at checkout |
| `places` | 1 shared | Reusable place names. `user_id` null = one of Bloom's branches, pickable by everyone |
| `gahwa_logs` | 0 | The diary. One policy, the owner's own |

Two conventions worth knowing before editing anything:

- **Money is integer fils.** `6500` is 6.500 KWD. Never store a price as
  a float — `6.500` has no exact binary representation, and a rounding
  error in a price is a rounding error in a receipt.
- **`order_items.unit_fils` is deliberately a copy** of the price at the
  moment of purchase. Raising a price tomorrow must not silently rewrite
  what someone paid last week.

## Security

The publishable key sits in `js/config.js` in plain sight. That is correct —
a publishable key is designed to be in front-end source, and there is
nowhere to hide one in a static site anyway. What actually protects the
data is row-level security, declared in the migrations here and verified
against the live database:

| Attempt | Result |
|---|---|
| Anyone reads the catalogue | allowed (18 products, 32 notes) |
| Anonymous visitor reprices or deletes a product | blocked |
| Anonymous visitor reads any order or profile | blocked |
| Anonymous visitor places a guest order | **allowed, on purpose** |
| Anonymous visitor places an order in a named user's name | blocked by policy |
| Signed-in customer reads another customer's order | blocked |
| Signed-in customer renames another customer | blocked |
| Signed-in customer edits their own profile | allowed |

The one deliberate opening — anonymous guest orders — is a spam surface.
It is acceptable for a shop that is not yet taking money, and the fix
before it does is written down in the migration: move guest checkout
behind an Edge Function holding the service-role key, so the total is
recomputed on the server instead of being trusted from the browser.

## Migrations

Applied in order:

1. `20260909000100_catalogue.sql` — `products`, `product_flavours`, public read
2. `20260909000200_accounts_orders.sql` — `profiles`, the sign-up trigger, `orders`, `order_items`
3. `20260909000300_catalogue_seed.sql` — the 18 products, generated from `js/data.js`
4. `20260909000400_lock_down_trigger_function.sql` — revokes public EXECUTE on the trigger function
5. `20260910000100_gahwa_log.sql` — the enums, `places`, `gahwa_logs`, and their policies
6. `20260910000200_gahwa_views.sql` — the four `security_invoker` views
7. `20260910000300_gahwa_photos.sql` — the private photo bucket and its per-user folder policies
8. `20260910000400_gahwa_seed_places.sql` — Bloom's own branch as a shared place, and nothing else

The seed is generated, not hand-written. Regenerate it from `js/data.js`
rather than editing it, so the shipped catalogue and the database cannot
quietly disagree.
