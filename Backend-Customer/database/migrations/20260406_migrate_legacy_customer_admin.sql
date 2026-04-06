-- Legacy customer/admin data migration into the shared schema
--
-- Assumption:
-- 1. New shared schema has already been created by running:
--      20260406_shared_app_schema.sql
-- 2. Old customer tables are available in schema: legacy_customer
-- 3. Old admin tables are available in schema: legacy_admin
--
-- Example staging import flow:
-- - restore customer public tables into legacy_customer
-- - restore admin public tables into legacy_admin
-- - run this migration against the new database
--
-- This script is idempotent enough for repeated dry-runs on a dev clone, but
-- you should still test on a copy first.

create extension if not exists pgcrypto;

create schema if not exists legacy_customer;
create schema if not exists legacy_admin;

-- Shared profiles
insert into public.profiles (
  user_id,
  role,
  email,
  first_name,
  last_name,
  display_name,
  phone,
  username,
  address,
  city,
  bio,
  avatar_url,
  created_at,
  updated_at
)
select
  p.id,
  'customer',
  au.email,
  p.first_name,
  p.last_name,
  nullif(trim(concat(coalesce(p.first_name, ''), ' ', coalesce(p.last_name, ''))), ''),
  p.phone,
  p.username,
  p.address,
  p.city,
  p.bio,
  p.avatar_url,
  coalesce(p.created_at, timezone('utc', now())),
  coalesce(p.updated_at, timezone('utc', now()))
from legacy_customer.profiles p
left join auth.users au on au.id = p.id
on conflict (user_id) do update set
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  display_name = coalesce(excluded.display_name, public.profiles.display_name),
  phone = excluded.phone,
  username = excluded.username,
  address = excluded.address,
  city = excluded.city,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  updated_at = greatest(public.profiles.updated_at, excluded.updated_at);

insert into public.profiles (
  user_id,
  role,
  email,
  first_name,
  last_name,
  display_name,
  phone,
  created_at,
  updated_at
)
select
  p.user_id,
  p.role,
  coalesce(p.email, au.email),
  split_part(coalesce(nullif(trim(p.name), ''), ''), ' ', 1),
  nullif(trim(substr(coalesce(p.name, ''), length(split_part(coalesce(p.name, ''), ' ', 1)) + 1)), ''),
  nullif(trim(p.name), ''),
  p.phone,
  coalesce(p.created_at, timezone('utc', now())),
  coalesce(p.created_at, timezone('utc', now()))
from legacy_admin.profiles p
left join auth.users au on au.id = p.user_id
on conflict (user_id) do update set
  role = case
    when public.profiles.role = 'customer' and excluded.role in ('owner', 'staff') then excluded.role
    else public.profiles.role
  end,
  email = coalesce(excluded.email, public.profiles.email),
  first_name = coalesce(public.profiles.first_name, excluded.first_name),
  last_name = coalesce(public.profiles.last_name, excluded.last_name),
  display_name = coalesce(public.profiles.display_name, excluded.display_name),
  phone = coalesce(public.profiles.phone, excluded.phone),
  updated_at = greatest(public.profiles.updated_at, excluded.updated_at);

-- Pets
insert into public.pets (
  id,
  user_id,
  name,
  species,
  breed,
  birth_date,
  notes,
  created_at,
  updated_at
)
select
  up.id,
  up.user_id,
  up.name,
  case
    when lower(coalesce(up.species, '')) like '%cat%' then 'cat'
    when lower(coalesce(up.species, '')) like '%dog%' then 'dog'
    else 'other'
  end,
  up.breed,
  up.birth_date,
  up.notes,
  coalesce(up.created_at, timezone('utc', now())),
  coalesce(up.updated_at, timezone('utc', now()))
from legacy_customer.user_pets up
on conflict (id) do update set
  user_id = excluded.user_id,
  name = excluded.name,
  species = excluded.species,
  breed = excluded.breed,
  birth_date = excluded.birth_date,
  notes = excluded.notes,
  updated_at = greatest(public.pets.updated_at, excluded.updated_at);

-- Riders and inventory from admin
insert into public.riders (
  id,
  rider_code,
  name,
  contact,
  vehicle,
  plate_number,
  created_at,
  updated_at
)
select
  r.id,
  r.rider_id,
  r.name,
  r.contact,
  r.vehicle,
  r.plate_number,
  coalesce(r.created_at, timezone('utc', now())),
  coalesce(r.updated_at, timezone('utc', now()))
