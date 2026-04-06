-- Shared Happy Tails application schema
-- Target: new unified Supabase/Postgres database
-- Safe to run on a fresh database. Most statements are idempotent.

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

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer'
    check (role in ('customer', 'staff', 'owner')),
  email text,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  username text,
  address text,
  city text,
  bio text,
  avatar_url text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  species text not null default 'dog'
    check (species in ('dog', 'cat', 'other')),
  breed text,
  birth_date date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint pets_user_name_unique unique (user_id, name)
);

create index if not exists idx_pets_user_id on public.pets(user_id);

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  rider_code text not null unique,
  name text not null,
  contact text not null,
  vehicle text not null,
  plate_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  product_type text not null
    check (product_type in ('Pet Shop', 'Pet Menu')),
  name text not null,
  category text not null,
  pet_type text not null
    check (pet_type in ('All Pets', 'Dogs', 'Cats')),
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  brand text default '',
  description text default '',
  image_url text default '',
  variations jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  service text not null,
  service_type text not null
    check (service_type in ('Grooming', 'Boarding', 'Birthday Party', 'General')),
  scheduled_at timestamptz not null,
  appointment_date date generated always as ((scheduled_at at time zone 'Asia/Manila')::date) stored,
  appointment_time time generated always as ((scheduled_at at time zone 'Asia/Manila')::time) stored,
  customer_name text not null,
  customer_email text default '',
  customer_phone text default '',
  pet_name text,
  pet_breed text,
  pet_info jsonb not null default '{}'::jsonb,
  appointment_info jsonb not null default '{}'::jsonb,
  contact_info jsonb not null default '{}'::jsonb,
  service_details jsonb not null default '{}'::jsonb,
  grooming_summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  service_total numeric(12,2) not null default 0,
  price_label text,
  payment_method text not null default 'Cash'
    check (payment_method in ('Cash', 'GCash')),
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Paid', 'Refunded')),
  booking_status text not null default 'Pending Approval'
    check (booking_status in ('Pending Approval', 'Confirmed', 'In Progress', 'Completed', 'Cancelled')),
  note text,
  reviewed boolean not null default false,
  total_price_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_status on public.bookings(booking_status);
create index if not exists idx_bookings_scheduled_at on public.bookings(scheduled_at);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  category text not null
    check (category in ('Pet Shop', 'Pet Menu')),
  customer_name text not null,
  customer_email text default '',
  customer_phone text default '',
  order_date timestamptz not null default timezone('utc', now()),
  items jsonb not null default '[]'::jsonb,
  currency text not null default 'PHP',
  base_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'Pending'
    check (status in ('Pending', 'Order Placed', 'Preparing Order', 'Rider Picked Up', 'Out for Delivery', 'Delivered', 'Order Received', 'Cancelled')),
  request_status text not null default 'Pending Request'
    check (request_status in ('Pending Request', 'Accepted', 'Rejected')),
  rejection_reason text default '',
  payment_method text not null default 'Cash'
    check (payment_method in ('Cash', 'GCash')),
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Paid', 'Refunded')),
  fulfillment_method text not null default 'pickup'
    check (fulfillment_method in ('pickup', 'delivery')),
  delivery_method text not null default 'Store Pickup'
    check (delivery_method in ('Store Pickup', 'Delivery')),
  delivery_zone text default '',
  delivery_fee numeric(12,2) not null default 0,
  shipping_address text default '',
  eta timestamptz,
  rider_id uuid references public.riders(id) on delete set null,
  rider_snapshot jsonb,
  tracking_updates jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  proof_of_payment text default '',
  delivery_status text not null default 'Processing',
  cancelled_at timestamptz,
  cancelled_stage text,
  cancel_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_request_status on public.orders(request_status);
create index if not exists idx_orders_order_date on public.orders(order_date);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  review_code text not null unique,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  service text not null,
  category text not null
    check (category in ('Grooming', 'Boarding', 'Birthday Party', 'Orders')),
  rating integer not null check (rating between 1 and 5),
  score text,
  review_date date not null default current_date,
  pet_name text default 'N/A',
  pet_breed text,
  comment text not null,
  admin_response text default '',
  would_recommend boolean not null default true,
  transaction jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_reviews_user_id on public.reviews(user_id);
