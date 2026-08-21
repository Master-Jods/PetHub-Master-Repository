-- Combined PetHub + CafeHub fresh restore seed.
--
-- Run this against a NEW/FRESH Supabase database using psql, not the Supabase
-- SQL Editor, because this file uses \ir to include the repo's existing SQL.
--
-- Example:
--   psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
--     -f Backend-Customer/database/seeds/combined_pethub_cafehub_seed.sql
--
-- What this restores:
--   1. PetHub public schema used by Backend-Admin/Render.
--   2. CafeHub cafe schema used directly by the Vercel frontends.
--   3. Existing merged PetHub inventory catalog.
--   4. Starter riders, announcements, daily cafe menu, and campaign rows.
--
-- Auth users are not manually inserted here. Create/login users through
-- Supabase Auth first; the schema triggers and sync blocks create matching
-- public.profiles and cafe.profiles rows.

\set ON_ERROR_STOP on

begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

\echo 'Applying PetHub public schema...'
\ir ../migrations/20260406_shared_app_schema.sql
\ir ../migrations/20260406_profile_trigger.sql
\ir ../migrations/20260406_announcements.sql
\ir ../migrations/20260413_inventory_stock_on_orders.sql
\ir ../migrations/20260415_customer_order_inventory_rpc.sql
\ir ../migrations/20260529_featured_reviews_refunds.sql
\ir ../migrations/20260814_pethub_campaigns.sql
\ir ../migrations/20260821_woof_webhook_deliveries.sql

\echo 'Applying CafeHub cafe schema...'
\ir ../migrations/cafe/unified_schema.sql
\ir ../migrations/cafe/delivery_area_schema.sql
\ir ../migrations/cafe/customer_reviews_schema.sql
\ir ../migrations/cafe/guest_order_schema.sql
\ir ../migrations/cafe/inventory_production_migration.sql

\echo 'Loading merged PetHub inventory catalog...'
truncate table public.inventory_items restart identity cascade;
\ir ../../../Backend-Admin/server/sql/inventory_seed_merged.sql

\echo 'Seeding PetHub riders and announcements...'
insert into public.riders (rider_code, name, contact, vehicle, plate_number, is_active)
values
  ('RDR-001', 'Juan Dela Cruz', '0917 111 2233', 'Motorcycle', 'HT-1024', true),
  ('RDR-002', 'Miguel Santos', '0917 444 5566', 'Motorcycle', 'HT-2048', true),
  ('RDR-003', 'Carla Reyes', '0917 777 8899', 'Scooter', 'HT-4096', true)
on conflict (rider_code) do update set
  name = excluded.name,
  contact = excluded.contact,
  vehicle = excluded.vehicle,
  plate_number = excluded.plate_number,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

insert into public.announcements (
  category,
  tag,
  meta,
  title,
  description,
  note,
  highlight,
  footer,
  sort_order,
  is_active
)
values
  (
    'Promo',
    'PetHub',
    'Limited time',
    'PetHub is back online',
    'Pet shop, pet menu, grooming, boarding, and cafe ordering are centralized in one PetHub database.',
    'Availability may vary by branch stock.',
    'Centralized PetHub',
    'Thank you for supporting Happy Tails.',
    1,
    true
  ),
  (
    'Service',
    'Grooming',
    'Bookings open',
    'Book grooming appointments',
    'Customers can reserve grooming, boarding, and birthday services from the customer portal.',
    'Admin approval is required before final confirmation.',
    'Online booking',
    'Our team will contact customers for special requests.',
    2,
    true
  )
on conflict do nothing;

\echo 'Syncing Supabase Auth users into PetHub and CafeHub profiles...'
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
    )), ''),
    au.email
  ),
  nullif(trim(coalesce(au.raw_user_meta_data->>'phone', '')), '')
from auth.users au
on conflict (user_id) do update set
  role = excluded.role,
  email = coalesce(excluded.email, public.profiles.email),
  first_name = coalesce(excluded.first_name, public.profiles.first_name),
  last_name = coalesce(excluded.last_name, public.profiles.last_name),
  display_name = coalesce(excluded.display_name, public.profiles.display_name),
  phone = coalesce(excluded.phone, public.profiles.phone),
  updated_at = timezone('utc', now());

insert into cafe.profiles (
  id,
  role,
  customer_code,
  name,
  email,
  phone
)
select
  au.id,
  case
    when lower(coalesce(nullif(trim(au.raw_user_meta_data->>'role'), ''), 'customer')) in ('owner', 'staff', 'customer')
      then lower(coalesce(nullif(trim(au.raw_user_meta_data->>'role'), ''), 'customer'))::cafe.app_role
    else 'customer'::cafe.app_role
  end,
  case
    when lower(coalesce(nullif(trim(au.raw_user_meta_data->>'role'), ''), 'customer')) = 'customer'
      then cafe.generate_customer_code()
    else null
  end,
  coalesce(
    nullif(trim(coalesce(au.raw_user_meta_data->>'name', '')), ''),
    nullif(trim(coalesce(au.raw_user_meta_data->>'display_name', '')), ''),
    au.email,
    ''
  ),
  coalesce(au.email, ''),
  coalesce(nullif(trim(coalesce(au.raw_user_meta_data->>'phone', '')), ''), '')
from auth.users au
on conflict (id) do update set
  role = excluded.role,
  name = coalesce(nullif(excluded.name, ''), cafe.profiles.name),
  email = coalesce(nullif(excluded.email, ''), cafe.profiles.email),
  phone = coalesce(nullif(excluded.phone, ''), cafe.profiles.phone),
  updated_at = now();

\echo 'Seeding CafeHub daily menu and campaigns...'
insert into cafe.daily_menus (menu_date, is_published)
values (current_date, true)
on conflict (menu_date) do update set
  is_published = true,
  updated_at = now();

insert into cafe.daily_menu_items (daily_menu_id, menu_item_id)
select dm.id, mi.id
from cafe.daily_menus dm
join cafe.menu_items mi on mi.code in (
  'MI-00001',
  'MI-00004',
  'MI-00012',
  'MI-00019',
  'MI-00020',
  'MI-00029',
  'MI-00042',
  'MI-00046'
)
where dm.menu_date = current_date
on conflict do nothing;

insert into cafe.campaign_announcements (
  title,
  message,
  cta_text,
  cta_link,
  is_active,
  start_at,
  end_at
)
values
  (
    'Fresh daily menu is ready',
    'Rice meals, sandwiches, iced coffee, and frappes are available today.',
    'Order now',
    '/menu',
    true,
    now() - interval '1 day',
    now() + interval '30 days'
  ),
  (
    'PetHub and CafeHub are centralized',
    'Cafe orders and pet services now share one PetHub Supabase project.',
    'View menu',
    '/menu',
    true,
    now() - interval '1 day',
    now() + interval '30 days'
  )
on conflict do nothing;

update cafe.business_settings
set
  enable_delivery = true,
  updated_at = now()
where id = 1;

\echo 'Combined PetHub + CafeHub seed complete.'

commit;
