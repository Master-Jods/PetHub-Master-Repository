import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.resolve("Backend-Customer/package.json"));
const { Client } = require("pg");

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "PGPASSWORD"];
for (const key of requiredEnv) {
  if (!process.env[key]) throw new Error(`${key} is required.`);
}

const target = {
  email: "jodell.games@gmail.com",
  displayName: "Jodell Games",
  phone: "09763898538",
};

async function admin(pathname, options = {}) {
  const res = await fetch(`${process.env.SUPABASE_URL}${pathname}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

async function getOrCreateUser() {
  const users = await admin(`/auth/v1/admin/users?email=${encodeURIComponent(target.email)}`);
  const existing = Array.isArray(users?.users)
    ? users.users.find((user) => user.email?.toLowerCase() === target.email)
    : null;

  if (existing) return existing;

  return admin("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: target.email,
      password: "JodellGames123!",
      email_confirm: true,
      user_metadata: {
        role: "customer",
        name: target.displayName,
        display_name: target.displayName,
        first_name: "Jodell",
        last_name: "Games",
        phone: target.phone,
      },
    }),
  });
}

function buildOrderItem(item, quantity) {
  return {
    productId: item.id,
    name: item.name,
    category: item.category,
    price: Number(item.price),
    quantity,
    image: item.image_url,
  };
}

const client = new Client({
  host: "aws-0-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.tvruqskdhdearppbfmdw",
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
});

const user = await getOrCreateUser();
const userId = user.id;

await client.connect();
await client.query("begin");

try {
  await client.query(
    `
      insert into public.profiles (
        user_id, role, email, first_name, last_name, display_name,
        phone, username, address, city, status
      )
      values (
        $1, 'customer', $2, 'Jodell', 'Games', $3,
        $4, 'jodellgames', 'Pleasantville Subdivision, Lucena City', 'Lucena', 'active'
      )
      on conflict (user_id) do update set
        role = 'customer',
        email = excluded.email,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        display_name = excluded.display_name,
        phone = excluded.phone,
        username = excluded.username,
        address = excluded.address,
        city = excluded.city,
        status = 'active',
        updated_at = timezone('utc', now())
    `,
    [userId, target.email, target.displayName, target.phone],
  );

  await client.query(
    `
      insert into cafe.profiles (id, role, customer_code, name, email, phone, is_active)
      values ($1, 'customer'::cafe.app_role, cafe.generate_customer_code(), $2, $3, $4, true)
      on conflict (id) do update set
        role = 'customer'::cafe.app_role,
        name = excluded.name,
        email = excluded.email,
        phone = excluded.phone,
        is_active = true,
        updated_at = now()
    `,
    [userId, target.displayName, target.email, target.phone],
  );

  const pet = await client.query(
    `
      insert into public.pets (user_id, name, species, breed, birth_date, notes)
      values ($1, 'Mochi', 'dog', 'Shih Tzu', '2022-05-14', 'Friendly demo pet for restored transactions.')
      on conflict (user_id, name) do update set
        breed = excluded.breed,
        notes = excluded.notes,
        updated_at = timezone('utc', now())
      returning id
    `,
    [userId],
  );
  const petId = pet.rows[0].id;

  const retailItems = await client.query(`
    select id, name, price, category, image_url
    from public.inventory_items
    where product_type = 'Pet Shop' and is_active = true
    order by name
    limit 10
  `);
  const petMenuItems = await client.query(`
    select id, name, price, category, image_url
    from public.inventory_items
    where product_type = 'Pet Menu' and is_active = true
    order by name
    limit 10
  `);
  const cafeItems = await client.query(`
    select id, code, name, price
    from cafe.menu_items
    where is_available = true
    order by code
    limit 10
  `);

  if (retailItems.rows.length < 10 || petMenuItems.rows.length < 10 || cafeItems.rows.length < 10) {
    throw new Error("Not enough seeded catalog/menu items.");
  }

  for (let i = 0; i < 10; i += 1) {
    const item = retailItems.rows[i];
    const quantity = (i % 3) + 1;
    const total = Number(item.price) * quantity;
    const items = [buildOrderItem(item, quantity)];

    await client.query(
      `
        insert into public.orders (
          order_code, user_id, category, customer_name, customer_email, customer_phone,
          order_date, items, base_total, total, status, request_status, payment_method,
          payment_status, fulfillment_method, delivery_method, shipping_address,
          delivery_status, metadata
        )
        values (
          'RTL-' || lpad(($2 + 1)::text, 4, '0'), $1, 'Pet Shop', $3, $4, $5,
          timezone('utc', now()) - (($2 || ' days')::interval), $6::jsonb, $7::numeric, $7::numeric,
          case when $2 < 7 then 'Delivered' else 'Preparing Order' end,
          'Accepted',
          case when $2 % 2 = 0 then 'Cash' else 'GCash' end,
          case when $2 < 7 then 'Paid' else 'Pending' end,
          case when $2 % 2 = 0 then 'pickup' else 'delivery' end,
          case when $2 % 2 = 0 then 'Store Pickup' else 'Delivery' end,
          'Pleasantville Subdivision, Lucena City',
          case when $2 < 7 then 'Delivered' else 'Processing' end,
          jsonb_build_object('seeded', true, 'seed_group', 'retail')
        )
        on conflict (order_code) do update set
          user_id = excluded.user_id,
          customer_name = excluded.customer_name,
          customer_email = excluded.customer_email,
          customer_phone = excluded.customer_phone,
          items = excluded.items,
          base_total = excluded.base_total,
          total = excluded.total,
          metadata = excluded.metadata,
          updated_at = timezone('utc', now())
      `,
      [userId, i, target.displayName, target.email, target.phone, JSON.stringify(items), total],
    );
  }

  for (let i = 0; i < 10; i += 1) {
    const item = petMenuItems.rows[i];
    const quantity = (i % 2) + 1;
    const total = Number(item.price) * quantity;
    const items = [buildOrderItem(item, quantity)];

    await client.query(
      `
        insert into public.orders (
          order_code, user_id, category, customer_name, customer_email, customer_phone,
          order_date, items, base_total, total, status, request_status, payment_method,
          payment_status, fulfillment_method, delivery_method, shipping_address,
          delivery_status, metadata
        )
        values (
          'PETMENU-' || lpad(($2 + 1)::text, 4, '0'), $1, 'Pet Menu', $3, $4, $5,
          timezone('utc', now()) - (($2 + 10 || ' days')::interval), $6::jsonb, $7::numeric, $7::numeric,
          case when $2 < 6 then 'Order Received' else 'Order Placed' end,
          'Accepted',
          case when $2 % 2 = 0 then 'Cash' else 'GCash' end,
          case when $2 < 6 then 'Paid' else 'Pending' end,
          'pickup', 'Store Pickup', '', 'Processing',
          jsonb_build_object('seeded', true, 'seed_group', 'pet_cafe')
        )
        on conflict (order_code) do update set
          user_id = excluded.user_id,
          customer_name = excluded.customer_name,
          customer_email = excluded.customer_email,
          customer_phone = excluded.customer_phone,
          items = excluded.items,
          base_total = excluded.base_total,
          total = excluded.total,
          metadata = excluded.metadata,
          updated_at = timezone('utc', now())
      `,
      [userId, i, target.displayName, target.email, target.phone, JSON.stringify(items), total],
    );
  }

  for (let i = 0; i < 10; i += 1) {
    const item = cafeItems.rows[i];
    const quantity = (i % 3) + 1;
    const subtotal = Number(item.price) * quantity;
    const status = i < 6 ? "completed" : i < 8 ? "preparing" : "pending";
    const order = await client.query(
      `
        insert into cafe.orders (
          code, customer_id, order_type, status, payment_method, payment_status,
          subtotal, discount_total, total_amount, notes, placed_at
        )
        values (
          'HUMAN-' || lpad(($2 + 1)::text, 4, '0'), $1,
          case when $2 % 3 = 0 then 'dine_in'::cafe.order_type
               when $2 % 3 = 1 then 'pickup'::cafe.order_type
               else 'takeout'::cafe.order_type
          end,
          $3::cafe.order_status,
          'cash'::cafe.payment_method,
          case when $3 = 'completed' then 'paid'::cafe.payment_status else 'pending'::cafe.payment_status end,
          $4::numeric, 0, $4::numeric,
          'Seeded human cafe order for Jodell Games',
          now() - (($2 || ' days')::interval)
        )
        on conflict (code) do update set
          customer_id = excluded.customer_id,
          status = excluded.status,
          payment_status = excluded.payment_status,
          subtotal = excluded.subtotal,
          total_amount = excluded.total_amount,
          updated_at = now()
        returning id
      `,
      [userId, i, status, subtotal],
    );
    const orderId = order.rows[0].id;

    await client.query(
      `
        insert into cafe.order_items (
          order_id, menu_item_id, menu_item_code, item_name, quantity, unit_price, line_total
        )
        values ($1, $2, $3, $4, $5, $6::numeric, $7::numeric)
        on conflict do nothing
      `,
      [orderId, item.id, item.code, item.name, quantity, Number(item.price), subtotal],
    );

    await client.query(
      `
        insert into cafe.order_status_history (order_id, status, changed_by, note, changed_at)
        values (
          $1, $2::cafe.order_status, $3,
          'Seeded dashboard transaction',
          now() - (($4 || ' days')::interval)
        )
        on conflict do nothing
      `,
      [orderId, status, userId, i],
    );
  }

  const services = [
    ["Full Grooming", "Grooming", 650],
    ["Basic Grooming", "Grooming", 450],
    ["Premium Bath", "Grooming", 350],
    ["Pet Boarding Overnight", "Boarding", 900],
    ["Day Care Stay", "Boarding", 500],
    ["Birthday Pawty Small", "Birthday Party", 2500],
    ["Birthday Pawty Premium", "Birthday Party", 4200],
    ["Nail Trim", "Grooming", 180],
    ["Ear Cleaning", "Grooming", 150],
    ["Spa Package", "Grooming", 850],
  ];

  for (let i = 0; i < services.length; i += 1) {
    const [service, serviceType, price] = services[i];
    const scheduled = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString();

    await client.query(
      `
        insert into public.bookings (
          booking_code, user_id, pet_id, service, service_type, scheduled_at,
          customer_name, customer_email, customer_phone, pet_name, pet_breed,
          pet_info, appointment_info, contact_info, service_details, grooming_summary,
          service_total, price_label, payment_method, payment_status, booking_status,
          note, metadata
        )
        values (
          'BKG-JOD-' || lpad(($2 + 1)::text, 4, '0'), $1, $3, $4, $5, $6::timestamptz,
          $7::text, $8::text, $9::text, 'Mochi', 'Shih Tzu',
          jsonb_build_object('name', 'Mochi', 'species', 'dog', 'breed', 'Shih Tzu'),
          jsonb_build_object('source', 'seed', 'slot', ($6::timestamptz)::text),
          jsonb_build_object('name', $7::text, 'email', $8::text, 'phone', $9::text),
          jsonb_build_object('service', $4::text, 'serviceType', $5::text),
          jsonb_build_object('coat', 'regular', 'temperament', 'friendly'),
          $10::numeric, $11::text,
          case when $2 % 2 = 0 then 'Cash' else 'GCash' end,
          case when $2 < 5 then 'Paid' else 'Pending' end,
          case when $2 < 3 then 'Completed'
               when $2 < 7 then 'Confirmed'
               else 'Pending Approval'
          end,
          'Seeded booking for restored profile history.',
          jsonb_build_object('seeded', true, 'seed_group', 'services')
        )
        on conflict (booking_code) do update set
          user_id = excluded.user_id,
          pet_id = excluded.pet_id,
          customer_name = excluded.customer_name,
          customer_email = excluded.customer_email,
          customer_phone = excluded.customer_phone,
          metadata = excluded.metadata,
          updated_at = timezone('utc', now())
      `,
      [userId, i, petId, service, serviceType, scheduled, target.displayName, target.email, target.phone, price, `PHP ${price}`],
    );
  }

  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
}

const counts = await client.query(
  `
    select 'retail_orders' as label, count(*)::int as count
    from public.orders
    where user_id = $1 and category = 'Pet Shop' and metadata->>'seed_group' = 'retail'
    union all
    select 'pet_cafe_orders', count(*)::int
    from public.orders
    where user_id = $1 and category = 'Pet Menu' and metadata->>'seed_group' = 'pet_cafe'
    union all
    select 'human_cafe_orders', count(*)::int
    from cafe.orders
    where customer_id = $1 and code like 'HUMAN-%'
    union all
    select 'service_bookings', count(*)::int
    from public.bookings
    where user_id = $1 and metadata->>'seed_group' = 'services'
  `,
  [userId],
);

console.table(counts.rows);
console.log("user_id", userId);
await client.end();
