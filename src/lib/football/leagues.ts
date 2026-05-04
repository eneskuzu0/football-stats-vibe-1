// Single source of truth for all supported leagues.
// leagueId values are API-Football v3 IDs.
// variant maps to Badge component color variants.

export const LEAGUES = [
  { id: 39,  name: "Premier League", country: "England", badge: "PL", variant: "sky"    },
  { id: 140, name: "La Liga",        country: "Spain",   badge: "LL", variant: "red"    },
  { id: 135, name: "Serie A",        country: "Italy",   badge: "SA", variant: "blue"   },
  { id: 78,  name: "Bundesliga",     country: "Germany", badge: "BL", variant: "amber"  },
  { id: 61,  name: "Ligue 1",        country: "France",  badge: "L1", variant: "purple" },
] as const;

export type League = (typeof LEAGUES)[number];
export type LeagueVariant = League["variant"];

export const LEAGUE_IDS = LEAGUES.map((l) => l.id) as number[];

export function leagueById(id: number): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}