create index if not exists idx_reviews_booking_id on public.reviews(booking_id);
create index if not exists idx_reviews_order_id on public.reviews(order_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete cascade,
  audience text not null default 'customer'
    check (audience in ('customer', 'admin', 'all')),
  type text not null
    check (type in ('booking', 'order', 'review', 'system')),
  entity_type text not null
    check (entity_type in ('booking', 'order', 'review', 'profile', 'system')),
  entity_id uuid,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_audience on public.notifications(audience);
create index if not exists idx_notifications_is_read on public.notifications(is_read);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Announcement',
  tag text not null default '',
  meta text not null default '',
  title text not null,
  description text not null default '',
  note text not null default '',
  highlight text not null default '',
  footer text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_announcements_active on public.announcements(is_active);
create index if not exists idx_announcements_sort on public.announcements(sort_order, created_at desc);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_pets_updated_at on public.pets;
create trigger trg_pets_updated_at
before update on public.pets
for each row execute function public.set_updated_at();

drop trigger if exists trg_riders_updated_at on public.riders;
create trigger trg_riders_updated_at
before update on public.riders
for each row execute function public.set_updated_at();

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_name_value text := nullif(trim(coalesce(metadata->>'first_name', '')), '');
  last_name_value text := nullif(trim(coalesce(metadata->>'last_name', '')), '');
  display_name_value text := nullif(trim(coalesce(metadata->>'display_name', '')), '');
  phone_value text := nullif(trim(coalesce(metadata->>'phone', '')), '');
  role_value text := lower(coalesce(nullif(trim(metadata->>'role'), ''), 'customer'));
begin
  if role_value not in ('customer', 'staff', 'owner') then
    role_value := 'customer';
  end if;

  insert into public.profiles (
    user_id,
    role,
    email,
    first_name,
    last_name,
    display_name,
    phone
  )
  values (
    new.id,
    role_value,
    new.email,
    first_name_value,
    last_name_value,
    coalesce(display_name_value, nullif(trim(concat(coalesce(first_name_value, ''), ' ', coalesce(last_name_value, ''))), '')),
    phone_value
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    role = case
      when public.profiles.role in ('owner', 'staff') then public.profiles.role
      else excluded.role
    end,
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace view public.customer_overview as
select
  p.user_id as customer_id,
  coalesce(
    nullif(trim(concat(coalesce(p.first_name, ''), ' ', coalesce(p.last_name, ''))), ''),
    nullif(trim(coalesce(p.display_name, '')), ''),
    nullif(trim(coalesce(p.email, '')), ''),
    'Unnamed Customer'
  ) as name,
  coalesce(p.phone, '') as contact,
  coalesce(p.email, '') as email,
  case when p.status = 'inactive' then 'Inactive' else 'Active' end as status,
  (p.created_at at time zone 'Asia/Manila')::date as account_created,
  (
    select max(x.last_seen)::date
    from (
      select o.order_date as last_seen from public.orders o where o.user_id = p.user_id
      union all
      select b.scheduled_at as last_seen from public.bookings b where b.user_id = p.user_id
    ) x
  ) as last_active,
  (
    select count(*)::int
    from public.orders o
    where o.user_id = p.user_id
  ) as total_orders,
  (
    select coalesce(sum(o.total), 0)
    from public.orders o
    where o.user_id = p.user_id
      and o.status <> 'Cancelled'
  ) as total_spent,
  (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', pet.name,
      'species', pet.species,
      'breed', pet.breed
    ) order by pet.created_at), '[]'::jsonb)
    from public.pets pet
    where pet.user_id = p.user_id
  ) as pets,
  (
    select coalesce(jsonb_agg(jsonb_build_object(
      'orderCode', o.order_code,
      'status', o.status,
      'total', o.total,
      'orderDate', o.order_date
    ) order by o.order_date desc), '[]'::jsonb)
    from (
      select *
      from public.orders
      where user_id = p.user_id
      order by order_date desc
      limit 5
    ) o
  ) as recent_orders
from public.profiles p
where p.role = 'customer';

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.inventory_items enable row level security;
alter table public.riders enable row level security;
alter table public.announcements enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists pets_select_own on public.pets;
create policy pets_select_own
  on public.pets for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists pets_insert_own on public.pets;
create policy pets_insert_own
  on public.pets for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists pets_update_own on public.pets;
create policy pets_update_own
  on public.pets for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists pets_delete_own on public.pets;
create policy pets_delete_own
  on public.pets for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own
  on public.bookings for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own
  on public.bookings for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists bookings_update_own on public.bookings;
create policy bookings_update_own
  on public.bookings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
  on public.orders for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own
  on public.orders for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists orders_update_own on public.orders;
create policy orders_update_own
  on public.orders for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists reviews_select_own on public.reviews;
create policy reviews_select_own
  on public.reviews for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own
  on public.reviews for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own
  on public.reviews for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own
  on public.reviews for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists notifications_select_relevant on public.notifications;
create policy notifications_select_relevant
  on public.notifications for select to authenticated
  using (
    user_id = auth.uid()
    or audience = 'all'
    or (
      audience = 'admin'
      and exists (
        select 1
        from public.profiles p
        where p.user_id = auth.uid()
          and p.role in ('owner', 'staff')
      )
    )
  );

drop policy if exists notifications_insert_customer_or_admin_alert on public.notifications;
create policy notifications_insert_customer_or_admin_alert
  on public.notifications for insert to authenticated
  with check (
    (
      user_id = auth.uid()
      and audience in ('customer', 'all')
    )
    or (
      user_id is null
      and audience = 'admin'
    )
  );

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists inventory_items_public_read on public.inventory_items;
create policy inventory_items_public_read
  on public.inventory_items for select to authenticated
  using (true);

drop policy if exists riders_public_read on public.riders;
create policy riders_public_read
  on public.riders for select to authenticated
  using (true);

drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read
  on public.announcements for select to anon, authenticated
  using (is_active = true);

insert into public.profiles (
  user_id,
  role,
  email,
  first_name,
  last_name,
  display_name,
  phone
)
select
  au.id,
  case
    when lower(coalesce(nullif(trim(au.raw_user_meta_data->>'role'), ''), 'customer')) in ('customer', 'staff', 'owner')
      then lower(coalesce(nullif(trim(au.raw_user_meta_data->>'role'), ''), 'customer'))
    else 'customer'
  end,
  au.email,
  nullif(trim(coalesce(au.raw_user_meta_data->>'first_name', '')), ''),
  nullif(trim(coalesce(au.raw_user_meta_data->>'last_name', '')), ''),
  coalesce(
    nullif(trim(coalesce(au.raw_user_meta_data->>'display_name', '')), ''),
    nullif(trim(concat(
      coalesce(au.raw_user_meta_data->>'first_name', ''),
      ' ',
      coalesce(au.raw_user_meta_data->>'last_name', '')
    )), '')
  ),
  nullif(trim(coalesce(au.raw_user_meta_data->>'phone', '')), '')
from auth.users au
where not exists (
  select 1
  from public.profiles p
  where p.user_id = au.id
)
on conflict (user_id) do nothing;
