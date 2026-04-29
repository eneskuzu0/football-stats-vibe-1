"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface PerformanceDataPoint {
  match: string;
  rating: number;
}

const PLACEHOLDER_DATA: PerformanceDataPoint[] = [
  { match: "GW29", rating: 7.2 },
  { match: "GW30", rating: 6.5 },
  { match: "GW31", rating: 8.1 },
  { match: "GW32", rating: 6.0 },
  { match: "GW33", rating: 7.8 },
  { match: "GW34", rating: 7.2 },
  { match: "GW35", rating: 9.1 },
  { match: "GW36", rating: 7.5 },
];

export function PerformanceChart({
  data = PLACEHOLDER_DATA,
}: {
  data?: PerformanceDataPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2c78fc" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2c78fc" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="match" hide />
        <YAxis hide domain={[5, 10]} />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "none",
            boxShadow:
              "0px 1px 3px rgba(0,0,0,0.08), 0px 0px 0px 1px rgba(0,0,0,0.04)",
            borderRadius: "6px",
            fontSize: "11px",
            padding: "4px 8px",
          }}
          labelStyle={{ color: "#999", fontSize: "10px", marginBottom: "2px" }}
          formatter={(v) => [typeof v === "number" ? v.toFixed(1) : "—", "Rating"]}
        />
        <Area
          type="monotone"
          dataKey="rating"
          stroke="#2c78fc"
          strokeWidth={1.5}
          fill="url(#ratingGrad)"
          dot={false}
          activeDot={{ r: 3, fill: "#2c78fc", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
