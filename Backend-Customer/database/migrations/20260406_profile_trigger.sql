-- Automatically create and maintain shared profile rows for new auth users.
-- Safe to run multiple times.

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
