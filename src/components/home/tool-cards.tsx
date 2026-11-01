import Link from "next/link";
import { HOME_TOOL_CARDS } from "@/content/tools";

export function HomeToolCards() {
  return (
    <section className="mx-auto mt-6 w-full max-w-[1280px] px-4" aria-labelledby="tools-heading">
      <h2 id="tools-heading" className="text-lg font-semibold text-foreground">
        More diagnostics
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {HOME_TOOL_CARDS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="panel block h-full p-4 transition-colors hover:border-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="block text-sm font-semibold text-foreground">{tool.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{tool.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
