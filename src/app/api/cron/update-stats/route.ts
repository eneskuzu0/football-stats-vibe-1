import { NextResponse } from "next/server";
import { getLeagueStandings } from "@/lib/football/standings";
import { getLeagueFixtures } from "@/lib/football/fixtures";
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

  const [standingsResults, fixturesResults] = await Promise.all([
    Promise.allSettled(
      LEAGUES.map((league) =>
        getLeagueStandings(league.id, season).then((rows) => ({
          leagueId: league.id,
          name: league.name,
          teams: rows.length,
        }))
      )
    ),
    Promise.allSettled(
      LEAGUES.map((league) =>
        getLeagueFixtures(league.id, season).then((fixtures) => ({
          leagueId: league.id,
          name: league.name,
          fixtures: fixtures.length,
        }))
      )
    ),
  ]);

  const standings = standingsResults.map((r, i) =>
    r.status === "fulfilled"
      ? { ...r.value, ok: true }
      : { leagueId: LEAGUES[i].id, name: LEAGUES[i].name, teams: 0, ok: false,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason) }
  );

  const fixtures = fixturesResults.map((r, i) =>
    r.status === "fulfilled"
      ? { ...r.value, ok: true }
      : { leagueId: LEAGUES[i].id, name: LEAGUES[i].name, fixtures: 0, ok: false,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason) }
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    season,
    elapsedMs: Date.now() - started,
    standings,
    fixtures,
  });
}
