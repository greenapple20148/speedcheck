"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/mesh-wifi", label: "Overview" },
  { href: "/mesh-wifi/planner", label: "Plan" },
  { href: "/mesh-wifi/setup", label: "Set up" },
  { href: "/mesh-wifi/dead-zone-test", label: "Test rooms" },
  { href: "/mesh-wifi/troubleshooter", label: "Optimize" },
];

export function MeshSubnav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Mesh Wi-Fi" className="print:hidden mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pt-4">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium",
              active ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
