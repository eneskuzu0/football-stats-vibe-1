"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { StandingsTable } from "./StandingsTable";
import { Badge } from "./Badge";
import type { NormalizedStandingRow, NormalizedFixture, FixtureStatusShort } from "@/lib/football/types";
import type { League } from "@/lib/football/leagues";
import { BarChart2 } from "lucide-react";

interface LeagueTabsProps {
  leagues: readonly League[];
  allStandings: NormalizedStandingRow[][];
  allFixtures: NormalizedFixture[][];
  season: number;
}

function statusVariant(s: FixtureStatusShort): "green" | "amber" | "gray" | "sky" {
  if (["1H", "2H", "ET", "P", "LIVE"].includes(s)) return "green";
  if (["HT", "BT"].includes(s)) return "amber";
  if (s === "NS" || s === "TBD") return "sky";
  return "gray";
}

function scoreDisplay(f: NormalizedFixture): string {
  if (f.homeGoals !== null && f.awayGoals !== null) {
    return `${f.homeGoals}–${f.awayGoals}`;
  }
  return "vs";
}

export function LeagueTabs({ leagues, allStandings, allFixtures, season }: LeagueTabsProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {leagues.map((league, i) => (
          <button
            key={league.id}
            onClick={() => setActiveIdx(i)}
            className="relative flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors duration-150"
            style={{ color: activeIdx === i ? "var(--color-fg-4)" : "var(--color-fg-2)" }}
          >
            {activeIdx === i && (
              <motion.span
                layoutId="tab-bg"
                className="absolute inset-0 rounded-full bg-bg-2 shadow-1"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{league.name}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Standings */}
          <StandingsTable
            icon={<BarChart2 size={13} className="text-fg-2" />}
            label={leagues[activeIdx].name}
            badge={<Badge variant={leagues[activeIdx].variant}>{leagues[activeIdx].badge}</Badge>}
            rows={allStandings[activeIdx] ?? []}
            leagueId={leagues[activeIdx].id}
            season={season}
          />

          {/* Fixtures */}
          <div className="bg-bg-1 rounded-6 shadow-2 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-fg-2 text-xs font-medium">Fixtures</span>
              <div className="ml-auto">
                <Badge variant={leagues[activeIdx].variant}>{leagues[activeIdx].badge}</Badge>
              </div>
            </div>

            {allFixtures[activeIdx]?.length ? (
              <div className="flex flex-col divide-y divide-gray-a2">
                {allFixtures[activeIdx].map((f) => (
                  <Link
                    key={f.id}
                    href={`/match/${f.id}`}
                    className="flex items-center justify-between py-2.5 first:pt-1 hover:bg-bg-2 -mx-2 px-2 rounded-3 transition-colors duration-100"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 text-xs">
                      <span className="text-fg-4 font-medium truncate max-w-[90px]">{f.homeTeam}</span>
                      <span className="text-fg-1 shrink-0">{scoreDisplay(f)}</span>
                      <span className="text-fg-4 font-medium truncate max-w-[90px]">{f.awayTeam}</span>
                    </div>
                    <Badge variant={statusVariant(f.statusShort)}>
                      {f.statusDisplay}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-fg-2 text-xs py-4 text-center">No fixtures available.</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
