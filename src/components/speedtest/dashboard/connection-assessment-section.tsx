"use client";

import type { ConnectionAssessment, QualityLevel } from "@/lib/speedtest/connection-assessment";
import { cn } from "@/lib/utils";

const LEVEL_DOT: Record<QualityLevel, string> = {
  excellent: "bg-[var(--success-text)]",
  good: "bg-primary",
  fair: "bg-warning",
  limited: "bg-destructive",
  poor: "bg-destructive",
};

interface ConnectionAssessmentSectionProps {
  assessment: ConnectionAssessment;
}

export function ConnectionAssessmentSection({
  assessment,
}: ConnectionAssessmentSectionProps) {
  return (
    <div className="border-t border-[var(--card-border)] pt-4">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
            LEVEL_DOT[assessment.qualityLevel],
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.05rem] font-semibold text-foreground sm:text-lg">
            {assessment.overallHeadline}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground sm:text-[14px]">
            {assessment.overallDescription}
          </p>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
        {assessment.activities.map((item) => (
          <li
            key={item.id}
            className="flex min-w-0 items-center justify-between gap-2 text-[13px] sm:text-[14px]"
          >
            <span className="truncate font-medium text-foreground">{item.label}</span>
            <span
              className={cn(
                "shrink-0 text-[12px] font-semibold",
                item.status === "Good" && "text-[var(--success-text)]",
                item.status === "Fair" && "text-primary",
                (item.status === "Limited" ||
                  item.status === "Unstable" ||
                  item.status === "Poor") &&
                  "text-destructive",
              )}
            >
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