from legacy_admin.riders r
on conflict (id) do update set
  rider_code = excluded.rider_code,
  name = excluded.name,
  contact = excluded.contact,
  vehicle = excluded.vehicle,
  plate_number = excluded.plate_number,
  updated_at = greatest(public.riders.updated_at, excluded.updated_at);

insert into public.inventory_items (
  id,
  product_type,
  name,
  category,
  pet_type,
  price,
  stock,
  brand,
  description,
  image_url,
  variations,
  created_at,
  updated_at
)
select
  ii.id,
  ii.product_type,
  ii.name,
  ii.category,
  ii.pet_type,
  coalesce(ii.price, 0),
  coalesce(ii.stock, 0),
  coalesce(ii.brand, ''),
  coalesce(ii.description, ''),
  coalesce(ii.image, ''),
  coalesce(ii.variations, '[]'::jsonb),
  coalesce(ii.created_at, timezone('utc', now())),
  coalesce(ii.updated_at, timezone('utc', now()))
from legacy_admin.inventory_items ii
on conflict (id) do update set
  product_type = excluded.product_type,
  name = excluded.name,
  category = excluded.category,
  pet_type = excluded.pet_type,
  price = excluded.price,
  stock = excluded.stock,
  brand = excluded.brand,
  description = excluded.description,
  image_url = excluded.image_url,
  variations = excluded.variations,
  updated_at = greatest(public.inventory_items.updated_at, excluded.updated_at);

-- Bookings from customer app
insert into public.bookings (
  id,
  booking_code,
  user_id,
  service,
  service_type,
  scheduled_at,
  customer_name,
  customer_email,
  customer_phone,
  pet_name,
  pet_breed,
  pet_info,
  appointment_info,
  contact_info,
  service_details,
  grooming_summary,
  metadata,
  service_total,
  price_label,
  payment_method,
  payment_status,
  booking_status,
  note,
  reviewed,
  total_price_history,
  created_at,
  updated_at
)
select
  pb.id,
  coalesce(pb.metadata->>'bookingCode', 'BKG-' || replace(pb.id::text, '-', '')),
  pb.user_id,
  pb.service,
  case
    when lower(coalesce(pb.service_type, pb.service, '')) like '%groom%' then 'Grooming'
    when lower(coalesce(pb.service_type, pb.service, '')) like '%board%' then 'Boarding'
    when lower(coalesce(pb.service_type, pb.service, '')) like '%pawty%'
      or lower(coalesce(pb.service_type, pb.service, '')) like '%birthday%' then 'Birthday Party'
    else 'General'
  end,
  pb.scheduled_at,
  coalesce(cp.first_name || ' ' || cp.last_name, cp.username, au.email, 'Customer'),
  coalesce(au.email, ''),
  coalesce(cp.phone, ''),
  pb.pet_name,
  pb.pet_breed,
  jsonb_build_object(
    'name', coalesce(pb.pet_name, ''),
    'breed', coalesce(pb.pet_breed, '')
  ),
  jsonb_build_object(
    'date', coalesce(to_char(pb.scheduled_at at time zone 'Asia/Manila', 'YYYY-MM-DD'), ''),
    'time', coalesce(to_char(pb.scheduled_at at time zone 'Asia/Manila', 'HH24:MI'), '')
  ),
  jsonb_build_object(
    'owner', coalesce(cp.first_name || ' ' || cp.last_name, cp.username, au.email, 'Customer'),
    'phone', coalesce(cp.phone, ''),
    'email', coalesce(au.email, '')
  ),
  coalesce(pb.metadata, '{}'::jsonb),
  coalesce(pb.metadata->'groomingSummary', '{}'::jsonb),
  coalesce(pb.metadata, '{}'::jsonb),
  coalesce(nullif(regexp_replace(coalesce(pb.price_label, ''), '[^0-9.]', '', 'g'), '')::numeric, 0),
  pb.price_label,
  coalesce(nullif(pb.metadata->>'paymentMethod', ''), 'Cash'),
  coalesce(nullif(pb.metadata->>'paymentStatus', ''), 'Pending'),
  case
    when lower(coalesce(pb.status, '')) in ('pending', 'pending approval') then 'Pending Approval'
    when lower(coalesce(pb.status, '')) = 'confirmed' then 'Confirmed'
    when lower(coalesce(pb.status, '')) = 'in progress' then 'In Progress'
    when lower(coalesce(pb.status, '')) = 'completed' then 'Completed'
    when lower(coalesce(pb.status, '')) in ('cancelled', 'canceled') then 'Cancelled'
    else 'Pending Approval'
  end,
  pb.note,
  coalesce(pb.reviewed, false),
  '[]'::jsonb,
  coalesce(pb.created_at, timezone('utc', now())),
  coalesce(pb.updated_at, timezone('utc', now()))
