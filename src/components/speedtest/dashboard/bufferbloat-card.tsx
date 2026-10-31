"use client";

import Link from "next/link";
import { Award, Gauge } from "lucide-react";
import {
  BUFFERBLOAT_GRADE_LABEL,
  BUFFERBLOAT_GRADE_SUMMARY,
} from "@/lib/speedtest/bufferbloat-config";
import type { BufferbloatGrade, TestMode } from "@/types/speedtest";
import { cn, formatMs } from "@/lib/utils";

interface BufferbloatCardProps {
  mode: TestMode;
  complete: boolean;
  grade: BufferbloatGrade | null | undefined;
  idleMs: number | null | undefined;
  loadedDownMs: number | null | undefined;
  loadedUpMs: number | null | undefined;
  onSelectStandard?: () => void;
}

export function BufferbloatCard({
  mode,
  complete,
  grade,
  idleMs,
  loadedDownMs,
  loadedUpMs,
  onSelectStandard,
}: BufferbloatCardProps) {
  if (mode === "lightweight") {
    return (
      <article className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-subtle)] px-3.5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Loaded ping (bufferbloat)
        </p>
        <p className="mt-2 text-[14px] text-foreground">
          Not measured in Lightweight mode.
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Switch to{" "}
          {onSelectStandard ? (
            <button
              type="button"
              onClick={onSelectStandard}
              className="font-semibold text-[var(--accent-teal)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)]"
            >
              Standard
            </button>
          ) : (
            <Link
              href="/#speed-test"
              className="font-semibold text-[var(--accent-teal)] hover:underline"
            >
              Standard
            </Link>
          )}{" "}
          to measure how latency changes under load.
        </p>
      </article>
    );
  }

  if (!complete || !grade || idleMs == null) {
    return null;
  }

  const detailParts: string[] = [`Idle ${formatMs(idleMs, 1)} ms`];
  if (loadedDownMs != null) {
    detailParts.push(`download ${formatMs(loadedDownMs, 1)} ms`);
  }
  if (loadedUpMs != null) {
    detailParts.push(`upload ${formatMs(loadedUpMs, 1)} ms`);
  }

  return (
    <article
      className="flex min-h-[88px] flex-col justify-center rounded-xl border border-[var(--card-border)] bg-[var(--surface-subtle)] px-3.5 py-2.5"
      aria-label={`Bufferbloat grade ${grade}. ${BUFFERBLOAT_GRADE_LABEL[grade]}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Loaded ping
      </p>
      <div className="mt-1 flex items-center gap-2">
        <Award className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
        <span
          className={cn(
            "text-[2.125rem] font-bold leading-none tabular-nums text-foreground",
          )}
        >
          {grade}
        </span>
        <Gauge className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-1 text-[13px] font-medium text-foreground">
        {BUFFERBLOAT_GRADE_SUMMARY[grade]}
      </p>
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        {BUFFERBLOAT_GRADE_LABEL[grade]} · {detailParts.join(" · ")}
      </p>
    </article>
  );
}
