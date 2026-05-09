import { NextResponse } from "next/server";
import { LEAGUES } from "@/lib/football/leagues";
import {
  importStandings,
  importFixtures,
  importPlayers,
  delay,
  type ImportResult,
} from "@/lib/football/archive";

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Set ADMIN_SECRET in Vercel env vars. Call with header: x-admin-secret: <value>
// If the env var is unset the endpoint is open (useful in local dev).

function isAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true;
  return request.headers.get("x-admin-secret") === secret;
}

// ─── Budget guard ─────────────────────────────────────────────────────────────
// Free tier: 100 req/day. Per league+season this route uses:
//   1 standings + 1 fixtures + 2 player pages = 4 calls.
// All 6 leagues in one run = 24 calls. Stay well under budget.

const INTER_CALL_DELAY_MS = 600; // pause between each API call

interface LeagueImportSummary {
  leagueId: number;
  name: string;
  standings: ImportResult;
  fixtures: ImportResult;
  players: ImportResult;
  apiCallsUsed: number;
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: "POST /api/admin/import",
    usage: "POST /api/admin/import?season=2025&league=39",
    params: {
      season: "required — e.g. 2024 or 2025",
      league: "optional — API-Football league id (omit to import all 6 leagues)",
    },
    auth: "header: x-admin-secret: <ADMIN_SECRET>",
    estimatedApiCalls: { perLeague: 4, allLeagues: 24 },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const seasonParam = url.searchParams.get("season");
  const leagueParam = url.searchParams.get("league");

  if (!seasonParam) {
    return NextResponse.json(
      { error: "Missing required query param: season (e.g. ?season=2024)" },
      { status: 400 }
    );
  }

  const season = parseInt(seasonParam, 10);
  if (isNaN(season) || season < 2018 || season > 2030) {
    return NextResponse.json({ error: "season must be a valid year (e.g. 2024)" }, { status: 400 });
  }

  // Scope to one league or all 6
  const leagues = leagueParam
    ? LEAGUES.filter((l) => l.id === parseInt(leagueParam, 10))
    : [...LEAGUES];

  if (leagues.length === 0) {
    return NextResponse.json({ error: `Unknown league id: ${leagueParam}` }, { status: 400 });
  }

  const started = Date.now();
  const results: LeagueImportSummary[] = [];
  let totalApiCalls = 0;

  for (const league of leagues) {
    let apiCalls = 0;

    // 1 — Standings
    const standings = await importStandings(league.id, season);
    apiCalls++;
    await delay(INTER_CALL_DELAY_MS);

    // 2 — Fixtures (all matches for the season in one call)
    const fixtures = await importFixtures(league.id, season);
    apiCalls++;
    await delay(INTER_CALL_DELAY_MS);

    // 3 — Players (up to 2 pages; importPlayers handles the internal page delay)
    const players = await importPlayers(league.id, season, INTER_CALL_DELAY_MS);
    apiCalls += 2; // pessimistic: always count both pages
    await delay(INTER_CALL_DELAY_MS);

    results.push({
      leagueId: league.id,
      name: league.name,
      standings,
      fixtures,
      players,
      apiCallsUsed: apiCalls,
    });

    totalApiCalls += apiCalls;
  }

  return NextResponse.json({
    season,
    elapsedMs: Date.now() - started,
    totalApiCallsUsed: totalApiCalls,
    remainingBudgetEstimate: 100 - totalApiCalls,
    results,
  });
}
