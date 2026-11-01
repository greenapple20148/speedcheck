"use client";

import { RotateCcw } from "lucide-react";
import { HOUSEHOLD_PRESETS, type PresetId } from "@/lib/calculators/bandwidth";
import { cn } from "@/lib/utils";

export function HouseholdPresets({
  activePreset,
  onSelect,
  onReset,
}: {
  activePreset: PresetId | null;
  onSelect: (id: PresetId) => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-3 border-t border-[#E2E8F0] pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="preset-heading" className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
          Household presets
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A] motion-safe:transition-colors motion-safe:duration-200 hover:border-[#14B8A6]"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="preset-heading">
        {HOUSEHOLD_PRESETS.map((preset) => {
          const active = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              title={preset.description}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium motion-safe:transition-colors motion-safe:duration-200",
                active
                  ? "border-[#00866A] bg-[#F0FDF4] text-[#00866A]"
                  : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#14B8A6]",
              )}
              onClick={() => onSelect(preset.id)}
            >
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
