import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd } from "@/lib/seo/structured-data";

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbListJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
    </>
  );
}
