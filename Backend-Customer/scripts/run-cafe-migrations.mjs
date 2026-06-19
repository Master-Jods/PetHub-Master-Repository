import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function loadEnvFile(filePath = ".env") {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) continue;
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const rawValue = line.slice(idx + 1).trim();
    if (!key) continue;

    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!process.env[key]) process.env[key] = value;
  }
}

async function run() {
  loadEnvFile();

  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL or SUPABASE_DB_URL is missing in environment.");
    process.exit(1);
  }

  if (dbUrl.startsWith("http")) {
    console.error("Error: The environment variable points to an HTTPS REST URL (e.g. https://*.supabase.co) rather than a direct PostgreSQL connection string (postgresql://...).");
    console.error("Please add a direct PostgreSQL connection string to your environment, for example:");
    console.error("DATABASE_URL=postgresql://postgres:[password]@db.yzzxgtpquosljnfjqmtf.supabase.co:5432/postgres");
    process.exit(1);
  }

  console.log("Connecting to the database...");
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected successfully.");

    // Create cafe schema
    console.log("Creating 'cafe' schema if not exists...");
    await client.query(`
      create schema if not exists cafe;
      grant usage on schema cafe to anon, authenticated, service_role;
      alter default privileges in schema cafe grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema cafe grant all on sequences to anon, authenticated, service_role;
      alter default privileges in schema cafe grant all on functions to anon, authenticated, service_role;
    `);

    const sqlFiles = [
      "unified_schema.sql",
      "delivery_area_schema.sql",
      "guest_order_schema.sql",
      "customer_reviews_schema.sql",
      "inventory_production_migration.sql"
    ];

    const sourceDir = path.resolve("../CafeHub/Happy-tails-fontend/frontend/supabase");
    const targetDir = path.resolve("database/migrations/cafe");

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

      console.log(`Processing: ${file}...`);
      let sql = fs.readFileSync(srcPath, "utf8");

      // Replace public. with cafe.
      sql = sql.replace(/public\./g, "cafe.");
      
      // Rename triggers on auth.users to avoid conflict
      sql = sql.replace(/on_auth_user_created/g, "on_auth_user_created_cafe");
      sql = sql.replace(/on_auth_user_updated_email/g, "on_auth_user_updated_email_cafe");

      // Write to Backend-Customer migration folder
      fs.writeFileSync(destPath, sql, "utf8");
      console.log(`Saved schema to: ${destPath}`);

      // Execute SQL
      console.log(`Running migration for ${file}...`);
      await client.query(sql);
      console.log(`Migration applied: ${file}`);
    }

    // Run one-time data migration to sync auth.users into cafe.profiles
    console.log("Syncing existing auth.users into cafe.profiles...");
    await client.query(`
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
    `);
    console.log("All existing users synced into cafe.profiles.");

    console.log("Database merger completed successfully!");
  } catch (error) {
    console.error("Migration failed!");
    console.error(error?.message || String(error));
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
