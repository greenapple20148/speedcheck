import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

export function ToolCard({
  href,
  name,
  benefit,
  icon: Icon,
}: {
  href: string;
  name: string;
  benefit: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full min-w-0 items-start gap-3 rounded-[20px] border border-[#E2E8E5] bg-white p-4 text-[#10231F] shadow-[0_1px_2px_rgba(16,35,31,0.04)] transition hover:border-[#009B78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006B53] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF8F1] text-[#006B53] [[data-theme=dark]_&]:bg-[#134E4A]/40 [[data-theme=dark]_&]:text-[var(--accent-text)]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="font-semibold leading-5">{name}</span>
          <ChevronRight
            className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B] transition group-hover:translate-x-0.5 [[data-theme=dark]_&]:text-muted-foreground"
            aria-hidden
          />
        </span>
        <span className="mt-1 block text-sm leading-5 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{benefit}</span>
      </span>
    </Link>
  );
}
