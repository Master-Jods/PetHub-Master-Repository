create or replace function public.reserve_inventory_for_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  requested_qty integer;
  product_identifier text;
  product_name text;
  updated_rows integer;
begin
  if coalesce(jsonb_typeof(new.items), 'null') <> 'array' then
    return new;
  end if;

  for item in select value from jsonb_array_elements(new.items)
  loop
    requested_qty := greatest(coalesce((item->>'quantity')::integer, 0), 0);
    if requested_qty = 0 then
      continue;
    end if;

    product_identifier := nullif(trim(coalesce(item->>'productId', '')), '');
    product_name := nullif(trim(coalesce(item->>'name', '')), '');
    updated_rows := 0;

    if product_identifier is not null
      and product_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then
      update public.inventory_items
      set
        stock = stock - requested_qty,
        updated_at = timezone('utc', now())
      where id = product_identifier::uuid
        and stock >= requested_qty;

      get diagnostics updated_rows = row_count;
    end if;

    if updated_rows = 0 and product_name is not null then
      update public.inventory_items
      set
        stock = stock - requested_qty,
        updated_at = timezone('utc', now())
      where lower(name) = lower(product_name)
        and stock >= requested_qty;

      get diagnostics updated_rows = row_count;
    end if;

    if updated_rows = 0 then
      raise exception 'Not enough stock remaining for %.', coalesce(product_name, 'this item');
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_orders_reserve_inventory on public.orders;
create trigger trg_orders_reserve_inventory
before insert on public.orders
for each row execute function public.reserve_inventory_for_order();
