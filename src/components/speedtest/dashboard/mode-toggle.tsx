"use client";

import { cn } from "@/lib/utils";
import type { TestMode } from "@/types/speedtest";

const MODES: { id: TestMode; label: string }[] = [
  { id: "lightweight", label: "Lightweight" },
  { id: "standard", label: "Standard" },
];

interface ModeToggleProps {
  mode: TestMode;
  disabled?: boolean;
  onChange: (mode: TestMode) => void;
  compact?: boolean;
}

export function ModeToggle({ mode, disabled, onChange, compact }: ModeToggleProps) {
  return (
    <div className={cn(compact ? "w-auto" : "w-full max-w-[280px]")}>
      <div
        role="group"
        aria-label="Test mode"
        className="flex rounded-full bg-[var(--surface-subtle)] p-0.5"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            aria-pressed={mode === m.id}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex-1 rounded-full px-3 text-xs font-medium motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)] sm:text-sm",
              compact ? "min-h-[36px]" : "min-h-[44px]",
              mode === m.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {!compact && (
        <p className="mt-2 text-center text-[12px] leading-snug text-muted-foreground">
          Lightweight uses less data. Standard is more thorough.
        </p>
      )}
    </div>
  );
}