from legacy_customer.profile_bookings pb
left join legacy_customer.profiles cp on cp.id = pb.user_id
left join auth.users au on au.id = pb.user_id
on conflict (id) do update set
  booking_code = excluded.booking_code,
  service = excluded.service,
  service_type = excluded.service_type,
  scheduled_at = excluded.scheduled_at,
  customer_name = excluded.customer_name,
  customer_email = excluded.customer_email,
  customer_phone = excluded.customer_phone,
  pet_name = excluded.pet_name,
  pet_breed = excluded.pet_breed,
  pet_info = excluded.pet_info,
  appointment_info = excluded.appointment_info,
  contact_info = excluded.contact_info,
  service_details = excluded.service_details,
  grooming_summary = excluded.grooming_summary,
  metadata = excluded.metadata,
  service_total = excluded.service_total,
  price_label = excluded.price_label,
  payment_method = excluded.payment_method,
  payment_status = excluded.payment_status,
  booking_status = excluded.booking_status,
  note = excluded.note,
  reviewed = excluded.reviewed,
  updated_at = greatest(public.bookings.updated_at, excluded.updated_at);

-- Fill or override with richer admin booking data when the business code matches.
update public.bookings b
set
  service_type = ab.service_type,
  customer_name = coalesce(ab.customer_name, b.customer_name),
  service_total = coalesce(ab.service_total, b.service_total),
  payment_method = coalesce(ab.payment_method, b.payment_method),
  payment_status = coalesce(ab.payment_status, b.payment_status),
  booking_status = coalesce(ab.booking_status, b.booking_status),
  pet_info = coalesce(ab.pet_info, b.pet_info),
  appointment_info = coalesce(ab.appointment_info, b.appointment_info),
  contact_info = coalesce(ab.contact_info, b.contact_info),
  grooming_summary = coalesce(ab.grooming_summary, b.grooming_summary),
  total_price_history = coalesce(ab.total_price_history, b.total_price_history),
  updated_at = greatest(b.updated_at, coalesce(ab.updated_at, b.updated_at))
from legacy_admin.bookings ab
where b.booking_code = ab.booking_id;

insert into public.bookings (
  id,
  booking_code,
  user_id,
  service,
  service_type,
  scheduled_at,
  customer_name,
  customer_email,
  customer_phone,
  pet_info,
  appointment_info,
  contact_info,
  grooming_summary,
  metadata,
  service_total,
  payment_method,
  payment_status,
  booking_status,
  total_price_history,
  created_at,
  updated_at
)
select
  ab.id,
  ab.booking_id,
  matched_profile.user_id,
  ab.service_type,
  ab.service_type,
  coalesce(
    nullif(trim(coalesce(ab.appointment_info->>'date', '')), '')::date + coalesce(nullif(trim(coalesce(ab.appointment_info->>'time', '')), '')::time, time '00:00'),
    coalesce(ab.created_at, timezone('utc', now()))
  ),
  ab.customer_name,
  coalesce(ab.contact_info->>'email', ''),
  coalesce(ab.contact_info->>'phone', ''),
  coalesce(ab.pet_info, '{}'::jsonb),
  coalesce(ab.appointment_info, '{}'::jsonb),
  coalesce(ab.contact_info, '{}'::jsonb),
  coalesce(ab.grooming_summary, '{}'::jsonb),
  '{}'::jsonb,
  coalesce(ab.service_total, 0),
  coalesce(ab.payment_method, 'Cash'),
  coalesce(ab.payment_status, 'Pending'),
  coalesce(ab.booking_status, 'Pending Approval'),
  coalesce(ab.total_price_history, '[]'::jsonb),
  coalesce(ab.created_at, timezone('utc', now())),
  coalesce(ab.updated_at, timezone('utc', now()))
from legacy_admin.bookings ab
left join legacy_admin.customers ac on ac.name = ab.customer_name
left join public.profiles matched_profile
  on matched_profile.role = 'customer'
 and lower(coalesce(matched_profile.email, '')) = lower(coalesce(ac.email, ''))
where not exists (
  select 1 from public.bookings b where b.booking_code = ab.booking_id
)
and matched_profile.user_id is not null;

