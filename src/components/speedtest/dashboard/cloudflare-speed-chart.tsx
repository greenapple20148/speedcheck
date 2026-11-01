"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import type { SpeedSample } from "@/types/speedtest";

interface CloudflareSpeedChartProps {
  samples: SpeedSample[];
  kind: "download" | "upload";
  color: string;
  height?: number;
  sparkline?: boolean;
}

export function CloudflareSpeedChart({
  samples,
  kind,
  color,
  height = 100,
  sparkline = false,
}: CloudflareSpeedChartProps) {
  const filtered = samples.filter((s) => s.kind === kind);

  if (filtered.length === 0) {
    return (
      <div
        className={sparkline ? "mt-3 h-0.5 w-full rounded-full bg-muted" : "w-full rounded-sm bg-muted/30"}
        style={sparkline ? undefined : { height }}
        aria-hidden
      />
    );
  }

  const data = filtered.map((s, i) => ({ i, v: s.mbps }));
  const max = Math.max(10, ...filtered.map((s) => s.mbps));

  return (
    <div className="w-full overflow-visible" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={
            sparkline
              ? { top: 4, right: 0, left: 0, bottom: 2 }
              : { top: 6, right: 4, left: 0, bottom: 10 }
          }
        >
          {!sparkline && (
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 3"
              vertical={false}
            />
          )}
          <YAxis hide domain={[0, max * 1.15]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={sparkline ? 1.75 : 2}
            strokeLinecap="butt"
            strokeLinejoin="round"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
