import { supabase, isSupabaseConfigured } from "../supabaseClient";

const REQUIRED_PROFILE_TABLES = [
  "profiles",
  "bookings",
  "orders",
  "reviews",
  "pets",
  "notifications",
];

const TABLE_PROBE_COLUMNS = {
  profiles: "user_id",
};

function getSupabaseHost() {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "(invalid or missing VITE_SUPABASE_URL)";
  }
}

async function probeTable(tableName) {
  const probeColumn = TABLE_PROBE_COLUMNS[tableName] || "id";
  const { error } = await supabase
    .from(tableName)
    .select(probeColumn, { head: true, count: "exact" });

  if (error) {
    return {
      table: tableName,
      ok: false,
      message: error.message || "Unknown error",
      code: error.code || null,
    };
  }

  return {
    table: tableName,
    ok: true,
    message: "OK",
    code: null,
  };
}

export async function checkSupabaseProfileHealth() {
  const host = getSupabaseHost();

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      configured: false,
      host,
      checks: [],
      checkedAt: new Date().toISOString(),
    };
  }

  const checks = await Promise.all(REQUIRED_PROFILE_TABLES.map((table) => probeTable(table)));
  const ok = checks.every((check) => check.ok);

  return {
    ok,
    configured: true,
    host,
    checks,
    checkedAt: new Date().toISOString(),
  };
}
