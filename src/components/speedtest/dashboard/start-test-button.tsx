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
  statusLine,
  disabled = false,
  onStart,
  onCancel,
}: StartTestButtonProps) {
  if (running) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-center text-sm font-medium text-muted-foreground">{statusLine}</p>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11 min-h-11 w-full min-w-[180px] rounded-lg border-border bg-transparent px-6 text-sm font-semibold text-foreground shadow-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
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
      className="h-11 min-h-11 w-full min-w-[180px] rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-none hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
    >
      {idleLabel(phase)}
    </Button>
  );
}
