import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Returns a service-role Supabase client for cache operations (no Database
 * generic — caller casts results to CacheRow to avoid the maybeSingle()
 * `never` inference that occurs with hand-written generics).
 * Returns null if env vars are not yet configured.
 */
export function createCacheClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
