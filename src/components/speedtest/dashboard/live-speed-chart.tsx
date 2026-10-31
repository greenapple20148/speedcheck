"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpeedSample } from "@/types/speedtest";

interface LiveSpeedChartProps {
  samples: SpeedSample[];
  compact?: boolean;
  className?: string;
}

function chartDomain(samples: SpeedSample[]): [number, number] {
  const values = samples.map((s) => s.mbps);
  if (values.length === 0) return [0, 100];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pad = Math.max(max * 0.15, 5);
  return [Math.max(0, min - pad * 0.5), max + pad];
}

export function LiveSpeedChart({ samples, compact, className }: LiveSpeedChartProps) {
  if (samples.length === 0) return null;

  const uploadStart = samples.find((s) => s.kind === "upload")?.testElapsedSec;

  const data = samples.map((s) => ({
    t: s.testElapsedSec,
    download: s.kind === "download" ? s.mbps : undefined,
    upload: s.kind === "upload" ? s.mbps : undefined,
  }));

  const [yMin, yMax] = chartDomain(samples);
  const height = compact ? 88 : 160;

  return (
    <div className={className}>
      {!compact && (
        <p className="mb-2 text-[12px] font-medium text-muted-foreground">
          Throughput over time (download then upload)
        </p>
      )}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
              tickFormatter={(v) => `${Number(v).toFixed(1)}s`}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: "var(--chart-axis)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v) => `${Number(v).toFixed(0)}`}
              label={
                compact
                  ? undefined
                  : {
                      value: "Mbps",
                      angle: -90,
                      position: "insideLeft",
                      fill: "var(--chart-axis)",
                      fontSize: 10,
                    }
              }
            />
            {uploadStart != null && !compact && (
              <ReferenceLine
                x={uploadStart}
                stroke="var(--chart-axis)"
                strokeDasharray="4 4"
                label={{
                  value: "Upload",
                  position: "insideTopRight",
                  fill: "var(--chart-axis)",
                  fontSize: 10,
                }}
              />
            )}
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--card-border)",
                background: "var(--card)",
                color: "var(--foreground)",
                fontSize: 12,
              }}
              formatter={(value, name) =>
                typeof value === "number"
                  ? [`${value.toFixed(1)} Mbps`, name === "download" ? "Download" : "Upload"]
                  : ["—", ""]
              }
              labelFormatter={(label) => `${Number(label).toFixed(1)}s elapsed`}
            />
            <Line
              type="monotone"
              dataKey="download"
              stroke="var(--accent-teal)"
              strokeWidth={2}
              strokeLinecap="butt"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="upload"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeLinecap="butt"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
