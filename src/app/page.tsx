import {
  TrendingUp,
  Zap,
  Globe,
  BarChart2,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { LeagueTabs } from "@/components/LeagueTabs";
import { getLeagueStandings } from "@/lib/football/standings";
import { getLeagueFixtures } from "@/lib/football/fixtures";
import { LEAGUES } from "@/lib/football/leagues";

function currentSeason(): number {
  const now = new Date();
  return now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
}

export default async function Home() {
  const season = currentSeason();

  const [allStandings, allFixtures] = await Promise.all([
    Promise.all(LEAGUES.map((l) => getLeagueStandings(l.id, season))),
    Promise.all(LEAGUES.map((l) => getLeagueFixtures(l.id, season))),
  ]);

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
            with data-driven insights across the top 6 European leagues.
          </p>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-fg-2">
            {(
              [
                { icon: Globe,     label: "6 Top Leagues"   },
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

      {/* ── League Tabs (Standings + Fixtures) ───────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <LeagueTabs
          leagues={LEAGUES}
          allStandings={allStandings}
          allFixtures={allFixtures}
          season={season}
        />
      </section>

    </div>
  );
}
