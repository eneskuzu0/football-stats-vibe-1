import type { NormalizedRecentFixture } from "@/lib/football/types";

const RESULT_STYLES: Record<"W" | "D" | "L", string> = {
  W: "bg-green-a2 text-green-4",
  D: "bg-amber-a2 text-amber-4",
  L: "bg-red-a2 text-red-4",
};

export function RecentForm({ fixtures }: { fixtures: NormalizedRecentFixture[] }) {
  if (fixtures.length === 0) {
    return (
      <p className="text-fg-2 text-xs py-2 text-center">
        No recent fixtures available.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {fixtures.map((f) => (
        <div
          key={f.fixtureId}
          className={`group relative flex flex-col items-center gap-0.5 rounded-4 px-3 py-2 min-w-[3.5rem] ${RESULT_STYLES[f.result]}`}
        >
          <span className="text-xs font-bold">{f.result}</span>
          <span className="text-[10px] opacity-70 tabular-nums">
            {f.goalsFor}–{f.goalsAgainst}
          </span>
          {/* Hover tooltip */}
          <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-3 bg-bg-3 px-2 py-1 text-[10px] text-fg-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-gray-a1">
            {f.isHome ? "vs" : "@"} {f.opponent}
          </div>
        </div>
      ))}
    </div>
  );
}
