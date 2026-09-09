# The Bloom database

Bloom started as a purely static site: eighteen products hard-coded in
`js/data.js`, a cart in `localStorage`, and a sign-in form that verified
nothing. This directory is the beginning of a real back end behind it.

**Project ref:** `amejrcyvjbaepglimnal` · region `eu-central-1` (Frankfurt)
**API URL:** `https://amejrcyvjbaepglimnal.supabase.co`

## What is wired up right now

Only the catalogue. `js/db.js` asks Postgres for current prices and stock
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

## What is not wired up

`profiles`, `orders` and `order_items` exist, are tested, and are empty.
`js/auth.js` is still the front-end shell it says it is — the honest
comment at the top of that file is still true, and will stay true until
sign-in actually goes through Supabase Auth. Nothing here has made the
login page any more real than it was.

## Tables

| Table | Rows | What it is for |
|---|---|---|
| `products` | 18 | The catalogue, mirroring `PRODUCTS` in `js/data.js` |
| `product_flavours` | 32 | The tasting notes that orbit each bean bag |
| `profiles` | 0 | Display name, language and theme, one per account |
| `orders` | 0 | A placed order. `user_id` is nullable — guests must be able to buy |
| `order_items` | 0 | Lines on an order, with the price frozen at checkout |

Two conventions worth knowing before editing anything:

- **Money is integer fils.** `6500` is 6.500 KWD. Never store a price as
  a float — `6.500` has no exact binary representation, and a rounding
  error in a price is a rounding error in a receipt.
- **`order_items.unit_fils` is deliberately a copy** of the price at the
  moment of purchase. Raising a price tomorrow must not silently rewrite
  what someone paid last week.

## Security

The publishable key sits in `js/db.js` in plain sight. That is correct —
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

The seed is generated, not hand-written. Regenerate it from `js/data.js`
rather than editing it, so the shipped catalogue and the database cannot
quietly disagree.
