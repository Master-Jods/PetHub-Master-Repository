import fs from "node:fs";
import path from "node:path";

function run() {
  const sqlFiles = [
    "unified_schema.sql",
    "delivery_area_schema.sql",
    "guest_order_schema.sql",
    "customer_reviews_schema.sql",
    "inventory_production_migration.sql"
  ];

  const sourceDir = path.resolve("CafeHub/Happy-tails-fontend/frontend/supabase");
  const targetDir = path.resolve("Backend-Customer/database/migrations/cafe");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const file of sqlFiles) {
    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(targetDir, file);

    if (!fs.existsSync(srcPath)) {
      console.error(`Source SQL file not found: ${srcPath}`);
      process.exit(1);
    }

    console.log(`Converting: ${file}...`);
    let sql = fs.readFileSync(srcPath, "utf8");

    // Strip BOM character if present
    sql = sql.replace(/^\uFEFF/, "");

    // Replace public. with cafe.
    sql = sql.replace(/public\./g, "cafe.");
    
    // Rename triggers on auth.users to avoid conflict
    sql = sql.replace(/on_auth_user_created/g, "on_auth_user_created_cafe");
    sql = sql.replace(/on_auth_user_updated_email/g, "on_auth_user_updated_email_cafe");

    // Prepend schema setup
    const prepended = `create schema if not exists cafe;
grant usage on schema cafe to anon, authenticated, service_role;
alter default privileges in schema cafe grant all on tables to anon, authenticated, service_role;
alter default privileges in schema cafe grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema cafe grant all on functions to anon, authenticated, service_role;

` + sql;

    fs.writeFileSync(destPath, prepended, "utf8");
    console.log(`Saved to: ${destPath}`);
  }

  // Create a 6th file for the sync query
  const syncPath = path.join(targetDir, "sync_existing_users.sql");
  const syncSql = `insert into cafe.profiles (id, role, customer_code, name, email, phone)
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
`;
  fs.writeFileSync(syncPath, syncSql, "utf8");
  console.log(`Saved sync query to: ${syncPath}`);
  
  console.log("All SQL files converted successfully!");
}

run();
