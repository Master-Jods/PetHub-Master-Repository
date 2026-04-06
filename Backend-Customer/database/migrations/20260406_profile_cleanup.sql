-- Cleanup shared profile schema after removing loyalty points.
-- Safe to run multiple times.

alter table public.profiles
  drop column if exists loyalty_points;

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
