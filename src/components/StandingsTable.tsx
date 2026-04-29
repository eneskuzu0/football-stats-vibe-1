"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { NormalizedStandingRow } from "@/lib/football/types";

export function StandingsTable({
  icon,
  label,
  badge,
  rows,
  leagueId,
  season,
}: {
  icon: ReactNode;
  label: string;
  badge: ReactNode;
  rows: NormalizedStandingRow[];
  leagueId: number;
  season: number;
}) {
  const router = useRouter();

  return (
    <div className="bg-bg-1 rounded-6 shadow-2 overflow-hidden">
      <div className="flex items-center gap-1.5 px-5 py-4 border-b border-gray-a2">
        {icon}
        <span className="text-fg-2 text-xs font-medium">{label}</span>
        <div className="ml-auto">{badge}</div>
      </div>

      {rows.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-a2">
              {["#", "Club", "P", "W", "Pts"].map((h, i) => (
                <th
                  key={h}
                  className={`text-fg-1 font-medium text-xs py-2.5 ${
                    i === 0
                      ? "pl-5 pr-2 text-left w-8"
                      : i === 1
                      ? "px-2 text-left"
                      : i === 4
                      ? "pl-2 pr-5 text-right w-12"
                      : "px-2 text-right w-8"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((row, i) => {
              const href = row.teamId
                ? `/team/${row.teamId}?league=${leagueId}&season=${season}`
                : undefined;
              return (
                <tr
                  key={row.teamName}
                  onClick={() => href && router.push(href)}
                  className={`border-b border-gray-a1 last:border-0 transition-colors ${
                    href ? "cursor-pointer" : ""
                  } ${i === 0 ? "bg-purple-a1 hover:bg-purple-a2" : "hover:bg-bg-2"}`}
                >
                  <td className="text-fg-2 text-xs pl-5 pr-2 py-3 tabular-nums">
                    {row.position}
                  </td>
                  <td className="text-fg-4 text-xs font-medium px-2 py-3 truncate max-w-[9rem]">
                    {row.teamName}
                  </td>
                  <td className="text-fg-2 text-xs px-2 py-3 text-right tabular-nums">
                    {row.played}
                  </td>
                  <td className="text-fg-2 text-xs px-2 py-3 text-right tabular-nums">
                    {row.won}
                  </td>
                  <td className="text-fg-4 text-xs font-semibold pl-2 pr-5 py-3 text-right tabular-nums">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-fg-2 text-xs py-6 text-center">
          Standings unavailable — configure API key to load data.
        </p>
      )}
    </div>
  );
}
