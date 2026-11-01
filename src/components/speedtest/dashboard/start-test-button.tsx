"use client";

import { Button } from "@/components/ui/button";
import type { TestPhase } from "@/types/speedtest";
import { Loader2 } from "lucide-react";

interface StartTestButtonProps {
  phase: TestPhase;
  running: boolean;
  statusLine: string;
  disabled?: boolean;
  onStart: () => void;
  onCancel: () => void;
}

function idleLabel(phase: TestPhase): string {
  if (phase === "error") return "Retry Test";
  if (phase === "complete" || phase === "cancelled") return "Test Again";
  return "Start Speed Test";
}

export function StartTestButton({
  phase,
  running,
  disabled = false,
  onStart,
  onCancel,
}: StartTestButtonProps) {
  if (running) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11 min-h-11 w-full rounded-xl border-[var(--sd-border,var(--border))] bg-transparent px-6 text-sm font-semibold text-[var(--sd-text,var(--foreground))] shadow-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#086B50] focus-visible:ring-offset-2"
        >
          <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
          Stop
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={onStart}
      disabled={disabled}
      className="h-11 min-h-11 w-full rounded-xl bg-[#086B50] px-6 text-sm font-semibold text-white shadow-none hover:bg-[#064E3B] focus-visible:ring-2 focus-visible:ring-[#086B50] focus-visible:ring-offset-2"
    >
      {idleLabel(phase)}
    </Button>
  );
}
