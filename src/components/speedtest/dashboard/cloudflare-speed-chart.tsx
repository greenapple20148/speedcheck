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
}

export function CloudflareSpeedChart({
  samples,
  kind,
  color,
  height = 100,
}: CloudflareSpeedChartProps) {
  const filtered = samples.filter((s) => s.kind === kind);

  if (filtered.length === 0) {
    return (
      <div
        className="w-full rounded-sm bg-muted/30"
        style={{ height }}
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
          margin={{ top: 6, right: 4, left: 0, bottom: 10 }}
        >
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <YAxis hide domain={[0, max * 1.15]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
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
