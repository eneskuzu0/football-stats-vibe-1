import { NextResponse } from "next/server";
import { getLeagueStandings } from "@/lib/football/standings";
import { LEAGUES } from "@/lib/football/leagues";

// Vercel cron jobs call this route via GET.
// In production Vercel automatically sets CRON_SECRET and sends it as
// "Authorization: Bearer <secret>" — we verify it to block public access.

function currentSeason(): number {
  const now = new Date();
  return now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const season = currentSeason();
  const started = Date.now();

  // Fetch all leagues concurrently — getLeagueStandings handles caching +
  // season fallback internally, so this either returns cached data or
  // hits API-Football and re-populates Supabase.
  const results = await Promise.allSettled(
    LEAGUES.map((league) =>
      getLeagueStandings(league.id, season).then((rows) => ({
        leagueId: league.id,
        name: league.name,
        teams: rows.length,
      }))
    )
  );

  const synced = results.map((r, i) =>
    r.status === "fulfilled"
      ? { ...r.value, ok: true }
      : { leagueId: LEAGUES[i].id, name: LEAGUES[i].name, teams: 0, ok: false,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason) }
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    season,
    elapsedMs: Date.now() - started,
    synced,
  });
}
