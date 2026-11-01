"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Binary,
  Braces,
  Clock3,
  FileCode,
  FileJson,
  FileSpreadsheet,
  GitCompare,
  KeyRound,
  Link2,
  ListTree,
  Regex,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL, type DevCategory } from "@/lib/dev-tools/catalog";
import { cn } from "@/lib/utils";

export interface HubCard {
  id: string;
  name: string;
  href: string;
  description: string;
  summary: string;
  category: DevCategory;
}

const ICONS: Record<string, LucideIcon> = {
  "json-formatter": FileJson,
  "json-diff": GitCompare,
  "json-to-csv": FileSpreadsheet,
  "json-to-yaml": FileCode,
  jsonpath: ListTree,
  "json-schema": ShieldCheck,
  base64: Binary,
  "jwt-decoder": KeyRound,
  "url-encoder": Link2,
  "regex-tester": Regex,
  "unix-timestamp": Clock3,
};

export function DeveloperHub({ tools }: { tools: HubCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tools.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!needle) return true;
      const haystack = `${tool.name} ${tool.summary} ${tool.description} ${CATEGORY_LABEL[tool.category]}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [category, query, tools]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search developer tools</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dt-muted)]" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search developer tools (e.g. JSON, Base64, JWT...)"
          className="h-11 w-full rounded-full border border-[var(--dt-border)] bg-[var(--dt-card)] pl-10 pr-4 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
        />
      </label>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categories">
        {CATEGORIES.map((item) => {
          const selected = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(item.id)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dt-accent)]",
                selected
                  ? "bg-[var(--dt-primary)] text-[var(--dt-on-primary)]"
                  : "border border-[var(--dt-border)] bg-[var(--dt-card)] text-[var(--dt-text)] hover:bg-[var(--dt-pale)]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--dt-muted)]" role="status">
          No tools match that search.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((tool) => {
            const Icon = ICONS[tool.id] ?? Braces;
            return (
              <li key={tool.href} className="min-w-0">
                <article className="flex h-full flex-col rounded-2xl border border-[var(--dt-border)] bg-[var(--dt-card)] p-4 shadow-[0_1px_2px_rgba(16,35,31,0.04)]">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--dt-pale)] text-[var(--dt-primary)]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-heading text-base font-semibold leading-5 text-[var(--dt-text)]">{tool.name}</h2>
                      <p className="mt-1 text-sm leading-5 text-[var(--dt-muted)]">{tool.summary}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--dt-muted)]">
                      {CATEGORY_LABEL[tool.category]}
                    </p>
                    <Link
                      href={tool.href}
                      aria-label={`Open ${tool.name}`}
                      className="inline-flex h-9 items-center rounded-full bg-[var(--dt-primary)] px-3 text-sm font-semibold text-[var(--dt-on-primary)] hover:bg-[var(--dt-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dt-accent)]"
                    >
                      Open Tool
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
