import Link from "next/link";
import { ArrowLeft, TrendingUp, Target, Shield, Activity } from "lucide-react";
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
  const winPct  = stats.played > 0 ? (stats.wins   / stats.played) * 100 : 0;
  const drawPct = stats.played > 0 ? (stats.draws  / stats.played) * 100 : 0;
  const lossPct = stats.played > 0 ? (stats.losses / stats.played) * 100 : 0;
  const gpg = stats.played > 0 ? (stats.goalsFor     / stats.played).toFixed(1) : "0";
  const cpg = stats.played > 0 ? (stats.goalsAgainst / stats.played).toFixed(1) : "0";
  const csPct = stats.played > 0 ? Math.round((stats.cleanSheets / stats.played) * 100) : 0;

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

      <main className="mx-auto w-full max-w-5xl px-6 py-10 flex flex-col gap-6">

        {/* ── Team Hero ────────────────────────────────────────── */}
        <div className="bg-bg-1 rounded-6 shadow-2 px-6 py-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-fg-2 text-[11px] font-medium tracking-wide mb-1">
                {stats.leagueName}
              </p>
              <h1 className="text-[2.5rem] font-extrabold tracking-tighter text-fg-4 leading-none">
                {stats.teamName}
              </h1>
            </div>
            <Badge variant="sky">{seasonLabel}</Badge>
          </div>

          {/* W / D / L summary row */}
          <div className="flex items-center gap-4 text-sm mb-4">
            <span className="text-green-4 font-semibold">{stats.wins}W</span>
            <span className="text-fg-1">·</span>
            <span className="text-amber-4 font-semibold">{stats.draws}D</span>
            <span className="text-fg-1">·</span>
            <span className="text-red-4 font-semibold">{stats.losses}L</span>
            <span className="text-fg-1">·</span>
            <span className="text-fg-2 text-xs">{Math.round(winPct)}% win rate</span>
          </div>

          {/* Visual W/D/L distribution bar */}
          <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-px">
            <div
              className="bg-green-4 rounded-l-full transition-all"
              style={{ width: `${winPct}%` }}
            />
            <div
              className="bg-amber-4 transition-all"
              style={{ width: `${drawPct}%` }}
            />
            <div
              className="bg-red-4 rounded-r-full transition-all"
              style={{ width: `${lossPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-fg-1">
            <span>Wins {Math.round(winPct)}%</span>
            <span>Draws {Math.round(drawPct)}%</span>
            <span>Losses {Math.round(lossPct)}%</span>
          </div>
        </div>

        {/* ── Key Metrics ──────────────────────────────────────── */}
        <section>
          <SectionLabel>Key Metrics</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <MetricCard
              icon={Activity}
              label="Matches Played"
              value={stats.played}
              sub={`${stats.wins}W · ${stats.draws}D · ${stats.losses}L`}
            />
            <MetricCard
              icon={Target}
              label="Goals Scored"
              value={stats.goalsFor}
              sub={`${gpg} per game`}
              accent="green"
            />
            <MetricCard
              icon={Target}
              label="Goals Conceded"
              value={stats.goalsAgainst}
              sub={`${cpg} per game`}
              accent="red"
            />
            <MetricCard
              icon={Shield}
              label="Clean Sheets"
              value={stats.cleanSheets}
              sub={`${csPct}% of matches`}
              accent="sky"
            />
          </div>
        </section>

        {/* ── Top Performers ───────────────────────────────────── */}
        <section>
          <SectionLabel>Top Performers</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlayerList
              title="Top Scorers"
              players={players.scorers}
              statKey="goals"
              statSuffix="G"
            />
            <PlayerList
              title="Top Assisters"
              players={players.assisters}
              statKey="assists"
              statSuffix="A"
            />
          </div>
        </section>

        {/* ── Recent Form ──────────────────────────────────────── */}
        <section>
          <SectionLabel>Last 5 Matches</SectionLabel>
          <div className="bg-bg-1 rounded-6 shadow-2 p-5">
            <RecentForm fixtures={recentFixtures} />
          </div>
        </section>

      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-semibold text-fg-1 uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  sub: string;
  accent?: "green" | "red" | "sky";
}) {
  const iconColor =
    accent === "green" ? "text-green-4"
    : accent === "red"  ? "text-red-4"
    : accent === "sky"  ? "text-sky-4"
    : "text-fg-2";

  return (
    <div className="bg-bg-1 rounded-6 shadow-2 p-5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Icon size={12} className={iconColor} />
        <span className="text-fg-2 text-[11px]">{label}</span>
      </div>
      <span className="text-fg-4 text-3xl font-extrabold tabular-nums leading-none">
        {value}
      </span>
      <span className="text-fg-1 text-[10px]">{sub}</span>
    </div>
  );
}

const RANK_STYLES = [
  "text-yellow-4 bg-yellow-a1",
  "text-fg-3 bg-gray-a1",
  "text-amber-4 bg-amber-a1",
] as const;

function PlayerList({
  title,
  players,
  statKey,
  statSuffix,
}: {
  title: string;
  players: NormalizedPlayer[];
  statKey: "goals" | "assists";
  statSuffix: string;
}) {
  return (
    <div className="bg-bg-1 rounded-6 shadow-2 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-a2">
        <span className="text-fg-2 text-xs font-medium">{title}</span>
      </div>

      {players.length > 0 ? (
        <div className="divide-y divide-gray-a1">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
              <span
                className={`text-[10px] font-bold tabular-nums w-5 h-5 flex items-center justify-center rounded-2 shrink-0 ${RANK_STYLES[i] ?? "text-fg-1 bg-gray-a1"}`}
              >
                {i + 1}
              </span>
              <span className="text-fg-4 text-sm font-medium flex-1 truncate">
                {p.name}
              </span>
              <span className="text-fg-2 text-[10px] shrink-0 tabular-nums">
                {p.appearances} apps
              </span>
              <div className="shrink-0 text-right min-w-[2.5rem]">
                <span className="text-fg-4 text-base font-extrabold tabular-nums">
                  {p[statKey]}
                </span>
                <span className="text-fg-2 text-[10px] font-normal ml-0.5">
                  {statSuffix}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-fg-2 text-xs py-6 text-center">
          No data for this season.
        </p>
      )}
    </div>
  );
}
