import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function ToolPageHero({
  title,
  description,
  chips = [],
  illustration,
}: {
  title: string;
  description: string;
  chips?: Array<{ label: string; icon: LucideIcon }>;
  illustration?: ReactNode;
}) {
  return (
    <header className="mb-5 grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
      <div className="min-w-0">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#10231F] sm:text-4xl [[data-theme=dark]_&]:text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base [[data-theme=dark]_&]:text-muted-foreground">
          {description}
        </p>
        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.label}>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#E2E8E5] bg-white px-3 py-1 text-xs font-medium text-[#10231F] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground">
                  <chip.icon className="h-3.5 w-3.5 shrink-0 text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]" aria-hidden />
                  {chip.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {illustration ? (
        <div className="hidden justify-end sm:flex" aria-hidden>
          {illustration}
        </div>
      ) : null}
    </header>
  );
}
