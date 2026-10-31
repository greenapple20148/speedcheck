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
          className="min-h-[44px] h-[50px] w-[220px] rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_4px_14px_-4px_rgba(11,125,105,0.45)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden />
          {statusLine}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-[14px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#218C77]"
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
      className="min-h-[44px] h-[50px] w-[220px] rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_4px_14px_-4px_rgba(11,125,105,0.45)] hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {idleLabel(phase)}
    </Button>
  );
}
