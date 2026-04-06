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

function printUsageAndExit() {
  console.log("Usage: node scripts/run-sql-file.mjs <sql-file-path>");
  process.exit(1);
}

async function run() {
  loadEnvFile();

  const sqlPathArg = process.argv[2];
  if (!sqlPathArg) printUsageAndExit();

  const sqlPath = path.resolve(sqlPathArg);
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found: ${sqlPath}`);
    process.exit(1);
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL is missing in environment.");
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log(`Migration applied successfully: ${path.basename(sqlPath)}`);
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((error) => {
  console.error("Failed to execute SQL file.");
  console.error(error?.message || String(error));
  process.exit(1);
});
