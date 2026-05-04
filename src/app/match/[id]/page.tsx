import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Trophy } from "lucide-react";
import { Badge } from "@/components/Badge";
import { getMatchDetail, getMatchStatistics } from "@/lib/football/match";
import { leagueById } from "@/lib/football/leagues";
import type { FixtureStatusShort, NormalizedMatchEvent } from "@/lib/football/types";

function statusVariant(s: FixtureStatusShort): "green" | "amber" | "gray" | "sky" {
  if (["1H", "2H", "ET", "P", "LIVE"].includes(s)) return "green";
  if (["HT", "BT"].includes(s)) return "amber";
  if (s === "NS" || s === "TBD") return "sky";
  return "gray";
}

function eventIcon(type: NormalizedMatchEvent["type"], detail: string): string {
  if (type === "Goal") return detail.includes("Penalty") ? "⚽ P" : detail.includes("Own") ? "⚽ OG" : "⚽";
  if (type === "Card") return detail.includes("Yellow") ? "🟨" : "🟥";
  if (type === "subst") return "↔";
  return "•";
}

function StatBar({ label, home, away }: { label: string; home: string | number | null; away: string | number | null }) {
  const parse = (v: string | number | null): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return v;
    return parseFloat(v.replace("%", "")) || 0;
  };

  const hv = parse(home);
  const av = parse(away);
  const total = hv + av;
  const hPct = total > 0 ? (hv / total) * 100 : 50;

  const fmt = (v: string | number | null) => (v === null || v === undefined ? "0" : String(v));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-fg-2">
        <span className="font-medium text-fg-4">{fmt(home)}</span>
        <span>{label}</span>
        <span className="font-medium text-fg-4">{fmt(away)}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-bg-2">
        <div className="bg-sky-4 transition-all" style={{ width: `${hPct}%` }} />
        <div className="bg-red-4 flex-1" />
      </div>
    </div>
  );
}

const STAT_LABELS = [
  "Ball Possession",
  "Total Shots",
  "Shots on Goal",
  "Shots off Goal",
  "Blocked Shots",
  "Corner Kicks",
  "Fouls",
  "Yellow Cards",
  "Red Cards",
  "Offsides",
  "Passes Total",
  "Passes Accurate",
  "Goalkeeper Saves",
];

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixtureId = parseInt(id, 10);
  if (isNaN(fixtureId)) notFound();

  const [detail, stats] = await Promise.all([
    getMatchDetail(fixtureId),
    getMatchStatistics(fixtureId),
  ]);

  if (!detail) notFound();

  const league = leagueById(detail.leagueId);
  const homeEvents = detail.events.filter((e) => e.teamId === detail.homeTeam.id);
  const awayEvents = detail.events.filter((e) => e.teamId === detail.awayTeam.id);

  const matchDate = new Date(detail.date).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-gray-a2 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 h-14">
          <Link href="/" className="flex items-center gap-1.5 text-fg-2 hover:text-fg-4 transition-colors">
            <ArrowLeft size={14} />
            <span className="text-sm">Back</span>
          </Link>
          <span className="text-fg-1 text-sm">·</span>
          <span className="text-fg-2 text-sm truncate">{detail.leagueName}</span>
          {league && (
            <div className="ml-auto">
              <Badge variant={league.variant}>{league.badge}</Badge>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-8 flex flex-col gap-6">

        {/* Score card */}
        <div className="bg-bg-1 rounded-6 shadow-2 p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-fg-2 text-xs">{detail.round}</span>
            <span className="text-fg-1 text-xs">·</span>
            <span className="text-fg-2 text-xs">{matchDate}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <span className="text-fg-4 font-semibold text-base text-center leading-tight">{detail.homeTeam.name}</span>
              {detail.halfTime.home !== null && (
                <div className="flex flex-col gap-0.5 items-center">
                  {homeEvents.filter(e => e.type === "Goal").map((e, i) => (
                    <span key={i} className="text-fg-2 text-xs">{e.playerName} {e.minute}′{e.extra ? `+${e.extra}` : ""}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="text-4xl font-extrabold tabular-nums text-fg-4 tracking-tight">
                {detail.homeTeam.goals !== null && detail.awayTeam.goals !== null
                  ? `${detail.homeTeam.goals} – ${detail.awayTeam.goals}`
                  : "vs"}
              </div>
              <Badge variant={statusVariant(detail.status)}>{detail.statusDisplay}</Badge>
              {detail.halfTime.home !== null && (
                <span className="text-fg-1 text-xs">HT: {detail.halfTime.home}–{detail.halfTime.away}</span>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <span className="text-fg-4 font-semibold text-base text-center leading-tight">{detail.awayTeam.name}</span>
              {detail.halfTime.away !== null && (
                <div className="flex flex-col gap-0.5 items-center">
                  {awayEvents.filter(e => e.type === "Goal").map((e, i) => (
                    <span key={i} className="text-fg-2 text-xs">{e.playerName} {e.minute}′{e.extra ? `+${e.extra}` : ""}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events timeline */}
        {detail.events.length > 0 && (
          <div className="bg-bg-1 rounded-6 shadow-2 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-fg-2" />
              <span className="text-fg-2 text-xs font-medium">Match Events</span>
            </div>
            <div className="flex flex-col gap-1">
              {detail.events
                .filter((e) => e.type !== "subst")
                .map((e, i) => {
                  const isHome = e.teamId === detail.homeTeam.id;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 py-1 text-xs ${isHome ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <span className="text-fg-1 tabular-nums w-8 shrink-0 text-center">
                        {e.minute}′{e.extra ? `+${e.extra}` : ""}
                      </span>
                      <span className="shrink-0">{eventIcon(e.type, e.detail)}</span>
                      <span className="text-fg-3 truncate">{e.playerName}</span>
                      {e.detail && !e.detail.includes("Normal Goal") && (
                        <span className="text-fg-1 text-[10px] shrink-0">({e.detail})</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="bg-bg-1 rounded-6 shadow-2 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-1.5">
              <Trophy size={13} className="text-fg-2" />
              <span className="text-fg-2 text-xs font-medium">Match Statistics</span>
            </div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-sky-4">{stats.home.name}</span>
              <span className="text-red-4">{stats.away.name}</span>
            </div>
            <div className="flex flex-col gap-3">
              {STAT_LABELS.map((label) => (
                <StatBar
                  key={label}
                  label={label}
                  home={stats.home.stats[label] ?? null}
                  away={stats.away.stats[label] ?? null}
                />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
