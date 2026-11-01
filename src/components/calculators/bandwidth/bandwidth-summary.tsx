"use client";

import type { ReactNode } from "react";
import { Download, Upload } from "lucide-react";
import { formatEstimateMbps } from "@/lib/calculators/bandwidth";

export function BandwidthSummary({
  totalDownloadMbps,
  totalUploadMbps,
}: {
  totalDownloadMbps: number;
  totalUploadMbps: number;
}) {
  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4" aria-labelledby="estimate-heading">
      <h2 id="estimate-heading" className="font-heading text-base font-semibold text-[#0F172A]">
        Estimated Bandwidth Need
      </h2>
      <p className="mt-1 text-xs text-[#64748B]">Planning total if these activities run together.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <MetricCard
          id="download-required-label"
          label="Download Required"
          icon={<Download className="h-4 w-4" aria-hidden />}
          mbps={totalDownloadMbps}
        />
        <MetricCard
          id="upload-required-label"
          label="Upload Required"
          icon={<Upload className="h-4 w-4" aria-hidden />}
          mbps={totalUploadMbps}
        />
      </div>
    </section>
  );
}

function MetricCard({
  id,
  label,
  icon,
  mbps,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  mbps: number;
}) {
  const amount = formatEstimateMbps(mbps);
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3" aria-labelledby={id}>
      <div className="flex items-center gap-2 text-[#00866A]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0FDF4]">{icon}</span>
        <h3 id={id} className="text-xs font-medium text-[#64748B]">
          {label}
        </h3>
      </div>
      <p className="mt-2 font-heading text-[1.75rem] font-semibold leading-none tracking-tight text-[#0F172A] tabular-nums">
        {amount}
        <span className="ml-1.5 text-sm font-medium text-[#64748B]"> Mbps</span>
      </p>
    </section>
  );
}