-- Orders from customer app
insert into public.orders (
  id,
  order_code,
  user_id,
  category,
  customer_name,
  customer_email,
  customer_phone,
  order_date,
  items,
  currency,
  base_total,
  total,
  status,
  request_status,
  payment_method,
  payment_status,
  fulfillment_method,
  delivery_method,
  shipping_address,
  eta,
  rider_snapshot,
  tracking_updates,
  timeline,
  delivery_status,
  cancelled_at,
  cancelled_stage,
  cancel_reason,
  created_at,
  updated_at
)
select
  po.id,
  po.order_number,
  po.user_id,
  coalesce(po.items->0->>'category', 'Pet Shop'),
  coalesce(cp.first_name || ' ' || cp.last_name, cp.username, au.email, 'Customer'),
  coalesce(au.email, ''),
  coalesce(cp.phone, ''),
  po.ordered_at,
  coalesce(po.items, '[]'::jsonb),
  coalesce(po.currency, 'PHP'),
  coalesce(po.total_amount, 0),
  coalesce(po.total_amount, 0),
  coalesce(po.status, 'Pending'),
  'Pending Request',
  coalesce(po.payment_method, 'Cash'),
  case when lower(coalesce(po.payment_method, '')) = 'gcash' then 'Paid' else 'Pending' end,
  case when lower(coalesce(po.fulfillment_method, '')) = 'delivery' then 'delivery' else 'pickup' end,
  case when lower(coalesce(po.fulfillment_method, '')) = 'delivery' then 'Delivery' else 'Store Pickup' end,
  '',
  po.eta,
  case
    when po.rider_name is not null or po.rider_contact is not null or po.rider_vehicle is not null
      then jsonb_build_object(
        'name', coalesce(po.rider_name, ''),
        'contact', coalesce(po.rider_contact, ''),
        'vehicle', coalesce(po.rider_vehicle, '')
      )
    else null
  end,
  coalesce(po.tracking_updates, '[]'::jsonb),
  coalesce(po.tracking_updates, '[]'::jsonb),
  coalesce(po.delivery_status, 'Processing'),
  po.cancelled_at,
  po.cancelled_stage,
  po.cancel_reason,
  coalesce(po.created_at, timezone('utc', now())),
  coalesce(po.updated_at, timezone('utc', now()))
from legacy_customer.profile_orders po
left join legacy_customer.profiles cp on cp.id = po.user_id
left join auth.users au on au.id = po.user_id
on conflict (id) do update set
  order_code = excluded.order_code,
  category = excluded.category,
  customer_name = excluded.customer_name,
  customer_email = excluded.customer_email,
  customer_phone = excluded.customer_phone,
  order_date = excluded.order_date,
  items = excluded.items,
  currency = excluded.currency,
  base_total = excluded.base_total,
  total = excluded.total,
  status = excluded.status,
  request_status = excluded.request_status,
  payment_method = excluded.payment_method,
  payment_status = excluded.payment_status,
  fulfillment_method = excluded.fulfillment_method,
  delivery_method = excluded.delivery_method,
  shipping_address = excluded.shipping_address,
  eta = excluded.eta,
  rider_snapshot = excluded.rider_snapshot,
  tracking_updates = excluded.tracking_updates,
  timeline = excluded.timeline,
  delivery_status = excluded.delivery_status,
  cancelled_at = excluded.cancelled_at,
  cancelled_stage = excluded.cancelled_stage,
  cancel_reason = excluded.cancel_reason,
  updated_at = greatest(public.orders.updated_at, excluded.updated_at);

update public.orders o
set
  category = ao.category,
  customer_name = coalesce(ao.customer_name, o.customer_name),
  customer_email = coalesce(ao.email, o.customer_email),
  customer_phone = coalesce(ao.phone, o.customer_phone),
  order_date = coalesce(ao.order_date::timestamp, o.order_date),
  items = coalesce(ao.items, o.items),
  base_total = coalesce(ao.base_total, o.base_total),
  total = coalesce(ao.total, o.total),
  status = coalesce(ao.status, o.status),
  request_status = coalesce(ao.request_status, o.request_status),
  rejection_reason = coalesce(ao.rejection_reason, o.rejection_reason),
  payment_method = coalesce(ao.payment_method, o.payment_method),
  payment_status = coalesce(ao.payment_status, o.payment_status),
  delivery_method = coalesce(ao.delivery_method, o.delivery_method),
  delivery_zone = coalesce(ao.delivery_zone, o.delivery_zone),
  delivery_fee = coalesce(ao.delivery_fee, o.delivery_fee),
  shipping_address = coalesce(ao.shipping_address, o.shipping_address),
  proof_of_payment = coalesce(ao.proof_of_payment, o.proof_of_payment),
  rider_snapshot = coalesce(ao.rider, o.rider_snapshot),
  timeline = coalesce(ao.timeline, o.timeline),
  updated_at = greatest(o.updated_at, coalesce(ao.updated_at, o.updated_at))
