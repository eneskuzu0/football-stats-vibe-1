import "server-only";
import { createCacheClient } from "./supabase/server";
import type { Json } from "./supabase/types";

// Explicit row shape — avoids relying on the Supabase builder chain's
// generic inference, which collapses to `never` with hand-written Database types.
type CacheRow = { key: string; value: Json; fetched_at: string; expires_at: string };

/** Today's fixtures change as matches progress — 30 min staleness is acceptable. */
export const TTL_FIXTURES_MINUTES = 30;

/** Standings only update after full matchdays — 6 hours is very safe. */
export const TTL_STANDINGS_MINUTES = 360;

/**
 * Returns cached value if it exists and has not expired.
 * Returns null on any failure (missing config, DB error, expired row).
 */
export async function readCache<T>(key: string): Promise<T | null> {
  const supabase = createCacheClient();
  if (!supabase) return null;

  try {
    const result = await supabase
      .from("api_cache")
      .select("*")
      .eq("key", key)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    const row = result.data as CacheRow | null;
    return row ? (row.value as T) : null;
  } catch {
    return null;
  }
}

/**
 * Upserts a value into the cache with a computed expiry.
 * Silently no-ops if Supabase is not configured or the write fails.
 */
export async function writeCache<T>(
  key: string,
  value: T,
  ttlMinutes: number
): Promise<void> {
  const supabase = createCacheClient();
  if (!supabase) return;

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);

    await supabase.from("api_cache").upsert(
      {
        key,
        value: value as Json,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.error("[cache] write failed:", key, err);
  }
}
