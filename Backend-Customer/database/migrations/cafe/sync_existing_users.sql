insert into cafe.profiles (id, role, customer_code, name, email, phone)
select
  u.id,
  'customer'::cafe.app_role,
  cafe.generate_customer_code(),
  coalesce(u.raw_user_meta_data->>'display_name', trim(coalesce(u.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(u.raw_user_meta_data->>'last_name', '')), ''),
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'phone', '')
from auth.users u
left join cafe.profiles p on p.id = u.id
where p.id is null;