from legacy_admin.orders ao
where o.order_code = ao.order_id;

insert into public.orders (
  id,
  order_code,
  user_id,
  category,
  customer_name,
  customer_email,
  customer_phone,
  order_date,
  items,
  base_total,
  total,
  status,
  request_status,
  rejection_reason,
  payment_method,
  payment_status,
  delivery_method,
  delivery_zone,
  delivery_fee,
  shipping_address,
  rider_snapshot,
  timeline,
  proof_of_payment,
  created_at,
  updated_at
)
select
  ao.id,
  ao.order_id,
  matched_profile.user_id,
  ao.category,
  ao.customer_name,
  coalesce(ao.email, ''),
  coalesce(ao.phone, ''),
  coalesce(ao.order_date::timestamp, ao.created_at, timezone('utc', now())),
  coalesce(ao.items, '[]'::jsonb),
  coalesce(ao.base_total, 0),
  coalesce(ao.total, 0),
  coalesce(ao.status, 'Pending'),
  coalesce(ao.request_status, 'Pending Request'),
  coalesce(ao.rejection_reason, ''),
  coalesce(ao.payment_method, 'Cash'),
  coalesce(ao.payment_status, 'Pending'),
  coalesce(ao.delivery_method, 'Store Pickup'),
  coalesce(ao.delivery_zone, ''),
  coalesce(ao.delivery_fee, 0),
  coalesce(ao.shipping_address, ''),
  ao.rider,
  coalesce(ao.timeline, '[]'::jsonb),
  coalesce(ao.proof_of_payment, ''),
  coalesce(ao.created_at, timezone('utc', now())),
  coalesce(ao.updated_at, timezone('utc', now()))
from legacy_admin.orders ao
left join legacy_admin.customers ac on ac.name = ao.customer_name
left join public.profiles matched_profile
  on matched_profile.role = 'customer'
 and lower(coalesce(matched_profile.email, '')) = lower(coalesce(ac.email, ''))
where not exists (
  select 1 from public.orders o where o.order_code = ao.order_id
)
and matched_profile.user_id is not null;

-- Reviews
insert into public.reviews (
  id,
  review_code,
  user_id,
  booking_id,
  service,
  category,
  rating,
  review_date,
  pet_name,
  pet_breed,
  comment,
  created_at,
  updated_at
)
select
  pr.id,
  'REV-' || replace(pr.id::text, '-', ''),
  pr.user_id,
  pr.booking_id,
  pr.service,
  case
    when lower(coalesce(pr.service, '')) like '%board%' then 'Boarding'
    when lower(coalesce(pr.service, '')) like '%pawty%'
      or lower(coalesce(pr.service, '')) like '%birthday%' then 'Birthday Party'
    else 'Grooming'
  end,
  pr.rating,
  pr.review_date,
  coalesce(pr.pet_name, 'N/A'),
  pr.pet_breed,
  pr.comment,
  coalesce(pr.created_at, timezone('utc', now())),
  coalesce(pr.updated_at, timezone('utc', now()))
from legacy_customer.profile_reviews pr
on conflict (id) do update set
  user_id = excluded.user_id,
  booking_id = excluded.booking_id,
  service = excluded.service,
  category = excluded.category,
  rating = excluded.rating,
  review_date = excluded.review_date,
  pet_name = excluded.pet_name,
  pet_breed = excluded.pet_breed,
  comment = excluded.comment,
  updated_at = greatest(public.reviews.updated_at, excluded.updated_at);

insert into public.reviews (
  id,
  review_code,
  user_id,
  service,
  category,
  rating,
  score,
  review_date,
  pet_name,
  comment,
  admin_response,
  would_recommend,
  transaction,
  created_at,
  updated_at
)
select
  ar.id,
  ar.review_id,
  matched_profile.user_id,
  ar.service,
  ar.category,
  ar.rating,
  ar.score,
  coalesce(nullif(ar.review_date, '')::date, current_date),
  coalesce(ar.pet_name, 'N/A'),
  ar.review_text,
  coalesce(ar.admin_response, ''),
  coalesce(ar.would_recommend, true),
  coalesce(ar.transaction, '{}'::jsonb),
  coalesce(ar.created_at, timezone('utc', now())),
  coalesce(ar.updated_at, timezone('utc', now()))
