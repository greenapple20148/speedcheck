import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function RelatedActions({
  items,
  heading = "Next steps",
}: {
  items: Array<{ href: string; label: string }>;
  heading?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav className="mt-10" aria-label="Related pages">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex h-full min-h-11 items-center justify-between gap-3 rounded-[20px] border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-[var(--accent-text)]"
            >
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
