import fs from "node:fs";
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

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL is missing in environment.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const tables = await client.query(
      "select table_name from information_schema.tables where table_schema='public' order by table_name"
    );

    console.log("Public tables:");
    for (const row of tables.rows) {
      console.log(`- ${row.table_name}`);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((error) => {
  console.error("Failed to inspect database.");
  console.error(error?.message || String(error));
  process.exit(1);
});
