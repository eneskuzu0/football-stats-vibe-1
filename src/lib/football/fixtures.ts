import "server-only";
import { apiFetch } from "./client";
import { readCache, writeCache, TTL_FIXTURES_MINUTES } from "../cache";
import type {
  ApiFootballFixturesResponse,
  ApiFootballFixtureItem,
  FixtureStatusShort,
  NormalizedFixture,
} from "./types";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildStatusDisplay(
  statusShort: FixtureStatusShort,
  elapsed: number | null,
  kickoffUtc: string
): string {
  switch (statusShort) {
    case "FT":
    case "AET":
    case "PEN":
      return "FT";
    case "HT":
      return "HT";
    case "NS":
    case "TBD":
      return new Date(kickoffUtc).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      });
    default:
      return elapsed !== null ? `${elapsed}′` : statusShort;
  }
}

function normalize(item: ApiFootballFixtureItem): NormalizedFixture {
  const { fixture, league, teams, goals } = item;
  const statusShort = fixture.status.short;
  return {
    id: fixture.id,
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    homeGoals: goals.home,
    awayGoals: goals.away,
    statusShort,
    statusDisplay: buildStatusDisplay(
      statusShort,
      fixture.status.elapsed,
      fixture.date
    ),
    leagueName: league.name,
    leagueId: league.id,
    kickoffUtc: fixture.date,
  };
}

/**
 * Returns today's fixtures for a given league (or all leagues if omitted).
 * Cache TTL: 30 minutes.
 */
export async function getTodayFixtures(
  leagueId?: number
): Promise<NormalizedFixture[]> {
  const date = todayUtc();
  const cacheKey = `fixtures:${date}:${leagueId ?? "all"}`;

  const cached = await readCache<NormalizedFixture[]>(cacheKey);
  if (cached) return cached;

  const params: Record<string, string | number> = { date };
  if (leagueId !== undefined) params.league = leagueId;

  const result = await apiFetch<ApiFootballFixturesResponse>("/fixtures", params);
  if (!result.ok) {
    console.error("[football] getTodayFixtures failed:", result.error);
    return [];
  }

  const normalized = result.data.response.map(normalize);
  await writeCache(cacheKey, normalized, TTL_FIXTURES_MINUTES);
  return normalized;
}

const TTL_LEAGUE_FIXTURES_MINUTES = 60;

/**
 * Returns the current round's upcoming fixtures for a league.
 * Falls back to the last 5 played fixtures when the season has no upcoming matches.
 * Cache TTL: 60 minutes.
 */
export async function getLeagueFixtures(
  leagueId: number,
  season: number
): Promise<NormalizedFixture[]> {
  const cacheKey = `leaguefixtures:${leagueId}:${season}`;
  const cached = await readCache<NormalizedFixture[]>(cacheKey);
  if (cached) return cached;

  // Try upcoming fixtures first
  const upcoming = await apiFetch<ApiFootballFixturesResponse>("/fixtures", {
    league: leagueId,
    season,
    next: 10,
  });

  if (upcoming.ok && upcoming.data.response.length > 0) {
    const normalized = upcoming.data.response.map(normalize);
    await writeCache(cacheKey, normalized, TTL_LEAGUE_FIXTURES_MINUTES);
    return normalized;
  }

  // Season complete — return most recent played matches
  const recent = await apiFetch<ApiFootballFixturesResponse>("/fixtures", {
    league: leagueId,
    season,
    last: 6,
  });

  if (!recent.ok) {
    console.error(`[football] getLeagueFixtures(${leagueId}) failed:`, recent.error);
    return [];
  }

  const normalized = [...recent.data.response].reverse().map(normalize);
  await writeCache(cacheKey, normalized, TTL_LEAGUE_FIXTURES_MINUTES);
  return normalized;
}
