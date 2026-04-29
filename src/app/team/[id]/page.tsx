import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { RecentForm } from "@/components/RecentForm";
import {
  getTeamStatistics,
  getTeamTopPlayers,
  getTeamRecentFixtures,
} from "@/lib/football/team";
import type { NormalizedPlayer } from "@/lib/football/types";

function currentSeason(): number {
  const now = new Date();
  return now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
}

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ league?: string; season?: string }>;
}) {
  const { id } = await params;
  const { league, season: seasonParam } = await searchParams;

  const teamId = Number(id);
  const leagueId = Number(league ?? 0);
  const season = Number(seasonParam ?? currentSeason());

  if (!teamId || !leagueId) notFound();

  const [stats, players, recentFixtures] = await Promise.all([
    getTeamStatistics(teamId, leagueId, season),
    getTeamTopPlayers(teamId, leagueId, season),
    getTeamRecentFixtures(teamId),
  ]);

  if (!stats) notFound();

  const seasonLabel = `${stats.season}/${String(stats.season + 1).slice(2)}`;
  const winPct =
    stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-a2 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-fg-2 hover:text-fg-4 transition-colors duration-150"
          >
            <ArrowLeft size={13} />
            <span className="text-sm">{stats.leagueName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-purple-4" />
            <span className="text-fg-4 text-sm font-semibold tracking-tight">
              Antigravity
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-green-4 animate-pulse" />
            <span className="text-xs text-fg-2 font-medium">Live</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-12 flex flex-col gap-8">

        {/* ── Team Header ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-fg-2 text-xs mb-1">{stats.leagueName}</p>
            <h1 className="text-4xl font-extrabold tracking-tighter text-fg-4 leading-none">
              {stats.teamName}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-xs text-fg-2">
              <span>{stats.wins}W</span>
              <span className="text-gray-a2">·</span>
              <span>{stats.draws}D</span>
              <span className="text-gray-a2">·</span>
              <span>{stats.losses}L</span>
              <span className="text-gray-a2">·</span>
              <span>{winPct}% win rate</span>
            </div>
          </div>
          <Badge variant="sky">{seasonLabel}</Badge>
        </div>

        {/* ── Key Metrics ──────────────────────────────────────── */}
        <section>
          <h2 className="text-[10px] font-semibold text-fg-1 uppercase tracking-widest mb-3">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                { label: "Played",          value: stats.played       },
                { label: "Goals Scored",    value: stats.goalsFor     },
                { label: "Goals Conceded",  value: stats.goalsAgainst },
                { label: "Clean Sheets",    value: stats.cleanSheets  },
              ] as const
            ).map(({ label, value }) => (
              <div
                key={label}
                className="bg-bg-1 rounded-6 shadow-2 p-5 flex flex-col gap-1.5"
              >
                <span className="text-fg-2 text-xs">{label}</span>
                <span className="text-fg-4 text-3xl font-extrabold tabular-nums leading-none">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Top Performers ───────────────────────────────────── */}
        <section>
          <h2 className="text-[10px] font-semibold text-fg-1 uppercase tracking-widest mb-3">
            Top Performers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlayerList
              title="Top Scorers"
              players={players.scorers}
              statKey="goals"
              statLabel="goals"
            />
            <PlayerList
              title="Top Assisters"
              players={players.assisters}
              statKey="assists"
              statLabel="assists"
            />
          </div>
        </section>

        {/* ── Recent Form ──────────────────────────────────────── */}
        <section>
          <h2 className="text-[10px] font-semibold text-fg-1 uppercase tracking-widest mb-3">
            Last 5 Matches
          </h2>
          <div className="bg-bg-1 rounded-6 shadow-2 p-5">
            <RecentForm fixtures={recentFixtures} />
          </div>
        </section>

      </main>
    </div>
  );
}

// ─── Player list sub-component ───────────────────────────────────────────────

function PlayerList({
  title,
  players,
  statKey,
  statLabel,
}: {
  title: string;
  players: NormalizedPlayer[];
  statKey: "goals" | "assists";
  statLabel: string;
}) {
  return (
    <div className="bg-bg-1 rounded-6 shadow-2 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-a2">
        <span className="text-fg-2 text-xs font-medium">{title}</span>
      </div>
      {players.length > 0 ? (
        <div className="divide-y divide-gray-a1">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-fg-1 text-xs tabular-nums w-4 shrink-0">
                {i + 1}
              </span>
              <span className="text-fg-4 text-sm font-medium flex-1 truncate">
                {p.name}
              </span>
              <span className="text-fg-2 text-xs shrink-0">
                {p.appearances} apps
              </span>
              <span className="text-fg-4 text-sm font-bold tabular-nums shrink-0">
                {p[statKey]}
                <span className="text-fg-2 text-xs font-normal ml-1">
                  {statLabel}
                </span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-fg-2 text-xs py-6 text-center">No data available.</p>
      )}
    </div>
  );
}
