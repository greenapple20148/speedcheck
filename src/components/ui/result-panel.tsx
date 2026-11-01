import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const ResultPanel = forwardRef<
  HTMLElement,
  {
    title: string;
    titleId: string;
    children: ReactNode;
    className?: string;
  }
>(function ResultPanel({ title, titleId, children, className }, ref) {
  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      className={cn(
        "scroll-mt-24 rounded-[20px] border border-[#CDEADE] bg-[#EAF8F1] p-4 text-[#10231F] outline-none focus-visible:ring-2 focus-visible:ring-[#006B53] sm:p-5 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--surface-subtle)] [[data-theme=dark]_&]:text-foreground",
        className,
      )}
    >
      <h2 id={titleId} className="text-base font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
});
