import "server-only";
import { apiFetch } from "./client";
import { readCache, writeCache, TTL_STANDINGS_MINUTES } from "../cache";
import type {
  ApiFootballStandingsResponse,
  ApiFootballStandingEntry,
  NormalizedStandingRow,
} from "./types";

function normalize(entry: ApiFootballStandingEntry): NormalizedStandingRow {
  return {
    position: entry.rank,
    teamId: entry.team.id,
    teamName: entry.team.name,
    played: entry.all.played,
    won: entry.all.win,
    drawn: entry.all.draw,
    lost: entry.all.lose,
    points: entry.points,
    goalDiff: entry.goalsDiff,
    form: entry.form,
  };
}

/**
 * Returns normalized standings for a league/season pair.
 * Cache TTL: 6 hours.
 *
 * season — the year the season started (e.g. 2025 for the 2025-26 season).
 */
export async function getLeagueStandings(
  leagueId: number,
  season: number
): Promise<NormalizedStandingRow[]> {
  const cacheKey = `standings:v2:${leagueId}:${season}`;

  const cached = await readCache<NormalizedStandingRow[]>(cacheKey);
  if (cached) return cached;

  const result = await apiFetch<ApiFootballStandingsResponse>("/standings", {
    league: leagueId,
    season,
  });

  if (!result.ok) {
    console.error(
      `[football] getLeagueStandings(${leagueId}, ${season}) failed:`,
      result.error
    );
    return [];
  }

  const group = result.data.response[0]?.league.standings[0];

  // API-Football sometimes lags one year on new-season data.
  // Retry with previous season and cache the result under the *original* key
  // so subsequent loads never hit the API for this empty season again.
  if (!group && season > 2020) {
    const fallback = await getLeagueStandings(leagueId, season - 1);
    if (fallback.length > 0) {
      await writeCache(cacheKey, fallback, TTL_STANDINGS_MINUTES);
    }
    return fallback;
  }

  if (!group) return [];

  const normalized = group.map(normalize);
  await writeCache(cacheKey, normalized, TTL_STANDINGS_MINUTES);
  return normalized;
}
