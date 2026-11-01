import type { KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WizardStepper({
  steps,
  current,
  onStep,
  label = "Setup steps",
}: {
  steps: readonly string[];
  current: number;
  onStep: (index: number) => void;
  label?: string;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? Math.min(steps.length - 1, index + 1)
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? Math.max(0, index - 1)
          : null;
    if (next == null || next === index) return;
    event.preventDefault();
    onStep(next);
    const buttons = event.currentTarget.closest("ol")?.querySelectorAll("button");
    buttons?.[next]?.focus();
  }

  return (
    <ol className="grid grid-cols-4 gap-1.5 sm:gap-2" aria-label={label}>
      {steps.map((name, index) => {
        const completed = index < current;
        const active = index === current;
        return (
          <li key={name} className="min-w-0">
            <button
              type="button"
              className="flex w-full min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B53]"
              aria-current={active ? "step" : undefined}
              aria-label={`${index + 1}. ${name}${completed ? ", completed" : ""}`}
              onClick={() => onStep(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                  active && "border-[#006B53] bg-[#006B53] text-white",
                  completed && "border-[#009B78] bg-[#EAF8F1] text-[#006B53] [[data-theme=dark]_&]:border-[var(--accent-text)] [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-[var(--accent-text)]",
                  !active && !completed && "border-[#E2E8E5] bg-white text-[#64748B] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-muted-foreground",
                )}
                aria-hidden
              >
                {completed ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "w-full truncate text-center text-[11px] font-semibold sm:text-xs",
                  active ? "text-[#10231F] [[data-theme=dark]_&]:text-foreground" : "text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground",
                )}
              >
                {name}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
