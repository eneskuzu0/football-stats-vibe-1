// ─── Raw API-Football v3 response shapes ────────────────────────────────────
// Only the fields the app consumes are typed; the rest are omitted.

export interface ApiFootballTeamStatsData {
  league: { id: number; name: string; season: number };
  team: { id: number; name: string; logo: string };
  fixtures: {
    played: { total: number };
    wins: { total: number };
    draws: { total: number };
    loses: { total: number };
  };
  goals: {
    for: { total: { total: number } };
    against: { total: { total: number } };
  };
  clean_sheet: { total: number };
}

export interface ApiFootballTeamStatsResponse {
  // API returns [] when no data found for the season, or the stats object otherwise
  response: ApiFootballTeamStatsData | unknown[];
}

export interface ApiFootballPlayersResponse {
  response: Array<{
    player: { id: number; name: string; photo: string };
    statistics: Array<{
      games: { appearences: number | null };
      goals: { total: number | null; assists: number | null };
    }>;
  }>;
  paging: { current: number; total: number };
}

export type FixtureStatusShort =
  | "TBD" | "NS"                         // not started / TBD
  | "1H" | "HT" | "2H" | "ET" | "BT"   // in play
  | "P"                                   // penalty shootout
  | "SUSP" | "INT"                        // interrupted
  | "FT" | "AET" | "PEN"                 // finished
  | "PST" | "CANC" | "ABD"              // postponed / cancelled
  | "AWD" | "WO"                         // awarded / walkover
  | "LIVE";                               // live (generic)

export interface ApiFootballFixtureItem {
  fixture: {
    id: number;
    date: string; // ISO-8601 UTC
    status: {
      short: FixtureStatusShort;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface ApiFootballFixturesResponse {
  get: string;
  results: number;
  response: ApiFootballFixtureItem[];
}

export interface ApiFootballStandingEntry {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface ApiFootballStandingsResponse {
  get: string;
  results: number;
  response: Array<{
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      season: number;
      standings: ApiFootballStandingEntry[][];
    };
  }>;
}

// ─── UI-facing normalized types ──────────────────────────────────────────────
// Decoupled from raw API shapes — page.tsx only knows about these.

export interface NormalizedFixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  statusShort: FixtureStatusShort;
  /** Human-readable: "FT", "76′", "HT", "19:45", etc. */
  statusDisplay: string;
  leagueName: string;
  leagueId: number;
  kickoffUtc: string;
}

export interface NormalizedStandingRow {
  position: number;
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalDiff: number;
  form: string;
}

export interface NormalizedTeamStats {
  teamId: number;
  teamName: string;
  leagueName: string;
  season: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
}

export interface NormalizedPlayer {
  id: number;
  name: string;
  photo: string;
  goals: number;
  assists: number;
  appearances: number;
}

export interface NormalizedRecentFixture {
  fixtureId: number;
  opponent: string;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
  date: string;
}

// ─── Match detail ─────────────────────────────────────────────────────────────

export interface ApiFootballFixtureDetailItem {
  fixture: {
    id: number;
    date: string;
    status: { short: FixtureStatusShort; elapsed: number | null };
  };
  league: { id: number; name: string; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
  events: Array<{
    time: { elapsed: number; extra: number | null };
    team: { id: number; name: string };
    player: { id: number; name: string };
    type: "Goal" | "Card" | "subst" | "Var";
    detail: string;
  }> | null;
}

export interface ApiFootballFixtureDetailResponse {
  response: ApiFootballFixtureDetailItem[];
}

export interface ApiFootballMatchStatsResponse {
  response: Array<{
    team: { id: number; name: string };
    statistics: Array<{ type: string; value: string | number | null }>;
  }>;
}

export interface NormalizedMatchEvent {
  minute: number;
  extra: number | null;
  teamId: number;
  teamName: string;
  playerName: string;
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string;
}

export interface NormalizedMatchDetail {
  fixtureId: number;
  date: string;
  status: FixtureStatusShort;
  statusDisplay: string;
  leagueName: string;
  leagueId: number;
  round: string;
  homeTeam: { id: number; name: string; goals: number | null; winner: boolean | null };
  awayTeam: { id: number; name: string; goals: number | null; winner: boolean | null };
  halfTime: { home: number | null; away: number | null };
  events: NormalizedMatchEvent[];
}

export interface NormalizedMatchStats {
  home: { id: number; name: string; stats: Record<string, string | number | null> };
  away: { id: number; name: string; stats: Record<string, string | number | null> };
}
