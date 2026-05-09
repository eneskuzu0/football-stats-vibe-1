import "server-only";
import { apiFetch } from "./client";
import { createCacheClient } from "../supabase/server";
import type { ApiFootballStandingsResponse, ApiFootballFixturesResponse } from "./types";

// ─── Detailed player type — superset of the live-dashboard version ────────────

interface ApiFootballPlayersArchiveResponse {
  response: Array<{
    player: { id: number; name: string; photo: string };
    statistics: Array<{
      games: { appearences: number | null; minutes: number | null; rating: string | null };
      goals: { total: number | null; assists: number | null };
      passes: { total: number | null; key: number | null; accuracy: string | null };
      shots: { total: number | null; on: number | null };
      cards: { yellow: number | null; red: number | null };
      dribbles: { attempts: number | null; success: number | null };
    }>;
  }>;
  paging: { current: number; total: number };
}

// ─── Result type returned by every import function ────────────────────────────

export interface ImportResult {
  ok: boolean;
  inserted: number;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function importStandings(leagueId: number, season: number): Promise<ImportResult> {
  const result = await apiFetch<ApiFootballStandingsResponse>("/standings", {
    league: leagueId,
    season,
  });

  if (!result.ok) return { ok: false, inserted: 0, error: result.error.message };

  const league = result.data.response[0]?.league;
  if (!league) return { ok: false, inserted: 0, error: "No standings data returned" };

  const entries = league.standings[0] ?? [];
  const supabase = createCacheClient();
  if (!supabase) return { ok: false, inserted: 0, error: "Supabase not configured" };

  const records = entries.map((e) => ({
    league_id: leagueId,
    season,
    team_id: e.team.id,
    team_name: e.team.name,
    position: e.rank,
    played: e.all.played,
    won: e.all.win,
    drawn: e.all.draw,
    lost: e.all.lose,
    goals_for: e.all.goals.for,
    goals_against: e.all.goals.against,
    goal_diff: e.goalsDiff,
    points: e.points,
    form: e.form ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("standings")
    .upsert(records, { onConflict: "league_id,season,team_id" });

  if (error) return { ok: false, inserted: 0, error: error.message };
  return { ok: true, inserted: records.length };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
// One API call returns all fixtures for a league/season (e.g., all 380 PL matches).
// We batch the upserts at 100 rows to stay within Supabase payload limits.

const BATCH = 100;

export async function importFixtures(leagueId: number, season: number): Promise<ImportResult> {
  const result = await apiFetch<ApiFootballFixturesResponse>("/fixtures", {
    league: leagueId,
    season,
  });

  if (!result.ok) return { ok: false, inserted: 0, error: result.error.message };

  const items = result.data.response;
  if (items.length === 0) return { ok: false, inserted: 0, error: "No fixtures returned" };

  const supabase = createCacheClient();
  if (!supabase) return { ok: false, inserted: 0, error: "Supabase not configured" };

  const records = items.map((item) => ({
    id: item.fixture.id,
    league_id: leagueId,
    season,
    round: item.league.round,
    home_team_id: item.teams.home.id,
    home_team: item.teams.home.name,
    away_team_id: item.teams.away.id,
    away_team: item.teams.away.name,
    home_goals: item.goals.home,
    away_goals: item.goals.away,
    status_short: item.fixture.status.short,
    kickoff_utc: item.fixture.date,
    updated_at: new Date().toISOString(),
  }));

  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const { error } = await supabase
      .from("fixtures")
      .upsert(records.slice(i, i + BATCH), { onConflict: "id" });
    if (error) return { ok: false, inserted, error: error.message };
    inserted += Math.min(BATCH, records.length - i);
  }

  return { ok: true, inserted };
}

// ─── Players ──────────────────────────────────────────────────────────────────
// API sorts by appearances, not goals. Fetching 2 pages (≈ 40 players) captures
// all key contributors for ML analysis within the free-tier budget.

export async function importPlayers(
  leagueId: number,
  season: number,
  betweenPageDelayMs = 700
): Promise<ImportResult> {
  const supabase = createCacheClient();
  if (!supabase) return { ok: false, inserted: 0, error: "Supabase not configured" };

  const all: ApiFootballPlayersArchiveResponse["response"] = [];

  const page1 = await apiFetch<ApiFootballPlayersArchiveResponse>("/players", {
    league: leagueId,
    season,
    page: 1,
  });
  if (!page1.ok) return { ok: false, inserted: 0, error: page1.error.message };
  all.push(...page1.data.response);

  if (page1.data.paging.total > 1) {
    await delay(betweenPageDelayMs);
    const page2 = await apiFetch<ApiFootballPlayersArchiveResponse>("/players", {
      league: leagueId,
      season,
      page: 2,
    });
    if (page2.ok) all.push(...page2.data.response);
  }

  const now = new Date().toISOString();
  const records = all.map((p) => {
    const s = p.statistics[0];
    return {
      player_id: p.player.id,
      league_id: leagueId,
      season,
      name: p.player.name,
      photo: p.player.photo,
      appearances: s?.games.appearences ?? 0,
      minutes_played: s?.games.minutes ?? 0,
      goals: s?.goals.total ?? 0,
      assists: s?.goals.assists ?? 0,
      rating: parseNum(s?.games.rating),
      passes_accuracy: parseNum(s?.passes.accuracy),
      key_passes: s?.passes.key ?? 0,
      shots_on_target: s?.shots.on ?? 0,
      yellow_cards: s?.cards.yellow ?? 0,
      red_cards: s?.cards.red ?? 0,
      dribbles_success: s?.dribbles.success ?? 0,
      updated_at: now,
    };
  });

  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const { error } = await supabase
      .from("player_stats")
      .upsert(records.slice(i, i + BATCH), { onConflict: "player_id,league_id,season" });
    if (error) return { ok: false, inserted, error: error.message };
    inserted += Math.min(BATCH, records.length - i);
  }

  return { ok: true, inserted };
}
