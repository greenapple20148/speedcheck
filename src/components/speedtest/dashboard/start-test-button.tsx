"use client";

import { Button } from "@/components/ui/button";
import type { TestPhase } from "@/types/speedtest";
import { Loader2 } from "lucide-react";

interface StartTestButtonProps {
  phase: TestPhase;
  running: boolean;
  statusLine: string;
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
  onStart,
  onCancel,
}: StartTestButtonProps) {
  if (running) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          disabled
          className="min-h-[44px] h-11 min-w-[160px] rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-w-[180px]"
        >
          <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden />
          {statusLine}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-[14px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={onStart}
      className="min-h-[44px] h-11 w-full min-w-[160px] rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto sm:min-w-[180px]"
    >
      {idleLabel(phase)}
    </Button>
  );
}
