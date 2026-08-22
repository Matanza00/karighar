// Central Supabase config. Accepts either the classic "anon key" env name
// or the newer "publishable key" name — both are inlined by Next at build time.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!;
