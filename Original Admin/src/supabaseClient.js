console.log("DEBUG - Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("DEBUG - Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Loaded" : "MISSING");

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This will show up in your browser console (F12)
console.log("Checking Supabase Connection...");
console.log("URL exists:", !!supabaseUrl);
console.log("Key exists:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase variables are missing! Check your .env file and restart the server.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);