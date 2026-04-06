import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasValidUrl =
  typeof supabaseUrl === "string" && /^https?:\/\//i.test(supabaseUrl);
const hasValidAnonKey =
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.trim().length > 0 &&
  !supabaseAnonKey.includes("your_supabase_anon_key");

export const isSupabaseConfigured = hasValidUrl && hasValidAnonKey;

if (!isSupabaseConfigured) {
  console.error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
