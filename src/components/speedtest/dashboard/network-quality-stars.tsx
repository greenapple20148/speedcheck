"use client";

import type { QualityScoreRow } from "@/lib/speedtest/network-quality-score";

interface NetworkQualityStarsProps {
  rows: QualityScoreRow[];
}

const CAPTION: Record<string, string> = {
  streaming: "Video playback on this connection",
  gaming: "Responsiveness for online play",
  "video-calls": "Two-way audio and video",
};

function ratingWord(stars: number): string {
  if (stars >= 4) return "Good";
  if (stars >= 3) return "Fair";
  if (stars >= 2) return "Limited";
  if (stars >= 1) return "Poor";
  return "—";
}

function statusColor(stars: number): string {
  if (stars <= 0) return "var(--text-ghost)";
  if (stars >= 4) return "var(--status-good)";
  if (stars >= 3) return "var(--status-okay)";
  return "var(--status-poor)";
}

export function NetworkQualityStars({ rows }: NetworkQualityStarsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {rows.map((row) => {
        const word = ratingWord(row.stars);
        const color = statusColor(row.stars);
        const width = `${Math.round((row.stars / row.maxStars) * 100)}%`;
        return (
          <article key={row.id} className="panel px-4 py-4 motion-safe:animate-fade-up">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <h3 className="font-sans text-[13px] font-medium tracking-normal text-muted-foreground">
                {row.label}
              </h3>
            </div>
            <p
              className="mt-3 font-heading text-[1.65rem] font-medium leading-none text-foreground"
              aria-label={`${row.label}: ${row.stars} of ${row.maxStars} stars, ${word}`}
            >
              {word}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
              {CAPTION[row.id] ?? "Scored from this test"}
            </p>
            <div
              className="mt-4 h-1 overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-valuenow={row.stars}
              aria-valuemin={0}
              aria-valuemax={row.maxStars}
              aria-label={`${row.label} score`}
            >
              <div
                className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
                style={{ width, backgroundColor: color }}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
