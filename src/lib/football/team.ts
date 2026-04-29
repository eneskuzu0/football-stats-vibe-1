import "server-only";
import { apiFetch } from "./client";
import { readCache, writeCache, TTL_FIXTURES_MINUTES, TTL_STANDINGS_MINUTES } from "../cache";
import type {
  ApiFootballTeamStatsResponse,
  ApiFootballTeamStatsData,
  ApiFootballPlayersResponse,
  ApiFootballFixturesResponse,
  NormalizedTeamStats,
  NormalizedPlayer,
  NormalizedRecentFixture,
} from "./types";

export async function getTeamStatistics(
  teamId: number,
  leagueId: number,
  season: number
): Promise<NormalizedTeamStats | null> {
  const cacheKey = `teamstats:${teamId}:${leagueId}:${season}`;
  const cached = await readCache<NormalizedTeamStats>(cacheKey);
  if (cached) return cached;

  const apiResult = await apiFetch<ApiFootballTeamStatsResponse>("/teams/statistics", {
    team: teamId,
    league: leagueId,
    season,
  });

  // API-Football returns response:[] (empty array) when no data exists for the season
  const raw = apiResult.ok ? apiResult.data.response : null;
  const isEmpty = !raw || Array.isArray(raw) || (raw as ApiFootballTeamStatsData).fixtures.played.total === 0;

  if (!apiResult.ok) {
    console.error(`[football] getTeamStatistics(${teamId}, ${leagueId}, ${season}) failed:`, apiResult.error);
  }

  if (isEmpty) {
    if (season > 2020) return getTeamStatistics(teamId, leagueId, season - 1);
    return null;
  }

  const r = raw as ApiFootballTeamStatsData;

  const normalized: NormalizedTeamStats = {
    teamId: r.team.id,
    teamName: r.team.name,
    leagueName: r.league.name,
    season: r.league.season,
    played: r.fixtures.played.total,
    wins: r.fixtures.wins.total,
    draws: r.fixtures.draws.total,
    losses: r.fixtures.loses.total,
    goalsFor: r.goals.for.total.total,
    goalsAgainst: r.goals.against.total.total,
    cleanSheets: r.clean_sheet.total,
  };

  await writeCache(cacheKey, normalized, TTL_STANDINGS_MINUTES);
  return normalized;
}

export async function getTeamTopPlayers(
  teamId: number,
  leagueId: number,
  season: number
): Promise<{ scorers: NormalizedPlayer[]; assisters: NormalizedPlayer[] }> {
  const cacheKey = `teamplayers:${teamId}:${leagueId}:${season}`;
  const cached = await readCache<{ scorers: NormalizedPlayer[]; assisters: NormalizedPlayer[] }>(cacheKey);
  if (cached) return cached;

  const apiResult = await apiFetch<ApiFootballPlayersResponse>("/players", {
    team: teamId,
    league: leagueId,
    season,
    page: 1,
  });

  if (!apiResult.ok || apiResult.data.response.length === 0) {
    if (!apiResult.ok) {
      console.error(`[football] getTeamTopPlayers(${teamId}) failed:`, apiResult.error);
    }
    if (season > 2020) return getTeamTopPlayers(teamId, leagueId, season - 1);
    return { scorers: [], assisters: [] };
  }

  const players: NormalizedPlayer[] = apiResult.data.response.map((p) => ({
    id: p.player.id,
    name: p.player.name,
    photo: p.player.photo,
    goals: p.statistics[0]?.goals.total ?? 0,
    assists: p.statistics[0]?.goals.assists ?? 0,
    appearances: p.statistics[0]?.games.appearences ?? 0,
  }));

  const scorers = [...players]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 3);

  const assisters = [...players]
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 3);

  const normalized = { scorers, assisters };
  await writeCache(cacheKey, normalized, TTL_STANDINGS_MINUTES);
  return normalized;
}

export async function getTeamRecentFixtures(
  teamId: number
): Promise<NormalizedRecentFixture[]> {
  const cacheKey = `teamfixtures:${teamId}:last5`;
  const cached = await readCache<NormalizedRecentFixture[]>(cacheKey);
  if (cached) return cached;

  const apiResult = await apiFetch<ApiFootballFixturesResponse>("/fixtures", {
    team: teamId,
    last: 5,
  });

  if (!apiResult.ok) {
    console.error(`[football] getTeamRecentFixtures(${teamId}) failed:`, apiResult.error);
    return [];
  }

  const normalized: NormalizedRecentFixture[] = apiResult.data.response.map((item) => {
    const isHome = item.teams.home.id === teamId;
    const goalsFor = (isHome ? item.goals.home : item.goals.away) ?? 0;
    const goalsAgainst = (isHome ? item.goals.away : item.goals.home) ?? 0;
    const opponent = isHome ? item.teams.away.name : item.teams.home.name;

    let matchResult: "W" | "D" | "L";
    if (goalsFor > goalsAgainst) matchResult = "W";
    else if (goalsFor < goalsAgainst) matchResult = "L";
    else matchResult = "D";

    return {
      fixtureId: item.fixture.id,
      opponent,
      isHome,
      goalsFor,
      goalsAgainst,
      result: matchResult,
      date: item.fixture.date,
    };
  });

  // API returns most recent first — reverse so form reads oldest → newest
  const chronological = [...normalized].reverse();
  await writeCache(cacheKey, chronological, TTL_FIXTURES_MINUTES);
  return chronological;
}
