"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function HelpTooltip({
  label,
  text,
  align = "start",
}: {
  label: string;
  text: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#64748B] hover:text-[#10231F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B53] [[data-theme=dark]_&]:text-muted-foreground [[data-theme=dark]_&]:hover:text-foreground"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        id={id}
        role="tooltip"
        className={
          open
            ? cn(
                "absolute top-full z-20 mt-1 w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-[#E2E8E5] bg-white p-2 text-left text-xs font-normal leading-5 text-[#10231F] shadow-card [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground",
                align === "end" ? "right-0" : "left-0",
              )
            : "sr-only"
        }
      >
        {text}
      </span>
    </span>
  );
}
