"use client";

import type { ConnectionTag } from "@/types/speedtest";
import { cn } from "@/lib/utils";

interface ConnectionTagToggleProps {
  value: ConnectionTag | null;
  onChange: (tag: ConnectionTag) => void;
  visible: boolean;
}

export function ConnectionTagToggle({ value, onChange, visible }: ConnectionTagToggleProps) {
  if (!visible) return null;

  const options: { id: ConnectionTag; label: string }[] = [
    { id: "wifi", label: "Wi‑Fi" },
    { id: "wired", label: "Wired" },
  ];

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-subtle)] px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Connection type
      </p>
      <div
        role="group"
        aria-label="Connection type for this test"
        className="mt-2 flex gap-2"
      >
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "min-h-[44px] flex-1 rounded-full border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] focus-visible:ring-offset-2",
              value === o.id
                ? "border-[var(--accent-teal)] bg-card text-foreground shadow-sm"
                : "border-[var(--card-border)] text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
