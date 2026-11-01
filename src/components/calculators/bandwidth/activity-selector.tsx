"use client";

import { CloudUpload, Globe, Minus, MonitorPlay, Plus, Tv, Video, type LucideIcon } from "lucide-react";
import {
  BANDWIDTH_ACTIVITIES,
  QUANTITY_MAX,
  formatEstimateMbps,
  type ActivityId,
  type BandwidthActivity,
  type QuantityMap,
} from "@/lib/calculators/bandwidth";
import { cn } from "@/lib/utils";

const ACTIVITY_UI: Record<ActivityId, { icon: LucideIcon; iconClass: string; chipClass: string }> = {
  browse: { icon: Globe, iconClass: "text-[#00866A]", chipClass: "bg-[#F0FDF4]" },
  hd: { icon: Tv, iconClass: "text-[#0F766E]", chipClass: "bg-[#F0FDFA]" },
  uhd: { icon: MonitorPlay, iconClass: "text-[#0F766E]", chipClass: "bg-[#CCFBF1]" },
  call: { icon: Video, iconClass: "text-[#B45309]", chipClass: "bg-[#FFFBEB]" },
  backup: { icon: CloudUpload, iconClass: "text-[#475569]", chipClass: "bg-[#F8FAFC]" },
};

export function QuantityStepper({
  name,
  quantity,
  onStep,
}: {
  name: string;
  quantity: number;
  onStep: (direction: -1 | 1) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center rounded-xl border border-[#E2E8F0] bg-white">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center text-[#0F172A] motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
        aria-label={`Decrease ${name}`}
        disabled={quantity <= 0}
        onClick={() => onStep(-1)}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums text-[#0F172A]" aria-hidden>
        {quantity}
      </span>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center text-[#0F172A] motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
        aria-label={`Increase ${name}`}
        disabled={quantity >= QUANTITY_MAX}
        onClick={() => onStep(1)}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function ActivityRow({
  activity,
  quantity,
  onStep,
  onToggle,
}: {
  activity: BandwidthActivity;
  quantity: number;
  onStep: (direction: -1 | 1) => void;
  onToggle: (enabled: boolean) => void;
}) {
  const ui = ACTIVITY_UI[activity.id];
  const Icon = ui.icon;
  const selected = quantity > 0;
  const checkboxId = `include-${activity.id}`;
  return (
    <li
      className={cn(
        "rounded-xl border px-3 py-2 motion-safe:transition-colors motion-safe:duration-200",
        selected ? "border-[#00866A]/40 bg-[#F0FDF4]" : "border-[#E2E8F0] bg-white",
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", ui.chipClass)} aria-hidden>
          <Icon className={cn("h-4 w-4", ui.iconClass)} />
        </div>
        <div className="min-w-0 flex-1 basis-36">
          <div className="flex items-center gap-2">
            <input
              id={checkboxId}
              type="checkbox"
              className="h-4 w-4 shrink-0 accent-[#00866A]"
              checked={selected}
              onChange={(event) => onToggle(event.target.checked)}
            />
            <label htmlFor={checkboxId} className="cursor-pointer text-sm font-medium text-[#0F172A]">
              {activity.name}
            </label>
          </div>
          <p className="mt-0.5 text-xs text-[#64748B]">
            {formatEstimateMbps(activity.downloadMbps)} Mbps down · {formatEstimateMbps(activity.uploadMbps)} Mbps up each
          </p>
        </div>
        <QuantityStepper name={activity.name} quantity={quantity} onStep={onStep} />
      </div>
    </li>
  );
}

export function ActivitySelector({
  quantities,
  onStep,
  onToggle,
}: {
  quantities: QuantityMap;
  onStep: (id: ActivityId, direction: -1 | 1) => void;
  onToggle: (id: ActivityId, enabled: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="activities-heading" className="font-heading text-base font-semibold text-[#0F172A]">
          Activities
        </h2>
        <p className="text-xs text-[#64748B]">At the same time</p>
      </div>
      <ul className="mt-3 space-y-2" aria-labelledby="activities-heading">
        {BANDWIDTH_ACTIVITIES.map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            quantity={quantities[activity.id]}
            onStep={(direction) => onStep(activity.id, direction)}
            onToggle={(enabled) => onToggle(activity.id, enabled)}
          />
        ))}
      </ul>
    </div>
  );
}
