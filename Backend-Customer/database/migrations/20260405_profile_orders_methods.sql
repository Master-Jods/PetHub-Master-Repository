-- Add payment and fulfillment method fields for profile order history.
-- Safe to run multiple times.

alter table public.profile_orders
  add column if not exists payment_method text;

alter table public.profile_orders
  add column if not exists fulfillment_method text;

create index if not exists profile_orders_payment_method_idx
  on public.profile_orders (user_id, payment_method);

create index if not exists profile_orders_fulfillment_method_idx
  on public.profile_orders (user_id, fulfillment_method);

