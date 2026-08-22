import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY } from "./config";

// Browser-side Supabase client (used in Client Components).
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
