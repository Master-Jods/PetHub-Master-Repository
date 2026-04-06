-- Profile backend schema for Happy Tails
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Extend base profiles table used by auth flows.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;

create index if not exists profiles_updated_at_idx
  on public.profiles (updated_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.user_pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  species text not null default 'dog',
  breed text,
  birth_date date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create index if not exists user_pets_user_id_idx on public.user_pets(user_id);
create index if not exists user_pets_updated_at_idx on public.user_pets(updated_at desc);

drop trigger if exists set_user_pets_updated_at on public.user_pets;
create trigger set_user_pets_updated_at
before update on public.user_pets
for each row execute function public.set_updated_at();

create table if not exists public.profile_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'general',
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

create index if not exists profile_notifications_user_id_idx on public.profile_notifications(user_id);
create index if not exists profile_notifications_created_at_idx on public.profile_notifications(created_at desc);
create index if not exists profile_notifications_unread_idx on public.profile_notifications(user_id, is_read);

create table if not exists public.profile_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service text not null,
  service_type text not null,
  pet_name text,
  pet_breed text,
  scheduled_at timestamptz not null,
  status text not null default 'Pending',
  price_label text,
  note text,
  reviewed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profile_bookings_user_id_idx on public.profile_bookings(user_id);
create index if not exists profile_bookings_scheduled_at_idx on public.profile_bookings(scheduled_at desc);
create index if not exists profile_bookings_status_idx on public.profile_bookings(user_id, status);

drop trigger if exists set_profile_bookings_updated_at on public.profile_bookings;
create trigger set_profile_bookings_updated_at
before update on public.profile_bookings
for each row execute function public.set_updated_at();

create table if not exists public.profile_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  ordered_at timestamptz not null default timezone('utc', now()),
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'PHP',
  status text not null default 'Pending',
  delivery_status text not null default 'Processing',
  rider_name text,
  rider_contact text,
  rider_vehicle text,
  delivered_at timestamptz,
  eta timestamptz,
  cancelled_at timestamptz,
  cancelled_stage text,
  cancel_reason text,
  tracking_updates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (order_number)
);

create index if not exists profile_orders_user_id_idx on public.profile_orders(user_id);
create index if not exists profile_orders_ordered_at_idx on public.profile_orders(ordered_at desc);
create index if not exists profile_orders_delivery_status_idx on public.profile_orders(user_id, delivery_status);

drop trigger if exists set_profile_orders_updated_at on public.profile_orders;
create trigger set_profile_orders_updated_at
before update on public.profile_orders
for each row execute function public.set_updated_at();

create table if not exists public.profile_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references public.profile_bookings(id) on delete set null,
  service text not null,
  pet_name text,
  pet_breed text,
  review_date date not null default current_date,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profile_reviews_user_id_idx on public.profile_reviews(user_id);
create index if not exists profile_reviews_review_date_idx on public.profile_reviews(review_date desc);
create unique index if not exists profile_reviews_user_booking_unique_idx
  on public.profile_reviews(user_id, booking_id)
  where booking_id is not null;

drop trigger if exists set_profile_reviews_updated_at on public.profile_reviews;
create trigger set_profile_reviews_updated_at
before update on public.profile_reviews
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_pets enable row level security;
alter table public.profile_notifications enable row level security;
alter table public.profile_bookings enable row level security;
alter table public.profile_orders enable row level security;
alter table public.profile_reviews enable row level security;

drop policy if exists profiles_select_own_profile on public.profiles;
create policy profiles_select_own_profile
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_insert_own_profile on public.profiles;
create policy profiles_insert_own_profile
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own_profile on public.profiles;
create policy profiles_update_own_profile
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists user_pets_select_own on public.user_pets;
create policy user_pets_select_own
  on public.user_pets for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_pets_insert_own on public.user_pets;
create policy user_pets_insert_own
  on public.user_pets for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_pets_update_own on public.user_pets;
create policy user_pets_update_own
  on public.user_pets for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_pets_delete_own on public.user_pets;
create policy user_pets_delete_own
  on public.user_pets for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_notifications_select_own on public.profile_notifications;
create policy profile_notifications_select_own
  on public.profile_notifications for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_notifications_insert_own on public.profile_notifications;
create policy profile_notifications_insert_own
  on public.profile_notifications for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profile_notifications_update_own on public.profile_notifications;
create policy profile_notifications_update_own
  on public.profile_notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists profile_notifications_delete_own on public.profile_notifications;
create policy profile_notifications_delete_own
  on public.profile_notifications for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_bookings_select_own on public.profile_bookings;
create policy profile_bookings_select_own
  on public.profile_bookings for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_bookings_insert_own on public.profile_bookings;
create policy profile_bookings_insert_own
  on public.profile_bookings for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profile_bookings_update_own on public.profile_bookings;
create policy profile_bookings_update_own
  on public.profile_bookings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists profile_bookings_delete_own on public.profile_bookings;
create policy profile_bookings_delete_own
  on public.profile_bookings for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_orders_select_own on public.profile_orders;
create policy profile_orders_select_own
  on public.profile_orders for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_orders_insert_own on public.profile_orders;
create policy profile_orders_insert_own
  on public.profile_orders for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profile_orders_update_own on public.profile_orders;
create policy profile_orders_update_own
  on public.profile_orders for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists profile_orders_delete_own on public.profile_orders;
create policy profile_orders_delete_own
  on public.profile_orders for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_reviews_select_own on public.profile_reviews;
create policy profile_reviews_select_own
  on public.profile_reviews for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists profile_reviews_insert_own on public.profile_reviews;
create policy profile_reviews_insert_own
  on public.profile_reviews for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profile_reviews_update_own on public.profile_reviews;
create policy profile_reviews_update_own
  on public.profile_reviews for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists profile_reviews_delete_own on public.profile_reviews;
create policy profile_reviews_delete_own
  on public.profile_reviews for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_pets to authenticated;
grant select, insert, update, delete on public.profile_notifications to authenticated;
grant select, insert, update, delete on public.profile_bookings to authenticated;
grant select, insert, update, delete on public.profile_orders to authenticated;
grant select, insert, update, delete on public.profile_reviews to authenticated;
