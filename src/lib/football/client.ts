import "server-only";

const BASE_URL = "https://v3.football.api-sports.io";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; statusCode: number } };

/**
 * Typed fetch wrapper for API-Football v3.
 * Never throws — always returns ApiResult<T>.
 * Uses { cache: "no-store" } because Supabase is the cache layer.
 */
export async function apiFetch<T>(
  endpoint: string,
  params: Record<string, string | number>
): Promise<ApiResult<T>> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: { message: "API_FOOTBALL_KEY is not configured", statusCode: 0 },
    };
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, String(v));
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}?${qs.toString()}`, {
      headers: { "x-apisports-key": apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        ok: false,
        error: {
          message: `API-Football responded ${res.status}: ${res.statusText}`,
          statusCode: res.status,
        },
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: {
        message: err instanceof Error ? err.message : "Network error",
        statusCode: 0,
      },
    };
  }
}