from legacy_admin.reviews ar
left join legacy_admin.customers ac on ac.name = ar.customer_name
left join public.profiles matched_profile
  on matched_profile.role = 'customer'
 and lower(coalesce(matched_profile.email, '')) = lower(coalesce(ac.email, ''))
where not exists (
  select 1 from public.reviews r where r.review_code = ar.review_id
)
and matched_profile.user_id is not null
on conflict (id) do update set
  review_code = excluded.review_code,
  service = excluded.service,
  category = excluded.category,
  rating = excluded.rating,
  score = excluded.score,
  review_date = excluded.review_date,
  pet_name = excluded.pet_name,
  comment = excluded.comment,
  admin_response = excluded.admin_response,
  would_recommend = excluded.would_recommend,
  transaction = excluded.transaction,
  updated_at = greatest(public.reviews.updated_at, excluded.updated_at);

-- Notifications
insert into public.notifications (
  id,
  user_id,
  audience,
  type,
  entity_type,
  entity_id,
  title,
  message,
  is_read,
  read_at,
  metadata,
  created_at
)
select
  pn.id,
  pn.user_id,
  'customer',
  case
    when lower(coalesce(pn.kind, '')) like '%booking%' then 'booking'
    when lower(coalesce(pn.kind, '')) like '%order%' then 'order'
    when lower(coalesce(pn.kind, '')) like '%review%' then 'review'
    else 'system'
  end,
  case
    when lower(coalesce(pn.kind, '')) like '%booking%' then 'booking'
    when lower(coalesce(pn.kind, '')) like '%order%' then 'order'
    when lower(coalesce(pn.kind, '')) like '%review%' then 'review'
    else 'system'
  end,
  null,
  pn.title,
  pn.message,
  coalesce(pn.is_read, false),
  pn.read_at,
  coalesce(pn.metadata, '{}'::jsonb),
  coalesce(pn.created_at, timezone('utc', now()))
from legacy_customer.profile_notifications pn
on conflict (id) do update set
  user_id = excluded.user_id,
  audience = excluded.audience,
  type = excluded.type,
  entity_type = excluded.entity_type,
  title = excluded.title,
  message = excluded.message,
  is_read = excluded.is_read,
  read_at = excluded.read_at,
  metadata = excluded.metadata,
  created_at = excluded.created_at;

insert into public.notifications (
  id,
  user_id,
  audience,
  type,
  entity_type,
  entity_id,
  title,
  message,
  is_read,
  metadata,
  created_at
)
select
  bn.id,
  null,
  'admin',
  'booking',
  'booking',
  b.id,
  'New Booking',
  bn.customer_name || ' booked ' || bn.service_type,
  coalesce(bn.is_read, false),
  jsonb_build_object(
    'bookingCode', bn.booking_id,
    'customerName', bn.customer_name,
    'serviceType', bn.service_type
  ),
  coalesce(bn.created_at, timezone('utc', now()))
from legacy_admin.booking_notifications bn
left join public.bookings b on b.booking_code = bn.booking_id
on conflict (id) do update set
  audience = excluded.audience,
  type = excluded.type,
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  title = excluded.title,
  message = excluded.message,
  is_read = excluded.is_read,
  metadata = excluded.metadata,
  created_at = excluded.created_at;

insert into public.notifications (
  id,
  user_id,
  audience,
  type,
  entity_type,
  entity_id,
  title,
  message,
  is_read,
  metadata,
  created_at
)
select
  onf.id,
  null,
  'admin',
  'order',
  'order',
  o.id,
  'New Order',
  onf.customer_name || ' placed a ' || onf.category || ' order',
  coalesce(onf.is_read, false),
  jsonb_build_object(
    'orderCode', onf.order_id,
    'customerName', onf.customer_name,
    'category', onf.category
  ),
  coalesce(onf.created_at, timezone('utc', now()))
from legacy_admin.order_notifications onf
left join public.orders o on o.order_code = onf.order_id
on conflict (id) do update set
  audience = excluded.audience,
  type = excluded.type,
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  title = excluded.title,
  message = excluded.message,
  is_read = excluded.is_read,
  metadata = excluded.metadata,
  created_at = excluded.created_at;
