/* Bloom — accounts and orders.

   This is the half that makes js/auth.js honest. Until this table
   existed, "signing in" was a localStorage flag and nothing more; the
   comment at the top of that file said so. Now there is a real user
   record behind Supabase Auth, and the server decides who is who.

   auth.users is managed by Supabase and is not ours to alter. profiles
   sits beside it and holds the things the shop actually needs: the name
   to greet, and the language and theme so a returning customer lands in
   the interface they left. */

create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (length(trim(display_name)) > 0),
  lang          text not null default 'en'  check (lang  in ('en','ar')),
  theme         text not null default 'auto' check (theme in ('auto','light','dark')),
  created_at    timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "read own profile"   on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);

/* A profile row should never be missing for a signed-up user, so it is
   created by the database rather than by the client — a client that
   crashes between sign-up and insert would otherwise leave an account
   with no name. */
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
             split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


/* Orders. The cart stays in localStorage — it needs to survive a page
   turn instantly and it belongs to the person holding the device. An
   order is different: it is a promise between the shop and a customer,
   and it has to outlive the browser that placed it.

   user_id is nullable on purpose. "Continue as guest" has to work all
   the way through checkout; a visitor who cannot buy coffee without
   making an account is a lost customer. A guest order carries a contact
   name and phone instead of a user. */
create table orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete set null,
  guest_name    text,
  guest_phone   text,
  status        text not null default 'placed'
                  check (status in ('placed','roasting','ready','collected','cancelled')),
  fulfilment    text not null default 'pickup' check (fulfilment in ('pickup','delivery')),
  total_fils    integer not null check (total_fils >= 0),
  grind         text,
  note          text,
  placed_at     timestamptz not null default now(),

  /* Either it belongs to an account, or it names a guest. Not neither. */
  constraint order_has_an_owner check (
    user_id is not null or nullif(trim(coalesce(guest_name, '')), '') is not null
  )
);

create table order_items (
  order_id    uuid    not null references orders (id) on delete cascade,
  product_id  text    not null references products (id),
  qty         integer not null check (qty > 0),
  unit_fils   integer not null check (unit_fils > 0),
  primary key (order_id, product_id)
);

comment on column order_items.unit_fils is
  'The price paid, copied at checkout. Deliberately duplicated from '
  'products.price_fils: raising a price tomorrow must not rewrite '
  'yesterday''s receipt.';

create index on orders (user_id, placed_at desc);

alter table orders      enable row level security;
alter table order_items enable row level security;

create policy "read own orders" on orders
  for select using (auth.uid() is not null and auth.uid() = user_id);

/* A signed-in customer may only file an order against themselves, and a
   guest may only file one with no user attached — so nobody can post an
   order into someone else's history.

   Being plain about the limit: this lets an anonymous visitor insert
   rows, which is a spam surface. It is fine for a shop that is not yet
   taking money. Before real orders flow, this policy should be replaced
   by an Edge Function holding the service-role key, which can rate-limit
   and recompute the total server-side instead of trusting total_fils
   from the browser. */
create policy "place an order" on orders
  for insert with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or (auth.uid() is null and user_id is null)
  );

create policy "read own order items" on order_items
  for select using (exists (
    select 1 from orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

create policy "add items to an open order" on order_items
  for insert with check (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.status = 'placed'
      and ((auth.uid() is not null and o.user_id = auth.uid())
           or (auth.uid() is null and o.user_id is null))
  ));
