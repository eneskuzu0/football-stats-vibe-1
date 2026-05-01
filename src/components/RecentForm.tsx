import type { NormalizedRecentFixture } from "@/lib/football/types";

const RESULT_CONFIG: Record<
  "W" | "D" | "L",
  { pill: string; score: string; label: string }
> = {
  W: { pill: "bg-green-4 text-background",  score: "text-green-4",  label: "Win"  },
  D: { pill: "bg-amber-4 text-background",  score: "text-amber-4",  label: "Draw" },
  L: { pill: "bg-red-4 text-background",    score: "text-red-4",    label: "Loss" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function RecentForm({ fixtures }: { fixtures: NormalizedRecentFixture[] }) {
  if (fixtures.length === 0) {
    return (
      <p className="text-fg-2 text-xs py-2 text-center">
        No recent fixtures available.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {fixtures.map((f) => {
        const cfg = RESULT_CONFIG[f.result];
        return (
          <div
            key={f.fixtureId}
            className="flex flex-col items-center gap-2 bg-bg-2 rounded-5 p-3 text-center"
          >
            {/* Result pill */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.pill}`}>
              {f.result}
            </span>

            {/* Score */}
            <span className={`text-xl font-extrabold tabular-nums leading-none ${cfg.score}`}>
              {f.goalsFor}–{f.goalsAgainst}
            </span>

            {/* Venue + opponent */}
            <div className="flex flex-col items-center gap-0.5 w-full">
              <span className="text-fg-1 text-[9px] uppercase tracking-wider">
                {f.isHome ? "Home" : "Away"}
              </span>
              <span className="text-fg-3 text-[10px] font-medium leading-tight line-clamp-2 w-full">
                {f.opponent}
              </span>
            </div>

            {/* Date */}
            <span className="text-fg-1 text-[9px] tabular-nums">
              {formatDate(f.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
