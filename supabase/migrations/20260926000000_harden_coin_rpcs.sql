-- Hardens the coin economy so the browser can't grant itself coins or set
-- its own prices.
--
--   * purchase_theme looks the price up in public.theme_prices and ignores
--     any price the client sends (the parameter is kept so older clients
--     still work).
--   * add_coins clamps each grant to a per-call and rolling 24-hour limit,
--     logged in public.coin_grants.
--   * Signed-in users can read their own profile but can no longer write to
--     profiles directly; all changes go through the functions below.
--
-- Assumes public.profiles(user_id uuid, coins bigint/integer, themes text[]).
-- Keep theme_prices in sync with src/game/themes.js.
-- Review before running: this replaces any existing add_coins/purchase_theme.

begin;

-- ── Prices ──────────────────────────────────────────────────────────────────
create table if not exists public.theme_prices (
  theme_key text primary key,
  price integer not null check (price >= 0)
);

insert into public.theme_prices (theme_key, price) values
  ('classic', 0),
  ('venusaur', 1000),
  ('charizard', 1000),
  ('blastoise', 1000),
  ('pikachu', 1500),
  ('sylveon', 1500),
  ('metagross', 3000),
  ('reshiram', 5000),
  ('zekrom', 5000)
on conflict (theme_key) do update set price = excluded.price;

alter table public.theme_prices enable row level security;
drop policy if exists "Theme prices are readable by everyone" on public.theme_prices;
create policy "Theme prices are readable by everyone" on public.theme_prices for select using (true);

-- ── Grant log (only the functions below touch it) ───────────────────────────
create table if not exists public.coin_grants (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists coin_grants_user_time on public.coin_grants (user_id, created_at);
alter table public.coin_grants enable row level security;

-- ── Profiles: read your own row, write only through the functions ──────────
alter table public.profiles enable row level security;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.profiles from anon, authenticated;

-- ── Replace the old functions, whatever their exact signatures ──────────────
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('add_coins', 'purchase_theme')
  loop
    execute 'drop function ' || f.sig;
  end loop;
end $$;

-- Adds coins to the caller's wallet and returns the new balance. Grants are
-- clamped rather than rejected, so an unusually big legit run still pays out
-- up to the limits. Tune the limits to how the game actually plays.
create function public.add_coins(amount bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  max_per_call constant bigint := 100000;
  max_per_day constant bigint := 500000;
  uid uuid := auth.uid();
  granted_today bigint;
  grant_amount bigint;
  new_balance bigint;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if amount is null or amount <= 0 then
    raise exception 'Invalid amount';
  end if;

  -- Lock the profile row so concurrent calls can't both slip under the daily limit.
  select coins into new_balance from profiles where user_id = uid for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  select coalesce(sum(g.amount), 0) into granted_today
  from coin_grants g
  where g.user_id = uid and g.created_at > now() - interval '24 hours';

  grant_amount := least(amount, max_per_call, greatest(max_per_day - granted_today, 0));
  if grant_amount <= 0 then
    return new_balance;
  end if;

  insert into coin_grants (user_id, amount) values (uid, grant_amount);
  update profiles set coins = coins + grant_amount where user_id = uid
  returning coins into new_balance;
  return new_balance;
end;
$$;

-- Buys a theme at the server's price. `price` is accepted for compatibility
-- with older clients and ignored.
create function public.purchase_theme(theme_key text, price integer default null)
returns table (coins bigint, themes text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  theme_price integer;
  current_coins bigint;
  current_themes text[];
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select tp.price into theme_price from theme_prices tp where tp.theme_key = purchase_theme.theme_key;
  if theme_price is null then
    raise exception 'Unknown theme';
  end if;

  select p.coins, coalesce(p.themes, array['classic'])
  into current_coins, current_themes
  from profiles p
  where p.user_id = uid
  for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  if purchase_theme.theme_key = any (current_themes) then
    return query select current_coins, current_themes;
    return;
  end if;
  if current_coins < theme_price then
    raise exception 'Insufficient coins';
  end if;

  return query
  update profiles p
  set coins = p.coins - theme_price,
      themes = array_append(current_themes, purchase_theme.theme_key)
  where p.user_id = uid
  returning p.coins::bigint, p.themes;
end;
$$;

revoke all on function public.add_coins(bigint) from public, anon;
revoke all on function public.purchase_theme(text, integer) from public, anon;
grant execute on function public.add_coins(bigint) to authenticated;
grant execute on function public.purchase_theme(text, integer) to authenticated;

commit;
