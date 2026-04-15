create or replace function public.create_customer_order(order_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb := coalesce(order_payload, '{}'::jsonb);
  auth_user uuid := auth.uid();
  payload_user uuid := nullif(payload->>'user_id', '')::uuid;
  item jsonb;
  requested_qty integer;
  product_identifier text;
  product_name text;
  updated_rows integer;
  inventory_trigger_exists boolean;
  inserted_order public.orders%rowtype;
begin
  if auth_user is null then
    raise exception 'You must be logged in to create an order.';
  end if;

  if payload_user is distinct from auth_user then
    raise exception 'Unauthorized order request.';
  end if;

  select exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'orders'
      and t.tgname = 'trg_orders_reserve_inventory'
      and not t.tgisinternal
  )
  into inventory_trigger_exists;

  if not inventory_trigger_exists and coalesce(jsonb_typeof(payload->'items'), 'null') = 'array' then
    for item in select value from jsonb_array_elements(payload->'items')
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
  end if;

  insert into public.orders (
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
    rejection_reason,
    payment_method,
    payment_status,
    fulfillment_method,
    delivery_method,
    delivery_zone,
    delivery_fee,
    shipping_address,
    eta,
    rider_snapshot,
    tracking_updates,
    timeline,
    proof_of_payment,
    delivery_status,
    cancelled_at,
    cancelled_stage,
    cancel_reason,
    metadata,
    updated_at
  )
  values (
    coalesce(nullif(payload->>'order_code', ''), 'ORD-' || extract(epoch from now())::bigint::text),
    payload_user,
    coalesce(nullif(payload->>'category', ''), 'Pet Shop'),
    coalesce(nullif(payload->>'customer_name', ''), 'Customer'),
    coalesce(payload->>'customer_email', ''),
    coalesce(payload->>'customer_phone', ''),
    coalesce(nullif(payload->>'order_date', ''), timezone('utc', now())::text)::timestamptz,
    coalesce(payload->'items', '[]'::jsonb),
    coalesce(nullif(payload->>'currency', ''), 'PHP'),
    coalesce((payload->>'base_total')::numeric, 0),
    coalesce((payload->>'total')::numeric, 0),
    coalesce(nullif(payload->>'status', ''), 'Pending'),
    coalesce(nullif(payload->>'request_status', ''), 'Pending Request'),
    coalesce(payload->>'rejection_reason', ''),
    coalesce(nullif(payload->>'payment_method', ''), 'Cash'),
    coalesce(nullif(payload->>'payment_status', ''), 'Pending'),
    coalesce(nullif(payload->>'fulfillment_method', ''), 'pickup'),
    coalesce(nullif(payload->>'delivery_method', ''), 'Store Pickup'),
    coalesce(payload->>'delivery_zone', ''),
    coalesce((payload->>'delivery_fee')::numeric, 0),
    coalesce(payload->>'shipping_address', ''),
    nullif(payload->>'eta', '')::timestamptz,
    payload->'rider_snapshot',
    coalesce(payload->'tracking_updates', '[]'::jsonb),
    coalesce(payload->'timeline', '[]'::jsonb),
    coalesce(payload->>'proof_of_payment', ''),
    coalesce(nullif(payload->>'delivery_status', ''), 'Processing'),
    nullif(payload->>'cancelled_at', '')::timestamptz,
    nullif(payload->>'cancelled_stage', ''),
    nullif(payload->>'cancel_reason', ''),
    coalesce(payload->'metadata', '{}'::jsonb),
    coalesce(nullif(payload->>'updated_at', ''), timezone('utc', now())::text)::timestamptz
  )
  returning * into inserted_order;

  return jsonb_build_object(
    'id', inserted_order.id,
    'order_code', inserted_order.order_code
  );
end;
$$;

grant execute on function public.create_customer_order(jsonb) to authenticated;
