"use client";

import { cn } from "@/lib/utils";
import type { TestMode } from "@/types/speedtest";

const MODES: { id: TestMode; label: string; title: string }[] = [
  {
    id: "lightweight",
    label: "Lightweight",
    title: "Faster test with reduced data usage",
  },
  {
    id: "standard",
    label: "Standard",
    title: "More comprehensive measurement",
  },
];

interface TestModeSelectorProps {
  mode: TestMode;
  disabled?: boolean;
  onChange: (mode: TestMode) => void;
}

export function TestModeSelector({ mode, disabled, onChange }: TestModeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Test mode"
      className="inline-flex rounded-full bg-[var(--surface-subtle)] p-0.5"
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          disabled={disabled}
          title={m.title}
          onClick={() => onChange(m.id)}
          className={cn(
            "h-9 rounded-full px-3.5 text-[12px] font-medium motion-safe:transition-colors",
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
  );
}
