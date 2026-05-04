import "server-only";
import { apiFetch } from "./client";
import { readCache, writeCache, TTL_FIXTURES_MINUTES } from "../cache";
import { buildStatusDisplay } from "./fixtures";
import type {
  ApiFootballFixtureDetailResponse,
  ApiFootballMatchStatsResponse,
  NormalizedMatchDetail,
  NormalizedMatchStats,
} from "./types";

const TTL_FINISHED_MINUTES = 60 * 24; // 24h for completed matches

export async function getMatchDetail(fixtureId: number): Promise<NormalizedMatchDetail | null> {
  const cacheKey = `matchdetail:${fixtureId}`;
  const cached = await readCache<NormalizedMatchDetail>(cacheKey);
  if (cached) return cached;

  const result = await apiFetch<ApiFootballFixtureDetailResponse>("/fixtures", {
    id: fixtureId,
  });

  if (!result.ok || result.data.response.length === 0) {
    console.error(`[football] getMatchDetail(${fixtureId}) failed:`, result.ok ? "empty" : result.error);
    return null;
  }

  const item = result.data.response[0];
  const { fixture, league, teams, goals, score, events } = item;
  const isFinished = ["FT", "AET", "PEN"].includes(fixture.status.short);

  const normalized: NormalizedMatchDetail = {
    fixtureId: fixture.id,
    date: fixture.date,
    status: fixture.status.short,
    statusDisplay: buildStatusDisplay(fixture.status.short, fixture.status.elapsed, fixture.date),
    leagueName: league.name,
    leagueId: league.id,
    round: league.round,
    homeTeam: { id: teams.home.id, name: teams.home.name, goals: goals.home, winner: teams.home.winner },
    awayTeam: { id: teams.away.id, name: teams.away.name, goals: goals.away, winner: teams.away.winner },
    halfTime: score.halftime,
    events: (events ?? []).map((e) => ({
      minute: e.time.elapsed,
      extra: e.time.extra,
      teamId: e.team.id,
      teamName: e.team.name,
      playerName: e.player.name,
      type: e.type,
      detail: e.detail,
    })),
  };

  await writeCache(cacheKey, normalized, isFinished ? TTL_FINISHED_MINUTES : TTL_FIXTURES_MINUTES);
  return normalized;
}

export async function getMatchStatistics(fixtureId: number): Promise<NormalizedMatchStats | null> {
  const cacheKey = `matchstats:${fixtureId}`;
  const cached = await readCache<NormalizedMatchStats>(cacheKey);
  if (cached) return cached;

  const result = await apiFetch<ApiFootballMatchStatsResponse>("/fixtures/statistics", {
    fixture: fixtureId,
  });

  if (!result.ok || result.data.response.length < 2) {
    return null;
  }

  const [homeRaw, awayRaw] = result.data.response;

  function toRecord(stats: Array<{ type: string; value: string | number | null }>) {
    return Object.fromEntries(stats.map((s) => [s.type, s.value]));
  }

  const normalized: NormalizedMatchStats = {
    home: { id: homeRaw.team.id, name: homeRaw.team.name, stats: toRecord(homeRaw.statistics) },
    away: { id: awayRaw.team.id, name: awayRaw.team.name, stats: toRecord(awayRaw.statistics) },
  };

  await writeCache(cacheKey, normalized, TTL_FINISHED_MINUTES);
  return normalized;
}
