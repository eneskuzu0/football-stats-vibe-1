import {
  TrendingUp,
  Zap,
  Globe,
  BarChart2,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { StandingsTable } from "@/components/StandingsTable";
import { getTodayFixtures } from "@/lib/football/fixtures";
import { getLeagueStandings } from "@/lib/football/standings";
import { LEAGUES } from "@/lib/football/leagues";
import type { FixtureStatusShort, NormalizedFixture } from "@/lib/football/types";

// The season year is the calendar year in which the season kicked off.
// For European leagues that start Aug/Sep: if we're in Jan–Jul we're in the
// {year-1}/{year} season, so season = year - 1.
function currentSeason(): number {
  const now = new Date();
  return now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
}

function statusVariant(s: FixtureStatusShort): "green" | "amber" | "gray" | "sky" {
  if (["1H", "2H", "ET", "P", "LIVE"].includes(s)) return "green";
  if (["HT", "BT"].includes(s)) return "amber";
  if (s === "NS" || s === "TBD") return "sky";
  return "gray";
}

function scoreDisplay(f: NormalizedFixture): string {
  if (f.homeGoals !== null && f.awayGoals !== null) {
    return `${f.homeGoals} – ${f.awayGoals}`;
  }
  return "vs";
}

function formatKickoff(utc: string): string {
  return new Date(utc).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

const PREMIER_LEAGUE_ID = 39;

export default async function Home() {
  const season = currentSeason();

  // Fetch today's PL fixtures and all 5 leagues' standings concurrently.
  const [todayFixtures, allStandings] = await Promise.all([
    getTodayFixtures(PREMIER_LEAGUE_ID),
    Promise.all(LEAGUES.map((l) => getLeagueStandings(l.id, season))),
  ]);

  const liveAndFinished = todayFixtures.filter((f) =>
    ["1H", "HT", "2H", "ET", "BT", "P", "FT", "AET", "PEN", "LIVE"].includes(f.statusShort)
  );
  const upcoming = todayFixtures.filter((f) => f.statusShort === "NS");

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-a2 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-purple-4" />
            <span className="text-fg-4 text-sm font-semibold tracking-tight">
              Antigravity
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {["Dashboard", "Matches", "Standings", "Predictions"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-fg-2 hover:text-fg-4 text-sm transition-colors duration-150"
              >
                {link}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-green-4 animate-pulse" />
            <span className="text-xs text-fg-2 font-medium">Live</span>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-24 pb-20 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: [
              "radial-gradient(ellipse 85% 55% at 50% -5%, rgba(145,141,246,0.20) 0%, transparent 68%)",
              "radial-gradient(ellipse 60% 45% at 18% -15%, rgba(44,120,252,0.13) 0%, transparent 60%)",
              "radial-gradient(ellipse 60% 45% at 82% -15%, rgba(0,196,255,0.11) 0%, transparent 60%)",
            ].join(","),
          }}
        />
        <div className="mx-auto max-w-xl">
          <Badge variant="purple">
            <Zap size={10} />
            Powered by real-time data
          </Badge>
          <h1 className="mt-6 text-[3.25rem] font-extrabold tracking-tighter text-fg-4 leading-none">
            Football
            <br />
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #918df6 0%, #2c78fc 55%, #00c4ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Intelligence
            </span>
          </h1>
          <p className="mt-5 text-[0.9375rem] text-fg-2 leading-relaxed max-w-sm mx-auto">
            Track every match, every stat, and predict outcomes
            with data-driven insights across the top 5 European leagues.
          </p>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-fg-2">
            {(
              [
                { icon: Globe,     label: "5 Top Leagues"   },
                { icon: BarChart2, label: "2,400+ Matches"  },
                { icon: Zap,       label: "Real-time"       },
              ] as const
            ).map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon size={13} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Today's PL Fixtures ──────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6">
        <div className="bg-bg-1 rounded-6 shadow-2 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-fg-2" />
            <span className="text-fg-2 text-xs font-medium">
              Premier League · Today
            </span>
            <div className="ml-auto">
              <Badge variant="sky">{season}/{String(season + 1).slice(2)}</Badge>
            </div>
          </div>

          {liveAndFinished.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-a2">
              {liveAndFinished.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-3 first:pt-1"
                >
                  <div className="flex items-center gap-1.5 min-w-0 text-sm">
                    <span className="text-fg-4 font-medium truncate">{f.homeTeam}</span>
                    <span className="text-fg-1 text-xs">vs</span>
                    <span className="text-fg-4 font-medium truncate">{f.awayTeam}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-fg-4 text-sm font-semibold tabular-nums">
                      {scoreDisplay(f)}
                    </span>
                    <Badge variant={statusVariant(f.statusShort)}>
                      {f.statusDisplay}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : upcoming.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-a2">
              {upcoming.slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-3 first:pt-1"
                >
                  <div className="flex items-center gap-1.5 min-w-0 text-sm">
                    <span className="text-fg-4 font-medium truncate">{f.homeTeam}</span>
                    <span className="text-fg-1 text-xs">vs</span>
                    <span className="text-fg-4 font-medium truncate">{f.awayTeam}</span>
                  </div>
                  <Badge variant="sky">{formatKickoff(f.kickoffUtc)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-fg-2 text-xs py-4 text-center">
              No Premier League fixtures today.
            </p>
          )}
        </div>
      </section>

      {/* ── Top 5 Leagues Standings ──────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6 mt-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEAGUES.map((league, i) => (
            <StandingsTable
              key={league.id}
              icon={<BarChart2 size={13} className="text-fg-2" />}
              label={league.name}
              badge={<Badge variant={league.variant}>{league.badge}</Badge>}
              rows={allStandings[i] ?? []}
              leagueId={league.id}
              season={season}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
