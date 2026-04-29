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

function buildStatusDisplay(
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
