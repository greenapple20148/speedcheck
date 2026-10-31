"use client";

import { Star } from "lucide-react";
import type { QualityScoreRow } from "@/lib/speedtest/network-quality-score";

interface NetworkQualityStarsProps {
  rows: QualityScoreRow[];
}

export function NetworkQualityStars({ rows }: NetworkQualityStarsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.id}>
          <p className="text-[12px] font-medium text-white/50">{row.label}</p>
          <div className="mt-1 flex items-center gap-0.5" aria-label={`${row.label}: ${row.stars} of ${row.maxStars} stars`}>
            {Array.from({ length: row.maxStars }, (_, i) => (
              <Star
                key={i}
                className={
                  i < row.stars
                    ? "h-4 w-4 fill-[#f38020] text-[#f38020]"
                    : "h-4 w-4 text-white/15"
                }
                aria-hidden
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
